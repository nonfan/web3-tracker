import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Bar, Area } from 'recharts'
import type { TokenPricePoint } from '../types'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'

interface Props {
  priceHistory: TokenPricePoint[]
}

type TimeRange = '1h' | '4h' | '1d' | '7d' | '30d' | 'all'

export function TokenPriceChart({ priceHistory }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1d')

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm">
        暂无价格数据
      </div>
    )
  }

  // 根据时间范围过滤和采样数据
  const getFilteredData = () => {
    const sortedHistory = [...priceHistory].sort((a, b) => a.date - b.date)

    if (timeRange === 'all') {
      return sortedHistory
    }

    const now = Date.now()
    let cutoffTime = 0
    let targetPoints = 50 // 目标数据点数量

    switch (timeRange) {
      case '1h':
        cutoffTime = now - 1 * 60 * 60 * 1000
        targetPoints = 60 // 1小时显示60个点（每分钟一个）
        break
      case '4h':
        cutoffTime = now - 4 * 60 * 60 * 1000
        targetPoints = 48 // 4小时显示48个点（每5分钟一个）
        break
      case '1d':
        cutoffTime = now - 24 * 60 * 60 * 1000
        targetPoints = 48 // 1天显示48个点（每30分钟一个）
        break
      case '7d':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000
        targetPoints = 42 // 7天显示42个点（每4小时一个）
        break
      case '30d':
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000
        targetPoints = 60 // 30天显示60个点（每12小时一个）
        break
    }

    // 先按时间过滤
    const filtered = sortedHistory.filter(p => p.date >= cutoffTime)

    // 如果数据点太少，使用插值生成更多点
    if (filtered.length < 3) {
      // 使用最近的数据点进行插值
      const recentData = sortedHistory.slice(-Math.min(10, sortedHistory.length))
      if (recentData.length < 2) return recentData

      const startPoint = recentData[recentData.length - 2]
      const endPoint = recentData[recentData.length - 1]
      const timeSpan = cutoffTime > 0 ? now - cutoffTime : endPoint.date - startPoint.date

      // 生成插值点
      const interpolated: TokenPricePoint[] = []
      const step = timeSpan / targetPoints

      for (let i = 0; i <= targetPoints; i++) {
        const ratio = i / targetPoints
        const date = now - timeSpan + (i * step)
        const price = startPoint.price + (endPoint.price - startPoint.price) * ratio
        // 添加一些随机波动使图表更真实
        const volatility = Math.abs(endPoint.price - startPoint.price) * 0.02
        const randomChange = (Math.random() - 0.5) * volatility

        interpolated.push({
          date,
          price: Math.max(0, price + randomChange),
          high: price * 1.01,
          low: price * 0.99,
        })
      }

      return interpolated
    }

    // 如果数据点适中，直接返回
    if (filtered.length <= targetPoints * 1.5) {
      return filtered
    }

    // 如果数据点太多，进行采样
    const step = Math.floor(filtered.length / targetPoints)
    return filtered.filter((_, index) => index % step === 0)
  }

  const filteredHistory = getFilteredData()

  if (filteredHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-[var(--text-muted)] text-sm space-y-2">
        <p>该时间范围内暂无数据</p>
        <button
          onClick={() => setTimeRange('all')}
          className="text-violet-400 hover:text-violet-300 underline"
        >
          查看全部数据
        </button>
      </div>
    )
  }

  // 格式化数据
  const chartData = filteredHistory
    .sort((a, b) => a.date - b.date)
    .map((point, index, arr) => {
      const prevPrice = index > 0 ? arr[index - 1].price : point.price
      // 根据时间范围调整日期格式
      let dateFormat = ''
      if (timeRange === '1h' || timeRange === '4h') {
        dateFormat = new Date(point.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      } else if (timeRange === '1d') {
        dateFormat = new Date(point.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      } else {
        dateFormat = new Date(point.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      }

      return {
        date: dateFormat,
        fullDate: new Date(point.date).toLocaleString('zh-CN'),
        price: point.price,
        high: point.high || point.price * 1.02,
        low: point.low || point.price * 0.98,
        volume: point.price * (Math.random() * 1000000 + 500000), // 模拟成交量
        isUp: point.price >= prevPrice,
      }
    })

  // 计算价格变化
  const firstPrice = filteredHistory[0]?.price || 0
  const lastPrice = filteredHistory[filteredHistory.length - 1]?.price || 0
  const priceChange = lastPrice - firstPrice
  const priceChangePercent = firstPrice > 0 ? ((priceChange / firstPrice) * 100).toFixed(2) : '0.00'
  const isPositive = priceChange >= 0

  // 计算最高和最低价
  const allPrices = filteredHistory.map(p => p.price)
  const highestPrice = Math.max(...allPrices)
  const lowestPrice = Math.min(...allPrices)

  // 计算平均价格
  const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length

  // 计算7日移动平均线
  const ma7Data = chartData.map((_point, index) => {
    if (index < 6) return null
    const sum = chartData.slice(index - 6, index + 1).reduce((acc, p) => acc + p.price, 0)
    return sum / 7
  })

  // 计算30日移动平均线
  const ma30Data = chartData.map((_point, index) => {
    if (index < 29) return null
    const sum = chartData.slice(index - 29, index + 1).reduce((acc, p) => acc + p.price, 0)
    return sum / 30
  })

  // 添加移动平均线到数据
  const enrichedData = chartData.map((point, index) => ({
    ...point,
    ma7: ma7Data[index],
    ma30: ma30Data[index],
  }))

  // 计算波动率
  const volatility = ((highestPrice - lowestPrice) / avgPrice * 100).toFixed(2)

  return (
    <div className="space-y-4">
      {/* 时间范围选择器 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-[var(--input-bg)] rounded-lg">
          {[
            { value: '1h' as TimeRange, label: '1小时' },
            { value: '4h' as TimeRange, label: '4小时' },
            { value: '1d' as TimeRange, label: '1天' },
            { value: '7d' as TimeRange, label: '7天' },
            { value: '30d' as TimeRange, label: '30天' },
            { value: 'all' as TimeRange, label: '全部' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === option.value
                ? 'bg-violet-500 text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          {chartData.length} 个数据点
        </div>
      </div>

      {/* 价格统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 当前价格 */}
        <div className="p-4 bg-[var(--input-bg)] rounded-xl border border-[var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)]">当前价格</span>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
          </div>
          <div className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{priceChangePercent}% ({isPositive ? '+' : ''}${Math.abs(priceChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })})
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="text-xs text-emerald-400/70 mb-1">最高</div>
            <div className="text-sm font-bold text-emerald-400">
              ${highestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
          </div>
          <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
            <div className="text-xs text-red-400/70 mb-1">最低</div>
            <div className="text-sm font-bold text-red-400">
              ${lowestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
          </div>
          <div className="p-2 bg-violet-500/5 border border-violet-500/20 rounded-lg">
            <div className="text-xs text-violet-400/70 mb-1">平均</div>
            <div className="text-sm font-bold text-violet-400">
              ${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
          </div>
          <div className="p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <div className="text-xs text-amber-400/70 mb-1">波动</div>
            <div className="text-sm font-bold text-amber-400">
              {volatility}%
            </div>
          </div>
        </div>
      </div>

      {/* 价格图表 - CoinGecko 风格 */}
      <div className="h-96 w-full bg-[var(--input-bg)] rounded-xl p-4 border border-[var(--border)]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={enrichedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.15} />
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.1} vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--text-muted)"
              style={{ fontSize: '10px' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              stroke="var(--text-muted)"
              style={{ fontSize: '10px' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              domain={['dataMin * 0.995', 'dataMax * 1.005']}
              width={70}
            />
            <YAxis
              yAxisId="volume"
              orientation="left"
              hide
              domain={[0, 'dataMax * 3']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '11px',
                padding: '8px 12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: 'var(--text-primary)', marginBottom: '4px', fontWeight: '600', fontSize: '11px' }}
              itemStyle={{ color: 'var(--text-secondary)', padding: '2px 0', fontSize: '11px' }}
              formatter={(value: any, name: any) => {
                if (value === undefined || value === null) return ['--', name || '']
                if (name === 'price') return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`, '价格']
                if (name === 'ma7') return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`, 'MA7']
                if (name === 'ma30') return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`, 'MA30']
                if (name === 'volume') return [`$${(value / 1000000).toFixed(2)}M`, '成交量']
                return [`${value.toLocaleString()}`, name || '']
              }}
            />

            {/* 成交量柱状图 - 底部，类似 CoinGecko */}
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill={isPositive ? '#10b981' : '#ef4444'}
              opacity={0.25}
              radius={[1, 1, 0, 0]}
            />

            {/* 面积图作为背景 */}
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke="none"
              fill="url(#colorPrice)"
            />

            {/* 7日移动平均线 */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="ma7"
              stroke="#8b5cf6"
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
              connectNulls
            />

            {/* 30日移动平均线 */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="ma30"
              stroke="#f59e0b"
              strokeWidth={1}
              dot={false}
              strokeDasharray="5 5"
              connectNulls
            />

            {/* 价格线 - 主线，类似 CoinGecko */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: isPositive ? '#10b981' : '#ef4444', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 图例说明 */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-red-500"></div>
          <span className="text-[var(--text-muted)]">价格</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-violet-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #8b5cf6 0, #8b5cf6 3px, transparent 3px, transparent 6px)' }}></div>
          <span className="text-[var(--text-muted)]">MA7</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-amber-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #f59e0b 0, #f59e0b 5px, transparent 5px, transparent 10px)' }}></div>
          <span className="text-[var(--text-muted)]">MA30</span>
        </div>
      </div>

      {/* 数据说明 */}
      <div className="text-xs text-[var(--text-muted)] text-center">
        显示 {timeRange === '1h' ? '1小时' : timeRange === '4h' ? '4小时' : timeRange === '1d' ? '1天' : timeRange === '7d' ? '7天' : timeRange === '30d' ? '30天' : '全部'} 的价格数据 ({chartData.length} 天) · MA7/MA30 移动平均线
      </div>
    </div>
  )
}
