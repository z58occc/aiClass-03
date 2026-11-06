<script setup lang="ts">
// 優惠券輸入區（Cart、Checkout 共用）：輸入代碼套用，或點選可用優惠券快速套用
import type { Coupon } from '../api/client'

const model = defineModel<string>({ required: true })

defineProps<{
  error: string
  appliedCode: string
  availableCoupons: Coupon[]
}>()

const emit = defineEmits<{
  apply: [code?: string]
  remove: []
}>()
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <h2 class="mb-3 font-semibold">優惠券</h2>
    <div class="flex gap-2">
      <input
        v-model="model"
        data-testid="coupon-input"
        type="text"
        placeholder="輸入優惠券代碼"
        class="w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
        @keyup.enter="emit('apply')"
      />
      <button
        type="button"
        data-testid="apply-coupon"
        class="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
        @click="emit('apply')"
      >
        套用
      </button>
    </div>
    <p v-if="error" data-testid="coupon-error" class="mt-2 text-sm text-red-600">
      {{ error }}
    </p>
    <p v-else-if="appliedCode" data-testid="coupon-applied" class="mt-2 flex items-center gap-2 text-sm text-green-600">
      已套用優惠券：{{ appliedCode }}
      <button type="button" data-testid="remove-coupon" class="text-xs text-gray-400 underline hover:text-red-600" @click="emit('remove')">
        取消
      </button>
    </p>

    <!-- 可用優惠券：僅列出啟用中的券；是否達低消／額度由後端試算判定 -->
    <div v-if="availableCoupons.length > 0" class="mt-4 border-t border-gray-100 pt-3">
      <p class="mb-2 text-xs text-gray-400">可用優惠券</p>
      <ul class="space-y-2">
        <li v-for="coupon in availableCoupons" :key="coupon.id">
          <button
            type="button"
            :data-testid="`available-coupon-${coupon.code}`"
            class="w-full rounded-lg border border-dashed border-rose-300 px-3 py-2 text-left text-sm transition hover:bg-rose-50"
            @click="emit('apply', coupon.code)"
          >
            <span class="font-mono font-semibold text-rose-600">{{ coupon.code }}</span>
            <span class="ml-2 text-gray-600">
              {{ coupon.percentOff }}% 折扣，最高折 NT$ {{ coupon.maxDiscount }}
            </span>
            <span v-if="coupon.minSpend > 0" class="block text-xs text-gray-400">
              低消 NT$ {{ coupon.minSpend }}
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
