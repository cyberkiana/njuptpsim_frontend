<script setup>
import ExperimentCard from './expCard.vue'

const props = defineProps({
  experiments: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['card-click'])

// 处理卡片点击事件
const handleCardClick = (experiment) => {
  emit('card-click', experiment)
}
</script>

<template>
  <div class="experiment-list">
    <!-- 网格布局容器 -->
    <div class="experiment-grid">
      <ExperimentCard
        v-for="experiment in experiments"
        :key="experiment.id"
        :experiment="experiment"
        @click="handleCardClick(experiment)"
      />
    </div>
  </div>
</template>

<style scoped>
.experiment-list {
  margin-bottom: 40px;
}

.experiment-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 一排四个 */
  gap: 24px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .experiment-grid {
    grid-template-columns: repeat(3, 1fr); /* 大屏三列 */
  }
}

@media (max-width: 900px) {
  .experiment-grid {
    grid-template-columns: repeat(2, 1fr); /* 中屏两列 */
    gap: 20px;
  }
}

@media (max-width: 600px) {
  .experiment-grid {
    grid-template-columns: 1fr; /* 小屏一列 */
    gap: 16px;
  }
}
</style>