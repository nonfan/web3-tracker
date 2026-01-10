import type { TokenPricePoint } from '../../types'

interface TokenPriceInfoProps {
  priceHistory: TokenPricePoint[]
  currentPrice: number
}

export function TokenPriceInfo({ priceHistory, currentPrice }: TokenPriceInfoProps) {
  // 如果没有价格数据，显示占位符
  if (!currentPrice || priceHistory.length === 0) {
    return (
      <div className="mb-4 w-full">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-[var(--input-bg)] rounded-lg">
            <div className="text-xs text-[var(--text-muted)] mb-0.5">当前价格</div>
            <div className="text-sm font-bold text-[var(--text-muted)]">--</div>
            <div className="text-xs text-[var(--text-muted)]">暂无数据</div>
          </div>
          <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="text-xs text-emerald-400/70 mb-0.5">24h 最高</div>
            <div className="text-sm font-semibold text-[var(--text-muted)]">--</div>
          </div>
          <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
            <div className="text-xs text-red-400/70 mb-0.5">24h 最低</div>
            <div className="text-sm font-semibold text-[var(--text-muted)]">--</div>
          </div>
        </div>
      </div>
    )
  }

  // 获取最近24小时的数据
  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const last24h = priceHistory.filter((p) => p.date >= oneDayAgo)

  if (last24h.length === 0) {
    // 如果没有24小时数据，使用全部数据
    const allPrices = priceHistory.map((p) => p.price)
    const high = Math.max(...allPrices)
    const low = Math.min(...allPrices)

    return (
      <div className="mb-4 w-full">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-[var(--input-bg)] rounded-lg">
            <div className="text-xs text-[var(--text-muted)] mb-0.5">当前价格</div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
            <div className="text-xs text-[var(--text-muted)]">历史数据</div>
          </div>
          <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="text-xs text-emerald-400/70 mb-0.5">历史最高</div>
            <div className="text-sm font-semibold text-emerald-400">
              ${high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
          </div>
          <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
            <div className="text-xs text-red-400/70 mb-0.5">历史最低</div>
            <div className="text-sm font-semibold text-red-400">
              ${low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const prices24h = last24h.map((p) => p.price)
  const high24h = Math.max(...prices24h)
  const low24h = Math.min(...prices24h)
  const firstPrice24h = last24h[0].price
  const priceChange24h = currentPrice - firstPrice24h
  const priceChangePercent24h = firstPrice24h > 0 ? ((priceChange24h / firstPrice24h) * 100).toFixed(2) : '0.00'
  const isPositive = priceChange24h >= 0

  return (
    <div className="mb-4 w-full">
      <div className="grid grid-cols-3 gap-2">
        {/* 当前价格 */}
        <div className="p-2 bg-[var(--input-bg)] rounded-lg">
          <div className="text-xs text-[var(--text-muted)] mb-0.5">当前价格</div>
          <div className="text-sm font-bold text-[var(--text-primary)]">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
          </div>
          <div className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{priceChangePercent24h}%
          </div>
        </div>

        {/* 24h 最高 */}
        <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
          <div className="text-xs text-emerald-400/70 mb-0.5">24h 最高</div>
          <div className="text-sm font-semibold text-emerald-400">
            ${high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
          </div>
        </div>

        {/* 24h 最低 */}
        <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
          <div className="text-xs text-red-400/70 mb-0.5">24h 最低</div>
          <div className="text-sm font-semibold text-red-400">
            ${low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
          </div>
        </div>
      </div>
    </div>
  )
}
