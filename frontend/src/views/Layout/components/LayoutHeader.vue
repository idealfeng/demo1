<script setup>
import { useCategoryStore } from "@/stores/categoryStore";
import { storeToRefs } from 'pinia'; // 1. 导入 storeToRefs
import { onMounted } from 'vue';    // 2. 导入 onMounted

const categoryStore = useCategoryStore();

// 3. 使用 storeToRefs 解构，保持响应性
const { categoryList } = storeToRefs(categoryStore);

// 4. 在组件挂载后，调用 action 获取数据
onMounted(() => {
  // 假设你的 store 中获取分类列表的 action 名字叫 getCategoryList
  // 请根据你实际的 action 名称修改
  categoryStore.getCategory();
});
</script>

<template>
    <header class='app-header'>
        <div class="container">
            <h1 class="logo">
                <a>sicau服饰平台</a>
            </h1>
            <ul class="app-header-nav">
                <li class="home">
                    <RouterLink to="/home">首页</RouterLink>
                </li>
                <li v-for="item in categoryList" :key="item.id">
                    <RouterLink active-class="active" :to="`/category/${item.id}`">{{item.name}}</RouterLink>
                </li>
            </ul>
            <div class="search">
                <i class="iconfont icon-search"></i>
                <input type="text" placeholder="搜一搜">
            </div>
            <!-- 头部购物车 -->


        </div>
    </header>
</template>


<style scoped lang='scss'>
@use "@/styles/common.scss" as *;
 // ✅ 手动导入公共样式和变量
.app-header {
    background: #fff;

    .container {
        display: flex;
        align-items: center;
    }

    .logo {
        width: 200px;

        a {
            display: block;
            height: 132px;
            width: 100%;
            text-indent: -9999px;
            background: url('@/assets/images/图片1.png') no-repeat center 18px / contain;
        }
    }

    .app-header-nav {
        width: 820px;
        display: flex;
        padding-left: 40px;
        position: relative;
        z-index: 998;

        li {
            margin-right: 40px;
            width: 38px;
            text-align: center;

            a {
                font-size: 16px;
                line-height: 32px;
                height: 32px;
                display: inline-block;

                &:hover {
                    color: $xtxColor;
                    border-bottom: 1px solid $xtxColor;
                }
            }

            .active {
                color: $xtxColor;
                border-bottom: 1px solid $xtxColor;
            }
        }
    }

    .search {
        width: 170px;
        height: 32px;
        position: relative;
        border-bottom: 1px solid #e7e7e7;
        line-height: 32px;

        .icon-search {
            font-size: 18px;
            margin-left: 5px;
        }

        input {
            width: 140px;
            padding-left: 5px;
            color: #666;
        }
    }

    .cart {
        width: 50px;

        .curr {
            height: 32px;
            line-height: 32px;
            text-align: center;
            position: relative;
            display: block;

            .icon-cart {
                font-size: 22px;
            }

            em {
                font-style: normal;
                position: absolute;
                right: 0;
                top: 0;
                padding: 1px 6px;
                line-height: 1;
                background: $helpColor;
                color: #fff;
                font-size: 12px;
                border-radius: 10px;
                font-family: Arial;
            }
        }
    }
}
</style>