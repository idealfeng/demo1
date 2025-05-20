import axios from 'axios'

    // 直接打到后端端口 5200，完全绕开 Vite 代理 → 再也不会 404
    const base = 'http://localhost:5200'
    
    export const loginAPI = data => axios.post(`${base}/login`, data).then(r => r.data)
    export const getProfileAPI = () => axios.get(`${base}/profile`).then(r => r.data)