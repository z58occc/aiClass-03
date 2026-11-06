<script setup lang="ts">
// 後台外框：左側導覽 + 子路由出口。進入權限由 router guard 控制（requiresAdmin），
// 真正的授權由後端 API 判斷（非 admin 會收到 403 FORBIDDEN）
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-5">
    <aside class="md:col-span-1">
      <h1 class="mb-3 text-lg font-bold">後台管理</h1>
      <nav class="flex gap-2 md:flex-col">
        <RouterLink
          :to="{ name: 'admin-coupons' }"
          data-testid="admin-nav-coupons"
          class="rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-rose-50 hover:text-rose-600"
          active-class="bg-rose-50 font-medium text-rose-600"
        >
          優惠券管理
        </RouterLink>
      </nav>
    </aside>

    <section class="md:col-span-4">
      <RouterView />
    </section>
  </div>
</template>
