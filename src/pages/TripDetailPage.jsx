import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Clock, Edit2, X, Check, Ban, CheckCircle } from 'lucide-react'
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

export default function TripDetailPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentTrip: trip, fetchTrip, updateTrip, updateGatherInfo, cancelTrip, completeTrip, logs, fetchLogs } = useTripStore()
  const { items, fetchItems, createItem, changeStatus, deleteItem } = usePlanItemStore()
  const isAdmin = user?.role === 'ADMIN'

  const [category, setCategory] = useState(null)
  const [editInfo, setEditInfo] = useState(false)
  const [editGather, setEditGather] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const [infoForm, setInfoForm] = useState({ title: '', region: '' })
  const [gatherForm, setGatherForm] = useState({ gatherPlace: '', gatherTime: '', gatherNote: '' })
  const [itemForm, setItemForm] = useState({ placeName: '', category: 'FOOD', address: '', status: 'CANDIDATE', note: '', externalLink: '' })

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
  }

  const handleSaveGather = async () => {
    await updateGatherInfo(tripId, {
      ...gatherForm,
      gatherTime: gatherForm.gatherTime || null,
    })
    setEditGather(false)
  }

  const handleAddItem = async () => {
    if (!itemForm.placeName.trim()) return
    try {
      await createItem(tripId, itemForm)
      setShowAddItem(false)
      setItemForm({ placeName: '', category: 'FOOD', address: '', status: 'CANDIDATE', note: '', externalLink: '' })
    } catch (err) {
      alert(err.response?.data?.message || '추가 실패')
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) return
    try {
      await cancelTrip(tripId, cancelReason)
      setShowCancel(false)
      setCancelReason('')
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
          <div className="space-y-2">
            {items.map((item) => {
              const st = ITEM_STATUS[item.status]
              return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{item.place.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${st.color}`}>{st.label}</span>
                      <span className="text-[10px] text-gray-400">{item.place.categoryDisplayName}</span>
                    </div>
                    {item.note && <p className="text-xs text-gray-500">{item.note}</p>}
                    {item.externalLink && <a href={item.externalLink} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline">링크</a>}
                  </div>
                  {isUpcoming && item.status !== 'CANCELLED' && (
                    <div className="flex gap-1">
                      <select
                        value={item.status}
                        onChange={(e) => changeStatus(tripId, item.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-1.5 py-1"
                      >
                        <option value="CANDIDATE">후보</option>
                        <option value="CONFIRMED">확정</option>
                        <option value="RESERVED">예약완료</option>
                        <option value="CANCELLED">취소</option>
                      </select>
                      {item.isDeletable !== false && !item.hasBeenConfirmedOrReserved && item.status === 'CANDIDATE' && (
                        <button onClick={() => deleteItem(tripId, item.id)} className="text-xs text-red-400 hover:text-red-600 px-1">삭제</button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <input value={itemForm.note} onChange={(e) => setItemForm({ ...itemForm, note: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">외부 링크</label>
            <input value={itemForm.externalLink} onChange={(e) => setItemForm({ ...itemForm, externalLink: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button onClick={handleAddItem} disabled={!itemForm.placeName.trim()} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm">추가</button>
        </div>
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
