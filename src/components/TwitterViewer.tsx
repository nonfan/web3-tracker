import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'
import { useTheme } from '../store/useTheme'

interface TwitterViewerProps {
  isOpen: boolean
  onClose: () => void
  username: string
  anchorRef?: React.RefObject<HTMLElement | null>
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => Promise<void>
        createTimeline: (
          source: { sourceType: string; screenName: string },
          target: HTMLElement,
          options?: Record<string, any>
        ) => Promise<HTMLElement>
      }
    }
  }
}

type ArrowPosition = 'left' | 'right' | 'top' | 'bottom'

export function TwitterViewer({ isOpen, onClose, username, anchorRef }: TwitterViewerProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [arrowPosition, setArrowPosition] = useState<ArrowPosition>('left')
  const [arrowOffset, setArrowOffset] = useState(20)
  const containerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  const POPUP_WIDTH = 450
  const POPUP_HEIGHT = 520

  // 计算弹窗位置
  useEffect(() => {
    if (!isOpen || !anchorRef?.current) return
    
    const updatePosition = () => {
      const rect = anchorRef.current!.getBoundingClientRect()
      const anchorCenterY = rect.top + rect.height / 2
      const anchorCenterX = rect.left + rect.width / 2
      
      let left = 0
      let top = 0
      let arrow: ArrowPosition = 'left'
      let offset = 20
      
      // 优先在右侧显示
      if (rect.right + POPUP_WIDTH + 16 < window.innerWidth) {
        left = rect.right + 12
        top = anchorCenterY - POPUP_HEIGHT / 2
        arrow = 'left'
        offset = Math.min(Math.max(20, POPUP_HEIGHT / 2), POPUP_HEIGHT - 40)
      }
      // 其次在左侧显示
      else if (rect.left - POPUP_WIDTH - 16 > 0) {
        left = rect.left - POPUP_WIDTH - 12
        top = anchorCenterY - POPUP_HEIGHT / 2
        arrow = 'right'
        offset = Math.min(Math.max(20, POPUP_HEIGHT / 2), POPUP_HEIGHT - 40)
      }
      // 在下方显示
      else if (rect.bottom + POPUP_HEIGHT + 16 < window.innerHeight) {
        left = anchorCenterX - POPUP_WIDTH / 2
        top = rect.bottom + 12
        arrow = 'top'
        offset = POPUP_WIDTH / 2
      }
      // 在上方显示
      else {
        left = anchorCenterX - POPUP_WIDTH / 2
        top = rect.top - POPUP_HEIGHT - 12
        arrow = 'bottom'
        offset = POPUP_WIDTH / 2
      }
      
      // 边界修正
      if (top < 16) {
        const diff = 16 - top
        top = 16
        if (arrow === 'left' || arrow === 'right') {
          offset = Math.max(20, offset - diff)
        }
      }
      if (top + POPUP_HEIGHT > window.innerHeight - 16) {
        const diff = top + POPUP_HEIGHT - (window.innerHeight - 16)
        top = window.innerHeight - POPUP_HEIGHT - 16
        if (arrow === 'left' || arrow === 'right') {
          offset = Math.min(POPUP_HEIGHT - 40, offset + diff)
        }
      }
      if (left < 16) {
        const diff = 16 - left
        left = 16
        if (arrow === 'top' || arrow === 'bottom') {
          offset = Math.max(20, offset - diff)
        }
      }
      if (left + POPUP_WIDTH > window.innerWidth - 16) {
        const diff = left + POPUP_WIDTH - (window.innerWidth - 16)
        left = window.innerWidth - POPUP_WIDTH - 16
        if (arrow === 'top' || arrow === 'bottom') {
          offset = Math.min(POPUP_WIDTH - 20, offset + diff)
        }
      }
      
      setPosition({ top, left })
      setArrowPosition(arrow)
      setArrowOffset(offset)
    }
    
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, anchorRef])

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // 加载 Twitter Timeline
  useEffect(() => {
    if (!isOpen || !username) return
    
    loadedRef.current = false
    setLoading(true)
    setError(false)
    
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }

    const createTimeline = () => {
      if (!containerRef.current || loadedRef.current) return
      
      if (window.twttr?.widgets) {
        loadedRef.current = true
        
        window.twttr.widgets.createTimeline(
          { sourceType: 'profile', screenName: username },
          containerRef.current,
          {
            height: 420,
            chrome: 'noheader nofooter',
            tweetLimit: 5,
            theme: isDark ? 'dark' : 'light'
          }
        ).then(() => {
          setLoading(false)
          setError(false)
        }).catch(() => {
          setLoading(false)
          setError(true)
        })
      }
    }

    const loadScript = () => {
      if (window.twttr?.widgets) {
        createTimeline()
        return
      }

      const existingScript = document.getElementById('twitter-wjs')
      if (existingScript) {
        const checkReady = setInterval(() => {
          if (window.twttr?.widgets) {
            clearInterval(checkReady)
            createTimeline()
          }
        }, 100)
        
        setTimeout(() => {
          clearInterval(checkReady)
          if (!loadedRef.current) {
            setLoading(false)
            setError(true)
          }
        }, 10000)
        return
      }

      const script = document.createElement('script')
      script.id = 'twitter-wjs'
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      
      script.onload = () => setTimeout(createTimeline, 500)
      script.onerror = () => {
        setLoading(false)
        setError(true)
      }
      
      document.body.appendChild(script)
    }

    loadScript()

    return () => { loadedRef.current = true }
  }, [isOpen, username, isDark])

  if (!isOpen || !username) return null

  const twitterUrl = `https://x.com/${username}`

  // 主题颜色
  const bgColor = isDark ? '#15202b' : 'white'
  const headerBg = isDark ? '#192734' : '#f9fafb'
  const borderColor = isDark ? '#38444d' : '#e5e7eb'
  const textColor = isDark ? 'white' : '#111827'
  const textMuted = isDark ? '#8899a6' : '#6b7280'

  // 箭头样式
  const arrowStyles: Record<ArrowPosition, React.CSSProperties> = {
    left: {
      position: 'absolute',
      left: -8,
      top: arrowOffset,
      transform: 'translateY(-50%)',
      width: 0,
      height: 0,
      borderTop: '8px solid transparent',
      borderBottom: '8px solid transparent',
      borderRight: `8px solid ${bgColor}`,
    },
    right: {
      position: 'absolute',
      right: -8,
      top: arrowOffset,
      transform: 'translateY(-50%)',
      width: 0,
      height: 0,
      borderTop: '8px solid transparent',
      borderBottom: '8px solid transparent',
      borderLeft: `8px solid ${bgColor}`,
    },
    top: {
      position: 'absolute',
      top: -8,
      left: arrowOffset,
      transform: 'translateX(-50%)',
      width: 0,
      height: 0,
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent',
      borderBottom: `8px solid ${headerBg}`,
    },
    bottom: {
      position: 'absolute',
      bottom: -8,
      left: arrowOffset,
      transform: 'translateX(-50%)',
      width: 0,
      height: 0,
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent',
      borderTop: `8px solid ${bgColor}`,
    },
  }

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[100] rounded-xl shadow-2xl overflow-hidden"
      style={{ 
        top: position.top, 
        left: position.left,
        width: POPUP_WIDTH,
        backgroundColor: bgColor,
        boxShadow: isDark 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* 箭头 */}
      <div style={arrowStyles[arrowPosition]} />
      
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3"
        style={{ 
          backgroundColor: headerBg,
          borderBottom: `1px solid ${borderColor}`
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: textColor }}>@{username}</h3>
            <p className="text-xs" style={{ color: textMuted }}>最新推文</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: textMuted }}
            title="在 X 中打开"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative" style={{ height: 420, backgroundColor: bgColor }}>
        {loading && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10"
            style={{ backgroundColor: bgColor }}
          >
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-sm" style={{ color: textMuted }}>加载中...</p>
          </div>
        )}
        
        {error && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10"
            style={{ backgroundColor: bgColor }}
          >
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-sm" style={{ color: textMuted }}>加载失败</p>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 px-3 py-1.5 bg-black text-white rounded-full text-xs hover:bg-gray-800"
            >
              在 X 中查看
            </a>
          </div>
        )}
        
        <div ref={containerRef} className="w-full h-full overflow-y-auto" />
      </div>
    </div>,
    document.body
  )
}
