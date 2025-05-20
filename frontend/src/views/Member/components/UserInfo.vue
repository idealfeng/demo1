<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore }   from '@/stores/user'
import GoodsItem          from '@/views/Home/components/GoodsItem.vue'

// ★ 具名导入（和 src/apis/user.js 里的 export const getLikeListAPI 对应）
import { getLikeListAPI } from '@/apis/user'

const userStore = useUserStore()

/* 猜你喜欢 */
const likeList = ref([])
const getLikeList = async () => {
  const res = await getLikeListAPI({ limit: 4 })
  likeList.value = res.result
}
onMounted(getLikeList)
const finalFallbackAvatar = '/三月七.jpg';
</script>

<template>
  <div class="home-overview">
    <!-- 用户信息 -->
    <div class="user-meta">
      <div class="avatar">
             <!-- ★ 头像: 使用 userStore.userAvatar getter -->
        <!-- userStore.userAvatar 会优先使用 userInfo.avatar，如果不存在则使用 store 中定义的兜底头像 -->
        <!-- onerror 用于处理 userStore.userAvatar 返回的 URL 本身加载失败的情况 -->
        <img :src="userStore.userAvatar" :onerror="`this.onerror=null; this.src='${finalFallbackAvatar}'`" alt="用户头像" />
      </div>
      <!-- ★ 账号名: 使用 userStore.username getter -->
      <!-- 如果 userStore.username 为空 (例如未登录)，则显示 '访客用户' -->
      <h4>{{ userStore.username || '访客用户' }}</h4>
    </div>

    <div class="item">
      <a href="javascript:;">
        <span class="iconfont icon-hy"></span>
        <p>个人中心</p>
      </a>
      <a href="javascript:;">
        <span class="iconfont icon-aq"></span>
        <p>安全设置</p>
      </a>
      <a href="javascript:;">
        <span class="iconfont icon-dw"></span>
        <p>地址管理</p>
      </a>
    </div>
  </div>

  <!-- 猜你喜欢 -->
  <div class="like-container">
    <div class="home-panel">
      <div class="header">
        <h4>猜你喜欢</h4>
      </div>
      <div class="goods-list">
        <GoodsItem v-for="good in likeList" :key="good.id" :good="good" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/common.scss" as *;


.home-overview {
  height: 132px;
  background: url(@/assets/images/center-bg.png) no-repeat center / cover;
  display: flex;
  

  .user-meta {
    flex: 1;
    display: flex;
    align-items: center;

    .avatar {
      width: 85px;
      height: 85px;
      border-radius: 50%;
      overflow: hidden;
      margin-left: 60px;

      img {
        width: 100%;
        height: 100%;
      }
    }

    h4 {
      padding-left: 26px;
      font-size: 18px;
      font-weight: normal;
      color: white;
    }
  }

  .item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-around;

    a {
      color: white;
      font-size: 16px;
      text-align: center;

      .iconfont {
        font-size: 32px;
      }

      p {
        line-height: 32px;
      }
    }
  }
}

.like-container {
  margin-top: 20px;
  border-radius: 4px;
  background-color: #fff;
    margin-bottom: 40px; /* ★ 加这句！ */
}

.home-panel {
  background-color: #fff;
  padding: 0 20px;
  margin-top: 20px;
  height: 400px;

  .header {
    height: 66px;
    border-bottom: 1px solid #f5f5f5;
    padding: 18px 0;
    display: flex;
    justify-content: space-between;
    align-items: baseline;

    h4 {
      font-size: 22px;
      font-weight: 400;
    }
  }

  .goods-list {
    display: flex;
    justify-content: space-around;
  }
}
</style>