<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { House, Search, Clock, Calendar, RefreshRight } from '@element-plus/icons-vue'
import request from '@/utils/http' // 假设你有一个封装好的axios实例，或者直接导入axios
const userStore = useUserStore()
const router = useRouter()

// 搜索功能
const searchQuery = ref('')
const isSearching = ref(false)

// 模拟订单状态和对应标签颜色
const statusColors = {
    '待发货': 'warning',
    '租用中': 'success',
    '待归还': 'danger',
    '已归还': 'info',
    '已取消': ''
}

// 加载租赁列表
const rentalList = ref([])
const activeTab = ref('all')

const loadRentals = async () => {
  console.log('>>> DEBUG: loadRentals 函数被调用 <<<');
  console.log('>>> DEBUG: 当前 userStore 状态:', userStore);

  if (!userStore.isLoggedIn) {
        console.log('>>> DEBUG: 用户未登录，跳转到登录页 <<<');
        ElMessage.warning('请先登录')
        router.push('/login')
        return
    }
    console.log('>>> DEBUG: 用户已登录，准备调用API <<<');

    try {
        console.log('>>> DEBUG: 前端准备发送 GET /api/rentals 请求 <<<');
        // request.get('/rentals', ...) 返回的是后端响应的 data 部分
        // 也就是 { code: ..., message: ..., data: [...] } 这个对象
        const responseData = await request.get('/rentals', {
             headers: {
                Authorization: `Bearer ${userStore.userInfo.token}`
             }
        })

        console.log('>>> DEBUG: GET /api/rentals 响应数据:', responseData); // <-- 添加这行日志，查看实际返回的数据结构

        // 检查返回的 code
        if (responseData.code === 0) {
            // 访问后端返回的实际租赁列表数据，它在 responseData.data 中
            rentalList.value = responseData.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            console.log('租赁数据加载成功:', rentalList.value); // 添加日志确认数据
        } else {
            // 如果 code 不为 0，显示后端返回的错误消息
            ElMessage.error(responseData.message || '获取租赁订单失败')
            rentalList.value = [] // 清空列表
        }

    } catch (error) {
        console.error('加载租赁订单出错:', error)
        // 这里的 error 是 AxiosError，如果后端返回了非 2xx 状态码，错误信息在 error.response.data 中
        if (error.response && error.response.data && error.response.data.message) {
             ElMessage.error(error.response.data.message);
        } else {
            ElMessage.error('加载租赁订单失败，请稍后再试');
        }
        console.log('>>> DEBUG: 进入 catch 块 <<<', error);
        rentalList.value = [] // 清空列表
    }
}

// 根据标签筛选订单
const filteredRentals = computed(() => {
    let results = rentalList.value

    // 先按标签筛选
    if (activeTab.value !== 'all') {
        results = results.filter(rental => rental.status === activeTab.value)
    }

    // 再按搜索条件筛选
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim()
        results = results.filter(rental =>
            String(rental.id || '').toLowerCase().includes(query) ||
            // !!! 修改这里：将 rental.name 改为 rental.product_name !!!
            String(rental.product_name || '').toLowerCase().includes(query)
        )
    }

    return results
})

// 搜索方法
const handleSearch = () => {
    isSearching.value = !!searchQuery.value.trim()
}

// 清除搜索
const clearSearch = () => {
    searchQuery.value = ''
    isSearching.value = false
}

// 计算租期进度
const getRentalProgress = (rental) => {
    if (rental.status === '已取消' || rental.status === '待发货') return { percent: 0, elapsed: 0, total: rental.days }
    
    const startDate = new Date(rental.startDate)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(rental.endDate)
    endDate.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 已经过去的天数
    let elapsedDays = 0
    
    if (today < startDate) {
        elapsedDays = 0
    } else if (today > endDate || rental.status === '已归还') {
        elapsedDays = rental.days
    } else {
        const diffTime = today - startDate
        elapsedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        elapsedDays = Math.min(elapsedDays, rental.days)
    }
    
    const percent = Math.round((elapsedDays / rental.days) * 100)
    
    return {
        percent,
        elapsed: elapsedDays,
        total: rental.days
    }
}

// 计算剩余租期
const getRemainingDays = (rental) => {
    if (rental.status !== '租用中' && rental.status !== '待归还') return null
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(rental.endDate)
    endDate.setHours(0, 0, 0, 0)
    
    const diffTime = endDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
}

// 取消租赁
const cancelRental = (rental) => {
    ElMessageBox.confirm('确定要取消该租赁订单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'my-messagebox-danger-button'
    }).then(async () => { // 改为async函数
        try {
            // 调用后端API取消订单
            const res = await request.put(`/rentals/${rental.id}/cancel`, {}, { // 使用PUT请求，传递订单ID
                 headers: {
                    Authorization: `Bearer ${userStore.userInfo.token}` // 发送token
                 }
            })

            if (res.code === 0) {
                ElMessage.success(res.message || '订单已取消')
                // 成功后重新加载列表或者手动更新状态
                loadRentals() // 简单粗暴，重新加载全部
                // 或者手动更新状态 (更高效):
                // const index = rentalList.value.findIndex(item => item.id === rental.id);
                // if (index !== -1) {
                //     rentalList.value[index].status = '已取消';
                // }

            } else {
                ElMessage.error(res.message || '取消订单失败')
            }

        } catch (error) {
            console.error('取消租赁订单出错:', error)
             // 处理后端返回的特定错误码或消息
            if (error.response && error.response.data && error.response.data.message) {
                 ElMessage.error(error.response.data.message);
            } else {
                ElMessage.error('取消订单失败，请稍后再试');
            }
        }
    }).catch(() => {}) // 用户取消操作
}

const deleteRental = (rental) => {
    ElMessageBox.confirm('确定要删除该订单记录吗？删除后不可恢复。', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'my-messagebox-danger-button'
    }).then(async () => { // 改为async函数
        try {
            // 调用后端API删除订单记录
            const res = await request.delete(`/rentals/${rental.id}`, { // 使用DELETE请求，传递订单ID
                 headers: {
                    Authorization: `Bearer ${userStore.userInfo.token}` // 发送token
                 }
            })

            if (res.code === 0) {
                ElMessage.success(res.message || '订单记录已删除')
                // 成功后重新加载列表或者手动从列表中移除
                loadRentals() // 简单粗暴，重新加载全部
                // 或者手动移除 (更高效):
                // rentalList.value = rentalList.value.filter(item => item.id !== rental.id);

            } else {
                ElMessage.error(res.message || '删除订单记录失败')
            }

        } catch (error) {
            console.error('删除租赁订单记录出错:', error)
             if (error.response && error.response.data && error.response.data.message) {
                 ElMessage.error(error.response.data.message);
            } else {
                ElMessage.error('删除订单记录失败，请稍后再试');
            }
        }
    }).catch(() => {}) // 用户取消操作
}

// 归还商品
const returnItem = (rental) => {
    ElMessageBox.confirm('确认已归还该商品？', '提示', {
        confirmButtonText: '确认归还',
        cancelButtonText: '取消',
        type: 'info',
        confirmButtonClass: 'my-messagebox-danger-button'
    }).then(async () => { // 改为async函数
        try {
            // 调用后端API确认归还
            const res = await request.put(`/rentals/${rental.id}/return`, {}, { // 使用PUT请求，传递订单ID
                 headers: {
                    Authorization: `Bearer ${userStore.userInfo.token}` // 发送token
                 }
            })

            if (res.code === 0) {
                ElMessage.success(res.message || '归还成功，押金将在1-3个工作日内退还')
                // 成功后重新加载列表或者手动更新状态和归还日期
                loadRentals() // 简单粗暴，重新加载全部
                // 或者手动更新 (更高效):
                // const currentRental = rentalList.value.find(item => item.id === rental.id);
                // if (currentRental) {
                //     currentRental.status = '已归还';
                //     currentRental.returnDate = new Date().toISOString().split('T')[0]; // 后端返回的日期可能需要格式化
                // }

            } else {
                ElMessage.error(res.message || '确认归还失败')
            }

        } catch (error) {
            console.error('确认归还商品出错:', error)
             if (error.response && error.response.data && error.response.data.message) {
                 ElMessage.error(error.response.data.message);
            } else {
                ElMessage.error('确认归还失败，请稍后再试');
            }
        }
    }).catch(() => {}) // 用户取消操作
}

// 续租
const extendRental = (rental) => {
    // 跳转到商品详情页，预先选择租赁选项
    router.push(`/product/${rental.productId}?action=rent`)
}

// 当搜索条件改变时，自动搜索
watch(searchQuery, (newVal) => {
    handleSearch()
})

onMounted(() => {
    loadRentals()
})
</script>

<template>
    <div class="my-rentals-page">
        <div class="container">
            <div class="page-header">
                <div class="back-home" @click="router.push('home/')">
                    <el-icon><House /></el-icon>
                    <span>首页</span>
                </div>
                <div class="page-title">我的租赁</div>
                
                <!-- 搜索框 -->
                <div class="search-box">
                     <el-input
                        v-model="searchQuery"
                        placeholder="搜索订单号或商品名称"
                        clearable
                        @clear="clearSearch"
                        @keyup.enter="handleSearch"
                    >
                      <template #prefix>
                        <el-icon><Search /></el-icon>
                      </template>
                    </el-input>
                    <el-button 
                      type="primary" 
                      class="search-button" 
                      @click="handleSearch"
                    >
                      搜索
                    </el-button>
                </div>
            </div>

            <!-- 搜索结果提示 -->
            <div v-if="isSearching" class="search-results-info">
                <span>搜索"{{ searchQuery }}"：找到 {{ filteredRentals.length }} 条结果</span>
                <el-button type="primary" text @click="clearSearch">
                    <el-icon><RefreshRight /></el-icon>
                    清除搜索
                </el-button>
            </div>

            <!-- 标签页 -->
            <div class="tabs">
                <div class="tab-item" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">全部</div>
                <div class="tab-item" :class="{ active: activeTab === '待发货' }" @click="activeTab = '待发货'">待发货</div>
                <div class="tab-item" :class="{ active: activeTab === '租用中' }" @click="activeTab = '租用中'">租用中</div>
                <div class="tab-item" :class="{ active: activeTab === '待归还' }" @click="activeTab = '待归还'">待归还</div>
                <div class="tab-item" :class="{ active: activeTab === '已归还' }" @click="activeTab = '已归还'">已归还</div>
            </div>

            <!-- 租赁列表 -->
            <div v-if="filteredRentals.length > 0" class="rental-list">
                <div class="rental-item" v-for="rental in filteredRentals" :key="rental.id" :class="[rental.status === '已取消' ? 'cancelled' : '']">
                    <!-- 左侧状态条 -->
                    <div class="status-bar" :class="rental.status"></div>
                    
                    <div class="rental-header">
                        <div class="order-info">
                            <span class="order-id">订单号: {{ rental.id }}</span>
                            <span class="order-time">下单时间: {{ new Date(rental.createdAt).toLocaleString() }}</span>
                        </div>
                        <div class="order-status">
                            <el-tag :type="statusColors[rental.status]">{{ rental.status }}</el-tag>
                            
                            <!-- 倒计时提示 -->
                            <span v-if="getRemainingDays(rental) !== null" class="remaining-days" :class="{ 'urgent': getRemainingDays(rental) <= 3 }">
                                <el-icon><Clock /></el-icon>
                                还剩 {{ getRemainingDays(rental) }} 天到期
                            </span>
                        </div>
                    </div>
                    
                    <!-- 租赁进度条 - 显示已租用天数/总天数 -->
                    <div v-if="rental.status !== '已取消' && rental.status !== '待发货'" class="rental-progress">
                        <div class="progress-info">
                            <span>租期进度：{{ getRentalProgress(rental).elapsed }}天/{{ getRentalProgress(rental).total }}天</span>
                            <span class="progress-percent">{{ getRentalProgress(rental).percent }}%</span>
                        </div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" :style="{ width: getRentalProgress(rental).percent + '%' }"></div>
                        </div>
                    </div>
                    
                    <div v-else-if="rental.status === '待发货'" class="rental-progress">
                        <div class="progress-info">
                            <span>订单状态：商品准备中，等待发货</span>
                        </div>
                        <div class="progress-bar-bg preparing">
                            <div class="progress-bar-fill pulse" style="width: 20%"></div>
                        </div>
                    </div>
                    
                    <div v-else class="order-cancelled">
                        <span>订单已取消</span>
                    </div>

                    <div class="rental-content">
                        <div class="product-info">
                            <!-- !!! 将这里的 rental.image 改为 rental.product_picture !!! -->
                            <img :src="rental.product_picture" alt="商品图片" class="product-image">
                            <div class="product-details">
                                <div class="product-name">{{ rental.product_name }}</div>
                                <div class="rental-period">
                                    <el-icon><Calendar /></el-icon>
                                    租赁周期: {{ rental.startDate }} 至 {{ rental.endDate }}
                                    <span class="rental-days">(共{{ rental.days }}天)</span>
                                </div>
                                <div class="rental-price">日租金: ¥{{ rental.rental_price }}/天</div>
                            </div>
                        </div>

                        <div class="rental-fees">
                            <div class="fee-item">
                                <span>租金:</span>
                                <span class="amount">¥{{ rental.rentalFee }}</span>
                            </div>
                            <div class="fee-item">
                                <span>押金:</span>
                                <span class="amount">¥{{ rental.deposit }}</span>
                            </div>
                            <div class="fee-item total">
                                <span>合计:</span>
                                <span class="amount">¥{{ rental.totalAmount }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="rental-actions">
                        <template v-if="rental.status === '待发货'">
                            <el-button size="small" @click="cancelRental(rental)">取消订单</el-button>
                        </template>
                        <template v-else-if="rental.status === '租用中' || rental.status === '待归还'">
                            <el-button size="small" type="primary" @click="returnItem(rental)">确认归还</el-button>
                            <el-button size="small" @click="extendRental(rental)">续租</el-button>
                        </template>
                        <template v-else-if="rental.status === '已归还'">
                            <el-button size="small" @click="extendRental(rental)">再次租赁</el-button>
                        </template>
                        <template v-else-if="rental.status === '已取消'">
                            <el-button size="small" type="danger" @click="deleteRental(rental)">删除记录</el-button>
                        </template>
                    </div>
                </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
                <img src="@/assets/images/暂无租赁.png" alt="暂无租赁">
                <p v-if="isSearching">没有找到符合"{{ searchQuery }}"的租赁记录</p>
                <p v-else>您还没有租赁商品</p>
                <div class="empty-actions">
                    <el-button v-if="isSearching" @click="clearSearch">清除搜索</el-button>
                    <el-button type="primary" @click="router.push('home/')">去逛逛</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use "@/styles/common.scss" as *;

.my-rentals-page {
  background: linear-gradient(135deg, #f8fafc 0%, #f3f6fb 100%);
  min-height: calc(100vh - 240px);
  padding: 30px 0;

  .container {
    background: #fff;
    border-radius: 12px;
    padding: 32px 28px 24px 28px;
    box-shadow: 0 6px 32px 0 rgba(0,0,0,0.07);
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 25px;
    
    .page-title {
      font-size: 24px;
      font-weight: bold;
      color: #222;
      letter-spacing: 1px;
      flex: 1;
    }
    
   .search-box {
  display: flex;
  align-items: center;
  width: 360px;
  
  .el-input {
    --el-input-border-radius: 20px 0 0 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    
    :deep(.el-input__wrapper) {
      border-right: none;
    }
  }
  
  .search-button {
    height: 32px;
    border-radius: 0 20px 20px 0;
    margin-left: -1px;
    background-color: $xtxColor;
    border-color: $xtxColor;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: all 0.3s;
    
    &:hover {
      background-color: darken($xtxColor, 5%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}
  }
  
  .search-results-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 15px;
    background: #f0f9ff;
    border-radius: 8px;
    margin-bottom: 20px;
    color: #2b85e4;
    animation: fadeIn 0.3s ease-in-out;
    
    .el-button {
      color: #2b85e4;
      
      &:hover {
        color: darken(#2b85e4, 10%);
      }
    }
  }

  .back-home {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    font-size: 16px;
    color: $xtxColor;
    border-radius: 20px;
    padding: 6px 16px;
    background: #f6faff;
    transition: background 0.2s, color 0.2s;
    user-select: none;
    margin-right: 15px;
    &:hover {
      background: $xtxColor;
      color: #fff;
    }
    .el-icon {
      margin-right: 6px;
      font-size: 20px;
    }
  }

  .tabs {
    display: flex;
    border-bottom: 1.5px solid #e4e4e4;
    margin-bottom: 30px;
    .tab-item {
      padding: 12px 32px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
      border-radius: 8px 8px 0 0;
      &.active {
        color: $xtxColor;
        font-weight: bold;
        background: #f6faff;
        &::after {
          content: '';
          position: absolute;
          bottom: -1.5px;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: $xtxColor;
          border-radius: 2px;
        }
      }
      &:hover {
        color: $xtxColor;
        background: #f6faff;
      }
    }
  }

  .rental-list {
    .rental-item {
      border: 1.5px solid #e8eef3;
      border-radius: 10px;
      margin-bottom: 24px;
      overflow: hidden;
      background: #fcfcfd;
      box-shadow: 0 2px 12px 0 rgba(0,0,0,0.04);
      transition: all 0.3s ease;
      position: relative;
      
      &:hover {
        box-shadow: 0 6px 24px 0 rgba(0,0,0,0.10);
        transform: translateY(-2px);
      }
      
      &.cancelled {
        opacity: 0.8;
        border: 1.5px solid #f0f0f0;
      }
      
      // 左侧状态条
      .status-bar {
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        
        &.待发货 {
          background: #E6A23C; // warning
        }
        
        &.租用中 {
          background: #67C23A; // success
        }
        
        &.待归还 {
          background: #F56C6C; // danger
        }
        
        &.已归还 {
          background: #909399; // info
        }
        
        &.已取消 {
          background: #DCDFE6; // 灰色
        }
      }
      
      // 租赁进度条 - 天数进度
      .rental-progress {
        padding: 16px 22px;
        background: #f9fbfe;
        border-bottom: 1px solid #edf2f7;
        
        .progress-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
          color: #606266;
          
          .progress-percent {
            font-weight: bold;
            color: $xtxColor;
          }
        }
        
        .progress-bar-bg {
          height: 10px;
          background: #e0e6ed;
          border-radius: 5px;
          overflow: hidden;
          
          &.preparing {
            background: #fdf6ec;
          }
          
          .progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #27ae60, #2ecc71);
            border-radius: 5px;
            transition: width 0.5s ease;
          }
          
          .progress-bar-fill.pulse {
            background: linear-gradient(90deg, #f39c12, #f1c40f);
            animation: pulse 1.5s infinite;
          }
        }
      }
      
      .order-cancelled {
        padding: 10px 22px;
        background: #fef0f0;
        border-bottom: 1px solid #fde2e2;
        text-align: center;
        color: #f56c6c;
        font-size: 14px;
      }
      
      .remaining-days {
        margin-left: 12px;
        display: inline-flex;
        align-items: center;
        background: #f0f9ff;
        color: #13c2c2;
        padding: 2px 10px;
        border-radius: 10px;
        font-size: 12px;
        
        .el-icon {
          margin-right: 4px;
        }
        
        &.urgent {
          background: #fff2f0;
          color: #ff4d4f;
        }
      }
      
      .rental-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 22px;
        background: #f7fafd;
        border-bottom: 1.5px solid #e4e4e4;
        .order-info {
          .order-id {
            font-size: 15px;
            color: #333;
            margin-right: 18px;
            font-weight: 500;
          }
          .order-time {
            font-size: 14px;
            color: #aaa;
          }
        }
        .order-status {
          display: flex;
          align-items: center;
          
          .el-tag {
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            padding: 2px 14px;
          }
        }
      }
      
      .rental-content {
        padding: 22px;
        display: flex;
        justify-content: space-between;
        border-bottom: 1.5px solid #f2f2f2;
        .product-info {
          display: flex;
          flex: 1;
          .product-image {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 8px;
            box-shadow: 0 2px 8px 0 rgba(0,0,0,0.06);
            transition: transform 0.3s;
            
            &:hover {
              transform: scale(1.05);
            }
          }
          .product-details {
            margin-left: 18px;
            flex: 1;
            .product-name {
              font-size: 17px;
              color: #222;
              margin-bottom: 10px;
              font-weight: 500;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .rental-period {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
              display: flex;
              align-items: center;
              
              .el-icon {
                margin-right: 6px;
                color: #909399;
              }
              
              .rental-days {
                margin-left: 5px;
                color: #999;
              }
            }
            .rental-price {
              font-size: 14px;
              color: #666;
              margin-top: 6px;
            }
          }
        }
        .rental-fees {
          min-width: 200px;
          text-align: right;
          .fee-item {
            margin-bottom: 8px;
            font-size: 14px;
            color: #666;
            .amount {
              margin-left: 5px;
              color: #333;
              font-weight: 500;
            }
            &.total {
              margin-top: 10px;
              font-size: 18px;
              font-weight: bold;
              color: #333;
              .amount {
                color: $priceColor;
              }
            }
          }
        }
      }
      
      .rental-actions {
        padding: 15px 22px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        .el-button {
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    img {
      width: 180px;
      margin-bottom: 20px;
      animation: float 6s ease-in-out infinite;
    }
    p {
      font-size: 16px;
      color: #999;
      margin-bottom: 20px;
    }
    
    .empty-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  /* 只影响文字为"删除"的按钮 */
  .el-message-box__btns .my-messagebox-danger-button {
    background-color: #f56c6c !important; /* Element Plus 的 danger 红色 */
    border-color: #f56c6c !important;
    color: #ffffff !important;
  }

  /* 鼠标悬停时的样式 */
  .el-message-box__btns .my-messagebox-danger-button:hover {
    background-color: #f89898 !important; /* Element Plus 的 danger hover 颜色 */
    border-color: #f89898 !important;
    color: #ffffff !important;
  }

  /* 获得焦点时的样式 (可选，但建议加上以示区分) */
  .el-message-box__btns .my-messagebox-danger-button:focus {
    background-color: #f56c6c !important;
    border-color: #f56c6c !important;
    color: #ffffff !important;
    /* 可以加个轮廓 */
    outline: 2px solid #fab6b6 !important;
    outline-offset: 1px !important;
  }

  /* 激活（点击时）的样式 */
  .el-message-box__btns .my-messagebox-danger-button:active {
    background-color: #d95f5f !important; /* Element Plus 的 danger active 颜色 */
    border-color: #d95f5f !important;
    color: #ffffff !important;
    outline: none !important; /* 点击时通常移除轮廓 */
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}
</style>