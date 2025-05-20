<template>
    <div class="cart-page">
        <div class="cart-container">
            <div class="cart-header">
                <div class="left-section">
                    <router-link to="/home" class="home-icon">
                        <img src="@/assets/首页.png" alt="首页">
                    </router-link>
                    <h1>购物车</h1>
                </div>
                <div class="cart-counts">全部商品 ({{ cartStore.totalCount }})</div>
            </div>

            <!-- 功能按钮区域 -->
            <div class="action-buttons">
                <!-- 调用 toggleAll action -->
                <button class="action-button" @click="cartStore.toggleAll(!allSelected)">全选</button>
                <!-- TODO: 实现删除选中商品 -->
                <button class="action-button" @click="cartStore.removeSelectedItems"
                    :disabled="cartStore.selectedCount === 0">删除选中商品</button>
                <!-- TODO: 实现移入收藏夹 -->
                <button class="action-button">移入收藏夹</button>
            </div>

            <!-- 活动促销信息条 -->
            <!-- ... (保持不变) ... -->
            <div class="promotion-bar">
                <div class="promotion-icon">
                    <i class="el-icon-goods"></i>
                </div>
                <div class="promotion-text">
                    您有一张 <span class="highlight">8折</span> 川农校园专享券！限时抢购校园文创服饰
                </div>
                <div class="promotion-countdown">
                    距结束: <span class="countdown">{{ hours }}</span>:<span class="countdown">{{ minutes }}</span>:<span
                        class="countdown">{{ seconds }}</span>
                </div>
            </div>


            <div class="cart-main-content">
                <!-- 左侧购物车列表 -->
                <div class="cart-list-container">
                    <!-- 表头行 -->
                    <div class="cart-table">
                        <div class="cart-header-row">
                            <div class="cell checkbox-cell"></div>
                            <div class="cell product-cell">宝贝名</div>
                            <div class="cell price-cell">单价</div>
                            <div class="cell quantity-cell">数量</div>
                            <div class="cell subtotal-cell">小计</div>
                            <div class="cell operation-cell">操作</div>
                        </div>

                        <!-- 购物车项目 -->
                        <!-- 直接遍历 cartStore.cartItems -->
                        <div v-for="item in cartStore.cartItems" :key="item.id" class="cart-item-row">
                            <div class="cell checkbox-cell">
                                <!-- 调用 updateSelected action -->
                                <el-checkbox :model-value="item.selected"
                                    @change="cartStore.updateSelected(item.id, $event)"></el-checkbox>
                            </div>
                            <div class="cell product-cell">
                                <div class="product-info">
                                    <img :src="item.picture" class="product-image"> <!-- 注意这里是item.picture -->
                                    <div class="product-name">{{ item.name }}</div>
                                </div>
                            </div>
                            <div class="cell price-cell">¥{{ Number(item.price).toFixed(2) }}</div> <!-- 格式化价格 -->
                            <div class="cell quantity-cell">
                                <div class="quantity-control">
                                    <!-- 调用 updateQuantity action -->
                                    <button @click="cartStore.updateQuantity(item.id, item.quantity - 1)"
                                        class="quantity-btn">-</button>
                                    <!-- 使用 @blur 或 @change 触发更新 -->
                                    <input :value="item.quantity" type="text" class="quantity-input"
                                        @blur="cartStore.updateQuantity(item.id, Number($event.target.value))">
                                    <!-- 调用 updateQuantity action -->
                                    <button @click="cartStore.updateQuantity(item.id, item.quantity + 1)"
                                        class="quantity-btn">+</button>
                                </div>
                            </div>
                            <div class="cell subtotal-cell">¥{{ (Number(item.price) * item.quantity).toFixed(2) }}</div>
                            <!-- 计算小计 -->
                            <div class="cell operation-cell">
                                <!-- 调用 removeItem action -->
                                <button @click="cartStore.removeItem(item.id)" class="delete-btn">删除</button>
                            </div>
                        </div>
                    </div>

                    <!-- 无商品时显示 -->
                    <div v-if="cartStore.cartItems.length === 0" class="empty-cart">
                        <img src="@/assets/empty-cart.png" alt="购物车为空">
                        <p>购物车还是空的哦，去挑选商品吧~</p>
                        <router-link to="/home" class="go-shopping-btn">去购物</router-link>
                    </div>

                    <!-- 底部"没有更多了"提示 -->
                    <div class="no-more-items">没有更多了</div>
                </div>

                <!-- 右侧结算区域 -->
                <div class="checkout-sidebar">
                    <div class="checkout-card">
                        <h3>结算明细</h3>
                        <div class="checkout-info">
                            <div class="checkout-row">
                                <span>商品总价：</span>
                                <span class="price">¥{{ cartStore.totalPrice }}</span> <!-- 使用 store 的 totalPrice -->
                            </div>
                            <div class="checkout-row">
                                <span>优惠：</span>
                                <span class="discount">-¥0.00</span>
                            </div>
                            <div class="checkout-row">
                                <span>运费：</span>
                                <span>免运费</span>
                            </div>
                            <div class="checkout-total">
                                <span>合计：</span>
                                <span class="total-price">¥{{ cartStore.selectedPrice }}</span>
                                <!-- 使用 store 的 selectedPrice -->
                            </div>
                        </div>

                        <div class="selected-count">已选商品 {{ cartStore.selectedCount }} 件</div>
                        <!-- 使用 store 的 selectedCount -->

                        <button class="checkout-btn" :disabled="cartStore.selectedCount === 0" @click="handleCheckout">
                            结算
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
       <!-- 支付弹窗 -->
       <div v-if="showPaymentModal" class="payment-modal-overlay" @click.self="closePaymentModal">
            <div class="payment-modal-content">
                <button class="close-modal-btn" @click="closePaymentModal">×</button>
                <h3>选择支付方式</h3>

                <div class="payment-options">
                    <div class="payment-option">
                        <img src="@/assets/alipay-icon.png" alt="支付宝" class="payment-icon">
                        <span>支付宝</span>
                    </div>
                    <div class="payment-option">
                        <img src="@/assets/wechat-pay-icon.png" alt="微信支付" class="payment-icon">
                        <span>微信支付</span>
                    </div>
                    <!-- 可以添加更多支付方式 -->
                </div>

                <div class="qr-code-section">
                    <p>请使用支付宝或微信扫描下方二维码支付</p>
                    <!-- 占位二维码图片 -->
                    <img src="@/assets/placeholder-qr.png" alt="支付二维码" class="qr-code-image">
                    <!-- 模拟扫描支付按钮 -->
                    <button class="simulate-pay-btn" @click="simulatePaymentAndCelebrate">
                        模拟扫描并支付
                    </button>
                </div>

                <p class="payment-note">（此为演示功能，无需真实支付）</p>
            </div>
        </div>

</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useCartStore } from '@/stores/cartStore';
import confetti from 'canvas-confetti'; // ★★★ 导入烟花库 ★★★
import { ElMessage } from 'element-plus'; // 用于显示提示
const cartStore = useCartStore();
console.log('购物车页面组件: cartStore 实例:', cartStore); // <-- 添加这行
console.log('购物车页面组件: cartStore.removeSelectedItems 方法:', cartStore.removeSelectedItems); // <-- 添加这行

// 支付弹窗状态
const showPaymentModal = ref(false); // ★★★ 控制支付弹窗显示隐藏 ★★★
// 倒计时相关变量 (保持不变)
const hours = ref('20');
const minutes = ref('00');
const seconds = ref('00');
let countdownInterval = null;
let totalSeconds = 20 * 60 * 60; // 开始于20小时

// 更新倒计时显示 (保持不变)
const updateCountdown = () => {
    if (totalSeconds <= 0) {
        clearInterval(countdownInterval);
        hours.value = '00';
        minutes.value = '00';
        seconds.value = '00';
        return;
    }

    totalSeconds--;

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    hours.value = h < 10 ? '0' + h : h.toString();
    minutes.value = m < 10 ? '0' + m : m.toString();
    seconds.value = s < 10 ? '0' + s : s.toString();
};

// 启动倒计时 (保持不变)
onMounted(() => {
    // 初始显示
    updateCountdown();
    // 设置每秒更新一次
    countdownInterval = setInterval(updateCountdown, 1000);

    // 在组件挂载时加载购物车数据
    cartStore.loadCart();
});

// 组件销毁前清除定时器 (保持不变)
onBeforeUnmount(() => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});

// 全选状态 (使用 store 的 computed property)
const allSelected = computed({
    get: () => cartStore.cartItems.length > 0 && cartStore.cartItems.every(item => item.selected),
    set: (value) => cartStore.toggleAll(value) // 调用 store 的 action
});

// ★★★ 结算按钮点击处理函数 ★★★
const handleCheckout = () => {
    if (cartStore.selectedCount === 0) {
        ElMessage.warning('请先选择要结算的商品');
        return;
    }
    showPaymentModal.value = true; // 显示支付弹窗
};

// ★★★ 关闭支付弹窗 ★★★
const closePaymentModal = () => {
    showPaymentModal.value = false;
};

// ★★★ 模拟扫描并支付，然后放烟花 ★★★
const simulatePaymentAndCelebrate = async () => {
    console.log('模拟支付成功！准备放烟花！');
    ElMessage.success('模拟支付成功！');

    // 触发烟花效果
    confetti({
        particleCount: 100, // 烟花粒子数量
        spread: 70, // 烟花扩散范围
        origin: { y: 0.6 } // 烟花发射位置 (页面垂直方向的 60%)
    });

    // 延迟一段时间关闭弹窗并清空已选商品
    setTimeout(async () => {
        closePaymentModal(); // 关闭弹窗
        // 模拟支付成功后，清空已选中的商品
        // 注意：这里调用的是 removeSelectedItems，它会调用后端API删除
        // 如果你希望模拟支付成功后直接清空本地状态，可以修改 cartStore 的 action
        // 或者在这里直接操作本地状态，但这会与后端不同步，不推荐
        // 推荐调用 removeSelectedItems，让后端也同步删除
        await cartStore.removeSelectedItems();
        console.log('已清空已支付的商品');
    }, 1500); // 1.5秒后执行

};


// 增加商品数量 (直接调用 store 的 action)
const increaseQuantity = (item) => {
    cartStore.updateQuantity(item.id, item.quantity + 1);
};

// 减少商品数量 (直接调用 store 的 action)
const decreaseQuantity = (item) => {
    if (item.quantity > 1) {
        cartStore.updateQuantity(item.id, item.quantity - 1);
    }
};
</script>

<style scoped>
.cart-page {
    background-color: #ffffff;
    min-height: 100vh;
}

.cart-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid #e8e8e8;
}

.left-section {
    display: flex;
    align-items: center;
}

.home-icon {
    margin-right: 10px;
}

.home-icon img {
    width: 24px;
    height: 24px;
}

h1 {
    font-size: 20px;
    margin: 0;
}

.cart-counts {
    font-size: 14px;
    color: #666;
}

/* 功能按钮区域 */
.action-buttons {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e8e8e8;
}

.action-button {
    margin-right: 20px;
    padding: 5px 10px;
    height: 28px;
    line-height: 16px;
    border: 1px solid #ddd;
    background: none;
    cursor: pointer;
    border-radius: 2px;
    font-size: 13px;
}

/* 促销信息条样式 */
.promotion-bar {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    margin: 10px 0;
    background-color: #fef0e5;
    border: 1px solid #ffcca5;
    border-radius: 4px;
    color: #ff6a00;
}

.promotion-icon {
    margin-right: 10px;
    font-size: 20px;
}

.promotion-text {
    flex: 1;
    font-size: 14px;
}

.highlight {
    color: #ff4400;
    font-weight: bold;
    font-size: 16px;
}

.promotion-countdown {
    font-size: 13px;
}

.countdown {
    display: inline-block;
    background-color: #ff4400;
    color: white;
    padding: 1px 3px;
    border-radius: 2px;
    margin: 0 2px;
}

.cart-main-content {
    display: flex;
    gap: 20px;
    margin-top: 15px;
}

.cart-list-container {
    flex: 1;
    border: 1px solid #e8e8e8;
    border-radius: 2px;
    position: relative;
    /* 为底部提示添加定位上下文 */
}

/* 表格样式 */
.cart-table {
    width: 100%;
    table-layout: fixed;
}

/* 标题行 */
.cart-header-row {
    display: table;
    width: 100%;
    background-color: #f8f8f8;
    border-bottom: 1px solid #e8e8e8;
    height: 40px;
}

/* 商品行 */
.cart-item-row {
    display: table;
    width: 100%;
    border-bottom: 1px solid #f0f0f0;
    height: 120px;
}

.cart-item-row:last-child {
    border-bottom: none;
}

/* 底部"没有更多了"提示 */
/* 底部"没有更多了"提示 */
.no-more-items {
    text-align: center;
    padding: 15px 0;
    color: #cccccc;
    font-size: 13px;
    /* 已移除background-color: #fafafa; */
    /* 已移除border-top: 1px solid #f0f0f0; */
}

/* 单元格通用样式 */
.cell {
    display: table-cell;
    vertical-align: middle;
}

/* 每列宽度定义 */
.checkbox-cell {
    width: 50px;
    text-align: center;
}

.product-cell {
    width: 400px;
    text-align: left;
}

.price-cell {
    width: 80px;
    text-align: center;
}

.quantity-cell {
    width: 120px;
    text-align: center;
}

.subtotal-cell {
    width: 100px;
    text-align: center;
}

.operation-cell {
    width: 100px;
    text-align: center;
}

/* 商品信息 */
.product-info {
    display: flex;
    align-items: center;
}

.product-image {
    width: 80px;
    height: 80px;
    object-fit: contain;
    margin-right: 10px;
    border: 1px solid #eee;
}

.product-name {
    width: 180px;
    line-height: 1.4;
}

/* 数量控制 */
.quantity-control {
    display: inline-flex;
    align-items: center;
}

.quantity-btn {
    width: 24px;
    height: 24px;
    border: 1px solid #e8e8e8;
    background-color: #f8f8f8;
    cursor: pointer;
}

.quantity-input {
    width: 40px;
    height: 24px;
    text-align: center;
    border: 1px solid #e8e8e8;
    border-left: none;
    border-right: none;
}

.delete-btn {
    padding: 3px 8px;
    color: #666;
    background: none;
    border: 1px solid #ddd;
    cursor: pointer;
    border-radius: 2px;
}

.empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80px 0;
}

.empty-cart img {
    width: 150px;
    margin-bottom: 20px;
}

.go-shopping-btn {
    padding: 8px 20px;
    background-color: #ff4400;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    margin-top: 20px;
}

/* 右侧结算区域 */
.checkout-sidebar {
    width: 300px;
}

.checkout-card {
    padding: 20px;
    border: 1px solid #e8e8e8;
    border-radius: 2px;
}

.checkout-card h3 {
    margin-top: 0;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e8e8e8;
}

.checkout-info {
    margin-bottom: 20px;
}

.checkout-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.checkout-total {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #e8e8e8;
    font-weight: bold;
}

.price,
.total-price {
    color: #ff4400;
}

.discount {
    color: #ff4400;
}

.selected-count {
    margin-bottom: 15px;
    text-align: right;
}

.checkout-btn {
    width: 100%;
    padding: 10px 0;
    background-color: #ff4400;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
}

.checkout-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}
/* ★★★ 优化后的支付弹窗样式 ★★★ */
.payment-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6); /* 半透明黑色背景，稍微深一点 */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.payment-modal-content {
    background-color: #fff;
    padding: 40px 30px; /* 增加上下内边距 */
    border-radius: 10px; /* 圆角更大一些 */
    position: relative;
    width: 450px; /* 稍微宽一点 */
    max-width: 90%; /* 确保在小屏幕上也能适应 */
    text-align: center;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); /* 阴影更明显 */
    animation: modal-fade-in 0.3s ease-out; /* 添加一个简单的进入动画 */
}

@keyframes modal-fade-in {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}


.close-modal-btn {
    position: absolute;
    top: 15px; /* 调整位置 */
    right: 15px; /* 调整位置 */
    font-size: 28px; /* 图标大一点 */
    border: none;
    background: none;
    cursor: pointer;
    color: #aaa; /* 颜色浅一点 */
    transition: color 0.3s ease;
}

.close-modal-btn:hover {
    color: #777; /* 鼠标悬停颜色变深 */
}

.payment-modal-content h3 {
    margin-top: 0;
    margin-bottom: 30px; /* 增加底部间距 */
    font-size: 22px; /* 标题大一点 */
    color: #333;
    border-bottom: 1px solid #eee; /* 添加一条细线 */
    padding-bottom: 15px; /* 标题和线之间留白 */
}

.payment-options {
    display: flex;
    justify-content: center;
    gap: 40px; /* 支付方式间距大一点 */
    margin-bottom: 40px; /* 增加底部间距 */
}

.payment-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 15px 20px; /* 增加内边距 */
    border: 2px solid transparent; /* 初始透明边框 */
    border-radius: 6px;
    transition: border-color 0.3s ease, background-color 0.3s ease;
    background-color: #f9f9f9; /* 添加浅背景色 */
}

.payment-option:hover {
    border-color: #ff4400; /* 鼠标悬停时边框变色 */
    background-color: #fff0e5; /* 鼠标悬停时背景变浅 */
}

.payment-icon {
    width: 45px; /* 图标大一点 */
    height: 45px; /* 图标大一点 */
    margin-bottom: 8px; /* 增加图标和文字间距 */
}

.payment-option span {
    font-size: 15px; /* 文字大小 */
    color: #555;
}


.qr-code-section {
    margin-bottom: 30px; /* 增加底部间距 */
    padding: 20px; /* 添加内边距 */
    background-color: #f0f0f0; /* 添加背景色区分 */
    border-radius: 6px;
}

.qr-code-section p {
    margin-bottom: 20px; /* 增加底部间距 */
    font-size: 15px;
    color: #555;
}

.qr-code-image {
    width: 200px; /* 二维码大一点 */
    height: 200px; /* 二维码大一点 */
    border: 5px solid #fff; /* 添加白色边框 */
    padding: 5px; /* 边框和图片之间留白 */
    background-color: #fff;
    margin-bottom: 25px; /* 增加底部间距 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 给二维码加点阴影 */
}

.simulate-pay-btn {
    padding: 12px 25px; /* 按钮内边距大一点 */
    background-color: #ff4400;
    color: white;
    border: none;
    border-radius: 5px; /* 圆角大一点 */
    font-size: 17px; /* 文字大一点 */
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.1s ease; /* 添加点击效果 */
}

.simulate-pay-btn:hover {
    background-color: #e03c00;
}

.simulate-pay-btn:active {
    transform: scale(0.98); /* 点击时稍微缩小 */
}


.payment-note {
    font-size: 13px; /* 文字大一点 */
    color: #888; /* 颜色浅一点 */
    margin-top: 20px; /* 增加顶部间距 */
}
</style>