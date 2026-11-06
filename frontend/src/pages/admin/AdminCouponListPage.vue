<script setup lang="ts">
// 後台優惠券列表：含已停用的券；可切換啟用／停用（不提供硬刪除）
import { onMounted, ref } from 'vue'
import { ApiError, fetchCoupons, updateCoupon, type Coupon } from '../../api/client'

const coupons = ref<Coupon[]>([])
const loading = ref(true)
const errorMessage = ref('')
const togglingId = ref<number | null>(null)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    coupons.value = await fetchCoupons(true)
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : '載入優惠券失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

/** 啟用／停用切換：以 PATCH { isActive } 更新，成功後替換該列資料 */
async function toggleActive(coupon: Coupon) {
  errorMessage.value = ''
  togglingId.value = coupon.id
  try {
    const updated = await updateCoupon(coupon.id, { isActive: !coupon.isActive })
    coupons.value = coupons.value.map((c) => (c.id === updated.id ? updated : c))
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : '更新失敗，請稍後再試'
  } finally {
    togglingId.value = null
  }
}

/** 使用次數顯示：usageLimit 為 null 代表不限次數 */
function usageText(coupon: Coupon): string {
  return coupon.usageLimit === null
    ? `${coupon.usedCount} / 不限`
    : `${coupon.usedCount} / ${coupon.usageLimit}`
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">優惠券管理</h2>
      <RouterLink
        :to="{ name: 'admin-coupon-new' }"
        data-testid="admin-coupon-new"
        class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
      >
        新增優惠券
      </RouterLink>
    </div>

    <p v-if="errorMessage" data-testid="admin-error" class="mb-3 text-sm text-red-600">
      {{ errorMessage }}
    </p>

    <p v-if="loading" class="text-gray-500">載入中…</p>
    <p
      v-else-if="coupons.length === 0 && !errorMessage"
      class="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500"
    >
      尚無優惠券
    </p>

    <div v-else-if="coupons.length > 0" class="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm" data-testid="admin-coupon-table">
        <thead class="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
          <tr>
            <th class="px-4 py-3">代碼</th>
            <th class="px-4 py-3">折扣 %</th>
            <th class="px-4 py-3">折抵上限</th>
            <th class="px-4 py-3">低消</th>
            <th class="px-4 py-3">已用 / 上限</th>
            <th class="px-4 py-3">狀態</th>
            <th class="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="coupon in coupons" :key="coupon.id" :data-testid="`admin-coupon-row-${coupon.code}`">
            <td class="px-4 py-3 font-mono font-semibold">{{ coupon.code }}</td>
            <td class="px-4 py-3">{{ coupon.percentOff }}%</td>
            <td class="px-4 py-3">NT$ {{ coupon.maxDiscount }}</td>
            <td class="px-4 py-3">NT$ {{ coupon.minSpend }}</td>
            <td class="px-4 py-3">{{ usageText(coupon) }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              >
                {{ coupon.isActive ? '啟用中' : '已停用' }}
              </span>
            </td>
            <td class="space-x-3 px-4 py-3 text-right">
              <RouterLink
                :to="{ name: 'admin-coupon-edit', params: { id: coupon.id } }"
                :data-testid="`admin-coupon-edit-${coupon.code}`"
                class="text-rose-600 hover:underline"
              >
                編輯
              </RouterLink>
              <button
                type="button"
                :data-testid="`admin-coupon-toggle-${coupon.code}`"
                :disabled="togglingId === coupon.id"
                class="text-gray-500 hover:text-rose-600 disabled:opacity-50"
                @click="toggleActive(coupon)"
              >
                {{ coupon.isActive ? '停用' : '啟用' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
