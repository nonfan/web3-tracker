import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getCryptoMarketData } from '../../utils/economicDataApi'

export function CryptoMarketChart() {
  const [cryptoData, setCryptoData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await getCryptoMarketData()
        setCryptoData(data)
      } catch (error) {
        console.error('Failed to load crypto data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  if (isLoading || cryptoData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-[var(--text-muted)]">加载中...</div>
        </div>
      </div>
    )
  }

  const currentData = cryptoData[cryptoData.length - 1]
  const peakData = cryptoData.reduce((max, d) => d.total > max.total ? d : max)
  const btcDominance = ((currentData.btc / currentData.total) * 100).toFixed(1)

  // 计算年初至今涨幅
  const yearStart = cryptoData.find(d => d.date.startsWith('2026-01')) ||
    cryptoData.find(d => d.date.startsWith('2025-12')) ||
    cryptoData[cryptoData.length - 2]
  const ytdChange = yearStart ? (((currentData.total - yearStart.total) / yearStart.total) * 100).toFixed(0) : '0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">加密货币市场总览</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          比特币和以太坊市值走势，反映加密市场整体健康度
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">总市值</div>
          <div className="text-2xl font-bold text-blue-400">${currentData.total}T</div>
          <div className="text-xs text-emerald-400 mt-1">+{ytdChange}% YTD</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">BTC市值</div>
          <div className="text-2xl font-bold text-orange-400">${currentData.btc}T</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">占比 {btcDominance}%</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">ETH市值</div>
          <div className="text-2xl font-bold text-violet-400">${currentData.eth}T</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">占比 {((currentData.eth / currentData.total) * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">历史峰值</div>
          <div className="text-2xl font-bold text-emerald-400">${peakData.total}T</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{peakData.date}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cryptoData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorBtc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            />
            <YAxis
              stroke="var(--text-muted)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              label={{ value: '市值 (万亿美元)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              formatter={(value: number) => [`${value}T`, '']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
              name="总市值"
            />
            <Area
              type="monotone"
              dataKey="btc"
              stroke="#f97316"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBtc)"
              name="BTC"
            />
            <Area
              type="monotone"
              dataKey="eth"
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEth)"
              name="ETH"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Market Cycles */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">市场周期</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">2020-2021</span>
              <span className="text-emerald-400">牛市周期</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">2022</span>
              <span className="text-red-400">熊市探底</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">2023</span>
              <span className="text-amber-400">筑底回升</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">2024-2026</span>
              <span className="text-emerald-400">新牛市周期</span>
            </div>
          </div>
        </div>

        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-violet-400 mb-2">💡 市场展望</h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            <li>• BTC ETF 资金持续流入，机构配置增加</li>
            <li>• 美联储降息周期利好风险资产</li>
            <li>• 2024减半效应持续发酵</li>
            <li>• 市场波动中寻找机会</li>
          </ul>
        </div>
      </div>

      {/* Key Events */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">关键里程碑</h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5" />
            <div>
              <div className="text-[var(--text-primary)] font-medium">2024年1月</div>
              <div className="text-[var(--text-secondary)]">BTC现货ETF获批</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5" />
            <div>
              <div className="text-[var(--text-primary)] font-medium">2024年4月</div>
              <div className="text-[var(--text-secondary)]">BTC第四次减半</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
            <div>
              <div className="text-[var(--text-primary)] font-medium">2024年9月</div>
              <div className="text-[var(--text-secondary)]">美联储开始降息</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5" />
            <div>
              <div className="text-[var(--text-primary)] font-medium">2024年12月</div>
              <div className="text-[var(--text-secondary)]">BTC突破10万美元</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5" />
            <div>
              <div className="text-[var(--text-primary)] font-medium">2025年</div>
              <div className="text-[var(--text-secondary)]">市场调整，寻找新方向</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-400 mt-1.5" />
            <div>
              <div className="text-[var(--text-primary)] font-medium">当前</div>
              <div className="text-[var(--text-secondary)]">总市值 ${currentData.total}T</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
