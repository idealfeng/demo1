// HomeHot.vue
<script setup>
import HomePanel from "@/views/Home/components/HomePanel.vue"; // HomePanel 应该在父组件 Home/index.vue 中使用
import { getHotList } from '@/mock/goods';
import { ref, onMounted } from "vue";
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user'; // 1. 导入 userStore
import { storeToRefs } from 'pinia';         // 2. 导入 storeToRefs

const router = useRouter();
const hotList = ref([]);
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

const getHotListFunc = async () => {
  try {
    const { result } = await getHotList();
    if (result && Array.isArray(result)) {
      hotList.value = result.filter(item => item && item.id);
    } else {
      console.error("Mock API 返回数据格式不正确或为空:", result);
      hotList.value = [];
    }
  } catch (error) {
    console.error("获取热门推荐失败:", error);
    hotList.value = [];
  }
}

onMounted(() => getHotListFunc());
</script>

<template>
  <HomePanel>
    <div class="home-hot">
      <div class="home-panel-header">
        <h2 class="home-panel-title">人气推荐</h2>
        <p class="home-panel-sub-title">人气爆款 不容错过</p>
      </div>

      <ul class="goods-list" v-if="hotList && hotList.length > 0">
        <li v-for="(item, index) in hotList" :key="item?.id ?? index">
          <template v-if="item && item.id">
            <!-- 替换RouterLink为a标签和点击处理函数 -->
            <a href="javascript:;" @click.prevent="goToDetail(item.id)">
              <img v-img-lazy="item?.picture" :alt="item?.alt || '商品图片'">
              <div class="text-content">
                <p class="name">{{ item?.title }}</p>
                <p class="desc">{{ item?.alt }}</p>
              </div>
            </a>
          </template>
        </li>
      </ul>

      <div v-else class="no-data">暂无人气推荐商品，加载中...</div>
    </div>
  </HomePanel>
</template>

<style scoped lang='scss'>
@use "@/styles/common.scss" as *;


/* 统一容器样式 */
.home-hot {
  width: 100%;
  max-width: 1270px;
  margin: 0 auto;
  padding: 0 0px;
}

/* 统一标题样式 */
.home-panel-header {
  text-align: left;
  margin-bottom: 30px;
}

.home-panel-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.home-panel-sub-title {
  font-size: 16px;
  color: #666;
  margin: 5px 0 0;
}

/* 统一商品列表样式 */
.goods-list {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    width: calc(25% - 15px);
    background: #f0f9f4;
    transition: all 0.5s;
    box-sizing: border-box;

    &:hover {
      transform: translate3d(0, -3px, 0);
      box-shadow: 0 3px 8px rgb(0 0 0 / 20%);
    }
  }

  img {
    width: 100%;
    height: 306px;
    object-fit: cover;
    background-color: #eee;
  }

  /* 统一文字区域 */
  .text-content {
    padding: 15px 10px 10px;

    p {
      margin: 0;
      text-align: center;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .name {
      font-size: 22px;
      color: #333;
      line-height: 1.2;
    }

    .desc {
      font-size: 18px;
      color: #999;
      margin-top: 8px;
      line-height: 1.4;
    }
  }
}

/* 新加的样式：如果需要 */
.no-data {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 16px;
}
</style>