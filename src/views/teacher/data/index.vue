<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { School, Notebook, UserFilled, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

// 导入 ECharts 相关
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart as EChartsPie } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// 导入API
import {
  getTeacherClazzesApi,
} from '@/api/tea/clazz'

import {
  getTeacherTasksApi,
  getTaskDetailApi,
  getExperimentsApi,
  getExperimentStudentsApi,
} from '@/api/tea/task'

// 注册 ECharts 组件
echarts.use([
  CanvasRenderer,
  EChartsPie,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

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

// 响应式数据
const selectedClassId = ref(null)
const selectedTaskId = ref(null)
const currentClass = ref(null)
const currentClazzNum = ref(null)
const currentExperiment = ref(null)

// 数据状态
const classOptions = ref([])
const taskOptions = ref([])        // 当前班级的任务选项(按任务id区分,同一实验可对应多个任务)
const allTasks = ref([])           // 教师全部任务缓存
const expTitleMap = ref({})        // expId → 实验名称
const experimentDetail = ref({
  id: 0,
  expId: 0,
  endDate: '',
  completeCount: 0,
  totalCount: 0,
  title: '',
  }
)
const studentData = ref(null)

// 加载状态
const loadingClasses = ref(false)
const loadingExperiments = ref(false)
const loadingDetail = ref(false)
const loadingStudents = ref(false)

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '暂无'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 计算完成率
const calculateCompletionRate = (completed, total) => {
  if (!total) return 0
  return ((completed / total) * 100).toFixed(1)
}

// 实验饼图配置
const experimentPieChartOption = computed(() => {
  if (!experimentDetail.value) return {}
  
  const completed = experimentDetail.value.completeCount
  const uncompleted = experimentDetail.value.totalCount - completed
  
  return {
    title: {
      text: `${experimentDetail.value.title} 完成情况`,
      left: 'center',
      top: 1,
      textStyle: { fontSize: 14, fontWeight: 'normal' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} 人 ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 1,
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 15,
      data: ['已完成', '未完成']
    },
    series: [
      {
        name: '实验完成人数',
        type: 'pie',
        radius: ['35%', '55%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {d}%',
          fontSize: 11,
          distanceToLabelLine: 10
        },
        emphasis: {
          label: {
            show: true,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: completed, name: '已完成', itemStyle: { color: '#67C23A' } },
          { value: uncompleted, name: '未完成', itemStyle: { color: '#F56C6C' } }
        ]
      }
    ]
  }
})

// 获取教师班级列表
const fetchTeacherClasses = async () => {
  loadingClasses.value = true
  try {
    const res = await getTeacherClazzesApi(teaId.value)
    // 后端 /tea/{id}/clazzes 返回 [{ clazzId }]
    classOptions.value = res.data || []
    // 如果有班级，默认选中第一个并加载其任务(注意字段是 clazzId)
    if (classOptions.value.length > 0) {
      selectedClassId.value = classOptions.value[0].clazzId
      await handleClassChange(selectedClassId.value)
    }
  } catch (error) {
    ElMessage.error('获取班级列表失败')
    console.error('获取班级列表失败:', error)
  } finally {
    loadingClasses.value = false
  }
}

// 获取教师全部任务与实验名称映射(任务为数据主体, 同一实验的多个任务各自独立)
const fetchAllTasks = async () => {
  loadingExperiments.value = true
  try {
    const [tasksRes, expsRes] = await Promise.all([
      getTeacherTasksApi(teaId.value),
      getExperimentsApi()
    ])
    allTasks.value = tasksRes.data || []
    expTitleMap.value = {}
    for (const e of (expsRes.data || [])) {
      expTitleMap.value[e.expId ?? e.id] = e.title
    }
  } catch (error) {
    ElMessage.error('获取任务列表失败')
    console.error('获取任务列表失败:', error)
  } finally {
    loadingExperiments.value = false
  }
}

// 依据选中班级过滤出对应任务选项
const buildTaskOptions = (clazzId) => {
  taskOptions.value = allTasks.value
    .filter(t => t.clazzId === clazzId)
    .map(t => ({
      taskId: t.id,
      title: expTitleMap.value[t.expId] || `实验${t.expId}`,
      startDate: t.startDate,
      endDate: t.endDate
    }))
}

// 获取实验详情(按任务id)
const fetchExperimentDetail = async (taskId) => {
  loadingDetail.value = true
  try {
    const res = await getTaskDetailApi(teaId.value, taskId)
    experimentDetail.value = res.data
    experimentDetail.value.title = expTitleMap.value[res.data?.expId] || '未知实验'

    // 更新当前班级的总人数信息
    if (currentClass.value) {
      currentClazzNum.value = experimentDetail.value.totalCount
    }
  } catch (error) {
    ElMessage.error('获取实验详情失败')
    console.error('获取实验详情失败:', error)
  } finally {
    loadingDetail.value = false
  }
}

// 获取实验学生名单(按任务id)
const fetchExperimentStudents = async (taskId, classId) => {
  loadingStudents.value = true
  try {
    const res = await getExperimentStudentsApi(teaId.value, taskId, classId)
    // 返回的数据格式是 { completedList, uncompletedList }
    studentData.value = res.data
  } catch (error) {
    ElMessage.error('获取学生名单失败')
    console.error('获取学生名单失败:', error)
  } finally {
    loadingStudents.value = false
  }
}

// 班级变更处理
const handleClassChange = async (classId) => {
  if (!classId) {
    currentClass.value = null
    taskOptions.value = []
    selectedTaskId.value = null
    experimentDetail.value = null
    studentData.value = null
    return
  }

  // 从班级列表中找出选中的班级信息
  currentClass.value = classId

  // 过滤出该班级的任务, 默认选中第一个
  buildTaskOptions(classId)
  selectedTaskId.value = null
  experimentDetail.value = null
  studentData.value = null
  if (taskOptions.value.length > 0) {
    selectedTaskId.value = taskOptions.value[0].taskId
    await handleTaskChange(selectedTaskId.value)
  }
}

// 任务切换处理(按任务id区分, 同一实验的多个任务数据相互独立)
const handleTaskChange = async (taskId) => {
  if (!taskId || !selectedClassId.value) return

  currentExperiment.value = taskOptions.value.find(t => t.taskId === taskId) || { taskId }

  // 获取实验详情和学生名单
  await Promise.all([
    fetchExperimentDetail(taskId),
    fetchExperimentStudents(taskId, selectedClassId.value)
  ])
}

// 页面挂载: 先加载任务与实验名称映射, 再加载班级列表(触发默认任务查询)
onMounted(async () => {
  await fetchAllTasks()
  await fetchTeacherClasses()
})
</script>

<template>
  <div class="class-experiment-container">
    <!-- 顶部：班级选择器 -->
    <el-card class="filter-card" shadow="hover">
      <el-row :gutter="20" align="middle">
        <el-col :xs="24" :sm="6" :md="4">
          <span class="label-text"><el-icon><School /></el-icon> 选择班级</span>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-select
            v-model="selectedClassId"
            placeholder="请选择班级"
            clearable
            filterable
            @change="handleClassChange"
            :loading="loadingClasses"
            style="width: 100%"
          >
            <el-option
              v-for="item in classOptions"
              :key="item.clazzId"
              :label="item.clazzId"
              :value="item.clazzId"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="6" :md="12">
          <div class="stat-badge" v-if="currentClass && currentClazzNum">
            <el-tag size="large" type="info" effect="plain">
              班级总人数：{{ currentClazzNum }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 实验详细数据区域（包含饼图） -->
    <el-card class="experiment-card" shadow="hover" v-if="currentClass">
      <template #header>
        <div class="card-header">
          <span><el-icon><Notebook /></el-icon> 实验完成明细</span>
        </div>
      </template>

      <!-- 加载中状态 -->
      <div v-if="loadingExperiments" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- 任务选择区域 - 有任务数据时显示 -->
      <template v-else>
        <div class="experiment-selector" v-if="taskOptions.length > 0">
          <div class="experiment-buttons">
            <el-radio-group v-model="selectedTaskId" @change="handleTaskChange" >
              <el-radio-button
                v-for="task in taskOptions"
                :key="task.taskId"
                :label="task.taskId"
                class="custom-radio-button"
              >
                {{ task.title }} ({{ formatDate(task.startDate) }} ~ {{ formatDate(task.endDate) }})
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <!-- 没有任务数据时的提示 -->
        <el-empty v-else description="该班级暂无实验任务" :image-size="150" />

        <!-- 当前实验概览 + 饼图区域 - 有实验数据时显示 -->
        <div v-if="currentExperiment && experimentDetail" class="experiment-header">
          <el-row :gutter="16" style="height: 100%; margin: 0;">
            <!-- 左侧：实验概览数据 -->
            <el-col :xs="24" :md="12" style="height: 100%; padding: 0;">
              <div class="overview-container" v-loading="loadingDetail">
                <div class="overview-grid">
                  <div class="overview-item">
                    <div class="overview-label">实验名称</div>
                    <div class="overview-value">{{ experimentDetail.title }}</div>
                  </div>
                  <div class="overview-item">
                    <div class="overview-label">截止日期</div>
                    <div class="overview-value">{{ formatDate(experimentDetail.endDate) }}</div>
                  </div>
                  <div class="overview-item">
                    <div class="overview-label">实验已完成人数</div>
                    <div class="overview-value">
                      <el-tag type="success" size="large">{{ experimentDetail.completeCount }} / {{ experimentDetail.totalCount }}</el-tag>
                    </div>
                  </div>
                  <div class="overview-item">
                    <div class="overview-label">完成率</div>
                    <div class="overview-value">
                      {{ calculateCompletionRate(experimentDetail.completeCount, experimentDetail.totalCount) }}%
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
            
            <!-- 右侧：当前实验的饼图 -->
            <el-col :xs="24" :md="12" style="height: 100%; padding: 0;">
              <div class="chart-container" v-loading="loadingDetail">
                <div class="chart-title">实验完成占比</div>
                <v-chart class="pie-chart" :option="experimentPieChartOption" :update-options="{ notMerge: true }" autoresize />
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 当前实验的详细数据表格 -->
        <div v-if="currentExperiment && studentData" class="experiment-detail">
          <el-row :gutter="20" class="data-tables">
            <!-- 左侧：已完成人员列表 -->
            <el-col :xs="24" :lg="12">
              <el-card shadow="never" class="inner-card">
                <template #header>
                  <div class="inner-header">
                    <span><el-icon><UserFilled /></el-icon> 已完成人员 ({{ studentData.completedList.length }})</span>
                  </div>
                </template>
                <el-table 
                  :data="studentData.completedList" 
                  stripe 
                  border 
                  style="width: 100%"
                  v-loading="loadingStudents"
                  height="300"
                >
                  <el-table-column prop="stuId" label="学号" min-width="80"/>
                  <el-table-column prop="stuName" label="姓名" min-width="120" />
                  <el-table-column prop="score" label="评分" min-width="80">
                    <template #default="{ row }">
                      <el-tag :type="row.score >= 90 ? 'success' : row.score >= 60 ? 'warning' : 'danger'">
                        {{ row.score }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>

            <!-- 右侧：未完成人员名单 -->
            <el-col :xs="24" :lg="12">
              <el-card shadow="never" class="inner-card">
                <template #header>
                  <div class="inner-header">
                    <span><el-icon><User /></el-icon> 未完成人员 ({{ studentData.uncompletedList.length }})</span>
                  </div>
                </template>
                <el-table 
                  :data="studentData.uncompletedList" 
                  stripe 
                  border 
                  style="width: 100%"
                  v-loading="loadingStudents"
                  height="300"
                >
                  <el-table-column prop="stuId" label="学号" min-width="120" />
                  <el-table-column prop="stuName" label="姓名" min-width="120" />
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </template>
    </el-card>

    <!-- 未选择班级时的提示 -->
    <el-empty v-else description="请先选择一个班级" :image-size="200" />
  </div>
</template>

<style scoped>
.class-experiment-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.label-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  color: #303133;
}

.stat-badge {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.experiment-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #2c3e50;
  padding: 10px 0;
}

.loading-container {
  padding: 20px;
}

.experiment-selector {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.experiment-buttons {
  display: flex;
  flex-wrap: wrap;
}

/* 按钮之间有间距的样式 */
.experiment-buttons :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.experiment-buttons :deep(.el-radio-button) {
  margin: 0;
}

.experiment-buttons :deep(.el-radio-button__inner) {
  border: 1px solid #dcdfe6 !important;
  border-radius: 4px !important;
  box-shadow: none !important;
  padding: 8px 16px;
}

.experiment-buttons :deep(.el-radio-button.is-active .el-radio-button__inner) {
  border-color: #409eff !important;
  background-color: #409eff !important;
  color: white !important;
}

.experiment-buttons :deep(.el-radio-button.is-active + .el-radio-button .el-radio-button__inner) {
  border-left: 1px solid #dcdfe6 !important;
}

.experiment-header {
  margin-bottom: 24px;
  padding: 0;
  background-color: #ffffff;
  border-radius: 8px;
  height: 260px;
  width: 100%;
  overflow: hidden;
}

.overview-container {
  padding: 8px;
  background-color: #ffffff;
  border-radius: 8px;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  position: relative;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  width: 100%;
  height: 100%;
}

.overview-item {
  text-align: center;
  padding: 8px 4px;
  background-color: #f8f9fa;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid #f0f2f5;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.overview-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
  font-weight: 500;
}

.overview-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
  word-break: break-word;
}

.overview-value .el-tag {
  font-size: 15px;
  padding: 4px 12px;
  font-weight: 500;
  height: 32px;
  line-height: 24px;
}

.chart-container {
  padding: 8px;
  background-color: #ffffff;
  border-radius: 8px;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f2f5;
  box-sizing: border-box;
  position: relative;
}

.chart-title {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid #ebeef5;
  height: 28px;
  line-height: 20px;
}

.pie-chart {
  width: 100%;
  height: calc(100% - 32px);
  min-height: 0;
  flex: 1;
}

.experiment-detail {
  padding: 10px 0;
}

.data-tables {
  margin-top: 10px;
}

.inner-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 16px;
}

.inner-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #409eff;
}

.inner-header span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 确保所有背景色一致 */
.el-card, .el-card__body, .experiment-header, .overview-container, .chart-container {
  background-color: #ffffff;
}

/* 移除所有可能造成重叠的外边距和内边距 */
.el-row {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.el-col {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stat-badge {
    justify-content: flex-start;
    margin-top: 10px;
  }
  
  .experiment-header {
    height: auto;
    min-height: 500px;
  }
  
  .experiment-buttons :deep(.el-radio-group) {
    gap: 6px;
  }
  
  .experiment-buttons :deep(.el-radio-button__inner) {
    padding: 6px 12px;
    font-size: 14px;
  }
  
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 6px;
  }
  
  .overview-item {
    padding: 6px 2px;
  }
  
  .overview-value {
    font-size: 15px;
  }
  
  .overview-value .el-tag {
    font-size: 13px;
    padding: 3px 8px;
    height: 28px;
  }
  
  .chart-container {
    margin-top: 8px;
  }
  
  .pie-chart {
    height: 220px;
  }
}

/* 中等屏幕适配 */
@media (min-width: 769px) and (max-width: 1200px) {
  .overview-value {
    font-size: 16px;
  }
  
  .overview-value .el-tag {
    font-size: 14px;
    padding: 4px 10px;
  }
  
  .experiment-header {
    height: 240px;
  }
}
</style>