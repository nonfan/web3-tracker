import { useState, useRef, useEffect, useMemo } from 'react'
import type { Project, TransactionType } from '../types'
import { useStore } from '../store/useStore'
import { TrendingUp } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { TwitterViewer } from './TwitterViewer'
import { TokenPriceImporter } from './TokenPriceImporter'
import { getTokenPriceHistory, getTokenInfo } from '../utils/coinGeckoApi'
import { setCachedPriceData } from '../utils/priceDataCache'
import {
  CardHeader,
  CardLinks,
  CardFinance,
  CardTasks,
  CardStatus,
  TokenPriceInfo,
  TransactionPanel,
  DeleteConfirm,
  TransactionListModal,
  PriceChartModal,
  calculateFinance,
} from './card'

interface Props {
  project: Project
  onEdit: () => void
  onArchive?: (archived: boolean) => void
  selected?: boolean
  onSelect?: (id: string) => void
  selectionMode?: boolean
  dragHandleProps?: any
}

export function ProjectCard({ project, onEdit, onArchive, selected, onSelect, selectionMode, dragHandleProps }: Props) {
  // State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTransactionPanel, setShowTransactionPanel] = useState(false)
  const [showTransactionList, setShowTransactionList] = useState(false)
  const [showPriceChart, setShowPriceChart] = useState(false)
  const [showPriceImporter, setShowPriceImporter] = useState(false)
  const [showTwitterViewer, setShowTwitterViewer] = useState(false)
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>('investment')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionNote, setTransactionNote] = useState('')
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [deletePopupPosition, setDeletePopupPosition] = useState({ top: 0, left: 0 })

  // Refs
  const profitButtonRef = useRef<HTMLButtonElement>(null)
  const profitPopupRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const deletePopupRef = useRef<HTMLDivElement>(null)
  const twitterLinkRef = useRef<HTMLAnchorElement>(null)

  // Store
  const { addTask, toggleTask, deleteTask, deleteProject, deleteToken, updateProject, updateToken, addTransaction, deleteTransaction, addTokenTransaction, deleteTokenTransaction } = useStore()

  // Computed
  const isToken = 'symbol' in project
  const finance = useMemo(() => calculateFinance(project.transactions || [], isToken, project, project.investment, project.profit), [project.transactions, project.investment, project.profit, isToken, project])

  // Handlers
  const handleOpenTransactionPanel = () => {
    if (showTransactionPanel) { setShowTransactionPanel(false); return }
    setTransactionType('investment')
    setTransactionAmount('')
    setTransactionNote('')
    if (profitButtonRef.current) {
      const rect = profitButtonRef.current.getBoundingClientRect()
      setPopupPosition({ top: rect.bottom + 8, left: Math.max(8, rect.left - 120) })
    }
    setShowTransactionPanel(true)
  }

  const handleOpenDeleteConfirm = () => {
    if (showDeleteConfirm) { setShowDeleteConfirm(false); return }
    if (deleteButtonRef.current) {
      const rect = deleteButtonRef.current.getBoundingClientRect()
      setDeletePopupPosition({ top: rect.bottom + 8, left: Math.max(8, rect.left - 120) })
    }
    setShowDeleteConfirm(true)
  }

  const handleAddTransaction = () => {
    const amount = parseFloat(transactionAmount)
    if (isNaN(amount) || amount === 0) return
    if (isToken && !transactionNote.trim()) return
    if (isToken && transactionType === 'profit') {
      const sellAmount = parseFloat(transactionNote)
      if (!isNaN(sellAmount) && sellAmount > finance.currentHoldings) return
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

  const handleImportPriceData = (coinGeckoId: string, priceHistory: any[], currentPrice?: number) => {
    if (!isToken) return
    updateToken(project.id, { currentPrice, coingeckoId: coinGeckoId, lastPriceUpdate: Date.now(), priceHistory } as any)
  }

  const handleShowPriceChart = async () => {
    if (!isToken) return
    const hasCoingeckoId = 'coingeckoId' in project && (project as any).coingeckoId
    if (!hasCoingeckoId) { setShowPriceImporter(true); return }
    setShowPriceChart(true)
    const hasPriceData = (project as any).priceHistory?.length > 0
    if (hasPriceData) {
      const lastUpdate = (project as any).lastPriceUpdate || 0
      if (Date.now() - lastUpdate > 60 * 60 * 1000) {
        setIsRefreshingPrice(true)
        try {
          const priceHistory = await getTokenPriceHistory((project as any).coingeckoId, 365)
          const tokenInfo = await getTokenInfo((project as any).coingeckoId)
          if (tokenInfo?.currentPrice) setCachedPriceData((project as any).coingeckoId, 365, priceHistory, tokenInfo.currentPrice)
          handleImportPriceData((project as any).coingeckoId, priceHistory, tokenInfo?.currentPrice)
        } catch (e) { console.error('更新价格失败:', e) }
        finally { setIsRefreshingPrice(false) }
      }
    }
  }

  const handleRefreshPrice = async () => {
    if (!isToken || isRefreshingPrice) return
    const coinGeckoId = (project as any).coingeckoId
    if (!coinGeckoId) { setShowPriceImporter(true); return }
    setIsRefreshingPrice(true)
    try {
      const priceHistory = await getTokenPriceHistory(coinGeckoId, 365)
      if (priceHistory?.length > 0) {
        const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0
        setCachedPriceData(coinGeckoId, 365, priceHistory, currentPrice)
        updateToken(project.id, { currentPrice, lastPriceUpdate: Date.now(), priceHistory })
      }
    } catch (e) { console.error('刷新价格失败:', e) }
    finally { setIsRefreshingPrice(false) }
  }

  // Click outside handlers
  useEffect(() => {
    if (!showTransactionPanel) return
    const handler = (e: MouseEvent) => {
      if (profitPopupRef.current && !profitPopupRef.current.contains(e.target as Node) && profitButtonRef.current && !profitButtonRef.current.contains(e.target as Node)) {
        setShowTransactionPanel(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showTransactionPanel])

  useEffect(() => {
    if (!showDeleteConfirm) return
    const handler = (e: MouseEvent) => {
      if (deletePopupRef.current && !deletePopupRef.current.contains(e.target as Node) && deleteButtonRef.current && !deleteButtonRef.current.contains(e.target as Node)) {
        setShowDeleteConfirm(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showDeleteConfirm])

  return (
    <div
      {...dragHandleProps}
      className={`bg-[var(--card-bg)] rounded-2xl p-5 border transition-all group ${selected ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-[var(--border)] hover:border-[var(--border-hover)]'} ${dragHandleProps ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onClick={() => selectionMode && onSelect?.(project.id)}
    >
      {/* Header */}
      <CardHeader
        project={project}
        isToken={isToken}
        selected={selected}
        selectionMode={selectionMode}
        onSelect={onSelect}
        onEdit={onEdit}
        onOpenTransaction={handleOpenTransactionPanel}
        onOpenDelete={handleOpenDeleteConfirm}
        onRefreshPrice={isToken ? handleRefreshPrice : undefined}
        showTransactionPanel={showTransactionPanel}
        showDeleteConfirm={showDeleteConfirm}
        isRefreshingPrice={isRefreshingPrice}
        profitButtonRef={profitButtonRef}
        deleteButtonRef={deleteButtonRef}
      />

      {/* Description */}
      {project.description && (
        <Tooltip content={project.description}>
          <div className={`mb-2 w-full ${(project.logoUrl || project.website) ? 'pl-[48px]' : ''}`}>
            <p className="text-sm text-[var(--text-secondary)] cursor-default truncate">{project.description}</p>
          </div>
        </Tooltip>
      )}

      {/* Chain & Price Chart Button (Token only) */}
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
            <button onClick={handleShowPriceChart} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 transition-colors">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-medium">价格走势</span>
            </button>
          </div>
        </div>
      )}

      {/* Finance Info */}
      <CardFinance
        deadline={project.deadline}
        finance={finance}
        isToken={isToken}
        transactionCount={project.transactions?.length || 0}
        onShowTransactionList={() => setShowTransactionList(true)}
      />

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-md text-xs font-medium">{tag}</span>
          ))}
        </div>
      )}

      {/* Links */}
      <CardLinks project={project} isToken={isToken} twitterLinkRef={twitterLinkRef} onShowTwitterViewer={() => setShowTwitterViewer(true)} />

      {/* Token Price Info */}
      {isToken && <TokenPriceInfo priceHistory={(project as any).priceHistory || []} currentPrice={(project as any).currentPrice || 0} />}

      {/* Tasks (Project only) */}
      {!isToken && <CardTasks projectId={project.id} tasks={project.tasks || []} onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} />}

      {/* Status Buttons */}
      <CardStatus
        project={project}
        isToken={isToken}
        onUpdateStatus={(status: any) => isToken ? updateToken(project.id, { status } as any) : updateProject(project.id, { status } as any)}
        onArchive={onArchive}
      />

      {/* Modals */}
      <TransactionPanel
        isOpen={showTransactionPanel}
        position={popupPosition}
        isToken={isToken}
        transactionType={transactionType}
        transactionAmount={transactionAmount}
        transactionNote={transactionNote}
        currentHoldings={finance.currentHoldings}
        onTypeChange={setTransactionType}
        onAmountChange={setTransactionAmount}
        onNoteChange={setTransactionNote}
        onSubmit={handleAddTransaction}
        onClose={() => setShowTransactionPanel(false)}
        popupRef={profitPopupRef}
      />

      <DeleteConfirm
        isOpen={showDeleteConfirm}
        position={deletePopupPosition}
        projectName={project.name}
        onConfirm={() => { isToken ? deleteToken(project.id) : deleteProject(project.id); setShowDeleteConfirm(false) }}
        onClose={() => setShowDeleteConfirm(false)}
        popupRef={deletePopupRef}
      />

      <TransactionListModal
        isOpen={showTransactionList}
        project={project}
        isToken={isToken}
        finance={finance}
        onDeleteTransaction={(id: string) => isToken ? deleteTokenTransaction(project.id, id) : deleteTransaction(project.id, id)}
        onClose={() => setShowTransactionList(false)}
      />

      {isToken && 'priceHistory' in project && (
        <PriceChartModal
          isOpen={showPriceChart}
          project={project}
          isRefreshingPrice={isRefreshingPrice}
          onRefreshPrice={handleRefreshPrice}
          onOpenImporter={() => { setShowPriceChart(false); setShowPriceImporter(true) }}
          onClose={() => setShowPriceChart(false)}
        />
      )}

      <TokenPriceImporter isOpen={showPriceImporter} onClose={() => setShowPriceImporter(false)} onImport={handleImportPriceData} tokenName={project.name} />

      {project.twitter && (
        <TwitterViewer
          isOpen={showTwitterViewer}
          onClose={() => setShowTwitterViewer(false)}
          username={(() => { const match = project.twitter?.match(/(?:twitter\.com|x\.com)\/([^/?]+)/); return match ? match[1] : '' })()}
          anchorRef={twitterLinkRef}
        />
      )}
    </div>
  )
}
