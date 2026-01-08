import { TrendingUp, Activity, Briefcase, Bitcoin, DollarSign } from 'lucide-react'

interface DataCardProps {
  title: string
  value?: number | null
  date?: string | null
  unit?: string
  loading?: boolean
  error?: string | null
  color?: 'violet' | 'amber' | 'emerald' | 'blue' | 'orange'
  formatter?: (value: number) => string
  icon?: 'fed-rate' | 'inflation' | 'unemployment' | 'crypto' | 'exchange-rate'
  subtitle?: string
}

const iconMap = {
  'fed-rate': TrendingUp,
  'inflation': Activity,
  'unemployment': Briefcase,
  'crypto': Bitcoin,
  'exchange-rate': DollarSign
}

// 格式化日期显示
function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return `${year}年${monthNames[parseInt(month) - 1]}`
}

export function DataCard({ 
  title, 
  value, 
  date, 
  unit = '%', 
  loading = false, 
  error = null, 
  color = 'blue',
  formatter,
  icon,
  subtitle
}: DataCardProps) {
  const Icon = icon ? iconMap[icon] : null
  
  const defaultFormatter = (v: number) => {
    if (unit === 'T') {
      return `$${v.toFixed(2)}${unit}`
    }
    return `${v.toFixed(unit === '%' ? 2 : 1)}${unit}`
  }
  
  const formatValue = formatter || defaultFormatter
  
  if (loading) {
    return (
      <div className={`${
        color === 'violet' ? 'bg-violet-500/10 border-violet-500/20' :
        color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
        color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
        color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' :
        color === 'orange' ? 'bg-orange-500/10 border-orange-500/20' :
        'bg-blue-500/10 border-blue-500/20'
      } rounded-xl p-4 animate-pulse`}>
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="w-4 h-4 text-[var(--border)]" />}
          <div className="h-4 bg-[var(--border)] rounded w-20"></div>
        </div>
        <div className="h-8 bg-[var(--border)] rounded w-24 mb-1"></div>
        <div className="h-3 bg-[var(--border)] rounded w-16"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="w-4 h-4 text-red-400" />}
          <div className="text-xs text-red-400 font-medium">{title}</div>
        </div>
        <div className="text-sm text-red-400">加载失败</div>
        <div className="text-xs text-red-300 mt-1">{error}</div>
      </div>
    )
  }
  
  return (
    <div className={`${
      color === 'violet' ? 'bg-violet-500/10 border-violet-500/20' :
      color === 'amber' ? 'bg-amber-500/10 border-amber-500/20' :
      color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
      color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' :
      color === 'orange' ? 'bg-orange-500/10 border-orange-500/20' :
      'bg-blue-500/10 border-blue-500/20'
    } rounded-xl p-4 transition-all hover:scale-[1.02]`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={`w-4 h-4 ${
          color === 'violet' ? 'text-violet-400' :
          color === 'amber' ? 'text-amber-400' :
          color === 'emerald' ? 'text-emerald-400' :
          color === 'blue' ? 'text-blue-400' :
          color === 'orange' ? 'text-orange-400' :
          'text-blue-400'
        }`} />}
        <div className="text-xs text-[var(--text-muted)] font-medium">{title}</div>
      </div>
      <div className={`text-3xl font-bold ${
        color === 'violet' ? 'text-violet-400' :
        color === 'amber' ? 'text-amber-400' :
        color === 'emerald' ? 'text-emerald-400' :
        color === 'blue' ? 'text-blue-400' :
        color === 'orange' ? 'text-orange-400' :
        'text-blue-400'
      }`}>
        {value !== null && value !== undefined ? formatValue(value) : '--'}
      </div>
      <div className="text-xs text-[var(--text-muted)] mt-1">
        {subtitle || (date ? formatDate(date) : '暂无数据')}
      </div>
    </div>
  )
}