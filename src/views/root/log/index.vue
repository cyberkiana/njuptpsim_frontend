<script setup>
import { ref, onMounted } from 'vue'
import {
  ElTable, ElTableColumn, ElButton, ElInput, ElDialog,
  ElMessage, ElMessageBox, ElTag, ElCard, ElPagination,
  ElTabs, ElTabPane, ElForm, ElFormItem, ElDescriptions, ElDescriptionsItem
} from 'element-plus'
import 'element-plus/dist/index.css'
import {
  operationLogApi,
  loginLogApi,
  errorLogApi,
  rootEventLogApi,
  blacklistApi,
  unbanIpApi,
  banIpApi
} from '@/api/root/log'

// 当前标签页
const activeTab = ref('operation')

// ==================== 操作日志 ====================
const operationList = ref([])
const operationTotal = ref(0)
const operationPage = ref(1)
const operationPageSize = ref(10)
const operationLoading = ref(false)

const fetchOperationLogs = async () => {
  operationLoading.value = true
  try {
    const data = await operationLogApi(operationPage.value, operationPageSize.value)
    operationList.value = data.data.list || []
    operationTotal.value = data.data.total || 0
  } catch (e) {
    ElMessage.error('获取操作日志失败')
  } finally {
    operationLoading.value = false
  }
}

const operationStatusText = (status) => (status === 1 ? '成功' : '失败')
const operationStatusType = (status) => (status === 1 ? 'success' : 'danger')
const operationTypeText = (type) => (type === '0' ? '系统事件' : '业务事件')

// ==================== 登录日志 ====================
const loginList = ref([])
const loginTotal = ref(0)
const loginPage = ref(1)
const loginPageSize = ref(10)
const loginLoading = ref(false)

const fetchLoginLogs = async () => {
  loginLoading.value = true
  try {
    const data = await loginLogApi(loginPage.value, loginPageSize.value)
    loginList.value = data.data.list || []
    loginTotal.value = data.data.total || 0
  } catch (e) {
    ElMessage.error('获取登录日志失败')
  } finally {
    loginLoading.value = false
  }
}

const loginOperationText = (op) => (op === 0 ? '用户登录' : '用户退出')
const loginStatusText = (status) =>
  status === 1 ? '成功' : status === 2 ? '账号已锁定' : '失败'
const loginStatusType = (status) =>
  status === 1 ? 'success' : status === 2 ? 'warning' : 'danger'

// ==================== 异常日志 ====================
const errorList = ref([])
const errorTotal = ref(0)
const errorPage = ref(1)
const errorPageSize = ref(10)
const errorLoading = ref(false)
const errorDetail = ref(null)
const showErrorDialog = ref(false)

const fetchErrorLogs = async () => {
  errorLoading.value = true
  try {
    const data = await errorLogApi(errorPage.value, errorPageSize.value)
    errorList.value = data.data.list || []
    errorTotal.value = data.data.total || 0
  } catch (e) {
    ElMessage.error('获取异常日志失败')
  } finally {
    errorLoading.value = false
  }
}

const viewError = (row) => {
  errorDetail.value = row
  showErrorDialog.value = true
}

// ==================== 管理员事件 ====================
const eventList = ref([])
const eventTotal = ref(0)
const eventPage = ref(1)
const eventPageSize = ref(10)
const eventLoading = ref(false)

const fetchRootEvents = async () => {
  eventLoading.value = true
  try {
    const data = await rootEventLogApi(eventPage.value, eventPageSize.value)
    eventList.value = data.data.list || []
    eventTotal.value = data.data.total || 0
  } catch (e) {
    ElMessage.error('获取管理员事件失败')
  } finally {
    eventLoading.value = false
  }
}

// ==================== IP黑名单管理 ====================
const blacklist = ref([])
const blacklistLoading = ref(false)
const showBanDialog = ref(false)
const banForm = ref({ ip: '', reason: '' })

const fetchBlacklist = async () => {
  blacklistLoading.value = true
  try {
    const data = await blacklistApi()
    blacklist.value = data.data.list || []
  } catch (e) {
    ElMessage.error('获取IP黑名单失败')
  } finally {
    blacklistLoading.value = false
  }
}

// 解封
const unban = (row) => {
  ElMessageBox.confirm(`确认解封IP ${row.ip} 吗？解封后该IP可正常访问系统`, '解封确认',
    { confirmButtonText: '解封', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    await unbanIpApi(row.id)
    ElMessage.success(`IP ${row.ip} 已解封`)
    fetchBlacklist()
  }).catch(() => {})
}

// 手动封禁
const openBanDialog = () => {
  banForm.value = { ip: '', reason: '' }
  showBanDialog.value = true
}

const submitBan = async () => {
  if (!banForm.value.ip || !banForm.value.ip.trim()) {
    ElMessage.warning('请输入要封禁的IP')
    return
  }
  await banIpApi({ ip: banForm.value.ip.trim(), reason: banForm.value.reason || '管理员手动封禁' })
  ElMessage.success(`IP ${banForm.value.ip} 已封禁`)
  showBanDialog.value = false
  fetchBlacklist()
}

// 标签页切换时按需加载
const handleTabChange = (tab) => {
  if (tab === 'operation') fetchOperationLogs()
  else if (tab === 'login') fetchLoginLogs()
  else if (tab === 'error') fetchErrorLogs()
  else if (tab === 'rootEvent') fetchRootEvents()
  else if (tab === 'blacklist') fetchBlacklist()
}

onMounted(() => {
  fetchOperationLogs()
})
</script>

<template>
  <div class="log-container">
    <el-card shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 操作日志 -->
        <el-tab-pane label="操作日志" name="operation">
          <el-table :data="operationList" v-loading="operationLoading" border stripe>
            <el-table-column prop="creatorName" label="用户名" width="120" />
            <el-table-column prop="operation" label="操作" min-width="160" show-overflow-tooltip />
            <el-table-column label="类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.type === '0' ? 'warning' : 'primary'" size="small">
                  {{ operationTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="requestMethod" label="方式" width="80" align="center" />
            <el-table-column prop="requestUri" label="请求URI" min-width="180" show-overflow-tooltip />
            <el-table-column prop="ip" label="操作IP" width="130" />
            <el-table-column prop="requestTime" label="耗时(ms)" width="90" align="center" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="operationStatusType(row.status)" size="small">
                  {{ operationStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createDate" label="时间" width="170" />
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="operationPage"
              v-model:page-size="operationPageSize"
              :total="operationTotal"
              layout="total, prev, pager, next, jumper"
              @current-change="fetchOperationLogs"
            />
          </div>
        </el-tab-pane>

        <!-- 登录日志 -->
        <el-tab-pane label="登录日志" name="login">
          <el-table :data="loginList" v-loading="loginLoading" border stripe>
            <el-table-column prop="creatorName" label="用户名" width="150" />
            <el-table-column label="操作" width="110" align="center">
              <template #default="{ row }">{{ loginOperationText(row.operation) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="loginStatusType(row.status)" size="small">
                  {{ loginStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createDate" label="时间" width="200" />
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="loginPage"
              v-model:page-size="loginPageSize"
              :total="loginTotal"
              layout="total, prev, pager, next, jumper"
              @current-change="fetchLoginLogs"
            />
          </div>
        </el-tab-pane>

        <!-- 异常日志 -->
        <el-tab-pane label="异常日志" name="error">
          <el-table :data="errorList" v-loading="errorLoading" border stripe>
            <el-table-column prop="id" label="id" width="90" />
            <el-table-column prop="errorInfo" label="异常信息" min-width="300" show-overflow-tooltip />
            <el-table-column prop="creator" label="触发用户id" width="110" align="center">
              <template #default="{ row }">{{ row.creator ?? '未登录' }}</template>
            </el-table-column>
            <el-table-column prop="createDate" label="时间" width="170" />
            <el-table-column label="操作" width="90" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" plain @click="viewError(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="errorPage"
              v-model:page-size="errorPageSize"
              :total="errorTotal"
              layout="total, prev, pager, next, jumper"
              @current-change="fetchErrorLogs"
            />
          </div>
        </el-tab-pane>

        <!-- 管理员事件 -->
        <el-tab-pane label="管理员事件" name="rootEvent">
          <el-table :data="eventList" v-loading="eventLoading" border stripe>
            <el-table-column prop="eventDetail" label="事件内容" min-width="400" show-overflow-tooltip />
            <el-table-column prop="beginDate" label="开始时间" width="170" />
            <el-table-column prop="endDate" label="结束时间" width="170" />
            <el-table-column prop="createDate" label="记录时间" width="170" />
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="eventPage"
              v-model:page-size="eventPageSize"
              :total="eventTotal"
              layout="total, prev, pager, next, jumper"
              @current-change="fetchRootEvents"
            />
          </div>
        </el-tab-pane>

        <!-- IP黑名单管理 -->
        <el-tab-pane label="IP黑名单" name="blacklist">
          <div class="toolbar">
            <el-button type="danger" @click="openBanDialog">手动封禁IP</el-button>
            <el-button @click="fetchBlacklist">刷新</el-button>
          </div>
          <el-alert
            v-if="!blacklistLoading && !blacklist.some(b => b.status === 1)"
            type="info"
            :closable="false"
            show-icon
            title="当前没有封禁中的IP"
            description="下表为历史封禁记录（已解封）。新封禁的IP状态为“封禁中”，才会在操作列显示解封按钮。"
            style="margin-bottom: 12px;"
          />
          <el-table :data="blacklist" v-loading="blacklistLoading" border stripe>
            <el-table-column prop="id" label="id" width="70" />
            <el-table-column prop="ip" label="IP地址" width="160" />
            <el-table-column prop="reason" label="封禁原因" min-width="220" show-overflow-tooltip />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'danger' : 'info'" size="small">
                  {{ row.status === 1 ? '封禁中' : '已解封' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="banTime" label="封禁时间" width="170" />
            <el-table-column prop="unbanTime" label="解封时间" width="170">
              <template #default="{ row }">{{ row.unbanTime ?? '-' }}</template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="110" />
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 1"
                  type="success" size="small" plain @click="unban(row)">解封</el-button>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 异常详情弹窗 -->
    <el-dialog v-model="showErrorDialog" title="异常详情" width="70%">
      <el-descriptions v-if="errorDetail" :column="2" border>
        <el-descriptions-item label="id">{{ errorDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ errorDetail.createDate }}</el-descriptions-item>
        <el-descriptions-item label="触发用户id" :span="2">
          {{ errorDetail.creator ?? '未登录' }}
        </el-descriptions-item>
        <el-descriptions-item label="异常信息" :span="2">
          <pre class="error-pre">{{ errorDetail.errorInfo }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 手动封禁弹窗 -->
    <el-dialog v-model="showBanDialog" title="手动封禁IP" width="420px">
      <el-form label-width="80px">
        <el-form-item label="IP地址">
          <el-input v-model="banForm.ip" placeholder="如 192.168.1.100 / 10.0.0.* / 10.0.1.0/24" />
        </el-form-item>
        <el-form-item label="封禁原因">
          <el-input v-model="banForm.reason" type="textarea" placeholder="选填，默认为管理员手动封禁" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBanDialog = false">取 消</el-button>
        <el-button type="danger" @click="submitBan">封 禁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.log-container {
  padding: 16px;
}

.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.error-pre {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
  margin: 0;
  font-size: 12px;
}
</style>
