<template>
  <div class="experiment-detail-page">
    <!-- 页面头部：实验标题 + 返回 -->
    <div class="page-header">
      <el-button class="back-btn" :icon="ArrowLeft" @click="goBack">返回</el-button>
      <h1 class="experiment-title">WebGL 实验测试页面 - 梦幻粒子系统</h1>
    </div>

    <!-- 中央WebGL资源区 (来自egg文件夹的粒子系统) -->
    <div ref="webglRef" class="webgl-container">
      <!-- 控制面板 -->
      <div class="control-panel" v-if="showControls">
        <div class="control-group">
          <label>粒子数量: {{ particleCount }}</label>
          <input type="range" min="500" max="5000" step="100" v-model.number="particleCount" @input="updateParticleCount" />
        </div>
        <div class="control-group">
          <label>旋转速度: {{ rotationSpeed.toFixed(2) }}</label>
          <input type="range" min="0" max="0.02" step="0.0005" v-model.number="rotationSpeed" />
        </div>
        <div class="control-group">
          <label>粒子大小: {{ particleSize.toFixed(2) }}</label>
          <input type="range" min="0.02" max="0.3" step="0.005" v-model.number="particleSize" @input="updateParticleSize" />
        </div>
      </div>
      <button class="toggle-btn" @click="showControls = !showControls">
        {{ showControls ? '隐藏面板' : '显示面板' }}
      </button>
      <div class="title-overlay">
        <p>Three.js WebGL 粒子特效 · 实验测试</p>
      </div>
    </div>

    <!-- 说明 -->
    <div class="comments-section">
      <div class="comments-title">测试说明</div>
      <p class="test-tip">
        此页面为实验WebGL渲染测试页，使用 egg 文件夹内的梦幻粒子系统（Three.js）作为实验文件。
        可通过右上角面板调节粒子数量、旋转速度与粒子大小，鼠标移动可轻微旋转视角。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as THREE from 'three'

const router = useRouter()

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/stu/home')
  }
}

// 控制面板状态
const showControls = ref(true)
const particleCount = ref(2000)
const rotationSpeed = ref(0.005)
const particleSize = ref(0.08)

// WebGL相关
const webglRef = ref(null)
let scene, camera, renderer, particles, particleSystem
let animationId
let mouseX = 0, mouseY = 0
let targetRotationX = 0, targetRotationY = 0

// 颜色配置
const colors = [
  0xff3366, 0xff6633, 0xff9933, 0xffcc33, 0xff33cc,
  0x33ff66, 0x33ffcc, 0x33ccff, 0x3366ff, 0x9933ff,
  0xff33ff, 0x66ff33, 0x33ffff, 0xff66cc
]

// 创建粒子纹理 (圆形渐变)
const createParticleTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')

  ctx.beginPath()
  ctx.arc(16, 16, 14, 0, 2 * Math.PI)
  ctx.fillStyle = 'white'
  ctx.fill()

  ctx.globalCompositeOperation = 'source-over'
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 14)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(0.6, 'rgba(200,200,200,0.4)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)

  return new THREE.CanvasTexture(canvas)
}

// 初始化场景 (在容器内渲染, 不占用全屏)
const initScene = () => {
  const container = webglRef.value
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050b1a)
  scene.fog = new THREE.FogExp2(0x050b1a, 0.0008) // 雾效增强景深

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  camera.position.set(0, 2, 12)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  // 环境光与彩色点光源增加氛围
  const ambientLight = new THREE.AmbientLight(0x222222)
  scene.add(ambientLight)

  const light1 = new THREE.PointLight(0xff3366, 0.5, 20)
  light1.position.set(2, 3, 4)
  scene.add(light1)

  const light2 = new THREE.PointLight(0x33ff66, 0.5, 20)
  light2.position.set(-2, 1, 5)
  scene.add(light2)

  const light3 = new THREE.PointLight(0x3366ff, 0.5, 20)
  light3.position.set(1, -2, 6)
  scene.add(light3)

  // 微弱的地面参考线增强空间感
  const gridHelper = new THREE.GridHelper(20, 20, 0x88aaff, 0x335588)
  gridHelper.position.y = -3
  gridHelper.material.transparent = true
  gridHelper.material.opacity = 0.15
  scene.add(gridHelper)
}

// 创建粒子系统
const createParticleSystem = (count) => {
  if (particleSystem) {
    scene.remove(particleSystem)
    if (particleSystem.geometry) particleSystem.geometry.dispose()
    if (particleSystem.material) particleSystem.material.dispose()
  }

  const geometry = new THREE.BufferGeometry()

  // 位置数组与颜色数组
  const positions = new Float32Array(count * 3)
  const colorArray = new Float32Array(count * 3)

  // 生成粒子的位置: 70% 球体云团 + 15% 环状 + 15% 随机弥散
  for (let i = 0; i < count; i++) {
    let x, y, z
    const typeRand = Math.random()

    if (typeRand < 0.7) {
      // 球体分布 (半径范围 3 到 5.5)
      const radius = 3 + Math.random() * 2.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      x = radius * Math.sin(phi) * Math.cos(theta)
      y = radius * Math.sin(phi) * Math.sin(theta) * 0.8 // 稍微压扁，形成碟形
      z = radius * Math.cos(phi) * 1.2
    } else if (typeRand < 0.85) {
      // 环状分布 (圆环)
      const radius = 4.2
      const angle = Math.random() * Math.PI * 2
      const tilt = (Math.random() - 0.5) * 1.2
      x = Math.cos(angle) * radius
      z = Math.sin(angle) * radius
      y = Math.sin(angle * 3) * 1.2 + tilt * 0.8
    } else {
      // 随机弥散分布，增加梦幻感
      x = (Math.random() - 0.5) * 12
      y = (Math.random() - 0.5) * 8
      z = (Math.random() - 0.5) * 12 - 2
    }

    positions[i*3] = x
    positions[i*3+1] = y
    positions[i*3+2] = z

    // 颜色: 随机鲜艳色彩, 根据y轴高度微调亮度
    const colorChoice = colors[Math.floor(Math.random() * colors.length)]
    const r = ((colorChoice >> 16) & 0xff) / 255
    const g = ((colorChoice >> 8) & 0xff) / 255
    const b = (colorChoice & 0xff) / 255

    const brightness = 0.7 + (y + 3) / 10
    colorArray[i*3] = r * brightness
    colorArray[i*3+1] = g * brightness
    colorArray[i*3+2] = b * brightness
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))

  const particleTexture = createParticleTexture()

  const material = new THREE.PointsMaterial({
    size: particleSize.value,
    map: particleTexture,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  })

  particleSystem = new THREE.Points(geometry, material)
  scene.add(particleSystem)
}

// 更新粒子数量 (重新生成系统)
const updateParticleCount = () => {
  createParticleSystem(particleCount.value)
}

// 更新粒子大小
const updateParticleSize = () => {
  if (particleSystem && particleSystem.material) {
    particleSystem.material.size = particleSize.value
  }
}

// 鼠标交互 (让相机视角轻微跟随鼠标)
const handleMouseMove = (event) => {
  // 归一化坐标 -1 到 1
  mouseX = (event.clientX / window.innerWidth) * 2 - 1
  mouseY = (event.clientY / window.innerHeight) * 2 - 1

  // 目标旋转角度 (范围 -0.5 到 0.5 弧度)
  targetRotationX = mouseY * 0.5
  targetRotationY = mouseX * 0.5
}

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate)

  // 相机平滑跟随鼠标
  if (camera) {
    const targetX = targetRotationY * 1.2
    const targetY = targetRotationX * 0.8 + 0.2 // 略微上仰效果

    camera.position.x += (targetX - camera.position.x) * 0.05
    camera.position.y += (targetY - camera.position.y) * 0.05
    camera.lookAt(0, 0, 0)
  }

  // 粒子系统整体旋转 (产生缓慢流动感)
  if (particleSystem) {
    particleSystem.rotation.y += rotationSpeed.value
    particleSystem.rotation.x += rotationSpeed.value * 0.3
    particleSystem.rotation.z += rotationSpeed.value * 0.2
  }

  // 让点光源移动增加动态光效
  const time = Date.now() * 0.002
  if (scene && scene.children) {
    const lights = scene.children.filter(c => c instanceof THREE.PointLight)
    if (lights[0]) {
      lights[0].position.x = 2 + Math.sin(time) * 1.5
      lights[0].position.z = 4 + Math.cos(time * 0.7) * 1
    }
    if (lights[1]) {
      lights[1].position.y = 1 + Math.sin(time * 1.3) * 1.2
      lights[1].position.x = -2 + Math.cos(time * 0.9) * 1
    }
    if (lights[2]) {
      lights[2].position.z = 6 + Math.sin(time * 1.1) * 1.5
      lights[2].position.x = 1 + Math.cos(time * 0.5) * 1
    }
  }

  renderer.render(scene, camera)
}

// 容器尺寸适配
const handleResize = () => {
  if (!renderer || !camera || !webglRef.value) return
  const width = webglRef.value.clientWidth
  const height = webglRef.value.clientHeight
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

// 生命周期
onMounted(() => {
  initScene()
  createParticleSystem(particleCount.value)
  animate()

  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)
})

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)

  // 清理 Three.js 资源
  if (renderer) {
    renderer.dispose()
  }
  if (particleSystem) {
    if (particleSystem.geometry) particleSystem.geometry.dispose()
    if (particleSystem.material) particleSystem.material.dispose()
  }
  if (scene) {
    scene.traverse((object) => {
      if (object.isMesh) {
        object.geometry.dispose()
        if (object.material) object.material.dispose()
      }
    })
  }
})
</script>

<style scoped>
.experiment-detail-page {
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
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  flex-shrink: 0;
}

.experiment-title {
  font-size: 24px;
  font-weight: 600;
  color: #18191c;
  margin: 0;
  line-height: 1.4;
}

.webgl-container {
  position: relative;
  width: 100%;
  background: #050b1a;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.comments-section {
  background-color: #fff;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.comments-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2a3a;
  margin-bottom: 12px;
}

.test-tip {
  font-size: 15px;
  line-height: 1.8;
  color: #606266;
  margin: 0;
}

/* 控制面板样式 */
.control-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px 20px;
  color: white;
  font-size: 14px;
  z-index: 100;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  min-width: 180px;
  transition: opacity 0.3s ease;
}

.control-group {
  margin-bottom: 12px;
}

.control-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  opacity: 0.8;
  letter-spacing: 0.5px;
}

.control-group input {
  width: 100%;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  height: 3px;
  border-radius: 3px;
}

.control-group input:focus {
  outline: none;
}

.toggle-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  z-index: 101;
  transition: all 0.2s ease;
  font-family: inherit;
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.02);
}

/* 标题覆盖层 */
.title-overlay {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  text-align: center;
  pointer-events: none;
  z-index: 10;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.title-overlay p {
  margin: 8px 0 0;
  font-size: 0.85rem;
  opacity: 0.7;
  letter-spacing: 1px;
}

/* 响应式适配 */
@media (max-width: 600px) {
  .experiment-detail-page {
    padding: 12px;
  }
  .control-panel {
    padding: 12px 16px;
    min-width: 150px;
  }
  .toggle-btn {
    bottom: 16px;
    right: 16px;
    padding: 6px 12px;
    font-size: 10px;
  }
}
</style>
