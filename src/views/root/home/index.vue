<script setup>

</script>

<template>
  <div class="home-banner">
    <img class="home-banner__img" src="/banner.png" alt="banner">
  </div>
  <div class="home-hero"></div>
</template>

<style scoped>
.home-banner {
  width: 100%;
  height: 120px;
  background: linear-gradient(180deg, rgba(0, 60, 100, 1) 0%, rgba(0, 60, 100, 0.85) 100%);
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-sizing: border-box;
}
.home-banner__img {
  height: 60px;
  display: block;
}
.home-hero {
  width: 100%;
  height: calc(100vh - 80px);
  min-height: 400px;
  background-image: url('/library.jpg');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
}
</style>