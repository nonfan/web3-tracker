import type { TokenPricePoint } from '../types'

interface CachedPriceData {
  coinId: string
  priceHistory: TokenPricePoint[]
  currentPrice: number
  lastUpdated: number
  days: number | 'max'
}

const CACHE_KEY = 'token_price_cache'
const CACHE_DURATION = 60 * 60 * 1000 // 1小时缓存

/**
 * 获取缓存的价格数据
 */
export function getCachedPriceData(coinId: string, days: number | 'max'): CachedPriceData | null {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY)
    if (!cacheStr) return null

    const cache: Record<string, CachedPriceData> = JSON.parse(cacheStr)
    const key = `${coinId}_${days}`
    const cached = cache[key]

    if (!cached) return null

    // 检查缓存是否过期
    const now = Date.now()
    if (now - cached.lastUpdated > CACHE_DURATION) {
      // 缓存过期，删除
      delete cache[key]
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      return null
    }

    return cached
  } catch (error) {
    console.error('读取缓存失败:', error)
    return null
  }
}

/**
 * 保存价格数据到缓存
 */
export function setCachedPriceData(
  coinId: string,
  days: number | 'max',
  priceHistory: TokenPricePoint[],
  currentPrice: number
): void {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY)
    const cache: Record<string, CachedPriceData> = cacheStr ? JSON.parse(cacheStr) : {}

    const key = `${coinId}_${days}`
    cache[key] = {
      coinId,
      priceHistory,
      currentPrice,
      lastUpdated: Date.now(),
      days,
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('保存缓存失败:', error)
  }
}

/**
 * 清除指定代币的缓存
 */
export function clearCachedPriceData(coinId: string): void {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY)
    if (!cacheStr) return

    const cache: Record<string, CachedPriceData> = JSON.parse(cacheStr)
    
    // 删除该代币的所有缓存
    Object.keys(cache).forEach(key => {
      if (key.startsWith(`${coinId}_`)) {
        delete cache[key]
      }
    })

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('清除缓存失败:', error)
  }
}

/**
 * 清除所有过期的缓存
 */
export function cleanExpiredCache(): void {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY)
    if (!cacheStr) return

    const cache: Record<string, CachedPriceData> = JSON.parse(cacheStr)
    const now = Date.now()
    let hasExpired = false

    Object.keys(cache).forEach(key => {
      if (now - cache[key].lastUpdated > CACHE_DURATION) {
        delete cache[key]
        hasExpired = true
      }
    })

    if (hasExpired) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    }
  } catch (error) {
    console.error('清理过期缓存失败:', error)
  }
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): {
  totalCached: number
  cacheSize: string
  oldestCache: number | null
  newestCache: number | null
} {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY)
    if (!cacheStr) {
      return {
        totalCached: 0,
        cacheSize: '0 KB',
        oldestCache: null,
        newestCache: null,
      }
    }

    const cache: Record<string, CachedPriceData> = JSON.parse(cacheStr)
    const entries = Object.values(cache)
    
    const timestamps = entries.map(e => e.lastUpdated)
    const oldestCache = timestamps.length > 0 ? Math.min(...timestamps) : null
    const newestCache = timestamps.length > 0 ? Math.max(...timestamps) : null

    // 计算缓存大小
    const sizeInBytes = new Blob([cacheStr]).size
    const sizeInKB = (sizeInBytes / 1024).toFixed(2)

    return {
      totalCached: entries.length,
      cacheSize: `${sizeInKB} KB`,
      oldestCache,
      newestCache,
    }
  } catch (error) {
    console.error('获取缓存统计失败:', error)
    return {
      totalCached: 0,
      cacheSize: '0 KB',
      oldestCache: null,
      newestCache: null,
    }
  }
}

/**
 * 清除所有缓存
 */
export function clearAllCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('清除所有缓存失败:', error)
  }
}

/**
 * 检查缓存是否即将过期（剩余时间少于10分钟）
 */
export function isCacheExpiringSoon(coinId: string, days: number | 'max'): boolean {
  const cached = getCachedPriceData(coinId, days)
  if (!cached) return false

  const now = Date.now()
  const timeLeft = CACHE_DURATION - (now - cached.lastUpdated)
  return timeLeft < 10 * 60 * 1000 // 少于10分钟
}

/**
 * 获取缓存剩余时间（分钟）
 */
export function getCacheTimeLeft(coinId: string, days: number | 'max'): number | null {
  const cached = getCachedPriceData(coinId, days)
  if (!cached) return null

  const now = Date.now()
  const timeLeft = CACHE_DURATION - (now - cached.lastUpdated)
  return Math.max(0, Math.floor(timeLeft / (60 * 1000)))
}
