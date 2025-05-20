// src/stores/user.js
import { defineStore } from 'pinia'
// 导入 cartStore 是为了在 setUser 中调用 loadCart，
// 但在 logout 中不再需要获取 cartStore 实例来调用 $reset()
import { useCartStore } from '@/stores/cartStore';

const TOKEN_KEY = 'token_sicau'
const USER_INFO_KEY = 'userInfo_sicau'

export const useUserStore = defineStore('user', {
    state: () => ({
        token: localStorage.getItem(TOKEN_KEY) || '',
        userInfo: JSON.parse(localStorage.getItem(USER_INFO_KEY) || '{}'),
    }),

    getters: {
        isLoggedIn: (state) => !!state.token && !!state.userInfo.id,
        username: (state) => state.userInfo.account || '',
        userAvatar: (state) => state.userInfo.avatar || '/images/avatars/default_fallback.png',
        userId: (state) => state.userInfo.id || null,
    },

    actions: {
        async setUser({ token, userInfo }) {
            if (!token || !userInfo || userInfo.id === undefined || userInfo.id === null) {
                console.error('setUser action: token or userInfo (with a valid id) is missing or invalid.', { token, userInfo });
                return;
            }
            console.log('>>> DEBUG (userStore): setUser called with:', { token, userInfo });
            this.token = token;
            this.userInfo = {
                id: userInfo.id,
                account: userInfo.account,
                avatar: userInfo.avatar,
            };
            localStorage.setItem(TOKEN_KEY, this.token);
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(this.userInfo));
            console.log('>>> DEBUG (userStore): setUser action executed. UserInfo:', this.userInfo);
            if (this.isLoggedIn) { // 再次确认用户已登录
                const cartStore = useCartStore(); // 获取 cartStore 实例
                console.log('>>> DEBUG (userStore): 用户已登录，调用 cartStore.loadCart()');
                // 使用 await 等待购物车加载完成，确保时序
                await cartStore.loadCart().catch(error => {
                    console.error('>>> DEBUG (userStore): 在 setUser 中加载购物车失败:', error);
                    // 处理加载失败的情况，例如提示用户或清空购物车状态
                    // ElMessage.error('加载购物车失败'); // 如果需要提示
                });
            }
        },
        logout() {
            this.token = '';
            this.userInfo = {};
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_INFO_KEY);
            console.log('>>> DEBUG (userStore): User logged out.');
            // ★★★ 用户登出时，购物车状态由 cartStore 内部的 watch 监听器处理 ★★★
            // 无需在此处手动调用 cartStore 的重置方法
            console.log('>>> DEBUG (userStore): 用户登出，cartStore 将通过 watch 响应');
            // const cartStore = useCartStore(); // 这一行也不需要了，因为下面调用 $reset() 的代码被移除了
            // console.log('>>> DEBUG (userStore): 用户登出，调用 cartStore.$reset()'); // 这一行也不需要了
            // cartStore.$reset(); // ★★★ 删除或注释掉这一行 ★★★
        }
    },
});