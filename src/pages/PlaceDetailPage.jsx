import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, MapPin, MessageSquare, Pencil } from 'lucide-react'
import useArchiveStore from '../stores/useArchiveStore'
import useAuthStore from '../stores/useAuthStore'
import UserBadge from '../components/UserBadge'
import Modal from '../components/Modal'
import * as planItemsApi from '../api/planItems'

const clampRating = (value) => {
  const n = Number(value)
  if (Number.isNaN(n)) return 0
  return Math.min(5, Math.max(0, n))
}

export default function PlaceDetailPage() {
  const { placeId } = useParams()
  const navigate = useNavigate()
  const { placeDetail: place, fetchPlaceDetail, updatePlaceArchiveNote, loading } = useArchiveStore()
  const { user } = useAuthStore()
  const [visitReviewItem, setVisitReviewItem] = useState(null)
  const [visitReviewForm, setVisitReviewForm] = useState({ rating: 5.0, content: '' })
  const [archiveDraft, setArchiveDraft] = useState('')
  const [archiveSaving, setArchiveSaving] = useState(false)
  const [editingArchive, setEditingArchive] = useState(false)

  useEffect(() => { fetchPlaceDetail(placeId) }, [placeId, fetchPlaceDetail])

  useEffect(() => {
    if (place && !editingArchive) setArchiveDraft(place.archiveNote ?? '')
  }, [place, editingArchive])

  const openVisitReview = (visit) => {
    const mine = user ? visit.reviews?.find((r) => r.user.id === user.id) : null
    setVisitReviewItem(visit)
    setVisitReviewForm({
      rating: mine?.rating ?? 5.0,
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

  const startEditArchive = () => {
    setArchiveDraft(place?.archiveNote ?? '')
    setEditingArchive(true)
  }

  const cancelEditArchive = () => {
    setArchiveDraft(place?.archiveNote ?? '')
    setEditingArchive(false)
  }

  const handleSavePlaceArchive = async () => {
    if (archiveSaving) return
    setArchiveSaving(true)
    try {
      await updatePlaceArchiveNote(placeId, { archiveNote: archiveDraft.trim() || null })
      setEditingArchive(false)
    } catch (err) {
      alert(err.response?.data?.message || '저장 실패')
    } finally {
      setArchiveSaving(false)
    }
  }

  if (loading || !place) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F4928A] border-t-transparent" /></div>

  const visitReviewMine = visitReviewItem && user
    ? visitReviewItem.reviews?.find((r) => r.user.id === user.id)
    : null

  const canWriteReview = (visit) => visit.tripStatus === 'COMPLETED' && visit.status !== 'CANCELLED'

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/archive')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> 기록
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight break-words">{place.name}</h2>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">{place.categoryDisplayName}</span>
            </div>
            {place.address && (
              <p className="text-sm text-gray-500 flex items-start gap-1.5">
                <MapPin size={15} className="shrink-0 mt-0.5 text-gray-400" />
                <span>{place.address}</span>
              </p>
            )}
          </div>
          {!editingArchive && (
            <button
              type="button"
              onClick={startEditArchive}
              className="shrink-0 rounded-xl p-2.5 text-gray-400 hover:text-[#7466C5] hover:bg-[#A299D8]/20 transition-colors"
              title="장소 기록 편집"
              aria-label="장소 기록 편집"
            >
              <Pencil size={20} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-3 border-t border-gray-100 text-sm text-gray-600">
          {place.averageRating != null && <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500 fill-yellow-500" />{place.averageRating.toFixed(1)}</span>}
          <span>방문 {place.visitCount}회</span>
          <span>후기 {place.reviewCount}건</span>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">장소 정보</p>
          {editingArchive ? (
            <div className="space-y-3">
              <textarea
                value={archiveDraft}
                onChange={(e) => setArchiveDraft(e.target.value)}
                rows={6}
                className="w-full px-3 py-2.5 border border-[#A299D8]/45 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A299D8]/35 focus:border-[#7466C5] resize-y min-h-[120px]"
                placeholder="자유 형식으로 작성하세요."
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSavePlaceArchive}
                  disabled={archiveSaving}
                  className="px-4 py-2 rounded-lg bg-[#7466C5] text-white text-sm font-medium hover:brightness-95 disabled:opacity-50"
                >
                  {archiveSaving ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditArchive}
                  disabled={archiveSaving}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50/80 px-3.5 py-3 min-h-[3rem]">
              {place.archiveNote ? (
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{place.archiveNote}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">아직 기록이 없습니다. 우측 상단 연필을 눌러 추가하세요.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-700 px-0.5">방문별 후기</h3>

      {place.visits?.map((visit) => {
        const canReview = canWriteReview(visit)
        const myReview = user ? visit.reviews?.find((r) => r.user.id === user.id) : null
        return (
          <div key={visit.planItemId} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2 mb-4">
              <h4 className="text-sm font-semibold text-gray-800 break-words min-w-0">{visit.tripTitle}</h4>
              {canReview && user && (
                <button
                  type="button"
                  onClick={() => openVisitReview(visit)}
                  className="shrink-0 text-xs text-[#7466C5] hover:text-[#6556B1] font-medium flex items-center gap-1"
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
                        {r.rating != null && (
                          <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                            <Star size={10} className="fill-yellow-500 text-yellow-500" />{r.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{r.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">이 여행에 대한 후기가 없습니다.</p>
            )}
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
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={visitReviewForm.rating}
                onChange={(e) => setVisitReviewForm({ ...visitReviewForm, rating: clampRating(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">0.0 ~ 5.0 (0.1 단위)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
              <textarea value={visitReviewForm.content} onChange={(e) => setVisitReviewForm({ ...visitReviewForm, content: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="이번 방문에 대한 후기를 작성해주세요" />
            </div>
            <button type="button" onClick={handleSubmitVisitReview} disabled={!visitReviewForm.content.trim()} className="w-full py-2.5 bg-[#7466C5] text-white rounded-lg font-medium hover:brightness-95 disabled:opacity-50 transition-colors text-sm">
              {visitReviewMine ? '수정' : '작성'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
