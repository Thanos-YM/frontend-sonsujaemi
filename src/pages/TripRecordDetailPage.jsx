import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Calendar, MapPin, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import useArchiveStore from '../stores/useArchiveStore'
import useAuthStore from '../stores/useAuthStore'
import UserBadge from '../components/UserBadge'
import Modal from '../components/Modal'
import * as tripsApi from '../api/trips'
import * as planItemsApi from '../api/planItems'
import { formatPriceInput, parsePriceToNumber } from '../utils/priceInput'
import { FOOD_CATEGORIES } from '../constants/foodCategories'
import { searchKakaoPlaces } from '../api/places'

const emptyItemForm = () => ({
  placeName: '',
  category: 'FOOD',
  address: '',
  status: 'CANDIDATE',
  note: '',
  externalLink: '',
  price: '',
  menuItems: '',
  nights: '',
  foodCategory: '',
  kakaoPlaceId: '',
  latitude: null,
  longitude: null,
  placeUrl: '',
})

const clampRating = (value) => {
  const n = Number(value)
  if (Number.isNaN(n)) return 0
  return Math.min(5, Math.max(0, n))
}

export default function TripRecordDetailPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { tripRecordDetail: record, fetchTripRecordDetail, loading } = useArchiveStore()
  const { user } = useAuthStore()
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5.0, content: '' })
  const [myReview, setMyReview] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [editItemForm, setEditItemForm] = useState({ note: '', externalLink: '', price: '', menuItems: '', nights: '', foodCategory: '' })
  const [submitting, setSubmitting] = useState(false)
  const [expandedItemId, setExpandedItemId] = useState(null)
  const [itemReviews, setItemReviews] = useState({})
  const [visitReviewItem, setVisitReviewItem] = useState(null)
  const [visitReviewForm, setVisitReviewForm] = useState({ rating: 5.0, content: '' })
  const [myVisitReviews, setMyVisitReviews] = useState({})
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemForm, setItemForm] = useState(emptyItemForm)
  const [kakaoResults, setKakaoResults] = useState([])
  const [kakaoLoading, setKakaoLoading] = useState(false)

  useEffect(() => { fetchTripRecordDetail(tripId) }, [tripId, fetchTripRecordDetail])

  useEffect(() => {
    if (record?.reviews && user) {
      const mine = record.reviews.find((r) => r.user.id === user.id)
      setMyReview(mine || null)
      if (mine) setReviewForm({ rating: mine.rating ?? 5.0, content: mine.content })
    }
  }, [record, user])

  useEffect(() => {
    if (!showAddItem) return
    const q = itemForm.placeName.trim()
    if (q.length < 2) {
      setKakaoResults([])
      return
    }
    const timer = setTimeout(async () => {
      setKakaoLoading(true)
      try {
        const res = await searchKakaoPlaces({ query: q, page: 1, size: 10 })
        setKakaoResults(res.data.data || [])
      } catch {
        setKakaoResults([])
      } finally {
        setKakaoLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [itemForm.placeName, showAddItem])

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

  const openEditItem = (item) => {
    setEditItem(item)
    setEditItemForm({
      note: item.note || '',
      externalLink: item.externalLink || '',
      price: item.price != null ? formatPriceInput(String(item.price)) : '',
      menuItems: item.menuItems || '',
      nights: item.nights ?? '',
      foodCategory: item.foodCategory || '',
    })
  }

  const handleEditItem = async () => {
    if (!editItem || submitting) return
    setSubmitting(true)
    try {
      await planItemsApi.updatePlanItem(tripId, editItem.id, {
        note: editItemForm.note || null,
        externalLink: editItemForm.externalLink || null,
        price: parsePriceToNumber(editItemForm.price),
        menuItems: editItemForm.menuItems || null,
        nights: editItemForm.nights !== '' ? Number(editItemForm.nights) : null,
        foodCategory: editItem.place.category === 'FOOD' ? (editItemForm.foodCategory || null) : null,
      })
      setEditItem(null)
      fetchTripRecordDetail(tripId)
    } catch (err) {
      alert(err.response?.data?.message || '수정 실패')
    } finally {
      setSubmitting(false)
    }
  }

  const selectKakaoPlace = (doc) => {
    const addr = doc.roadAddressName || doc.addressName || ''
    setItemForm((prev) => ({
      ...prev,
      placeName: doc.placeName || '',
      address: addr,
      kakaoPlaceId: doc.id || '',
      latitude: doc.latitude ?? null,
      longitude: doc.longitude ?? null,
      placeUrl: doc.placeUrl || '',
    }))
    setKakaoResults([])
  }

  const handleAddItem = async () => {
    if (!itemForm.placeName.trim() || !itemForm.address.trim() || submitting) return
    setSubmitting(true)
    try {
      const payload = {
        placeName: itemForm.placeName.trim(),
        category: itemForm.category,
        address: itemForm.address.trim(),
        status: itemForm.status,
        note: itemForm.note || null,
        externalLink: itemForm.externalLink || null,
        price: parsePriceToNumber(itemForm.price),
        nights: itemForm.nights ? Number(itemForm.nights) : null,
        menuItems: itemForm.menuItems || null,
        foodCategory: itemForm.category === 'FOOD' ? (itemForm.foodCategory || null) : null,
      }
      if (itemForm.kakaoPlaceId) {
        payload.kakaoPlaceId = itemForm.kakaoPlaceId
        if (itemForm.latitude != null) payload.latitude = itemForm.latitude
        if (itemForm.longitude != null) payload.longitude = itemForm.longitude
        if (itemForm.placeUrl) payload.placeUrl = itemForm.placeUrl
      }

      await planItemsApi.createPlanItem(tripId, payload)
      setShowAddItem(false)
      setItemForm(emptyItemForm())
      setKakaoResults([])
      fetchTripRecordDetail(tripId)
    } catch (err) {
      alert(err.response?.data?.message || '추가 실패')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpandItem = async (itemId) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null)
      return
    }
    setExpandedItemId(itemId)
    if (!itemReviews[itemId]) {
      try {
        const res = await planItemsApi.getVisitReviews(itemId)
        const reviews = res.data.data
        setItemReviews((prev) => ({ ...prev, [itemId]: reviews }))
        if (user) {
          const mine = reviews.find((r) => r.user.id === user.id)
          if (mine) setMyVisitReviews((prev) => ({ ...prev, [itemId]: mine }))
        }
      } catch { /* no-op */ }
    }
  }

  const openVisitReview = (item) => {
    const mine = myVisitReviews[item.id]
    setVisitReviewItem(item)
    setVisitReviewForm({
      rating: mine?.rating ?? 5.0,
      content: mine?.content || '',
    })
  }

  const handleSubmitVisitReview = async () => {
    if (!visitReviewItem || !visitReviewForm.content.trim()) return
    try {
      const mine = myVisitReviews[visitReviewItem.id]
      if (mine) {
        await planItemsApi.updateVisitReview(visitReviewItem.id, mine.id, visitReviewForm)
      } else {
        await planItemsApi.createVisitReview(visitReviewItem.id, visitReviewForm)
      }
      setVisitReviewItem(null)
      const res = await planItemsApi.getVisitReviews(visitReviewItem.id)
      const reviews = res.data.data
      setItemReviews((prev) => ({ ...prev, [visitReviewItem.id]: reviews }))
      if (user) {
        const newMine = reviews.find((r) => r.user.id === user.id)
        if (newMine) setMyVisitReviews((prev) => ({ ...prev, [visitReviewItem.id]: newMine }))
      }
    } catch (err) {
      alert(err.response?.data?.message || '후기 저장 실패')
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return
    try {
      await planItemsApi.deletePlanItem(tripId, itemId)
      fetchTripRecordDetail(tripId)
    } catch (err) {
      alert(err.response?.data?.message || '삭제 실패')
    }
  }

  if (loading || !record) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#F4928A] border-t-transparent" /></div>

  const isCompleted = record.status === 'COMPLETED'

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/archive')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> 기록
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{record.title}</h2>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${record.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {record.status === 'COMPLETED' ? '완료' : '취소'}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500">
          <span className="flex items-center gap-1 min-w-0"><Calendar size={13} className="shrink-0" /><span className="break-all">{record.startDate} ~ {record.endDate}</span></span>
          {record.region && <span className="flex items-center gap-1 min-w-0"><MapPin size={13} className="shrink-0" /><span className="break-words">{record.region}</span></span>}
          {record.averageRating != null && <span className="flex items-center gap-1"><Star size={13} className="text-yellow-500 fill-yellow-500 shrink-0" />{record.averageRating.toFixed(1)}</span>}
        </div>
        {record.cancelReason && <p className="text-sm text-red-500 mt-2">취소 사유: {record.cancelReason}</p>}
      </div>

      {/* 계획 항목 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">계획 항목</h3>
          {isCompleted && (
            <button
              type="button"
              onClick={() => {
                setItemForm(emptyItemForm())
                setKakaoResults([])
                setShowAddItem(true)
              }}
              className="self-start sm:self-auto px-3 py-1.5 sm:py-1 bg-[#7466C5] text-white rounded-lg text-xs font-medium hover:brightness-95 transition-colors touch-manipulation"
            >
              + 추가
            </button>
          )}
        </div>
        {(record.planItems?.length || 0) > 0 ? (
          <div className="space-y-2">
            {record.planItems.map((item) => {
              const isExpanded = expandedItemId === item.id
              const reviews = itemReviews[item.id] || []
              return (
                <div key={item.id} className="rounded-lg border border-gray-100 overflow-hidden">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 hover:bg-gray-50 transition-colors">
                    <button type="button" onClick={() => toggleExpandItem(item.id)} className="flex-1 text-left space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 break-words">{item.place.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${item.status === 'CONFIRMED' ? 'bg-[#A299D8]/20 text-[#7466C5]' : item.status === 'RESERVED' ? 'bg-emerald-100 text-emerald-700' : item.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {item.status === 'CONFIRMED' ? '확정' : item.status === 'RESERVED' ? '예약완료' : item.status === 'CANCELLED' ? '취소' : '후보'}
                        </span>
                        <span className="text-[10px] text-gray-400">{item.place.categoryDisplayName}</span>
                        {item.foodCategoryDisplayName && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">{item.foodCategoryDisplayName}</span>
                        )}
                        {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {item.price != null && <span className="text-xs text-gray-500">{item.price.toLocaleString()}원</span>}
                        {item.menuItems && <span className="text-xs text-gray-500">{item.menuItems}</span>}
                        {item.nights != null && <span className="text-xs text-gray-500">{item.nights}박</span>}
                      </div>
                      {item.note && <p className="text-xs text-gray-400">{item.note}</p>}
                    </button>
                    {isCompleted && item.status !== 'CANCELLED' && (
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button type="button" onClick={() => openEditItem(item)} className="text-xs text-gray-600 hover:text-gray-900 px-1 touch-manipulation">수정</button>
                        <button type="button" onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-500 hover:text-red-700 font-medium px-1 touch-manipulation">삭제</button>
                      </div>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-50 bg-gray-50/50">
                      {item.externalLink && <a href={item.externalLink} target="_blank" rel="noreferrer" className="text-xs text-[#7466C5] hover:text-[#6556B1] hover:underline inline-block mt-2">외부 링크</a>}
                      <div className="flex items-center justify-between mt-2 mb-1.5">
                        <span className="text-xs font-semibold text-gray-600 flex items-center gap-1"><MessageSquare size={12} /> 후기</span>
                        {isCompleted && (
                          <button onClick={() => openVisitReview(item)} className="text-xs text-[#7466C5] hover:text-[#6556B1] font-medium">
                            {myVisitReviews[item.id] ? '내 후기 수정' : '후기 작성'}
                          </button>
                        )}
                      </div>
                      {reviews.length > 0 ? (
                        <div className="space-y-2">
                          {reviews.map((r) => (
                            <div key={r.id} className="flex items-start gap-2">
                              <UserBadge user={r.user} size="xs" />
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-gray-700">{r.user.name}</span>
                                  {r.rating != null && <span className="flex items-center gap-0.5 text-[10px] text-yellow-600"><Star size={9} className="fill-yellow-500 text-yellow-500" />{r.rating.toFixed(1)}</span>}
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5">{r.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-400">후기가 없습니다.</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-2">등록된 항목이 없습니다.</p>
        )}
      </div>

      {/* 여행 총평 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">여행 총평</h3>
          {isCompleted && (
            <button type="button" onClick={() => setShowReviewModal(true)} className="self-start sm:self-auto px-3 py-2 sm:py-1 bg-[#7466C5] text-white rounded-lg text-xs font-medium hover:brightness-95 transition-colors touch-manipulation">
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
                    {r.rating != null && <span className="flex items-center gap-0.5 text-xs text-yellow-600"><Star size={10} className="fill-yellow-500 text-yellow-500" />{r.rating.toFixed(1)}</span>}
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
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

      {/* 항목별 후기 모달 */}
      <Modal open={!!visitReviewItem} onClose={() => setVisitReviewItem(null)} title={myVisitReviews[visitReviewItem?.id] ? '후기 수정' : '후기 작성'}>
        {visitReviewItem && (
          <div className="space-y-3">
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{visitReviewItem.place.name}</span>
              <span className="text-xs text-gray-400 ml-2">{visitReviewItem.place.categoryDisplayName}</span>
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
              <textarea value={visitReviewForm.content} onChange={(e) => setVisitReviewForm({ ...visitReviewForm, content: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="이 장소에 대한 후기를 작성해주세요" />
            </div>
            <button onClick={handleSubmitVisitReview} disabled={!visitReviewForm.content.trim()} className="w-full py-2.5 bg-[#7466C5] text-white rounded-lg font-medium hover:brightness-95 disabled:opacity-50 transition-colors text-sm">
              {myVisitReviews[visitReviewItem.id] ? '수정' : '작성'}
            </button>
          </div>
        )}
      </Modal>

      {/* 항목 수정 모달 */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="계획 항목 수정">
        {editItem && (
          <div className="space-y-3">
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{editItem.place.name}</span>
              <span className="text-xs text-gray-400 ml-2">{editItem.place.categoryDisplayName}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={editItemForm.price}
                onChange={(e) => setEditItemForm({ ...editItemForm, price: formatPriceInput(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="원"
              />
            </div>
            {editItem.place.category === 'FOOD' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">식당 대분류</label>
                  <select value={editItemForm.foodCategory} onChange={(e) => setEditItemForm({ ...editItemForm, foodCategory: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    {FOOD_CATEGORIES.map((c) => <option key={c.label + c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">주문한 메뉴</label>
                  <textarea value={editItemForm.menuItems} onChange={(e) => setEditItemForm({ ...editItemForm, menuItems: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="예: 삼겹살 2인분, 된장찌개 1개" />
                </div>
              </>
            )}
            {editItem.place.category === 'ACCOMMODATION' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">숙박 일수</label>
                <input type="number" min="1" value={editItemForm.nights} onChange={(e) => setEditItemForm({ ...editItemForm, nights: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="박" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
              <input value={editItemForm.note} onChange={(e) => setEditItemForm({ ...editItemForm, note: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">외부 링크</label>
              <input value={editItemForm.externalLink} onChange={(e) => setEditItemForm({ ...editItemForm, externalLink: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <button onClick={handleEditItem} disabled={submitting} className="w-full py-2.5 bg-[#7466C5] text-white rounded-lg font-medium hover:brightness-95 disabled:opacity-50 transition-colors text-sm">{submitting ? '저장 중...' : '저장'}</button>
          </div>
        )}
      </Modal>

      {/* 항목 추가 모달 */}
      <Modal open={showAddItem} onClose={() => { setShowAddItem(false); setKakaoResults([]) }} title="계획 항목 추가">
        <div className="space-y-3">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">장소명 *</label>
            <input
              value={itemForm.placeName}
              onChange={(e) => {
                const v = e.target.value
                setItemForm((prev) => ({
                  ...prev,
                  placeName: v,
                  ...(prev.kakaoPlaceId
                    ? { kakaoPlaceId: '', latitude: null, longitude: null, placeUrl: '' }
                    : {}),
                }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              autoComplete="off"
            />
            {kakaoLoading && <p className="text-xs text-gray-400 mt-1">장소 검색 중…</p>}
            {kakaoResults.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
                {kakaoResults.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-[#F4928A]/10 border-b border-gray-50 last:border-0"
                      onClick={() => selectKakaoPlace(doc)}
                    >
                      <div className="font-medium text-gray-900">{doc.placeName}</div>
                      <div className="text-xs text-gray-500 truncate">{doc.roadAddressName || doc.addressName || '주소 없음'}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
              <select
                value={itemForm.category}
                onChange={(e) => {
                  const v = e.target.value
                  setItemForm((prev) => ({
                    ...prev,
                    category: v,
                    ...(prev.kakaoPlaceId
                      ? { kakaoPlaceId: '', latitude: null, longitude: null, placeUrl: '' }
                      : {}),
                  }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="ACCOMMODATION">숙소</option>
                <option value="FOOD">식당</option>
                <option value="ACTIVITY">놀거리</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select value={itemForm.status} onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="CANDIDATE">후보</option>
                <option value="CONFIRMED">확정</option>
                <option value="RESERVED">예약완료</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소 *</label>
            <input
              value={itemForm.address}
              onChange={(e) => {
                const v = e.target.value
                setItemForm((prev) => ({
                  ...prev,
                  address: v,
                  ...(prev.kakaoPlaceId
                    ? { kakaoPlaceId: '', latitude: null, longitude: null, placeUrl: '' }
                    : {}),
                }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="주소를 입력하세요"
              autoComplete="street-address"
            />
            {itemForm.kakaoPlaceId ? (
              <p className="text-xs text-emerald-600 mt-1">주소를 바꾸면 수동 입력으로 전환됩니다.</p>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={itemForm.price}
              onChange={(e) => setItemForm({ ...itemForm, price: formatPriceInput(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="원"
            />
          </div>
          {itemForm.category === 'FOOD' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">식당 대분류</label>
                <select value={itemForm.foodCategory} onChange={(e) => setItemForm({ ...itemForm, foodCategory: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {FOOD_CATEGORIES.map((c) => <option key={c.label + c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주문한 메뉴</label>
                <textarea value={itemForm.menuItems} onChange={(e) => setItemForm({ ...itemForm, menuItems: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="예: 삼겹살 2인분, 된장찌개 1개" />
              </div>
            </>
          )}
          {itemForm.category === 'ACCOMMODATION' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">숙박 일수</label>
              <input type="number" min="1" value={itemForm.nights} onChange={(e) => setItemForm({ ...itemForm, nights: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="박" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <input value={itemForm.note} onChange={(e) => setItemForm({ ...itemForm, note: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">외부 링크</label>
            <input value={itemForm.externalLink} onChange={(e) => setItemForm({ ...itemForm, externalLink: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button onClick={handleAddItem} disabled={!itemForm.placeName.trim() || !itemForm.address.trim() || submitting} className="w-full py-2.5 bg-[#7466C5] text-white rounded-lg font-medium hover:brightness-95 disabled:opacity-50 transition-colors text-sm">{submitting ? '추가 중...' : '추가'}</button>
        </div>
      </Modal>

      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title={myReview ? '총평 수정' : '총평 작성'}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">별점</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={reviewForm.rating}
              onChange={(e) => setReviewForm({ ...reviewForm, rating: clampRating(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">0.0 ~ 5.0 (0.1 단위)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
            <textarea value={reviewForm.content} onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="여행에 대한 총평을 작성해주세요" />
          </div>
          <button onClick={handleSubmitReview} disabled={!reviewForm.content.trim()} className="w-full py-2.5 bg-[#7466C5] text-white rounded-lg font-medium hover:brightness-95 disabled:opacity-50 transition-colors text-sm">
            {myReview ? '수정' : '작성'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
