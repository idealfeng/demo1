<template>
    <div class="cart-item" :class="{ 'selected': item.selected }">
        <div class="select-column">
            <!-- 调用 updateSelected action -->
            <el-checkbox :model-value="item.selected" @change="cartStore.updateSelected(item.id, $event)"></el-checkbox>
        </div>

        <div class="product-column">
            <div class="product-image">
                <img :src="item.picture" :alt="item.name"> <!-- 注意这里是item.picture -->
            </div>
            <div class="product-info">
                <div class="product-name">{{ item.name }}</div>
                <!-- <div class="product-specs" v-if="item.specs">{{ item.specs }}</div> -->
                <!-- 如果数据库不存specs，这里需要移除或修改 -->
            </div>
        </div>

        <div class="price-column">
            <!-- 确保价格是数字并格式化 -->
            <div class="current-price">¥{{ Number(item.price).toFixed(2) }}</div>
            <!-- <div class="original-price" v-if="item.originalPrice">¥{{ Number(item.originalPrice).toFixed(2) }}</div> -->
            <!-- 如果数据库不存originalPrice，这里需要移除或修改 -->
        </div>

        <div class="quantity-column">
            <div class="quantity-control">
                <!-- 调用 updateQuantity action -->
                <button class="decrease" @click="cartStore.updateQuantity(item.id, item.quantity - 1)"
                    :disabled="item.quantity <= 1">-</button>
                <!-- 使用 @blur 或 @change 触发更新 -->
                <input type="number" :value="item.quantity"
                    @blur="cartStore.updateQuantity(item.id, Number($event.target.value))" min="1">
                <!-- 调用 updateQuantity action -->
                <button class="increase" @click="cartStore.updateQuantity(item.id, item.quantity + 1)">+</button>
            </div>
        </div>

        <div class="subtotal-column">
            <!-- 计算小计 -->
            <span class="subtotal">¥{{ (Number(item.price) * item.quantity).toFixed(2) }}</span>
        </div>

        <div class="operation-column">
            <!-- 调用 removeItem action -->
            <button class="delete-btn" @click="cartStore.removeItem(item.id)">删除</button>
        </div>
    </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cartStore';

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
});

const cartStore = useCartStore();

// updateQuantity 函数不再需要，直接在模板中调用 store 的 action
// const updateQuantity = (quantity) => {
//     cartStore.updateQuantity(props.item.id, quantity);
// };
</script>

<style scoped>
.cart-item {
    display: grid;
    grid-template-columns: 60px 3fr 1fr 1fr 1fr 1fr;
    align-items: center;
    padding: 20px 0;
    border-bottom: 1px solid #f0f0f0;
}

.cart-item.selected {
    background-color: #fff9f9;
}

.product-column {
    display: flex;
    align-items: center;
    text-align: left;
}

.product-image {
    width: 80px;
    height: 80px;
    margin-right: 15px;
    border: 1px solid #eee;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.product-name {
    font-size: 14px;
    margin-bottom: 5px;
    line-height: 1.4;
}

.product-specs {
    color: #999;
    font-size: 12px;
}

.price-column {
    text-align: center;
}

.original-price {
    color: #999;
    text-decoration: line-through;
    font-size: 12px;
}

.quantity-control {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    margin: 0 auto;
}

.quantity-control button {
    width: 30px;
    height: 30px;
    background: none;
    border: 1px solid #e8e8e8;
    cursor: pointer;
}

.quantity-control input {
    width: 40px;
    height: 30px;
    text-align: center;
    border: 1px solid #e8e8e8;
    border-left: none;
    border-right: none;
}

.subtotal-column {
    color: #ff4400;
    font-weight: bold;
    text-align: center;
}

.operation-column {
    text-align: center;
}

.delete-btn {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
}

.delete-btn:hover {
    color: #ff4400;
    text-decoration: underline;
}
</style>