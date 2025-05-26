// auth.js (修改后)
import http from '@/utils/http' // 使用我们配置好的 axios 实例

export const loginAPI = data => http.post('/login', data) // baseURL 会自动加上 /api 前缀
export const getProfileAPI = () => http.get('/profile') // baseURL 会自动加上 /api 前缀
// 注意：.then(r => r.data) 已经在 http.js 的响应拦截器中处理了，这里可以不用再写
// 如果 http.js 的响应拦截器是 `response => response.data`，那么这里就不用 .then(r => r.data)
// 如果 http.js 的响应拦截器是 `response => response`，那么这里就需要 .then(r => r.data)
// 根据你提供的 http.js，它是 `(response) => response.data`，所以这里可以简化：
// export const loginAPI = data => http.post('/login', data)
// export const getProfileAPI = () => http.get('/profile')