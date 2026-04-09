import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, ChevronRight } from 'lucide-react'
import useTripStore from '../stores/useTripStore'

const STATUS_LABELS = {
  UPCOMING: { label: '예정', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
}

const FILTERS = [
  { value: null, label: '전체' },
  { value: 'UPCOMING', label: '예정' },
  { value: 'CANCELLED', label: '취소' },
]

export default function TripsPage() {
  const { trips, fetchTrips, loading } = useTripStore()
  const [filter, setFilter] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTrips(filter)
  }, [filter, fetchTrips])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">여행 관리</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12 text-gray-400">여행이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const s = STATUS_LABELS[trip.status]
            return (
              <button
                key={trip.id}
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow text-left flex items-center justify-between group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {trip.startDate} ~ {trip.endDate}
                    </span>
                    {trip.region && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} />
                        {trip.region}
                      </span>
                    )}
                  </div>
                  {trip.status === 'CANCELLED' && trip.cancelReason && (
                    <p className="text-xs text-red-500">취소 사유: {trip.cancelReason}</p>
                  )}
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
