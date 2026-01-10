import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, DollarSign, TrendingUp, List, Trash2, Settings, RefreshCw } from 'lucide-react'
import type { Project, TransactionType } from '../../types'
import { formatCurrency, formatTokenAmount } from '../../utils/numberFormat'
import { formatDate, type FinanceData } from './cardUtils'
import { Tooltip } from '../Tooltip'
import { TokenPriceChart } from '../TokenPriceChart'
import gsap from 'gsap'

// Transaction Panel Props
interface TransactionPanelProps {
  isOpen: boolean
  position: { top: number; left: number }
  isToken: boolean
  transactionType: TransactionType
  transactionAmount: string
  transactionNote: string
  currentHoldings: number
  onTypeChange: (type: TransactionType) => void
  onAmountChange: (amount: string) => void
  onNoteChange: (note: string) => void
  onSubmit: () => void
  onClose: () => void
  popupRef: React.RefObject<HTMLDivElement>
}

export function TransactionPanel({
  isOpen, position, isToken, transactionType, transactionAmount, transactionNote,
  currentHoldings, onTypeChange, onAmountChange, onNoteChange, onSubmit, onClose, popupRef
}: TransactionPanelProps) {
  useEffect(() => {
    if (isOpen && popupRef.current) {
      gsap.fromTo(popupRef.current,
        { opacity: 0, y: -8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [isOpen, popupRef])

  if (!isOpen) return null

  const sellAmount = parseFloat(transactionNote)
  const exceedsHoldings = !isNaN(sellAmount) && sellAmount > currentHoldings
  const canSubmit = transactionAmount && parseFloat(transactionAmount) !== 0 &&
    (!isToken || transactionNote.trim()) &&
    !(isToken && transactionType === 'profit' && (currentHoldings <= 0 || exceedsHoldings))

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[100] p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] shadow-2xl w-72"
      style={{ top: position.top, left: position.left, opacity: 0 }}
    >
      <div className="flex gap-1 mb-3 p-1 bg-[var(--input-bg)] rounded-lg">
        <button
          onClick={() => onTypeChange('investment')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            transactionType === 'investment' ? 'bg-amber-500/20 text-amber-400' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {isToken ? '买入' : '投入'}
        </button>
        <button
          onClick={() => onTypeChange('profit')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            transactionType === 'profit' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {isToken ? '卖出' : '收益'}
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">金额 (USD)</label>
          <input
            type="number"
            value={transactionAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500/50 text-[var(--text-primary)]"
            placeholder="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">
            {isToken ? (transactionType === 'investment' ? <>购买数量 <span className="text-red-400">*</span></> : <>卖出数量 <span className="text-red-400">*</span></>) : '备注 (可选)'}
          </label>
          {isToken && transactionType === 'profit' && (
            <div className="mb-2 p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <div className="text-xs text-violet-400">
                {currentHoldings > 0 ? <>当前可卖出额度: <span className="font-medium">{formatTokenAmount(currentHoldings)}个</span></> : <span className="text-amber-400">暂无持仓，无法卖出</span>}
              </div>
            </div>
          )}
          <input
            type="text"
            value={transactionNote}
            onChange={(e) => onNoteChange(e.target.value)}
            disabled={isToken && transactionType === 'profit' && currentHoldings <= 0}
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500/50 text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={isToken ? (transactionType === 'investment' ? '如：1000 个代币' : currentHoldings > 0 ? `如：500 个代币 (最多 ${formatTokenAmount(currentHoldings)}个)` : '暂无持仓，无法卖出') : '如：空投领取、Gas费等'}
            required={isToken}
          />
          {isToken && transactionType === 'profit' && exceedsHoldings && (
            <div className="mt-1 text-xs text-red-400">卖出数量不能超过持有数量 ({formatTokenAmount(currentHoldings)}个)</div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">取消</button>
        <button onClick={onSubmit} disabled={!canSubmit} className="flex-1 py-2 text-xs bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">添加记录</button>
      </div>
    </div>,
    document.body
  )
}


// Delete Confirm Props
interface DeleteConfirmProps {
  isOpen: boolean
  position: { top: number; left: number }
  projectName: string
  onConfirm: () => void
  onClose: () => void
  popupRef: React.RefObject<HTMLDivElement>
}

export function DeleteConfirm({ isOpen, position, projectName, onConfirm, onClose, popupRef }: DeleteConfirmProps) {
  useEffect(() => {
    if (isOpen && popupRef.current) {
      gsap.fromTo(popupRef.current,
        { opacity: 0, y: -8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [isOpen, popupRef])

  if (!isOpen) return null

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[100] p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] shadow-2xl w-72"
      style={{ top: position.top, left: position.left, opacity: 0 }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">删除项目</h3>
          <p className="text-xs text-[var(--text-secondary)]">确定要删除「{projectName}」吗？此操作无法撤销。</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">取消</button>
        <button onClick={onConfirm} className="flex-1 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">删除</button>
      </div>
    </div>,
    document.body
  )
}

// Transaction List Modal Props
interface TransactionListModalProps {
  isOpen: boolean
  project: Project
  isToken: boolean
  finance: FinanceData
  onDeleteTransaction: (transactionId: string) => void
  onClose: () => void
}

export function TransactionListModal({ isOpen, project, isToken, finance, onDeleteTransaction, onClose }: TransactionListModalProps) {
  if (!isOpen) return null

  const { totalInvestment, totalProfit, currentHoldings, currentValue } = finance

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-md border border-[var(--border-hover)] shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">{project.name} - 交易记录</h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className={`grid ${isToken && currentHoldings > 0 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'} gap-3 mb-4`}>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="text-xs text-amber-400 mb-1">总投入</div>
            <div className="text-lg font-bold text-amber-400">{formatCurrency(totalInvestment)}</div>
          </div>
          <div className={`p-3 rounded-xl ${totalProfit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <div className={`text-xs ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} mb-1`}>{isToken ? '已实现收益' : '总收益'}</div>
            <div className={`text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}</div>
          </div>
          {isToken && currentHoldings > 0 && (
            <>
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <div className="text-xs text-violet-400 mb-1">持有数量</div>
                <div className="text-lg font-bold text-violet-400">{formatTokenAmount(currentHoldings)}</div>
                <div className="text-xs text-violet-400/70">个代币</div>
              </div>
              {currentValue > 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="text-xs text-blue-400 mb-1">当前市值</div>
                  <div className="text-lg font-bold text-blue-400">{formatCurrency(currentValue)}</div>
                  {isToken && 'currentPrice' in project && (project as any).currentPrice && (
                    <div className="text-xs text-blue-400/70">@${(project as any).currentPrice.toFixed(6)}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {(project.transactions || []).length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--input-bg)] flex items-center justify-center">
                <List className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <p>暂无交易记录</p>
            </div>
          ) : (
            [...(project.transactions || [])].reverse().map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-4 bg-[var(--input-bg)] rounded-xl group hover:bg-[var(--bg-secondary)] transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'investment' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {t.type === 'investment' ? <DollarSign className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${t.type === 'investment' ? 'text-amber-400' : t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'investment' ? '-' : t.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(t.amount))}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{formatDate(t.createdAt)}</span>
                  </div>
                  {t.note && (
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {isToken ? (() => { const num = parseFloat(t.note); return isNaN(num) ? t.note : formatTokenAmount(num) + '个' })() : t.note}
                    </div>
                  )}
                </div>
                <button onClick={() => onDeleteTransaction(t.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="mt-6 w-full py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors font-medium">关闭</button>
      </div>
    </div>,
    document.body
  )
}


// Price Chart Modal Props
interface PriceChartModalProps {
  isOpen: boolean
  project: Project
  isRefreshingPrice: boolean
  onRefreshPrice: () => void
  onOpenImporter: () => void
  onClose: () => void
}

export function PriceChartModal({ isOpen, project, isRefreshingPrice, onRefreshPrice, onOpenImporter, onClose }: PriceChartModalProps) {
  if (!isOpen) return null

  const hasCoingeckoId = 'coingeckoId' in project && (project as any).coingeckoId
  const priceHistory = (project as any).priceHistory || []

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-2xl p-5 w-full max-w-2xl border border-[var(--border-hover)] shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{project.name} - 价格走势</h3>
          <div className="flex items-center gap-2">
            <Tooltip content="导入价格数据">
              <button onClick={onOpenImporter} className="p-2 rounded-lg transition-colors hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-violet-400">
                <Settings className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content={!hasCoingeckoId ? '请先导入真实数据' : '刷新价格数据'}>
              <button
                onClick={onRefreshPrice}
                disabled={isRefreshingPrice || !hasCoingeckoId}
                className={`p-2 rounded-lg transition-colors ${isRefreshingPrice || !hasCoingeckoId ? 'text-[var(--text-muted)] cursor-not-allowed opacity-50' : 'hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-emerald-400'}`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingPrice ? 'animate-spin' : ''}`} />
              </button>
            </Tooltip>
            <button onClick={onClose} className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {(project as any).lastPriceUpdate && (
          <div className="mb-3 text-xs text-[var(--text-muted)]">最后更新: {new Date((project as any).lastPriceUpdate).toLocaleString('zh-CN')}</div>
        )}

        <div className="relative">
          {isRefreshingPrice && (
            <div className="absolute inset-0 bg-[var(--card-bg)] flex flex-col items-center justify-center h-64 space-y-4 z-10 rounded-xl">
              <RefreshCw className="w-12 h-12 text-violet-400 animate-spin" />
              <div className="text-[var(--text-secondary)]">正在获取价格数据...</div>
              <div className="text-xs text-[var(--text-muted)]">使用 CoinGecko API 获取最新数据</div>
            </div>
          )}

          {!isRefreshingPrice && !hasCoingeckoId && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--card-bg)]/80 to-[var(--card-bg)] flex flex-col items-center justify-center z-10 rounded-xl">
              <div className="text-center space-y-4 p-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-violet-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">未连接真实数据源</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">当前显示的是示例数据，点击设置按钮导入真实价格数据</p>
                  <button onClick={onOpenImporter} className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors inline-flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    导入真实数据
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={`transition-all duration-300 ${isRefreshingPrice ? 'opacity-30 scale-95' : !hasCoingeckoId ? 'opacity-20 blur-sm' : 'opacity-100 scale-100'}`}>
            <TokenPriceChart priceHistory={priceHistory} />
          </div>
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">关闭</button>
      </div>
    </div>,
    document.body
  )
}
