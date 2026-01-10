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

export function ContextMenu({ children, items, disabled }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    
    // 计算菜单位置，确保不超出屏幕
    const x = Math.min(e.clientX, window.innerWidth - 200)
    const y = Math.min(e.clientY, window.innerHeight - (items.length * 40 + 16))
    
    setPosition({ x, y })
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

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>
      
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100000] min-w-[160px] py-1.5 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-2xl"
          style={{ left: position.x, top: position.y }}
        >
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
