<script setup>
import { computed } from 'vue'
import { 
  Clock, 
  Star, 
  Picture,
  VideoPlay 
} from '@element-plus/icons-vue'

const props = defineProps({
  experiment: {
    type: Object,
    required: true,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showDescription: {
    type: Boolean,
    default: false
  },
  maxVisibleTags: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['click'])

// 计算可见标签（限制显示数量）；tags 兜底为数组，避免后端数据缺字段时渲染崩溃
const visibleTags = computed(() => {
  const tags = Array.isArray(props.experiment.tags) ? props.experiment.tags : []
  return tags.slice(0, props.maxVisibleTags)
})

// 根据标签内容返回不同的样式类型
const getTagType = (tag) => {
  const tagTypes = {
    '声学': 'warning',
    '光学': 'success',
    '热学': 'danger',
    '电学': 'primary'
  }
  return tagTypes[tag] || 'info'
}

// 处理点击事件
const handleClick = () => {
  if (!props.disabled) {
    emit('click', props.experiment)
  }
}
</script>

<template>
  <div 
    class="experiment-card"
    :class="{ 'card-hover': !disabled }"
    @click="handleClick"
  >
    <!-- 卡片内容容器 -->
    <div class="card-content">
      <!-- 头图区域 -->
      <div class="card-header">
        <div class="image-container">
          <!-- 使用Element Plus的图片组件，支持懒加载和错误处理 -->
          <el-image
            :src="experiment.coverImage"
            :alt="experiment.title"
            class="cover-image"
            fit="cover"
            :preview-src-list="[experiment.coverImage]"
            hide-on-click-modal
          >
            <!-- 图片加载时的占位符 -->
            <template #placeholder>
              <div class="image-placeholder">
                <div class="loading-spinner"></div>
              </div>
            </template>
            
            <!-- 图片加载失败的占位符 -->
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
                <span>图片加载失败</span>
              </div>
            </template>
          </el-image>
          
          <!-- 实验标签徽章 -->
          <div v-if="experiment.isNew" class="new-badge">NEW</div>
          <div v-if="experiment.isHot" class="hot-badge">HOT</div>
        </div>
        
        <!-- 实验时长和难度 -->
        <div class="experiment-meta">
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            {{ experiment.duration }}
          </span>
          <span class="meta-item">
            <el-icon><Star /></el-icon>
            {{ experiment.difficulty }}
          </span>
        </div>
      </div>
      
      <!-- 内容区域 -->
      <div class="card-body">
        <!-- 实验标题 -->
        <h3 class="experiment-title" :title="experiment.title">
          {{ experiment.title }}
        </h3>
        
        <!-- 实验描述（可选） -->
        <p v-if="showDescription" class="experiment-description">
          {{ experiment.description }}
        </p>
        
        <!-- 标签区域 -->
        <div class="tags-container">
          <el-tag
            v-for="(tag, index) in visibleTags"
            :key="index"
            size="small"
            class="experiment-tag"
            :type="getTagType(tag)"
          >
            {{ tag }}
          </el-tag>
          
          <!-- 更多标签提示 -->
          <span
            v-if="visibleTags.length > maxVisibleTags"
            class="more-tags"
            :title="`还有 ${visibleTags.length - maxVisibleTags} 个标签`"
          >
            +{{ visibleTags.length - maxVisibleTags }}
          </span>
        </div>
        
        <!-- Unity图标提示 -->
        <div class="unity-hint">
          <el-icon><VideoPlay /></el-icon>
          <span>点击启动Unity实验</span>
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>
.experiment-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  position: relative;
  border: 1px solid #e4e7ed;
}

/* 悬停效果 */
.card-hover:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  border-color: #409EFF;
}

.card-hover:hover .cover-image {
  transform: scale(1.05);
}

/* 卡片内容布局 */
.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 头部图片区域 */
.card-header {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.image-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.cover-image {
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease;
}

/* 图片占位符和错误状态 */
.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #f5f7fa, #e4e7ed);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}

.image-error .el-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

/* 实验元信息 */
.experiment-meta {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  color: white;
  font-size: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 徽章样式 */
.new-badge,
.hot-badge {
  position: absolute;
  top: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  z-index: 1;
}

.new-badge {
  left: 12px;
  background: linear-gradient(45deg, #67C23A, #85ce61);
}

.hot-badge {
  right: 12px;
  background: linear-gradient(45deg, #E6A23C, #ebb563);
}

/* 卡片主体内容 */
.card-body {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* 实验标题 */
.experiment-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #303133;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 实验描述 */
.experiment-description {
  font-size: 14px;
  color: #606266;
  margin: 0 0 16px 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

/* 标签容器 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  min-height: 28px;
}

.experiment-tag {
  border-radius: 12px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.experiment-tag:hover {
  transform: translateY(-2px);
}

.more-tags {
  font-size: 12px;
  color: #909399;
  cursor: help;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
}

/* Unity提示 */
.unity-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(45deg, #409EFF, #66b1ff);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-top: auto;
  transition: all 0.3s ease;
}

.card-hover:hover .unity-hint {
  background: linear-gradient(45deg, #66b1ff, #409EFF);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .card-header {
    height: 160px;
  }
  
  .card-body {
    padding: 16px;
  }
  
  .experiment-title {
    font-size: 16px;
  }
  
  .unity-hint {
    font-size: 13px;
    padding: 8px;
  }
}
</style>