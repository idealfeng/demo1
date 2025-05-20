<script setup>
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus' // 导入消息提示组件

const props = defineProps({
  good: {
    type: Object,
    default: () => ({})
  }
})

const router = useRouter()

// 点击事件处理：检查登录状态后再决定是否跳转
const handleClick = () => {
  if (!props.good || !props.good.id) return
  
  // 修改这一行，使用正确的键名
  const token = localStorage.getItem('token_sicau')
  if (!token) {
    ElMessage.warning('请先登录后查看商品详情')
    return
  }
  
  const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
  sessionStorage.setItem('scrollPosition', scrollPosition)
  router.push({ path: `/detail/${props.good.id}` })
}
</script>

<template>
  <div v-if="good && good.id" class="goods-item" @click="handleClick">
    <img :src="good.picture" :alt="good.name || ''" />
    <p class="name ellipsis">{{ good.name }}</p>
    <p class="desc ellipsis">{{ good.desc }}</p>
    <p class="price">¥{{ good.price }}</p>
  </div>
</template>

<!-- style 部分保持原样，确保 .goods-item 有 cursor: pointer; -->

<style scoped lang="scss">
@use "@/styles/common.scss" as *;
 // 添加这行以使用 $xtxColor 变量

.goods-item {
  display: block;
  width: 100%;
  height: 100%;
  padding: 10px;
  text-align: left;
  box-sizing: border-box;
  transition: .4s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, .2);
  }

  img {
    width: 100%;
    height: 240px;
    object-fit: contain;
    background: #eee;
    margin-bottom: 10px;
  }

  p {
    margin: 0 0 6px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name {
    font-size: 16px;
    color: #333;
  }

  .desc {
    font-size: 14px;
    color: #999;
  }

  .price {
    font-size: 18px;
    color: $priceColor;
    font-weight: 700;
  }
}

.placeholder {
  text-align: center;
  color: #999;
  padding: 10px;
  font-size: 14px;
}
</style>