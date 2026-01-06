import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ProjectLogo } from '../ProjectLogo'

describe('ProjectLogo', () => {
  it('renders nothing when no logo or website provided', () => {
    const { container } = render(<ProjectLogo name="Test Project" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders custom image logo', () => {
    const { container } = render(
      <ProjectLogo
        logoUrl="https://example.com/logo.png"
        name="Test Project"
      />
    )
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.getAttribute('src')).toBe('https://example.com/logo.png')
    expect(img?.getAttribute('alt')).toBe('Test Project')
  })

  it('renders SVG logo', () => {
    const svgCode = '<svg><circle cx="10" cy="10" r="10" /></svg>'
    const { container } = render(
      <ProjectLogo
        logoUrl={svgCode}
        name="Test Project"
      />
    )
    expect(container.innerHTML).toContain('<svg>')
  })

  it('applies custom size', () => {
    const { container } = render(
      <ProjectLogo
        logoUrl="https://example.com/logo.png"
        name="Test Project"
        size={48}
      />
    )
    const logoContainer = container.firstChild as HTMLElement
    expect(logoContainer.style.width).toBe('48px')
    expect(logoContainer.style.height).toBe('48px')
  })

  it('hides image on error', () => {
    const { container } = render(
      <ProjectLogo
        logoUrl="https://example.com/invalid.png"
        name="Test Project"
      />
    )
    const img = container.querySelector('img')
    expect(img).toBeTruthy()

    // 模拟图片加载失败
    if (img) {
      img.dispatchEvent(new Event('error'))
      expect(img.style.display).toBe('none')
    }
  })
})
