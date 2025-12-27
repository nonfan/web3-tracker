import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Tooltip } from './Tooltip'
import { ConfirmDialog } from './ConfirmDialog'
import { Favicon } from './Favicon'
import { Trash2, X, RotateCcw, Trash } from 'lucide-react'
import gsap from 'gsap'

export function TrashBin() {
  const { deletedProjects, restoreProject, permanentDeleteProject, clearTrash } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && overlayRef.current && panelRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2 }
      )
      gsap.fromTo(panelRef.current,
        { opacity: 0, scale: 0.95, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [isOpen])

  return (
    <>
      <Tooltip content={`回收站${deletedProjects.length > 0 ? ` (${deletedProjects.length})` : ''}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all relative"
        >
          <Trash2 className="w-4 h-4" />
          {deletedProjects.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {deletedProjects.length > 9 ? '9+' : deletedProjects.length}
            </span>
          )}
        </button>
      </Tooltip>

      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
          style={{ opacity: 0 }}
        >
          <div
            ref={panelRef}
            className="bg-[var(--card-bg)] rounded-2xl w-full max-w-md border border-[var(--border-hover)] shadow-2xl overflow-hidden"
            style={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">回收站</h2>
                {deletedProjects.length > 0 && (
                  <span className="text-sm text-[var(--text-muted)]">({deletedProjects.length})</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {deletedProjects.length > 0 && (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    清空
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {deletedProjects.length === 0 ? (
                <div className="py-12 text-center">
                  <Trash className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
                  <p className="text-[var(--text-muted)]">回收站是空的</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {deletedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--input-bg)] transition-colors group"
                    >
                      {/* Logo */}
                      {project.website ? (
                        <Favicon url={project.website} name={project.name} size={40} />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">
                          {project.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-[var(--text-muted)] truncate">{project.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => restoreProject(project.id)}
                        className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="恢复"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => permanentDeleteProject(project.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="永久删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 清空确认 */}
      <ConfirmDialog
        isOpen={confirmClear}
        title="清空回收站"
        message={`确定要永久删除 ${deletedProjects.length} 个项目吗？此操作不可恢复。`}
        confirmText="清空"
        cancelText="取消"
        onConfirm={() => {
          clearTrash()
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  )
}
