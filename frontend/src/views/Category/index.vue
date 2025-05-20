<script setup>
import {getTopCategoryAPI} from '@/apis/category'
import {useRoute,onBeforeRouteUpdate} from "vue-router";
import { getBannerAPI } from '@/apis/home' 
import {onMounted, onUpdated, ref} from "vue";
import GoodsItem from '@/views/Home/components/GoodsItem.vue'

const categoryData = ref({})
const route = useRoute()
const getCategory = async (id) => {
  const res = await getTopCategoryAPI(id)
  categoryData.value = res.result
}
onMounted(()=>getCategory(route.params.id))

onBeforeRouteUpdate((to)=>{
  getCategory(to.params.id)
})

const bannerList = ref([]);
const getBanner = async () => {
  const res = await getBannerAPI('2');
  bannerList.value = res.result;
}
onMounted(()=>getBanner());
</script>

<template>
  <div class="top-category">
    <div class="container m-top-20">
      <!-- 面包屑 -->
      <div class="bread-container">
        <el-breadcrumb separator=">">
          <el-breadcrumb-item>首页</el-breadcrumb-item>
          <el-breadcrumb-item>{{ categoryData.name }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 分类产品图片 (二级分类链接) -->
      <div class="sub-list">
        <h3>全部分类</h3>
        <ul>
          <li v-for="i in categoryData.children" :key="i.id">
            <!-- 移除RouterLink，改用普通div -->
            <div class="category-item">
              <img :src="i.picture" />
              <p>{{ i.name }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- 分类产品列表 -->
      <div class="ref-goods">
        <div class="head">
          <h3>- {{ categoryData.name }}-</h3>
        </div>
        <div class="body">
          <GoodsItem v-for="good in categoryData.goods" :good="good" :key="good.id" />
        </div>
      </div>

    </div>
  </div>
</template>

<!-- style 部分保持不变 -->
<style scoped lang="scss">
@use "@/styles/common.scss" as *;
 // 添加这行以使用 $xtxColor 变量

.top-category {
  h3 {
    font-size: 28px;
    color: #666;
    font-weight: normal;
    text-align: center;
    line-height: 100px;
  }

  .sub-list {
    margin-top: 20px;
    background-color: #fff;

    ul {
      display: flex;
      padding: 0 32px;
      flex-wrap: wrap;

      li {
        width: 168px;
        height: 160px;


        a {
          text-align: center;
          display: block;
          font-size: 16px;

          img {
            width: 100px;
            height: 100px;
          }

          p {
            line-height: 40px;
          }

          &:hover {
            color: $xtxColor;
          }
        }
      }
    }
  }

  .ref-goods {
    background-color: #fff;
    margin-top: 20px;
    position: relative;

    .head {
      .xtx-more {
        position: absolute;
        top: 20px;
        right: 20px;
      }

      .tag {
        text-align: center;
        color: #999;
        font-size: 20px;
        position: relative;
        top: -20px;
      }
    }

    .body {
      display: flex;
      justify-content: space-around;
      padding: 0 40px 30px;
    }
  }

  .bread-container {
    padding: 25px 0;
  }
}

.home-banner {
  width: 1240px;
  height: 500px;
  margin: 0 auto;

  img {
    width: 100%;
    height: 500px;
  }
}
/* 添加一些基本样式让分类项看起来仍然美观 */
.category-item {
  display: block;
  text-align: center;
  cursor: default; /* 鼠标指针显示为默认样式，而不是手型 */
}

.category-item img {
  width: 80%;
  height: auto;
}

.category-item p {
  margin-top: 5px;
}
</style>