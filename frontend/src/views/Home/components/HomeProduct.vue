<script setup>
import { ref, onMounted } from 'vue'
import HomePanel from './HomePanel.vue'
import GoodsItem from './GoodsItem.vue'
// === 导入 categoryStore ===
import { useCategoryStore } from '@/stores/categoryStore'

// === 创建 categoryStore 实例 ===
const categoryStore = useCategoryStore()

// === 直接从 store 中获取 categoryList ===
// 不需要再定义 goodsProduct，直接使用 store 的 categoryList
// const goodsProduct = ref([]) // 删除或注释掉这行

// === 修改 getGoods 函数，调用 store 的 getCategory 方法 ===
const getGoods = async () => {
  // 调用 store 的 getCategory 方法来获取数据
  // store 会处理数据获取和缓存
  await categoryStore.getCategory()
  // 数据现在存储在 categoryStore.categoryList 中
  console.log('HomeProduct.vue 从 store 获取到的分类数据:', categoryStore.categoryList);
  console.log('HomeProduct.vue 从 store 获取到的第一个分类的商品 ID:', categoryStore.categoryList[0]?.goods.map(g => g.id));
  console.log('>>> 确认 HomeProduct.vue 已更新，从 store 获取到的第一个商品 ID 格式:', categoryStore.categoryList[0]?.goods[0]?.id);
}

onMounted(getGoods)

// 分组函数：每4个商品为一组 (如果 HomeProduct 仍然需要分组，保留此函数)
// function chunk(arr, size) {
//   const res = []
//   for (let i = 0; i < arr.length; i += size) {
//     res.push(arr.slice(i, i + size))
//   }
//   return res
// }
</script>

<template>
  <div class="home-product">
    <!-- 如果 store 中的 categoryList 没有数据，显示加载提示 -->
    <div v-if="categoryStore.categoryList.length === 0" class="loading">加载中...</div>
    <!-- 遍历 store 中的 categoryList -->
    <HomePanel v-for="cate in categoryStore.categoryList" :title="cate.name" :key="cate.id">
      <ul class="goods-list">
        <!-- 遍历每个分类下的商品 -->
        <li v-for="good in cate.goods" :key="good.id">
          <GoodsItem :good="good" />
        </li>
      </ul>
    </HomePanel>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/common.scss" as *;
 // 添加这行以使用 $xtxColor 变量

.home-product {
  width: 100%;
  max-width: 1270px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 16px;
}

.goods-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  margin-top: 16px;  /* 增加与图片的距离 */
  margin-bottom: 16px; /* 增加与价格的距离 */
  padding: 0;
  list-style: none;

  li {
    width: calc(25% - 15px);
    background: #fff;
    transition: 0.4s;
    box-sizing: border-box;
  }
}
</style>