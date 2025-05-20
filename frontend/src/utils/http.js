// src/utils/http.js
import axios from 'axios'
// 假设你的 userStore.js 导出了 TOKEN_KEY，或者在这里统一定义并确保 userStore.js 使用相同的键
// import { TOKEN_KEY } from '@/stores/user' // 如果 userStore 导出
const TOKEN_KEY = 'token_sicau' // 确保这个键名与 userStore.js 中 localStorage.setItem 时使用的键名【完全一致】

const http = axios.create({
    baseURL: import.meta.env.BASE_URL_API || '/api',  // 生产默认为 /api
    timeout: 5000
  })

// 请求拦截器
http.interceptors.request.use(
    (config) => {
        console.log('[Axios Request Interceptor] For URL:', config.url);
        let token = null;

        // 优先从 localStorage 获取 token，这是最可靠的方式，避免 Pinia 状态更新的微小延迟
        token = localStorage.getItem(TOKEN_KEY);
        console.log(`[Axios Request Interceptor] Token from localStorage (using key "${TOKEN_KEY}"):`, token);

        // 如果需要，可以考虑再从 Pinia store 获取作为备用或进行同步
        // (但通常登录后 localStorage 会立即更新，直接读它更直接)
        // if (!token) {
        //     try {
        //         const userStore = useUserStore(); // 仅在需要时实例化
        //         token = userStore.token; // 假设 userStore.state 有一个名为 token 的顶级属性
        //         console.log('[Axios Request Interceptor] Token from userStore.token (fallback):', token);
        //     } catch (e) {
        //         console.warn('[Axios Request Interceptor] Error accessing userStore for token fallback:', e);
        //     }
        // }


        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[Axios Request Interceptor] Authorization header SET TO:', config.headers.Authorization);
        } else {
            console.log('[Axios Request Interceptor] No token found, Authorization header NOT SET.');
        }
        return config;
    },
    (error) => {
        console.error('>>> DEBUG: 请求发送前错误 (Axios):', error);
        return Promise.reject(error);
    }
)

// 响应拦截器 (你的版本基本OK，可以稍微调整下401处理的注释)
http.interceptors.response.use(
    (response) => response.data, // 直接返回 data
    (error) => {
        console.error('>>> DEBUG (http.js response interceptor): 响应拦截器发生错误:', error);

        if (error.response && error.response.status === 401) {
            console.log('>>> DEBUG (http.js response interceptor): 收到 401 响应，Token 可能无效或过期。');
            // 在这里可以做一些全局的401处理，比如：
            // 1. 清除本地的用户状态和 Token
            // const userStore = useUserStore(); // 需要在此作用域实例化
            // userStore.clearUser(); // 假设 userStore 有 clearUser action
            // 2. 跳转到登录页
            // import router from '@/router' // 需要引入 router 实例
            // router.push('/login?redirect=' + window.location.pathname);
            // ElMessage.error('登录状态已失效，请重新登录');
        }
        return Promise.reject(error);
    }
)

export default http