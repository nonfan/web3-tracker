import { Clock } from 'lucide-react'

interface DeadlineInfo {
  text: string
  urgent: boolean
}

interface ProjectDeadlineProps {
  timestamp: number
}

function formatDeadline(timestamp: number): DeadlineInfo {
  const now = Date.now()
  const diff = timestamp - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (diff < 0) return { text: '已过期', urgent: true }
  if (days === 0) return { text: '今天', urgent: true }
  if (days === 1) return { text: '明天', urgent: true }
  if (days <= 7) return { text: `${days}天后`, urgent: true }
  if (days <= 30) return { text: `${days}天后`, urgent: false }
  return {
    text: new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    urgent: false
  }
}

export function ProjectDeadline({ timestamp }: ProjectDeadlineProps) {
  const deadline = formatDeadline(timestamp)

  return (
    <div className={`flex items-center gap-1.5 ${deadline.urgent ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>截止: {deadline.text}</span>
    </div>
  )
}
