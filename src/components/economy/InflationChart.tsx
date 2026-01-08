import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Settings, AlertCircle } from 'lucide-react'
import { type EconomicDataPoint } from '../../utils/economicDataApi'

interface InflationChartProps {
  data: EconomicDataPoint[]
  loading?: boolean
  error?: string | null
}

export function InflationChart({ data: inflationData, loading: isLoading = false, error = null }: InflationChartProps) {

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
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
  if (!inflationData || inflationData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">暂无数据</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            请配置经济数据源以查看通胀率走势
          </p>
          <button
            onClick={() => {
              // 触发 Gist 设置面板打开
              const gistButton = document.querySelector('[data-gist-settings]') as HTMLButtonElement
              if (gistButton) {
                gistButton.click()
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            前往配置
          </button>
        </div>
      </div>
    )
  }

  const currentRate = inflationData[inflationData.length - 1].value
  const currentDate = inflationData[inflationData.length - 1].date
  const targetRate = 2.0
  const peakRate = Math.max(...inflationData.map(d => d.value))

  // 找到峰值日期
  const peakData = inflationData.find(d => d.value === peakRate)
  const peakDate = peakData ? peakData.date : ''

  // 获取原始 CPI 指数（如果数据是从 CPI 转换来的）
  // 通过检查第一个值判断原始数据类型
  const hasCPIIndex = inflationData[0]?.value > 100
  const currentCPI = hasCPIIndex ? inflationData[inflationData.length - 1].value : null

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-')
    return `${year}年${month}月`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">美国通胀率走势（YoY）</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          基于 CPI 指数计算的同比通胀率，美联储目标为 2%
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentCPI && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="text-xs text-[var(--text-muted)] mb-1">CPI 指数</div>
            <div className="text-2xl font-bold text-blue-400">{currentCPI.toFixed(2)}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(currentDate)}</div>
          </div>
        )}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">当前通胀率</div>
          <div className="text-2xl font-bold text-amber-400">{currentRate.toFixed(1)}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(currentDate)}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">历史峰值</div>
          <div className="text-2xl font-bold text-red-400">{peakRate.toFixed(1)}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(peakDate)}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">美联储目标</div>
          <div className="text-2xl font-bold text-emerald-400">{targetRate.toFixed(1)}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">长期目标</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={inflationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              label={{ value: '通胀率 (%)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              formatter={(value: number | undefined) => value !== undefined ? [`${value}%`, '通胀率'] : ['-', '通胀率']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <ReferenceLine y={targetRate} stroke="#10b981" strokeDasharray="3 3" label="目标2%" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">数据说明</h3>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <p>• <strong>CPI 指数</strong>：消费者物价指数绝对值（基准年 1982-1984=100）</p>
            <p>• <strong>通胀率</strong>：CPI 同比变化率（Year-over-Year）</p>
            <p>• 数据来源：美国劳工统计局 (BLS)</p>
            <p>• 更新频率：每月发布，通常有1-2个月延迟</p>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-emerald-400 mb-2">💡 市场影响</h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            <li>• 通胀回落为降息创造条件</li>
            <li>• 接近2%目标，货币政策转向宽松</li>
            <li>• 购买力恢复，消费需求增加</li>
            <li>• 利好风险资产和成长型投资</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
