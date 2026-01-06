import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectPriority } from '../ProjectPriority'

describe('ProjectPriority', () => {
  it('renders high priority', () => {
    render(<ProjectPriority priority="high" />)
    expect(screen.getByText('高')).toBeInTheDocument()
  })

  it('renders medium priority', () => {
    render(<ProjectPriority priority="medium" />)
    expect(screen.getByText('中')).toBeInTheDocument()
  })

  it('renders low priority', () => {
    render(<ProjectPriority priority="low" />)
    expect(screen.getByText('低')).toBeInTheDocument()
  })

  it('applies correct CSS classes for high priority', () => {
    const { container } = render(<ProjectPriority priority="high" />)
    const priorityElement = container.firstChild as HTMLElement
    expect(priorityElement).toHaveClass('bg-red-500/20', 'text-red-400')
  })

  it('applies correct CSS classes for medium priority', () => {
    const { container } = render(<ProjectPriority priority="medium" />)
    const priorityElement = container.firstChild as HTMLElement
    expect(priorityElement).toHaveClass('bg-amber-500/20', 'text-amber-400')
  })

  it('applies correct CSS classes for low priority', () => {
    const { container } = render(<ProjectPriority priority="low" />)
    const priorityElement = container.firstChild as HTMLElement
    expect(priorityElement).toHaveClass('bg-gray-500/20', 'text-gray-400')
  })

  it('renders flag icon', () => {
    const { container } = render(<ProjectPriority priority="high" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
