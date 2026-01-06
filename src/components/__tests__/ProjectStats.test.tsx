import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ProjectStats } from '../ProjectStats'

describe('ProjectStats', () => {
  it('renders nothing when no investment or profit', () => {
    const { container } = render(<ProjectStats totalInvestment={0} totalProfit={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders investment only', () => {
    const { container } = render(<ProjectStats totalInvestment={1000} totalProfit={0} />)
    expect(container.textContent).toContain('投入')
    expect(container.textContent).toContain('1,000')
  })

  it('renders profit only', () => {
    const { container } = render(<ProjectStats totalInvestment={0} totalProfit={500} />)
    expect(container.textContent).toContain('收益')
    expect(container.textContent).toContain('500')
  })

  it('renders both investment and profit', () => {
    const { container } = render(<ProjectStats totalInvestment={1000} totalProfit={500} />)
    expect(container.textContent).toContain('投入')
    expect(container.textContent).toContain('1,000')
    expect(container.textContent).toContain('收益')
    expect(container.textContent).toContain('500')
  })

  it('renders negative profit with correct styling', () => {
    const { container } = render(<ProjectStats totalInvestment={1000} totalProfit={-200} />)
    expect(container.textContent).toContain('收益')
    expect(container.textContent).toContain('-200')

    // 检查红色样式
    const profitDiv = container.querySelector('.text-red-400')
    expect(profitDiv).toBeTruthy()
  })

  it('renders positive profit with correct styling', () => {
    const { container } = render(<ProjectStats totalInvestment={1000} totalProfit={500} />)

    // 检查绿色样式
    const profitDiv = container.querySelector('.text-emerald-400')
    expect(profitDiv).toBeTruthy()
  })

  it('formats large numbers with commas', () => {
    const { container } = render(<ProjectStats totalInvestment={1000000} totalProfit={250000} />)
    expect(container.textContent).toContain('1,000,000')
    expect(container.textContent).toContain('250,000')
  })

  it('renders icons', () => {
    const { container } = render(<ProjectStats totalInvestment={1000} totalProfit={500} />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(2) // DollarSign and TrendingUp icons
  })
})
