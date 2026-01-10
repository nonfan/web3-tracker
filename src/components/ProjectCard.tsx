import { useState, useRef, useEffect, useMemo } from 'react'
import type { Project, TransactionType } from '../types'
import { useStore } from '../store/useStore'
import { Pencil, Trash2, Globe, MessageCircle, Plus, X, Check, Clock, Flag, DollarSign, TrendingUp, List, Archive, ArchiveRestore, RefreshCw, Settings, ExternalLink, MessageSquare } from 'lucide-react'
import { ConfirmDialog } from './ConfirmDialog'
import { Favicon } from './Favicon'
import { Tooltip } from './Tooltip'
import { ContextMenu } from './ContextMenu'
import { TokenPriceChart } from './TokenPriceChart'
import { TokenPriceImporter } from './TokenPriceImporter'
import { getTokenPriceHistory, getTokenInfo } from '../utils/coinGeckoApi'
import { setCachedPriceData } from '../utils/priceDataCache'
import { formatTokenAmount, formatCurrency } from '../utils/numberFormat'
import { createPortal } from 'react-dom'
import gsap from 'gsap'

const priorityConfig = {
  high: { bg: 'bg-red-500/20', text: 'text-red-400', label: '高' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '中' },
  low: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '低' },
}

interface Props {
  project: Project
  onEdit: () => void
  onArchive?: (archived: boolean) => void
  selected?: boolean
  onSelect?: (id: string) => void
  selectionMode?: boolean
  dragHandleProps?: any
}

function formatDeadline(timestamp: number): { text: string; urgent: boolean } {
  const now = Date.now()
  const diff = timestamp - now
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (diff < 0) return { text: '已过期', urgent: true }
  if (days === 0) return { text: '今天', urgent: true }
  if (days === 1) return { text: '明天', urgent: true }
  if (days <= 7) return { text: `${days}天后`, urgent: true }
  if (days <= 30) return { text: `${days}天后`, urgent: false }
  return { text: new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }), urgent: false }
}

export function ProjectCard({ project, onEdit, onArchive, selected, onSelect, selectionMode, dragHandleProps }: Props) {
  const [newTask, setNewTask] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTransactionPanel, setShowTransactionPanel] = useState(false)

  // 判断是否是代币（Token 有 symbol 字段）
  const isToken = 'symbol' in project

  // 根据类型动态设置状态配置
  const statusConfig = useMemo(() => ({
    research: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      label: '研究中'
    },
    active: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      label: isToken ? '研究中' : '交互中'
    },
    completed: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      dot: 'bg-blue-400',
      label: isToken ? '已卖币' : '已完成'
    },
    launched: {
      bg: 'bg-violet-500/20',
      text: 'text-violet-400',
      dot: 'bg-violet-400',
      label: isToken ? '已买币' : '已发币'
    },
    dead: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      dot: 'bg-gray-400',
      label: isToken ? '已归零' : '已凉'
    },
    archived: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      dot: 'bg-slate-400',
      label: '已归档'
    },
  }), [isToken])
  const [showTransactionList, setShowTransactionList] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showPriceChart, setShowPriceChart] = useState(false)
  const [showPriceImporter, setShowPriceImporter] = useState(false)
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>('investment')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionNote, setTransactionNote] = useState('')
  const { addTask, toggleTask, deleteTask, deleteProject, deleteToken, updateProject, updateToken, addTransaction, deleteTransaction, addTokenTransaction, deleteTokenTransaction } = useStore()

  const profitButtonRef = useRef<HTMLButtonElement>(null)
  const profitPopupRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const deletePopupRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [deletePopupPosition, setDeletePopupPosition] = useState({ top: 0, left: 0 })

  const completedTasks = (project.tasks || []).filter((t) => t.completed).length
  const totalTasks = (project.tasks || []).length
  const status = statusConfig[project.status] || statusConfig.active
  const priority = project.priority ? priorityConfig[project.priority] : priorityConfig.medium
  const deadline = project.deadline ? formatDeadline(project.deadline) : null

  // 计算总投入和总收益
  const { totalInvestment, totalProfit, currentHoldings, currentValue } = useMemo(() => {
    const transactions = project.transactions || []
    let investment = 0
    let profit = 0
    let holdings = 0 // 当前持有数量

    // 兼容旧数据
    if (transactions.length === 0) {
      investment = project.investment || 0
      profit = project.profit || 0
      return { totalInvestment: investment, totalProfit: profit, currentHoldings: 0, currentValue: 0 }
    }

    // 计算投入、收益和持有数量
    for (const t of transactions) {
      if (t.type === 'investment') {
        investment += t.amount
        // 从备注中提取数量，支持多种格式
        if (t.note && isToken) {
          // 尝试多种格式：1000 个代币、1000个、1000 tokens、纯数字
          const patterns = [
            /(\d+(?:\.\d+)?)\s*个/,
            /(\d+(?:\.\d+)?)\s*tokens?/i,
            /^(\d+(?:\.\d+)?)$/
          ]
          
          for (const pattern of patterns) {
            const match = t.note.match(pattern)
            if (match) {
              holdings += parseFloat(match[1])
              break
            }
          }
        }
      } else {
        profit += t.amount
        // 从备注中提取卖出数量
        if (t.note && isToken) {
          const patterns = [
            /(\d+(?:\.\d+)?)\s*个/,
            /(\d+(?:\.\d+)?)\s*tokens?/i,
            /^(\d+(?:\.\d+)?)$/
          ]
          
          for (const pattern of patterns) {
            const match = t.note.match(pattern)
            if (match) {
              holdings -= parseFloat(match[1])
              break
            }
          }
        }
      }
    }

    // 调试信息 - 总是输出，不管是否是代币
    if (isToken) {
      console.log(`代币 ${project.name} 详细信息:`, {
        isToken,
        hasCurrentPrice: 'currentPrice' in project,
        currentPrice: (project as any).currentPrice,
        holdings,
        investment,
        profit,
        transactions: transactions.map(t => ({ type: t.type, amount: t.amount, note: t.note }))
      })
    }

    // 对于代币，收益只计算已实现收益（卖出获得的金额）
    if (isToken && 'currentPrice' in project && (project as any).currentPrice) {
      const currentPrice = (project as any).currentPrice
      const currentValue = holdings * currentPrice
      
      // 收益计算调试信息
      console.log(`代币 ${project.name} 收益计算:`, {
        holdings: `${holdings}个`,
        currentPrice: `$${currentPrice}`,
        currentValue: `$${currentValue.toFixed(2)}`,
        investment: `$${investment}`,
        realizedProfit: `$${profit}`, // 只显示已实现收益
        note: '收益只计算卖出获得的金额，不包括未实现收益'
      })
      
      return { 
        totalInvestment: investment, 
        totalProfit: profit, // 只返回已实现收益
        currentHoldings: holdings,
        currentValue: currentValue
      }
    }

    return { totalInvestment: investment, totalProfit: profit, currentHoldings: holdings, currentValue: 0 }
  }, [project.transactions, project.investment, project.profit, isToken, project])

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTask.trim()) {
      addTask(project.id, newTask.trim())
      setNewTask('')
    }
  }

  const handleOpenTransactionPanel = () => {
    if (showTransactionPanel) {
      setShowTransactionPanel(false)
      return
    }
    setTransactionType('investment')
    setTransactionAmount('')
    setTransactionNote('')

    // 计算弹窗位置
    if (profitButtonRef.current) {
      const rect = profitButtonRef.current.getBoundingClientRect()
      setPopupPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.left - 120)
      })
    }
    setShowTransactionPanel(true)
  }

  const handleOpenDeleteConfirm = () => {
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false)
      return
    }

    // 计算弹窗位置
    if (deleteButtonRef.current) {
      const rect = deleteButtonRef.current.getBoundingClientRect()
      setDeletePopupPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.left - 120)
      })
    }
    setShowDeleteConfirm(true)
  }

  // 点击外部关闭
  useEffect(() => {
    if (!showTransactionPanel) return
    const handleClickOutside = (e: MouseEvent) => {
      if (profitPopupRef.current && !profitPopupRef.current.contains(e.target as Node) &&
        profitButtonRef.current && !profitButtonRef.current.contains(e.target as Node)) {
        setShowTransactionPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showTransactionPanel])

  // 点击外部关闭删除确认
  useEffect(() => {
    if (!showDeleteConfirm) return
    const handleClickOutside = (e: MouseEvent) => {
      if (deletePopupRef.current && !deletePopupRef.current.contains(e.target as Node) &&
        deleteButtonRef.current && !deleteButtonRef.current.contains(e.target as Node)) {
        setShowDeleteConfirm(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDeleteConfirm])

  // 弹窗动画
  useEffect(() => {
    if (showTransactionPanel && profitPopupRef.current) {
      gsap.fromTo(profitPopupRef.current,
        { opacity: 0, y: -8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [showTransactionPanel])

  // 删除确认弹窗动画
  useEffect(() => {
    if (showDeleteConfirm && deletePopupRef.current) {
      gsap.fromTo(deletePopupRef.current,
        { opacity: 0, y: -8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [showDeleteConfirm])

  const handleAddTransaction = () => {
    const amount = parseFloat(transactionAmount)
    if (isNaN(amount) || amount === 0) return
    // 代币时，买入和卖出的数量都为必填；项目时，备注可选
    if (isToken && !transactionNote.trim()) return

    // 代币卖出时验证数量不能超过持有量
    if (isToken && transactionType === 'profit') {
      const sellAmount = parseFloat(transactionNote)
      if (!isNaN(sellAmount) && sellAmount > currentHoldings) {
        // 可以在这里添加错误提示，但UI已经有提示了
        return
      }
    }

    if (isToken) {
      addTokenTransaction(project.id, transactionType, amount, transactionNote || undefined)
    } else {
      addTransaction(project.id, transactionType, amount, transactionNote || undefined)
    }
    setTransactionAmount('')
    setTransactionNote('')
    setShowTransactionPanel(false)
  }

  // 导入真实价格数据
  const handleImportPriceData = (coinGeckoId: string, priceHistory: any[], currentPrice?: number) => {
    if (!isToken || !('priceHistory' in project)) return

    console.log('更新价格数据:', {
      coinGeckoId,
      priceHistoryLength: priceHistory.length,
      currentPrice,
      projectId: project.id,
      isToken
    })

    // 使用 updateToken 而不是 updateProject
    updateToken(project.id, {
      currentPrice: currentPrice,
      coingeckoId: coinGeckoId,
      lastPriceUpdate: Date.now(),
      priceHistory: priceHistory  // 直接设置新的价格历史，替换旧数据
    } as any)

    console.log('价格数据已更新')
  }

  // 点击价格走势按钮
  const handleShowPriceChart = async () => {
    if (!isToken) return

    // 检查是否有 coingeckoId
    const hasCoingeckoId = 'coingeckoId' in project && (project as any).coingeckoId

    if (!hasCoingeckoId) {
      // 没有 coingeckoId，直接打开导入器
      setShowPriceImporter(true)
      return
    }

    // 有 coingeckoId，检查是否有价格数据
    const hasPriceData = (project as any).priceHistory && (project as any).priceHistory.length > 0

    // 打开图表
    setShowPriceChart(true)

    // 如果数据超过1小时，后台自动更新
    if (hasPriceData) {
      const coinGeckoId = (project as any).coingeckoId
      const lastUpdate = (project as any).lastPriceUpdate || 0
      const now = Date.now()
      const oneHour = 60 * 60 * 1000

      if (now - lastUpdate > oneHour) {
        setIsRefreshingPrice(true)
        try {
          const priceHistory = await getTokenPriceHistory(coinGeckoId, 365)
          const tokenInfo = await getTokenInfo(coinGeckoId)

          if (tokenInfo?.currentPrice) {
            setCachedPriceData(coinGeckoId, 365, priceHistory, tokenInfo.currentPrice)
          }

          handleImportPriceData(coinGeckoId, priceHistory, tokenInfo?.currentPrice)
        } catch (error) {
          console.error('更新价格失败:', error)
        } finally {
          setIsRefreshingPrice(false)
        }
      }
    }
  }

  // 手动刷新价格数据
  const handleRefreshPrice = async () => {
    if (!isToken || isRefreshingPrice) return

    const coinGeckoId = (project as any).coingeckoId
    if (!coinGeckoId) {
      // 没有 coingeckoId，打开导入器
      setShowPriceImporter(true)
      return
    }

    setIsRefreshingPrice(true)
    try {
      // 获取最新价格数据（365天）
      const priceHistory = await getTokenPriceHistory(coinGeckoId, 365)

      if (priceHistory && priceHistory.length > 0) {
        // 获取当前价格
        const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0

        // 更新缓存
        setCachedPriceData(coinGeckoId, 365, priceHistory, currentPrice)

        // 更新项目数据
        updateToken(project.id, {
          currentPrice,
          lastPriceUpdate: Date.now(),
          priceHistory
        })

        console.log('价格数据已刷新')
      }
    } catch (error) {
      console.error('刷新价格失败:', error)
    } finally {
      setIsRefreshingPrice(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      {...dragHandleProps}
      className={`bg-[var(--card-bg)] rounded-2xl p-5 border transition-all group ${selected ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-[var(--border)] hover:border-[var(--border-hover)]'
        } ${dragHandleProps ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={() => selectionMode && onSelect?.(project.id)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Logo - 优先使用自定义 logo，否则使用 Favicon */}
        {(project.logoUrl || project.website) && (
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-secondary)] flex items-center justify-center">
            {project.logoUrl ? (
              // 自定义 Logo
              project.logoUrl.trim().startsWith('<svg') ? (
                // SVG 代码
                <div
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: project.logoUrl }}
                />
              ) : (
                // 图片 URL
                <img
                  src={project.logoUrl}
                  alt={project.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 如果图片加载失败，隐藏图片
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )
            ) : (
              // 使用 Favicon
              <Favicon url={project.website!} name={project.name} size={36} />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {selectionMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.(project.id)
                }}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected ? 'bg-violet-500 border-violet-500' : 'border-gray-600'
                  }`}
              >
                {selected && <Check className="w-3 h-3 text-white" />}
              </button>
            )}
            <h3 className="text-lg font-semibold truncate text-[var(--text-primary)]">{project.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            {project.priority === 'high' && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${priority.bg} ${priority.text}`}>
                <Flag className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
        {!selectionMode && (
          <div className={`flex gap-1 transition-opacity ${showTransactionPanel || showDeleteConfirm ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {/* 代币价格更新按钮 */}
            {isToken && (
              <Tooltip content={isRefreshingPrice ? "更新中..." : "刷新价格数据"}>
                <button
                  onClick={handleRefreshPrice}
                  disabled={isRefreshingPrice}
                  className={`p-2 rounded-lg transition-colors ${isRefreshingPrice
                    ? 'bg-blue-500/20 text-blue-400 cursor-not-allowed'
                    : 'hover:bg-blue-500/10 text-[var(--text-muted)] hover:text-blue-400'
                    }`}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingPrice ? 'animate-spin' : ''}`} />
                </button>
              </Tooltip>
            )}
            <Tooltip content="记录收益">
              <button
                ref={profitButtonRef}
                onClick={handleOpenTransactionPanel}
                className={`p-2 rounded-lg transition-colors ${showTransactionPanel
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'hover:bg-emerald-500/10 text-[var(--text-muted)] hover:text-emerald-400'
                  }`}
              >
                <DollarSign className="w-4 h-4" />
              </button>
            </Tooltip>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              ref={deleteButtonRef}
              onClick={handleOpenDeleteConfirm}
              className={`p-2 rounded-lg transition-colors ${showDeleteConfirm
                ? 'bg-red-500/20 text-red-400'
                : 'hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400'
                }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Description - 独立一行，与标题对齐 */}
      {project.description && (
        <Tooltip content={project.description}>
          <div className={`mb-2 w-full ${(project.logoUrl || project.website) ? 'pl-[48px]' : ''}`}>
            <p className="text-sm text-[var(--text-secondary)] cursor-default truncate">
              {project.description}
            </p>
          </div>
        </Tooltip>
      )}

      {/* Chain - 代币显示所属链 */}
      {isToken && 'chain' in project && project.chain && (
        <div className={`mb-3 w-full ${(project.logoUrl || project.website) ? 'pl-[48px]' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs text-violet-400">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="font-medium">{(project as any).chain}</span>
            </div>
            {/* 代币价格图表按钮 */}
            <button
              onClick={handleShowPriceChart}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-medium">价格走势</span>
            </button>
          </div>
        </div>
      )}

      {/* Deadline & Investment/Profit */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        {deadline && (
          <div className={`flex items-center gap-1.5 ${deadline.urgent ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>截止: {deadline.text}</span>
          </div>
        )}
        {totalInvestment > 0 ? (
          <div className="flex items-center gap-1 text-[var(--text-muted)]">
            <DollarSign className="w-3.5 h-3.5" />
            <span>投入: {formatCurrency(totalInvestment)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[var(--text-muted)] opacity-50">
            <DollarSign className="w-3.5 h-3.5" />
            <span>投入: --</span>
          </div>
        )}
        {totalProfit !== 0 ? (
          <div className={`flex items-center gap-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isToken ? '已实现: ' : '收益: '}{totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[var(--text-muted)] opacity-50">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isToken ? '已实现: --' : '收益: --'}</span>
          </div>
        )}
        {/* 查看记录按钮 */}
        {(project.transactions?.length || 0) > 0 && (
          <button
            onClick={() => setShowTransactionList(true)}
            className="flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            <span>{project.transactions?.length}笔</span>
          </button>
        )}
      </div>

      {/* 交易记录弹窗 - Portal */}
      {showTransactionPanel && createPortal(
        <div
          ref={profitPopupRef}
          className="fixed z-[100] p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] shadow-2xl w-72"
          style={{ top: popupPosition.top, left: popupPosition.left, opacity: 0 }}
        >
          <div className="flex gap-1 mb-3 p-1 bg-[var(--input-bg)] rounded-lg">
            <button
              onClick={() => setTransactionType('investment')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${transactionType === 'investment'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
            >
              {isToken ? '买入' : '投入'}
            </button>
            <button
              onClick={() => setTransactionType('profit')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${transactionType === 'profit'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
            >
              {isToken ? '卖出' : '收益'}
            </button>
          </div>

          <div className="space-y-2 mb-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                金额 (USD)
              </label>
              <input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500/50 text-[var(--text-primary)]"
                placeholder="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                {isToken ? (
                  transactionType === 'investment' ? (
                    <>购买数量 <span className="text-red-400">*</span></>
                  ) : (
                    <>卖出数量 <span className="text-red-400">*</span></>
                  )
                ) : (
                  '备注 (可选)'
                )}
              </label>
              {/* 卖出时显示当前可用额度 */}
              {isToken && transactionType === 'profit' && (
                <div className="mb-2 p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                  <div className="text-xs text-violet-400">
                    {currentHoldings > 0 ? (
                      <>当前可卖出额度: <span className="font-medium">{formatTokenAmount(currentHoldings)}个</span></>
                    ) : (
                      <span className="text-amber-400">暂无持仓，无法卖出</span>
                    )}
                  </div>
                </div>
              )}
              <input
                type="text"
                value={transactionNote}
                onChange={(e) => setTransactionNote(e.target.value)}
                disabled={isToken && transactionType === 'profit' && currentHoldings <= 0}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500/50 text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={
                  isToken
                    ? transactionType === 'investment'
                      ? '如：1000 个代币'
                      : currentHoldings > 0 
                        ? `如：500 个代币 (最多 ${formatTokenAmount(currentHoldings)}个)`
                        : '暂无持仓，无法卖出'
                    : '如：空投领取、Gas费等'
                }
                required={isToken}
              />
              {/* 卖出数量验证提示 */}
              {isToken && transactionType === 'profit' && transactionNote && (() => {
                const sellAmount = parseFloat(transactionNote)
                return !isNaN(sellAmount) && sellAmount > currentHoldings ? (
                  <div className="mt-1 text-xs text-red-400">
                    卖出数量不能超过持有数量 ({formatTokenAmount(currentHoldings)}个)
                  </div>
                ) : null
              })()}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowTransactionPanel(false)}
              className="flex-1 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAddTransaction}
              disabled={
                !transactionAmount ||
                parseFloat(transactionAmount) === 0 ||
                (isToken && !transactionNote.trim()) ||
                // 代币卖出时，没有持仓或数量超过持有量
                (isToken && transactionType === 'profit' && (
                  currentHoldings <= 0 || (() => {
                    const sellAmount = parseFloat(transactionNote)
                    return !isNaN(sellAmount) && sellAmount > currentHoldings
                  })()
                ))
              }
              className="flex-1 py-2 text-xs bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              添加记录
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 删除确认弹窗 - Portal */}
      {showDeleteConfirm && createPortal(
        <div
          ref={deletePopupRef}
          className="fixed z-[100] p-4 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] shadow-2xl w-72"
          style={{ top: deletePopupPosition.top, left: deletePopupPosition.left, opacity: 0 }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">删除项目</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                确定要删除「{project.name}」吗？此操作无法撤销。
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2 text-xs bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (isToken) {
                  deleteToken(project.id)
                } else {
                  deleteProject(project.id)
                }
                setShowDeleteConfirm(false)
              }}
              className="flex-1 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              删除
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 交易记录列表弹窗 */}
      {showTransactionList && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-md border border-[var(--border-hover)] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {project.name} - 交易记录
              </h3>
              <button
                onClick={() => setShowTransactionList(false)}
                className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 汇总 */}
            <div className={`grid ${isToken && currentHoldings > 0 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'} gap-3 mb-4`}>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="text-xs text-amber-400 mb-1">总投入</div>
                <div className="text-lg font-bold text-amber-400">{formatCurrency(totalInvestment)}</div>
              </div>
              <div className={`p-3 rounded-xl ${totalProfit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <div className={`text-xs ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} mb-1`}>
                  {isToken ? '已实现收益' : '总收益'}
                </div>
                <div className={`text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                </div>
              </div>
              {/* 代币额外信息 */}
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
                        <div className="text-xs text-blue-400/70">
                          @${(project as any).currentPrice.toFixed(6)}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 记录列表 */}
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
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-4 bg-[var(--input-bg)] rounded-xl group hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'investment' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                      {t.type === 'investment' ? <DollarSign className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${t.type === 'investment' ? 'text-amber-400' : t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                          {t.type === 'investment' ? '-' : t.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(t.amount))}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">{formatDate(t.createdAt)}</span>
                      </div>
                      {t.note && (
                        <div className="text-xs text-[var(--text-muted)] truncate">
                          {isToken ? (() => {
                            const num = parseFloat(t.note)
                            return isNaN(num) ? t.note : formatTokenAmount(num) + '个'
                          })() : t.note}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (isToken) {
                          deleteTokenTransaction(project.id, t.id)
                        } else {
                          deleteTransaction(project.id, t.id)
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowTransactionList(false)}
              className="mt-6 w-full py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors font-medium"
            >
              关闭
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 价格图表弹窗 */}
      {showPriceChart && isToken && 'priceHistory' in project && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 w-full max-w-2xl border border-[var(--border-hover)] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {project.name} - 价格走势
              </h3>
              <div className="flex items-center gap-2">
                {/* 设置按钮 - 打开导入器 */}
                <Tooltip content="导入价格数据">
                  <button
                    onClick={() => {
                      setShowPriceChart(false)
                      setShowPriceImporter(true)
                    }}
                    className="p-2 rounded-lg transition-colors hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-violet-400"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </Tooltip>
                {/* 手动刷新按钮 */}
                <Tooltip content={
                  !('coingeckoId' in project && (project as any).coingeckoId)
                    ? '请先导入真实数据'
                    : '刷新价格数据'
                }>
                  <button
                    onClick={handleRefreshPrice}
                    disabled={isRefreshingPrice || !('coingeckoId' in project && (project as any).coingeckoId)}
                    className={`p-2 rounded-lg transition-colors ${isRefreshingPrice || !('coingeckoId' in project && (project as any).coingeckoId)
                      ? 'text-[var(--text-muted)] cursor-not-allowed opacity-50'
                      : 'hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-emerald-400'
                      }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingPrice ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
                <button
                  onClick={() => setShowPriceChart(false)}
                  className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 最后更新时间 */}
            {(project as any).lastPriceUpdate && (
              <div className="mb-3 text-xs text-[var(--text-muted)]">
                最后更新: {new Date((project as any).lastPriceUpdate).toLocaleString('zh-CN')}
              </div>
            )}

            {/* 图表容器 */}
            <div ref={chartContainerRef} className="relative">
              {/* 加载遮罩 */}
              {isRefreshingPrice && (
                <div className="absolute inset-0 bg-[var(--card-bg)] flex flex-col items-center justify-center h-64 space-y-4 z-10 rounded-xl">
                  <RefreshCw className="w-12 h-12 text-violet-400 animate-spin" />
                  <div className="text-[var(--text-secondary)]">正在获取价格数据...</div>
                  <div className="text-xs text-[var(--text-muted)]">使用 CoinGecko API 获取最新数据</div>
                </div>
              )}

              {/* 没有 coingeckoId 的提示遮罩 */}
              {!isRefreshingPrice && !('coingeckoId' in project && (project as any).coingeckoId) && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--card-bg)]/80 to-[var(--card-bg)] flex flex-col items-center justify-center z-10 rounded-xl">
                  <div className="text-center space-y-4 p-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center">
                      <Settings className="w-8 h-8 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                        未连接真实数据源
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)] mb-4">
                        当前显示的是示例数据，点击设置按钮导入真实价格数据
                      </p>
                      <button
                        onClick={() => {
                          setShowPriceChart(false)
                          setShowPriceImporter(true)
                        }}
                        className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        导入真实数据
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 图表 */}
              <div className={`transition-all duration-300 ${isRefreshingPrice
                ? 'opacity-30 scale-95'
                : !('coingeckoId' in project && (project as any).coingeckoId)
                  ? 'opacity-20 blur-sm'
                  : 'opacity-100 scale-100'
                }`}>
                <TokenPriceChart
                  priceHistory={(project as any).priceHistory || []}
                />
              </div>
            </div>

            <button
              onClick={() => setShowPriceChart(false)}
              className="mt-4 w-full py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              关闭
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-md text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="flex gap-2 mb-3">
        {project.website && (
          <a
            href={project.website}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            官网
          </a>
        )}
        {project.twitter && (
          <ContextMenu
            items={[
              {
                label: '打开主页',
                icon: <ExternalLink className="w-4 h-4" />,
                onClick: () => window.open(project.twitter, '_blank')
              },
              {
                label: '查看推文',
                icon: <MessageSquare className="w-4 h-4" />,
                onClick: () => {
                  // 从 twitter URL 提取用户名
                  const match = project.twitter?.match(/(?:twitter\.com|x\.com)\/([^/?]+)/)
                  const username = match ? match[1] : ''
                  if (username) {
                    window.open(`https://x.com/${username}`, '_blank')
                  }
                }
              }
            ]}
          >
            <a
              href={project.twitter}
              target="_blank"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter
            </a>
          </ContextMenu>
        )}
        {/* 代币显示区块浏览器，项目显示 Discord */}
        {isToken && 'blockchain' in project && (project as any).blockchain ? (
          <a
            href={(project as any).blockchain}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            区块浏览器
          </a>
        ) : (
          project.discord && (
            <a
              href={project.discord}
              target="_blank"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Discord
            </a>
          )
        )}
        {project.nftMarket && (
          <a
            href={project.nftMarket}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            NFT
          </a>
        )}
      </div>

      {/* 代币价格信息 - 24小时数据 */}
      {isToken ? (() => {
        const priceHistory = (project as any).priceHistory || []
        const currentPrice = (project as any).currentPrice || 0

        // 如果没有价格数据，显示占位符
        if (!currentPrice || priceHistory.length === 0) {
          return (
            <div className="mb-4 w-full">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-[var(--input-bg)] rounded-lg">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">当前价格</div>
                  <div className="text-sm font-bold text-[var(--text-muted)]">--</div>
                  <div className="text-xs text-[var(--text-muted)]">暂无数据</div>
                </div>
                <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <div className="text-xs text-emerald-400/70 mb-0.5">24h 最高</div>
                  <div className="text-sm font-semibold text-[var(--text-muted)]">--</div>
                </div>
                <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <div className="text-xs text-red-400/70 mb-0.5">24h 最低</div>
                  <div className="text-sm font-semibold text-[var(--text-muted)]">--</div>
                </div>
              </div>
            </div>
          )
        }

        // 获取最近24小时的数据
        const now = Date.now()
        const oneDayAgo = now - 24 * 60 * 60 * 1000
        const last24h = priceHistory.filter((p: any) => p.date >= oneDayAgo)

        if (last24h.length === 0) {
          // 如果没有24小时数据，使用全部数据
          const allPrices = priceHistory.map((p: any) => p.price)
          const high = Math.max(...allPrices)
          const low = Math.min(...allPrices)

          return (
            <div className="mb-4 w-full">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-[var(--input-bg)] rounded-lg">
                  <div className="text-xs text-[var(--text-muted)] mb-0.5">当前价格</div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">历史数据</div>
                </div>
                <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <div className="text-xs text-emerald-400/70 mb-0.5">历史最高</div>
                  <div className="text-sm font-semibold text-emerald-400">
                    ${high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </div>
                </div>
                <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <div className="text-xs text-red-400/70 mb-0.5">历史最低</div>
                  <div className="text-sm font-semibold text-red-400">
                    ${low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        const prices24h = last24h.map((p: any) => p.price)
        const high24h = Math.max(...prices24h)
        const low24h = Math.min(...prices24h)
        const firstPrice24h = last24h[0].price
        const priceChange24h = currentPrice - firstPrice24h
        const priceChangePercent24h = firstPrice24h > 0 ? ((priceChange24h / firstPrice24h) * 100).toFixed(2) : '0.00'
        const isPositive = priceChange24h >= 0

        return (
          <div className="mb-4 w-full">
            <div className="grid grid-cols-3 gap-2">
              {/* 当前价格 */}
              <div className="p-2 bg-[var(--input-bg)] rounded-lg">
                <div className="text-xs text-[var(--text-muted)] mb-0.5">当前价格</div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </div>
                <div className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{priceChangePercent24h}%
                </div>
              </div>

              {/* 24h 最高 */}
              <div className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <div className="text-xs text-emerald-400/70 mb-0.5">24h 最高</div>
                <div className="text-sm font-semibold text-emerald-400">
                  ${high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </div>
              </div>

              {/* 24h 最低 */}
              <div className="p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="text-xs text-red-400/70 mb-0.5">24h 最低</div>
                <div className="text-sm font-semibold text-red-400">
                  ${low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </div>
              </div>
            </div>
          </div>
        )
      })() : null}

      {/* Progress - 始终显示，可点击展开任务（仅项目） */}
      {!isToken && (
        <>
          <div
            className={`mb-3 ${totalTasks > 0 ? 'cursor-pointer' : ''}`}
            onClick={() => totalTasks > 0 && setShowTasks(!showTasks)}
          >
            <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
              <span>任务进度</span>
              <span className="text-[var(--text-secondary)]">
                {totalTasks > 0 ? `${completedTasks}/${totalTasks}` : '0/0'}
              </span>
            </div>
            <div className="h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
              {totalTasks > 0 ? (
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                />
              ) : (
                <div className="h-full w-full border border-dashed border-[var(--text-muted)]/30 rounded-full" />
              )}
            </div>
          </div>

          {/* Tasks - 点击进度条展开/收起，带动画 */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${showTasks && (project.tasks || []).length > 0 ? 'max-h-40 opacity-100 mb-3' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
              {(project.tasks || []).map((task) => (
                <div key={task.id} className="flex items-center gap-2 group/task">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTask(project.id, task.id)
                    }}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${task.completed
                      ? 'bg-violet-500 border-violet-500'
                      : 'border-[var(--text-muted)] hover:border-violet-500'
                      }`}
                  >
                    {task.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
                    {task.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteTask(project.id, task.id)
                    }}
                    className="opacity-0 group-hover/task:opacity-100 p-1 hover:bg-red-500/10 rounded text-[var(--text-muted)] hover:text-red-400 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Task - 始终显示 */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="添加任务..."
              className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition-colors text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </>
      )}

      {/* Status Quick Change */}
      <div className="flex gap-1 mt-4 pt-4 border-t border-[var(--border)]">
        {(isToken ? ['active', 'launched', 'completed', 'dead'] as const : ['research', 'active', 'completed', 'dead'] as const).map((s) => {
          const config = statusConfig[s]
          const isActive = project.status === s
          return (
            <button
              key={s}
              onClick={() => {
                if (isToken) {
                  updateToken(project.id, { status: s })
                } else {
                  updateProject(project.id, { status: s as any })
                }
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${isActive
                ? `${config.bg} ${config.text}`
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--input-bg)]'
                }`}
            >
              {config.label}
            </button>
          )
        })}
        {/* 归档按钮 */}
        <Tooltip content={project.status === 'archived' ? '取消归档' : '归档项目'}>
          <button
            onClick={() => {
              const willArchive = project.status !== 'archived'
              if (isToken) {
                updateToken(project.id, { status: willArchive ? 'archived' : 'active' })
              } else {
                updateProject(project.id, { status: willArchive ? 'archived' : 'research' })
              }
              onArchive?.(willArchive)
            }}
            className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${project.status === 'archived'
              ? 'bg-slate-500/20 text-slate-400'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--input-bg)]'
              }`}
          >
            {project.status === 'archived' ? (
              <ArchiveRestore className="w-3.5 h-3.5" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
          </button>
        </Tooltip>
      </div>



      {/* 价格数据导入器 */}
      <TokenPriceImporter
        isOpen={showPriceImporter}
        onClose={() => setShowPriceImporter(false)}
        onImport={handleImportPriceData}
        tokenName={project.name}
      />

    </div>
  )
}
