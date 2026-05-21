<script setup>
import { ref, onMounted, watch } from 'vue'
import { 
  ElTable, 
  ElTableColumn, 
  ElButton, 
  ElInput, 
  ElDatePicker,
  ElDialog,
  ElMessage,
  ElMessageBox,
  ElSpace,
  ElTag,
  ElCard,
  ElRow,
  ElCol,
  ElStatistic
} from 'element-plus'
import { 
  Calendar,
  Refresh,
  Setting,
  UserFilled,
  Check,
  Close,
  Plus
} from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import {
  reservationOfDayApi,
  updateMaxApi,
  batchUpdateMaxApi,
  stuReservationApi,
} from '@/api/root/reservation'

// 数据列表
const reservationList = ref([])
const loading = ref(false)
const selectedDate = ref(new Date())

// 弹窗控制
const showDialog = ref(false)
const showBatchDialog = ref(false)
const selectedSlot = ref(null)
const studentList = ref([])
const batchMaxCount = ref(30)


// 生成模拟数据 (6:00 - 23:00)
const generateMockReservations = (date) => {
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date
  const slots = []
  for (let hour = 6; hour <= 23; hour++) {
    // 生成随机预约学生数据
    const studentCount = Math.floor(Math.random() * 25)
    const students = []
    for (let i = 1; i <= studentCount; i++) {
      students.push({
        id: `S${String(i).padStart(3, '0')}`,
        name: `学生${i}`,
        studentId: `2024${String(i).padStart(3, '0')}`,
        className: `班级${Math.floor(Math.random() * 5) + 1}`,
        phone: `138${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
        college: '计算机学院',
        grade: '2024级'
      })
    }
    
    slots.push({
      id: parseInt(dateStr.replace(/-/g, '') + hour),
      day: dateStr,
      startHour: hour,
      reservationCount: studentCount,
      maxCount: 30,
      students: students
    })
  }
  return slots
}

// 获取预约列表
const fetchReservations = async () => {
  loading.value = true
  try {
    const dateStr = selectedDate.value instanceof Date 
      ? selectedDate.value.toISOString().split('T')[0] 
      : selectedDate.value
    const data = (await reservationOfDayApi(dateStr)).data;
    reservationList.value = data.map(item => ({
      ...item,
      editingMax: item.maxCount
    }))
    ElMessage.success('数据加载成功')
  } catch (error) {
    ElMessage.error('获取数据失败: ' + error.message)
    console.log(error)
  } finally {
    loading.value = false
  }
}

// 更新最大人数
const updateMaxCount = async (item) => {
  if (!item.editingMax || item.editingMax < 1) {
    ElMessage.warning('最大人数必须为大于0的数字')
    item.editingMax = item.maxCount
    return
  }
  if (item.editingMax === item.maxCount) return

  const originalMax = item.maxCount
  item.maxCount = item.editingMax

  try {
    await updateMaxApi()
    ElMessage.success(`时段 ${item.startHour}:00 最大人数已更新为 ${item.editingMax}`)
  } catch (error) {
    item.maxCount = originalMax
    item.editingMax = originalMax
    ElMessage.error('更新失败: ' + error.message)
  }
}

// 批量设置最大人数
const openBatchDialog = () => {
  batchMaxCount.value = 30
  showBatchDialog.value = true
}

const applyBatchMaxCount = async () => {
  if (!batchMaxCount.value || batchMaxCount.value < 1) {
    ElMessage.warning('请输入有效的人数')
    return
  }

  try {
    await batchUpdateMaxApi(batchMaxCount.value)
    reservationList.value.forEach(item => {
      item.maxCount = batchMaxCount.value
      item.editingMax = batchMaxCount.value
    })
    showBatchDialog.value = false
    ElMessage.success(`所有时段最大人数已统一设置为 ${batchMaxCount.value}`)
  } catch (error) {
    ElMessage.error('批量设置失败: ' + error.message)
  }
}

// 查看预约名单
const viewStudents = async (item) => {
  studentList.value = await stuReservationApi(item.id) || []
  console.log(studentList.value)
  selectedSlot.value = item
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  selectedSlot.value = null
}

// 监听日期变化
watch(selectedDate, () => {
  fetchReservations()
})

// 初始化
onMounted(() => {
  fetchReservations()
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="app-container">
    <!-- 头部统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总时段数</span>
              <el-tag type="info" size="small">今日</el-tag>
            </div>
          </template>
          <el-statistic :value="reservationList.length" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总预约人数</span>
              <el-tag type="warning" size="small">累计</el-tag>
            </div>
          </template>
          <el-statistic 
            :value="reservationList.reduce((acc, cur) => acc + cur.reservationCount, 0)" 
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>平均预约</span>
              <el-tag type="success" size="small">时段</el-tag>
            </div>
          </template>
          <el-statistic 
            :value="Math.round(reservationList.reduce((acc, cur) => acc + cur.reservationCount, 0) / (reservationList.length || 1))" 
          />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>时段容量</span>
              <el-tag type="primary" size="small">默认</el-tag>
            </div>
          </template>
          <el-statistic :value="30" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 工具栏 -->
    <el-card class="mb-4" shadow="never">
      <div class="toolbar">
        <el-space wrap :size="16">
          <div class="date-picker-wrapper">
            <span class="label">选择日期</span>
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :clearable="false"
              size="large"
            />
          </div>
          
          <el-button 
            type="primary" 
            :icon="Refresh" 
            @click="fetchReservations" 
            :loading="loading"
            size="large"
          >
            查询
          </el-button>

          <el-button 
            type="success" 
            :icon="Setting" 
            @click="openBatchDialog"
            size="large"
          >
            统一设置最大人数
          </el-button>
        </el-space>

        <div class="toolbar-info">
          <el-tag type="info" effect="plain">
            时段范围: 06:00 - 23:00 (共18个时段)
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 主表格 - 预约时段概览 -->
    <el-card shadow="never" class="table-card">
      <el-table 
        :data="reservationList" 
        v-loading="loading"
        border
        stripe
        highlight-current-row
        style="width: 100%"
      >
        <el-table-column prop="slot" label="时段" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="large" effect="plain">
              {{ String(row.slot).padStart(2, '0') }}:00
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="时间范围" width="180" align="center">
          <template #default="{ row }">
            {{ String(row.slot).padStart(2, '0') }}:00 ~ {{ String(row.slot + 1).padStart(2, '0') }}:00
          </template>
        </el-table-column>
        
        <el-table-column label="预约情况" width="180" align="center">
          <template #default="{ row }">
            <el-progress 
              :percentage="Math.round((row.reservationCount / row.maxCount) * 100)" 
              :status="row.reservationCount >= row.maxCount ? 'exception' : 'success'"
              :stroke-width="15"
              :text-inside="true"
              :format="() => `${row.reservationCount}/${row.maxCount}`"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="最大允许人数" width="200" align="center">
          <template #default="{ row }">
            <el-input 
              v-model.number="row.editingMax" 
              type="number"
              min="1"
              size="large"
              @keyup.enter="updateMaxCount(row)"
              class="max-count-input"
            >
              <template #append>
                <el-button 
                  :icon="Check" 
                  @click="updateMaxCount(row)"
                  :disabled="row.editingMax === row.maxCount"
                />
              </template>
            </el-input>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" min-width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              :icon="UserFilled" 
              @click="viewStudents(row)"
              :disabled="row.reservationCount === 0"
              plain
            >
              查看名单 ({{ row.reservationCount }})
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 学生名单弹窗 - 表格形式展示 -->
    <el-dialog 
      v-model="showDialog" 
      :title="`预约学生名单 · ${selectedSlot?.day} ${String(selectedSlot?.slot).padStart(2, '0')}:00`"
      width="80%"
      :before-close="closeDialog"
      destroy-on-close
    >
      <div class="dialog-content">
        <el-alert
          v-if="studentList.length === 0"
          type="info"
          :closable="false"
          center
          show-icon
        >
          该时段暂无学生预约
        </el-alert>
        
        <el-table 
          v-else 
          :data="studentList" 
          border 
          stripe
          style="width: 100%"
        >
          <el-table-column prop="id" label="学号" width="150" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="college" label="学院" width="180" />
          <el-table-column prop="clazzId" label="班级" width="120" />
        </el-table>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-space>
            <span class="text-gray-500">
              共 <span class="text-blue-600 font-bold">{{ studentList.length }}</span> 人预约
            </span>
            <el-button type="primary" @click="closeDialog">关 闭</el-button>
          </el-space>
        </div>
      </template>
    </el-dialog>

    <!-- 批量设置弹窗 -->
    <el-dialog 
      v-model="showBatchDialog" 
      title="统一设置最大人数"
      width="400px"
      :before-close="closeBatchDialog"
    >
      <div class="batch-dialog-content">
        <el-form label-position="top">
          <el-form-item label="最大允许人数">
            <el-input-number 
              v-model="batchMaxCount" 
              :min="1" 
              :max="200"
              size="large"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item>
            <el-text type="info" size="small">
              此操作将把所有时段的最大人数设置为相同值
            </el-text>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeBatchDialog">取 消</el-button>
          <el-button type="primary" @click="applyBatchMaxCount">确 认 设 置</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.app-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.stat-card {
  :deep(.el-card__header) {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    color: #606266;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.date-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .label {
    font-size: 14px;
    color: #606266;
    white-space: nowrap;
  }
}

.toolbar-info {
  display: flex;
  align-items: center;
}

.table-card {
  :deep(.el-card__body) {
    padding: 0;
  }
}

.max-count-input {
  width: 160px;
  
  :deep(.el-input__wrapper) {
    border-radius: 4px 0 0 4px;
  }
  
  :deep(.el-input-group__append) {
    padding: 0;
    
    .el-button {
      margin: 0;
      border-radius: 0 4px 4px 0;
      min-height: 36px;
    }
  }
}

.dialog-content {
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.batch-dialog-content {
  padding: 16px 0;
}

.text-gray-500 {
  color: #909399;
}

.text-blue-600 {
  color: #409EFF;
}

.font-bold {
  font-weight: 600;
}

.mb-4 {
  margin-bottom: 16px;
}

:deep(.el-progress) {
  width: 100%;
  
  .el-progress-bar__outer {
    background-color: #f0f0f0;
  }
}
</style>

<!-- 
API 接口说明：
GET  /api/admin/reservations?date=2026-03-09        // 查询预约时段列表
POST /api/admin/reservations/update_max              // body: { id, max_count } 设置单个时段最大人数
POST /api/admin/reservations/batch_update_max        // body: { max_count } 批量设置所有时段最大人数
GET  /api/admin/reservations/students?day=2026-03-09&start_hour=10  // 获取该时段学生名单（返回学生详细信息）
-->