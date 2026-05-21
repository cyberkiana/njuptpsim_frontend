<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import ExperimentList from './expList.vue'
import { mockExperiments } from '@/api/experiments'

// 搜索关键字
const searchKeyword = ref('')

// 当前激活的标签
const activeTag = ref('all')

// 加载状态
const loading = ref(false)

// 所有实验数据
const experiments = ref([])

// 筛选标签
const filterTags = [
  { label: '全部', value: 'all' },
  { label: '物理实验', value: 'physics' },
  { label: '电学实验', value: 'chemistry' },
  { label: '声学实验', value: 'biology' },
  { label: '光学实验', value: 'programming' },
  { label: '热学实验', value: 'vr' },
  { label: '量子科学实验', value: 'ar' },
]

// 计算属性：筛选后的实验
const filteredExperiments = computed(() => {
  let result = [...experiments.value]
  
  // 按标签筛选
  if (activeTag.value !== 'all') {
    result = result.filter(item => 
      item.tags.some(tag => tag === activeTag.value)
    )
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

// 初始化加载数据
const loadExperiments = async () => {
  loading.value = true
  try {
    // 实际项目中这里调用API
    // const response = await getExperiments()
    // experiments.value = response.data
    
    // 使用模拟数据
    await new Promise(resolve => setTimeout(resolve, 800))
    experiments.value = mockExperiments
  } catch (error) {
    console.error('加载实验资源失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  // 可以添加防抖处理
  console.log('搜索关键词:', searchKeyword.value)
}

// 处理标签点击
const handleTagClick = (tagValue) => {
  activeTag.value = tagValue
}

// 处理卡片点击
const handleCardClick = (experiment) => {
  console.log('点击实验:', experiment)
  launchUnityExperiment(experiment)
}

// 启动Unity实验
const launchUnityExperiment = (experiment) => {
  // 实际项目中这里调用Unity启动逻辑
  console.log('启动Unity实验:', experiment.unityPath)
  
  // 示例：在新窗口打开Unity WebGL构建
  if (experiment.unityWebUrl) {
    window.open(experiment.unityWebUrl, '_blank')
  } else if (experiment.unityLocalPath) {
    // 启动本地Unity应用
    window.location.href = `unitylaunch://${experiment.unityLocalPath}`
  }
  
  // 可以添加加载提示
  ElMessage.success(`正在启动 ${experiment.title}...`)
}


const experimentStore = ref([
  {
    id: 1,
    name: '量子纠缠实验',
    description: '研究量子态远程关联特性，探索量子通信新可能',
    leader: '张教授',
    status: '进行中',
    createDate: '2025-01-15'
  },
  {
    id: 2,
    name: '基因编辑实验',
    description: 'CRISPR-Cas9 基因敲除技术在小鼠模型上的应用',
    leader: '李博士',
    status: '筹备中',
    createDate: '2025-02-20'
  },
  {
    id: 3,
    name: '神经网络训练',
    description: '大规模图像分类模型训练与优化',
    leader: '王研究员',
    status: '已结束',
    createDate: '2024-11-10'
  },
  {
    id: 4,
    name: '高温超导材料研究',
    description: '新型铁基超导材料的合成与表征',
    leader: '陈教授',
    status: '进行中',
    createDate: '2025-03-05'
  }
])
// 对话框显隐控制
const showListDialog = ref(false)
const showEditDialog = ref(false)

// 选中的实验
const selectedExperiment = ref(null)

// 可编辑的实验副本
const editableExperiment = reactive({
  id: null,
  name: '',
  description: '',
  leader: '',
  status: '进行中',
  createDate: ''
})

// 表单错误信息
const formErrors = reactive({
  name: '',
  description: '',
  leader: '',
  status: '',
  createDate: ''
})

// 保存loading状态
const saving = ref(false)

// 打开编辑流程：展示实验列表对话框
const openEditForm = () => {
  showListDialog.value = true
}

// 用户选择某个实验
const selectExperiment = (exp) => {
  // 填充可编辑副本
  Object.assign(editableExperiment, { ...exp })
  selectedExperiment.value = exp
  
  // 关闭列表对话框，打开编辑对话框
  showListDialog.value = false
  showEditDialog.value = true
  
  // 清空之前的错误提示
  clearErrors()
}

// 取消选择
const cancelSelect = () => {
  showListDialog.value = false
}

// 表单验证
const validateForm = () => {
  let isValid = true
  clearErrors()
  
  if (!editableExperiment.name?.trim()) {
    formErrors.name = '实验名称不能为空'
    isValid = false
  }
  
  if (!editableExperiment.description?.trim()) {
    formErrors.description = '实验描述不能为空'
    isValid = false
  }
  
  if (!editableExperiment.leader?.trim()) {
    formErrors.leader = '负责人不能为空'
    isValid = false
  }
  
  if (!editableExperiment.status) {
    formErrors.status = '请选择状态'
    isValid = false
  }
  
  if (!editableExperiment.createDate) {
    formErrors.createDate = '请选择创建日期'
    isValid = false
  }
  
  return isValid
}

// 清空错误信息
const clearErrors = () => {
  formErrors.name = ''
  formErrors.description = ''
  formErrors.leader = ''
  formErrors.status = ''
  formErrors.createDate = ''
}

// 保存实验
const saveExperiment = async () => {
  if (!validateForm()) {
    ElMessage.warning('请完善表单信息')
    return
  }
  
  saving.value = true
  
  try {
    // 模拟异步保存
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 更新原实验数据
    if (selectedExperiment.value) {
      const index = experimentStore.value.findIndex(
        (item) => item.id === selectedExperiment.value.id
      )
      if (index !== -1) {
        experimentStore.value[index] = { ...editableExperiment }
        selectedExperiment.value = experimentStore.value[index]
      }
    }
    
    ElMessage.success(`实验 "${editableExperiment.name}" 保存成功`)
    closeEdit()
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 关闭编辑对话框
const closeEdit = () => {
  showEditDialog.value = false
  selectedExperiment.value = null
  // 可选：清空编辑副本
  // Object.assign(editableExperiment, { 
  //   id: null, 
  //   name: '', 
  //   description: '', 
  //   leader: '', 
  //   status: '进行中', 
  //   createDate: '' 
  // })
  clearErrors()
}

// 获取状态标签样式
const getStatusClass = (status) => {
  return {
    'status-ongoing': status === '进行中',
    'status-ended': status === '已结束',
    'status-preparing': status === '筹备中'
  }
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
      <el-button class="button">新增实验</el-button>
      <el-button class="button" @click="openEditForm">修改实验</el-button> 
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

  <!-- 实验列表选择对话框 -->
    <el-dialog v-model="showListDialog" title="选择实验" width="400px" destroy-on-close>
      <div class="dialog-content">
        <ul class="exp-list">
          <li
            v-for="exp in experimentStore"
            :key="exp.id"
            @click="selectExperiment(exp)"
            class="exp-item"
          >
            <span class="exp-name">{{ exp.name }}</span>
          </li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="cancelSelect">取消</el-button>
      </template>
    </el-dialog>

       <!-- 独立编辑表格对话框 -->
    <el-dialog 
      v-model="showEditDialog" 
      :title="'编辑实验 - ' + (selectedExperiment?.name || '')" 
      width="600px" 
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="dialog-content">
        <!-- 独立的编辑表格 -->
        <el-form :model="editableExperiment" label-width="80px" label-position="left">
          <el-table :data="[editableExperiment]" border style="width: 100%" :show-header="true">
            <el-table-column prop="name" label="实验名称" min-width="120">
              <template #default="{ row }">
                <el-form-item prop="name" :error="formErrors.name" class="table-form-item">
                  <el-input v-model="row.name" placeholder="输入实验名称" />
                </el-form-item>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="180">
              <template #default="{ row }">
                <el-form-item prop="description" :error="formErrors.description" class="table-form-item">
                  <el-input v-model="row.description" type="textarea" :rows="2" placeholder="输入实验描述" />
                </el-form-item>
              </template>
            </el-table-column>
          </el-table>

          <el-divider />

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="负责人" prop="leader" :error="formErrors.leader">
                <el-input v-model="editableExperiment.leader" placeholder="负责人姓名" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="创建日期" prop="createDate" :error="formErrors.createDate">
                <el-date-picker
                  v-model="editableExperiment.createDate"
                  type="date"
                  placeholder="选择日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="实验ID" prop="id">
                <el-input v-model="editableExperiment.id" disabled placeholder="自动生成" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="closeEdit">取消</el-button>
        <el-button type="primary" @click="saveExperiment" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
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

.button {
  color: #409EFF;
  font-size: 16;
  background-color: white;
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

.experiment-editor {
  font-family: 'Arial', sans-serif;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background-color: #f5f7fa;
}

.open-btn {
  background: linear-gradient(135deg, #6b73ff 0%, #000dff 100%);
  color: white;
  padding: 12px 28px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(0, 13, 255, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.open-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 13, 255, 0.4);
}

.dialog-content {
  padding: 8px 0;
}

/* 实验列表样式 */
.exp-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.exp-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
}

.exp-item:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.exp-name {
  font-weight: 500;
  color: #303133;
}

.exp-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background-color: #f0f9eb;
  color: #67c23a;
}

.status-ongoing {
  background-color: #ecf5ff;
  color: #409eff;
}

.status-ended {
  background-color: #fef0f0;
  color: #f56c6c;
}

.status-preparing {
  background-color: #fdf6ec;
  color: #e6a23c;
}

/* 表格内表单样式优化 */
:deep(.el-dialog__body) {
  padding-top: 15px;
  padding-bottom: 10px;
}

:deep(.el-table) {
  margin-bottom: 15px;
}

:deep(.el-table .el-form-item) {
  margin-bottom: 0;
}

:deep(.el-table .el-form-item__error) {
  position: static;
  margin-top: 4px;
}

:deep(.el-divider) {
  margin: 16px 0;
}

.table-form-item {
  margin-bottom: 0;
  width: 100%;
}
</style>