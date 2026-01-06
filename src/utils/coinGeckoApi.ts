import type { TokenPricePoint } from '../types'

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3'

// 时间间隔映射 - 只使用 daily 间隔（免费 API 稳定支持）
export type TimeInterval = '7d' | '30d' | '90d' | '180d' | '365d'

interface IntervalConfig {
  days: number
  interval: 'daily'
}

const INTERVAL_CONFIG: Record<TimeInterval, IntervalConfig> = {
  '7d': { days: 7, interval: 'daily' },
  '30d': { days: 30, interval: 'daily' },
  '90d': { days: 90, interval: 'daily' },
  '180d': { days: 180, interval: 'daily' },
  '365d': { days: 365, interval: 'daily' },
}

/**
 * 搜索代币，获取 CoinGecko ID
 */
export async function searchToken(query: string): Promise<Array<{
  id: string
  symbol: string
  name: string
  thumb: string
}>> {
  try {
    const response = await fetch(`${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`)
    if (!response.ok) throw new Error('搜索失败')
    
    const data = await response.json()
    return data.coins.slice(0, 10).map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      thumb: coin.thumb,
    }))
  } catch (error) {
    console.error('搜索代币失败:', error)
    return []
  }
}

/**
 * 获取代币的历史价格数据（支持不同时间间隔）
 * @param coinId CoinGecko 代币 ID (如 'bitcoin', 'ethereum')
 * @param timeInterval 时间间隔 ('7d', '30d', '90d', '180d', '365d')
 */
export async function getTokenPriceHistoryByInterval(
  coinId: string,
  timeInterval: TimeInterval = '7d'
): Promise<TokenPricePoint[]> {
  try {
    const config = INTERVAL_CONFIG[timeInterval]
    
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${config.days}&interval=${config.interval}`
    )
    
    if (!response.ok) {
      throw new Error('获取价格数据失败')
    }
    
    const data = await response.json()
    
    // 转换数据格式
    const priceHistory: TokenPricePoint[] = data.prices.map((item: [number, number], index: number) => {
      const [timestamp, price] = item
      
      // 尝试获取高低价（如果有的话）
      const high = data.highs?.[index]?.[1] || price * 1.02
      const low = data.lows?.[index]?.[1] || price * 0.98
      
      return {
        date: timestamp,
        price: parseFloat(price.toFixed(6)),
        high: parseFloat(high.toFixed(6)),
        low: parseFloat(low.toFixed(6)),
      }
    })
    
    return priceHistory
  } catch (error) {
    console.error('获取价格历史失败:', error)
    throw error
  }
}

/**
 * 获取代币的历史价格数据
 * @param coinId CoinGecko 代币 ID (如 'bitcoin', 'ethereum')
 * @param days 天数 (1, 7, 14, 30, 90, 180, 365, 'max' 表示所有历史数据，但免费 API 最多支持 365 天)
 */
export async function getTokenPriceHistory(
  coinId: string,
  days: number | 'max' = 365
): Promise<TokenPricePoint[]> {
  try {
    // 免费 API 不支持 'max'，将其转换为 365 天
    const actualDays = days === 'max' ? 365 : days
    
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${actualDays}&interval=daily`
    )
    
    if (!response.ok) {
      throw new Error('获取价格数据失败')
    }
    
    const data = await response.json()
    
    // 转换数据格式
    const priceHistory: TokenPricePoint[] = data.prices.map((item: [number, number], index: number) => {
      const [timestamp, price] = item
      
      // 尝试获取高低价（如果有的话）
      const high = data.highs?.[index]?.[1] || price * 1.02
      const low = data.lows?.[index]?.[1] || price * 0.98
      
      return {
        date: timestamp,
        price: parseFloat(price.toFixed(6)),
        high: parseFloat(high.toFixed(6)),
        low: parseFloat(low.toFixed(6)),
      }
    })
    
    return priceHistory
  } catch (error) {
    console.error('获取价格历史失败:', error)
    throw error
  }
}

/**
 * 获取代币当前价格和基本信息
 */
export async function getTokenInfo(coinId: string): Promise<{
  currentPrice: number
  priceChange24h: number
  priceChangePercentage24h: number
  marketCap: number
  volume24h: number
  high24h: number
  low24h: number
} | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
    )
    
    if (!response.ok) throw new Error('获取代币信息失败')
    
    const data = await response.json()
    const marketData = data.market_data
    
    return {
      currentPrice: marketData.current_price.usd,
      priceChange24h: marketData.price_change_24h,
      priceChangePercentage24h: marketData.price_change_percentage_24h,
      marketCap: marketData.market_cap.usd,
      volume24h: marketData.total_volume.usd,
      high24h: marketData.high_24h.usd,
      low24h: marketData.low_24h.usd,
    }
  } catch (error) {
    console.error('获取代币信息失败:', error)
    return null
  }
}

/**
 * 批量获取多个代币的当前价格
 */
export async function getMultipleTokenPrices(coinIds: string[]): Promise<Record<string, number>> {
  try {
    const ids = coinIds.join(',')
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${ids}&vs_currencies=usd`
    )
    
    if (!response.ok) throw new Error('获取价格失败')
    
    const data = await response.json()
    const prices: Record<string, number> = {}
    
    for (const [id, priceData] of Object.entries(data)) {
      prices[id] = (priceData as any).usd
    }
    
    return prices
  } catch (error) {
    console.error('批量获取价格失败:', error)
    return {}
  }
}

/**
 * 根据合约地址获取代币信息
 */
export async function getTokenByContract(
  platform: string, // 如 'ethereum', 'binance-smart-chain', 'polygon-pos'
  contractAddress: string
): Promise<{
  id: string
  symbol: string
  name: string
} | null> {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/${platform}/contract/${contractAddress}`
    )
    
    if (!response.ok) throw new Error('获取代币信息失败')
    
    const data = await response.json()
    
    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
    }
  } catch (error) {
    console.error('通过合约地址获取代币失败:', error)
    return null
  }
}

/**
 * 获取支持的平台列表
 */
export const SUPPORTED_PLATFORMS: Record<string, string> = {
  'Ethereum': 'ethereum',
  'BSC': 'binance-smart-chain',
  'Polygon': 'polygon-pos',
  'Arbitrum': 'arbitrum-one',
  'Optimism': 'optimistic-ethereum',
  'Avalanche': 'avalanche',
  'Base': 'base',
  'Solana': 'solana',
}
