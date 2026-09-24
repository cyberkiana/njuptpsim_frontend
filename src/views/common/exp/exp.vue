<template>
  <!-- 返回按钮独立于实验内容区之外, 避免与标题重合 -->
  <div class="detail-page-wrapper">
    <div class="back-bar">
      <el-button class="back-btn" :icon="ArrowLeft" @click="goBackToList">返回</el-button>
    </div>

  <div class="experiment-detail-page">
    <!-- 页面头部：实验标题 -->
    <div class="page-header">
      <h1 class="experiment-title">{{ expInfo.title || '加载中...' }}</h1>
    </div>

    <!-- 中央WebGL资源区 -->
    <div class="webgl-container">
      <div ref="webglRef" class="webgl-canvas"></div>
    </div>

    <!-- 互动按钮区：点赞 / 十分简单 / 十分困难（每用户三选一, 仅能评价一次） -->
    <div class="action-buttons">
      <el-button
        :icon="Share"
        :loading="actionLoading"
        :disabled="!!myEvaluation"
        :type="myEvaluation === 'likes' ? 'primary' : 'default'"
        @click="handleEvaluation('likes')"
      >
        👍 点赞 {{ expInfo.likes }}
      </el-button>
      <el-button
        :loading="actionLoading"
        :disabled="!!myEvaluation"
        :type="myEvaluation === 'easy' ? 'success' : 'default'"
        @click="handleEvaluation('easy')"
      >
        😊 十分简单 {{ expInfo.easyCount }}
      </el-button>
      <el-button
        :loading="actionLoading"
        :disabled="!!myEvaluation"
        :type="myEvaluation === 'hard' ? 'danger' : 'default'"
        @click="handleEvaluation('hard')"
      >
        😭 十分困难 {{ expInfo.hardCount }}
      </el-button>
      <el-tag v-if="myEvaluation" type="success" effect="light" size="small" class="evaluated-tip">
        已评价：{{ myEvaluationText }}
      </el-tag>
    </div>

    <!-- 实验完成横幅：WebGL实验运行结束(收到完成消息)后自动提交成绩并展示 -->
    <div v-if="completedInfo" class="complete-banner">
      🎉 恭喜完成实验！成绩：<b>{{ completedInfo.score }}</b> 分，已自动记入成绩单
    </div>

    <!-- 评论区 -->
    <div class="comments-section">
      <!-- 评论头部：总数 + 排序 -->
      <div class="comments-header">
        <div class="comments-title">
          评论 <span class="total-count">({{ totalCommentsAndReplies }})</span>
        </div>
        <div class="sort-options">
          <el-radio-group v-model="sortType" size="small" @change="sortComments">
            <el-radio-button label="time">按时间</el-radio-button>
            <el-radio-button label="likes">按点赞数</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 评论输入框 -->
      <div class="comment-input-area">
        <el-avatar :size="36" :src="currentUser.avatar" class="avatar" />
        <div class="input-wrapper">
          <el-input
            v-model="newCommentContent"
            type="textarea"
            :rows="2"
            placeholder="发一条友善的评论..."
            resize="none"
          />
          <el-button
            type="primary"
            class="send-btn"
            :loading="sendingComment"
            @click="sendComment"
          >
            发送
          </el-button>
        </div>
      </div>

      <!-- 评论列表 -->
      <div class="comments-list">
        <div v-for="comment in sortedComments" :key="comment.id" class="comment-item">
          <!-- 评论主体 -->
          <div class="comment-main">
            <el-avatar :size="36" :src="comment.avatar" class="avatar" />
            <div class="comment-content-wrapper">
              <div class="comment-info">
                <span class="username">{{ comment.userName }}</span>
                <span class="time">{{ formatTime(comment.time) }}</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-actions">
                <span class="likes" @click="likeComment(comment.id, comment.likes)">
                  ❤️ {{ comment.likes }}
                </span>
                <span class="reply-btn" @click="toggleReplyInput(comment.id, null, comment.userName)">
                  💬 回复
                </span>
              </div>
              <!-- 回复评论的输入框 -->
              <div v-if="activeReplyTarget && activeReplyTarget.commentId === comment.id && !activeReplyTarget.replyId" class="reply-input-area">
                <el-input
                  v-model="replyContent"
                  type="textarea"
                  :rows="1"
                  placeholder="输入回复内容..."
                  resize="none"
                />
                <el-button type="primary" size="small" @click="sendReply(comment.id, null, null)">发送</el-button>
              </div>
            </div>
          </div>

          <!-- 回复列表 -->
          <div v-if="comment.replies && comment.replies.length" class="replies-list">
            <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
              <el-avatar :size="28" :src="reply.avatar" class="avatar-small" />
              <div class="reply-content-wrapper">
                <div class="reply-info">
                  <span class="username">{{ reply.userName }}</span>
                  <span class="time">{{ formatTime(reply.time) }}</span>
                </div>
                <div class="reply-text">
                  <span v-if="reply.repliedUserName" class="reply-tip">回复 @{{ reply.repliedUserName }} :</span>
                  {{ reply.content }}
                </div>
                <div class="reply-actions">
                  <span class="likes" @click="likeReply(comment.id, reply.id, reply.likes)">
                    ❤️ {{ reply.likes }}
                  </span>
                  <span class="reply-btn" @click="toggleReplyInput(comment.id, reply.id, reply.userName)">
                    💬 回复
                  </span>
                </div>
                <!-- 回复回复的输入框 -->
                <div v-if="activeReplyTarget && activeReplyTarget.commentId === comment.id && activeReplyTarget.replyId === reply.id" class="reply-input-area nested">
                  <el-input
                    v-model="replyContent"
                    type="textarea"
                    :rows="1"
                    placeholder="输入回复内容..."
                    resize="none"
                  />
                  <el-button type="primary" size="small" @click="sendReply(comment.id, reply.id, reply.userName)">发送</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="sortedComments.length === 0" class="empty-comments">
          暂无评论，快来抢沙发～
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Share } from '@element-plus/icons-vue'
import * as THREE from 'three'
import {
  getExpDetailApi,
  updateEvaluationApi,
  getMyEvaluationApi,
  completeExpApi,
  getCommentsApi,
  getRepliesApi,
  postCommentApi,
  postReplyApi,
  likeCommentApi,
  likeReplyApi
} from '@/api/experiment'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()

// 返回实验资源列表页: 当前路径去掉末段实验id
const goBackToList = () => {
  const base = route.path.replace(/\/[^/]+$/, '')
  router.push(base)
}

const userStore = useUserStore()

// ==================== 常量配置 ====================
// 从路由参数获取实验ID, 如 /stu/exp/1
const expId = Number(route.params.id) || 1

// 当前用户信息 (从store或localStorage获取)
const currentUser = ref({
  id: '',
  userName: '',
  avatar: ''
})

// ==================== 组件状态 ====================
// 评价文案映射
const myEvaluationText = computed(() => ({
  likes: '点赞支持！',
  easy: '非常简单！',
  hard: '十分困难！'
}[myEvaluation.value]))

const expInfo = reactive({
  title: '',
  url: '',
  likes: 0,
  easyCount: 0,
  hardCount: 0
})
const comments = ref([])
const sortType = ref('time')
const actionLoading = ref(false)
const sendingComment = ref(false)
const newCommentContent = ref('')

// 我的评价(likes/easy/hard/null)：非空表示已评价, 不可重复
const myEvaluation = ref(null)
// 学生完成实验
const isStudent = (JSON.parse(localStorage.getItem('loginUser') || 'null') || {}).roleName === 'student'
const stuId = isStudent ? (JSON.parse(localStorage.getItem('loginUser') || 'null') || {}).id : ''

// 回复相关状态
const replyContent = ref('')
const activeReplyTarget = ref(null)

// WebGL相关
const webglRef = ref(null)
let scene, camera, renderer, cube

// ==================== 辅助函数 ====================
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 3600 * 1000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 24 * 3600 * 1000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 24 * 3600 * 1000) return `${Math.floor(diff / 86400000)}天前`
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// 计算评论+回复总数
const totalCommentsAndReplies = computed(() => {
  let total = comments.value.length
  for (const c of comments.value) {
    total += (c.replies?.length || 0)
  }
  return total
})

// 排序后的评论
const sortedComments = computed(() => {
  const list = [...comments.value]
  if (sortType.value === 'time') {
    return list.sort((a, b) => new Date(b.time) - new Date(a.time))
  } else {
    return list.sort((a, b) => b.likes - a.likes)
  }
})

const sortComments = () => {
  // 触发computed更新
}

// ==================== API交互方法 ====================
// 加载实验详情
const loadExpDetail = async () => {
  try {
    const res = await getExpDetailApi(expId)
    Object.assign(expInfo, res.data || res)
    initWebGL(expInfo.url)
  } catch (error) {
    ElMessage.error('加载实验详情失败')
    console.error(error)
  }
}

// 加载评论及回复
const loadComments = async () => {
  try {
    // 获取评论列表
    const commentsRes = await getCommentsApi(expId)
    const commentList = commentsRes.data || commentsRes
    
    // 为每个评论加载对应的回复
    const enrichedComments = await Promise.all(
      commentList.map(async (comment) => {
        try {
          const repliesRes = await getRepliesApi(expId, comment.id)
          comment.replies = repliesRes.data || repliesRes
        } catch (error) {
          comment.replies = []
        }
        return comment
      })
    )
    comments.value = enrichedComments
  } catch (error) {
    ElMessage.error('加载评论失败')
    console.error(error)
  }
}

// 点赞/简单/困难：每用户仅能三选一评价一次（选择后不可更改）
const handleEvaluation = async (type) => {
  if (myEvaluation.value) {
    ElMessage.warning('您已评价过该实验，不能重复评价')
    return
  }
  actionLoading.value = true
  try {
    // 后端按 type 记录评价归属并计数+1
    await updateEvaluationApi(expId, { type })
    myEvaluation.value = type

    // 更新本地数据
    if (type === 'likes') expInfo.likes++
    else if (type === 'easy') expInfo.easyCount++
    else if (type === 'hard') expInfo.hardCount++

    ElMessage.success('评价成功')
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  } finally {
    actionLoading.value = false
  }
}

// 学生完成WebGL实验: 实验运行结束时由实验页面向宿主页面 postMessage,
// 本页监听消息后自动提交成绩到 completions 表（同一任务仅记录一次）。
// 消息约定：event.data = { type: 'experimentComplete', score: 0~100 }（score可省略, 默认100）
const completedInfo = ref(null)   // { score } 完成后展示
const handleExpMessage = async (event) => {
  if (!isStudent) return
  let data = event.data
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch (e) { return }
  }
  if (!data || data.type !== 'experimentComplete') return
  if (completedInfo.value) return   // 已提交过, 防重复

  const score = Math.max(0, Math.min(100, Number(data.score) || 100))
  try {
    const res = await completeExpApi(stuId, expId, score)
    if (res && res.code) {
      completedInfo.value = { score: res.data.score ?? score }
    } else {
      ElMessage.warning(res?.msg || '成绩记录失败')
    }
  } catch (error) {
    ElMessage.warning(error?.response?.data?.msg || '成绩记录失败，请重试')
  }
}

// 点赞评论
const likeComment = async (commentId, currentLikes) => {
  try {
    await likeCommentApi(expId, commentId, { likes: currentLikes + 1 })
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) comment.likes++
    ElMessage.success('点赞成功')
  } catch (error) {
    ElMessage.error('点赞失败')
  }
}

// 点赞回复
const likeReply = async (commentId, replyId, currentLikes) => {
  try {
    await likeReplyApi(expId, commentId, replyId, { likes: currentLikes + 1 })
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      const reply = comment.replies.find(r => r.id === replyId)
      if (reply) reply.likes++
    }
    ElMessage.success('点赞回复成功')
  } catch (error) {
    ElMessage.error('点赞回复失败')
  }
}

// 发送评论
const sendComment = async () => {
  if (!newCommentContent.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  if (!currentUser.value.id) {
    ElMessage.warning('请先登录')
    return
  }
  
  sendingComment.value = true
  try {
    await postCommentApi(expId, {
      userId: currentUser.value.id,
      time: new Date().toISOString(),
      content: newCommentContent.value
    })
    await loadComments()
    newCommentContent.value = ''
    ElMessage.success('评论发布成功')
  } catch (error) {
    ElMessage.error('发布失败，请重试')
  } finally {
    sendingComment.value = false
  }
}

// 切换回复输入框
const toggleReplyInput = (commentId, replyId, repliedUserName) => {
  if (activeReplyTarget.value && activeReplyTarget.value.commentId === commentId && activeReplyTarget.value.replyId === replyId) {
    activeReplyTarget.value = null
    replyContent.value = ''
  } else {
    activeReplyTarget.value = { commentId, replyId, repliedUserName }
    replyContent.value = ''
  }
}

// 发送回复
const sendReply = async (commentId, replyId, repliedUserName) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }
  if (!currentUser.value.id) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    await postReplyApi(expId, commentId, {
      userId: currentUser.value.id,
      time: new Date().toISOString(),
      content: replyContent.value,
      repliedUserName: replyId ? repliedUserName : null
    })
    await loadComments()
    activeReplyTarget.value = null
    replyContent.value = ''
    ElMessage.success('回复成功')
  } catch (error) {
    ElMessage.error('回复失败，请重试')
  }
}

// ==================== WebGL初始化 ====================
const initWebGL = (url) => {
  if (!webglRef.value) return
  if (renderer) {
    renderer.dispose()
    webglRef.value.innerHTML = ''
  }
  
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050b1a)
  camera = new THREE.PerspectiveCamera(45, webglRef.value.clientWidth / webglRef.value.clientHeight, 0.1, 1000)
  camera.position.set(2, 2, 5)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(webglRef.value.clientWidth, webglRef.value.clientHeight)
  webglRef.value.appendChild(renderer.domElement)

  const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2)
  const material = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.3, metalness: 0.7 })
  cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  const wireframeGeo = new THREE.EdgesGeometry(geometry)
  const wireframeMat = new THREE.LineBasicMaterial({ color: 0xffffff })
  const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat)
  cube.add(wireframe)

  const ambientLight = new THREE.AmbientLight(0x404060)
  scene.add(ambientLight)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(1, 2, 1)
  scene.add(dirLight)
  const backLight = new THREE.PointLight(0x2266ff, 0.5)
  backLight.position.set(-1, 1, -2)
  scene.add(backLight)

  const particlesGeometry = new THREE.BufferGeometry()
  const particlesCount = 800
  const posArray = new Float32Array(particlesCount * 3)
  for (let i = 0; i < particlesCount; i++) {
    posArray[i*3] = (Math.random() - 0.5) * 8
    posArray[i*3+1] = (Math.random() - 0.5) * 5
    posArray[i*3+2] = (Math.random() - 0.5) * 8 - 2
  }
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
  const particlesMaterial = new THREE.PointsMaterial({ color: 0x88aaff, size: 0.05 })
  const particles = new THREE.Points(particlesGeometry, particlesMaterial)
  scene.add(particles)

  let animateId
  const animate = () => {
    animateId = requestAnimationFrame(animate)
    cube.rotation.x += 0.005
    cube.rotation.y += 0.01
    particles.rotation.y += 0.002
    renderer.render(scene, camera)
  }
  animate()

  const handleResize = () => {
    if (webglRef.value) {
      const width = webglRef.value.clientWidth
      const height = webglRef.value.clientHeight
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
  }
  window.addEventListener('resize', handleResize)
  
  const cleanup = () => {
    window.removeEventListener('resize', handleResize)
    cancelAnimationFrame(animateId)
    renderer.dispose()
  }
  webglRef.value._cleanup = cleanup
}

// ==================== 生命周期 ====================
// 获取当前用户信息 (从登录缓存与store中获取)
const getCurrentUser = () => {
  const loginUser = userStore.getLoginUserInfo()
  currentUser.value = {
    id: loginUser?.id || '',
    userName: loginUser?.name || '',
    avatar: userStore.avatar || ''
  }
}

onMounted(async () => {
  getCurrentUser()
  await loadExpDetail()
  await loadComments()
  // 加载我的评价状态（已评价则按钮置灰并高亮所选项）
  if (isStudent) {
    try {
      const res = await getMyEvaluationApi(expId)
      myEvaluation.value = res?.data || null
    } catch (e) { /* 未评价时忽略 */ }
  }

  // 监听WebGL实验发来的“实验完成”消息, 自动提交成绩
  window.addEventListener('message', handleExpMessage)
  nextTick(() => {
    if (webglRef.value) {
      const resizeObserver = new ResizeObserver(() => {
        if (renderer && webglRef.value) {
          const width = webglRef.value.clientWidth
          const height = webglRef.value.clientHeight
          renderer.setSize(width, height)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
        }
      })
      resizeObserver.observe(webglRef.value)
      webglRef.value._resizeObserver = resizeObserver
    }
  })
})

import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  window.removeEventListener('message', handleExpMessage)
})
onBeforeUnmount(() => {
  if (webglRef.value && webglRef.value._cleanup) {
    webglRef.value._cleanup()
  }
  if (webglRef.value && webglRef.value._resizeObserver) {
    webglRef.value._resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.evaluated-tip {
  font-size: 12px;
  margin-left: 8px;
}


.complete-banner {
  margin: 0 auto 16px;
  max-width: 640px;
  padding: 14px 20px;
  background: #f0f9eb;
  border: 1px solid #67c23a;
  border-radius: 12px;
  color: #529b2e;
  font-size: 16px;
}

.detail-page-wrapper {
  min-height: 100vh;
  background-color: #eef1f6;
}

.back-bar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px 0;
}

.back-btn {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.experiment-detail-page {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 24px;
  background-color: #f8f9fc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.page-header {
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e9ef;
  padding-bottom: 12px;
}
.experiment-title {
  font-size: 24px;
  font-weight: 600;
  color: #18191c;
  margin: 0;
  line-height: 1.4;
}

.webgl-container {
  width: 100%;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.webgl-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
}
.action-buttons .el-button {
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 40px;
  background-color: #fff;
  border: 1px solid #e3e5e9;
  transition: all 0.2s;
}
.action-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.comments-section {
  background-color: #fff;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.comments-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2a3a;
}
.total-count {
  font-weight: normal;
  color: #6c757d;
  font-size: 16px;
  margin-left: 4px;
}
.sort-options .el-radio-group {
  background: #f1f2f6;
  border-radius: 20px;
}
.comment-input-area {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
}
.avatar {
  flex-shrink: 0;
}
.input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.send-btn {
  align-self: flex-end;
  width: 80px;
}
.comments-list {
  margin-top: 8px;
}
.comment-item {
  border-bottom: 1px solid #eef2f6;
  padding: 20px 0;
}
.comment-main {
  display: flex;
  gap: 14px;
}
.comment-content-wrapper {
  flex: 1;
}
.comment-info {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}
.username {
  font-weight: 600;
  color: #1e2a3a;
  font-size: 14px;
}
.time {
  font-size: 12px;
  color: #99a2aa;
}
.comment-text {
  font-size: 15px;
  line-height: 1.5;
  color: #181c23;
  margin: 8px 0 12px;
}
.comment-actions {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #6c757d;
}
.likes {
  cursor: pointer;
  transition: color 0.2s;
}
.likes:hover {
  color: #ff4d4f;
}
.reply-btn {
  cursor: pointer;
  transition: color 0.2s;
}
.reply-btn:hover {
  color: #00aeec;
}
.replies-list {
  margin-left: 50px;
  margin-top: 16px;
  padding-left: 16px;
  border-left: 2px solid #e9ecef;
}
.reply-item {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.avatar-small {
  flex-shrink: 0;
}
.reply-content-wrapper {
  flex: 1;
}
.reply-info {
  display: flex;
  gap: 12px;
  align-items: baseline;
  margin-bottom: 4px;
}
.reply-text {
  font-size: 14px;
  color: #2c3e4e;
  margin: 4px 0 8px;
}
.reply-tip {
  color: #00aeec;
  font-weight: 500;
  margin-right: 6px;
}
.reply-actions {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #8a99aa;
}
.reply-input-area {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  background-color: #f9fafc;
  padding: 10px 12px;
  border-radius: 12px;
}
.reply-input-area.nested {
  margin-left: 0;
  background-color: #f4f6fa;
}
.reply-input-area .el-input {
  flex: 1;
}
.reply-input-area .el-button {
  height: 32px;
}
.empty-comments {
  text-align: center;
  padding: 40px 0;
  color: #99a2aa;
}

@media (max-width: 768px) {
  .experiment-detail-page {
    padding: 12px;
  }
  .comments-section {
    padding: 16px;
  }
  .replies-list {
    margin-left: 20px;
  }
  .action-buttons {
    gap: 8px;
  }
  .action-buttons .el-button {
    padding: 6px 12px;
    font-size: 14px;
  }
}
</style>