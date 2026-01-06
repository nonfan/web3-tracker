import { useState } from 'react'
import { Search, Download, X, Loader2, Clock } from 'lucide-react'
import { searchToken, getTokenPriceHistory, getTokenInfo } from '../utils/coinGeckoApi'
import { getCachedPriceData, setCachedPriceData, getCacheTimeLeft } from '../utils/priceDataCache'
import { createPortal } from 'react-dom'

interface Props {
  isOpen: boolean
  onClose: () => void
  onImport: (coinGeckoId: string, priceHistory: any[], currentPrice?: number) => void
  tokenName?: string
}

export function TokenPriceImporter({ isOpen, onClose, onImport, tokenName }: Props) {
  const [searchQuery, setSearchQuery] = useState(tokenName || '')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [importingCoinId, setImportingCoinId] = useState<string | null>(null)
  const [selectedDays, setSelectedDays] = useState<number | 'max'>(365)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await searchToken(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleImport = async (coinId: string) => {
    setImportingCoinId(coinId)
    try {
      // 先检查缓存
      const cached = getCachedPriceData(coinId, selectedDays)

      if (cached) {
        // 使用缓存数据
        console.log('使用缓存的价格数据')
        onImport(coinId, cached.priceHistory, cached.currentPrice)
        onClose()
        return
      }

      // 缓存不存在或已过期，从 API 获取
      console.log('从 API 获取价格数据')
      const priceHistory = await getTokenPriceHistory(coinId, selectedDays)
      const tokenInfo = await getTokenInfo(coinId)

      // 保存到缓存
      if (tokenInfo?.currentPrice) {
        setCachedPriceData(coinId, selectedDays, priceHistory, tokenInfo.currentPrice)
      }

      onImport(coinId, priceHistory, tokenInfo?.currentPrice)
      onClose()
    } catch (error) {
      console.error('导入失败:', error)
      alert('导入价格数据失败，请稍后重试')
    } finally {
      setImportingCoinId(null)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-2xl p-5 w-full max-w-2xl border border-[var(--border-hover)] shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            导入真实价格数据
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 说明 */}
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400">
          <p>使用 CoinGecko API 获取真实的代币价格数据（免费，无需 API key）</p>
          <p className="mt-1 text-xs">💡 数据会缓存1小时，避免频繁请求。免费 API 最多支持 365 天历史数据</p>
        </div>

        {/* 搜索框 */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索代币名称或符号 (如: Bitcoin, BTC)"
              className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 text-[var(--text-primary)]"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              搜索
            </button>
          </div>
        </div>

        {/* 时间范围选择 */}
        <div className="mb-4">
          <label className="block text-xs text-[var(--text-muted)] mb-2">选择时间范围</label>
          <div className="flex gap-2 flex-wrap">
            {[7, 14, 30, 90, 180, 365, 'max'].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedDays(days as number | 'max')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedDays === days
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                  }`}
              >
                {days === 'max' ? '最大(365天)' : `${days}天`}
              </button>
            ))}
          </div>
        </div>

        {/* 搜索结果 */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {searchResults.length === 0 && !isSearching && (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              搜索代币以导入价格数据
            </div>
          )}

          {searchResults.map((token) => {
            const cacheTimeLeft = getCacheTimeLeft(token.id, selectedDays)
            const hasCachedData = cacheTimeLeft !== null

            return (
              <div
                key={token.id}
                className="flex items-center gap-3 p-3 bg-[var(--input-bg)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <img
                  src={token.thumb}
                  alt={token.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--text-primary)]">{token.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">{token.symbol}</span>
                    {hasCachedData && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <Clock className="w-3 h-3" />
                        缓存 {cacheTimeLeft}分钟
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleImport(token.id)}
                  disabled={importingCoinId === token.id}
                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
                >
                  {importingCoinId === token.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {hasCachedData ? '使用缓存' : '导入'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          取消
        </button>
      </div>
    </div>,
    document.body
  )
}
