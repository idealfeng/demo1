// HomeNew.vue
<script setup>
import { ref, onMounted } from 'vue';
import { getNewList } from '@/mock/goods';
// import HomePanel from './HomePanel.vue'; // HomePanel 应该在父组件 Home/index.vue 中使用
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user'; // 1. 导入 userStore
import { storeToRefs } from 'pinia';         // 2. 导入 storeToRefs

const router = useRouter();
const newList = ref([]);
const userStore = useUserStore(); // 3. 获取 userStore 实例
const { isLoggedIn } = storeToRefs(userStore); // 4. 获取响应式的 isLoggedIn

const goToDetail = (id) => {
  if (isLoggedIn.value) { // 5. 使用 isLoggedIn.value
    router.push(`/detail/${id}`);
  } else {
    ElMessage.warning('请先登录才能查看商品详情');
    // router.push({ name: 'login', query: { redirect: `/detail/${id}` } });
  }
};

onMounted(async () => {
  try {
    const { result } = await getNewList();
    if (result && Array.isArray(result)) {
      newList.value = result.filter(item => item && item.id);
    } else {
      console.error("API 返回数据格式不正确或为空:", result);
      newList.value = [];
    }
  } catch (error) {
    console.error("获取新鲜好物失败:", error);
    newList.value = [];
  }
});
</script>

<template>
  <HomePanel>
    <div class="home-new">
      <div class="home-new-header">
        <h2 class="home-panel-title">新鲜好物</h2>
        <p class="home-panel-sub-title">新鲜出炉 品质靠谱</p>
      </div>
      <ul class="goods-list" v-if="newList && newList.length > 0">
        <li v-for="(item, index) in newList" :key="item?.id ?? index">
          <!-- 替换RouterLink为a标签和点击处理函数 -->
          <a v-if="item && item.id" href="javascript:;" @click.prevent="goToDetail(item.id)" class="goods-item">
            <img :src="item.picture" alt="" />
            <p class="name">{{ item.name }}</p>
            <p class="price">&yen;{{ item.price }}</p>
          </a>
        </li>
      </ul>
      <div v-else class="no-data">暂无新鲜好物，加载中...</div>
    </div>
  </HomePanel>
</template>

<style scoped lang="scss">
@use "@/styles/common.scss" as *;


/* 整体容器 */
.home-new {
  width: 100%;
  max-width: 1270px;
  /* 设置最大宽度 */
  margin: 0 auto;
  /* 居中容器 */
  padding: 0 0px;
  /* 设置左右内边距 */
}

/* 标题容器 */
.home-new-header {
  text-align: left;
  /* 标题和副标题居中 */
  margin-bottom: 20px;
  /* 标题与图片列表的间距 */
}

.home-panel-title {
  font-size: 24px;
  /* 设置标题字体大小 */
  font-weight: bold;
  /* 加粗标题 */
  margin: 0;
}

.home-panel-sub-title {
  font-size: 16px;
  /* 设置副标题字体大小 */
  color: #666;
  /* 设置副标题颜色 */
  margin: 5px 0 0;
}

/* 商品列表 */
.goods-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin: 0 auto;
  padding: 0;
  list-style: none;
}

li {
  background: #f0f9f4;
  transition: all 0.5s;
  box-sizing: border-box;
  padding: 10px;

  &:hover {
    transform: translate3d(0, -3px, 0);
    box-shadow: 0 3px 8px rgb(0 0 0 / 20%);
  }

  img {
    width: 100%;
    height: 306px;
    object-fit: cover;
    background-color: #eee;
  }

  p {
    font-size: 22px;
    padding-top: 12px;
    text-align: center;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .price {
    color: $priceColor;
  }
}

/* 新加的样式：如果需要 */
.no-data {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 16px;
}

/* （可选）占位符样式，如果启用了 v-else */
.placeholder {
  text-align: center;
  color: #999;
  padding: 10px;
  font-size: 14px;
}
</style>