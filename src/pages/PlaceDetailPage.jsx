import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, MapPin, MessageSquare } from 'lucide-react'
import useArchiveStore from '../stores/useArchiveStore'
import useAuthStore from '../stores/useAuthStore'
import UserBadge from '../components/UserBadge'
import Modal from '../components/Modal'
import * as planItemsApi from '../api/planItems'

export default function PlaceDetailPage() {
  const { placeId } = useParams()
  const navigate = useNavigate()
  const { placeDetail: place, fetchPlaceDetail, loading } = useArchiveStore()
  const { user } = useAuthStore()
  const [visitReviewItem, setVisitReviewItem] = useState(null)
  const [visitReviewForm, setVisitReviewForm] = useState({ rating: 5, content: '' })

  useEffect(() => { fetchPlaceDetail(placeId) }, [placeId, fetchPlaceDetail])

  const openVisitReview = (visit) => {
    const mine = user ? visit.reviews?.find((r) => r.user.id === user.id) : null
    setVisitReviewItem(visit)
    setVisitReviewForm({
      rating: mine?.rating || 5,
      content: mine?.content || '',
    })
  }

  const handleSubmitVisitReview = async () => {
    if (!visitReviewItem || !visitReviewForm.content.trim()) return
    try {
      const mine = user ? visitReviewItem.reviews?.find((r) => r.user.id === user.id) : null
      if (mine) {
        await planItemsApi.updateVisitReview(visitReviewItem.planItemId, mine.id, visitReviewForm)
      } else {
        await planItemsApi.createVisitReview(visitReviewItem.planItemId, visitReviewForm)
      }
      setVisitReviewItem(null)
      fetchPlaceDetail(placeId)
    } catch (err) {
      alert(err.response?.data?.message || '후기 저장 실패')
    }
  }

  if (loading || !place) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" /></div>

  const visitReviewMine = visitReviewItem && user
    ? visitReviewItem.reviews?.find((r) => r.user.id === user.id)
    : null

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

      {place.visits?.map((visit) => {
        const canReview = visit.tripStatus === 'COMPLETED' && visit.status !== 'CANCELLED'
        const myReview = user ? visit.reviews?.find((r) => r.user.id === user.id) : null
        return (
          <div key={visit.planItemId} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-sm font-semibold text-gray-700 truncate">{visit.tripTitle}</h3>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${visit.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : visit.status === 'RESERVED' ? 'bg-emerald-100 text-emerald-700' : visit.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {visit.status === 'CONFIRMED' ? '확정' : visit.status === 'RESERVED' ? '예약완료' : visit.status === 'CANCELLED' ? '취소' : '후보'}
                </span>
              </div>
              {canReview && user && (
                <button
                  type="button"
                  onClick={() => openVisitReview(visit)}
                  className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <MessageSquare size={12} />
                  {myReview ? '내 후기 수정' : '후기 작성'}
                </button>
              )}
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
        )
      })}

      <Modal open={!!visitReviewItem} onClose={() => setVisitReviewItem(null)} title={visitReviewMine ? '후기 수정' : '후기 작성'}>
        {visitReviewItem && (
          <div className="space-y-3">
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{place.name}</span>
              <span className="text-xs text-gray-500 block mt-0.5">{visitReviewItem.tripTitle}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">별점</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setVisitReviewForm({ ...visitReviewForm, rating: n })}>
                    <Star size={24} className={n <= visitReviewForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
              <textarea value={visitReviewForm.content} onChange={(e) => setVisitReviewForm({ ...visitReviewForm, content: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="이번 방문에 대한 후기를 작성해주세요" />
            </div>
            <button type="button" onClick={handleSubmitVisitReview} disabled={!visitReviewForm.content.trim()} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm">
              {visitReviewMine ? '수정' : '작성'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
