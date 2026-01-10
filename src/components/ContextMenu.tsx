import { useState, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface MenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
}

interface ContextMenuProps {
  children: ReactNode
  items: MenuItem[]
  disabled?: boolean
}

type ArrowPosition = 'top' | 'bottom' | 'left' | 'right'

export function ContextMenu({ children, items, disabled }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [arrowPosition, setArrowPosition] = useState<ArrowPosition>('top')
  const [arrowOffset, setArrowOffset] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const MENU_WIDTH = 140
  const MENU_HEIGHT = items.length * 40 + 12 // 每项40px + padding

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    
    if (!triggerRef.current) return
    
    const rect = triggerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    let x = 0
    let y = 0
    let arrow: ArrowPosition = 'top'
    let offset = MENU_WIDTH / 2
    
    // 优先在下方显示
    if (rect.bottom + MENU_HEIGHT + 12 < window.innerHeight) {
      x = centerX - MENU_WIDTH / 2
      y = rect.bottom + 8
      arrow = 'top'
      offset = MENU_WIDTH / 2
    }
    // 其次在上方显示
    else if (rect.top - MENU_HEIGHT - 12 > 0) {
      x = centerX - MENU_WIDTH / 2
      y = rect.top - MENU_HEIGHT - 8
      arrow = 'bottom'
      offset = MENU_WIDTH / 2
    }
    // 在右侧显示
    else if (rect.right + MENU_WIDTH + 12 < window.innerWidth) {
      x = rect.right + 8
      y = centerY - MENU_HEIGHT / 2
      arrow = 'left'
      offset = MENU_HEIGHT / 2
    }
    // 在左侧显示
    else {
      x = rect.left - MENU_WIDTH - 8
      y = centerY - MENU_HEIGHT / 2
      arrow = 'right'
      offset = MENU_HEIGHT / 2
    }
    
    // 边界修正
    if (x < 8) {
      const diff = 8 - x
      x = 8
      if (arrow === 'top' || arrow === 'bottom') {
        offset = Math.max(16, offset - diff)
      }
    }
    if (x + MENU_WIDTH > window.innerWidth - 8) {
      const diff = x + MENU_WIDTH - (window.innerWidth - 8)
      x = window.innerWidth - MENU_WIDTH - 8
      if (arrow === 'top' || arrow === 'bottom') {
        offset = Math.min(MENU_WIDTH - 16, offset + diff)
      }
    }
    if (y < 8) {
      const diff = 8 - y
      y = 8
      if (arrow === 'left' || arrow === 'right') {
        offset = Math.max(16, offset - diff)
      }
    }
    if (y + MENU_HEIGHT > window.innerHeight - 8) {
      const diff = y + MENU_HEIGHT - (window.innerHeight - 8)
      y = window.innerHeight - MENU_HEIGHT - 8
      if (arrow === 'left' || arrow === 'right') {
        offset = Math.min(MENU_HEIGHT - 16, offset + diff)
      }
    }
    
    setPosition({ x, y })
    setArrowPosition(arrow)
    setArrowOffset(offset)
    setIsOpen(true)
  }

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return
    
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    
    const handleScroll = () => setIsOpen(false)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('scroll', handleScroll, true)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // 箭头样式
  const getArrowStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
    }
    
    switch (arrowPosition) {
      case 'top':
        return {
          ...base,
          top: -6,
          left: arrowOffset,
          transform: 'translateX(-50%)',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '6px solid var(--card-bg)',
        }
      case 'bottom':
        return {
          ...base,
          bottom: -6,
          left: arrowOffset,
          transform: 'translateX(-50%)',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid var(--card-bg)',
        }
      case 'left':
        return {
          ...base,
          left: -6,
          top: arrowOffset,
          transform: 'translateY(-50%)',
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '6px solid var(--card-bg)',
        }
      case 'right':
        return {
          ...base,
          right: -6,
          top: arrowOffset,
          transform: 'translateY(-50%)',
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: '6px solid var(--card-bg)',
        }
    }
  }

  return (
    <>
      <div ref={triggerRef} onContextMenu={handleContextMenu}>
        {children}
      </div>
      
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100000] py-1.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-2xl"
          style={{ 
            left: position.x, 
            top: position.y,
            width: MENU_WIDTH,
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* 箭头 */}
          <div style={getArrowStyle()} />
          
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick()
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                item.danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]'
              }`}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
