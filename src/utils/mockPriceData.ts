import type { TokenPricePoint } from '../types'

/**
 * 生成模拟的价格历史数据（用于测试）
 */
export function generateMockPriceHistory(
  startPrice: number,
  days: number = 30,
  volatility: number = 0.1
): TokenPricePoint[] {
  const history: TokenPricePoint[] = []
  const now = Date.now()
  let currentPrice = startPrice

  for (let i = days; i >= 0; i--) {
    const date = now - i * 24 * 60 * 60 * 1000
    
    // 随机价格变化
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice
    currentPrice = Math.max(0.0001, currentPrice + change)
    
    // 生成高低价
    const high = currentPrice * (1 + Math.random() * 0.05)
    const low = currentPrice * (1 - Math.random() * 0.05)

    history.push({
      date,
      price: parseFloat(currentPrice.toFixed(6)),
      high: parseFloat(high.toFixed(6)),
      low: parseFloat(low.toFixed(6)),
    })
  }

  return history
}
