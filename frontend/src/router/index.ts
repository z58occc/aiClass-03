// 路由設定：需登入頁面（/checkout、/orders/:id）以 navigation guard 保護
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'products',
      component: () => import('../pages/ProductListPage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/RegisterPage.vue'),
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../pages/CartPage.vue'),
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../pages/CheckoutPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/orders/:id',
      name: 'order-detail',
      component: () => import('../pages/OrderDetailPage.vue'),
      meta: { requiresAuth: true },
    },
    // 後台：子路由繼承父層 meta（vue-router 會合併 to.meta）
    {
      path: '/admin',
      component: () => import('../pages/admin/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      redirect: { name: 'admin-coupons' },
      children: [
        {
          path: 'coupons',
          name: 'admin-coupons',
          component: () => import('../pages/admin/AdminCouponListPage.vue'),
        },
        {
          path: 'coupons/new',
          name: 'admin-coupon-new',
          component: () => import('../pages/admin/AdminCouponFormPage.vue'),
        },
        {
          path: 'coupons/:id/edit',
          name: 'admin-coupon-edit',
          component: () => import('../pages/admin/AdminCouponFormPage.vue'),
        },
      ],
    },
  ],
})

// 未登入導向 /login?redirect=<原路徑>，登入後由 Login/Register 頁導回；
// 非 admin 進後台則導回首頁（前端僅控制顯示，真正的權限由後端 API 回 403 把關）
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { path: '/' }
  }
})

export default router
