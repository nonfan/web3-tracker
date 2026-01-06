import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectStatus } from '../ProjectStatus'

describe('ProjectStatus', () => {
  describe('Project mode', () => {
    it('renders active status', () => {
      render(<ProjectStatus status="active" />)
      expect(screen.getByText('进行中')).toBeInTheDocument()
    })

    it('renders completed status', () => {
      render(<ProjectStatus status="completed" />)
      expect(screen.getByText('已完成')).toBeInTheDocument()
    })

    it('renders launched status', () => {
      render(<ProjectStatus status="launched" />)
      expect(screen.getByText('已发币')).toBeInTheDocument()
    })

    it('renders dead status', () => {
      render(<ProjectStatus status="dead" />)
      expect(screen.getByText('已凉')).toBeInTheDocument()
    })

    it('renders archived status', () => {
      render(<ProjectStatus status="archived" />)
      expect(screen.getByText('已归档')).toBeInTheDocument()
    })
  })

  describe('Token mode', () => {
    it('renders active status as 研究中', () => {
      render(<ProjectStatus status="active" isToken={true} />)
      expect(screen.getByText('研究中')).toBeInTheDocument()
    })

    it('renders completed status as 已卖币', () => {
      render(<ProjectStatus status="completed" isToken={true} />)
      expect(screen.getByText('已卖币')).toBeInTheDocument()
    })

    it('renders launched status as 已买币', () => {
      render(<ProjectStatus status="launched" isToken={true} />)
      expect(screen.getByText('已买币')).toBeInTheDocument()
    })

    it('renders dead status as 已归零', () => {
      render(<ProjectStatus status="dead" isToken={true} />)
      expect(screen.getByText('已归零')).toBeInTheDocument()
    })
  })

  it('applies correct CSS classes', () => {
    const { container } = render(<ProjectStatus status="active" />)
    const statusElement = container.firstChild as HTMLElement
    expect(statusElement).toHaveClass('bg-emerald-500/20', 'text-emerald-400')
  })
})
