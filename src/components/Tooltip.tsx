import { useState, useRef, useEffect, useCallback } from 'react'
import gsap from 'gsap'

interface Props {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom'
}

export function Tooltip({ content, children, position = 'bottom' }: Props) {
  const [show, setShow] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    
    let x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
    let y = position === 'top' 
      ? triggerRect.top - tooltipRect.height - 8
      : triggerRect.bottom + 8

    // 防止超出屏幕
    if (x < 8) x = 8
    if (x + tooltipRect.width > window.innerWidth - 8) {
      x = window.innerWidth - tooltipRect.width - 8
    }

    return { x, y }
  }, [position])

  useEffect(() => {
    if (show && tooltipRef.current) {
      const coords = updatePosition()
      if (coords) {
        gsap.set(tooltipRef.current, { left: coords.x, top: coords.y })
        gsap.fromTo(tooltipRef.current,
          { opacity: 0, y: position === 'top' ? 4 : -4 },
          { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' }
        )
      }
    }
  }, [show, position, updatePosition])

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      className="inline-flex max-w-full"
    >
      {children}
      {show && (
        <div
          ref={tooltipRef}
          className="fixed z-[100] px-3 py-2 text-xs font-medium bg-[var(--card-bg)] text-[var(--text-primary)] rounded-lg border border-[var(--border)] shadow-lg max-w-xs"
          style={{ opacity: 0 }}
        >
          {content}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--card-bg)] border-[var(--border)] rotate-45 ${
              position === 'top' 
                ? 'bottom-[-5px] border-r border-b' 
                : 'top-[-5px] border-l border-t'
            }`}
          />
        </div>
      )}
    </div>
  )
}
