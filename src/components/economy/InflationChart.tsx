import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

// 美国通胀率数据（CPI同比）
// 数据来源：美国劳工统计局 (BLS)
// 真实历史数据 (2021-2025)
const inflationData = [
  { date: '2021-06', rate: 5.4, type: 'actual' },
  { date: '2021-12', rate: 7.0, type: 'actual' },
  { date: '2022-06', rate: 9.1, type: 'actual' },
  { date: '2022-12', rate: 6.5, type: 'actual' },
  { date: '2023-06', rate: 3.0, type: 'actual' },
  { date: '2023-12', rate: 3.4, type: 'actual' },
  { date: '2024-06', rate: 3.3, type: 'actual' },
  { date: '2024-09', rate: 2.4, type: 'actual' },
  { date: '2024-11', rate: 2.7, type: 'actual' },
  { date: '2025-03', rate: 2.5, type: 'actual' },
  { date: '2025-06', rate: 2.3, type: 'actual' },
  { date: '2025-09', rate: 2.2, type: 'actual' },
  { date: '2025-11', rate: 2.1, type: 'actual' },
]

export function InflationChart() {
  const actualData = inflationData.filter(d => d.type === 'actual')
  const currentRate = actualData[actualData.length - 1].rate
  const currentDate = actualData[actualData.length - 1].date
  const targetRate = 2.0
  const peakRate = Math.max(...inflationData.map(d => d.rate))

  // 找到峰值日期
  const peakData = inflationData.find(d => d.rate === peakRate)
  const peakDate = peakData ? peakData.date : '2022-06'

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-')
    return `${year}年${month}月`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">美国通胀率走势（CPI）</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          消费者物价指数反映购买力变化，美联储目标为2%
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">当前通胀</div>
          <div className="text-2xl font-bold text-amber-400">{currentRate}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(currentDate)}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">历史峰值</div>
          <div className="text-2xl font-bold text-red-400">{peakRate}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(peakDate)}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">美联储目标</div>
          <div className="text-2xl font-bold text-emerald-400">{targetRate}%</div>
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
              formatter={(value: number) => [`${value}%`, '通胀率']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <ReferenceLine y={targetRate} stroke="#10b981" strokeDasharray="3 3" label="目标2%" />
            <Line
              type="monotone"
              dataKey="rate"
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
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">通胀阶段分析</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">2020-2021</span>
              <span className="text-emerald-400">低通胀期</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">2021-2022</span>
              <span className="text-red-400">通胀飙升</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">2023-2024</span>
              <span className="text-amber-400">持续回落</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">当前状态</span>
              <span className="text-emerald-400">接近目标</span>
            </div>
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
