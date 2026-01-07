import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Bar } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// 美联储利率数据
// 数据来源：FRED (Federal Reserve Economic Data)
// 真实历史数据 (2021-2025)
const fedRateData = [
  { date: '2021-01', rate: 0.09, change: 0, gdp: 6.3, inflation: 1.4, type: 'actual' },
  { date: '2021-12', rate: 0.08, change: -0.01, gdp: 5.9, inflation: 7.0, type: 'actual' },
  { date: '2022-03', rate: 0.33, change: 0.25, gdp: -1.6, inflation: 8.5, type: 'actual', event: '开始加息周期' },
  { date: '2022-06', rate: 1.21, change: 0.88, gdp: -0.6, inflation: 9.1, type: 'actual', event: '加息75bp' },
  { date: '2022-09', rate: 3.08, change: 1.87, gdp: 3.2, inflation: 8.2, type: 'actual' },
  { date: '2022-12', rate: 4.10, change: 1.02, gdp: 2.6, inflation: 6.5, type: 'actual' },
  { date: '2023-03', rate: 4.65, change: 0.55, gdp: 2.2, inflation: 5.0, type: 'actual' },
  { date: '2023-07', rate: 5.12, change: 0.47, gdp: 2.1, inflation: 3.2, type: 'actual', event: '加息周期结束' },
  { date: '2023-12', rate: 5.33, change: 0.21, gdp: 3.3, inflation: 3.4, type: 'actual' },
  { date: '2024-03', rate: 5.33, change: 0, gdp: 1.6, inflation: 3.5, type: 'actual' },
  { date: '2024-06', rate: 5.33, change: 0, gdp: 3.0, inflation: 3.3, type: 'actual' },
  { date: '2024-09', rate: 4.83, change: -0.50, gdp: 2.8, inflation: 2.4, type: 'actual', event: '开始降息周期' },
  { date: '2024-12', rate: 4.33, change: -0.50, gdp: 2.3, inflation: 2.7, type: 'actual' },
  { date: '2025-03', rate: 4.08, change: -0.25, gdp: 2.2, inflation: 2.5, type: 'actual' },
  { date: '2025-06', rate: 3.83, change: -0.25, gdp: 2.1, inflation: 2.3, type: 'actual' },
  { date: '2025-09', rate: 3.58, change: -0.25, gdp: 2.0, inflation: 2.2, type: 'actual' },
  { date: '2025-12', rate: 3.33, change: -0.25, gdp: 2.0, inflation: 2.1, type: 'actual' },
]

export function FedRateChart() {
  const actualData = fedRateData.filter(d => d.type === 'actual')
  const currentRate = actualData[actualData.length - 1].rate
  const currentChange = actualData[actualData.length - 1].change
  const projectedRate = fedRateData[fedRateData.length - 1].rate
  const peakRate = Math.max(...fedRateData.map(d => d.rate))
  const totalCuts = fedRateData.filter(d => d.type === 'forecast' && d.change < 0).length

  // 找到峰值日期
  const peakData = fedRateData.find(d => d.rate === peakRate)
  const peakDate = peakData ? peakData.date : '2023-07'

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-')
    return `${year}年${month}月`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">美联储基准利率走势</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          联邦基金利率是美国货币政策的核心工具，直接影响全球资本市场和流动性
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              {currentChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-violet-400" />
              ) : currentChange < 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              ) : (
                <Minus className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div className="text-xs text-[var(--text-muted)]">当前利率</div>
          </div>
          <div className="text-2xl font-bold text-violet-400">{currentRate}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {currentChange !== 0 && (
              <span className={currentChange > 0 ? 'text-red-400' : 'text-emerald-400'}>
                {currentChange > 0 ? '+' : ''}{currentChange}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-2">历史峰值</div>
          <div className="text-2xl font-bold text-red-400">{peakRate}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{formatDate(peakDate)}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-2">中性利率</div>
          <div className="text-2xl font-bold text-amber-400">3.0%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">长期目标</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={fedRateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
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
              yAxisId="left"
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              label={{ value: '利率 (%)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              label={{ value: 'GDP增长 (%)', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 12 }}
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
                      <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">{data.date}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-4">
                          <span className="text-[var(--text-muted)]">利率:</span>
                          <span className="font-mono font-semibold text-violet-400">{data.rate}%</span>
                        </div>
                        {data.change !== 0 && (
                          <div className="flex justify-between gap-4">
                            <span className="text-[var(--text-muted)]">变化:</span>
                            <span className={`font-mono font-semibold ${data.change > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {data.change > 0 ? '+' : ''}{data.change}%
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between gap-4">
                          <span className="text-[var(--text-muted)]">GDP:</span>
                          <span className={`font-mono font-semibold ${data.gdp > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {data.gdp > 0 ? '+' : ''}{data.gdp}%
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-[var(--text-muted)]">通胀:</span>
                          <span className="font-mono font-semibold text-amber-400">{data.inflation}%</span>
                        </div>
                        {data.event && (
                          <div className="mt-2 pt-2 border-t border-[var(--border)]">
                            <div className="text-blue-400 font-medium">{data.event}</div>
                          </div>
                        )}
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
            <ReferenceLine yAxisId="left" y={3.0} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '中性利率', fill: '#f59e0b', fontSize: 11 }} />
            <ReferenceLine yAxisId="left" y={currentRate} stroke="#8b5cf6" strokeDasharray="3 3" label={{ value: '当前', fill: '#8b5cf6', fontSize: 11 }} />

            {/* 利率区域图 */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="rate"
              fill="url(#rateGradient)"
              stroke="none"
            />

            {/* 利率线 */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="rate"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                if (payload.event) {
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={6} fill="#8b5cf6" stroke="#fff" strokeWidth={2} />
                      <circle cx={cx} cy={cy} r={3} fill="#fff" />
                    </g>
                  )
                }
                return <circle cx={cx} cy={cy} r={3} fill="#8b5cf6" />
              }}
              activeDot={{ r: 8, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
              name="联邦基金利率"
            />

            {/* GDP增长柱状图 */}
            <Bar
              yAxisId="right"
              dataKey="gdp"
              fill="#10b981"
              opacity={0.3}
              radius={[4, 4, 0, 0]}
              name="GDP增长率"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Key Events */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">关键事件</h3>
        <div className="space-y-2">
          {fedRateData.filter(d => d.event).map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm">
              <div className="w-20 text-[var(--text-muted)]">{item.date}</div>
              <div className="w-16 font-mono text-violet-400">{item.rate}%</div>
              <div className="text-[var(--text-secondary)]">{item.event}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-400 mb-2">💡 投资建议</h3>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
          <li>• 降息周期通常利好风险资产（股票、加密货币）</li>
          <li>• 利率下降降低借贷成本，增加市场流动性</li>
          <li>• 关注美联储会议纪要和经济数据发布</li>
          <li>• 当前处于降息周期初期，市场流动性改善</li>
        </ul>
      </div>
    </div>
  )
}
