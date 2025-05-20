// main.js
import '@/styles/common.scss'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { lazyPlugin } from './directives'

// 先导入Element Plus样式
import 'element-plus/dist/index.css'
// 再导入自定义覆盖样式
import '@/styles/element-theme.scss'
// 最后导入应用样式
import '@/styles/common.scss'

import ElementPlus from 'element-plus'
import '@/styles/element-reset.css'


// 创建应用实例
const app = createApp(App)

// 创建并使用 Pinia
const pinia = createPinia()
app.use(pinia)

// 用户状态初始化插件
const setupUserState = (app) => {
    // 获取Pinia实例后调用
    const userStore = pinia.state.value.user

    if (userStore && userStore.token && (!userStore.profile.avatar || !userStore.profile.account)) {
        // 修复用户资料
        const fixedProfile = {
            account: '芥尘',
            nickname: '芥尘',
            avatar: '/三月七.jpg'
        }

        // 更新localStorage
        localStorage.setItem('profile', JSON.stringify(fixedProfile))

        // 更新state (不用$patch因为这是在初始化阶段)
        userStore.profile = fixedProfile
        userStore.userInfo = fixedProfile
    }
}

// 路由
app.use(router)

// 注册图片懒加载指令
app.use(lazyPlugin)

// 初始化用户状态
setupUserState(app)

// 挂载应用
app.mount('#app')

app.use(ElementPlus)