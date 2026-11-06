// 優惠券試算共用邏輯（Cart、Checkout 共用）：
// 金額一律使用後端 preview 回傳值，前端不自行計算折扣
import { ref } from 'vue'
import { ApiError, fetchCoupons, previewCoupon, type Coupon, type PreviewResult } from '../api/client'
import { useCartStore } from '../stores/cart'

export function useCouponPreview() {
  const cart = useCartStore()

  const couponInput = ref(cart.couponCode)
  const couponError = ref('')
  const amounts = ref<PreviewResult | null>(null)
  const loading = ref(false)
  const availableCoupons = ref<Coupon[]>([])

  /** 載入啟用中的優惠券供點選；失敗時靜默略過（不影響手動輸入代碼） */
  async function loadAvailableCoupons() {
    try {
      availableCoupons.value = await fetchCoupons()
    } catch {
      availableCoupons.value = []
    }
  }

  /**
   * 向後端試算金額（無券時也呼叫以取得 subtotal）。
   * 若已套用的優惠券失效（如低消不足、額度用完），顯示錯誤並改用無券試算。
   */
  async function refreshPreview() {
    if (cart.items.length === 0) {
      amounts.value = null
      return
    }
    loading.value = true
    try {
      amounts.value = await previewCoupon({
        items: cart.itemsPayload,
        code: cart.couponCode || undefined,
      })
    } catch (err) {
      if (err instanceof ApiError && cart.couponCode) {
        couponError.value = err.message
        cart.setCouponCode('')
        couponInput.value = ''
        try {
          amounts.value = await previewCoupon({ items: cart.itemsPayload })
        } catch {
          amounts.value = null
        }
      } else {
        couponError.value = err instanceof ApiError ? err.message : '金額試算失敗，請稍後再試'
      }
    } finally {
      loading.value = false
    }
  }

  /** 套用優惠券：成功才寫入 store；失敗顯示錯誤並退回無券試算。可傳入代碼（點選可用券） */
  async function applyCoupon(codeOverride?: string) {
    couponError.value = ''
    const code = (codeOverride ?? couponInput.value).trim()
    if (!code || cart.items.length === 0) return
    couponInput.value = code
    try {
      amounts.value = await previewCoupon({ items: cart.itemsPayload, code })
      cart.setCouponCode(code)
    } catch (err) {
      couponError.value = err instanceof ApiError ? err.message : '套用優惠券失敗，請稍後再試'
      if (cart.couponCode) cart.setCouponCode('')
      try {
        amounts.value = await previewCoupon({ items: cart.itemsPayload })
      } catch {
        // 保留原金額顯示
      }
    }
  }

  /** 移除已套用的優惠券 */
  async function removeCoupon() {
    couponError.value = ''
    couponInput.value = ''
    cart.setCouponCode('')
    await refreshPreview()
  }

  return {
    couponInput,
    couponError,
    amounts,
    loading,
    availableCoupons,
    loadAvailableCoupons,
    refreshPreview,
    applyCoupon,
    removeCoupon,
  }
}
