<script setup>
import { ref, watch, computed } from 'vue'
import { ElForm, ElFormItem, ElDatePicker, ElSelect, ElOption, ElButton, ElCard, ElRow, ElCol, ElSpace, ElMessage } from 'element-plus'
import { Calendar, Timer, EditPen } from '@element-plus/icons-vue'
import { getReservationByDayApi, addStuReservationApi } from '@/api/stu/index'
import { useRouter } from 'vue-router'

// 表单数据
const formData = ref({
  date: '',
  timeSlot: ''
})

// 可预约时段数据（基础时段模板）
const baseTimeSlots = ref([])
// 当前选中日期的预约信息（从后端获取）
const currentDayReservations = ref([])
// 加载状态
const loading = ref(false)

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

const studentId = ref(loginUser?.id || '') 

// 如果学生ID为空，跳转到登录页
if (!studentId.value) {
  ElMessage.error('请先登录')
  router.push('/login')
}

// 生成基础时段模板 (早6点到晚12点，每小时一个时段)
const generateBaseTimeSlots = () => {
  const slots = []
  for (let hour = 6; hour <= 23; hour++) {
    const start = hour.toString().padStart(2, '0') + ':00'
    const end = (hour + 1).toString().padStart(2, '0') + ':00'
    slots.push({
      value: hour, // 修改为整数hour作为value
      label: `${start} ~ ${end}`,
      hour: hour // 保存小时数字
    })
  }
  return slots
}

baseTimeSlots.value = generateBaseTimeSlots()

// 获取当前所选日期的预约信息
const fetchDayReservations = async () => {
  const date = formData.value.date
  if (!date) {
    formData.value.timeSlot = ''
    currentDayReservations.value = []
    return
  }

  try {
    loading.value = true
    const response = await getReservationByDayApi(date)
    // 返回的数据格式为 [{id, day, slot, reservationCount, maxCount, isActive}]
    // 其中slot是整数格式（小时数）
    currentDayReservations.value = response.data || []

    // 如果当前已选的时段在该日期不可用，清空选择
    if (formData.value.timeSlot !== '') {
      const hour = formData.value.timeSlot // 直接使用整数hour
      if (!isSlotAvailable(hour)) {
        formData.value.timeSlot = ''
        ElMessage.warning('所选时段不可预约，请重新选择')
      }
    }
  } catch (error) {
    console.error('获取预约信息失败:', error)
    ElMessage.error('获取预约信息失败，请重试')
    currentDayReservations.value = []
  } finally {
    loading.value = false
  }
}

// 监听日期变化，获取该日期的预约信息
watch(() => formData.value.date, fetchDayReservations)

// 判断指定小时是否可预约（isActive=0 表示该时段禁止预约）
const isSlotAvailable = (hour) => {
  if (!hour && hour !== 0 || !currentDayReservations.value.length) return true

  // 直接使用整数hour进行匹配
  const reservation = currentDayReservations.value.find(r => r.slot === hour)

  // 如果没有预约记录，说明该时段可预约（默认maxCount > 0）
  if (!reservation) return true

  // 该时段已被管理员/定时任务关闭预约
  if (reservation.isActive === 0) return false

  // 有预约记录，比较预约数和最大数
  return reservation.reservationCount < reservation.maxCount
}

// 获取时段的预约状态详情（用于显示）
const getSlotStatus = (hour) => {
  if (!currentDayReservations.value.length) {
    return { available: true, count: 0, max: 0 } // 默认值
  }

  // 直接使用整数hour进行匹配
  const reservation = currentDayReservations.value.find(r => r.slot === hour)

  if (!reservation) {
    return { available: true, count: 0, max: 0 } // 默认最大容量0
  }

  if (reservation.isActive === 0) {
    return { available: false, count: reservation.reservationCount, max: reservation.maxCount }
  }

  return {
    available: reservation.reservationCount < reservation.maxCount,
    count: reservation.reservationCount,
    max: reservation.maxCount
  }
}

// 组合可预约时段
const availableTimeSlots = computed(() => {
  return baseTimeSlots.value.map(slot => {
    const status = getSlotStatus(slot.hour) // slot.hour是整数
    return {
      ...slot,
      value: slot.hour, 
      available: status.available,
      reservationCount: status.count,
      maxCount: status.max
    }
  })
})

// 提交预约
const handleSubmit = async () => {
  if (!formData.value.date || formData.value.timeSlot === '') {
    ElMessage.warning('请完整填写预约信息')
    return
  }
  
  const selectedSlot = availableTimeSlots.value.find(slot => slot.value === formData.value.timeSlot)
  if (!selectedSlot?.available) {
    ElMessage.error('所选时段已无余量，请重新选择')
    return
  }

  try{
    const res = await addStuReservationApi(studentId.value,formData.value.date,formData.value.timeSlot)
    // 后端校验失败（时段关闭/约满等）返回 HTTP 200 + code=0
    if (res && res.code === 0) {
      ElMessage.error(res.msg || '预约失败，请重试')
      fetchDayReservations()
      return
    }
  }catch(error){
    console.error('预约失败:', error)
    ElMessage.error(error.response?.data?.message || '预约失败，请重试')
    return
  }
  ElMessage.success(`预约成功！日期：${formData.value.date}，时段：${selectedSlot.label}`)
  fetchDayReservations()
}

// 禁用日期：只能选择近七天（包括今天）
const disabledDate = (time) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(today.getDate() + 6)
  
  return time.getTime() < today.getTime() || time.getTime() > sevenDaysLater.getTime()
}

// 格式化小时显示（用于下拉框和标签）
const formatHourLabel = (hour) => {
  const start = hour.toString().padStart(2, '0') + ':00'
  const end = (hour + 1).toString().padStart(2, '0') + ':00'
  return `${start} ~ ${end}`
}
</script>

<template>
  <div class="page-container">
    <el-card class="booking-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-space>
            <el-icon :size="20"><EditPen /></el-icon>
            <span class="title">实验预约登记</span>
          </el-space>
          <span class="sub-title">请选择日期与时段，每个时段为1小时</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        label-position="top"
        class="booking-form"
      >
        <el-row :gutter="30">
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="实验日期" required>
              <template #label>
                <el-space size="2">
                  <el-icon><Calendar /></el-icon>
                  <span>实验日期</span>
                </el-space>
              </template>
              <el-date-picker
                v-model="formData.date"
                type="date"
                placeholder="选择预约日期（仅限近七天）"
                :disabled-date="disabledDate"
                format="YYYY/MM/DD"
                value-format="YYYY-MM-DD"
                class="full-width"
                size="large"
                clearable
                :shortcuts="[]"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="实验时段" required>
              <template #label>
                <el-space size="2">
                  <el-icon><Timer /></el-icon>
                  <span>实验时段</span>
                </el-space>
              </template>
              <el-select
                v-model="formData.timeSlot"
                placeholder="请选择时段"
                class="full-width"
                size="large"
                clearable
                :loading="loading"
                :disabled="!formData.date"
              >
                <el-option
                  v-for="slot in availableTimeSlots"
                  :key="slot.value"
                  :label="slot.label"
                  :value="slot.value"
                  :disabled="!slot.available"
                >
                  <template #default>
                    <div class="option-content">
                      <span>{{ slot.label }}</span>
                      <el-tag 
                        v-if="currentDayReservations.length" 
                        :type="slot.available ? 'success' : 'danger'"
                        size="small"
                        effect="plain"
                        class="count-tag"
                      >
                        {{ slot.reservationCount }}/{{ slot.maxCount }}
                      </el-tag>
                    </div>
                  </template>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 所有可预约时段展示区 -->
        <el-row :gutter="30" class="info-row">
          <el-col :span="24">
            <div class="time-range-hint">
              <el-space wrap :size="[16, 12]">
                <span class="hint-label">可预约时段：</span>
                <el-tag
                  v-for="slot in availableTimeSlots"
                  :key="slot.value"
                  :type="slot.available ? 'success' : 'info'"
                  :effect="slot.available ? 'light' : 'plain'"
                  size="small"
                  round
                >
                  <span>{{ slot.label }}</span>
                  <span v-if="currentDayReservations.length" class="count-badge">
                    ({{ slot.reservationCount }}/{{ slot.maxCount }})
                  </span>
                  <span v-else-if="!slot.available" class="unavailable-mark">(满)</span>
                </el-tag>
              </el-space>
            </div>
          </el-col>
        </el-row>

        <el-form-item class="form-actions">
          <el-space :size="16" alignment="center" wrap>
            <el-button 
              type="primary" 
              size="large" 
              @click="handleSubmit" 
              plain
              :loading="loading"
            >
              立即预约
            </el-button>
            <el-button size="large" @click="formData = { date: '', timeSlot: '' }">重置选择</el-button>
          </el-space>
        </el-form-item>
      </el-form>

      <div class="footer-note">
        <el-divider>
          <el-icon><Calendar /></el-icon>
        </el-divider>
        <p class="note-text">• 仅可预约近七天日期 • 每个时段为整点起止</p>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
/* 样式保持不变 */
.page-container {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: linear-gradient(145deg, #f6f9fc 0%, #eef2f6 100%);
  padding: 2rem 20px;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.booking-card {
  width: 100%;
  max-width: 880px;
  margin: 1rem auto 2rem;
  border-radius: 28px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 20px 35px -8px rgba(0, 20, 40, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.02) inset;
}

.booking-card :deep(.el-card__body) {
  padding: 32px 32px 24px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-header .title {
  font-size: 1.6rem;
  font-weight: 600;
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  letter-spacing: -0.02em;
  margin-left: 4px;
}

.card-header .sub-title {
  font-size: 0.95rem;
  color: #5a6f88;
  font-weight: 400;
  margin-top: 2px;
  padding-left: 30px;
}

.booking-form {
  margin-top: 8px;
}

.booking-form :deep(.el-form-item) {
  margin-bottom: 28px;
}

.booking-form :deep(.el-form-item__label) {
  font-weight: 550;
  color: #1e3a5f;
  padding-bottom: 8px;
  font-size: 1rem;
}

.full-width {
  width: 100%;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  box-shadow: 0 2px 6px 0 rgba(0, 0, 0, 0.02), 0 0 0 1px rgba(0, 40, 80, 0.08) inset !important;
  border-radius: 14px;
  transition: all 0.2s;
}

:deep(.el-input__wrapper:hover),
:deep(.el-select__wrapper:hover) {
  box-shadow: 0 4px 12px 0 rgba(30, 60, 130, 0.08), 0 0 0 1px #1e3c72 inset !important;
}

.option-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.count-tag {
  margin-left: 8px;
}

.info-row {
  margin-top: -8px;
  margin-bottom: 24px;
}

.time-range-hint {
  background: rgba(230, 242, 255, 0.7);
  border-radius: 32px;
  padding: 20px 24px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(64, 128, 255, 0.15);
  font-size: 0.9rem;
  max-height: 180px;
  overflow-y: auto;
}

.time-range-hint::-webkit-scrollbar {
  width: 6px;
}

.time-range-hint::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
}

.time-range-hint::-webkit-scrollbar-thumb {
  background: rgba(64, 128, 255, 0.3);
  border-radius: 10px;
}

.time-range-hint::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 128, 255, 0.5);
}

.hint-label {
  font-weight: 600;
  color: #1e3c72;
  margin-right: 4px;
  position: sticky;
  top: 0;
  background: rgba(230, 242, 255, 0.9);
  padding: 4px 0;
  z-index: 1;
}

:deep(.el-tag) {
  border-radius: 20px;
  font-weight: 450;
  margin: 4px 0;
}

.count-badge {
  font-size: 0.8em;
  margin-left: 4px;
  color: #606266;
}

.unavailable-mark {
  font-size: 0.8em;
  margin-left: 2px;
  color: #909399;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px !important;
  margin-bottom: 8px !important;
}

.footer-note {
  margin-top: 8px;
}

.note-text {
  text-align: center;
  color: #607a9a;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
  margin: 12px 0 4px;
}

:deep(.el-divider) {
  margin: 16px 0 12px;
  border-top: 1px dashed #c0d0e0;
}

@media (max-width: 640px) {
  .page-container {
    padding: 1rem 12px;
  }
  
  .booking-card :deep(.el-card__body) {
    padding: 24px 20px;
  }

  .card-header .title {
    font-size: 1.4rem;
  }

  .card-header .sub-title {
    padding-left: 26px;
  }

  .time-range-hint {
    padding: 16px 16px;
    border-radius: 24px;
    max-height: 150px;
  }
}

.page-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.5) 0%, transparent 30%),
              radial-gradient(circle at 90% 70%, rgba(200, 220, 250, 0.3) 0%, transparent 40%);
  pointer-events: none;
}
</style>