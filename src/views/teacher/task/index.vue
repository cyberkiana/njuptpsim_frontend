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

// 发布实验表单数据
const publishForm = reactive({
  clazzId: '',
  expId: '',
  startDate: '',
  endDate: ''
})

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
    const data = (await getTeacherClazzesApi(teaId.value)).data
    console.log(data)
    // 后端返回 [{ id,  }]
    classOptions.value = data.map(item => ({
      value: item.clazzId,
      //label: `${item.name} (共${item.studentCount}人)`,
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
    const data = (await getExperimentsApi()).data
    // 后端返回 [{ expId, title }]
    experimentOptions.value = data.map(item => ({
      value: item.expId,
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
    const data = (await getTeacherTasksApi(teaId.value)).data
    // 后端返回 [{ id, clazzId, expId, startDate, endDate, completeCount, totalCount }]
    // 需要补充实验名称和班级名称用于显示
    publishedTasks.value = data.map(item => {
      // 查找对应的实验名称
      const exp = experimentOptions.value.find(e => e.value === item.expId)
      // 查找对应的班级名称
      const clazz = classOptions.value.find(c => c.value === item.clazzId)
      
      return {
        ...item,
        experimentName: exp ? exp.label : '未知实验',
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

// 发布实验任务
const handlePublish = async () => {
  // 表单验证
  if (!publishForm.expId) {
    ElMessage.warning('请选择实验')
    return
  }
  if (!publishForm.clazzId) {
    ElMessage.warning('请选择班级')
    return
  }
  if (!publishForm.startDate) {
    ElMessage.warning('请选择开始日期')
    return
  }
  if (!publishForm.endDate) {
    ElMessage.warning('请选择结束日期')
    return
  }

  // 验证日期范围
  if (new Date(publishForm.startDate) > new Date(publishForm.endDate)) {
    ElMessage.warning('结束日期不能早于开始日期')
    return
  }

  loading.value.publish = true
  try {
    // 调用发布接口
    await publishTaskApi(teaId.value, {
      teacher: teaName.value,
      clazzId: publishForm.clazzId,
      expId: publishForm.expId,
      startDate: publishForm.startDate,
      endDate: publishForm.endDate
    })
    
    ElMessage.success('实验发布成功')
    
    // 清空表单
    publishForm.clazzId = ''
    publishForm.expId = ''
    publishForm.startDate = ''
    publishForm.endDate = ''
    
    // 刷新任务列表
    await fetchTasks()
  } catch (error) {
    console.error('发布实验失败:', error)
    ElMessage.error('发布实验失败')
  } finally {
    loading.value.publish = false
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
  await Promise.all([fetchClasses(), fetchExperiments()])
  // 加载任务列表（需要依赖班级和实验列表来显示名称）
  await fetchTasks()
})
</script>

<template>
  <div class="experiment-container">
    <!-- 发布实验卡片 -->
    <el-card class="publish-card" shadow="hover" v-loading="loading.publish">
      <template #header>
        <div class="card-header">
          <el-icon><Plus /></el-icon>
          <span>发布新实验</span>
        </div>
      </template>
      
      <el-form :model="publishForm" label-width="100px">
        <el-form-item label="选择实验" required>
          <el-select 
            v-model="publishForm.expId" 
            placeholder="请选择实验"
            clearable
            filterable
            :loading="loading.experiments"
            style="width: 100%"
          >
            <el-option
              v-for="item in experimentOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="选择班级" required>
          <el-select 
            v-model="publishForm.clazzId" 
            placeholder="请选择班级"
            clearable
            filterable
            :loading="loading.classes"
            style="width: 100%"
          >
            <el-option
              v-for="item in classOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="开始日期" required>
          <el-date-picker
            v-model="publishForm.startDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="结束日期" required>
          <el-date-picker
            v-model="publishForm.endDate"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handlePublish" 
            :loading="loading.publish"
            :icon="Upload"
          >
            发布实验
          </el-button>
          <el-button @click="publishForm.clazzId = ''; publishForm.expId = ''; publishForm.startDate = ''; publishForm.endDate = ''">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

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
          <!-- <el-table-column prop="className" label="班级名称" min-width="150" /> -->
          <el-table-column prop="experimentName" label="实验名称" min-width="160" />
          <el-table-column prop="startDate" label="开始日期" width="120" />
          <el-table-column prop="endDate" label="结束日期" width="120" />
          <el-table-column label="完成进度" min-width="160">
            <template #default="{ row }">
              <div class="progress-info">
                <span>{{ row.completedCount }}/{{ row.totalStudents }}</span>
                <el-progress 
                  :percentage="getCompletionPercentage(row.completedCount, row.totalStudents)" 
                  :status="row.completedCount === row.totalStudents ? 'success' : ''"
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

.publish-card, .list-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.publish-card:hover, .list-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
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