<template>
  <div class="profile-card">
    <!-- 头像区域 -->
    <div class="avatar-wrapper">
      <div class="avatar-container" @click="triggerFileInput">
        <img :src="user.avatar" alt="用户头像" class="avatar" />
        <div class="avatar-overlay">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>{{ uploading ? '上传中...' : '更换头像' }}</span>
        </div>
      </div>
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        @change="handleFileChange"
        style="display: none"
      />
    </div>

    <!-- 用户信息 -->
    <div class="info-section">
      <h2 class="user-name">{{ user.name }}</h2>
      <p class="user-id">{{ idLabel }}：{{ user.id }}</p>
    </div>

    <!-- 修改密码入口 -->
    <el-button type="primary" plain class="change-pwd-btn" @click="openPwdDialog">
      修改密码
    </el-button>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="pwdDialogVisible"
      title="修改密码"
      width="440px"
      :close-on-click-modal="false"
      @closed="resetPwdForm"
    >
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="90px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入原密码"
            maxlength="32"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            show-password
            placeholder="6-20位，不能与原密码相同"
            maxlength="20"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
            maxlength="20"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdSubmitting" @click="submitPassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 提示信息 -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { uploadAvatarApi, updateAvatarApi, getAvatarApi, changePasswordApi } from '@/api/user'

const userStore = useUserStore()
const router = useRouter()

// ---------- 用户数据 ----------
const user = reactive({
  name: '',
  id: '',
  roleName: '',
  // 默认头像（SVG 占位图）
  avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Ccircle cx="60" cy="60" r="60" fill="%23e0e7ef" /%3E%3Ctext x="60" y="72" font-size="28" text-anchor="middle" fill="%236b7a8f" font-family="sans-serif"%3E👤%3C/text%3E%3C/svg%3E'
})

// 根据角色显示不同的ID标签
const idLabel = computed(() => {
  if (user.roleName === 'student') return '学号'
  if (user.roleName === 'teacher') return '工号'
  return '账号ID'
})

// ---------- 文件上传相关 ----------
const fileInput = ref(null) // 隐藏的 input 元素
const uploading = ref(false) // 上传中状态

// 消息反馈
const message = ref('')
const messageType = ref('') // 'success' 或 'error'

// ---------- 初始化: 加载当前登录用户信息与头像 ----------
onMounted(async () => {
  // 从登录缓存中获取当前用户信息
  const loginUser = userStore.getLoginUserInfo()
  if (loginUser) {
    user.name = loginUser.name || ''
    user.id = loginUser.id || ''
    user.roleName = loginUser.roleName || ''
  }

  // 优先显示本地缓存的头像
  if (userStore.avatar) {
    user.avatar = userStore.avatar
  }

  // 再从后端拉取最新头像url; 为空时也要覆盖本地残留, 避免显示上一个用户的头像
  if (user.id) {
    try {
      const res = await getAvatarApi(user.id)
      const avatarUrl = res?.data || ''
      user.avatar = avatarUrl
      userStore.setAvatar(avatarUrl)
    } catch (error) {
      console.error('拉取头像失败', error)
    }
  }
})

// 触发文件选择
const triggerFileInput = () => {
  if (uploading.value) return
  fileInput.value.click()
}

// 处理文件选择
const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 校验文件类型
  if (!file.type.startsWith('image/')) {
    showMessage('请选择图片文件', 'error')
    fileInput.value.value = ''
    return
  }

  // 校验文件大小（限制 2MB）
  if (file.size > 2 * 1024 * 1024) {
    showMessage('图片大小不能超过 2MB', 'error')
    fileInput.value.value = ''
    return
  }

  // 本地预览
  const reader = new FileReader()
  reader.onload = async (e) => {
    user.avatar = e.target.result
    // 上传至后端服务器
    await uploadAvatar(file)
    // 清空 input，以便重复选择同一文件
    fileInput.value.value = ''
  }
  reader.onerror = () => {
    showMessage('读取文件失败，请重试', 'error')
    fileInput.value.value = ''
  }
  reader.readAsDataURL(file)
}

// 上传头像: 图片文件上传至后端服务器, 返回的url保存到数据库
const uploadAvatar = async (file) => {
  uploading.value = true
  try {
    // 1. 上传图片文件到后端服务器
    const formData = new FormData()
    formData.append('avatar', file)
    const uploadRes = await uploadAvatarApi(formData)
    const avatarUrl = uploadRes?.data || ''
    if (!avatarUrl) {
      throw new Error('后端未返回头像url')
    }

    // 2. 将头像url更新到数据库
    await updateAvatarApi({ id: user.id, avatar: avatarUrl })

    // 3. 更新本地显示与缓存(layout头部同步刷新)
    user.avatar = avatarUrl
    userStore.setAvatar(avatarUrl)
    showMessage('头像更新成功 ✅', 'success')
  } catch (error) {
    console.error('头像上传失败', error)
    showMessage('头像上传失败，请检查后端服务后重试', 'error')
  } finally {
    uploading.value = false
  }
}

// ---------- 修改密码 ----------
const pwdDialogVisible = ref(false)
const pwdSubmitting = ref(false)
const pwdFormRef = ref(null)
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

const openPwdDialog = () => {
  pwdDialogVisible.value = true
}

// 对话框关闭后清空表单与校验痕迹
const resetPwdForm = () => {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdFormRef.value?.clearValidate()
}

const submitPassword = async () => {
  try {
    await pwdFormRef.value.validate()
  } catch (e) {
    return
  }
  try {
    await ElMessageBox.confirm(
      '确认修改密码吗？修改成功后需要重新登录。',
      '修改密码',
      { type: 'warning', confirmButtonText: '确认修改', cancelButtonText: '取消' }
    )
  } catch (e) {
    return
  }
  pwdSubmitting.value = true
  try {
    // 后端从登录令牌识别当前用户，只允许改自己的密码
    const r = await changePasswordApi({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    })
    if (r && r.code) {
      pwdDialogVisible.value = false
      ElMessage.success('密码修改成功，请重新登录')
      // 改密后强制重新登录：清空本地会话回到登录页
      setTimeout(() => {
        userStore.logout()
        router.push('/login')
      }, 800)
    } else {
      ElMessage.error(r?.msg || '密码修改失败')
    }
  } catch (e) {
    ElMessage.error('密码修改失败，请重试')
  } finally {
    pwdSubmitting.value = false
  }
}

// 辅助：显示提示消息（3秒后自动消失）
const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  clearTimeout(window.messageTimer)
  window.messageTimer = setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>

<style scoped>
/* ===== 卡片样式 ===== */
.profile-card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 32px;
  padding: 40px 32px 32px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.03);
  text-align: center;
  transition: transform 0.2s ease;
}

/* ===== 头像容器 ===== */
.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;
}

.avatar-container:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: filter 0.3s ease;
}

/* 悬浮蒙层 */
.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 50%;
  padding: 16px;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay svg {
  width: 32px;
  height: 32px;
  margin-bottom: 6px;
}

.avatar-overlay span {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* ===== 用户信息 ===== */
.info-section {
  margin-bottom: 12px;
}

.user-name {
  font-size: 26px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  letter-spacing: -0.3px;
}

.user-id {
  font-size: 16px;
  color: #64748b;
  background: #f1f5f9;
  display: inline-block;
  padding: 4px 18px;
  border-radius: 20px;
  margin-top: 4px;
  font-weight: 500;
}

/* ===== 修改密码入口 ===== */
.change-pwd-btn {
  margin-top: 8px;
  border-radius: 20px;
  padding: 18px 32px;
  font-weight: 500;
}

/* ===== 消息提示 ===== */
.message {
  margin-top: 20px;
  padding: 10px 16px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 500;
  background: #f1f5f9;
  color: #1e293b;
  transition: all 0.2s ease;
}

.message.success {
  background: #e6f7e6;
  color: #0d7c3f;
}

.message.error {
  background: #fee9e7;
  color: #b34033;
}

/* ===== 响应式微调 ===== */
@media (max-width: 480px) {
  .profile-card {
    padding: 28px 20px 24px;
  }
  .avatar-container {
    width: 100px;
    height: 100px;
  }
  .user-name {
    font-size: 22px;
  }
}
</style>
