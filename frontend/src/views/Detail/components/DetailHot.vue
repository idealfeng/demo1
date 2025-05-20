<script setup>
import { ref } from 'vue' // 只保留 ref 的导入

// 移除 getHotGoodsAPI 和 useRoute 的导入
// import { getHotGoodsAPI } from '@/apis/detail'
// import { useRoute } from 'vue-router'

// 移除 getHotList 函数和 onMounted 钩子
// const route = useRoute()
// const getHotList = async () => {
//   const res = await getHotGoodsAPI({
//     id: route.params.id,
//     type: 1
//   })
//   goodList.value = res.result
// }
// onMounted(()=>getHotList())


// 直接在这里定义你的写死数据
const goodList = ref([
  {
    id: 1,
    picture: '/外套.jpg', // 替换为你的图片URL
    name: '三月七主题印象系列外套',
    desc: ' 三月微风中的温柔守护',
    price: 399
  },
  {
    id: 2,
    picture: '/耳机.jpg', // 替换为你的图片URL
    name: '知更鸟蓝牙耳机',
    desc: '清澈音色，佩戴舒适如云，悦耳每一刻。',
    price: 529
  },
  {
    id: 3,
    picture: '/单肩包.jpg', // 替换为你的图片URL
    name: '星期日单肩包',
    desc: '轻巧有型，装下日常小确幸，周末出行必备',
    price: 199
  }
  // 你可以根据需要添加更多商品数据
])
</script>


<template>
  <div class="goods-hot">
    <h3> 24小时热榜 </h3>
    <!-- 商品区块 -->
    <RouterLink :to="`/detail/${item.id}`" class="goods-item" v-for="item in goodList" :key="item.id">
      <img :src="item.picture" alt="" />
      <p class="name ellipsis">{{ item.name }}</p>
      <p class="desc ellipsis">{{ item.desc }}</p>
      <p class="price">&yen;{{ item.price }}</p>
    </RouterLink>
  </div>
</template>


<style scoped lang="scss">
@use "@/styles/common.scss" as *;

.goods-hot {
  h3 {
    height: 70px;
    background: $helpColor;
    color: #fff;
    font-size: 18px;
    line-height: 70px;
    padding-left: 25px;
    margin-bottom: 10px;
    font-weight: normal;
  }

  .goods-item {
    display: block;
    padding: 20px 30px;
    text-align: center;
    background: #fff;
    height: 320px; /* 你加上这一句，设置盒子高度，比如320px */

    img {
    width: 180px; // 宽度可以保持不变，或者你也可以同步调整
    height: 200px; // 改成你想要的高度
    object-fit: cover; // （建议加上）让图片裁剪而不是拉伸变形
    }


    p {
      padding-top: 10px;
    }

    .name {
      font-size: 16px;
    }

    .desc {
    color: #999;
    margin-bottom: 10px;
    overflow: hidden; /* 超出隐藏 */
    text-overflow: ellipsis; /* 超出显示... */
    white-space: nowrap; /* 不换行 */
    }



    .price {
      color: $priceColor;
      font-size: 20px;
    }
  }
    padding-bottom: 80px; /* 防止最后图片被底部导航栏压住 */
}
</style>