<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import ExperimentList from './expList.vue'
import { getExperimentsByTagApi, EXP_TAGS } from '@/api/experiments'
import { getStudentReservationsApi } from '@/api/stu/index'

const router = useRouter()

// 搜索关键字
const searchKeyword = ref('')

// 当前激活的标签
const activeTag = ref('all')

// 加载状态
const loading = ref(false)

// 所有实验数据
const experiments = ref([])

// 筛选标签: 声学 / 光学 / 热学 / 电学
const filterTags = [
  { label: '全部', value: 'all' },
  ...EXP_TAGS.map(tag => ({ label: tag, value: tag }))
]

// 当前登录用户(学生进入实验前须校验预约)
const loginUser = JSON.parse(localStorage.getItem('loginUser') || 'null')
const isStudent = loginUser?.roleName === 'student'
const stuId = loginUser?.id || ''

// 计算属性：按标签与关键词筛选后的实验
const filteredExperiments = computed(() => {
  let result = [...experiments.value]

  // 按标签筛选
  if (activeTag.value !== 'all') {
    result = result.filter(item => (item.tags || []).includes(activeTag.value))
  }

  // 按关键词搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    result = result.filter(item =>
      item.title.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  return result
})

// 初始化加载数据: 从后端查询全部实验资源, 并映射为卡片组件所需形状
const loadExperiments = async () => {
  loading.value = true
  try {
    const res = await getExperimentsByTagApi('')
    // 后端字段(expId/title/tag/content/url/likes) → 卡片所需(tags数组/description等)
    experiments.value = (res?.data || []).map(item => ({
      id: item.expId,
      title: item.title || '',
      description: item.content || '',
      coverImage: item.coverImage || '',
      tags: item.tag ? [item.tag] : [],
      duration: '',
      difficulty: '',
      url: item.url || '',
      likes: item.likes ?? 0
    }))
  } catch (error) {
    console.error('后端查询实验资源失败:', error)
    ElMessage.error('查询实验资源失败')
    experiments.value = []
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  // filteredExperiments 计算属性实时过滤
}

// 处理标签点击: 计算属性按标签实时筛选
const handleTagClick = (tagValue) => {
  activeTag.value = tagValue
}

// 处理卡片点击: 跳转到实验详情页
// 学生进入实验前须有有效预约, 否则提示"请先预约！"
const handleCardClick = async (experiment) => {
  if (isStudent) {
    try {
      const res = await getStudentReservationsApi(stuId)
      if (!res?.data?.length) {
        ElMessage.warning('请先预约！')
        return
      }
    } catch (e) {
      console.error('查询预约信息失败:', e)
    }
  }
  // 根据当前路由前缀跳转对应角色的实验详情页, 如 /stu/exp -> /stu/exp/1
  const base = router.currentRoute.value.path
  router.push(`${base}/${experiment.id}`)
}

// 生命周期
onMounted(() => {
  loadExperiments()
})
</script>

<template>
  <div class="experiment-view">
    <!-- 页面标题和描述 -->
    <div class="page-header">
      <h1 class="page-title">Unity物理实验资源中心</h1>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索实验资源..."
          class="search-input"
          clearable
          @input="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="filter-tags">
        <el-tag
          v-for="tag in filterTags"
          :key="tag.value"
          :type="activeTag === tag.value ? 'primary' : 'info'"
          class="tag-item"
          @click="handleTagClick(tag.value)"
        >
          {{ tag.label }}
        </el-tag>
      </div>
    </div>

    <!-- 实验资源列表 -->
    <ExperimentList
      :experiments="filteredExperiments"
      :loading="loading"
      @card-click="handleCardClick"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && filteredExperiments.length === 0" class="empty-state">
      <el-empty description="暂无相关实验资源" />
    </div>
  </div>
</template>

<style scoped>
.experiment-view {
  max-width: 100%;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* 页面标题区域 */
.page-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 12px;
}

/* 筛选区域 */
.filter-section {
  background: white;
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.search-box {
  max-width: 600px;
  margin: 0 auto 20px;
}

.search-input {
  border-radius: 50px;
}

.search-input :deep(.el-input__inner) {
  border-radius: 50px;
  padding-left: 40px;
  height: 48px;
  font-size: 16px;
}

.filter-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-item {
  cursor: pointer;
  padding: 8px 20px;
  font-size: 14px;
  transition: all 0.3s ease;
  border-radius: 20px;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

/* 加载和空状态 */
.loading-container {
  padding: 40px;
  background: white;
  border-radius: 16px;
}

.empty-state {
  background: white;
  border-radius: 16px;
  padding: 60px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .experiment-view {
    padding: 16px;
  }

  .page-title {
    font-size: 1.8rem;
  }

  .filter-section {
    padding: 16px;
  }

  .search-input :deep(.el-input__inner) {
    height: 44px;
  }
}
</style>
