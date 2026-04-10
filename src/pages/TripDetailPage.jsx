import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Clock, Edit2, X, Check, Ban, CheckCircle, GripVertical } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import useTripStore from '../stores/useTripStore'
import usePlanItemStore from '../stores/usePlanItemStore'
import useAuthStore from '../stores/useAuthStore'
import Modal from '../components/Modal'
import UserBadge from '../components/UserBadge'

const CATEGORIES = [
  { value: null, label: '전체' },
  { value: 'ACCOMMODATION', label: '숙소' },
  { value: 'FOOD', label: '식당' },
  { value: 'ACTIVITY', label: '놀거리' },
]

const ITEM_STATUS = {
  CANDIDATE: { label: '후보', color: 'bg-gray-100 text-gray-600' },
  CONFIRMED: { label: '확정', color: 'bg-blue-100 text-blue-700' },
  RESERVED: { label: '예약완료', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
}

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 touch-none">
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

export default function TripDetailPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentTrip: trip, fetchTrip, updateTrip, updateGatherInfo, cancelTrip, completeTrip, logs, fetchLogs } = useTripStore()
  const { items, fetchItems, createItem, updateItem, changeStatus, deleteItem, reorderItems } = usePlanItemStore()
  const isAdmin = user?.role === 'ADMIN'
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const [category, setCategory] = useState(null)
  const [editInfo, setEditInfo] = useState(false)
  const [editGather, setEditGather] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [editItemForm, setEditItemForm] = useState({ note: '', externalLink: '', price: '', menuItems: '', nights: '' })

  const [infoForm, setInfoForm] = useState({ title: '', region: '' })
  const [gatherForm, setGatherForm] = useState({ gatherPlace: '', gatherTime: '', gatherNote: '' })
  const [itemForm, setItemForm] = useState({ placeName: '', category: 'FOOD', address: '', status: 'CANDIDATE', note: '', externalLink: '', price: '', menuItems: '', nights: '' })

  useEffect(() => { fetchTrip(tripId) }, [tripId, fetchTrip])
  useEffect(() => { fetchItems(tripId, category) }, [tripId, category, fetchItems])
  useEffect(() => { fetchLogs(tripId) }, [tripId, fetchLogs])

  useEffect(() => {
    if (trip) {
      setInfoForm({ title: trip.title, region: trip.region || '' })
      setGatherForm({
        gatherPlace: trip.gatherInfo?.gatherPlace || '',
        gatherTime: trip.gatherInfo?.gatherTime?.slice(0, 16) || '',
        gatherNote: trip.gatherInfo?.gatherNote || '',
      })
    }
  }, [trip])

  if (!trip) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" /></div>

  const isUpcoming = trip.status === 'UPCOMING'

  const handleSaveInfo = async () => {
    await updateTrip(tripId, infoForm)
    setEditInfo(false)
    fetchLogs(tripId)
  }

  const handleSaveGather = async () => {
    await updateGatherInfo(tripId, {
      ...gatherForm,
      gatherTime: gatherForm.gatherTime || null,
    })
    setEditGather(false)
    fetchLogs(tripId)
  }

  const handleAddItem = async () => {
    if (!itemForm.placeName.trim() || submitting) return
    setSubmitting(true)
    try {
      const payload = {
        ...itemForm,
        price: itemForm.price ? Number(itemForm.price) : null,
        nights: itemForm.nights ? Number(itemForm.nights) : null,
        menuItems: itemForm.menuItems || null,
      }
      await createItem(tripId, payload)
      setShowAddItem(false)
      setItemForm({ placeName: '', category: 'FOOD', address: '', status: 'CANDIDATE', note: '', externalLink: '', price: '', menuItems: '', nights: '' })
      fetchLogs(tripId)
    } catch (err) {
      alert(err.response?.data?.message || '추가 실패')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditItem = (item) => {
    setEditItem(item)
    setEditItemForm({
      note: item.note || '',
      externalLink: item.externalLink || '',
      price: item.price ?? '',
      menuItems: item.menuItems || '',
      nights: item.nights ?? '',
    })
  }

  const handleEditItem = async () => {
    if (!editItem || submitting) return
    setSubmitting(true)
    try {
      const payload = {
        note: editItemForm.note || null,
        externalLink: editItemForm.externalLink || null,
        price: editItemForm.price !== '' ? Number(editItemForm.price) : null,
        menuItems: editItemForm.menuItems || null,
        nights: editItemForm.nights !== '' ? Number(editItemForm.nights) : null,
      }
      await updateItem(tripId, editItem.id, payload)
      setEditItem(null)
      fetchLogs(tripId)
    } catch (err) {
      alert(err.response?.data?.message || '수정 실패')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...items]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    reorderItems(tripId, reordered)
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) return
    try {
      await cancelTrip(tripId, cancelReason)
      setShowCancel(false)
      setCancelReason('')
      fetchLogs(tripId)
    } catch (err) {
      alert(err.response?.data?.message || '취소 실패')
    }
  }

  const handleComplete = async () => {
    if (!confirm('여행을 완료 처리하시겠습니까?')) return
    try {
      await completeTrip(tripId)
      fetchLogs(tripId)
    } catch (err) {
      alert(err.response?.data?.message || '완료 처리 실패')
    }
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/trips')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> 여행 목록
      </button>

      {/* 기본 정보 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          {editInfo ? (
            <div className="flex-1 space-y-2">
              <input value={infoForm.title} onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="여행 제목" />
              <input value={infoForm.region} onChange={(e) => setInfoForm({ ...infoForm, region: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="지역" />
              <div className="flex gap-2">
                <button onClick={handleSaveInfo} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs"><Check size={12} className="inline mr-1" />저장</button>
                <button onClick={() => setEditInfo(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs"><X size={12} className="inline mr-1" />취소</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-gray-900">{trip.title}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${trip.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' : trip.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {trip.status === 'UPCOMING' ? '예정' : trip.status === 'CANCELLED' ? '취소' : '완료'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Calendar size={13} />{trip.startDate} ~ {trip.endDate}</span>
                {trip.region && <span className="flex items-center gap-1"><MapPin size={13} />{trip.region}</span>}
              </div>
              {trip.cancelReason && <p className="text-sm text-red-500 mt-2">취소 사유: {trip.cancelReason}</p>}
            </div>
          )}
          {isUpcoming && !editInfo && (
            <div className="flex gap-1.5">
              <button onClick={() => setEditInfo(true)} className="p-2 rounded-lg hover:bg-gray-100"><Edit2 size={14} className="text-gray-400" /></button>
              {isAdmin && (
                <>
                  <button onClick={handleComplete} className="p-2 rounded-lg hover:bg-green-50" title="완료 처리"><CheckCircle size={14} className="text-green-500" /></button>
                  <button onClick={() => setShowCancel(true)} className="p-2 rounded-lg hover:bg-red-50" title="취소"><Ban size={14} className="text-red-500" /></button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 집결 정보 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">집결 정보</h3>
          {isUpcoming && !editGather && <button onClick={() => setEditGather(true)} className="p-1 rounded hover:bg-gray-100"><Edit2 size={13} className="text-gray-400" /></button>}
        </div>
        {editGather ? (
          <div className="space-y-2">
            <input value={gatherForm.gatherPlace} onChange={(e) => setGatherForm({ ...gatherForm, gatherPlace: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="집합 장소" />
            <input type="datetime-local" value={gatherForm.gatherTime} onChange={(e) => setGatherForm({ ...gatherForm, gatherTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={gatherForm.gatherNote} onChange={(e) => setGatherForm({ ...gatherForm, gatherNote: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="메모" />
            <div className="flex gap-2">
              <button onClick={handleSaveGather} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs"><Check size={12} className="inline mr-1" />저장</button>
              <button onClick={() => setEditGather(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs"><X size={12} className="inline mr-1" />취소</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600 space-y-1">
            {trip.gatherInfo?.gatherPlace ? (
              <>
                <p className="flex items-center gap-1"><MapPin size={13} />{trip.gatherInfo.gatherPlace}</p>
                {trip.gatherInfo.gatherTime && <p className="flex items-center gap-1"><Clock size={13} />{trip.gatherInfo.gatherTime.replace('T', ' ')}</p>}
                {trip.gatherInfo.gatherNote && <p className="text-gray-400">{trip.gatherInfo.gatherNote}</p>}
              </>
            ) : <p className="text-gray-400">집결 정보가 없습니다.</p>}
          </div>
        )}
      </div>

      {/* 계획 항목 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">계획 항목</h3>
          {isUpcoming && <button onClick={() => setShowAddItem(true)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">+ 추가</button>}
        </div>
        <div className="flex gap-1 mb-3">
          {CATEGORIES.map((c) => (
            <button key={c.label} onClick={() => setCategory(c.value)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${category === c.value ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>{c.label}</button>
          ))}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">등록된 항목이 없습니다.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item) => {
                  const st = ITEM_STATUS[item.status]
                  return (
                    <SortableItem key={item.id} id={item.id}>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{item.place.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${st.color}`}>{st.label}</span>
                            <span className="text-[10px] text-gray-400">{item.place.categoryDisplayName}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            {item.price != null && <span className="text-xs text-gray-500">{item.price.toLocaleString()}원</span>}
                            {item.menuItems && <span className="text-xs text-gray-500">{item.menuItems}</span>}
                            {item.nights != null && <span className="text-xs text-gray-500">{item.nights}박</span>}
                          </div>
                          {item.note && <p className="text-xs text-gray-400">{item.note}</p>}
                          {item.externalLink && <a href={item.externalLink} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline">링크</a>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isUpcoming && item.status !== 'CANCELLED' && (
                            <select
                              value={item.status}
                              onChange={async (e) => { await changeStatus(tripId, item.id, e.target.value); fetchLogs(tripId) }}
                              className="text-xs border border-gray-200 rounded px-1.5 py-1"
                            >
                              <option value="CANDIDATE">후보</option>
                              <option value="CONFIRMED">확정</option>
                              <option value="RESERVED">예약완료</option>
                              <option value="CANCELLED">취소</option>
                            </select>
                          )}
                          {item.status !== 'CANCELLED' && (
                            <>
                              <button onClick={() => openEditItem(item)} className="text-xs text-indigo-500 hover:text-indigo-700 px-1">수정</button>
                              <button onClick={async () => { if (confirm('이 항목을 삭제하시겠습니까?')) { await deleteItem(tripId, item.id); fetchLogs(tripId) } }} className="text-xs text-red-400 hover:text-red-600 px-1">삭제</button>
                            </>
                          )}
                        </div>
                      </div>
                    </SortableItem>
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* 활동 로그 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">활동 로그</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400">활동 로그가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 py-1.5">
                {log.actor ? <UserBadge user={log.actor} size="xs" /> : <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px]">🤖</div>}
                <div>
                  <p className="text-sm text-gray-700">{log.description}</p>
                  <p className="text-[10px] text-gray-400">{log.createdAt?.replace('T', ' ').slice(0, 16)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 항목 추가 모달 */}
      <Modal open={showAddItem} onClose={() => setShowAddItem(false)} title="계획 항목 추가">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">장소명 *</label>
            <input value={itemForm.placeName} onChange={(e) => setItemForm({ ...itemForm, placeName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
              <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <input value={itemForm.address} onChange={(e) => setItemForm({ ...itemForm, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
            <input type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="원" />
          </div>
          {itemForm.category === 'FOOD' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시킨 메뉴</label>
              <textarea value={itemForm.menuItems} onChange={(e) => setItemForm({ ...itemForm, menuItems: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="예: 삼겹살 2인분, 된장찌개 1개" />
            </div>
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
          <button onClick={handleAddItem} disabled={!itemForm.placeName.trim() || submitting} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm">{submitting ? '추가 중...' : '추가'}</button>
        </div>
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
              <input type="number" value={editItemForm.price} onChange={(e) => setEditItemForm({ ...editItemForm, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="원" />
            </div>
            {editItem.place.category === 'FOOD' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시킨 메뉴</label>
                <textarea value={editItemForm.menuItems} onChange={(e) => setEditItemForm({ ...editItemForm, menuItems: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="예: 삼겹살 2인분, 된장찌개 1개" />
              </div>
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
            <button onClick={handleEditItem} disabled={submitting} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm">{submitting ? '저장 중...' : '저장'}</button>
          </div>
        )}
      </Modal>

      {/* 취소 모달 */}
      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="여행 취소">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">이 여행을 취소하시겠습니까? 취소 후에는 되돌릴 수 없습니다.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">취소 사유 *</label>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" placeholder="취소 사유를 입력하세요" />
          </div>
          <button onClick={handleCancel} disabled={!cancelReason.trim()} className="w-full py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors text-sm">취소하기</button>
        </div>
      </Modal>
    </div>
  )
}
