import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Settings, AlertCircle } from 'lucide-react'
import { getUnemploymentData, type EconomicDataPoint } from '../../utils/economicDataApi'

export function UnemploymentChart() {
  const [unemploymentData, setUnemploymentData] = useState<EconomicDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getUnemploymentData()
        if (data.length === 0) {
          setError('no-data')
        } else {
          setUnemploymentData(data)
        }
      } catch (err) {
        console.error('Failed to load unemployment data:', err)
        setError('load-error')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-[var(--text-muted)]">加载数据中...</p>
        </div>
      </div>
    )
  }

  // 无数据状态
  if (error === 'no-data' || unemploymentData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">暂无数据</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            请配置经济数据源以查看失业率走势
          </p>
          <button
            onClick={() => window.location.hash = '#/economy?tab=settings'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            前往配置
          </button>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error === 'load-error') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">加载失败</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            无法加载经济数据，请检查网络连接或数据源配置
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

  const currentRate = unemploymentData[unemploymentData.length - 1].value
  const currentDate = unemploymentData[unemploymentData.length - 1].date
  const targetRate = 4.0
  const minRate = Math.min(...unemploymentData.map(d => d.value))
  const maxRate = Math.max(...unemploymentData.map(d => d.value))

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
          失业率反映劳动力市场健康状况，影响消费能力和经济增长
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
          <div className="text-xs text-[var(--text-muted)] mb-1">历史最低</div>
          <div className="text-2xl font-bold text-emerald-400">{minRate}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">近期数据</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)] mb-1">历史最高</div>
          <div className="text-2xl font-bold text-red-400">{maxRate}%</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">近期数据</div>
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
              formatter={(value: number | undefined) => value !== undefined ? [`${value}%`, '失业率'] : ['-', '失业率']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <ReferenceLine y={targetRate} stroke="#10b981" strokeDasharray="3 3" label="健康水平4%" />
            <Line
              type="monotone"
              dataKey="value"
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
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">数据说明</h3>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <p>• 数据来源：美国劳工统计局 (BLS)</p>
            <p>• 更新频率：每月发布，通常有1个月延迟</p>
            <p>• 健康水平：4% 左右被认为是充分就业</p>
            <p>• 过低可能导致通胀，过高影响消费</p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">💡 市场影响</h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            <li>• 低失业率表明经济健康，消费能力强</li>
            <li>• 稳定的就业市场支撑资产价格</li>
            <li>• 失业率上升可能促使美联储降息</li>
            <li>• 关注非农就业数据和薪资增长</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
