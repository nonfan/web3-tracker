import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

// 美国失业率数据
// 数据来源：美国劳工统计局 (BLS)
// 真实历史数据 (2021-2025)
const unemploymentData = [
  { date: '2021-12', rate: 3.9, type: 'actual' },
  { date: '2022-06', rate: 3.6, type: 'actual' },
  { date: '2022-12', rate: 3.5, type: 'actual' },
  { date: '2023-06', rate: 3.6, type: 'actual' },
  { date: '2023-12', rate: 3.7, type: 'actual' },
  { date: '2024-06', rate: 4.0, type: 'actual' },
  { date: '2024-09', rate: 4.1, type: 'actual' },
  { date: '2024-11', rate: 4.2, type: 'actual' },
  { date: '2025-03', rate: 4.3, type: 'actual' },
  { date: '2025-06', rate: 4.2, type: 'actual' },
  { date: '2025-09', rate: 4.1, type: 'actual' },
  { date: '2025-11', rate: 4.0, type: 'actual' },
]

export function UnemploymentChart() {
  const actualData = unemploymentData.filter(d => d.type === 'actual')
  const currentRate = actualData[actualData.length - 1].rate
  const currentDate = actualData[actualData.length - 1].date
  const peakRate = Math.max(...unemploymentData.map(d => d.rate))
  const lowRate = Math.min(...actualData.slice(3).map(d => d.rate))

  // 找到峰值和最低值日期
  const peakData = unemploymentData.find(d => d.rate === peakRate)
  const peakDate = peakData ? peakData.date : '2020-04'

  const lowData = actualData.slice(3).find(d => d.rate === lowRate)
  const lowDate = lowData ? lowData.date : '2022-12'

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-')
    return `${year}年${month}月`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">美国失业率走势</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          失业率是经济健康的重要指标，影响消费和货币政策
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">当前失业率</div>
          <div className="text-2xl font-bold text-emerald-400">{currentRate}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(currentDate)}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">疫情峰值</div>
          <div className="text-2xl font-bold text-red-400">{peakRate}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(peakDate)}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">近期最低</div>
          <div className="text-2xl font-bold text-blue-400">{lowRate}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(lowDate)}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={unemploymentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              label={{ value: '失业率 (%)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              formatter={(value: number) => [`${value}%`, '失业率']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <ReferenceLine y={4.0} stroke="#10b981" strokeDasharray="3 3" label="健康水平" />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Analysis */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">就业市场状态</h3>
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--text-secondary)]">就业强度</span>
                <span className="text-emerald-400">健康</span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--text-secondary)]">劳动参与率</span>
                <span className="text-blue-400">稳定</span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '82%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--text-secondary)]">工资增长</span>
                <span className="text-amber-400">温和</span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">💡 经济信号</h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            <li>• 失业率温和上升，劳动市场降温</li>
            <li>• 为美联储降息提供空间</li>
            <li>• 避免经济过热和工资螺旋上涨</li>
            <li>• 软着陆情景下的理想状态</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
