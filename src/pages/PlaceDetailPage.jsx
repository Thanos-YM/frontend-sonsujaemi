import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, MapPin } from 'lucide-react'
import useArchiveStore from '../stores/useArchiveStore'
import UserBadge from '../components/UserBadge'

export default function PlaceDetailPage() {
  const { placeId } = useParams()
  const navigate = useNavigate()
  const { placeDetail: place, fetchPlaceDetail, loading } = useArchiveStore()

  useEffect(() => { fetchPlaceDetail(placeId) }, [placeId, fetchPlaceDetail])

  if (loading || !place) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" /></div>

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/archive')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> 기록
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold text-gray-900">{place.name}</h2>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">{place.categoryDisplayName}</span>
        </div>
        {place.address && <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={13} />{place.address}</p>}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
          {place.averageRating && <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500 fill-yellow-500" />{place.averageRating}</span>}
          <span>방문 {place.visitCount}회</span>
          <span>후기 {place.reviewCount}건</span>
        </div>
      </div>

      {place.visits?.map((visit) => (
        <div key={visit.planItemId} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{visit.tripTitle}</h3>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${visit.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : visit.status === 'RESERVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
              {visit.status === 'CONFIRMED' ? '확정' : visit.status === 'RESERVED' ? '예약완료' : visit.status === 'CANCELLED' ? '취소' : '후보'}
            </span>
          </div>
          {visit.reviews?.length > 0 ? (
            <div className="space-y-3">
              {visit.reviews.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <UserBadge user={r.user} size="xs" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-700">{r.user.name}</span>
                      {r.rating && (
                        <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                          <Star size={10} className="fill-yellow-500 text-yellow-500" />{r.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">후기가 없습니다.</p>}
        </div>
      ))}
    </div>
  )
}
