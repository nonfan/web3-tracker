import { useStore } from '../store/useStore'
import type { ProjectStatus } from '../types'
import { Tooltip } from './Tooltip'
import { Trash2, CheckCircle, XCircle, Rocket, Skull } from 'lucide-react'

interface Props {
  selectedIds: string[]
  onClear: () => void
}

export function BatchActions({ selectedIds, onClear }: Props) {
  const { deleteProjects, updateProjects } = useStore()

  const handleDelete = () => {
    if (confirm(`确定删除选中的 ${selectedIds.length} 个项目？`)) {
      deleteProjects(selectedIds)
      onClear()
    }
  }

  const handleStatusChange = (status: ProjectStatus) => {
    updateProjects(selectedIds, { status })
    onClear()
  }

  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--card-bg)] border border-[var(--border-hover)] rounded-2xl p-3 shadow-2xl flex items-center gap-3 z-40">
      <span className="text-sm text-[var(--text-secondary)] px-2">
        已选 <span className="text-[var(--text-primary)] font-medium">{selectedIds.length}</span> 项
      </span>
      
      <div className="h-6 w-px bg-[var(--border)]" />
      
      <div className="flex gap-1">
        <Tooltip content="研究中" position="top">
          <button
            onClick={() => handleStatusChange('research')}
            className="p-2 hover:bg-amber-500/20 rounded-lg text-[var(--text-secondary)] hover:text-amber-400 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content="交互中" position="top">
          <button
            onClick={() => handleStatusChange('active')}
            className="p-2 hover:bg-emerald-500/20 rounded-lg text-[var(--text-secondary)] hover:text-emerald-400 transition-colors"
          >
            <Rocket className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content="已完成" position="top">
          <button
            onClick={() => handleStatusChange('completed')}
            className="p-2 hover:bg-blue-500/20 rounded-lg text-[var(--text-secondary)] hover:text-blue-400 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content="已凉" position="top">
          <button
            onClick={() => handleStatusChange('dead')}
            className="p-2 hover:bg-gray-500/20 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-muted)] transition-colors"
          >
            <Skull className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="h-6 w-px bg-[var(--border)]" />

      <Tooltip content="删除选中" position="top">
        <button
          onClick={handleDelete}
          className="p-2 hover:bg-red-500/20 rounded-lg text-[var(--text-secondary)] hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </Tooltip>

      <button
        onClick={onClear}
        className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        取消
      </button>
    </div>
  )
}
