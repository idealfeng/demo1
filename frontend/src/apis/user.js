// src/stores/user.js
import { defineStore } from 'pinia'

// 使用更明确的 localStorage key，与之前讨论一致
const TOKEN_KEY = 'token_sicau'
const USER_INFO_KEY = 'userInfo_sicau'

export const useUserStore = defineStore('user', {
    state: () => ({
        token: localStorage.getItem(TOKEN_KEY) || '',
        // userInfo 存储从后端获取的完整用户信息，包含 id, account, avatar 等
        userInfo: JSON.parse(localStorage.getItem(USER_INFO_KEY) || '{}'),
    }),

    getters: {
        // 判断是否登录，检查 token 和 userInfo.id 是否都存在
        isLoggedIn: (state) => !!state.token && !!state.userInfo.id,
        // 从 userInfo 获取用户名
        username: (state) => state.userInfo.account || '', // 假设后端返回的是 account 字段
        // 从 userInfo 获取头像
        userAvatar: (state) => state.userInfo.avatar || '/images/avatars/default_fallback.png', // 提供一个前端兜底
        // 直接获取用户 ID
        userId: (state) => state.userInfo.id || null,
    },

    actions: {
        // setUser action 现在接收后端返回的 token 和 userInfo 对象
        async setUser({ token, userInfo }) {
            // 关键：确保传入的 userInfo 包含 id
            if (!token || !userInfo || userInfo.id === undefined || userInfo.id === null) {
                console.error(
                    'setUser action: token or userInfo (with a valid id) is missing or invalid.',
                    { token, userInfo }
                );
                // 可以选择清除状态或保持不变，这里我们选择不更新，并提示错误
                // 如果希望强制登出，可以调用 this.logout()
                return; // 阻止不完整的用户信息更新 state
            }

            console.log('>>> DEBUG (userStore): setUser called with:', { token, userInfo });

            // 更新 state
            this.token = token;
            // 直接使用后端返回的 userInfo 对象，确保它包含 id, account, avatar 等字段
            this.userInfo = {
                id: userInfo.id,           // 必须有
                account: userInfo.account, // 必须有 (或 username)
                avatar: userInfo.avatar,   // 必须有
                // 如果后端 userInfo 还包含其他有用字段，也可以在这里选择性地保留或全部存入
                // email: userInfo.email,
                // role: userInfo.role,
            };

            // 持久化到 localStorage
            localStorage.setItem(TOKEN_KEY, this.token);
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(this.userInfo));

            console.log('>>> DEBUG (userStore): setUser action executed. Token:', this.token);
            console.log('>>> DEBUG (userStore): setUser action executed. UserInfo:', this.userInfo);
        },

        // (可选) 如果你的登录接口只返回 token，然后需要单独调接口获取用户信息
        // async fetchAndSetUserInfo() {
        //   if (!this.token) return;
        //   try {
        //     // const profileData = await getProfileAPI(); // 假设这个API用token获取用户信息
        //     // if (profileData && profileData.id) {
        //     //   this.userInfo = {
        //     //     id: profileData.id,
        //     //     account: profileData.account,
        //     //     avatar: profileData.avatar,
        //     //     // ...其他字段
        //     //   };
        //     //   localStorage.setItem(USER_INFO_KEY, JSON.stringify(this.userInfo));
        //     // } else {
        //     //   console.error('Failed to fetch valid user info, or id is missing.');
        //     //   this.logout(); // 获取不到有效信息，登出
        //     // }
        //   } catch (error) {
        //     console.error('Error fetching user info:', error);
        //     // this.logout(); // 出错也登出
        //   }
        // },

        // 退出登录
        logout() {
            this.token = '';
            this.userInfo = {}; // 清空用户信息
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_INFO_KEY);
            // 如果有其他与用户相关的 localStorage 项，也一并清除
            console.log('>>> DEBUG (userStore): User logged out.');
            // 可以在这里添加路由跳转到登录页的逻辑，如果不是在组件中处理的话
            // router.push('/login'); // 需要引入 router 实例
        }
    },

    // 如果你使用了 pinia-plugin-persistedstate，可以这样配置，更简洁：
    // persist: {
    //   key: 'user_store_sicau', // 给 store 一个唯一的 key
    //   storage: localStorage,
    //   paths: ['token', 'userInfo'], // 指定需要持久化的 state 属性
    // },
});
// src/apis/user.js
import request from '@/utils/http' // 确保你已经配置了 axios 实例，通常在 @/utils/http.js

// 你的 getLikeListAPI 可以保持不变，它与用户状态无关
export const getLikeListAPI = ({ limit = 4 } = {}) => {
    const urls = ['/like1.jpg', '/like2.jpg', '/like3.jpg', '/like4.jpg']
    const list = Array.from({ length: limit }).map((_, i) => ({
        id: `like-${i + 1}`,
        name: `猜你喜欢商品 ${i + 1}`,
        desc: `这个商品很不错哦 ${i + 1}`,
        price: (50 + i * 10).toFixed(2),
        picture: urls[i % urls.length]
    }))
    return Promise.resolve({ result: list })
}