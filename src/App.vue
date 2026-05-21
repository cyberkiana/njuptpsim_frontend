<script setup>
import { useUserStore } from '@/stores/user'

// 初始化 store
const userStore = useUserStore()
</script>

<template>
  <router-view></router-view>
</template>

<style scoped>

</style>
