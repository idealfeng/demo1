// Category.vue
<script setup>
import { useCategoryStore } from "@/stores/categoryStore";
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user'; // 1. 导入 userStore
import { storeToRefs } from 'pinia';         // 2. 导入 storeToRefs

const categoryStore = useCategoryStore();
const router = useRouter();
const userStore = useUserStore(); // 3. 获取 userStore 实例
const { isLoggedIn } = storeToRefs(userStore); // 4. 获取响应式的 isLoggedIn

// 这个 handleItemClick 看起来是给分类项本身用的，如果分类项点击后需要判断登录，则修改
const handleItemClick = (id, event) => { // 假设 id 是分类ID，点击分类本身不需要登录
  // 如果点击分类项本身不需要登录判断，可以直接跳转或什么都不做
  // 如果点击分类项后要跳转到某个需要登录的页面，则使用 isLoggedIn.value
  // router.push(`/some-protected-route-for-category/${id}`);
};

// 如果 Category.vue 内部有直接跳转到商品详情的逻辑（比如推荐商品列表），
// 那么那个跳转逻辑也需要使用 isLoggedIn.value
// 例如，如果模板中有 <div @click="goToProductDetail(product.id)">...</div>
const goToProductDetail = (productId) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录才能查看商品详情');
    // 可以选择跳转到登录页
    // router.push({ name: 'login', query: { redirect: `/detail/${productId}` } });
    return;
  }
  router.push(`/detail/${productId}`);
};
</script>

<template>
  <!-- 模板结构保持不变 -->
  <div class="home-category">
    <ul class="menu">
      <li v-for="item in categoryStore.categoryList" :key="item.id">
        <RouterLink :to="`/category/${item.id}`">{{ item.name }}</RouterLink>
        <RouterLink v-for="i in item.children.slice(0, 2)" :key="i.id" :to="`/category/${i.id}`">{{ i.name }}</RouterLink>
        <!-- 弹层layer位置 -->
        <div class="layer">
          <h4>分类推荐 <small>根据您的购买或浏览记录推荐</small></h4>
          <ul>
            <li v-for="i in item.goods" :key="i.id">
              <!-- 替换RouterLink为普通a标签并添加点击处理 -->
              <a href="javascript:;" @click.prevent="goToProductDetail(i.id)">
                <img alt="" :src="i.picture" />
                <div class="info">
                  <p class="name ellipsis-2">{{ i.name }}</p>
                  <p class="desc ellipsis">{{ i.desc }}</p>
                  <p class="price"><i>¥</i>{{ i.price }}</p>
                </div>
              </a>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang='scss'>
@use "@/styles/common.scss" as *;

.home-category {
  width: 250px;
  height: 500px;
  background: rgba(0, 0, 0, 0.8);
  position: relative; // 关键：.layer 的定位基准
  z-index: 99;
  border-radius: 0 0 8px 8px;

  .menu {
    li { // 菜单项
      padding-left: 40px;
      height: 55px;
      line-height: 55px;
      transition: background-color 0.3s;
      // position: relative; // <--- 移除这一行！

      &::before { // 左侧高亮条
        content: '';
        position: absolute;
        width: 4px;
        height: 0;
        background: #fff;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        transition: height 0.3s;
      }

      &:hover {
        background: $xtxColor;

        &::before {
          height: 20px;
        }
      }

      a { // 菜单项链接
        margin-right: 4px;
        color: #fff;
        transition: color 0.2s;
        position: relative; // 保持这个，为了 ::before 小点

        &:first-child {
          font-size: 16px;
          font-weight: 500;
        }

        &:hover {
          color: #fffc00;
        }

        &:not(:first-child)::before {
          content: '•';
          margin-right: 4px;
          color: rgba(255, 255, 255, 0.5);
        }
      }

      // --- 弹层样式 ---
      .layer {
        width: 990px;
        height: 500px; // 与 .home-category 等高
        background: rgba(255, 255, 255, 0.8);
        position: absolute; // 相对于 .home-category 定位
        left: 100%; // 从 .home-category 右侧开始 (即 250px)
        top: 0; // 关键：与 .home-category 顶部对齐
        padding: 0 30px;
        box-shadow: 2px 2px 15px rgba(0, 0, 0, 0.12);
        border-radius: 0 8px 8px 0;

        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease-in-out, visibility 0s linear 0.2s; // 延迟隐藏
        pointer-events: none; // 隐藏时不可交互

        h4 { // 弹层标题
          font-size: 20px;
          font-weight: 500;
          line-height: 60px;
          color: #333;
          border-bottom: 1px solid #eee;

          small {
            font-size: 14px;
            color: #666;
            margin-left: 10px;
          }
        }

        ul { // 商品列表
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding: 15px 0;
          list-style: none;
          margin: 0;

          li { // 商品项 (内部 li 不需要特殊定位)
            border: 1px solid #f5f5f5;
            border-radius: 8px;
            background: #fff;
            transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
            overflow: hidden;
            padding: 0;
            height: auto;
            line-height: normal;

            &:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
            }

            a { // 商品链接
              display: flex !important;
              padding: 15px;
              align-items: center;
              color: #333;
              height: 140px;

              &:hover {
                 background: #f0f9f8;
              }

              img { // 商品图片
                width: 110px;
                height: 110px;
                object-fit: cover;
                border-radius: 6px;
                flex-shrink: 0;
              }

              .info { // 商品信息
                padding-left: 20px;
                width: calc(100% - 110px - 20px);
                display: flex;
                flex-direction: column;
                justify-content: center;

                .name {
                  font-size: 16px;
                  color: #333;
                  margin-bottom: 8px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                }

                .desc {
                  font-size: 13px;
                  color: #888;
                  margin-bottom: 8px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }

                .price {
                  font-size: 20px;
                  color: $priceColor;
                  font-weight: 500;

                  i {
                    font-size: 14px;
                    font-style: normal;
                    margin-right: 2px;
                  }
                }
              }
            }
          }
        }
      }

      // 鼠标悬停时显示弹层
      &:hover > .layer {
        opacity: 1;
        visibility: visible;
        transition: opacity 0.2s ease-in-out; // 显示时立即过渡
        pointer-events: auto; // 显示时可交互
        z-index: 1;
      }
    }
  }
}
</style>