<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Refresh } from '@element-plus/icons-vue'
import {
  getExperimentsByTagApi,
} from '@/api/experiments'
import {
  getCommentsApi,
  getRepliesApi,
  deleteCommentAdminApi,
  deleteReplyAdminApi,
  searchCommentsAdminApi,
} from '@/api/experiment'

defineOptions({ name: 'CommentManageIndex' })

// 实验下拉
const experiments = ref([])
const selectedExpId = ref(null)

// 评论数据
const comments = ref([])
const loading = ref(false)

// 按时间筛选(选某一天, 查该日 00:00 ~ 次日 00:00 的评论与回复)
const filterDate = ref('')
const hitIds = ref(null)   // null=未筛选; 数组=命中的主评论id
const hitCount = ref(0)

// 加载实验下拉
const loadExperiments = async () => {
  try {
    const res = await getExperimentsByTagApi('')
    experiments.value = res?.data || []
  } catch (e) {
    console.error('获取实验列表失败:', e)
  }
}

// 加载所选实验的评论与回复
const loadComments = async () => {
  if (!selectedExpId.value) return
  loading.value = true
  try {
    const res = await getCommentsApi(selectedExpId.value)
    const list = res?.data || []
    // 并行拉取各评论的回复, 避免串行N+1逐条等待
    await Promise.all(list.map(async (c) => {
      try {
        const r = await getRepliesApi(selectedExpId.value, c.id)
        c.replies = r?.data || []
      } catch (e) {
        c.replies = []
      }
    }))
    // 默认按时间降序, 回复按时间升序
    list.sort((a, b) => new Date(b.time) - new Date(a.time))
    for (const c of list) {
      c.replies = [...(c.replies || [])].sort((a, b) => new Date(a.time) - new Date(b.time))
    }
    comments.value = list
  } catch (e) {
    console.error('获取评论失败:', e)
    comments.value = []
  } finally {
    loading.value = false
  }
  applyTimeFilter()
}

// 按时间筛选: 调后端索引查询, 返回命中的主评论id
const applyTimeFilter = async () => {
  if (!filterDate.value || !selectedExpId.value) {
    hitIds.value = null
    hitCount.value = 0
    return
  }
  try {
    const start = `${filterDate.value} 00:00:00`
    const end = `${nextDay(filterDate.value)} 00:00:00`
    const res = await searchCommentsAdminApi(selectedExpId.value, start, end)
    hitIds.value = res?.data || []
    hitCount.value = hitIds.value.length
  } catch (e) {
    console.error('时间筛选失败:', e)
    hitIds.value = null
    hitCount.value = 0
  }
}

const nextDay = (dateStr) => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 供模板使用的显示列表: 未筛选时显示全部, 筛选后只显示命中的主评论
const visibleComments = () => {
  if (!hitIds.value) return comments.value
  return comments.value.filter(c => hitIds.value.includes(c.id))
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 删除评论
const handleDeleteComment = (row) => {
  ElMessageBox.confirm(`确认删除该评论吗？（${row.userName}：${row.content}）`, '提示',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    const res = await deleteCommentAdminApi(row.id)
    if (res && res.code) {
      ElMessage.success('评论已删除')
      await loadComments()
    } else {
      ElMessage.error(res?.msg || '删除失败')
    }
  }).catch(() => {})
}

// 删除回复
const handleDeleteReply = (comment, reply) => {
  ElMessageBox.confirm(`确认删除该回复吗？（${reply.userName}：${reply.content}）`, '提示',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    const res = await deleteReplyAdminApi(comment.id, reply.id)
    if (res && res.code) {
      ElMessage.success('回复已删除')
      await loadComments()
    } else {
      ElMessage.error(res?.msg || '删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadExperiments()
})
</script>

<template>
  <div>
    <h1>评论管理</h1>
    <div class="container">
      <el-form inline>
        <el-form-item label="选择实验">
          <el-select
            v-model="selectedExpId"
            placeholder="请选择实验"
            style="width: 260px"
            filterable
            @change="loadComments"
          >
            <el-option
              v-for="exp in experiments"
              :key="exp.expId"
              :label="exp.title"
              :value="exp.expId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="按时间查找">
          <el-date-picker
            v-model="filterDate"
            type="date"
            placeholder="选择日期(可选)"
            value-format="YYYY-MM-DD"
            style="width: 160px"
            :clearable="true"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="!selectedExpId || !filterDate" @click="applyTimeFilter">查找</el-button>
          <el-button :disabled="!filterDate" @click="() => { filterDate = ''; hitIds = null; hitCount = 0 }">清除筛选</el-button>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" :disabled="!selectedExpId" @click="loadComments">刷新</el-button>
        </el-form-item>
      </el-form>
      <el-alert
        v-if="hitIds"
        type="success"
        :closable="false"
        show-icon
        style="margin-bottom: 12px;"
        :title="`按 ${filterDate} 时间筛选：命中 ${hitCount} 条（含评论命中的回复），共 ${comments.length} 条评论`"
      />
    </div>

    <div class="container" v-loading="loading">
      <el-empty v-if="!selectedExpId" description="请先选择一个实验" />
      <el-empty v-else-if="comments.length === 0" description="该实验暂无评论" />

      <el-card v-for="c in visibleComments()" :key="c.id" shadow="hover" class="comment-card">
        <div class="comment-head">
          <span class="comment-user">{{ c.userName }}</span>
          <span class="comment-time">{{ formatTime(c.time) }}</span>
          <span class="comment-likes">❤️ {{ c.likes }}</span>
          <el-button type="danger" size="small" :icon="Delete" @click="handleDeleteComment(c)">删除评论</el-button>
        </div>
        <div class="comment-content">{{ c.content }}</div>

        <div v-if="c.replies && c.replies.length" class="reply-list">
          <div v-for="r in c.replies" :key="r.id" class="reply-item">
            <span class="comment-user">{{ r.userName }}</span>
            <span v-if="r.repliedUserName" class="reply-tip">回复 @{{ r.repliedUserName }}</span>
            <span class="comment-content reply-content">{{ r.content }}</span>
            <span class="comment-time">{{ formatTime(r.time) }}</span>
            <el-button type="danger" size="small" link @click="handleDeleteReply(c, r)">删除回复</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.container {
  margin: 15px 0px;
}
.comment-card {
  margin-bottom: 12px;
}
.comment-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}
.comment-head .el-button {
  margin-left: auto;
}
.comment-user {
  font-weight: 600;
  color: #303133;
}
.comment-time {
  color: #909399;
  font-size: 12px;
}
.comment-likes {
  color: #f56c6c;
  font-size: 13px;
}
.comment-content {
  color: #606266;
  line-height: 1.6;
}
.reply-list {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 8px;
}
.reply-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed #ebeef5;
}
.reply-item:last-child {
  border-bottom: none;
}
.reply-content {
  flex: 1;
}
.reply-tip {
  color: #909399;
  font-size: 12px;
}
</style>
