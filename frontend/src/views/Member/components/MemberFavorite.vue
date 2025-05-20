<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFavoritesAPI, removeFavoriteAPI } from '@/apis/favorite'
import { ElMessage } from 'element-plus'

const router = useRouter()
const favoriteList = ref([])
const loading = ref(false)

// 前往首页
const goShopping = () => {
  router.push({ name: 'home' })
}

// 获取收藏列表
const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await getFavoritesAPI()
    console.log('收藏列表响应:', res) // 调试用，查看响应格式
    
    // 根据实际响应结构处理数据
    if (res && res.code === 0) {
      favoriteList.value = res.data || res.result || []
    } else if (Array.isArray(res)) {
      favoriteList.value = res
    } else {
      favoriteList.value = []
    }
  } catch (error) {
    console.error('获取收藏失败', error)
    ElMessage.error('获取收藏列表失败')
    favoriteList.value = []
  } finally {
    loading.value = false
  }
}

// 取消收藏
const removeFavorite = async (id) => {
  try {
    const res = await removeFavoriteAPI(id)
    console.log('取消收藏响应:', res) // 调试用
    
    // 调整判断逻辑，适应不同响应格式
    if ((res && res.code === 0) || res === true || res?.status === 200) {
      ElMessage.success('取消收藏成功')
      // 重新加载收藏列表
      loadFavorites()
    } else {
      ElMessage.error('取消收藏失败')
    }
  } catch (error) {
    console.error('取消收藏失败', error)
    ElMessage.error('取消收藏失败')
  }
}

// 查看商品详情
const viewDetail = (id) => {
  router.push(`/detail/${id}`)
}

onMounted(() => {
  loadFavorites()
})
</script>

<template>
  <div class="favorite-container">
    <h3>我的收藏</h3>
    
    <div v-if="loading" class="loading">
      <el-loading :visible="true" text="加载中..."></el-loading>
    </div>
    
    <div v-else-if="favoriteList.length === 0" class="empty-favorite">
      <p>您还没有收藏任何商品</p>
      <router-link :to="{ name: 'home' }" class="shopping-btn btn-primary">去逛逛</router-link>
    </div>
    
    <div v-else class="favorite-list">
      <div v-for="item in favoriteList" :key="item.id" class="favorite-item">
        <div class="item-image" @click="viewDetail(item.id)">
          <img :src="item.picture" alt="商品图片">
        </div>
        <div class="item-info">
          <p class="item-name" @click="viewDetail(item.id)">{{ item.name }}</p>
          <p class="item-price">¥{{ item.price }}</p>
          <div class="item-actions">
            <el-button size="small" @click="viewDetail(item.id)">查看详情</el-button>
            <el-button size="small" type="danger" @click="removeFavorite(item.id)">
              取消收藏
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "@/styles/common.scss"; // 添加这行以使用 $xtxColor 变量
.favorite-container {
  padding: 20px;
  
  h3 {
    font-size: 20px;
    font-weight: normal;
    color: #666;
    margin-bottom: 25px;
  }
  
  .empty-favorite {
    text-align: center;
    padding: 100px 0;
    color: #999;
    
    p {
      margin-bottom: 20px;
    }
    
    /* 恢复按钮样式 */
    .shopping-btn {
      display: inline-block;
      padding: 8px 16px;
      background-color: #27ba9b; /* 或使用 $xtxColor */
      color: #fff;
      border-radius: 4px;
      text-decoration: none;
      transition: all 0.3s;
      
      &:hover {
        background-color: darken(#27ba9b, 5%);
      }
    }
  }
  
  .favorite-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
    
    .favorite-item {
      background: #fff;
      border-radius: 5px;
      box-shadow: 0 0 5px rgba(0,0,0,0.05);
      overflow: hidden;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      }
      
      .item-image {
        width: 100%;
        height: 260px;
        overflow: hidden;
        cursor: pointer;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s;
          
          &:hover {
            transform: scale(1.05);
          }
        }
      }
      
      .item-info {
        padding: 15px;
        
        .item-name {
          height: 40px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          margin-bottom: 10px;
          font-size: 14px;
          cursor: pointer;
          
          &:hover {
            color: #27ba9b;
          }
        }
        
        .item-price {
          color: #cf4444;
          font-size: 16px;
          margin-bottom: 10px;
        }
        
        .item-actions {
          display: flex;
          justify-content: space-between;
        }
      }
    }
  }
}
</style>