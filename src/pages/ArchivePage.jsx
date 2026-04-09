import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Calendar, ChevronRight } from 'lucide-react'
import useArchiveStore from '../stores/useArchiveStore'

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
  const [tab, setTab] = useState('places')
  const [placeCategory, setPlaceCategory] = useState(undefined)
  const [sort, setSort] = useState('rating')
  const { places, tripRecords, fetchPlaces, fetchTripRecords, loading } = useArchiveStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (tab === 'places') fetchPlaces(placeCategory, sort)
    else fetchTripRecords()
  }, [tab, placeCategory, sort, fetchPlaces, fetchTripRecords])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">기록</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('places')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'places' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>장소 기록</button>
        <button onClick={() => setTab('trips')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'trips' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>여행별 기록</button>
      </div>

      {tab === 'places' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {PLACE_CATEGORIES.map((c) => (
                <button key={c.label} onClick={() => setPlaceCategory(c.value)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${placeCategory === c.value ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>{c.label}</button>
              ))}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1">
              {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" /></div>
          ) : places.length === 0 ? (
            <p className="text-center py-12 text-gray-400">등록된 장소가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {places.map((p) => (
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
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" /></div>
        ) : tripRecords.length === 0 ? (
          <p className="text-center py-12 text-gray-400">기록된 여행이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {tripRecords.map((t) => {
              const s = STATUS_LABELS[t.status]
              return (
                <button key={t.id} onClick={() => navigate(`/archive/trips/${t.id}`)} className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow text-left flex items-center justify-between group">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{t.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s?.color}`}>{s?.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={13} />{t.startDate} ~ {t.endDate}</span>
                      {t.region && <span className="flex items-center gap-1"><MapPin size={13} />{t.region}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {t.averageRating && <span className="flex items-center gap-0.5"><Star size={12} className="text-yellow-500 fill-yellow-500" />{t.averageRating}</span>}
                      <span>후기 {t.reviewCount}건</span>
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
