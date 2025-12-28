import { useState, useRef, useEffect, useMemo } from 'react'
import type { Project, TransactionType } from '../types'
import { useStore } from '../store/useStore'
import { Pencil, Trash2, Globe, MessageCircle, Plus, X, Check, Clock, Flag, DollarSign, TrendingUp, List, Archive, ArchiveRestore } from 'lucide-react'
import { ConfirmDialog } from './ConfirmDialog'
import { Favicon } from './Favicon'
import { Tooltip } from './Tooltip'
import { createPortal } from 'react-dom'
import gsap from 'gsap'

const statusConfig = {
  active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', label: '进行中' },
  completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400', label: '已完成' },
  launched: { bg: 'bg-violet-500/20', text: 'text-violet-400', dot: 'bg-violet-400', label: '已发币' },
  dead: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400', label: '已凉' },
  archived: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400', label: '已归档' },
}

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

export function ProjectCard({ project, onEdit, onArchive, selected, onSelect, selectionMode }: Props) {
  const [newTask, setNewTask] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTransactionPanel, setShowTransactionPanel] = useState(false)
  const [showTransactionList, setShowTransactionList] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>('investment')
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionNote, setTransactionNote] = useState('')
  const { addTask, toggleTask, deleteTask, deleteProject, updateProject, addTransaction, deleteTransaction } = useStore()
  
  const profitButtonRef = useRef<HTMLButtonElement>(null)
  const profitPopupRef = useRef<HTMLDivElement>(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })

  const completedTasks = project.tasks.filter((t) => t.completed).length
  const totalTasks = project.tasks.length
  const status = statusConfig[project.status]
  const priority = priorityConfig[project.priority || 'medium']
  const deadline = project.deadline ? formatDeadline(project.deadline) : null

  // 计算总投入和总收益
  const { totalInvestment, totalProfit } = useMemo(() => {
    const transactions = project.transactions || []
    let investment = 0
    let profit = 0
    
    // 兼容旧数据
    if (transactions.length === 0) {
      investment = project.investment || 0
      profit = project.profit || 0
    } else {
      for (const t of transactions) {
        if (t.type === 'investment') {
          investment += t.amount
        } else {
          profit += t.amount
        }
      }
    }
    
    return { totalInvestment: investment, totalProfit: profit }
  }, [project.transactions, project.investment, project.profit])

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

  // 弹窗动画
  useEffect(() => {
    if (showTransactionPanel && profitPopupRef.current) {
      gsap.fromTo(profitPopupRef.current,
        { opacity: 0, y: -8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [showTransactionPanel])

  const handleAddTransaction = () => {
    const amount = parseFloat(transactionAmount)
    if (isNaN(amount) || amount === 0) return
    
    addTransaction(project.id, transactionType, amount, transactionNote || undefined)
    setTransactionAmount('')
    setTransactionNote('')
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div 
      className={`bg-[var(--card-bg)] rounded-2xl p-5 border transition-all group ${
        selected ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-[var(--border)] hover:border-[var(--border-hover)]'
      }`}
      onClick={() => selectionMode && onSelect?.(project.id)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Favicon */}
        {project.website && (
          <Favicon url={project.website} name={project.name} size={36} />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {selectionMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.(project.id)
                }}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selected ? 'bg-violet-500 border-violet-500' : 'border-gray-600'
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
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip content="记录收益">
              <button
                ref={profitButtonRef}
                onClick={handleOpenTransactionPanel}
                className={`p-2 rounded-lg transition-colors ${
                  showTransactionPanel 
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
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-red-500/10 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Description - 独立一行，与标题对齐 */}
      {project.description && (
        <Tooltip content={project.description}>
          <div className={`mb-2 w-full ${project.website ? 'pl-[48px]' : ''}`}>
            <p className="text-sm text-[var(--text-secondary)] cursor-default truncate">
              {project.description}
            </p>
          </div>
        </Tooltip>
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
            <span>投入: ${totalInvestment.toLocaleString()}</span>
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
            <span>收益: {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[var(--text-muted)] opacity-50">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>收益: --</span>
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
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                transactionType === 'investment'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              投入
            </button>
            <button
              onClick={() => setTransactionType('profit')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                transactionType === 'profit'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              收益
            </button>
          </div>
          
          <div className="space-y-2 mb-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                金额 (USD) {transactionType === 'profit' && <span className="text-[var(--text-muted)]">负数表示亏损</span>}
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
              <label className="block text-xs text-[var(--text-muted)] mb-1">备注 (可选)</label>
              <input
                type="text"
                value={transactionNote}
                onChange={(e) => setTransactionNote(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-violet-500/50 text-[var(--text-primary)]"
                placeholder="如：空投领取、Gas费等"
              />
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
              disabled={!transactionAmount || parseFloat(transactionAmount) === 0}
              className="flex-1 py-2 text-xs bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              添加记录
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 交易记录列表弹窗 */}
      {showTransactionList && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 w-full max-w-md border border-[var(--border-hover)] shadow-2xl max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
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
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="text-xs text-amber-400 mb-1">总投入</div>
                <div className="text-lg font-bold text-amber-400">${totalInvestment.toLocaleString()}</div>
              </div>
              <div className={`p-3 rounded-xl ${totalProfit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <div className={`text-xs ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} mb-1`}>总收益</div>
                <div className={`text-lg font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* 记录列表 */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {(project.transactions || []).length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">暂无记录</div>
              ) : (
                [...(project.transactions || [])].reverse().map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 bg-[var(--input-bg)] rounded-xl group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      t.type === 'investment' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {t.type === 'investment' ? <DollarSign className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          t.type === 'investment' ? 'text-amber-400' : t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {t.type === 'investment' ? '-' : t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString()}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">{formatDate(t.createdAt)}</span>
                      </div>
                      {t.note && (
                        <div className="text-xs text-[var(--text-muted)] truncate">{t.note}</div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteTransaction(project.id, t.id)}
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
      <div className="flex gap-2 mb-4">
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
          <a
            href={project.twitter}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </a>
        )}
        {project.discord && (
          <a
            href={project.discord}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Discord
          </a>
        )}
      </div>

      {/* Progress */}
      {totalTasks > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
            <span>任务进度</span>
            <span className="text-[var(--text-secondary)]">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="h-1.5 bg-[var(--input-bg)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tasks */}
      {project.tasks.length > 0 && (
        <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto scrollbar-thin">
          {project.tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 group/task">
              <button
                onClick={() => toggleTask(project.id, task.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  task.completed
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
                onClick={() => deleteTask(project.id, task.id)}
                className="opacity-0 group-hover/task:opacity-100 p-1 hover:bg-red-500/10 rounded text-[var(--text-muted)] hover:text-red-400 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Task - 只在有任务或 hover 时显示 */}
      <div className={`${project.tasks.length === 0 ? 'h-0 overflow-hidden group-hover:h-auto' : ''}`}>
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
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
      </div>

      {/* Status Quick Change */}
      <div className="flex gap-1 mt-4 pt-4 border-t border-[var(--border)]">
        {(['active', 'completed', 'launched', 'dead'] as const).map((s) => {
          const config = statusConfig[s]
          const isActive = project.status === s
          return (
            <button
              key={s}
              onClick={() => updateProject(project.id, { status: s })}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                isActive
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
              updateProject(project.id, { status: willArchive ? 'archived' : 'active' })
              onArchive?.(willArchive)
            }}
            className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
              project.status === 'archived'
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="删除项目"
        message={`确定要删除「${project.name}」吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => {
          deleteProject(project.id)
          setShowDeleteConfirm(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
