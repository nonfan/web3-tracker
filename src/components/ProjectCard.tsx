import { useState } from 'react'
import type { Project } from '../types'
import { useStore } from '../store/useStore'
import { useTheme } from '../store/useTheme'
import { Pencil, Trash2, Globe, MessageCircle, Plus, X, Check, Clock, Flag } from 'lucide-react'

const statusConfig = {
  active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', label: '进行中' },
  completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400', label: '已完成' },
  launched: { bg: 'bg-violet-500/20', text: 'text-violet-400', dot: 'bg-violet-400', label: '已发币' },
  dead: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400', label: '已凉' },
}

const priorityConfig = {
  high: { bg: 'bg-red-500/20', text: 'text-red-400', label: '高' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '中' },
  low: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '低' },
}

interface Props {
  project: Project
  onEdit: () => void
  selected?: boolean
  onSelect?: (id: string) => void
  selectionMode?: boolean
}

function formatDeadline(timestamp: number): { text: string; urgent: boolean } {
  const now = Date.now()
  const diff = timestamp - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  
  if (diff < 0) return { text: '已过期', urgent: true }
  if (days === 0) return { text: '今天', urgent: true }
  if (days === 1) return { text: '明天', urgent: true }
  if (days <= 7) return { text: `${days}天后`, urgent: true }
  if (days <= 30) return { text: `${days}天后`, urgent: false }
  return { text: new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }), urgent: false }
}

export function ProjectCard({ project, onEdit, selected, onSelect, selectionMode }: Props) {
  const [newTask, setNewTask] = useState('')
  const { addTask, toggleTask, deleteTask, deleteProject, updateProject } = useStore()
  const { theme } = useTheme()

  const completedTasks = project.tasks.filter((t) => t.completed).length
  const totalTasks = project.tasks.length
  const status = statusConfig[project.status]
  const priority = priorityConfig[project.priority || 'medium']
  const deadline = project.deadline ? formatDeadline(project.deadline) : null

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      addTask(project.id, newTask.trim())
      setNewTask('')
    }
  }

  return (
    <div 
      className={`bg-[var(--card-bg)] rounded-2xl p-5 border transition-all group ${
        selected ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-[var(--border)] hover:border-[var(--border-hover)]'
      }`}
      onClick={() => selectionMode && onSelect?.(project.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
          {project.description && (
            <p className="text-sm text-[var(--text-secondary)] line-clamp-1">{project.description}</p>
          )}
        </div>
        {!selectionMode && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('确定删除这个项目？')) deleteProject(project.id)
              }}
              className="p-2 hover:bg-red-500/10 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Deadline */}
      {deadline && (
        <div className={`flex items-center gap-1.5 mb-3 text-xs ${deadline.urgent ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>截止: {deadline.text}</span>
        </div>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-md text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="flex gap-2 mb-4">
        {project.website && (
          <a
            href={project.website}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            官网
          </a>
        )}
        {project.twitter && (
          <a
            href={project.twitter}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </a>
        )}
        {project.discord && (
          <a
            href={project.discord}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Discord
          </a>
        )}
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
            <span>任务进度</span>
            <span className="text-[var(--text-secondary)]">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tasks */}
      {project.tasks.length > 0 && (
        <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto scrollbar-thin">
          {project.tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 group/task">
              <button
                onClick={() => toggleTask(project.id, task.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  task.completed
                    ? 'bg-violet-500 border-violet-500'
                    : 'border-[var(--text-muted)] hover:border-violet-500'
                }`}
              >
                {task.completed && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className={`flex-1 text-sm ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
                {task.title}
              </span>
              <button
                onClick={() => deleteTask(project.id, task.id)}
                className="opacity-0 group-hover/task:opacity-100 p-1 hover:bg-red-500/10 rounded text-[var(--text-muted)] hover:text-red-400 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Task */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="添加任务..."
          className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition-colors text-white"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Status Quick Change */}
      <div className="flex gap-1 mt-4 pt-4 border-t border-[var(--border)]">
        {(['active', 'completed', 'launched', 'dead'] as const).map((s) => {
          const config = statusConfig[s]
          const isActive = project.status === s
          return (
            <button
              key={s}
              onClick={() => updateProject(project.id, { status: s })}
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
      </div>
    </div>
  )
}
