import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Save, Lock } from 'lucide-react'
import useAvailabilityStore from '../stores/useAvailabilityStore'
import useAuthStore from '../stores/useAuthStore'
import useTripStore from '../stores/useTripStore'
import UserBadge from '../components/UserBadge'
import Modal from '../components/Modal'

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

  useEffect(() => {
    fetch(year, month)
  }, [year, month, fetch])

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
    return new Set()
  }, [])

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
    if (!info || info.count < 5) return
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
      await save(year, month, [...selectedDates])
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
    const allAvailable = info?.count >= 5

    if (isConfirmed) return 'bg-emerald-100 border-emerald-300 text-emerald-700 cursor-not-allowed'
    if (past) return 'bg-gray-50 text-gray-300 cursor-not-allowed'
    if (fixMode) {
      if (isFixSelected) return 'bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-300'
      if (allAvailable) return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
      return 'bg-gray-50 text-gray-300 cursor-not-allowed'
    }
    if (isSelected) return 'bg-indigo-500 text-white border-indigo-600 shadow-sm'
    return 'bg-white border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer'
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
                  ? 'bg-emerald-600 text-white'
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
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {saving ? '저장 중...' : '저장'}
            </button>
          )}
          {fixMode && fixDates.length > 0 && (
            <button
              onClick={() => setShowFixModal(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
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

            return (
              <button
                key={day}
                onClick={() => toggleDate(day)}
                className={`relative aspect-square rounded-lg border text-sm font-medium transition-all ${getCellStyle(day)}`}
              >
                <span className={`${dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : ''} ${selectedDates.has(dateStr) || fixDates.includes(dateStr) ? '!text-inherit' : ''}`}>
                  {day}
                </span>
                {info && info.count > 0 && !fixMode && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-px">
                    {info.availableUsers.slice(0, 5).map((u) => (
                      <div
                        key={u.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: u.color }}
                      />
                    ))}
                  </div>
                )}
                {fixMode && info && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-bold">
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
                    {d.availableUsers.map((u) => (
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
          <div className="bg-emerald-50 rounded-lg px-3 py-2">
            <p className="text-sm text-emerald-700 font-medium">
              {fixDates[0]} ~ {fixDates[fixDates.length - 1]} ({fixDates.length}일)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">여행 제목 *</label>
            <input
              type="text"
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
              placeholder="예: 5월 제주도 여행"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
            <input
              type="text"
              value={tripRegion}
              onChange={(e) => setTripRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
              placeholder="예: 제주도"
            />
          </div>
          <button
            onClick={handleCreateTrip}
            disabled={!tripTitle.trim()}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
          >
            여행 만들기
          </button>
        </div>
      </Modal>
    </div>
  )
}
