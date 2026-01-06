import { describe, it, expect, beforeEach } from 'vitest'
import { 
  getCachedPriceData, 
  setCachedPriceData, 
  cleanExpiredCache,
  clearAllCache,
  getCacheStats,
  isCacheExpiringSoon,
  getCacheTimeLeft
} from '../priceDataCache'
import type { TokenPricePoint } from '../../types'

describe('priceDataCache', () => {
  beforeEach(() => {
    clearAllCache()
  })

  describe('setCachedPriceData', () => {
    it('should cache price data with expiry', () => {
      const mockData: TokenPricePoint[] = [
        { date: Date.now(), price: 100 },
        { date: Date.now() + 1000, price: 101 },
      ]

      setCachedPriceData('bitcoin', 7, mockData, 101)

      const cached = getCachedPriceData('bitcoin', 7)
      expect(cached).not.toBeNull()
      expect(cached?.priceHistory).toEqual(mockData)
      expect(cached?.currentPrice).toBe(101)
      expect(cached?.coinId).toBe('bitcoin')
      expect(cached?.days).toBe(7)
    })

    it('should handle empty data', () => {
      setCachedPriceData('ethereum', 30, [], 0)
      const cached = getCachedPriceData('ethereum', 30)
      expect(cached).not.toBeNull()
      expect(cached?.priceHistory).toEqual([])
    })
  })

  describe('getCachedPriceData', () => {
    it('should return null for non-existent cache', () => {
      const cached = getCachedPriceData('nonexistent', 7)
      expect(cached).toBeNull()
    })

    it('should return null for expired cache', () => {
      const mockData: TokenPricePoint[] = [{ date: Date.now(), price: 100 }]
      
      // 手动设置过期缓存
      const cacheKey = 'token_price_cache'
      const expiredData = {
        'bitcoin_7': {
          coinId: 'bitcoin',
          priceHistory: mockData,
          currentPrice: 100,
          lastUpdated: Date.now() - 2 * 60 * 60 * 1000, // 2小时前
          days: 7,
        }
      }
      localStorage.setItem(cacheKey, JSON.stringify(expiredData))

      const cached = getCachedPriceData('bitcoin', 7)
      expect(cached).toBeNull()
    })

    it('should return valid cached data', () => {
      const mockData: TokenPricePoint[] = [{ date: Date.now(), price: 100 }]
      setCachedPriceData('bitcoin', 7, mockData, 100)

      const cached = getCachedPriceData('bitcoin', 7)
      expect(cached).not.toBeNull()
      expect(cached?.priceHistory).toEqual(mockData)
    })
  })

  describe('cleanExpiredCache', () => {
    it('should remove expired cache entries', () => {
      const now = Date.now()
      
      // 添加有效缓存
      setCachedPriceData('bitcoin', 7, [{ date: now, price: 100 }], 100)

      // 手动添加过期缓存
      const cacheStr = localStorage.getItem('token_price_cache')
      const cache = cacheStr ? JSON.parse(cacheStr) : {}
      cache['ethereum_30'] = {
        coinId: 'ethereum',
        priceHistory: [{ date: now, price: 200 }],
        currentPrice: 200,
        lastUpdated: now - 2 * 60 * 60 * 1000,
        days: 30,
      }
      localStorage.setItem('token_price_cache', JSON.stringify(cache))

      cleanExpiredCache()

      expect(getCachedPriceData('bitcoin', 7)).not.toBeNull()
      expect(getCachedPriceData('ethereum', 30)).toBeNull()
    })

    it('should handle invalid cache entries', () => {
      localStorage.setItem('token_price_cache', 'invalid json')
      
      expect(() => cleanExpiredCache()).not.toThrow()
    })
  })

  describe('getCacheStats', () => {
    it('should return correct stats', () => {
      setCachedPriceData('bitcoin', 7, [{ date: Date.now(), price: 100 }], 100)
      setCachedPriceData('ethereum', 30, [{ date: Date.now(), price: 200 }], 200)

      const stats = getCacheStats()
      expect(stats.totalCached).toBe(2)
      expect(stats.oldestCache).not.toBeNull()
      expect(stats.newestCache).not.toBeNull()
    })

    it('should handle empty cache', () => {
      const stats = getCacheStats()
      expect(stats.totalCached).toBe(0)
      expect(stats.cacheSize).toBe('0 KB')
    })
  })

  describe('isCacheExpiringSoon', () => {
    it('should return false for non-existent cache', () => {
      expect(isCacheExpiringSoon('bitcoin', 7)).toBe(false)
    })

    it('should return false for fresh cache', () => {
      setCachedPriceData('bitcoin', 7, [{ date: Date.now(), price: 100 }], 100)
      expect(isCacheExpiringSoon('bitcoin', 7)).toBe(false)
    })
  })

  describe('getCacheTimeLeft', () => {
    it('should return null for non-existent cache', () => {
      expect(getCacheTimeLeft('bitcoin', 7)).toBeNull()
    })

    it('should return time left for valid cache', () => {
      setCachedPriceData('bitcoin', 7, [{ date: Date.now(), price: 100 }], 100)
      const timeLeft = getCacheTimeLeft('bitcoin', 7)
      expect(timeLeft).not.toBeNull()
      expect(timeLeft).toBeGreaterThan(0)
    })
  })
})
