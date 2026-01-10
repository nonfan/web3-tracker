import { useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import type { Task } from '../../types'

interface CardTasksProps {
  projectId: string
  tasks: Task[]
  onAddTask: (projectId: string, title: string) => void
  onToggleTask: (projectId: string, taskId: string) => void
  onDeleteTask: (projectId: string, taskId: string) => void
}

export function CardTasks({ projectId, tasks, onAddTask, onToggleTask, onDeleteTask }: CardTasksProps) {
  const [newTask, setNewTask] = useState('')
  const [showTasks, setShowTasks] = useState(false)

  const completedTasks = tasks.filter((t) => t.completed).length
  const totalTasks = tasks.length

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      onAddTask(projectId, newTask.trim())
      setNewTask('')
    }
  }

  return (
    <>
      {/* Progress Bar */}
      <div
        className={`mb-3 ${totalTasks > 0 ? 'cursor-pointer' : ''}`}
        onClick={() => totalTasks > 0 && setShowTasks(!showTasks)}
      >
        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
          <span>任务进度</span>
          <span className="text-[var(--text-secondary)]">
            {totalTasks > 0 ? `${completedTasks}/${totalTasks}` : '0/0'}
          </span>
        </div>
        <div className="h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
          {totalTasks > 0 ? (
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
            />
          ) : (
            <div className="h-full w-full border border-dashed border-[var(--text-muted)]/30 rounded-full" />
          )}
        </div>
      </div>

      {/* Task List */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showTasks && tasks.length > 0 ? 'max-h-40 opacity-100 mb-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 group/task">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleTask(projectId, task.id)
                }}
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
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteTask(projectId, task.id)
                }}
                className="opacity-0 group-hover/task:opacity-100 p-1 hover:bg-red-500/10 rounded text-[var(--text-muted)] hover:text-red-400 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onClick={(e) => e.stopPropagation()}
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
    </>
  )
}
