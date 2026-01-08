import { TrendingUp, Activity, Briefcase, Bitcoin, DollarSign, AlertCircle } from 'lucide-react'

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

const colorConfig = {
  violet: {
    bg: 'from-violet-500/10 to-purple-500/10',
    border: 'border-violet-500/20',
    icon: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-500/20',
    value: 'text-violet-700 dark:text-violet-300',
    shadow: 'shadow-violet-500/10'
  },
  amber: {
    bg: 'from-amber-500/10 to-orange-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/20',
    value: 'text-amber-700 dark:text-amber-300',
    shadow: 'shadow-amber-500/10'
  },
  emerald: {
    bg: 'from-emerald-500/10 to-teal-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/20',
    value: 'text-emerald-700 dark:text-emerald-300',
    shadow: 'shadow-emerald-500/10'
  },
  blue: {
    bg: 'from-blue-500/10 to-indigo-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/20',
    value: 'text-blue-700 dark:text-blue-300',
    shadow: 'shadow-blue-500/10'
  },
  orange: {
    bg: 'from-orange-500/10 to-red-500/10',
    border: 'border-orange-500/20',
    icon: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-500/20',
    value: 'text-orange-700 dark:text-orange-300',
    shadow: 'shadow-orange-500/10'
  }
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
  const colors = colorConfig[color]
  
  const defaultFormatter = (v: number) => {
    if (unit === 'T') {
      return `${v.toFixed(2)}${unit}`
    }
    return `${v.toFixed(unit === '%' ? 2 : 1)}${unit}`
  }
  
  const formatValue = formatter || defaultFormatter
  
  if (loading) {
    return (
      <div className={`bg-gradient-to-br ${colors.bg} ${colors.border} border rounded-2xl p-6 animate-pulse shadow-lg ${colors.shadow}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
            {Icon && <Icon className={`w-5 h-5 ${colors.icon}`} />}
          </div>
          <div className="flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-24 mb-1"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-16"></div>
          </div>
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-600 rounded w-32 mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-20"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl p-6 shadow-lg shadow-red-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-red-700 dark:text-red-300">{title}</div>
            <div className="text-sm text-red-600 dark:text-red-400">数据加载失败</div>
          </div>
        </div>
        <div className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">--</div>
        <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
      </div>
    )
  }
  
  return (
    <div className={`bg-gradient-to-br ${colors.bg} ${colors.border} border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${colors.shadow} backdrop-blur-sm`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 ${colors.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
          {Icon && <Icon className={`w-5 h-5 ${colors.icon}`} />}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-slate-700 dark:text-slate-300">{title}</div>
          <div className="text-sm text-slate-500 dark:text-slate-500">
            {subtitle || (date ? formatDate(date) : '暂无数据')}
          </div>
        </div>
      </div>
      
      <div className={`text-3xl font-bold ${colors.value} mb-2`}>
        {value !== null && value !== undefined ? formatValue(value) : '--'}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-500">
          最新数据
        </div>
        <div className={`w-2 h-2 ${colors.iconBg} rounded-full`}></div>
      </div>
    </div>
  )
}