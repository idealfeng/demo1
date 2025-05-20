/* ------------------------------------------------------------
   src/router/index.js
------------------------------------------------------------ */
import { createRouter, createWebHistory } from 'vue-router'

import Login from '@/views/Login/index.vue'
import Layout from '@/views/Layout/index.vue'
import Home from '@/views/Home/index.vue'
import Category from '@/views/Category/index.vue'
import Detail from '@/views/Detail/index.vue'
import Member from '@/views/Member/index.vue'
import UserInfo from '@/views/Member/components/UserInfo.vue'
import UserOrder from '@/views/Member/components/UserOrder.vue'

const routes = [
  /* 1. 登录页 —— 无需鉴权 */
  { path: '/', component: Login, name: 'login', alias: '/login' },

  /* 2. 主站 —— 允许游客访问 ------------------------------ */
  {
    path: '/home',
    component: Layout,
    children: [
      { path: '', name: 'home', component: Home },

      {
        path: 'category/:id', name: 'category', component: Category,
        props: true, alias: '/category/:id'
      },

      {
        path: 'detail/:id', name: 'detail', component: Detail,
        props: true, alias: '/detail/:id'
      },

      /* 3. 会员区 —— 单独要求登录 ------------------------- */
      {
        path: 'member',
        component: Member,
        name: 'member',
        alias: '/member',
        meta: { requiresAuth: true },     // ★ 只在 member 分支加
        children: [
          { path: '', name: 'member-info', component: UserInfo },
          {
            path: 'order', name: 'member-order', component: UserOrder,
            alias: '/member/order'
          },
          {
            path: 'favorite',
            name: 'member-favorite',
            component: () => import('@/views/Member/components/MemberFavorite.vue')
          }
        ]
      }
    ],
    
  },
  {
    path: '/cart',
    name: 'Cart', // 改为小写
    component: () => import('@/views/CartPage/CartPage.vue'),
    meta: { requiresAuth: false }
  },
  // 添加租赁页面路由
  {
    path: '/my-rentals',
    name: 'myRentals',
    component: () => import('@/views/MyRentals/index.vue'),
    meta: { title: '我的租赁' }
  },

  /* 4. 其它未知地址 → 登录页 */
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

/* 全局前置守卫 -------------------------------------------- */
router.beforeEach((to, _from, next) => {
  // 修改这里，使用 userStore 中定义的 token 键名
  const token = localStorage.getItem('token_sicau') // <--- 从 'token' 改为 'token_sicau'

  // 需要登录却没有 token → 回登录页
  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // 其它情况直接放行
  next()
})


export default router