/** 계획 항목 가격 입력(천 단위 콤마) — 최대 10억 원 */
export const MAX_PLAN_ITEM_PRICE = 1_000_000_000

export function formatPriceInput(input) {
  if (input === '' || input == null) return ''
  const digits = String(input).replace(/\D/g, '')
  if (digits === '') return ''
  let n = parseInt(digits, 10)
  if (n > MAX_PLAN_ITEM_PRICE) n = MAX_PLAN_ITEM_PRICE
  return n.toLocaleString('ko-KR')
}

export function parsePriceToNumber(formatted) {
  if (formatted === '' || formatted == null) return null
  const digits = String(formatted).replace(/\D/g, '')
  if (digits === '') return null
  const n = parseInt(digits, 10)
  if (Number.isNaN(n)) return null
  return Math.min(n, MAX_PLAN_ITEM_PRICE)
}
