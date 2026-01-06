import type { ProjectStatus as StatusType } from '../types'

interface StatusConfig {
  bg: string
  text: string
  dot: string
  label: string
}

interface ProjectStatusProps {
  status: StatusType
  isToken?: boolean
}

export function ProjectStatus({ status, isToken = false }: ProjectStatusProps) {
  const statusConfig: Record<StatusType, StatusConfig> = {
    active: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      label: isToken ? '研究中' : '进行中'
    },
    completed: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      dot: 'bg-blue-400',
      label: isToken ? '已卖币' : '已完成'
    },
    launched: {
      bg: 'bg-violet-500/20',
      text: 'text-violet-400',
      dot: 'bg-violet-400',
      label: isToken ? '已买币' : '已发币'
    },
    dead: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      dot: 'bg-gray-400',
      label: isToken ? '已归零' : '已凉'
    },
    archived: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      dot: 'bg-slate-400',
      label: '已归档'
    },
  }

  const config = statusConfig[status] || statusConfig.active

  return (
    <span className={`px-2 py-1 ${config.bg} ${config.text} rounded-lg text-xs font-medium flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
