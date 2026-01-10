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
    if (isOpen && username) {
      setLoading(true)
      setError(false)
      
      // 清理之前的 widget
      const container = document.getElementById('twitter-timeline-container')
      if (container) {
        container.innerHTML = ''
      }
      
      // 加载 Twitter 嵌入脚本
      const loadTwitterWidget = () => {
        if ((window as any).twttr?.widgets) {
          (window as any).twttr.widgets.createTimeline(
            {
              sourceType: 'profile',
              screenName: username
            },
            document.getElementById('twitter-timeline-container'),
            {
              theme: 'dark',
              chrome: 'noheader nofooter noborders transparent',
              tweetLimit: 5,
              width: '100%',
              height: 500,
              dnt: true
            }
          ).then(() => {
            setLoading(false)
          }).catch(() => {
            setError(true)
            setLoading(false)
          })
        }
      }
      
      // 检查脚本是否已加载
      if ((window as any).twttr?.widgets) {
        loadTwitterWidget()
      } else {
        const script = document.createElement('script')
        script.src = 'https://platform.twitter.com/widgets.js'
        script.async = true
        script.onload = () => {
          setTimeout(loadTwitterWidget, 500)
        }
        script.onerror = () => {
          setError(true)
          setLoading(false)
        }
        document.body.appendChild(script)
      }
    }
  }, [isOpen, username])

  if (!isOpen || !username) return null

  const timelineUrl = `https://x.com/${username}`

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100000] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#15202b] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col border border-[#38444d] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#38444d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">@{username}</h2>
              <p className="text-xs text-gray-500">最新推文</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={timelineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="在 X 中打开"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-[#15202b]">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <RefreshCw className="w-8 h-8 text-[#1d9bf0] animate-spin" />
              <p className="text-gray-400">加载推文中...</p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-gray-400">加载失败</p>
              <a
                href={timelineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1d9bf0] hover:text-[#1a8cd8] text-sm"
              >
                在 X 中查看 →
              </a>
            </div>
          )}
          
          {/* Twitter 嵌入时间线容器 */}
          <div 
            id="twitter-timeline-container"
            className={`h-[500px] overflow-y-auto ${loading ? 'hidden' : ''}`}
            style={{ 
              colorScheme: 'dark',
              backgroundColor: '#15202b'
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#38444d] bg-[#192734]">
          <p className="text-xs text-gray-500 text-center">
            由 X (Twitter) 提供 · 
            <a 
              href={timelineUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#1d9bf0] hover:text-[#1a8cd8] ml-1"
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
