import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Calendar, MapPin } from 'lucide-react'
import useArchiveStore from '../stores/useArchiveStore'
import useAuthStore from '../stores/useAuthStore'
import UserBadge from '../components/UserBadge'
import Modal from '../components/Modal'
import * as tripsApi from '../api/trips'

export default function TripRecordDetailPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { tripRecordDetail: record, fetchTripRecordDetail, loading } = useArchiveStore()
  const { user } = useAuthStore()
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' })
  const [myReview, setMyReview] = useState(null)

  useEffect(() => { fetchTripRecordDetail(tripId) }, [tripId, fetchTripRecordDetail])

  useEffect(() => {
    if (record?.reviews && user) {
      const mine = record.reviews.find((r) => r.user.id === user.id)
      setMyReview(mine || null)
      if (mine) setReviewForm({ rating: mine.rating || 5, content: mine.content })
    }
  }, [record, user])

  const handleSubmitReview = async () => {
    if (!reviewForm.content.trim()) return
    try {
      if (myReview) {
        await tripsApi.updateTripReview(tripId, myReview.id, reviewForm)
      } else {
        await tripsApi.createTripReview(tripId, reviewForm)
      }
      setShowReviewModal(false)
      fetchTripRecordDetail(tripId)
    } catch (err) {
      alert(err.response?.data?.message || '후기 저장 실패')
    }
  }

  if (loading || !record) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" /></div>

  const isCompleted = record.status === 'COMPLETED'

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/archive')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> 기록
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-gray-900">{record.title}</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${record.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {record.status === 'COMPLETED' ? '완료' : '취소'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Calendar size={13} />{record.startDate} ~ {record.endDate}</span>
          {record.region && <span className="flex items-center gap-1"><MapPin size={13} />{record.region}</span>}
          {record.averageRating && <span className="flex items-center gap-1"><Star size={13} className="text-yellow-500 fill-yellow-500" />{record.averageRating}</span>}
        </div>
        {record.cancelReason && <p className="text-sm text-red-500 mt-2">취소 사유: {record.cancelReason}</p>}
      </div>

      {/* 계획 항목 */}
      {record.planItems?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">계획 항목</h3>
          <div className="space-y-2">
            {record.planItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">{item.place.name}</span>
                  <span className="text-[10px] text-gray-400">{item.place.categoryDisplayName}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${item.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : item.status === 'RESERVED' ? 'bg-emerald-100 text-emerald-700' : item.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  {item.status === 'CONFIRMED' ? '확정' : item.status === 'RESERVED' ? '예약완료' : item.status === 'CANCELLED' ? '취소' : '후보'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 여행 총평 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">여행 총평</h3>
          {isCompleted && (
            <button onClick={() => setShowReviewModal(true)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
              {myReview ? '내 총평 수정' : '총평 작성'}
            </button>
          )}
        </div>
        {record.reviews?.length > 0 ? (
          <div className="space-y-3">
            {record.reviews.map((r) => (
              <div key={r.id} className="flex items-start gap-2">
                <UserBadge user={r.user} size="xs" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-700">{r.user.name}</span>
                    {r.rating && <span className="flex items-center gap-0.5 text-xs text-yellow-600"><Star size={10} className="fill-yellow-500 text-yellow-500" />{r.rating}</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{r.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">총평이 없습니다.</p>}
      </div>

      {/* 활동 로그 */}
      {record.logs?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">활동 로그</h3>
          <div className="space-y-2">
            {record.logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 py-1">
                {log.actor ? <UserBadge user={log.actor} size="xs" /> : <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">🤖</div>}
                <div>
                  <p className="text-sm text-gray-700">{log.description}</p>
                  <p className="text-[10px] text-gray-400">{log.createdAt?.replace('T', ' ').slice(0, 16)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title={myReview ? '총평 수정' : '총평 작성'}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">별점</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                  <Star size={24} className={n <= reviewForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
            <textarea value={reviewForm.content} onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="여행에 대한 총평을 작성해주세요" />
          </div>
          <button onClick={handleSubmitReview} disabled={!reviewForm.content.trim()} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm">
            {myReview ? '수정' : '작성'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
