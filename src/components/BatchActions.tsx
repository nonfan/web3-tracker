import { useStore } from '../store/useStore'
import type { ProjectStatus } from '../types'
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a24] border border-white/10 rounded-2xl p-3 shadow-2xl flex items-center gap-3 z-40">
      <span className="text-sm text-gray-400 px-2">
        已选 <span className="text-white font-medium">{selectedIds.length}</span> 项
      </span>
      
      <div className="h-6 w-px bg-white/10" />
      
      <div className="flex gap-1">
        <button
          onClick={() => handleStatusChange('active')}
          className="p-2 hover:bg-emerald-500/20 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors"
          title="标记为进行中"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleStatusChange('completed')}
          className="p-2 hover:bg-blue-500/20 rounded-lg text-gray-400 hover:text-blue-400 transition-colors"
          title="标记为已完成"
        >
          <XCircle className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleStatusChange('launched')}
          className="p-2 hover:bg-violet-500/20 rounded-lg text-gray-400 hover:text-violet-400 transition-colors"
          title="标记为已发币"
        >
          <Rocket className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleStatusChange('dead')}
          className="p-2 hover:bg-gray-500/20 rounded-lg text-gray-400 hover:text-gray-300 transition-colors"
          title="标记为已凉"
        >
          <Skull className="w-4 h-4" />
        </button>
      </div>

      <div className="h-6 w-px bg-white/10" />

      <button
        onClick={handleDelete}
        className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
        title="删除选中"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <button
        onClick={onClear}
        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        取消
      </button>
    </div>
  )
}
