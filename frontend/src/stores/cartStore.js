// src/stores/cartStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue'; // 使用 Composition API 风格的 Pinia Store
import { useUserStore } from './user'; // 假设你的用户 Store 路径是 './user'
import request from '@/utils/http'; // 假设你的请求工具路径是 '@/utils/http'
import { ElMessage } from 'element-plus'; // 用于显示提示信息

// 定义购物车相关的API函数
const api = {
    // 获取购物车列表
    getCart: () => request({ url: '/cart', method: 'get' }),
    // 添加商品到购物车
    addToCart: (product) => request({ url: '/cart', method: 'post', data: product }),
    // 更新购物车商品数量或选中状态
    updateCart: (productId, data) => request({ url: `/cart/${productId}`, method: 'put', data }),
    // 删除购物车商品
    removeCartItem: (productId) => request({ url: `/cart/${productId}`, method: 'delete' }),
    // TODO: 如果后端有批量删除、全选/全不选等API，在这里添加
    //removeSelectedItems: (productIds) => request({ url: '/cart/batch-delete', method: 'delete', data: { ids: productIds } }),
    updateAllSelected: (selected) => request({ url: '/cart/select-all', method: 'put', data: { selected } }), // <-- 添加这行
    removeCartItemsBatch: (productIds) => request({ url: '/cart/batch', method: 'delete', data: { ids: productIds } }),
};

export const useCartStore = defineStore('cart', () => {
    const userStore = useUserStore(); // 获取用户 Store 实例

    // 状态：存储购物车商品列表
    const cartItems = ref([]);

    // Getters (计算属性)
    const totalCount = computed(() => cartItems.value.reduce((sum, item) => sum + item.quantity, 0));

    // 注意：totalPrice 和 selectedPrice 应该只计算选中的商品总价
    const totalPrice = computed(() => cartItems.value.reduce((sum, item) => item.selected ? sum + Number(item.price) * item.quantity : sum, 0).toFixed(2));

    const selectedCount = computed(() => cartItems.value.reduce((sum, item) => item.selected ? sum + item.quantity : sum, 0));

    const selectedPrice = computed(() => cartItems.value.reduce((sum, item) => item.selected ? sum + Number(item.price) * item.quantity : sum, 0).toFixed(2));
    // === 新增：获取选中的商品ID列表的 Getter ===
    const selectedItemIds = computed(() => {
        return cartItems.value.filter(item => item.selected).map(item => item.id);
    });


    // TODO: 如果需要按店铺分组，并且后端返回的数据包含店铺信息，可以保留或修改此 getter
    // const shopGroups = computed(() => {
    //     const groups = {};
    //     cartItems.value.forEach(item => {
    //         if (!groups[item.shop]) groups[item.shop] = [];
    //         groups[item.shop].push(item);
    //     });
    //     return groups;
    // });


    // Actions (异步操作)

    // 加载购物车数据 (从后端获取)
    const loadCart = async () => {
        console.log('--- cartStore.js loadCart action 开始执行 ---');
        if (!userStore.isLoggedIn) {
            cartItems.value = [];
            return;
        }
        try {
            const res = await api.getCart();
            if (res.code === 0) {
                cartItems.value = (res.data || res.result || []).map(item => ({
                    id: item.product_id || item.id,
                    name: item.product_name || item.name,
                    price: Number(item.product_price || item.price), // 确保价格是数字
                    picture: item.product_picture || item.picture,
                    // === 确保 quantity 也被转换为数字 ===
                    quantity: Number(item.quantity), // <-- 添加 Number() 转换
                    selected: !!item.selected // 确保 selected 是布尔值
                    // TODO: 如果后端返回其他字段如 specs, originalPrice, shop 等，也在这里映射
                }));
                console.log('购物车数据加载成功:', cartItems.value); // 再次检查这里的日志，看 price 和 quantity 是否是数字
            } else {
                console.error('加载购物车失败:', res.message);
                cartItems.value = [];
            }
        } catch (error) {
            console.error('加载购物车异常:', error);
            cartItems.value = [];
        }
    };

    // 添加购物车和立即购买
    const addToCart = async (product, quantity = 1) => { // <-- 它是 async，接收 product 和 quantity
        console.log('--- cartStore.js addToCart action 开始执行 ---', product, quantity); // 调试打印
        console.log('Store 接收到的商品数据:', product); // 调试打印
        console.log('Store 接收到的数量:', quantity); // 调试打印


        if (!userStore.isLoggedIn) {
            ElMessage.warning('请先登录以使用购物车功能');
            return;
        }

        try {
            console.log('--- cartStore.js 准备调用 api.addToCart 发送网络请求 ---'); // 调试打印

            const dataToSend = { // 构建要发送的数据
                id: product.id,
                name: product.name,
                price: Number(product.price),
                picture: product.picture,
                quantity: quantity, // 使用接收到的 quantity 参数
                selected: product.selected !== undefined ? product.selected : true
            };

            console.log('发送到后端的商品数据:', dataToSend); // 调试打印

            // 调用后端API添加商品
            const res = await api.addToCart(dataToSend);
            if (res.code === 0) {
                ElMessage.success('商品已添加到购物车');
                await loadCart(); // 添加成功后重新加载购物车列表
            } else {
                console.error('添加到购物车失败:', res.message);
                ElMessage.error('添加到购物车失败: ' + (res.message || '未知错误'));
            }
        } catch (error) {
            console.error('添加到购物车异常:', error);
            ElMessage.error('添加到购物车异常');
        }
    };
    // 更新商品数量
    const updateQuantity = async (productId, quantity) => {
        const newQuantity = Math.max(1, quantity); // 数量不能小于1

        if (!userStore.isLoggedIn) {
            ElMessage.warning('请先登录以更新购物车');
            // TODO: 实现游客购物车更新数量逻辑
            return;
        }

        try {
            // 调用后端API更新数量
            const res = await api.updateCart(productId, { quantity: newQuantity });
            if (res.code === 0) {
                // 找到本地对应的商品并更新数量
                const item = cartItems.value.find(item => item.id === productId);
                if (item) {
                    item.quantity = newQuantity;
                }
                console.log('更新数量成功');
            } else {
                console.error('更新数量失败:', res.message);
                ElMessage.error('更新数量失败: ' + (res.message || '未知错误'));
                await loadCart(); // 更新失败则重新加载购物车以同步状态
            }
        } catch (error) {
            console.error('更新数量异常:', error);
            ElMessage.error('更新数量异常');
            await loadCart(); // 更新异常则重新加载购物车
        }
    };

    // 删除购物车商品
    const removeItem = async (productId) => {
        if (!userStore.isLoggedIn) {
            ElMessage.warning('请先登录以删除购物车商品');
            // TODO: 实现游客购物车删除逻辑
            return;
        }

        try {
            // 调用后端API删除商品
            const res = await api.removeCartItem(productId);
            if (res.code === 0) {
                ElMessage.success('商品已从购物车移除');
                // 从本地列表中移除该商品
                cartItems.value = cartItems.value.filter(item => item.id !== productId);
                // 或者 await loadCart(); // 删除成功后重新加载购物车列表
            } else {
                console.error('移除购物车商品失败:', res.message);
                ElMessage.error('移除购物车商品失败: ' + (res.message || '未知错误'));
            }
        } catch (error) {
            console.error('移除购物车商品异常:', error);
            ElMessage.error('移除购物车商品异常');
        }
    };

    // 更新商品选中状态
    const updateSelected = async (productId, selected) => {
        console.log(`--- cartStore.js updateSelected action 开始执行 --- productId: ${productId}, selected: ${selected}`); // <-- 添加日志

        if (!userStore.isLoggedIn) {
            ElMessage.warning('请先登录以更新选中状态');
            return;
        }

        try {
            console.log(`updateSelected: 准备调用后端API更新商品 ${productId} 选中状态为 ${selected}`); // <-- 添加日志
            // 调用后端API更新选中状态
            const res = await api.updateCart(productId, { selected });
            console.log(`updateSelected: 后端API响应 for ${productId}:`, res); // <-- 添加日志

            if (res.code === 0) {
                // 找到本地对应的商品并更新选中状态
                const item = cartItems.value.find(item => item.id === productId);
                if (item) {
                    console.log(`updateSelected: 找到本地商品 ${productId}，当前选中状态: ${item.selected}`); // <-- 添加日志
                    item.selected = selected; // <-- 确认这行执行
                    console.log(`updateSelected: 更新本地商品 ${productId} 选中状态为: ${item.selected}`); // <-- 添加日志
                } else {
                    console.warn(`updateSelected: 未在本地 cartItems 中找到商品 ${productId}`); // <-- 添加日志
                }
                console.log(`更新选中状态成功 for ${productId}`);
            } else {
                console.error(`更新选中状态失败 for ${productId}:`, res.message);
                ElMessage.error('更新选中状态失败: ' + (res.message || '未知错误'));
                await loadCart(); // 更新失败则重新加载购物车以同步状态
            }
        } catch (error) {
            console.error(`更新选中状态异常 for ${productId}:`, error);
            ElMessage.error('更新选中状态异常');
            await loadCart(); // 更新异常则重新加载购物车
        }
    };

    // 全选/全不选
    const toggleAll = async (selected) => {
        console.log(`--- cartStore.js toggleAll action 开始执行 --- selected: ${selected}`); // 添加日志

        if (!userStore.isLoggedIn) {
            ElMessage.warning('请先登录以使用全选功能');
            console.log('toggleAll: 用户未登录，提前返回'); // 添加日志
            return;
        }

        try {
            console.log(`toggleAll: 准备调用后端API批量更新选中状态为 ${selected}`); // 添加日志
            // 调用后端API批量更新选中状态
            const res = await api.updateAllSelected(selected); // <-- 调用后端API
            console.log('toggleAll: 后端API响应:', res); // 添加日志

            if (res.code === 0) {
                console.log('全选/全不选成功 (后端同步)');
                // 后端更新成功后，再更新本地状态
                cartItems.value.forEach(item => item.selected = selected); // <-- 后端成功后再更新本地
            } else {
                console.error('全选/全不选失败:', res.message); // 添加日志
                ElMessage.error('全选/全不选失败: ' + (res.message || '未知错误'));
                await loadCart(); // 失败则重新加载以同步状态
            }
        } catch (error) {
            console.error('toggleAll: 全选/全不选异常:', error); // 添加日志
            ElMessage.error('全选/全不选异常');
            await loadCart(); // 异常则重新加载
        }
    };


    // 删除选中商品
    const removeSelectedItems = async () => {
        console.log('--- cartStore.js removeSelectedItems action 开始执行 ---');

        if (!userStore.isLoggedIn) {
            ElMessage.warning('请先登录以删除购物车商品');
            return;
        }

        const idsToDelete = selectedItemIds.value;
        console.log('removeSelectedItems: 选中的商品ID列表:', idsToDelete);

        if (idsToDelete.length === 0) {
            ElMessage.info('没有选中任何商品');
            return;
        }

        try {
            // 调用后端API批量删除商品
            const res = await api.removeCartItemsBatch(idsToDelete);

            if (res.code === 0) {
                ElMessage.success('选中商品已删除');
                console.log('removeSelectedItems: 删除成功，更新本地列表');
                cartItems.value = cartItems.value.filter(item => !idsToDelete.includes(item.id));
                console.log('removeSelectedItems: 本地列表更新后的 cartItems:', cartItems.value);
            } else {
                console.error('removeSelectedItems: 删除选中商品失败:', res.message);
                ElMessage.error('删除选中商品失败: ' + (res.message || '未知错误'));
            }
        } catch (error) {
            console.error('removeSelectedItems: 删除选中商品异常:', error);
            ElMessage.error('删除选中商品异常');
        }
    }


    // 清空购物车 (通常用于下单成功后)
    const clearCart = async () => {
        if (!userStore.isLoggedIn) {
            // TODO: 实现游客购物车清空逻辑
            cartItems.value = [];
            console.log('购物车已清空 (游客模式)');
            return;
        }
        // TODO: 需要后端提供一个清空购物车API
        // 暂时清空本地状态，并提示用户
        cartItems.value = [];
        ElMessage.success('购物车已清空 (本地更新)');
        // 理想情况下，这里调用后端API清空数据库购物车
        // try {
        //     const res = await api.clearCart();
        //     if (res.code === 0) {
        //         console.log('购物车已清空');
        //     } else {
        //         ElMessage.error('清空购物车失败: ' + (res.message || '未知错误'));
        //     }
        // } catch (error) {
        //     ElMessage.error('清空购物车异常');
        // }
    };


    // 监听用户登录状态变化，登录后加载数据库购物车
    // immediate: true 确保在 Store 初始化时就执行一次，加载初始购物车数据
    watch(() => userStore.isLoggedIn, (isLoggedIn) => {
        console.log('--- cartStore.js watch: 用户登录状态变化 ---', isLoggedIn);
        if (!isLoggedIn) {
            // 用户登出，清空购物车或切换到游客模式
            console.log('watch: 用户登出，清空购物车');
            cartItems.value = []; // 简单处理：登出清空购物车
            // TODO: 实现登出后将当前购物车保存为游客购物车
        }
        // 注意：登录后的 loadCart 不再由这个 watch 的 immediate 触发
        // 它应该由 userStore 的登录成功逻辑或应用启动时的用户加载逻辑显式调用
    });

    // 返回状态和 actions
    return {
        cartItems,
        totalCount,
        totalPrice,
        selectedCount,
        selectedPrice,
        selectedItemIds, // === 暴露新的 Getter ===
        // shopGroups, // 如果不需要按店铺分组，可以移除

        loadCart, // 暴露加载购物车的方法，可以在购物车页面或其他需要的地方调用
        addToCart,
        removeItem,
        updateQuantity,
        updateSelected,
        toggleAll,
        clearCart,
        removeSelectedItems, // 如果实现了批量删除，暴露此方法
    };
});