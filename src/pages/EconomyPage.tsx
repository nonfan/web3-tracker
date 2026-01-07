import { useState, useEffect } from 'react'
import { FedRateChart } from '../components/economy/FedRateChart'
import { InflationChart } from '../components/economy/InflationChart'
import { UnemploymentChart } from '../components/economy/UnemploymentChart'
import { CryptoMarketChart } from '../components/economy/CryptoMarketChart'
import { DataSourceConfig } from '../components/economy/DataSourceConfig'
import { getFedRateData, getInflationData, getUnemploymentData, getCryptoMarketData } from '../utils/economicDataApi'
import { TrendingUp, Activity, Briefcase, Bitcoin, Settings } from 'lucide-react'

type ChartType = 'fed-rate' | 'inflation' | 'unemployment' | 'crypto-market' | 'settings'

// 格式化日期显示
function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-')
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return `${year}年${monthNames[parseInt(month) - 1]}`
}

export function EconomyPage() {
  const [activeChart, setActiveChart] = useState<ChartType>('fed-rate')
  const [fedRate, setFedRate] = useState<number | null>(null)
  const [fedRateDate, setFedRateDate] = useState<string | null>(null)
  const [inflation, setInflation] = useState<number | null>(null)
  const [inflationDate, setInflationDate] = useState<string | null>(null)
  const [unemployment, setUnemployment] = useState<number | null>(null)
  const [unemploymentDate, setUnemploymentDate] = useState<string | null>(null)
  const [cryptoTotalMarketCap, setCryptoTotalMarketCap] = useState<number | null>(null)
  const [cryptoDate, setCryptoDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 检查 URL 参数，如果有 tab=settings 则跳转到设置
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'settings') {
      setActiveChart('settings')
    }
  }, [])

  // 加载真实数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const fedData = await getFedRateData()
        if (fedData.length > 0) {
          const latest = fedData[fedData.length - 1]
          setFedRate(latest.rate)
          setFedRateDate(latest.date)
        }

        const inflationData = await getInflationData()
        if (inflationData.length > 0) {
          const latest = inflationData[inflationData.length - 1]
          setInflation(latest.value)
          setInflationDate(latest.date)
        }

        const unemploymentData = await getUnemploymentData()
        if (unemploymentData.length > 0) {
          const latest = unemploymentData[unemploymentData.length - 1]
          setUnemployment(latest.value)
          setUnemploymentDate(latest.date)
        }

        const cryptoData = await getCryptoMarketData()
        if (cryptoData.length > 0) {
          const latest = cryptoData[cryptoData.length - 1]
          setCryptoTotalMarketCap(latest.total)
          setCryptoDate(latest.date)
        }
      } catch (error) {
        console.error('Failed to load economic data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const charts = [
    { id: 'fed-rate' as ChartType, label: '美联储利率', icon: TrendingUp, color: 'violet' },
    { id: 'inflation' as ChartType, label: '通胀率', icon: Activity, color: 'amber' },
    { id: 'unemployment' as ChartType, label: '失业率', icon: Briefcase, color: 'emerald' },
    { id: 'crypto-market' as ChartType, label: '加密市场', icon: Bitcoin, color: 'blue' },
    { id: 'settings' as ChartType, label: '数据源配置', icon: Settings, color: 'slate' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">宏观经济数据</h1>
        <p className="text-[var(--text-secondary)]">实时追踪关键经济指标，辅助投资决策</p>
      </div>

      {/* Stats Overview - 真实数据 */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-[var(--border)] rounded w-20 mb-2"></div>
              <div className="h-8 bg-[var(--border)] rounded w-24 mb-1"></div>
              <div className="h-3 bg-[var(--border)] rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <div className="text-xs text-[var(--text-muted)] font-medium">当前利率</div>
            </div>
            <div className="text-3xl font-bold text-violet-400">{fedRate?.toFixed(2)}%</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{fedRateDate ? formatDate(fedRateDate) : '-'}</div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <div className="text-xs text-[var(--text-muted)] font-medium">通胀率</div>
            </div>
            <div className="text-3xl font-bold text-amber-400">{inflation?.toFixed(1)}%</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{inflationDate ? formatDate(inflationDate) : '-'}</div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <div className="text-xs text-[var(--text-muted)] font-medium">失业率</div>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{unemployment?.toFixed(1)}%</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{unemploymentDate ? formatDate(unemploymentDate) : '-'}</div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-2">
              <Bitcoin className="w-4 h-4 text-blue-400" />
              <div className="text-xs text-[var(--text-muted)] font-medium">加密总市值</div>
            </div>
            <div className="text-3xl font-bold text-blue-400">${cryptoTotalMarketCap?.toFixed(2)}T</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{cryptoDate ? formatDate(cryptoDate) : '-'}</div>
          </div>
        </div>
      )}

      {/* Chart Selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {charts.map((chart) => {
          const Icon = chart.icon
          const isActive = activeChart === chart.id
          return (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`p-4 rounded-xl border transition-all ${isActive
                ? `bg-${chart.color}-500/10 border-${chart.color}-500/30 shadow-lg`
                : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--border-hover)]'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? `bg-${chart.color}-500/20` : 'bg-[var(--bg-tertiary)]'
                  }`}>
                  <Icon className={`w-5 h-5 ${isActive ? `text-${chart.color}-400` : 'text-[var(--text-muted)]'
                    }`} />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-medium ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    }`}>
                    {chart.label}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Chart Display */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
        {activeChart === 'fed-rate' && <FedRateChart />}
        {activeChart === 'inflation' && <InflationChart />}
        {activeChart === 'unemployment' && <UnemploymentChart />}
        {activeChart === 'crypto-market' && <CryptoMarketChart />}
        {activeChart === 'settings' && <DataSourceConfig />}
      </div>
    </div>
  )
}
