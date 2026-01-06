import { useState, useEffect } from 'react'
import { Database, Trash2, RefreshCw, X } from 'lucide-react'
import { getCacheStats, clearAllCache, cleanExpiredCache } from '../utils/priceDataCache'
import { Tooltip } from './Tooltip'
import { createPortal } from 'react-dom'

export function CacheManager() {
  const [showDialog, setShowDialog] = useState(false)
  const [stats, setStats] = useState(getCacheStats())

  const refreshStats = () => {
    setStats(getCacheStats())
  }

  useEffect(() => {
    if (showDialog) {
      refreshStats()
    }
  }, [showDialog])

  const handleCleanExpired = () => {
    cleanExpiredCache()
    refreshStats()
  }

  const handleClearAll = () => {
    if (confirm('确定要清除所有价格数据缓存吗？')) {
      clearAllCache()
      refreshStats()
    }
  }

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '--'
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Tooltip content="缓存管理">
        <button
          onClick={() => setShowDialog(true)}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-colors"
        >
          <Database className="w-4 h-4" />
        </button>
      </Tooltip>

      {showDialog && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 w-full max-w-md border border-[var(--border-hover)] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Database className="w-5 h-5" />
                缓存管理
              </h3>
              <button
                onClick={() => setShowDialog(false)}
                className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 统计信息 */}
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-[var(--input-bg)] rounded-xl">
                <div className="text-xs text-[var(--text-muted)] mb-1">缓存数量</div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.totalCached} 个
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--input-bg)] rounded-xl">
                  <div className="text-xs text-[var(--text-muted)] mb-1">缓存大小</div>
                  <div className="text-lg font-semibold text-[var(--text-primary)]">
                    {stats.cacheSize}
                  </div>
                </div>

                <div className="p-3 bg-[var(--input-bg)] rounded-xl">
                  <div className="text-xs text-[var(--text-muted)] mb-1">有效期</div>
                  <div className="text-lg font-semibold text-[var(--text-primary)]">
                    1 小时
                  </div>
                </div>
              </div>

              {stats.oldestCache && (
                <div className="p-3 bg-[var(--input-bg)] rounded-xl">
                  <div className="text-xs text-[var(--text-muted)] mb-1">最早缓存时间</div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {formatTime(stats.oldestCache)}
                  </div>
                </div>
              )}
            </div>

            {/* 说明 */}
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400">
              <p>💡 价格数据会自动缓存1小时，避免频繁请求 API</p>
              <p className="mt-1">过期的缓存会在应用启动时自动清理</p>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={handleCleanExpired}
                className="flex-1 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                清理过期
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                清除全部
              </button>
            </div>

            <button
              onClick={() => setShowDialog(false)}
              className="mt-3 w-full py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              关闭
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
