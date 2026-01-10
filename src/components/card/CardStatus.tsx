import { Archive, ArchiveRestore } from 'lucide-react'
import type { Project, ProjectStatus, TokenStatus } from '../../types'
import { Tooltip } from '../Tooltip'
import { getStatusConfig } from './cardUtils'

interface CardStatusProps {
  project: Project
  isToken: boolean
  onUpdateStatus: (status: ProjectStatus | TokenStatus) => void
  onArchive?: (archived: boolean) => void
}

export function CardStatus({ project, isToken, onUpdateStatus, onArchive }: CardStatusProps) {
  const statusConfig = getStatusConfig(isToken)
  const statuses = isToken 
    ? ['active', 'launched', 'completed', 'dead'] as const
    : ['research', 'active', 'completed', 'dead'] as const

  return (
    <div className="flex gap-1 mt-4 pt-4 border-t border-[var(--border)]">
      {statuses.map((s) => {
        const config = statusConfig[s]
        const isActive = project.status === s
        return (
          <button
            key={s}
            onClick={() => onUpdateStatus(s as any)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              isActive
                ? `${config.bg} ${config.text}`
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--input-bg)]'
            }`}
          >
            {config.label}
          </button>
        )
      })}
      
      {/* Archive Button */}
      <Tooltip content={project.status === 'archived' ? '取消归档' : '归档项目'}>
        <button
          onClick={() => {
            const willArchive = project.status !== 'archived'
            onUpdateStatus(willArchive ? 'archived' : (isToken ? 'active' : 'research') as any)
            onArchive?.(willArchive)
          }}
          className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
            project.status === 'archived'
              ? 'bg-slate-500/20 text-slate-400'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          {project.status === 'archived' ? (
            <ArchiveRestore className="w-3.5 h-3.5" />
          ) : (
            <Archive className="w-3.5 h-3.5" />
          )}
        </button>
      </Tooltip>
    </div>
  )
}
