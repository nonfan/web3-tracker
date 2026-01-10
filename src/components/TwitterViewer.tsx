import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'

interface TwitterViewerProps {
  isOpen: boolean
  onClose: () => void
  username: string
}

export function TwitterViewer({ isOpen, onClose, username }: TwitterViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError(false)
      
      // 加载 Twitter 嵌入脚本
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.onload = () => {
        // 等待 Twitter widgets 加载完成
        setTimeout(() => {
          if ((window as any).twttr?.widgets) {
            (window as any).twttr.widgets.load()
          }
          setLoading(false)
        }, 1000)
      }
      script.onerror = () => {
        setError(true)
        setLoading(false)
      }
      document.body.appendChild(script)
      
      return () => {
        // 清理脚本
        const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')
        if (existingScript) {
          existingScript.remove()
        }
      }
    }
  }, [isOpen, username])

  if (!isOpen) return null

  // Twitter 时间线嵌入 URL
  const timelineUrl = `https://twitter.com/${username}`

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100000] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--card-bg)] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col border border-[var(--border-hover)] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">@{username}</h2>
              <p className="text-xs text-[var(--text-muted)]">最新推文</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={timelineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              title="在 X 中打开"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-[var(--text-muted)]">加载推文中...</p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-[var(--text-muted)]">加载失败</p>
              <a
                href={timelineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 text-sm"
              >
                在 X 中查看 →
              </a>
            </div>
          )}
          
          {/* Twitter 嵌入时间线 */}
          <div className={`h-[500px] overflow-y-auto ${loading ? 'hidden' : ''}`}>
            <a
              className="twitter-timeline"
              data-theme="dark"
              data-chrome="noheader nofooter noborders transparent"
              data-tweet-limit="5"
              href={`https://twitter.com/${username}?ref_src=twsrc%5Etfw`}
            >
              加载 @{username} 的推文
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <p className="text-xs text-[var(--text-muted)] text-center">
            由 X (Twitter) 提供 · 
            <a 
              href={timelineUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 ml-1"
            >
              查看完整时间线
            </a>
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
