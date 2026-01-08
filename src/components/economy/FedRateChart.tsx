import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Settings, AlertCircle } from 'lucide-react'
import { type FedRateData } from '../../utils/economicDataApi'

interface FedRateChartProps {
  data: FedRateData[]
  loading?: boolean
  error?: string | null
  countryName?: string
  countryCode?: string
}

export function FedRateChart({ 
  data: fedRateData, 
  loading: isLoading = false, 
  error = null,
  countryName = '美国',
  countryCode = 'US'
}: FedRateChartProps) {

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
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
  if (!fedRateData || fedRateData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">暂无数据</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            请配置经济数据源以查看利率走势
          </p>
          <button
            onClick={() => {
              // 触发 Gist 设置面板打开
              const gistButton = document.querySelector('[data-gist-settings]') as HTMLButtonElement
              if (gistButton) {
                gistButton.click()
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            前往配置
          </button>
        </div>
      </div>
    )
  }

  const actualData = fedRateData.filter(d => d.type === 'actual')
  const currentRate = actualData[actualData.length - 1].rate
  const currentChange = actualData[actualData.length - 1].change
  const peakRate = Math.max(...fedRateData.map(d => d.rate))

  // 找到峰值日期
  const peakData = fedRateData.find(d => d.rate === peakRate)
  const peakDate = peakData ? peakData.date : ''

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const [year, month] = dateStr.split('-')
    return `${year}年${month}月`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{countryName}基准利率走势</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {countryCode === 'US' ? '联邦基金利率是美国货币政策的核心工具，直接影响全球资本市场和流动性' :
           countryCode === 'CN' ? '央行基准利率是中国货币政策的重要工具，影响市场流动性和经济增长' :
           countryCode === 'EU' ? '欧央行主要再融资利率是欧元区货币政策的核心工具' :
           countryCode === 'JP' ? '日银政策利率是日本货币政策的主要工具' :
           '基准利率是该国货币政策的重要工具'}
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
        <h3 className="text-sm font-semibold text-amber-400 mb-2">💡 数据说明</h3>
        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
          <li>• 数据来源：FRED (Federal Reserve Economic Data)</li>
          <li>• 更新频率：每日自动更新</li>
          <li>• 利率变化直接影响市场流动性和资产价格</li>
          <li>• 降息周期通常利好风险资产（股票、加密货币）</li>
        </ul>
      </div>
    </div>
  )
}
