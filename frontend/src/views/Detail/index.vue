<script setup>
import { ref, onMounted, watch ,computed} from 'vue'
import { getGoodsById } from '@/mock/goods'
import DetailHot from '@/views/Detail/components/DetailHot.vue'
import ImageView from "@/components/imageView/index.vue"
import Sku from "@/components/sku/index.vue"
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/user'
import starFilled from '@/assets/images/star-filled.png'
import starEmpty from '@/assets/images/star.png'
import '@/styles/element-overrides.scss'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import request from '@/utils/http' // 确保你已经导入了封装好的 axios 实例
import { checkFavoriteAPI, addFavoriteAPI, removeFavoriteAPI } from '@/apis/favorite'
import { getCommentsByProductIdAPI, addCommentAPI, deleteCommentAPI } from '@/apis/commentAPI' // 1. 引入 deleteCommentAPI

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const goods = ref({})
const isFavorite = ref(false)

const currentLoggedInUserId = computed(() => userStore.userInfo?.id || null); // 使用 null 作为未登录时的默认值

// 评论数据---------------------------
const comments = ref([]) // 2. 初始化为空数组，用来存储从后端获取的评论
const isLoadingComments = ref(false) // 加载评论的状态
const activeTab = ref('detail') // 默认显示商品详情

// 提交评论相关 (如果需要)
const newCommentContent = ref('')
const newCommentRating = ref(5) // 默认5星，如果你的评论有星级
const isSubmittingComment = ref(false)

// 获取商品详情数据----------------------------------------
const getGoodDetail = async (id) => { // 传入id，使其更通用
  try {
    const currentProductId = id || route.params.id; // 优先用传入的id，否则用路由参数
    // 使用正确的API函数 getGoodsById (目前是mock)
    // 真实场景: const res = await request.get(`/products/${currentProductId}`)
    const res = await getGoodsById(currentProductId)
    console.log('商品详情响应:', res)

    if (res && res.result) {
      goods.value = res.result
      console.log('赋值后的商品对象:', goods.value)
      // 获取商品数据后检查收藏状态
      checkIsFavorite()
      // 3. 获取商品成功后，立即获取该商品的评论
      if (goods.value.id) {
        fetchComments(goods.value.id)
      }
    } else {
      goods.value = {}
      comments.value = [] // 商品加载失败，清空评论
    }
  } catch (error) {
    console.error('获取商品详情失败', error)
    ElMessage.error('获取商品详情失败')
    goods.value = {}
    comments.value = []
  }
}

// 获取商品评论列表的函数------------------------------
const fetchComments = async (productId) => {
  if (!productId) return;
  isLoadingComments.value = true;
  try {
    const res = await getCommentsByProductIdAPI(String(productId));
    if (res && res.code === 0 && Array.isArray(res.data)) {
      const commentData = res.data;
      comments.value = commentData.map(comment => {
         // 重点在这里打印后端原始的 comment.user.id
         console.log('--- Comment Data from API ---');
        console.log('Backend comment.user.id:', comment.user?.id, 'Type:', typeof comment.user?.id);

        const formattedDate = comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('zh-CN') : '未知日期';
        return {
          id: comment.id, // 评论本身的ID
          avatar: comment.user.avatarUrl,
          nickname: comment.user.username,
          date: formattedDate,
          content: comment.content || '用户未填写评价内容',
          star: comment.starRating !== undefined ? comment.starRating : 5,
          userId: comment.user.id, // 2. 确保这里从后端数据中获取并存储了评论发表者的 user_id
                                  // 假设后端返回的 comment.user 对象中有 id 字段代表用户ID
        };
      });
    } else {
      comments.value = [];
      console.warn('获取评论失败或数据格式不正确:', res);
    }
  } catch (error) {
    console.error('获取商品评论失败 (catch):', error);
    comments.value = [];
    ElMessage.error('加载评论失败');
  } finally {
    isLoadingComments.value = false;
  }
};

// 3. 实现 handleDeleteComment 方法
const handleDeleteComment = async (commentId) => {
  if (!commentId) return;

  // 再次确认用户是否登录，虽然按钮本身有 v-if，但多一层保险
  if (!userStore.isLoggedIn || !currentLoggedInUserId.value) {
    ElMessage.warning('请先登录后再进行操作');
    return;
  }

  try {
    await ElMessageBox.confirm(
      '您确定要删除这条评论吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    console.log(`[Frontend] Attempting to delete comment with ID: ${commentId}`);
    const res = await deleteCommentAPI(commentId); // 调用API

    if (res && res.code === 0) {
      ElMessage.success(res.message || '评论删除成功！');
      // 从前端列表中移除被删除的评论
      comments.value = comments.value.filter(c => c.id !== commentId);
      // 如果有评论总数显示在其他地方，也需要更新
      // 例如，如果 goods.value.commentCount 存在且被使用
      // if (goods.value && typeof goods.value.commentCount === 'number') {
      //   goods.value.commentCount--;
      // }
    } else {
      ElMessage.error(res?.message || '删除评论失败，请稍后重试。');
    }
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消删除操作');
    } else {
      console.error('删除评论过程中发生错误:', error);
      const errorMessage = error?.response?.data?.message || error?.message || '删除操作失败，请检查网络或联系管理员。';
      ElMessage.error(errorMessage);
    }
  }
};

// 检查商品是否已收藏
const checkIsFavorite = async () => {
  if (!userStore.isLoggedIn || !goods.value?.id) {
    isFavorite.value = false
    return
  }
  
  try {
    const res = await checkFavoriteAPI(goods.value.id)
    console.log('收藏检查响应:', res) // 调试关键
    
    // 统一处理响应格式
    let favorites = []
    if (res?.code === 0) {
      favorites = res.data || res.result || []
    } else if (Array.isArray(res)) {
      favorites = res
    }
    
    // 严格类型匹配
    const targetId = String(goods.value.id) // 统一转为字符串比较
    isFavorite.value = favorites.some(item => 
      String(item.id) === targetId || 
      String(item.product_id) === targetId
    )
    
    console.log('最终收藏状态:', isFavorite.value) // 调试关键
  } catch (error) {
    console.error('检查收藏状态失败', error)
    isFavorite.value = false
  }
}

// 切换收藏状态
const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    // 直接使用原始ID，不转换为数字
    const productId = goods.value.id
    
    if (isFavorite.value) {
      // 取消收藏
      const res = await removeFavoriteAPI(productId)
      if (res && res.code === 0) {
        ElMessage.success('已取消收藏')
        isFavorite.value = false
      } else {
        ElMessage.success('已取消收藏')
        isFavorite.value = false
      }
    } else {
      // 添加收藏
      const product = {
        id: productId, // 使用原始ID
        name: goods.value.name,
        price: goods.value.price,
        picture: goods.value.picture
      }
      const res = await addFavoriteAPI(product)
      if (res && res.code === 0) {
        ElMessage.success('收藏成功')
        isFavorite.value = true
      } else {
        ElMessage.success('收藏成功')
        isFavorite.value = true
      }
    }
  } catch (error) {
    console.error('操作收藏失败', error)
    ElMessage.error('操作失败，请稍后再试')
  }
}

// 整合 onMounted 和 watch
onMounted(() => {
  // 打印 userStore 的状态，看看 userInfo 和 id 是什么
  console.log('--- User Store State ---');
  console.log('userStore.isLoggedIn:', userStore.isLoggedIn);
  console.log('userStore.token:', userStore.token);
  console.log('userStore.userInfo (raw from store):', JSON.parse(JSON.stringify(userStore.userInfo)));
  console.log('userStore.userInfo.id (from store):', userStore.userInfo?.id, 'Type:', typeof userStore.userInfo?.id);

  // 打印计算属性 currentLoggedInUserId
  console.log('--- Computed currentLoggedInUserId ---');
  console.log('currentLoggedInUserId.value:', currentLoggedInUserId.value);
  console.log('Type of currentLoggedInUserId.value:', typeof currentLoggedInUserId.value);

  const productIdFromRoute = route.params.id
  if (productIdFromRoute) {
    getGoodDetail(productIdFromRoute) // 调用整合后的函数
  }
})

watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) { // 确保 ID 真实变化了再重新加载
    // 清空旧数据，避免用户看到旧商品信息一闪而过
    goods.value = {}
    comments.value = []
    isFavorite.value = false
    getGoodDetail(newId)
  }
}, { immediate: false }) // immediate: true 会导致 onMounted 后立即执行一次，如果 onMounted 已处理则设为 false

// 监听商品ID变化 (如果商品ID可能通过其他方式改变，比如父组件props)
// watch(() => goods.value.id, (newProductId) => {
//   if (newProductId) {
//     checkIsFavorite() // 收藏状态依赖商品ID
//     fetchComments(newProductId) // 评论也依赖商品ID
//   }
// })


// 提交评论的函数 (如果需要)------------------------------
const handleSubmitComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录再发表评价')
    // router.push('/login') // 可以引导用户去登录
    return
  }
  if (!newCommentContent.value.trim()) {
    ElMessage.warning('评价内容不能为空哦~')
    return
  }
  if (!goods.value || !goods.value.id) {
    ElMessage.error('商品信息加载异常，暂时无法评价')
    return
  }

  isSubmittingComment.value = true
  try {
    const commentPayload = {
      productId: String(goods.value.id),
      content: newCommentContent.value,
      starRating: newCommentRating.value, // <--- 修改这里：字段名改为 starRating
                                         // 确保 newCommentRating.value 是用户实际选择的评分
    }
    // 假设 addCommentAPI 是你封装的调用后端 POST /products/:productId/comments 的函数
    const res = await addCommentAPI(commentPayload)
    if (res && res.code === 0) {
      ElMessage.success(res.message || '评价发表成功！感谢您的反馈！')
      newCommentContent.value = ''
      newCommentRating.value = 5   // 发表成功后，可以将评分输入重置为默认值
      fetchComments(goods.value.id) // 刷新评论列表
    } else {
      ElMessage.error(res.message || '评价发表失败，请稍后再试')
    }
  } catch (error) {
    console.error('提交评论出错:', error)
    ElMessage.error('网络繁忙，评价提交失败')
  } finally {
    isSubmittingComment.value = false
  }
}


const cartStore = useCartStore()
const goBack = () => {
  router.go(-1)
}

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  }
})

// SKU组件回调
const skuChange = (sku) => {
  console.log(sku)
}

const count = ref(1)

// 数量增减功能
const updateCount = (type) => {
  if (type === 'minus' && count.value > 1) {
    count.value--
  } else if (type === 'plus') {
    count.value++
  }
}

// 添加购物车和立即购买
const addToCart = () => {
  console.log('--- Detail/index.vue addToCart 开始执行 ---');

  // 确保 goods.value 已经加载并且包含必要信息
  if (!goods.value || !goods.value.id || goods.value.name === undefined || goods.value.price === undefined || goods.value.picture === undefined) {
    ElMessage.error('商品信息不完整，无法添加到购物车');
    console.error('商品信息缺失，无法添加到购物车:', goods.value);
    return;
  }

  const productToAdd = {
    id: goods.value.id,
    name: goods.value.name,
    price: Number(goods.value.price),
    picture: goods.value.picture, // <-- 将 'image' 改为 'picture'
    // 如果后端需要 shop 字段，并且 goods.value 中有 brand 信息，可以保留
    // shop: goods.value.brand?.name || '默认店铺',
    // quantity 字段不需要在这里构建，因为 Store 的 action 会接收 quantity 参数
  };

  console.log('Detail/index.vue: 调用 cartStore.addToCart 前，传递的商品数据:', productToAdd);
  console.log('Detail/index.vue: 调用 cartStore.addToCart 前，传递的数量:', count.value);

  const cartStore = useCartStore(); // 在需要使用 Store 的地方获取实例

  // 调用 store 的 action，传递商品对象和数量
  cartStore.addToCart(productToAdd, count.value); // <-- 调用 Store 的 action，传递 productToAdd 和 count.value

  // 提示信息应该在 store 的 action 中处理，这里可以移除或根据需要调整
  // ElMessage.success(`已加入购物车 × ${count.value}`)
}

const buyNow = () => {
  ElMessage.info(`立即购买 × ${count.value}`)
}

// 根据 id 获取商品数据
const loadGoods = async () => {
  try {
    const { result } = await getGoodsById(props.id)

    if (result && result.id) {
      goods.value = result
      checkIsFavorite() // 商品加载后检查收藏状态
    } else {
      goods.value = {}
    }
  } catch (error) {
    console.error(`获取商品详情失败 (ID: ${props.id}):`, error)
    goods.value = {}
  }
}

onMounted(() => {
  loadGoods()
})

watch(() => props.id, (newId) => {
  if (newId) {
    loadGoods()
  }
})

// 监听商品变化，重新检查收藏状态
watch(() => goods.value.id, () => {
  if (goods.value.id) {
    checkIsFavorite()
  }
})

// 添加商品详情和用户评价的切换功能


// 租赁相关
const showRentalDialog = ref(false)
const rentalDates = ref(null)
const rentalPrice = computed(() => {
  // 日租金约为商品价格的2%，最低5元
  return Math.max(Math.round((goods.value?.price || 0) * 0.02), 5)
})

const rentalDays = computed(() => {
  if (!rentalDates.value) return 0
  const [start, end] = rentalDates.value
  if (!start || !end) return 0
  // 计算日期差，+1因为包含首尾日期
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
})

const totalRentalFee = computed(() => {
  return rentalPrice.value * rentalDays.value
})

const depositAmount = computed(() => {
  // 押金为商品价格的30%
  return Math.round((goods.value?.price || 0) * 0.3)
})

const totalAmount = computed(() => {
  return totalRentalFee.value + depositAmount.value
})

const calculateRentalFee = () => {
  // 可以在这里添加额外的计算逻辑
  console.log(`租赁${rentalDays.value}天，总费用：${totalAmount.value}元`)
}

const confirmRental = async () => { // <-- 改为 async 函数，因为要等待网络请求
  console.log('>>> DEBUG: confirmRental 函数被调用 <<<'); // 添加日志
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  if (!rentalDates.value) {
    ElMessage.warning('请选择租赁日期')
    return
  }

  // 准备要发送到后端的数据
  const orderData = {
    // 注意：后端 POST /rentals 接口需要这些字段
    productId: goods.value.id,
    productName: goods.value.name,
    productPicture: goods.value.picture, // 后端需要 productPicture
    rentalPrice: rentalPrice.value,
    deposit: depositAmount.value, // 后端需要 deposit
    days: rentalDays.value,
    startDate: rentalDates.value[0].toISOString().split('T')[0],
    endDate: rentalDates.value[1].toISOString().split('T')[0],
    rentalFee: totalRentalFee.value, // 后端需要 rentalFee
    totalAmount: totalAmount.value,
    // 后端会根据用户 token 获取 user_id，并设置 status 和 createdAt
    // 所以前端不需要发送 id, status, createdAt, user_id
  }

  console.log('>>> DEBUG: 准备发送到后端的订单数据:', orderData); // 添加日志

  try {
    // 调用后端 POST /rentals 接口
    const res = await request.post('/rentals', orderData, {
         headers: {
            Authorization: `Bearer ${userStore.userInfo.token}` // 确保发送 token
         }
    });

    console.log('>>> DEBUG: POST /api/rentals 响应:', res); // 添加日志

    // 检查后端返回的 code
    if (res.code === 0) {
      ElMessage.success(res.message || '租赁订单创建成功')
      showRentalDialog.value = false

      // 成功后导航到我的租赁页面
      router.push('/my-rentals')

    } else {
      // 如果后端返回 code 不为 0，显示后端返回的错误消息
      ElMessage.error(res.message || '租赁订单创建失败')
    }

  } catch (error) {
    console.error('创建租赁订单出错:', error)
    // 处理后端返回的特定错误码或消息
    if (error.response && error.response.data && error.response.data.message) {
         ElMessage.error(error.response.data.message);
    } else {
        ElMessage.error('创建租赁订单失败，请稍后再试');
    }
  }



  ElMessage.success('租赁成功')
  showRentalDialog.value = false

  // 可选：导航到我的租赁页面
  router.push('/my-rentals')
}
</script>

<template>
  <div class="xtx-goods-page">
    <div class="container" v-if="goods && goods.id">
      <div class="bread-container">
        <el-breadcrumb separator=">">
          <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: `/category/${goods.categories?.[1]?.id}` }">
            {{ goods.categories?.[1]?.name || '未知分类' }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: `/category/sub/${goods.categories?.[0]?.id}` }">
            {{ goods.categories?.[0]?.name || '未知子分类' }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ goods.name || '商品名称' }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 商品信息 -->
      <div class="info-container">
        <div>
          <div class="goods-info">
            <div class="media">
              <ImageView :image-url="goods.picture" />

              <!-- 统计数量 -->
              <ul class="goods-sales">
                <li>
                  <p>销量人气</p>
                  <p>{{ goods.salesCount || 0 }}+ </p>
                  <p><i class="iconfont icon-task-filling"></i>销量人气</p>
                </li>
                <li>
                  <p>商品评价</p>
                  <p>{{ goods.commentCount || 0 }}+ </p>
                  <p><i class="iconfont icon-comment-filling"></i>查看评价</p>
                </li>
                <li>
                  <p>收藏人气</p>
                  <p>{{ goods.collectCount || 0 }}+ </p>
                  <p><i class="iconfont icon-favorite-filling"></i>收藏商品</p>
                </li>
                <li>
                  <p>品牌信息</p>
                  <p>{{ goods.brand?.name || '未知品牌' }}</p>
                  <p><i class="iconfont icon-dynamic-filling"></i>品牌主页</p>
                </li>
              </ul>
            </div>

            <div class="spec">
              <div class="g-name">
                {{ goods.name || '商品名称' }}
                <img :src="isFavorite ? starFilled : starEmpty" class="favorite-icon" @click="toggleFavorite"
                  alt="收藏" />
              </div>
              <p class="g-desc">{{ goods.desc || '商品描述' }}</p>
              <p class="g-price">
                <span class="new-price">{{ goods.price || 0 }}</span>
                <span class="old-price">{{ goods.oldPrice || 0 }}</span>
              </p>

              <!-- 送至信息 -->
              <div class="delivery-info">
                <div class="delivery-row">
                  <span class="label">送至</span>
                  <div class="delivery-content">
                    <div class="estimated-delivery">
                      预计4月29日24:00前发货
                      <span class="free-shipping">包邮</span>
                      <i class="el-icon-info-circle"></i>
                    </div>
                    <div class="address">
                      上海市嘉定区曹安公路4800号同济大学嘉定校区友园5号楼 <i class="el-icon-arrow-down"></i>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 服务信息 -->
              <div class="service-info">
                <div class="service-row">
                  <span class="label">服务</span>
                  <div class="service-content">
                    <div class="service-tags">
                      <span>可配送全球</span>
                      <span>极速审核</span>
                      <span>闪电退款</span>
                      <span>免费上门退换</span>
                      <span>破损包退换</span>
                      <i class="el-icon-arrow-down"></i>
                    </div>
                    <div class="store-service">
                      店铺发货&售后服务 · 支持7天无理由退货
                    </div>
                  </div>
                </div>
              </div>

              <div class="g-service">
                <dl>
                  <dt>促销</dt>
                  <dd>12月好物放送，App领券购买直降120元</dd>
                </dl>
                <dl>
                  <dt>服务</dt>
                  <dd>
                    <span>无忧退货</span>
                    <span>快速退款</span>
                    <span>免费包邮</span>
                    <a href="javascript:;">了解详情</a>
                  </dd>
                </dl>
              </div>

              <!-- 数量选择器 -->
              <div class="quantity-selector">
                <span class="label">数量</span>
                <div class="selector">
                  <button class="minus" @click="updateCount('minus')" :disabled="count <= 1">-</button>
                  <span class="count">{{ count }}</span>
                  <button class="plus" @click="updateCount('plus')">+</button>
                </div>
              </div>

              <!-- 按钮区域 -->
              <div class="action-buttons">
                <div class="main-buttons">
                  <button class="cart-btn" @click="addToCart">
                    <i class="el-icon-shopping-cart-2"></i>
                    加入购物车
                  </button>
                  <button class="buy-btn" @click="buyNow">立即购买</button>
                </div>
                <button class="rent-btn" @click="showRentalDialog = true">
                  <i class="el-icon-time"></i>
                  立即租赁
                </button>
              </div>

              <!-- 租赁日期选择对话框 -->
              <el-dialog title="请选择租赁日期" v-model="showRentalDialog" width="420px" custom-class="rental-dialog" :style="{
                   // 新增以下样式
                  maxHeight: '65vh', // 限制弹窗最大高度为视口的70%
                  display: 'flex',   // 弹性布局防止内容溢出
                  flexDirection: 'column',
                  overflow: 'hidden', // 隐藏外层滚动条
                  // 原有样式保持不变
                  borderRadius: '8px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                  border: '1.5px solid #c0c4cc',
                  backgroundColor: '#fafafa'
              }">
                <div class="rental-content">
                  <!-- 商品信息块 -->
                  <div class="product-preview" :style="{
                    display: 'flex',
                    gap: '15px',
                    marginBottom: '20px',
                    paddingBottom: '15px',
                    borderBottom: '1px solid #d3dce6'
                  }">
                    <img :src="goods.picture" alt="商品图片" class="product-image" :style="{
                      width: '80px',
                      height: '80px',
                      borderRadius: '6px',
                      objectFit: 'cover'
                    }" />
                    <div class="product-info" :style="{ flex: 1 }">
                      <p class="product-name" :style="{
                        fontSize: '22px',          // 标题字体稍大
                        fontWeight: '700',
                        color: '#2c3e50',
                        margin: '0 0 8px 0'
                      }">
                        {{ goods.name }}
                      </p>
                      <p class="product-price" :style="{
                        fontSize: '15px',
                        color: '#7f8c8d',
                        margin: '0'
                      }">
                        单价：
                        <span :style="{ color: '#ff6b00', fontWeight: '600' }">¥{{ rentalPrice }}</span>/天
                      </p>
                    </div>
                  </div>

                  <!-- 日期选择块 -->
                  <div class="date-selection" :style="{ marginBottom: '28px' }">
                    <p class="section-title" :style="{
                      color: '#7f8c8d',
                      margin: '0 0 12px 0',
                      fontWeight: '600'
                    }">
                      选择租赁时间
                    </p>
                    <el-date-picker v-model="rentalDates" type="daterange" range-separator="至" start-placeholder="开始日期"
                      end-placeholder="结束日期" :min-date="new Date()" style="width: 100%" @change="calculateRentalFee" />
                  </div>

                  <!-- 费用明细块 -->
                  <div class="rental-summary" :style="{ marginTop: '16px' }">
                    <div class="summary-item" :style="{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '24px'       // 间距拉开
                    }">
                      <span :style="{ color: '#7f8c8d', fontWeight: '500' }">租赁天数</span>
                      <span :style="{ color: '#3498db', fontWeight: '600' }">{{ rentalDays }}天</span>
                    </div>
                    <div class="summary-item" :style="{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '24px'
                    }">
                      <span :style="{ color: '#7f8c8d', fontWeight: '500' }">租赁费用</span>
                      <span class="fee" :style="{ color: '#27ae60', fontWeight: '600' }">¥{{ totalRentalFee }}</span>
                    </div>
                    <div class="summary-item" :style="{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '24px'
                    }">
                      <span :style="{ color: '#7f8c8d', fontWeight: '500' }">押金</span>
                      <span class="fee" :style="{ color: '#f39c12', fontWeight: '600' }">¥{{ depositAmount }}</span>
                    </div>
                    <div class="summary-item total" :style="{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '16px',
                      borderTop: '1.5px solid #d3dce6',
                      fontWeight: '700',
                      fontSize: '20px',
                      color: '#2c3e50'
                    }">
                      <span>总计</span>
                      <span class="fee" :style="{ color: '#e74c3c', fontSize: '22px' }">¥{{ totalAmount }}</span>
                    </div>
                  </div>
                </div>

                <template #footer>
                  <div class="dialog-footer" :style="{
                    paddingTop: '16px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                  }">
                    <el-button @click="showRentalDialog = false" :style="{
                      color: '#7f8c8d',
                      borderColor: '#bdc3c7'
                    }">
                      取消
                    </el-button>
                    <el-button type="primary" @click="confirmRental" :disabled="!rentalDates" :style="rentalDates
                      ? {
                        backgroundColor: '#1abc9c',
                        borderColor: '#16a085',
                        color: 'white'
                      }
                      : {
                        backgroundColor: '#dcdfe6',
                        borderColor: '#dcdfe6',
                        color: '#a6abb3',
                        cursor: 'not-allowed',
                        opacity: 0.7
                      }">
                      确认租赁
                    </el-button>
                  </div>
                </template>
              </el-dialog>
            </div>
          </div>

          <div class="goods-footer">
            <div class="goods-article">
              <!-- 商品详情和用户评价的选项卡 -->
              <div class="tab-header">
                <div class="tab-btns">
                  <button :class="['tab-btn', { active: activeTab === 'detail' }]" @click="activeTab = 'detail'">
                    商品详情
                  </button>
                <!-- 5. 动态显示评论数量 ---------------------->
                <button :class="['tab-btn', { active: activeTab === 'comment' }]" @click="activeTab = 'comment'">
                    用户评价({{ comments.length  }})
                  </button>
                </div>
                <div class="tab-line"></div>
              </div>

              <!-- 商品详情内容 -->
              <div v-show="activeTab === 'detail'" class="goods-tabs">
                <div class="goods-detail">
                  <!-- 商品属性 -->
                  <ul class="attrs" v-if="goods.details?.properties">
                    <li v-for="item in goods.details.properties" :key="item.value">
                      <span class="dt">{{ item.name }}</span>
                      <span class="dd">{{ item.value }}</span>
                    </li>
                  </ul>
                  <!-- 商品图片 -->
                  <img v-for="img in goods.details?.pictures" :src="img" :key="img" alt=""
                    v-if="goods.details?.pictures">
                </div>
              </div>

<!-- 用户评价内容 --------------------------------->
<div v-show="activeTab === 'comment'" class="goods-comments">
                <div class="comment-header">
                  <div class="comment-stats">
                    <!-- 你可以根据实际评论数据计算好评率等 -->
                    <div class="stat-item">
                      <span class="rate">
                        {{ comments.length > 0 ? Math.round(comments.filter(c => c.star >= 4).length / comments.length * 100) : '100' }}%
                      </span>
                      <span class="label">好评率</span>
                    </div>
                    <div class="tags">
                      <span class="tag active">全部({{ comments.length }})</span>
                      <span class="tag">好评({{ comments.filter(c => c.star >= 4).length }})</span>
                      <span class="tag">中评({{ comments.filter(c => c.star === 3).length }})</span>
                      <span class="tag">差评({{ comments.filter(c => c.star <= 2).length }})</span>
                      <!-- <span class="tag">有图(0)</span> -->
                    </div>
                  </div>
                </div>

                <!-- 6. 评论列表渲染 -->
                <div v-if="isLoadingComments" class="loading-placeholder" style="text-align: center; padding: 20px;">正在加载评论...</div>
    <div v-else-if="comments.length > 0" class="comment-list">
      <div class="comment-item" v-for="comment in comments" :key="comment.id">
        <div class="user-info">
          <img class="avatar" :src="comment.avatar" alt="用户头像" @error="($event.target.src = '/images/avatars/default_fallback.png')"> <!-- 确保默认头像路径正确 -->
          <span class="nickname">{{ comment.nickname }}</span>
        </div>
        <div class="comment-content">
          <div class="rating">
            <el-rate
              :model-value="comment.star"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value} 星"
              size="small"
            />
            <span class="date">{{ comment.date }}</span>
          </div>
          <div class="text">{{ comment.content }}</div>
          <!-- 删除按钮 -->
          <div class="comment-actions" style="margin-top: 5px; text-align: right;">
            <el-button
              v-if="comment.userId === currentLoggedInUserId && currentLoggedInUserId !== null"
              type="danger"
              link
              size="small"
              @click="handleDeleteComment(comment.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-comments-placeholder" style="text-align: center; padding: 20px; color: #999;">暂无评价，期待您的第一条评价！</div>


                <!-- 7. 提交评论表单 (如果需要) -->
                <div class="comment-form-container" v-if="userStore.isLoggedIn" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <h4>发表我的评价</h4>
                  <div style="margin-bottom: 10px;">
                    <span style="margin-right: 10px;">评分:</span>
                    <el-rate v-model="newCommentRating" />
                  </div>
                  <el-input
                    type="textarea"
                    :rows="4"
                    placeholder="分享您的购买心得吧~ (最多输入500字)"
                    v-model="newCommentContent"
                    maxlength="500"
                    show-word-limit
                  ></el-input>
                  <el-button
                    type="primary"
                    @click="handleSubmitComment"
                    :loading="isSubmittingComment"
                    style="margin-top: 15px;"
                    :disabled="!newCommentContent.trim()"
                  >
                    提交评价
                  </el-button>
                </div>
                <div v-else style="margin-top: 20px; text-align: center; color: #666;">
                  <p>您需要 <el-button type="primary" link @click="router.push('/login')">登录</el-button> 后才能发表评价哦~</p>
                </div>

              </div>
            </div>

            <div class="goods-aside">
              <DetailHot />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="loading-placeholder" style="text-align: center; padding: 50px;">商品详情加载中...</div>
  </div>
</template>

<style lang='scss'>
@use "@/styles/common.scss" as *;
.xtx-goods-page {
  .container {
    padding: 0 20px;
  }

  .info-container {
    background: #fff;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .goods-info {
    display: flex;
    padding: 30px 0;
    position: relative;

    .media {
      width: 580px;
      padding: 30px 50px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .goods-sales {
        display: flex;
        width: 100%;
        align-items: center;
        text-align: center;
        height: 140px;
        background: #f5f5f5;
        margin-top: 20px;
        border-radius: 4px;

        li {
          flex: 1;
          position: relative;

          ~li::after {
            position: absolute;
            top: 10px;
            left: 0;
            height: 60px;
            border-left: 1px solid #e4e4e4;
            content: "";
          }

          p {
            &:first-child {
              color: #999;
            }

            &:nth-child(2) {
              color: $priceColor;
              margin-top: 10px;
              font-weight: bold;
            }

            &:last-child {
              color: #666;
              margin-top: 10px;

              i {
                color: $xtxColor;
                font-size: 14px;
                margin-right: 2px;
              }

              &:hover {
                color: $xtxColor;
                cursor: pointer;
              }
            }
          }
        }
      }
    }

    .spec {
      flex: 1;
      padding: 30px 30px 30px 0;
      display: flex;
      flex-direction: column;
      position: relative;
    }
  }

  .goods-footer {
    display: flex;
    margin-top: 20px;

    .goods-article {
      flex: 1;
      margin-right: 20px;
      background: #fff;
      border-radius: 4px;
      padding: 0 20px 30px;
    }

    .goods-aside {
      width: 280px;
      min-height: 600px;
    }
  }

  .g-name {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 22px;

    .favorite-icon {
      width: 24px;
      height: 24px;
      cursor: pointer;
      margin-left: 10px;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  .g-desc {
    color: #999;
    margin-bottom: 20px;
  }

  .g-price {
    margin-bottom: 20px;

    .new-price {
      font-size: 24px;
      color: $priceColor;
      font-weight: bold;
      margin-right: 10px;

      &::before {
        content: "¥";
        font-size: 16px;
      }
    }

    .old-price {
      color: #999;
      text-decoration: line-through;

      &::before {
        content: "¥";
        font-size: 14px;
      }
    }
  }

  /* 送至信息样式 */
  .delivery-info {
    border-top: 1px solid #f5f5f5;
    padding: 15px 0;

    .delivery-row {
      display: flex;
      align-items: flex-start;

      .label {
        width: 60px;
        color: #999;
      }

      .delivery-content {
        flex: 1;

        .estimated-delivery {
          color: #666;
          margin-bottom: 8px;

          .free-shipping {
            display: inline-block;
            padding: 2px 6px;
            background: #f5f5f5;
            color: #666;
            border-radius: 2px;
            margin: 0 4px;
          }
        }

        .address {
          color: #333;
          cursor: pointer;

          i {
            margin-left: 5px;
            color: #999;
          }
        }
      }
    }
  }

  /* 服务信息样式 */
  .service-info {
    border-top: 1px solid #f5f5f5;
    padding: 15px 0;

    .service-row {
      display: flex;
      align-items: flex-start;

      .label {
        width: 60px;
        color: #999;
      }

      .service-content {
        flex: 1;

        .service-tags {
          color: #666;
          margin-bottom: 8px;

          span {
            display: inline-block;
            margin-right: 10px;
            position: relative;
            padding-left: 12px;

            &::before {
              content: "•";
              color: $xtxColor;
              position: absolute;
              left: 0;
            }
          }

          i {
            color: #999;
            cursor: pointer;
          }
        }

        .store-service {
          color: #999;
        }
      }
    }
  }

  .g-service {
    background: #f5f5f5;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 4px;

    dl {
      display: flex;
      margin-bottom: 10px;

      &:last-child {
        margin-bottom: 0;
      }

      dt {
        width: 60px;
        color: #666;
      }

      dd {
        flex: 1;
        color: #333;

        span {
          margin-right: 10px;
          position: relative;
          padding-left: 10px;

          &::before {
            content: "•";
            color: $xtxColor;
            position: absolute;
            left: 0;
          }
        }

        a {
          color: $xtxColor;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }

  // 数量选择器样式
  .quantity-selector {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .label {
      width: 60px;
      color: #666;
    }

    .selector {
      display: flex;
      align-items: center;
      border: 1px solid #e4e4e4;
      border-radius: 4px;

      button {
        width: 36px;
        height: 36px;
        background: #f8f8f8;
        border: none;
        font-size: 16px;
        cursor: pointer;

        &:hover:not(:disabled) {
          background: #f0f0f0;
        }

        &:disabled {
          color: #ccc;
          cursor: not-allowed;
        }
      }

      .count {
        width: 50px;
        text-align: center;
        border-left: 1px solid #e4e4e4;
        border-right: 1px solid #e4e4e4;
        line-height: 36px;
      }
    }
  }

// 按钮区域样式改进
.action-buttons {
  display: flex;
  gap: 10px; // 减小间隙
  margin-top: auto;
  padding-bottom: 0;

  .main-buttons {
    display: flex;
    flex: 3; // 增加主按钮区域比例

    .cart-btn {
      flex: 2; // 购物车按钮较短
      height: 42px;
      background: linear-gradient(90deg, rgb(255, 203, 0), rgb(255, 148, 2));
      color: white;
      border: none;
      border-radius: 4px 0 0 4px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        margin-right: 5px;
      }

      &:hover {
        opacity: 0.9;
      }
    }

    .buy-btn {
      flex: 3; // 购买按钮较长
      height: 42px;
      background: linear-gradient(90deg, #ff5000, #ff0036); // 淘宝风格渐变
      color: #fff;
      border: none;
      border-radius: 0 4px 4px 0;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.9;
      }
    }
  }

  .rent-btn {
    flex: 0.8; // 租赁按钮更窄
    height: 42px;
    background: linear-gradient(90deg, #2ecc71, #27ae60);
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      margin-right: 5px;
    }

    &:hover {
      opacity: 0.9;
    }
  }
}

// 租赁对话框样式
// 让对话框往上挪（top: 60px），并整体美化
:deep(.el-overlay) {
  .rental-dialog.el-dialog {
    position: fixed !important;
    top: 60px !important;
    left: 50%;
    transform: translateX(-50%);
    margin: 0 !important;
    width: 420px;
    border-radius: 16px !important;
    box-shadow: 0 8px 32px rgba(40, 199, 111, 0.15), 0 1.5px 8px rgba(0, 0, 0, 0.08);
    background: #fff;
    overflow: visible; // 允许阴影显示
  }
  .el-dialog__header {
    background: linear-gradient(90deg, #28c76f 60%, #20a55b 100%);
    padding: 20px 28px 12px 28px;
    margin: 0;
    border-radius: 16px 16px 0 0;

    .el-dialog__title {
      color: #fff;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .el-dialog__headerbtn .el-dialog__close {
      color: #fff;
      font-size: 20px;
      opacity: 0.8;

      &:hover {
        opacity: 1;
      }
    }
  }

  .el-dialog__body {
    padding: 24px 28px 12px 28px;
    background: #f8f9fa;
  }

  .rental-content {
    .product-preview {
      display: flex;
      align-items: center;
      margin-bottom: 18px;
      padding-bottom: 18px;
      border-bottom: 1px solid #e4e4e4;

      .product-image {
        width: 110px;
        height: 110px;
        object-fit: cover;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(40, 199, 111, 0.08);
        border: 2px solid #e8f8f2;
      }

      .product-info {
        margin-left: 18px;
        flex: 1;

        .product-name {
          font-size: 16px;
          font-weight: 500;
          color: #222;
          margin-bottom: 6px;
          line-height: 1.3;
        }

        .product-price {
          font-size: 18px;
          color: #ff5000;
          font-weight: bold;
        }
      }
    }

    .date-selection {
      margin-bottom: 18px;

      .section-title {
        font-size: 15px;
        font-weight: 600;
        color: #28c76f;
        margin-bottom: 10px;
        letter-spacing: 1px;
        position: relative;
        padding-left: 10px;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 16px;
          background: #28c76f;
          border-radius: 2px;
        }
      }

      .el-date-picker {
        width: 100%;

        .el-range-input {
          color: #333;
        }

        .el-range-separator {
          color: #666;
        }

        .el-icon {
          color: #28c76f;
        }
      }
    }

    // 日期选中美化
    :deep(.el-date-table td.in-range div) {
      background-color: rgba(40, 199, 111, 0.08);
    }

    :deep(.el-date-table td.start-date div),
    :deep(.el-date-table td.end-date div) {
      background-color: #28c76f;
      color: #fff;
    }

    .rental-summary {
      background: #fff;
      padding: 16px 18px;
      border-radius: 10px;
      border: 1px solid #e4e4e4;
      box-shadow: 0 2px 8px rgba(40, 199, 111, 0.04);
      margin-bottom: 8px;

      .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 14px;
        color: #555;

        &.total {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #e4e4e4;
          font-size: 16px;
          color: #222;
          font-weight: bold;

          .fee {
            color: #ff5000;
            font-size: 20px;
          }
        }

        .fee {
          color: #ff5000;
        }
      }
    }
  }

  .el-dialog__footer {
    padding: 16px 28px 20px 28px;
    background: #f8f9fa;
    border-radius: 0 0 16px 16px;
    border-top: 1px solid #e4e4e4;

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 14px;

      .el-button {
        min-width: 90px;
        height: 38px;
        font-size: 15px;
        border-radius: 6px;
        font-weight: 500;

        &--primary {
          background: linear-gradient(90deg, #28c76f 60%, #20a55b 100%);
          border: none;
          color: #fff;
          box-shadow: 0 2px 8px rgba(40, 199, 111, 0.08);

          &:hover {
            background: linear-gradient(90deg, #20a55b 60%, #28c76f 100%);
          }
        }
      }
    }
  }
}

  // 选项卡切换样式
  .tab-header {
    padding: 20px 0 0;
    position: relative;

    .tab-btns {
      display: flex;
      border-bottom: 2px solid #f5f5f5;

      .tab-btn {
        margin-right: 30px;
        padding: 0 0 15px;
        font-size: 18px;
        position: relative;
        border: none;
        background: none;
        cursor: pointer;
        color: #999;

        &.active {
          color: $xtxColor;
          font-weight: bold;

          &::after {
            content: "";
            position: absolute;
            left: 0;
            bottom: -2px;
            width: 100%;
            height: 2px;
            background-color: $xtxColor;
          }
        }
      }
    }
  }
    :deep(.el-picker__popper) {
      .el-date-table {
        td.in-range div {
          background-color: rgba(40, 199, 111, 0.1);
        }
  
        td.start-date div,
        td.end-date div {
          background-color: #28c76f;
          color: white;
        }
      }
    }

  .goods-detail {
    padding: 20px 0;

    .attrs {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 30px;
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;

      li {
        display: flex;
        margin-bottom: 10px;
        width: 50%;

        .dt {
          width: 110px;
          color: #666;
        }

        .dd {
          flex: 1;
          color: #333;
        }
      }
    }

    >img {
      width: 100%;
      display: block;
      margin-bottom: 20px;
    }
  }

  // 评论区样式-------------------------------------
  .goods-comments {
    padding: 20px 0;

    .comment-header {
      padding: 15px 0;
      border-bottom: 1px solid #f5f5f5;

      .comment-stats {
        display: flex;
        align-items: center;
        margin-bottom: 15px;

        .stat-item {
          margin-right: 30px;

          .rate {
            font-size: 24px;
            color: $priceColor;
            font-weight: bold;
          }

          .label {
            color: #999;
            font-size: 14px;
          }
        }

        .tags {
          flex: 1;
          display: flex;
          flex-wrap: wrap;

          .tag {
            display: inline-block;
            padding: 6px 12px;
            margin-right: 10px;
            margin-bottom: 5px;
            border-radius: 4px;
            background: #f5f5f5;
            color: #666;
            cursor: pointer;

            &.active {
              background: rgba(27, 132, 67, 0.1);
              color: $xtxColor;
            }
          }
        }
      }
    }

    .comment-list {
      padding: 20px 0;

      .comment-item {
        display: flex;
        padding: 15px 0;
        border-bottom: 1px solid #f5f5f5;

        .comment-content {
          position: relative; // 为了删除按钮的定位（如果需要绝对定位）
          .comment-actions {
            // 可以添加一些样式让删除按钮不那么突兀，或者调整位置
            // 例如，可以放在右上角
            // position: absolute;
            // top: 0;
            // right: 0;
          }
        }

        .user-info {
          width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;

          .avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            overflow: hidden;
            margin-bottom: 5px;
          }

          .nickname {
            font-size: 14px;
            color: #666;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 100%;
          }
        }

        .comment-content {
          flex: 1;
          padding-left: 15px;

          .rating {
            display: flex;
            align-items: center;
            margin-bottom: 10px;

            .star-icon {
              color: #ffb400;
              margin-right: 2px;
              font-size: 16px;
            }

            .date {
              margin-left: 10px;
              color: #999;
              font-size: 14px;
            }
          }

          .text {
            line-height: 1.5;
            color: #333;
          }
        }
      }
    }
  }

  .bread-container {
    padding: 20px 0;
  }

  .loading-placeholder {
    text-align: center;
    padding: 100px 0;
    font-size: 16px;
    color: #999;
    background: #fff;
    border-radius: 4px;
  }
}
</style>