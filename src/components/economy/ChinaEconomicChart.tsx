import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Settings, AlertCircle, Banknote, Building2, DollarSign } from 'lucide-react'
import { type ChinaEconomicDataPoint } from '../../utils/chinaEconomicDataApi'

interface ChinaEconomicChartProps {
  data: ChinaEconomicDataPoint[]
  loading?: boolean
  error?: string | null
  type: 'dr007' | 'm2' | 'socialFinancing' | 'usdCny'
  title: string
  unit: string
  color: string
}

export function ChinaEconomicChart({ 
  data, 
  loading: isLoading = false, 
  error = null,
  type,
  title,
  unit,
  color
}: ChinaEconomicChartProps) {

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${
            color === 'violet' ? 'border-violet-500' :
            color === 'amber' ? 'border-amber-500' :
            color === 'emerald' ? 'border-emerald-500' :
            color === 'blue' ? 'border-blue-500' :
            'border-blue-500'
          }`}></div>
          <p className="text-[var(--text-muted)]">加载数据中...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">加载失败</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border)]"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // 无数据状态
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            color === 'violet' ? 'bg-violet-500/10' :
            color === 'amber' ? 'bg-amber-500/10' :
            color === 'emerald' ? 'bg-emerald-500/10' :
            color === 'blue' ? 'bg-blue-500/10' :
            'bg-blue-500/10'
          }`}>
            <AlertCircle className={`w-8 h-8 ${
              color === 'violet' ? 'text-violet-400' :
              color === 'amber' ? 'text-amber-400' :
              color === 'emerald' ? 'text-emerald-400' :
              color === 'blue' ? 'text-blue-400' :
              'text-blue-400'
            }`} />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">暂无数据</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            请配置经济数据源以查看{title}走势
          </p>
        </div>
      </div>
    )
  }

  const currentValue = data[data.length - 1]?.value || 0
  const previousValue = data[data.length - 2]?.value || currentValue
  const change = currentValue - previousValue
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100) : 0
  
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-')
    return `${year}年${month}月`
  }

  // 获取图标
  const getIcon = () => {
    switch (type) {
      case 'dr007':
        return TrendingUp
      case 'm2':
        return Banknote
      case 'socialFinancing':
        return Building2
      case 'usdCny':
        return DollarSign
      default:
        return TrendingUp
    }
  }

  const Icon = getIcon()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">中国{title}走势</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {type === 'dr007' && 'DR007是银行间存款类机构7天期质押式回购利率，反映市场流动性状况'}
          {type === 'm2' && 'M2货币供应量是广义货币供应量，反映市场流动性和通胀预期'}
          {type === 'socialFinancing' && '社会融资规模反映实体经济从金融体系获得的资金总量'}
          {type === 'usdCny' && '美元兑人民币汇率反映人民币国际化程度和资本流动'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              color === 'violet' ? 'bg-violet-500/20' :
              color === 'amber' ? 'bg-amber-500/20' :
              color === 'emerald' ? 'bg-emerald-500/20' :
              color === 'blue' ? 'bg-blue-500/20' :
              'bg-blue-500/20'
            }`}>
              {change > 0 ? (
                <TrendingUp className={`w-4 h-4 ${
                  color === 'violet' ? 'text-violet-400' :
                  color === 'amber' ? 'text-amber-400' :
                  color === 'emerald' ? 'text-emerald-400' :
                  color === 'blue' ? 'text-blue-400' :
                  'text-blue-400'
                }`} />
              ) : change < 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              ) : (
                <Minus className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div className="text-xs text-[var(--text-muted)]">当前值</div>
          </div>
          <div className={`text-2xl font-bold ${
            color === 'violet' ? 'text-violet-400' :
            color === 'amber' ? 'text-amber-400' :
            color === 'emerald' ? 'text-emerald-400' :
            color === 'blue' ? 'text-blue-400' :
            'text-blue-400'
          }`}>
            {currentValue.toFixed(type === 'usdCny' ? 4 : 2)}{unit}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {change !== 0 && (
              <span className={change > 0 ? 'text-red-400' : 'text-emerald-400'}>
                {change > 0 ? '+' : ''}{change.toFixed(2)}{unit}
              </span>
            )}
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-2">最高值</div>
          <div className="text-2xl font-bold text-red-400">
            {maxValue.toFixed(type === 'usdCny' ? 4 : 2)}{unit}
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-2">最低值</div>
          <div className="text-2xl font-bold text-emerald-400">
            {minValue.toFixed(type === 'usdCny' ? 4 : 2)}{unit}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id={`${type}Gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={
                  color === 'violet' ? '#8b5cf6' :
                  color === 'amber' ? '#f59e0b' :
                  color === 'emerald' ? '#10b981' :
                  color === 'blue' ? '#3b82f6' :
                  '#3b82f6'
                } stopOpacity={0.3} />
                <stop offset="95%" stopColor={
                  color === 'violet' ? '#8b5cf6' :
                  color === 'amber' ? '#f59e0b' :
                  color === 'emerald' ? '#10b981' :
                  color === 'blue' ? '#3b82f6' :
                  '#3b82f6'
                } stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              label={{ 
                value: `${title} (${unit})`, 
                angle: -90, 
                position: 'insideLeft', 
                fill: 'var(--text-muted)', 
                fontSize: 12 
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-3 shadow-lg">
                      <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">{formatDate(data.date)}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-4">
                          <span className="text-[var(--text-muted)]">{title}:</span>
                          <span className={`font-mono font-semibold ${
                            color === 'violet' ? 'text-violet-400' :
                            color === 'amber' ? 'text-amber-400' :
                            color === 'emerald' ? 'text-emerald-400' :
                            color === 'blue' ? 'text-blue-400' :
                            'text-blue-400'
                          }`}>
                            {data.value.toFixed(type === 'usdCny' ? 4 : 2)}{unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <ReferenceLine y={currentValue} stroke={
              color === 'violet' ? '#8b5cf6' :
              color === 'amber' ? '#f59e0b' :
              color === 'emerald' ? '#10b981' :
              color === 'blue' ? '#3b82f6' :
              '#3b82f6'
            } strokeDasharray="3 3" label={{ 
              value: '当前', 
              fill: color === 'violet' ? '#8b5cf6' :
                    color === 'amber' ? '#f59e0b' :
                    color === 'emerald' ? '#10b981' :
                    color === 'blue' ? '#3b82f6' :
                    '#3b82f6', 
              fontSize: 11 
            }} />

            {/* 区域图 */}
            <Area
              type="monotone"
              dataKey="value"
              fill={`url(#${type}Gradient)`}
              stroke="none"
            />

            {/* 线图 */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={
                color === 'violet' ? '#8b5cf6' :
                color === 'amber' ? '#f59e0b' :
                color === 'emerald' ? '#10b981' :
                color === 'blue' ? '#3b82f6' :
                '#3b82f6'
              }
              strokeWidth={3}
              dot={{ r: 3, fill: color === 'violet' ? '#8b5cf6' :
                                 color === 'amber' ? '#f59e0b' :
                                 color === 'emerald' ? '#10b981' :
                                 color === 'blue' ? '#3b82f6' :
                                 '#3b82f6' }}
              activeDot={{ 
                r: 8, 
                fill: color === 'violet' ? '#8b5cf6' :
                      color === 'amber' ? '#f59e0b' :
                      color === 'emerald' ? '#10b981' :
                      color === 'blue' ? '#3b82f6' :
                      '#3b82f6', 
                stroke: '#fff', 
                strokeWidth: 2 
              }}
              name={title}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Analysis */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">💡 数据说明</h3>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
          <li>• 数据来源：中国人民银行、外汇交易中心等官方渠道</li>
          <li>• 更新频率：每日自动更新</li>
          {type === 'dr007' && <li>• DR007是银行间市场基准利率，影响整体市场流动性</li>}
          {type === 'm2' && <li>• M2增速反映货币政策松紧程度和通胀预期</li>}
          {type === 'socialFinancing' && <li>• 社融规模反映实体经济融资需求和金融支持力度</li>}
          {type === 'usdCny' && <li>• 汇率变化影响进出口贸易和资本流动</li>}
        </ul>
      </div>
    </div>
  )
}