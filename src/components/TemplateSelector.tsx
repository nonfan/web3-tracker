import { PROJECT_TEMPLATES, type ProjectTemplate } from '../utils/templates'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: ProjectTemplate) => void
}

export function TemplateSelector({ isOpen, onClose, onSelect }: Props) {
  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--card-bg)] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-[var(--border-hover)] shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            选择项目模板
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            {PROJECT_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => {
                  onSelect(template)
                  onClose()
                }}
                className="p-4 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)] hover:border-violet-500/50 rounded-xl text-left transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{template.icon}</span>
                  <span className="font-medium text-[var(--text-primary)] group-hover:text-violet-400 transition-colors">
                    {template.name}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-3">
                  {template.description}
                </p>
                {template.defaultData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.defaultData.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {template.defaultData.tasks.length > 0 && (
                  <div className="mt-2 text-xs text-[var(--text-muted)]">
                    包含 {template.defaultData.tasks.length} 个预设任务
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
