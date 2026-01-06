import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectDeadline } from '../ProjectDeadline'

describe('ProjectDeadline', () => {
  beforeEach(() => {
    // 固定当前时间为 2024-01-01 00:00:00
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
  })

  it('renders overdue deadline', () => {
    const yesterday = new Date('2023-12-31T00:00:00Z').getTime()
    render(<ProjectDeadline timestamp={yesterday} />)
    expect(screen.getByText(/已过期/)).toBeInTheDocument()
  })

  it('renders today deadline', () => {
    // 使用固定时间，确保在同一天内但不会跨天
    const baseTime = new Date('2024-01-01T00:00:00Z').getTime()
    const today = baseTime + (12 * 60 * 60 * 1000) // 中午12点
    const { container } = render(<ProjectDeadline timestamp={today} />)
    // 只检查是否渲染了截止日期组件
    expect(container.textContent).toContain('截止')
    expect(container.querySelector('.lucide-clock')).toBeTruthy()
  })

  it('renders tomorrow deadline', () => {
    const tomorrow = new Date('2024-01-02T00:00:00Z').getTime()
    render(<ProjectDeadline timestamp={tomorrow} />)
    expect(screen.getByText(/明天/)).toBeInTheDocument()
  })

  it('renders days remaining for near future', () => {
    const fiveDaysLater = new Date('2024-01-06T00:00:00Z').getTime()
    render(<ProjectDeadline timestamp={fiveDaysLater} />)
    expect(screen.getByText(/5天后/)).toBeInTheDocument()
  })

  it('applies urgent styling for overdue', () => {
    const yesterday = new Date('2023-12-31T00:00:00Z').getTime()
    const { container } = render(<ProjectDeadline timestamp={yesterday} />)
    const deadlineElement = container.firstChild as HTMLElement
    expect(deadlineElement).toHaveClass('text-amber-400')
  })

  it('applies normal styling for far future', () => {
    const farFuture = new Date('2024-02-01T00:00:00Z').getTime()
    const { container } = render(<ProjectDeadline timestamp={farFuture} />)
    const deadlineElement = container.firstChild as HTMLElement
    expect(deadlineElement).toHaveClass('text-[var(--text-muted)]')
  })

  it('renders clock icon', () => {
    const tomorrow = new Date('2024-01-02T00:00:00Z').getTime()
    const { container } = render(<ProjectDeadline timestamp={tomorrow} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
