import { Check, Flag, Pencil, Trash2, DollarSign, RefreshCw } from 'lucide-react'
import type { Project } from '../../types'
import { Favicon } from '../Favicon'
import { Tooltip } from '../Tooltip'
import { priorityConfig, getStatusConfig } from './cardUtils'

interface CardHeaderProps {
  project: Project
  isToken: boolean
  selected?: boolean
  selectionMode?: boolean
  onSelect?: (id: string) => void
  onEdit: () => void
  onOpenTransaction: () => void
  onOpenDelete: () => void
  onRefreshPrice?: () => void
  showTransactionPanel: boolean
  showDeleteConfirm: boolean
  isRefreshingPrice?: boolean
  profitButtonRef: React.RefObject<HTMLButtonElement | null>
  deleteButtonRef: React.RefObject<HTMLButtonElement | null>
}

export function CardHeader({
  project,
  isToken,
  selected,
  selectionMode,
  onSelect,
  onEdit,
  onOpenTransaction,
  onOpenDelete,
  onRefreshPrice,
  showTransactionPanel,
  showDeleteConfirm,
  isRefreshingPrice,
  profitButtonRef,
  deleteButtonRef,
}: CardHeaderProps) {
  const statusConfig = getStatusConfig(isToken)
  const status = statusConfig[project.status] || statusConfig.active
  const priority = project.priority ? priorityConfig[project.priority] : priorityConfig.medium

  return (
    <div className="flex items-start gap-3">
      {/* Logo */}
      {(project.logoUrl || project.website) && (
        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-secondary)] flex items-center justify-center">
          {project.logoUrl ? (
            project.logoUrl.trim().startsWith('<svg') ? (
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: project.logoUrl }}
              />
            ) : (
              <img
                src={project.logoUrl}
                alt={project.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )
          ) : (
            <Favicon url={project.website!} name={project.name} size={36} />
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {selectionMode && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(project.id)
              }}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                selected ? 'bg-violet-500 border-violet-500' : 'border-gray-600'
              }`}
            >
              {selected && <Check className="w-3 h-3 text-white" />}
            </button>
          )}
          <h3 className="text-lg font-semibold truncate text-[var(--text-primary)]">{project.name}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {project.priority === 'high' && (
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${priority.bg} ${priority.text}`}>
              <Flag className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!selectionMode && (
        <div className={`flex gap-1 transition-opacity ${showTransactionPanel || showDeleteConfirm ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isToken && onRefreshPrice && (
            <Tooltip content={isRefreshingPrice ? "更新中..." : "刷新价格数据"}>
              <button
                onClick={onRefreshPrice}
                disabled={isRefreshingPrice}
                className={`p-2 rounded-lg transition-colors ${
                  isRefreshingPrice
                    ? 'bg-blue-500/20 text-blue-400 cursor-not-allowed'
                    : 'hover:bg-blue-500/10 text-[var(--text-muted)] hover:text-blue-400'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingPrice ? 'animate-spin' : ''}`} />
              </button>
            </Tooltip>
          )}
          <Tooltip content="记录收益">
            <button
              ref={profitButtonRef}
              onClick={onOpenTransaction}
              className={`p-2 rounded-lg transition-colors ${
                showTransactionPanel
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'hover:bg-emerald-500/10 text-[var(--text-muted)] hover:text-emerald-400'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </button>
          </Tooltip>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            ref={deleteButtonRef}
            onClick={onOpenDelete}
            className={`p-2 rounded-lg transition-colors ${
              showDeleteConfirm
                ? 'bg-red-500/20 text-red-400'
                : 'hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
