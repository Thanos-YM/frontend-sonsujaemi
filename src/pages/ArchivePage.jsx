import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Calendar, ChevronRight } from 'lucide-react'
import useArchiveStore from '../stores/useArchiveStore'
import { FOOD_CATEGORIES } from '../constants/foodCategories'

const PLACE_CATEGORIES = [
  { value: undefined, label: '전체' },
  { value: 'ACCOMMODATION', label: '숙소' },
  { value: 'FOOD', label: '식당' },
  { value: 'ACTIVITY', label: '놀거리' },
]

const SORT_OPTIONS = [
  { value: 'rating', label: '별점순' },
  { value: 'visits', label: '방문순' },
  { value: 'recent', label: '최근순' },
]

const STATUS_LABELS = {
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
}

export default function ArchivePage() {
  const [tab, setTab] = useState('trips')
  const [placeCategory, setPlaceCategory] = useState(undefined)
  const [foodCategory, setFoodCategory] = useState(undefined)
  const [sort, setSort] = useState('rating')
  const { places, tripRecords, fetchPlaces, fetchTripRecords, loading } = useArchiveStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (tab === 'places') fetchPlaces(placeCategory, sort)
    else fetchTripRecords()
  }, [tab, placeCategory, sort, fetchPlaces, fetchTripRecords])

  useEffect(() => {
    if (placeCategory !== 'FOOD') {
      setFoodCategory(undefined)
    }
  }, [placeCategory])

  const foodFilters = useMemo(
    () => [
      { value: undefined, label: '전체' },
      ...FOOD_CATEGORIES.filter((c) => c.value).map((c) => ({ value: c.value, label: c.label })),
    ],
    [],
  )

  const visiblePlaces = useMemo(() => {
    if (placeCategory === 'FOOD' && foodCategory) {
      return places.filter((p) => p.foodCategory === foodCategory)
    }
    return places
  }, [places, placeCategory, foodCategory])

  return (
    <div className="space-y-4">
      <h1 className="text-lg sm:text-xl font-bold text-gray-900">기록</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setTab('trips')}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-colors touch-manipulation ${tab === 'trips' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          여행별 기록
        </button>
        <button
          type="button"
          onClick={() => setTab('places')}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-colors touch-manipulation ${tab === 'places' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          장소 기록
        </button>
      </div>

      {tab === 'places' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
              {PLACE_CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.label}
                  onClick={() => setPlaceCategory(c.value)}
                  className={`shrink-0 px-2.5 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-colors touch-manipulation ${placeCategory === c.value ? 'bg-[#A299D8]/20 text-[#A299D8]' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-2 sm:py-1 w-full sm:w-auto shrink-0 touch-manipulation"
            >
              {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {placeCategory === 'FOOD' && (
            <div className="flex gap-1 flex-wrap">
              {foodFilters.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setFoodCategory(c.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${foodCategory === c.value ? 'bg-[#A299D8]/20 text-[#A299D8]' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F4928A] border-t-transparent" /></div>
          ) : visiblePlaces.length === 0 ? (
            <p className="text-center py-12 text-gray-400">등록된 장소가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visiblePlaces.map((p) => (
                <button key={p.id} onClick={() => navigate(`/archive/places/${p.id}`)} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow text-left group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{p.name}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{p.categoryDisplayName}</span>
                      </div>
                      {p.address && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11} />{p.address}</p>}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    {p.averageRating && <span className="flex items-center gap-0.5"><Star size={12} className="text-yellow-500 fill-yellow-500" />{p.averageRating}</span>}
                    <span>방문 {p.visitCount}회</span>
                    <span>후기 {p.reviewCount}건</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'trips' && (
        loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F4928A] border-t-transparent" /></div>
        ) : tripRecords.length === 0 ? (
          <p className="text-center py-12 text-gray-400">기록된 여행이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {tripRecords.map((t) => {
              const s = STATUS_LABELS[t.status]
              const isCancelled = t.status === 'CANCELLED'
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => navigate(`/archive/trips/${t.id}`)}
                  className={`w-full bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow text-left flex items-start sm:items-center justify-between gap-3 group ${
                    isCancelled ? 'border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`font-semibold break-words ${isCancelled ? 'text-gray-500 line-through decoration-red-500' : 'text-gray-900'}`}>{t.title}</h3>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${s?.color}`}>{s?.label}</span>
                    </div>
                    <div className={`flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1 sm:gap-3 text-xs sm:text-sm ${isCancelled ? 'text-gray-400 line-through decoration-red-500' : 'text-gray-500'}`}>
                      <span className="flex items-center gap-1 min-w-0"><Calendar size={13} className="shrink-0" /><span className="break-all">{t.startDate} ~ {t.endDate}</span></span>
                      {t.region && <span className="flex items-center gap-1 min-w-0"><MapPin size={13} className="shrink-0" /><span className="break-words">{t.region}</span></span>}
                    </div>
                    {isCancelled && t.cancelReason && (
                      <p className="text-sm text-red-500 font-medium">취소 사유: {t.cancelReason}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {t.averageRating && <span className="flex items-center gap-0.5"><Star size={12} className="text-yellow-500 fill-yellow-500" />{t.averageRating}</span>}
                      {!isCancelled && <span>후기 {t.reviewCount}건</span>}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500" />
                </button>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
