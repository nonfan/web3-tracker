import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import gsap from 'gsap'

interface Props {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && overlayRef.current && dialogRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2 }
      )
      gsap.fromTo(dialogRef.current,
        { opacity: 0, scale: 0.9, y: -20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)' }
      )
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
      style={{ opacity: 0 }}
    >
      <div
        ref={dialogRef}
        className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-sm p-5"
        onClick={e => e.stopPropagation()}
        style={{ opacity: 0 }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              {title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-[var(--input-bg)] text-[var(--text-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
