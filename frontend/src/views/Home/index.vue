<script setup>
import HomeCategory from "@/views/Home/components/HomeCategory.vue";
import HomeBanner from "@/views/Home/components/HomeBanner.vue";
import HomeNew from "@/views/Home/components/HomeNew.vue";
import HomeHot from "@/views/Home/components/HomeHot.vue";
import HomeProduct from "@/views/Home/components/HomeProduct.vue";
import { ref, onMounted } from 'vue' // 移除 onActivated，如果没有使用
import { getHotList } from '@/mock/goods'
// ... 其他导入 ...

const products = ref([])

onMounted(async () => {
  const { result } = await getHotList(8)
  products.value = result
  // 注释掉恢复逻辑
  // restoreScrollPosition() // 移除或注释
})

// 注释掉整个 restoreScrollPosition 函数
// const restoreScrollPosition = () => {
//   const scrollPosition = sessionStorage.getItem('scrollPosition')
//   console.log('>>> 恢复滚动位置函数调用，读取的 scrollPosition:', scrollPosition)
//   if (scrollPosition) {
//     window.scrollTo({ top: parseInt(scrollPosition), behavior: 'smooth' })
//     console.log('>>> 滚动到位置:', parseInt(scrollPosition))
//     sessionStorage.removeItem('scrollPosition')
//     console.log('>>> sessionStorage 清除后内容:', sessionStorage.getItem('scrollPosition'))
//   } else {
//     console.warn('>>> 无保存的滚动位置，停留在顶部')
//   }
// }

// ... 其他代码保持不变 ...
</script>


<template>
  <div class="container">
    <HomeCategory />
    <HomeBanner />
  </div>
  <HomeNew />
  <HomeHot />
  <HomeProduct />
</template>

<style scoped lang="scss">
.container {
  display: flex; /* 使用 Flexbox 布局 */
  width: 1240px; /* 容器宽度 */
  margin: 0 auto; /* 居中 */
  height: 500px; /* 高度 */
}

.home-category {
  width: 250px; /* 分类栏宽度固定 */
}

.home-banner {
  flex: 1; /* 轮播图占用剩余空间 */
  height: 100%; /* 高度填满容器 */
}
</style>