<template>
  <div class="particle-page">
    <!-- 可选的控制面板 -->
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
      <h1>✨ 梦幻粒子系统 ✨</h1>
      <p>Three.js WebGL 粒子特效</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'

// 控制面板状态
const showControls = ref(false)
const particleCount = ref(2000)
const rotationSpeed = ref(0.005)
const particleSize = ref(0.08)

// Three.js 相关变量
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

// 初始化场景
const initScene = () => {
  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050b1a)
  scene.fog = new THREE.FogExp2(0x050b1a, 0.0008) // 雾效增强景深

  // 创建相机 (透视相机)
  const container = document.querySelector('.particle-page')
  const width = window.innerWidth
  const height = window.innerHeight
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  camera.position.set(0, 2, 12)
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  document.querySelector('.particle-page').appendChild(renderer.domElement)

  // 添加一些环境中的辅助元素: 淡淡的星芒背景(通过一个巨大的球体纹理或简单点光源)
  const ambientLight = new THREE.AmbientLight(0x222222)
  scene.add(ambientLight)
  
  // 添加一些彩色点光源增加氛围
  const light1 = new THREE.PointLight(0xff3366, 0.5, 20)
  light1.position.set(2, 3, 4)
  scene.add(light1)
  
  const light2 = new THREE.PointLight(0x33ff66, 0.5, 20)
  light2.position.set(-2, 1, 5)
  scene.add(light2)
  
  const light3 = new THREE.PointLight(0x3366ff, 0.5, 20)
  light3.position.set(1, -2, 6)
  scene.add(light3)
  
  // 可选: 添加一个简单的网格地板(半透明)增强空间感, 但不必须, 为了美观加一个微弱的地面参考线
  const gridHelper = new THREE.GridHelper(20, 20, 0x88aaff, 0x335588)
  gridHelper.position.y = -3
  gridHelper.material.transparent = true
  gridHelper.material.opacity = 0.15
  scene.add(gridHelper)
  
  // 添加一个极简的轴辅助(可选)
  // const axesHelper = new THREE.AxesHelper(5)
  // scene.add(axesHelper) // 调试用, 正式环境注释
}

// 创建粒子系统
const createParticleSystem = (count) => {
  if (particleSystem) {
    scene.remove(particleSystem)
    if (particleSystem.geometry) particleSystem.geometry.dispose()
    if (particleSystem.material) particleSystem.material.dispose()
  }
  
  // 创建几何体
  const geometry = new THREE.BufferGeometry()
  
  // 位置数组
  const positions = new Float32Array(count * 3)
  // 颜色数组
  const colorArray = new Float32Array(count * 3)
  
  // 生成粒子的位置: 分布在球体、环状或随机云团中，这里采用混合分布：主要球壳 + 部分螺旋/随机
  for (let i = 0; i < count; i++) {
    // 决定分布类型: 70% 球体云团, 30% 环状
    let x, y, z
    const typeRand = Math.random()
    
    if (typeRand < 0.7) {
      // 球体分布 (半径范围 2.5 到 5.5)
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
    
    // 颜色: 根据位置和随机生成鲜艳色彩
    const colorChoice = colors[Math.floor(Math.random() * colors.length)]
    const r = ((colorChoice >> 16) & 0xff) / 255
    const g = ((colorChoice >> 8) & 0xff) / 255
    const b = (colorChoice & 0xff) / 255
    
    // 根据y轴高度微调亮度
    const brightness = 0.7 + (y + 3) / 10
    colorArray[i*3] = r * brightness
    colorArray[i*3+1] = g * brightness
    colorArray[i*3+2] = b * brightness
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))
  
  // 创建纹理
  const particleTexture = createParticleTexture()
  
  // 粒子材质
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
    // 当前相机看向点的偏移
    const currentX = camera.position.x
    const currentY = camera.position.y
    // 让相机围绕场景中心做轻微摆动
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
  if (scene.children) {
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

// 窗口尺寸适配
const handleResize = () => {
  if (!renderer || !camera) return
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

// 监听粒子大小变化
watch(particleSize, () => {
  updateParticleSize()
})

// 监听旋转速度变化 (无需额外操作，动画中已使用响应式值)

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
.particle-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #050b1a;
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
  top: 30px;
  left: 0;
  right: 0;
  text-align: center;
  pointer-events: none;
  z-index: 10;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.title-overlay h1 {
  font-size: 1.8rem;
  margin: 0;
  font-weight: 600;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #fff, #aaccff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: none;
}

.title-overlay p {
  margin: 8px 0 0;
  font-size: 0.85rem;
  opacity: 0.7;
  letter-spacing: 1px;
}

/* 响应式适配 */
@media (max-width: 600px) {
  .control-panel {
    padding: 12px 16px;
    min-width: 150px;
  }
  .title-overlay h1 {
    font-size: 1.2rem;
  }
  .title-overlay p {
    font-size: 0.7rem;
  }
  .toggle-btn {
    bottom: 16px;
    right: 16px;
    padding: 6px 12px;
    font-size: 10px;
  }
}
</style>