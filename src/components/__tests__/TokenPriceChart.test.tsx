import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TokenPriceChart } from '../TokenPriceChart'
import type { TokenPricePoint } from '../../types'

describe('TokenPriceChart', () => {
  const mockPriceHistory: TokenPricePoint[] = [
    { date: Date.now() - 7 * 24 * 60 * 60 * 1000, price: 100, high: 105, low: 95 },
    { date: Date.now() - 6 * 24 * 60 * 60 * 1000, price: 102, high: 107, low: 97 },
    { date: Date.now() - 5 * 24 * 60 * 60 * 1000, price: 98, high: 103, low: 93 },
    { date: Date.now() - 4 * 24 * 60 * 60 * 1000, price: 105, high: 110, low: 100 },
    { date: Date.now() - 3 * 24 * 60 * 60 * 1000, price: 103, high: 108, low: 98 },
    { date: Date.now() - 2 * 24 * 60 * 60 * 1000, price: 107, high: 112, low: 102 },
    { date: Date.now() - 1 * 24 * 60 * 60 * 1000, price: 110, high: 115, low: 105 },
  ]

  it('should render without crashing', () => {
    render(<TokenPriceChart priceHistory={mockPriceHistory} />)
    expect(screen.getByText(/个数据点/)).toBeInTheDocument()
  })

  it('should show empty state when no data', () => {
    render(<TokenPriceChart priceHistory={[]} />)
    expect(screen.getByText('暂无价格数据')).toBeInTheDocument()
  })

  it('should display time range buttons', () => {
    render(<TokenPriceChart priceHistory={mockPriceHistory} />)

    expect(screen.getByText('1小时')).toBeInTheDocument()
    expect(screen.getByText('4小时')).toBeInTheDocument()
    expect(screen.getByText('1天')).toBeInTheDocument()
    expect(screen.getByText('7天')).toBeInTheDocument()
    expect(screen.getByText('30天')).toBeInTheDocument()
    expect(screen.getByText('全部')).toBeInTheDocument()
  })

  it('should display price statistics', () => {
    render(<TokenPriceChart priceHistory={mockPriceHistory} />)

    expect(screen.getByText('当前价格')).toBeInTheDocument()
    expect(screen.getByText('最高')).toBeInTheDocument()
    expect(screen.getByText('最低')).toBeInTheDocument()
    expect(screen.getByText('平均')).toBeInTheDocument()
    expect(screen.getByText('波动')).toBeInTheDocument()
  })

  it('should switch time ranges', () => {
    render(<TokenPriceChart priceHistory={mockPriceHistory} />)

    const button7d = screen.getByText('7天')
    fireEvent.click(button7d)

    // 应该显示7天的数据
    expect(button7d).toHaveClass('bg-violet-500')
  })

  it('should show positive price change', () => {
    render(<TokenPriceChart priceHistory={mockPriceHistory} />)

    // 价格从100涨到110，应该显示正增长
    const priceChangeElements = screen.getAllByText(/\+/)
    expect(priceChangeElements.length).toBeGreaterThan(0)
  })

  it('should display chart legend', () => {
    render(<TokenPriceChart priceHistory={mockPriceHistory} />)

    expect(screen.getByText('价格')).toBeInTheDocument()
    expect(screen.getByText('MA7')).toBeInTheDocument()
    expect(screen.getByText('MA30')).toBeInTheDocument()
  })

  it('should handle single data point', () => {
    const singlePoint: TokenPricePoint[] = [
      { date: Date.now(), price: 100, high: 105, low: 95 }
    ]

    render(<TokenPriceChart priceHistory={singlePoint} />)
    expect(screen.getByText(/个数据点/)).toBeInTheDocument()
  })
})
