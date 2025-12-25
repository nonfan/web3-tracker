import { useState, useRef, useEffect } from 'react'

interface Props {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom'
}

export function Tooltip({ content, children, position = 'bottom' }: Props) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (show && triggerRef.current && tooltipRef.current) {
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

      setCoords({ x, y })
    }
  }, [show, position])

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      className="inline-flex"
    >
      {children}
      {show && (
        <div
          ref={tooltipRef}
          className="fixed z-[100] px-2.5 py-1.5 text-xs font-medium bg-[var(--card-bg)] text-[var(--text-primary)] rounded-lg border border-[var(--border)] shadow-lg animate-in fade-in duration-150"
          style={{ left: coords.x, top: coords.y }}
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
