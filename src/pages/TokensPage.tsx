import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectForm } from '../components/ProjectForm'
import { BatchActions } from '../components/BatchActions'
import { Analytics } from '../components/Analytics'
import { generateMockPriceHistory } from '../utils/mockPriceData'
import { formatCurrency } from '../utils/numberFormat'
import type { Token, TokenStatus } from '../types'
import { Plus, Search, Inbox, FolderSearch, CheckSquare, X, SortAsc, BarChart3, Archive, ArchiveX } from 'lucide-react'
import { Dropdown } from '../components/Dropdown'
import { Tooltip } from '../components/Tooltip'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'

type FilterStatus = TokenStatus | 'all'
type SortBy = 'created' | 'updated' | 'name' | 'custom'

// Sortable Card Wrapper
function SortableCard({ token, onEdit, onArchive, selectionMode, selected, onSelect }: {
  token: Token
  onEdit: () => void
  onArchive: (archived: boolean) => void
  selectionMode: boolean
  selected: boolean
  onSelect: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({ id: token.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="break-inside-avoid">
      <ProjectCard
        project={token as any}
        onEdit={onEdit}
        onArchive={onArchive}
        selectionMode={selectionMode}
        selected={selected}
        onSelect={onSelect}
        dragHandleProps={{ ref: setActivatorNodeRef, ...attributes, ...listeners }}
      />
    </div>
  )
}

export function TokensPage() {
  const { tokens, tokenOrder, addToken, updateToken, reorderTokens } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingToken, setEditingToken] = useState<Token | undefined>()
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('custom')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [archiveToast, setArchiveToast] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动 8px 后才激活拖拽，点击不会触发
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 初始化排序数组
  useEffect(() => {
    if (tokenOrder.length === 0 && tokens.length > 0) {
      reorderTokens(tokens.map(t => t.id))
    }
  }, [tokens, tokenOrder, reorderTokens])

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagCounts: Record<string, number> = {}
    tokens.forEach((t) => {
      t.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [tokens])

  const filteredTokens = useMemo(() => {
    let result = tokens
      .filter((t) => {
        // 归档筛选
        if (showArchived) return t.status === 'archived'
        if (t.status === 'archived') return false
        // 状态筛选
        return filter === 'all' || t.status === filter
      })
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.symbol.toLowerCase().includes(search.toLowerCase()))
      .filter((t) => !tagFilter || t.tags.includes(tagFilter))

    // 排序
    if (sortBy === 'custom') {
      // 使用自定义排序
      result = result.sort((a, b) => {
        const aIndex = tokenOrder.indexOf(a.id)
        const bIndex = tokenOrder.indexOf(b.id)
        if (aIndex === -1 && bIndex === -1) return 0
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
    } else {
      // 使用其他排序方式
      result = result.sort((a, b) => {
        switch (sortBy) {
          case 'updated':
            return b.updatedAt - a.updatedAt
          case 'name':
            return a.name.localeCompare(b.name)
          case 'created':
          default:
            return b.createdAt - a.createdAt
        }
      })
    }

    return result
  }, [tokens, filter, search, tagFilter, sortBy, showArchived, tokenOrder])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = filteredTokens.findIndex((t) => t.id === active.id)
      const newIndex = filteredTokens.findIndex((t) => t.id === over.id)

      const newOrder = arrayMove(filteredTokens, oldIndex, newIndex).map(t => t.id)

      // 更新完整的排序数组
      const updatedOrder = tokenOrder.filter(id => !newOrder.includes(id))
      reorderTokens([...newOrder, ...updatedOrder])

      // 切换到自定义排序
      if (sortBy !== 'custom') {
        setSortBy('custom')
      }
    }
  }

  const stats = {
    total: tokens.filter(t => t.status !== 'archived').length,
    active: tokens.filter((t) => t.status === 'active').length,
    completed: tokens.filter((t) => t.status === 'completed').length,
    launched: tokens.filter((t) => t.status === 'launched').length,
    archived: tokens.filter((t) => t.status === 'archived').length,
  }

  const handleSubmit = (data: any) => {
    if (editingToken?.id) {
      updateToken(editingToken.id, data)
    } else {
      // 生成测试价格数据
      const mockPriceData = generateMockPriceHistory(0.5, 30, 0.15)

      const tokenData = {
        ...data,
        symbol: data.name, // 临时使用 name 作为 symbol
        tasks: [],
        transactions: [],
        investments: [],
        priceHistory: mockPriceData, // 自动添加测试数据
        currentPrice: mockPriceData[mockPriceData.length - 1]?.price || 0, // 设置当前价格
        blockchain: data.blockchain || '',
        chain: data.chain || '',
        contractAddress: data.contractAddress || '',
      }
      addToken(tokenData)
    }
    setShowForm(false)
    setEditingToken(undefined)
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds([])
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '总代币', value: stats.total, color: 'slate', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
          { label: '研究中', value: stats.active, color: 'emerald', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
          { label: '已买币', value: stats.launched, color: 'violet', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
          { label: '已卖币', value: stats.completed, color: 'blue', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bgColor} border ${stat.borderColor} rounded-xl p-4 transition-all hover:scale-[1.02]`}
          >
            <div className="text-xs text-[var(--text-muted)] font-medium mb-1">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color === 'slate' ? 'text-[var(--text-primary)]' :
              stat.color === 'emerald' ? 'text-emerald-400' :
                stat.color === 'blue' ? 'text-blue-400' : 'text-violet-400'
              }`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* 总持仓价值 */}
        <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-blue-500/15 rounded-lg flex items-center justify-center">
              <svg className="w-9 h-9 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--text-muted)] mb-0.5">总持仓价值</div>
              <div className="text-lg font-bold text-blue-400">
                ${(() => {
                  const totalValue = tokens.reduce((acc, t) => {
                    if (t.currentPrice && t.transactions) {
                      // 计算持有数量
                      let holdings = 0
                      for (const tx of t.transactions) {
                        if (tx.note) {
                          const num = parseFloat(tx.note)
                          if (!isNaN(num)) {
                            holdings += tx.type === 'investment' ? num : -num
                          }
                        }
                      }
                      return acc + (holdings * t.currentPrice)
                    }
                    return acc
                  }, 0)
                  return totalValue > 0 ? formatCurrency(totalValue).replace('$', '') : '0'
                })()}
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {tokens.filter(t => t.currentPrice && t.transactions && t.transactions.length > 0).length} 个代币有持仓
          </div>
        </div>

        {/* 优先级统计 */}
        <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-amber-500/15 rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--text-muted)] mb-0.5">高优先级</div>
              <div className="text-lg font-bold text-amber-400">{tokens.filter(t => t.priority === 'high' && t.status !== 'archived').length}</div>
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)]">需要重点关注</div>
        </div>

        {/* 即将到期 */}
        <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-red-500/15 rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--text-muted)] mb-0.5">即将到期</div>
              <div className="text-lg font-bold text-red-400">
                {(() => {
                  const now = Date.now()
                  const oneWeek = 7 * 24 * 60 * 60 * 1000
                  return tokens.filter(t => t.deadline && t.deadline > now && t.deadline - now < oneWeek && t.status === 'active').length
                })()}
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--text-muted)]">7 天内截止</div>
        </div>

        {/* 热门标签 */}
        <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-violet-500/15 rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--text-muted)]">热门标签</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {allTags.length > 0 ? (
              allTags.slice(0, 3).map(([tag]) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-violet-500/15 text-violet-400 rounded text-xs font-medium"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-[var(--text-muted)]">暂无标签</span>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索代币..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
            />
          </div>

          {/* Sort */}
          <Dropdown
            value={sortBy}
            onChange={(v) => setSortBy(v as SortBy)}
            icon={<SortAsc className="w-4 h-4 text-[var(--text-muted)]" />}
            options={[
              { value: 'custom', label: '自定义排序' },
              { value: 'created', label: '创建时间' },
              { value: 'updated', label: '最近更新' },
              { value: 'name', label: '名称' },
            ]}
          />

          {/* Actions */}
          {!selectionMode ? (
            <div className="flex items-center gap-2">
              <Tooltip content="数据分析">
                <button
                  onClick={() => setShowAnalytics(true)}
                  className="p-2.5 bg-[var(--bg-tertiary)] rounded-xl text-[var(--text-secondary)] hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="批量操作">
                <button
                  onClick={() => setSelectionMode(true)}
                  className="p-2.5 bg-[var(--bg-tertiary)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
              </Tooltip>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:from-violet-500 hover:to-purple-500 font-medium flex items-center gap-2 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 text-white text-sm"
              >
                <Plus className="w-4 h-4" />
                添加代币
              </button>
            </div>
          ) : (
            <button
              onClick={exitSelectionMode}
              className="px-4 py-2.5 bg-[var(--bg-tertiary)] rounded-xl text-sm flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
            >
              <X className="w-4 h-4" />
              退出批量
            </button>
          )}

          {/* Status Filter */}
          <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)]">
            {[
              { value: 'all', label: '全部' },
              { value: 'active', label: '研究中' },
              { value: 'completed', label: '已卖币' },
              { value: 'launched', label: '已买币' },
              { value: 'dead', label: '已归零' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as FilterStatus)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.value
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
              >
                {f.label}
              </button>
            ))}
            {/* 归档按钮 */}
            <Tooltip content={showArchived ? '返回代币列表' : `${stats.archived} 个已归档`}>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${showArchived
                  ? 'bg-slate-500/20 text-slate-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
              >
                {showArchived ? <ArchiveX className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                {stats.archived > 0 && <span>{stats.archived}</span>}
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--text-muted)]">标签筛选:</span>
            {tagFilter && (
              <button
                onClick={() => setTagFilter(null)}
                className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                {tagFilter}
                <X className="w-3 h-3" />
              </button>
            )}
            {allTags
              .filter(([tag]) => tag !== tagFilter)
              .map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className="px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg text-xs font-medium hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {tag} ({count})
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Projects Grid - 瀑布流布局 */}
      {filteredTokens.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <SortableContext
            items={filteredTokens.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
              {filteredTokens.map((token) => (
                <SortableCard
                  key={token.id}
                  token={token}
                  onEdit={() => {
                    setEditingToken(token)
                    setShowForm(true)
                  }}
                  onArchive={(archived) => {
                    if (archived && !showArchived) {
                      setArchiveToast(true)
                      setTimeout(() => setArchiveToast(false), 3000)
                    }
                  }}
                  selectionMode={selectionMode}
                  selected={selectedIds.includes(token.id)}
                  onSelect={toggleSelection}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-16">
          {tokens.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border)]">
                <Inbox className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <p className="text-[var(--text-secondary)]">还没有代币，点击上方按钮添加第一个</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border)]">
                <FolderSearch className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <p className="text-[var(--text-secondary)]">没有找到匹配的代币</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ProjectForm
          project={editingToken as any}
          isToken={true}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingToken(undefined)
          }}
        />
      )}

      {/* Batch Actions */}
      {selectionMode && (
        <BatchActions selectedIds={selectedIds} onClear={exitSelectionMode} />
      )}

      {/* Analytics Modal */}
      <Analytics
        projects={tokens as any}
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />

      {/* Archive Toast */}
      {archiveToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex items-center gap-3 z-50">
          <span className="text-slate-300">代币已归档</span>
          <button
            onClick={() => {
              setShowArchived(true)
              setArchiveToast(false)
            }}
            className="text-violet-400 hover:text-violet-300 font-medium"
          >
            查看归档
          </button>
        </div>
      )}
    </div>
  )
}
