import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-fluid-md pb-safe">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl ${maxWidth} w-full sm:mx-4 max-h-[min(92dvh,100vh)] sm:max-h-[85vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-fluid-sm sm:px-fluid-md py-fluid-sm sm:py-fluid-md border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h3 className="text-fluid-lg sm:text-fluid-xl font-semibold text-gray-900 pr-2">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0 touch-manipulation"
            aria-label="닫기"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-fluid-sm sm:p-fluid-md">{children}</div>
      </div>
    </div>
  )
}
