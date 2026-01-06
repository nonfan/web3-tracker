import { describe, it, expect } from 'vitest'
import { generateMockPriceHistory } from '../mockPriceData'

describe('mockPriceData', () => {
  describe('generateMockPriceHistory', () => {
    it('should generate price history with correct length', () => {
      const history = generateMockPriceHistory(100, 30, 0.1)
      // 生成的数据点数量是 days + 1（包含起始点）
      expect(history).toHaveLength(31)
    })

    it('should generate prices around base price', () => {
      const basePrice = 100
      const history = generateMockPriceHistory(basePrice, 10, 0.05)

      history.forEach(point => {
        expect(point.price).toBeGreaterThan(0)
        expect(point.price).toBeGreaterThan(basePrice * 0.5)
        expect(point.price).toBeLessThan(basePrice * 1.5)
      })
    })

    it('should have high >= price >= low', () => {
      const history = generateMockPriceHistory(100, 20, 0.1)

      history.forEach(point => {
        expect(point.high).toBeGreaterThanOrEqual(point.price)
        expect(point.price).toBeGreaterThanOrEqual(point.low || 0)
      })
    })

    it('should have timestamps in ascending order', () => {
      const history = generateMockPriceHistory(100, 15, 0.1)

      for (let i = 1; i < history.length; i++) {
        expect(history[i].date).toBeGreaterThan(history[i - 1].date)
      }
    })

    it('should handle zero volatility', () => {
      const basePrice = 50
      const history = generateMockPriceHistory(basePrice, 10, 0)

      history.forEach(point => {
        expect(point.price).toBe(basePrice)
      })
    })

    it('should handle high volatility', () => {
      const history = generateMockPriceHistory(100, 20, 0.5)
      
      const prices = history.map(p => p.price)
      const maxPrice = Math.max(...prices)
      const minPrice = Math.min(...prices)
      
      // 高波动率应该产生较大的价格范围
      expect(maxPrice - minPrice).toBeGreaterThan(0)
    })

    it('should generate different data on each call', () => {
      const history1 = generateMockPriceHistory(100, 10, 0.1)
      const history2 = generateMockPriceHistory(100, 10, 0.1)

      // 由于随机性，两次生成的数据应该不同
      const prices1 = history1.map(p => p.price).join(',')
      const prices2 = history2.map(p => p.price).join(',')
      
      expect(prices1).not.toBe(prices2)
    })
  })
})
