import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import useAvailabilityStore from '../stores/useAvailabilityStore'
import useAuthStore from '../stores/useAuthStore'
import useTripStore from '../stores/useTripStore'
import { getTrips } from '../api/trips'
import UserBadge from '../components/UserBadge'
import Modal from '../components/Modal'
import { getFixedAvailabilitySlots, sortUsersByAvailabilitySlot } from '../constants/availabilityMemberSlots'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function getDaysInMonth(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  return { firstDay, daysInMonth }
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function AvailabilityPage() {
  const today = new Date()
  const todayStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDates, setSelectedDates] = useState(new Set())
  const [dirty, setDirty] = useState(false)
  const [fixMode, setFixMode] = useState(false)
  const [fixDates, setFixDates] = useState([])
  const [showFixModal, setShowFixModal] = useState(false)
  const [tripTitle, setTripTitle] = useState('')
  const [tripRegion, setTripRegion] = useState('')
  const [saving, setSaving] = useState(false)

  const { data, fetch, save } = useAvailabilityStore()
  const { user } = useAuthStore()
  const { createTrip } = useTripStore()
  const isAdmin = user?.role === 'ADMIN'
  const [confirmedTrips, setConfirmedTrips] = useState([])

  const fetchConfirmedTrips = useCallback(async () => {
    try {
      const [upcomingRes, completedRes] = await Promise.all([
        getTrips('UPCOMING'),
        getTrips('COMPLETED'),
      ])
      setConfirmedTrips([
        ...(upcomingRes.data.data || []),
        ...(completedRes.data.data || []),
      ])
    } catch {
      // no-op
    }
  }, [])

  useEffect(() => {
    fetch(year, month)
    fetchConfirmedTrips()
  }, [year, month, fetch, fetchConfirmedTrips])

  useEffect(() => {
    if (!data) return
    const myDates = new Set()
    data.dates?.forEach((d) => {
      if (d.availableUsers.some((u) => u.id === user?.id)) {
        myDates.add(d.date)
      }
    })
    setSelectedDates(myDates)
    setDirty(false)
  }, [data, user?.id])

  const availabilityMap = useMemo(() => {
    const map = {}
    data?.dates?.forEach((d) => {
      map[d.date] = d
    })
    return map
  }, [data])

  const confirmedDates = useMemo(() => {
    const dates = new Set()
    confirmedTrips.forEach((trip) => {
      const start = new Date(trip.startDate + 'T00:00:00')
      const end = new Date(trip.endDate + 'T00:00:00')
      const current = new Date(start)
      while (current <= end) {
        const y = current.getFullYear()
        const m = String(current.getMonth() + 1).padStart(2, '0')
        const d = String(current.getDate()).padStart(2, '0')
        dates.add(`${y}-${m}-${d}`)
        current.setDate(current.getDate() + 1)
      }
    })
    return dates
  }, [confirmedTrips])

  const { firstDay, daysInMonth } = getDaysInMonth(year, month)

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1) }
    else setMonth(month + 1)
  }

  const isPast = (day) => {
    const d = new Date(year, month - 1, day)
    const t = new Date(); t.setHours(0, 0, 0, 0)
    return d < t
  }

  const toggleDate = (day) => {
    if (isPast(day)) return
    const dateStr = formatDate(year, month, day)
    if (confirmedDates.has(dateStr)) return

    if (fixMode) {
      handleFixToggle(dateStr, day)
      return
    }

    const next = new Set(selectedDates)
    if (next.has(dateStr)) next.delete(dateStr)
    else next.add(dateStr)
    setSelectedDates(next)
    setDirty(true)
  }

  const handleFixToggle = (dateStr, day) => {
    const info = availabilityMap[dateStr]
    if (!info || info.count < 1) return
    if (isPast(day)) return

    const idx = fixDates.indexOf(dateStr)
    if (idx >= 0) {
      setFixDates(fixDates.filter((d) => d !== dateStr))
    } else {
      const newDates = [...fixDates, dateStr].sort()
      if (isConsecutive(newDates)) setFixDates(newDates)
    }
  }

  const isConsecutive = (dates) => {
    if (dates.length <= 1) return true
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      const diff = (curr - prev) / (1000 * 60 * 60 * 24)
      if (diff !== 1) return false
    }
    return true
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const now = new Date()
      const todayStr = formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
      const datesToSave = [...selectedDates].filter(
        (d) => !confirmedDates.has(d) && d >= todayStr,
      )
      await save(year, month, datesToSave)
      setDirty(false)
    } catch (err) {
      alert(err.response?.data?.message || '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateTrip = async () => {
    if (!tripTitle.trim()) return
    try {
      await createTrip({
        title: tripTitle,
        startDate: fixDates[0],
        endDate: fixDates[fixDates.length - 1],
        region: tripRegion || null,
      })
      setShowFixModal(false)
      setFixMode(false)
      setFixDates([])
      setTripTitle('')
      setTripRegion('')
      fetch(year, month)
      fetchConfirmedTrips()
      alert('여행이 생성되었습니다!')
    } catch (err) {
      alert(err.response?.data?.message || '여행 생성 실패')
    }
  }

  const getCellStyle = (day) => {
    const dateStr = formatDate(year, month, day)
    const info = availabilityMap[dateStr]
    const past = isPast(day)
    const isSelected = selectedDates.has(dateStr)
    const isConfirmed = confirmedDates.has(dateStr)
    const isFixSelected = fixDates.includes(dateStr)
    const canSelectForFix = info && info.count >= 1
    const isAllVoted = info?.count === 5

    // 확정된 일정은 쨍하지 않은 오렌지 톤으로 고정한다.
    if (isConfirmed) return 'bg-[#fdf0d0] border-2 border-[#d4a44f] text-amber-900 cursor-not-allowed shadow-[0_0_0_3px_rgba(212,164,79,0.26),0_6px_14px_rgba(212,164,79,0.24)]'
    if (past) return 'bg-gray-50 text-gray-300 cursor-not-allowed'
    if (fixMode) {
      if (isFixSelected) return 'bg-[#F4928A] text-white border-[#e07d74] ring-2 ring-[#F4928A]/40'
      if (canSelectForFix) return 'bg-[#F4928A]/12 border-[#F4928A]/35 text-gray-800 hover:bg-[#F4928A]/22 cursor-pointer'
      return 'bg-gray-50 text-gray-300 cursor-not-allowed'
    }

    // 기본은 흐린 연회색 배경을 사용한다.
    let base = 'bg-gray-50 border-gray-200 text-gray-500 cursor-pointer'

    // 내가 투표한 날짜만 흰색 배경으로 강조한다.
    if (isSelected) {
      base = 'bg-white border-gray-300 text-gray-700 cursor-pointer'
    }

    // 5명 전원 투표한 날짜는 확정일과 같은 테두리로 강조한다.
    if (isAllVoted) {
      base += ' !border-2 !border-[#d4a44f]'
    }

    return `${base} hover:border-[#F4928A]/40`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">일정 조율</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => { setFixMode(!fixMode); setFixDates([]) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                fixMode
                  ? 'bg-[#F4928A] text-white hover:brightness-95'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Lock size={14} className="inline mr-1" />
              {fixMode ? 'Fix 모드 ON' : '일정 Fix'}
            </button>
          )}
          {!fixMode && dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-[#F4928A] text-white rounded-lg text-sm font-medium hover:brightness-95 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
          {fixMode && fixDates.length > 0 && (
            <button
              onClick={() => setShowFixModal(true)}
              className="px-3 py-1.5 bg-[#F4928A] text-white rounded-lg text-sm font-medium hover:brightness-95 transition-colors"
            >
              여행 만들기 ({fixDates.length}일)
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {year}년 {month}월
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = formatDate(year, month, day)
            const info = availabilityMap[dateStr]
            const dayOfWeek = new Date(year, month - 1, day).getDay()
            const isToday = dateStr === todayStr
            const voteSlots = getFixedAvailabilitySlots(info?.availableUsers)

            return (
              <button
                key={day}
                onClick={() => toggleDate(day)}
              className={`relative aspect-square rounded-xl border text-sm font-medium transition-all ${getCellStyle(day)}`}
              >
                <span className={`absolute top-1.5 left-1/2 -translate-x-1/2 ${dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : ''} ${selectedDates.has(dateStr) || fixDates.includes(dateStr) || confirmedDates.has(dateStr) ? '!text-inherit' : ''} ${isToday ? 'px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 font-bold !text-orange-700' : ''}`}>
                  {day}
                </span>
                {!fixMode && (!isPast(day) || confirmedDates.has(dateStr)) && (
                  <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 w-[88%] flex items-center justify-between">
                    {voteSlots.map((slot) => (
                      <div
                        key={slot.reactKey}
                        className="w-4 h-4 shrink-0 rounded-full border-2 border-solid box-border"
                        style={{
                          borderColor: slot.borderColor,
                          backgroundColor: slot.filled ? slot.fillColor : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                )}
                {confirmedDates.has(dateStr) && !fixMode && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-amber-500 text-xs font-semibold leading-none text-white">
                    확정
                  </span>
                )}
                {fixMode && info && (
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold">
                    {info.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {!fixMode && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">날짜별 현황</h3>
          {data?.dates?.length > 0 ? (
            <div className="space-y-2">
              {data.dates.map((d) => (
                <div key={d.date} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-600">{d.date}</span>
                  <div className="flex items-center gap-1.5">
                    {sortUsersByAvailabilitySlot(d.availableUsers).map((u) => (
                      <UserBadge key={u.id} user={u} size="xs" />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">{d.count}명</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">이 달에 등록된 일정이 없습니다.</p>
          )}
        </div>
      )}

      <Modal open={showFixModal} onClose={() => setShowFixModal(false)} title="여행 만들기">
        <div className="space-y-4">
          <div className="bg-[#F4928A]/12 rounded-lg px-3 py-2">
            <p className="text-sm text-gray-800 font-medium">
              {fixDates[0]} ~ {fixDates[fixDates.length - 1]} ({fixDates.length}일)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">여행 제목 *</label>
            <input
              type="text"
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4928A]/40 focus:border-[#F4928A] outline-none text-sm"
              placeholder="예: 5월 제주도 여행"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
            <input
              type="text"
              value={tripRegion}
              onChange={(e) => setTripRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4928A]/40 focus:border-[#F4928A] outline-none text-sm"
              placeholder="예: 제주도"
            />
          </div>
          <button
            onClick={handleCreateTrip}
            disabled={!tripTitle.trim()}
            className="w-full py-2.5 bg-[#F4928A] text-white rounded-lg font-medium hover:brightness-95 disabled:opacity-50 transition-colors text-sm"
          >
            여행 만들기
          </button>
        </div>
      </Modal>
    </div>
  )
}
