import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, ChevronRight } from 'lucide-react'
import useTripStore from '../stores/useTripStore'

const STATUS_LABELS = {
  UPCOMING: { label: '예정', color: 'bg-[#A299D8]/20 text-[#A299D8]' },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
}

export default function TripsPage() {
  const { trips, fetchTrips, loading } = useTripStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTrips('UPCOMING')
  }, [fetchTrips])

  return (
    <div className="space-y-4">
      <h1 className="text-lg sm:text-xl font-bold text-gray-900">여행</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F4928A] border-t-transparent" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-14 px-4 space-y-5">
          <p className="text-gray-500 text-sm">예정된 일정이 없습니다.</p>
          <button
            type="button"
            onClick={() => navigate('/availability')}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#7466C5] hover:brightness-95 shadow-sm transition-colors"
          >
            여행을 계획해보세요
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const s = STATUS_LABELS[trip.status]
            return (
              <button
                key={trip.id}
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="w-full bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow text-left flex items-start sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900 break-words">{trip.title}</h3>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center gap-1 min-w-0">
                      <Calendar size={13} className="shrink-0" />
                      <span className="break-all">
                        {trip.startDate} ~ {trip.endDate}
                      </span>
                    </span>
                    {trip.region && (
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin size={13} className="shrink-0" />
                        <span className="break-words">{trip.region}</span>
                      </span>
                    )}
                  </div>
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
