<script setup lang="ts">
// 後台優惠券表單：新增與編輯共用。
// 編輯時 code 唯讀、usedCount 不可改（契約限制）；後端沒有「依 id 取單張」的端點，
// 編輯載入時改由列表（含停用券）找出該筆
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ApiError,
  createCoupon,
  fetchCoupons,
  updateCoupon,
  type Coupon,
} from '../../api/client'

const route = useRoute()
const router = useRouter()

const editingId = computed(() => (route.params.id ? Number(route.params.id) : null))
const isEdit = computed(() => editingId.value !== null)

// 以字串保存，才能區分「空白」與 0
const code = ref('')
const percentOff = ref('')
const maxDiscount = ref('')
const minSpend = ref('')
const usageLimit = ref('') // 空白 = 不限次數
const isActive = ref(true)
const usedCount = ref(0)

const errorMessage = ref('')
const loading = ref(false)
const submitting = ref(false)

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100 disabled:bg-gray-100 disabled:text-gray-500'

function fillForm(coupon: Coupon) {
  code.value = coupon.code
  percentOff.value = String(coupon.percentOff)
  maxDiscount.value = String(coupon.maxDiscount)
  minSpend.value = String(coupon.minSpend)
  usageLimit.value = coupon.usageLimit === null ? '' : String(coupon.usageLimit)
  isActive.value = coupon.isActive
  usedCount.value = coupon.usedCount
}

onMounted(async () => {
  if (!isEdit.value) return
  loading.value = true
  try {
    const all = await fetchCoupons(true)
    const target = all.find((c) => c.id === editingId.value)
    if (!target) {
      errorMessage.value = '找不到此優惠券'
      return
    }
    fillForm(target)
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : '載入優惠券失敗，請稍後再試'
  } finally {
    loading.value = false
  }
})

/** 轉成整數；空白或非整數回傳 null（type="number" 的 v-model 會讓值變成 number，故先轉字串） */
function toInt(value: string | number): number | null {
  if (String(value).trim() === '') return null
  const n = Number(value)
  return Number.isInteger(n) ? n : null
}

/**
 * 前端驗證只鏡射 API 契約以提早提示；最終仍以後端 VALIDATION_ERROR 為準。
 * 回傳錯誤訊息，通過則回傳空字串。
 */
function validate(): string {
  if (!isEdit.value) {
    const c = code.value.trim()
    if (c === '' || c.length > 32) return '優惠券代碼為必填，且不可超過 32 字元'
    if (!/^[A-Z0-9_-]+$/.test(c)) return '優惠券代碼只能使用大寫英文、數字、底線與連字號'
  }
  const percent = toInt(percentOff.value)
  if (percent === null || percent < 1 || percent > 100) return '折扣百分比須為 1–100 的整數'
  const max = toInt(maxDiscount.value)
  if (max === null || max < 0) return '折抵上限須為 0 以上的整數'
  const min = toInt(minSpend.value)
  if (min === null || min < 0) return '低消門檻須為 0 以上的整數'
  if (String(usageLimit.value).trim() !== '') {
    const limit = toInt(usageLimit.value)
    if (limit === null || limit < 1) return '使用次數上限須為 1 以上的整數，或留空代表不限次數'
  }
  return ''
}

async function handleSubmit() {
  errorMessage.value = ''
  const invalid = validate()
  if (invalid) {
    errorMessage.value = invalid
    return
  }

  const body = {
    percentOff: Number(percentOff.value),
    maxDiscount: Number(maxDiscount.value),
    minSpend: Number(minSpend.value),
    usageLimit: String(usageLimit.value).trim() === '' ? null : Number(usageLimit.value),
    isActive: isActive.value,
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await updateCoupon(editingId.value as number, body)
    } else {
      await createCoupon({ code: code.value.trim(), ...body })
    }
    router.push({ name: 'admin-coupons' })
  } catch (err) {
    // 例如 COUPON_CODE_TAKEN、VALIDATION_ERROR、FORBIDDEN、COUPON_NOT_FOUND
    errorMessage.value = err instanceof ApiError ? err.message : '儲存失敗，請稍後再試'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-lg">
    <h2 class="mb-4 text-xl font-bold">{{ isEdit ? '編輯優惠券' : '新增優惠券' }}</h2>

    <p v-if="loading" class="text-gray-500">載入中…</p>

    <form
      v-else
      class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      @submit.prevent="handleSubmit"
    >
      <div>
        <label class="mb-1 block text-sm text-gray-600" for="coupon-code">代碼</label>
        <input
          id="coupon-code"
          v-model="code"
          data-testid="admin-coupon-code"
          type="text"
          maxlength="32"
          placeholder="例如 SUMMER20"
          :disabled="isEdit"
          :class="inputClass"
        />
        <p v-if="isEdit" class="mt-1 text-xs text-gray-400">代碼建立後不可修改</p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label class="mb-1 block text-sm text-gray-600" for="coupon-percent">折扣 %</label>
          <input id="coupon-percent" v-model="percentOff" data-testid="admin-coupon-percent" type="number" min="1" max="100" :class="inputClass" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-gray-600" for="coupon-max">折抵上限</label>
          <input id="coupon-max" v-model="maxDiscount" data-testid="admin-coupon-max" type="number" min="0" :class="inputClass" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-gray-600" for="coupon-min">低消門檻</label>
          <input id="coupon-min" v-model="minSpend" data-testid="admin-coupon-min" type="number" min="0" :class="inputClass" />
        </div>
      </div>

      <div>
        <label class="mb-1 block text-sm text-gray-600" for="coupon-limit">使用次數上限</label>
        <input
          id="coupon-limit"
          v-model="usageLimit"
          data-testid="admin-coupon-limit"
          type="number"
          min="1"
          placeholder="留空代表不限次數"
          :class="inputClass"
        />
        <p v-if="isEdit" class="mt-1 text-xs text-gray-400">目前已使用 {{ usedCount }} 次（不可修改）</p>
      </div>

      <label class="flex items-center gap-2 text-sm text-gray-700">
        <input v-model="isActive" data-testid="admin-coupon-active" type="checkbox" class="h-4 w-4 accent-rose-600" />
        啟用中
      </label>

      <p v-if="errorMessage" data-testid="admin-form-error" class="text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <div class="flex gap-3">
        <button
          type="submit"
          data-testid="admin-coupon-submit"
          :disabled="submitting"
          class="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ submitting ? '儲存中…' : '儲存' }}
        </button>
        <RouterLink
          :to="{ name: 'admin-coupons' }"
          class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-600 transition hover:border-rose-400 hover:text-rose-600"
        >
          取消
        </RouterLink>
      </div>
    </form>
  </div>
</template>
