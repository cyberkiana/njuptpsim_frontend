<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  DocumentChecked,
  Calendar,
  Notebook,
  User,
  Timer,
  Star
} from '@element-plus/icons-vue'
import { 
  getStudentTasksApi, 
  getStudentReservationsApi, 
  deleteReservationApi 
} from '@/api/stu/index'

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

// 学生信息
const studentName = ref(loginUser?.name || '') 
const studentId = ref(loginUser?.id || '') 

// 如果学生ID为空，跳转到登录页
if (!studentId.value) {
  ElMessage.error('请先登录')
  router.push('/login')
}

// 标签页切换: pending / completed
const taskTab = ref('pending')

// 实验任务数据
const pendingTasks = ref([])
const completedTasks = ref([])

// 预约数据
const appointments = ref([])

// 加载状态
const loading = ref({
  tasks: false,
  appointments: false
})

// 时段转换函数：将slot数字转换为时间段字符串
const formatSlot = (slot) => {
  // slot从0开始，0代表6:00-7:00，1代表7:00-8:00，...，16代表22:00-23:00
  const startHour = 6 + slot
  const endHour = startHour + 1
  return `${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`
}

// 获取任务列表
const fetchTasks = async () => {
  loading.value.tasks = true
  try {
    const response = await getStudentTasksApi(studentId.value)
    // 返回的数据格式为：
    // {
    //   pendingTasks: [{ id, teacher, title, content, startDate, endDate,  }],
    //   completedTasks: [{ id, teacher, title, content, finishDate, score }],
    // }
    const data = response.data
    pendingTasks.value = data.pendingTasks || []
    completedTasks.value = data.completedTasks || []
  } catch (error) {
    ElMessage.error('获取任务列表失败')
    console.error('Fetch tasks error:', error)
  } finally {
    loading.value.tasks = false
  }
}

// 获取预约列表
const fetchAppointments = async () => {
  loading.value.appointments = true
  try {
    const response = await getStudentReservationsApi(studentId.value)
    // 返回的数据格式为：
    // [{ id, day, slot, status }]
    appointments.value = response.data || []
  } catch (error) {
    ElMessage.error('获取预约信息失败')
    console.error('Fetch appointments error:', error)
  } finally {
    loading.value.appointments = false
  }
}

// 取消预约
const handleCancelAppointment = async (apt) => {
  try {
    await ElMessageBox.confirm(`确定取消预约【${apt.day} ${formatSlot(apt.slot)}】吗？`, '取消预约', {
      confirmButtonText: '确定',
      cancelButtonText: '再想想',
      type: 'warning'
    })
    
    // 调用取消预约的API
    await deleteReservationApi(studentId.value, apt.id, apt.day, apt.slot)
    
    // 从列表中移除
    const index = appointments.value.findIndex(a => a.id === apt.id)
    if (index !== -1) {
      appointments.value.splice(index, 1)
      ElMessage.success('预约已取消')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消预约失败')
      console.error('Cancel appointment error:', error)
    }
  }
}

const handleViewReport = (task) => {
  ElMessage({
    message: `查看报告：${task.title}`,
    type: 'success'
  })
  // 实际可跳转或弹出报告
}

const handleNewAppointment = () => {
  router.push('/stu/reservation')
}

// 获取任务状态
const getTaskStatus = (startDate) => {
  var getTime = new Date().getTime(); //获取到当前时间戳
  var time = new Date(getTime); //创建一个日期对象
  function nowDate(time) {
    var year = time.getFullYear(); // 年
    var month = (time.getMonth() + 1).toString().padStart(2, '0'); // 月
    var date = time.getDate().toString().padStart(2, '0'); // 日
    var hour = time.getHours().toString().padStart(2, '0'); // 时
    var minute = time.getMinutes().toString().padStart(2, '0'); // 分
    var second = time.getSeconds().toString().padStart(2, '0'); // 秒
    return (
      year + "-" + month + "-" + date
    )
  }
  const today = nowDate(time)
  console.log(time);
  console.log(nowDate(time));
  if (today < startDate) {
    return { type: 'warning', text: '未开始' }
  } else {
    return { type: 'danger', text: '未完成' }
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchTasks()
  fetchAppointments()
})
</script>

<template>
  <div class="student-home">
    <!-- 页面标题 -->
    <el-page-header :title="`欢迎回来，${studentName}`" :icon="null">
    </el-page-header>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="stat-header">
              <el-icon><Document /></el-icon>
              <span>未完成实验</span>
            </div>
          </template>
          <div class="stat-number">{{ pendingTasks.length }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="stat-header">
              <el-icon><DocumentChecked /></el-icon>
              <span>已完成实验</span>
            </div>
          </template>
          <div class="stat-number">{{ completedTasks.length }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="stat-header">
              <el-icon><Calendar /></el-icon>
              <span>我的预约</span>
            </div>
          </template>
          <div class="stat-number">{{ appointments.length }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要区域：实验任务 + 预约 -->
    <el-row :gutter="20">
      <!-- 左侧：实验任务区域 -->
      <el-col :span="16">
        <el-card shadow="never" class="tasks-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Notebook /></el-icon> 实验任务</span>
              <el-radio-group v-model="taskTab" size="small">
                <el-radio-button label="pending">未完成</el-radio-button>
                <el-radio-button label="completed">已完成</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <!-- 未完成列表 -->
          <div v-if="taskTab === 'pending'">
            <el-empty v-if="pendingTasks.length === 0" description="暂无未完成实验" />
            <el-timeline v-else>
              <el-timeline-item
                v-for="task in pendingTasks"
                :key="task.id"
                :timestamp="task.endDate"
                type="warning"
                placement="top"
              >
                <el-card shadow="hover" class="task-item">
                  <div class="task-header">
                    <h4>{{ task.title }}</h4>
                    <el-tag 
                      size="small" 
                      :type="getTaskStatus(task.startDate).type"
                    >
                      {{ getTaskStatus(task.startDate).text }}
                    </el-tag>
                  </div>
                  <p class="task-desc">{{ task.content }}</p>
                  <div class="task-footer">
                    <span><el-icon><User /></el-icon> 老师：{{ task.teacher }}</span>
                    <span><el-icon><Timer /></el-icon> 开始时间： {{ task.startDate }}</span>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>

          <!-- 已完成列表 -->
          <div v-else>
            <el-empty v-if="completedTasks.length === 0" description="暂无已完成实验" />
            <el-timeline v-else>
              <el-timeline-item
                v-for="task in completedTasks"
                :key="task.id"
                :timestamp="task.completeDate"
                type="success"
                placement="top"
              >
                <el-card shadow="hover" class="task-item">
                  <div class="task-header">
                    <h4>{{ task.title }}</h4>
                    <el-tag size="small" type="success">已完成</el-tag>
                  </div>
                  <p class="task-desc">{{ task.content }}</p>
                  <div class="task-footer">
                    <div class="task-score">
                      <el-icon><Star /></el-icon>
                        得分：
                      <span v-if="task.score !== undefined && task.score !== null" class="score-value">
                        {{ task.score }}
                      </span>
                    <span v-else class="score-null">暂无</span>
                  </div>
                    <div class="task-actions">
                      <span><el-icon><User /></el-icon> 老师：{{ task.teacher }}</span>
                      <el-button size="small" @click="handleViewReport(task)">查看报告</el-button>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：我的预约 -->
      <el-col :span="8">
        <el-card shadow="never" class="appointments-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Timer /></el-icon> 我的预约</span>
              <el-button type="primary" size="small" @click="handleNewAppointment">+ 新预约</el-button>
            </div>
          </template>

          <el-empty v-if="appointments.length === 0" description="暂无预约" />
          <div v-else class="appointment-list">
            <el-card
              v-for="apt in appointments"
              :key="apt.id"
              shadow="hover"
              class="appointment-item"
              :body-style="{ padding: '12px' }"
            >
              <div class="apt-header">
                <el-tag :type="apt.status === '已确认' ? 'success' : 'info'" size="small">
                  {{ apt.status }}
                </el-tag>
                <span class="apt-time">{{ formatSlot(apt.slot) }}</span>
              </div>
              <div class="apt-content">
                <p><el-icon><Calendar /></el-icon> 日期：{{ apt.day }}</p>
              </div>
              <div class="apt-footer">
                <el-button size="small" type="danger" @click="handleCancelAppointment(apt)">取消预约</el-button>
              </div>
            </el-card>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.student-home {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 标题区域 */
.el-page-header {
  margin-bottom: 20px;
  background-color: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

/* 统计卡片 */
.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  color: #606266;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #303133;
  line-height: 1.4;
}

/* 卡片通用 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  font-size: 16px;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tasks-card,
.appointments-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  height: fit-content;
}

/* 任务项 */
.task-item {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.task-desc {
  font-size: 14px;
  color: #606266;
  margin: 8px 0;
  line-height: 1.5;
}

.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #909399;
}

.task-footer span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-score {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e6a23c; /* 橙色表示分数 */
}

.score-value {
  font-weight: bold;
  font-size: 16px;
  color: #f56c6c; /* 红色突出分数 */
}

.score-null {
  color: #909399;
  font-style: italic;
}

/* 预约列表 */
.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.appointment-item {
  border: none;
  border-left: 3px solid #409EFF;
  transition: all 0.2s;
}

.appointment-item:hover {
  border-left-color: #66b1ff;
}

.apt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.apt-time {
  font-size: 13px;
  color: #909399;
}

.apt-content p {
  margin: 4px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #303133;
}

.apt-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

/* 时间轴调整 */
.el-timeline {
  padding-left: 10px;
}

.el-timeline-item {
  padding-bottom: 12px;
}

/* 空状态 */
.el-empty {
  padding: 40px 0;
}
</style>