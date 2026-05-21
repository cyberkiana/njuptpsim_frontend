<!-- 更新后的教师实验发布页面，使用新的API格式 -->
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTeacherTasksApi, publishTaskApi, getExperimentsApi, deleteTaskApi } from '@/api/tea/task'
import { getTeacherClazzesApi } from '@/api/tea/clazz'
import { useRouter } from 'vue-router'


const router = useRouter()
// 从localStorage获取登录用户信息
const getLoginUser = () => {
  const loginUserStr = localStorage.getItem('loginUser')
  if (loginUserStr) {
    try {
      return JSON.parse(loginUserStr)
    } catch (e) {
      console.error('解析登录信息失败', e)
      return null
    }
  }
  return null
}

const loginUser = getLoginUser()

// 用户信息
const teaName = ref(loginUser?.name || '') 
const teaId = ref(loginUser?.id || '') 

// 如果ID为空，跳转到登录页
if (!teaId.value) {
  ElMessage.error('请先登录')
  router.push('/login')
}

// 班级选项数据
const classOptions = ref([])

// 实验选项数据
const experimentOptions = ref([])

// 已发布的实验任务列表
const publishedTasks = ref([])

// 加载状态
const loading = ref({
  classes: false,
  experiments: false,
  tasks: false,
  publish: false,
  delete: false
})

// 获取班级列表
const fetchClasses = async () => {
  loading.value.classes = true
  try {
    const data = await getTeacherClazzesApi(teaId.value)
    // 假设后端返回 [{ id, name, studentCount }]
    classOptions.value = data.data.map(item => ({
      value: item.id,
      label: `${item.name} (共${item.studentCount}人)`,
      studentCount: item.studentCount
    }))
  } catch (error) {
    console.error('获取班级列表失败:', error)
    ElMessage.error('获取班级列表失败')
  } finally {
    loading.value.classes = false
  }
}

// 获取实验列表
const fetchExperiments = async () => {
  loading.value.experiments = true
  try {
    const data = await getExperimentsApi()
    // 后端返回 [{ id, title }]
    experimentOptions.value = data.data.map(item => ({
      value: item.id,
      label: item.title
    }))
  } catch (error) {
    console.error('获取实验列表失败:', error)
    ElMessage.error('获取实验列表失败')
  } finally {
    loading.value.experiments = false
  }
}

// 获取已发布任务列表
const fetchTasks = async () => {
  loading.value.tasks = true
  try {
    const data = await getTeacherTasksApi(teaId.value)
    // 后端返回 [{ id, clazzId, expId, startDate, endDate, completeCount, totalCount }]
    // 需要补充实验名称和班级名称用于显示
    publishedTasks.value = data.data.map(item => {
      // 查找对应的实验名称
      const exp = experimentOptions.value.find(e => e.value === item.expId)
      // 查找对应的班级名称
      //const clazz = classOptions.value.find(c => c.value === item.clazzId)
      
      return {
        ...item,
        title: exp ? exp.label : '未知实验',
        //className: clazz ? clazz.label.split(' (共')[0] : '未知班级', // 去除人数部分
        // 确保字段名一致
        id: item.id,
        clazzId: item.clazzId,
        expId: item.expId,
        startDate: item.startDate,
        endDate: item.endDate,
        completedCount: item.completeCount,
        totalStudents: item.totalCount
      }
    })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value.tasks = false
  }
}

// 删除实验任务
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该实验任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value.delete = true
    await deleteTaskApi(teaId.value, id)
    ElMessage.success('删除成功')
    await fetchTasks()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除实验失败:', error)
      ElMessage.error('删除失败')
    }
  } finally {
    loading.value.delete = false
  }
}

// 计算完成百分比
const getCompletionPercentage = (completed, total) => {
  if (!total) return 0
  return Math.round((completed / total) * 100)
}

// 初始化加载数据
onMounted(async () => {
  // 并行加载班级和实验列表
  await Promise.all([fetchExperiments()])
  // 加载任务列表（需要依赖班级和实验列表来显示名称）
  await fetchTasks()
})
</script>

<template>
  <div class="experiment-container">
    <!-- 已发布实验列表卡片 -->
    <el-card class="list-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><List /></el-icon>
          <span>已发布实验 ({{ publishedTasks.length }})</span>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-loading="loading.tasks" element-loading-text="加载中...">
        <!-- 实验列表表格 -->
        <el-table :data="publishedTasks" stripe style="width: 100%">
          <el-table-column prop="clazzId" label="班级ID" width="100" />
          <el-table-column prop="title" label="实验名称" min-width="160" />
          <el-table-column prop="startDate" label="开始日期" width="120" />
          <el-table-column prop="endDate" label="结束日期" width="120" />
          <el-table-column label="完成进度" min-width="160">
            <template #default="{ row }">
              <div class="progress-info">
                <span>{{ row.completedCount }}/{{ row.totalCount }}</span>
                <el-progress 
                  :percentage="getCompletionPercentage(row.completedCount, row.totalCount)" 
                  :status="row.completedCount === row.totalCount ? 'success' : ''"
                  :stroke-width="8"
                  style="width: 100px; margin-left: 8px;"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="danger" 
                size="small" 
                @click="handleDelete(row.id)"
                :loading="loading.delete"
                :icon="Delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空状态展示 -->
        <el-empty 
          v-if="publishedTasks.length === 0 && !loading.tasks" 
          description="暂无已发布的实验" 
          :image-size="200"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.experiment-container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-header .el-icon {
  font-size: 20px;
  color: #409eff;
}

/* 表单样式优化 */
:deep(.el-form-item) {
  margin-bottom: 22px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #333;
  font-weight: 600;
}

:deep(.el-table td) {
  color: #606266;
}

/* 进度信息样式 */
.progress-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-info span {
  min-width: 65px;
  font-size: 13px;
  color: #606266;
}

/* 空状态样式 */
:deep(.el-empty) {
  padding: 40px 0;
}

/* 按钮间距 */
:deep(.el-button + .el-button) {
  margin-left: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .experiment-container {
    padding: 10px;
  }
  
  :deep(.el-table) {
    font-size: 12px;
  }
  
  :deep(.el-button--small) {
    padding: 4px 8px;
    font-size: 12px;
  }
  
  .progress-info {
    flex-direction: column;
    align-items: flex-start;
  }
  
  :deep(.el-progress) {
    margin-left: 0 !important;
    margin-top: 4px;
  }
}
</style>