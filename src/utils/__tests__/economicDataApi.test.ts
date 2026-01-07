import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCryptoMarketData, getFedRateData, getInflationData, getUnemploymentData } from '../economicDataApi'

// Mock fetch globally
global.fetch = vi.fn()

describe('economicDataApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear console to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getCryptoMarketData', () => {
    it('should fetch and process real-time data from CoinGecko API', async () => {
      const mockApiResponse = {
        data: {
          total_market_cap: {
            usd: 3240000000000 // 3.24T
          },
          market_cap_percentage: {
            btc: 55.5,
            eth: 15.2
          }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      })

      const result = await getCryptoMarketData()

      // 验证 API 调用
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/global',
        expect.objectContaining({
          headers: {
            'Accept': 'application/json'
          }
        })
      )

      // 应该有历史数据加上当前数据
      expect(result.length).toBeGreaterThan(0)
      
      // 最后一项应该是当前月份的 API 数据
      const lastItem = result[result.length - 1]
      const now = new Date()
      const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      
      expect(lastItem.date).toBe(currentDate)
      
      // 验证数据计算逻辑（基于 mock 数据）
      const expectedTotal = 3240000000000 / 1e12 // 3.24
      const expectedBtc = expectedTotal * 55.5 / 100 // 1.7982
      const expectedEth = expectedTotal * 15.2 / 100 // 0.49248
      
      expect(lastItem.total).toBeCloseTo(expectedTotal, 2)
      expect(lastItem.btc).toBeCloseTo(expectedBtc, 2)
      expect(lastItem.eth).toBeCloseTo(expectedEth, 2)
    })

    it('should use backup data when API request fails', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      })

      const result = await getCryptoMarketData()

      // Should return backup data
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].date).toBe('2020-03')
      
      // Should not have 2025-12 data (removed in favor of API)
      const has2025_12 = result.some(d => d.date === '2025-12')
      expect(has2025_12).toBe(false)
    })

    it('should use backup data when API returns invalid structure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'structure' })
      })

      const result = await getCryptoMarketData()

      // Should return backup data
      expect(result.length).toBeGreaterThan(0)
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid API response structure'),
        expect.anything()
      )
    })

    it('should use backup data when fetch throws error', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const result = await getCryptoMarketData()

      // Should return backup data
      expect(result.length).toBeGreaterThan(0)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching crypto market data'),
        expect.any(Error)
      )
    })

    it('should not have 2025-12 backup data when API succeeds', async () => {
      const mockApiResponse = {
        data: {
          total_market_cap: { usd: 3500000000000 },
          market_cap_percentage: { btc: 50, eth: 20 }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      })

      const result = await getCryptoMarketData()

      // 不应该有 2025-12 的备份数据（已被过滤）
      const dec2025Entries = result.filter(d => d.date === '2025-12')
      expect(dec2025Entries.length).toBe(0)
      
      // 最后一项应该是当前月份
      const lastItem = result[result.length - 1]
      const now = new Date()
      const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      expect(lastItem.date).toBe(currentDate)
    })

    it('should log detailed information on success', async () => {
      const mockApiResponse = {
        data: {
          total_market_cap: { usd: 3240000000000 },
          market_cap_percentage: { btc: 55.5, eth: 15.2 }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      })

      await getCryptoMarketData()

      // 验证关键日志被调用（使用 toHaveBeenCalled 而不是检查具体参数）
      const logCalls = (console.log as any).mock.calls
      const logMessages = logCalls.map((call: any[]) => call[0]).join(' ')
      
      expect(logMessages).toContain('Fetching crypto market data')
      expect(logMessages).toContain('CoinGecko API data fetched successfully')
      expect(logMessages).toContain('Current date')
    })
  })

  describe('getFedRateData', () => {
    it('should return local Fed rate data', async () => {
      const result = await getFedRateData()

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('rate')
      expect(result[0]).toHaveProperty('change')
      expect(result[0]).toHaveProperty('type')
    })

    it('should have correct data structure', async () => {
      const result = await getFedRateData()
      const lastItem = result[result.length - 1]

      expect(lastItem.date).toBe('2024-12')
      expect(lastItem.rate).toBe(4.33)
      expect(lastItem.type).toBe('actual')
    })
  })

  describe('getInflationData', () => {
    it('should return local inflation data', async () => {
      const result = await getInflationData()

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('value')
      expect(result[0]).toHaveProperty('source')
    })

    it('should have BLS as source', async () => {
      const result = await getInflationData()
      
      result.forEach(item => {
        expect(item.source).toBe('BLS')
      })
    })
  })

  describe('getUnemploymentData', () => {
    it('should return local unemployment data', async () => {
      const result = await getUnemploymentData()

      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('value')
      expect(result[0]).toHaveProperty('source')
    })

    it('should have correct latest data', async () => {
      const result = await getUnemploymentData()
      const lastItem = result[result.length - 1]

      expect(lastItem.date).toBe('2024-11')
      expect(lastItem.value).toBe(4.2)
    })
  })

  describe('Data consistency', () => {
    it('should have chronologically ordered dates when using backup data', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      })
      
      const cryptoData = await getCryptoMarketData()
      
      for (let i = 1; i < cryptoData.length; i++) {
        const prevDate = new Date(cryptoData[i - 1].date)
        const currDate = new Date(cryptoData[i].date)
        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime())
      }
    })

    it('should have positive market cap values', async () => {
      const mockApiResponse = {
        data: {
          total_market_cap: { usd: 3240000000000 },
          market_cap_percentage: { btc: 55.5, eth: 15.2 }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      })

      const result = await getCryptoMarketData()

      // 所有数据点都应该有正数市值
      result.forEach(item => {
        expect(item.total).toBeGreaterThan(0)
        expect(item.btc).toBeGreaterThan(0)
        expect(item.eth).toBeGreaterThan(0)
      })
    })

    it('should have BTC + ETH less than or equal to total', async () => {
      const mockApiResponse = {
        data: {
          total_market_cap: { usd: 3240000000000 },
          market_cap_percentage: { btc: 55.5, eth: 15.2 }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      })

      const result = await getCryptoMarketData()

      // BTC + ETH 市值应该小于等于总市值
      result.forEach(item => {
        expect(item.btc + item.eth).toBeLessThanOrEqual(item.total + 0.01) // 允许小的舍入误差
      })
    })

    it('should correctly calculate market cap from API percentages', async () => {
      const mockApiResponse = {
        data: {
          total_market_cap: { usd: 5000000000000 }, // 5T
          market_cap_percentage: { btc: 60, eth: 20 }
        }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      })

      const result = await getCryptoMarketData()
      const lastItem = result[result.length - 1]

      // 验证计算逻辑
      expect(lastItem.total).toBeCloseTo(5.0, 2)
      expect(lastItem.btc).toBeCloseTo(3.0, 2) // 60% of 5T
      expect(lastItem.eth).toBeCloseTo(1.0, 2) // 20% of 5T
    })
  })
})
