// LayoutNav.vue (或 LayoutTopnav.vue) - 基于你的原始代码修改
<script setup>
// import { ref, onMounted } from 'vue' // `ref` 和 `onMounted` 用于 localStorage 的部分不再需要
import { computed } from 'vue'; // `computed` 仍然需要，或者直接用 storeToRefs
import { useRouter } from 'vue-router';
import { ElMessage, ElPopconfirm } from 'element-plus'; // 确保 ElPopconfirm 已导入
import { useCartStore } from '@/stores/cartStore';
import { useUserStore } from '@/stores/user'; // 1. 导入 userStore
import { storeToRefs } from 'pinia';         // 2. 导入 storeToRefs

const router = useRouter();
const cartStore = useCartStore();
const userStore = useUserStore(); // 3. 获取 userStore 实例

// 4. 从 userStore 获取响应式的状态和 getters
// 使用 storeToRefs 来解构，保持响应性
// 假设 userStore 的 userInfo 对象中有 account 字段作为用户名
// 并且 userStore 有 isLoggedIn getter
const { isLoggedIn, userInfo } = storeToRefs(userStore);

// 5. 创建一个计算属性来获取用户名，如果 userInfo 存在且有 account
const usernameDisplay = computed(() => {
  return userInfo.value && userInfo.value.account ? userInfo.value.account : '用户';
});

/* ---------- 退出登录 ---------- */
const handleLogout = async () => { // 6. 修改退出登录逻辑，调用 store 的 action
  try {
    await userStore.logout(); // 调用 userStore 的 logout action
    ElMessage.success('已退出登录');
    router.push('/login'); // 退出后跳转到登录页 (或者 '/' 首页，根据你的需求)
  } catch (error) {
    console.error('退出登录失败:', error);
    ElMessage.error('退出登录失败，请稍后再试');
  }
};

/* ---------- 购物车点击处理 ---------- */
const handleCartClick = (event) => {
  if (!isLoggedIn.value) { // 7. isLogin 现在来自 userStore
    event.preventDefault();
    ElMessage.warning('请先登录后查看购物车');
    router.push('/login'); // 提示后跳转到登录页
  }
};
</script>

<template>
  <nav class="app-topnav">
    <div class="container">
      <ul>
        <!-- 登录后 -->
        <template v-if="isLoggedIn">
          <li>
            <!-- 确保 'member-info' 路由在你的 router/index.js 中有定义 -->
            <router-link :to="{ name: 'member-info' }">
              <i class="iconfont icon-user"></i>{{ usernameDisplay }}
            </router-link>
          </li>
          <li>
            <el-popconfirm title="确认退出吗？" confirm-button-text="确认" cancel-button-text="取消" @confirm="handleLogout">
              <template #reference><a href="javascript:;">退出登录</a></template>
            </el-popconfirm>
          </li>
            <li><router-link :to="{ name: 'member-info' }">个人中心</router-link></li>
          <!-- 确保 'myRentals' 路由在你的 router/index.js 中有定义 -->
          <li><router-link :to="{ name: 'myRentals' }">我的租赁</router-link></li>
          <!-- 已登录用户正常显示购物车 -->
          <li class="cart-item">
            <router-link to="/cart" class="cart-link">
              <i class="iconfont icon-cart"></i>
              <span v-if="cartStore.totalCount" class="cart-badge">{{ cartStore.totalCount }}</span>
            </router-link>
          </li>
        </template>

        <!-- 游客 -->
        <template v-else>
          <li><router-link to="/login">请先登录</router-link></li> <!-- 确保 /login 路由存在 -->
          <li><a href="javascript:;">帮助中心</a></li>
          <li><a href="javascript:;">关于我们</a></li>
          <!-- 游客也显示购物车，但点击时阻止默认行为并提示 -->
          <li class="cart-item">
            <a href="javascript:;" @click="handleCartClick" class="cart-link">
              <i class="iconfont icon-cart"></i>
              <span v-if="cartStore.totalCount" class="cart-badge">{{ cartStore.totalCount }}</span>
            </a>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<style scoped lang="scss">
@use "@/styles/common.scss" as *;

.app-topnav {
  background: #333;

  ul {
    display: flex;
    height: 53px;
    justify-content: flex-end;
    align-items: center;

    li {
      a {
        padding: 0 15px;
        color: #cdcdcd;
        line-height: 1;
        display: inline-block;

        i {
          font-size: 14px;
          margin-right: 2px;
        }

        &:hover {
          color: $xtxColor;
        }
      }

      ~li a {
        border-left: 2px solid #666;
      }

      /* 购物车项特殊样式 */
      &.cart-item {
        margin-left: 10px;

        .cart-link {
          position: relative;

          i {
            font-size: 16px;
          }

          .cart-badge {
            position: absolute;
            top: -8px;
            right: 5px;
            background-color: $xtxColor;
            color: white;
            border-radius: 8px;
            min-width: 16px;
            height: 16px;
            font-size: 12px;
            text-align: center;
            line-height: 16px;
            padding: 0 4px;
          }
        }
      }
    }
  }
}
</style>