/**
 * 일정 조율 캘린더: 왼쪽→오른쪽 고정 순서(손→김→신→조→정) + 각 슬롯의 기준 색(hex)
 * 투표자는 API user.color 가 해당 슬롯 색과 같을 때 그 자리에 칠함 (DB 컬러 컬럼 기준)
 */
export const AVAILABILITY_MEMBER_SLOTS = [
  { namePrefix: '손', color: '#D94F4A' },
  { namePrefix: '김', color: '#F5B8CA' },
  { namePrefix: '신', color: '#C4457E' },
  { namePrefix: '조', color: '#8B6CC4' },
  { namePrefix: '정', color: '#6B9E7A' },
]

function normalizeHex(color) {
  if (color == null || color === '') return ''
  let c = String(color).trim().toLowerCase()
  if (!c.startsWith('#')) c = `#${c}`
  if (c.length === 4) {
    const r = c[1]
    const g = c[2]
    const b = c[3]
    c = `#${r}${r}${g}${g}${b}${b}`
  }
  return c
}

export function colorMatchesSlot(userColor, slotColor) {
  return normalizeHex(userColor) === normalizeHex(slotColor)
}

/**
 * @param {Array<{ id: number, name: string, color?: string }> | undefined} availableUsers
 * @returns {{ filled: boolean, borderColor: string, fillColor: string, reactKey: string }[]}
 */
export function getFixedAvailabilitySlots(availableUsers) {
  const users = availableUsers || []
  return AVAILABILITY_MEMBER_SLOTS.map((slot) => {
    const voter = users.find((u) => colorMatchesSlot(u.color, slot.color))
    return {
      filled: Boolean(voter),
      borderColor: slot.color,
      fillColor: voter ? (voter.color || slot.color) : 'transparent',
      reactKey: voter ? `voter-${voter.id}` : `empty-${slot.namePrefix}`,
    }
  })
}

function slotIndexByUserColor(user) {
  const idx = AVAILABILITY_MEMBER_SLOTS.findIndex((slot) =>
    colorMatchesSlot(user.color, slot.color),
  )
  return idx === -1 ? 999 : idx
}

export function sortUsersByAvailabilitySlot(users) {
  if (!users?.length) return []
  return [...users].sort((a, b) => slotIndexByUserColor(a) - slotIndexByUserColor(b))
}
