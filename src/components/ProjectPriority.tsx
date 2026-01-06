import type { Priority } from '../types'
import { Flag } from 'lucide-react'

interface PriorityConfig {
  bg: string
  text: string
  label: string
}

interface ProjectPriorityProps {
  priority: Priority
}

export function ProjectPriority({ priority }: ProjectPriorityProps) {
  const priorityConfig: Record<Priority, PriorityConfig> = {
    high: { bg: 'bg-red-500/20', text: 'text-red-400', label: '高' },
    medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '中' },
    low: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '低' },
  }

  const config = priorityConfig[priority] || priorityConfig.medium

  return (
    <span className={`px-2 py-1 ${config.bg} ${config.text} rounded-lg text-xs font-medium flex items-center gap-1`}>
      <Flag className="w-3 h-3" />
      {config.label}
    </span>
  )
}
