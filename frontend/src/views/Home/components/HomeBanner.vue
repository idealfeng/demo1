<script setup>
import { ref } from 'vue' // 只保留需要的 ref

// 定义静态 banner 数据，增加到 5 张图
const bannerList = ref([
  { id: 1, imgUrl: '/轮播图1.png' }, // 示例：替换为实际图片路径，例如 '/assets/banner1.png'
  { id: 2, imgUrl: '/轮播图2.png' },
  { id: 3, imgUrl: '/轮播图3.png' },
  { id: 4, imgUrl: '/轮播图4.png' },
  { id: 5, imgUrl: '/轮播图5.png' },
  // 可以继续添加更多项。如果想用 home.js 中的 mock 图片风格，可以改为 { id: 6, imgUrl: '/category/nvzhuang-1.jpg' } 等。
])
</script>

<template>
  <div class="home-banner">
    <el-carousel height="500px">
      <el-carousel-item v-for="item in bannerList" :key="item.id">
        <img :src="item.imgUrl" alt="">
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<style scoped lang="scss">
.home-banner {
  width: 990px; /* 固定宽度为 990px */
  margin: 0 auto; /* 居中显示 */
  height: 500px; /* 高度保持一致 */

  // 添加媒体查询，适应响应式布局
  @media (max-width: 1200px) {
    width: 100%; /* 在小屏幕下占满宽度 */
    padding: 0 10px; /* 可选：添加内边距避免裁剪过紧 */
  }

  img {
    width: 100%; /* 图片宽度填满容器 */
    height: 100%; /* 图片高度填满容器，确保与轮播高度一致 */
    object-fit: cover; /* 保持图片比例，自动裁剪 */
  }
}
</style>