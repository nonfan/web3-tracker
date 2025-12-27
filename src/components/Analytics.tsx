import { useMemo, useState } from 'react'
import type { Project } from '../types'
import { X, TrendingUp, DollarSign, PieChart, Calendar } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Props {
  projects: Project[]
  isOpen: boolean
  onClose: () => void
}

export function Analytics({ projects, isOpen, onClose }: Props) {
  const [view, setView] = useState<'overview' | 'monthly' | 'tags'>('overview')

  // 计算总体统计
  const stats = useMemo(() => {
    let totalInvestment = 0
    let totalProfit = 0
    
    for (const p of projects) {
      const transactions = p.transactions || []
      if (transactions.length === 0) {
        totalInvestment += p.investment || 0
        totalProfit += p.profit || 0
      } else {
        for (const t of transactions) {
          if (t.type === 'investment') {
            totalInvestment += t.amount
          } else {
            totalProfit += t.amount
          }
        }
      }
    }
    
    const roi = totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100) : 0
    const netProfit = totalProfit - totalInvestment
    
    return { totalInvestment, totalProfit, roi, netProfit }
  }, [projects])

  // 按月统计
  const monthlyStats = useMemo(() => {
    const monthly: Record<string, { investment: number; profit: number; count: number }> = {}
    
    for (const p of projects) {
      const transactions = p.transactions || []
      for (const t of transactions) {
        const date = new Date(t.createdAt)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthly[key]) {
          monthly[key] = { investment: 0, profit: 0, count: 0 }
        }
        
        if (t.type === 'investment') {
          monthly[key].investment += t.amount
        } else {
          monthly[key].profit += t.amount
        }
        monthly[key].count++
      }
    }
    
    return Object.entries(monthly)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 12)
  }, [projects])

  // 按标签统计
  const tagStats = useMemo(() => {
    const tags: Record<string, { investment: number; profit: number; count: number }> = {}
    
    for (const p of projects) {
      const transactions = p.transactions || []
      let pInvestment = 0
      let pProfit = 0
      
      if (transactions.length === 0) {
        pInvestment = p.investment || 0
        pProfit = p.profit || 0
      } else {
        for (const t of transactions) {
          if (t.type === 'investment') pInvestment += t.amount
          else pProfit += t.amount
        }
      }
      
      for (const tag of p.tags) {
        if (!tags[tag]) {
          tags[tag] = { investment: 0, profit: 0, count: 0 }
        }
        tags[tag].investment += pInvestment
        tags[tag].profit += pProfit
        tags[tag].count++
      }
    }
    
    return Object.entries(tags)
      .sort((a, b) => b[1].count - a[1].count)
  }, [projects])

  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--card-bg)] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-[var(--border-hover)] shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <PieChart className="w-5 h-5 text-violet-400" />
            数据分析
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 mx-5 mt-4 bg-[var(--input-bg)] rounded-xl">
          {[
            { key: 'overview', label: '总览' },
            { key: 'monthly', label: '按月' },
            { key: 'tags', label: '按标签' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key as typeof view)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === tab.key
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {view === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">总投入</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-400">
                    ${stats.totalInvestment.toLocaleString()}
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${stats.totalProfit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className={`flex items-center gap-2 mb-2 ${stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">总收益</span>
                  </div>
                  <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl ${stats.netProfit >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="text-sm text-[var(--text-muted)] mb-2">净利润</div>
                  <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toLocaleString()}
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${stats.roi >= 0 ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="text-sm text-[var(--text-muted)] mb-2">投资回报率</div>
                  <div className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
                    {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[var(--input-bg)] rounded-xl">
                <div className="text-sm text-[var(--text-muted)] mb-2">项目统计</div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-[var(--text-primary)]">{projects.length}</div>
                    <div className="text-xs text-[var(--text-muted)]">总项目</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-emerald-400">{projects.filter(p => p.status === 'active').length}</div>
                    <div className="text-xs text-[var(--text-muted)]">进行中</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-violet-400">{projects.filter(p => p.status === 'launched').length}</div>
                    <div className="text-xs text-[var(--text-muted)]">已发币</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-400">{projects.filter(p => p.status === 'dead').length}</div>
                    <div className="text-xs text-[var(--text-muted)]">已凉</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'monthly' && (
            <div className="space-y-3">
              {monthlyStats.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">暂无交易记录</div>
              ) : (
                monthlyStats.map(([month, data]) => (
                  <div key={month} className="p-4 bg-[var(--input-bg)] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="font-medium text-[var(--text-primary)]">{month}</span>
                        <span className="text-xs text-[var(--text-muted)]">({data.count}笔)</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-[var(--text-muted)]">投入: </span>
                        <span className="text-amber-400">${data.investment.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">收益: </span>
                        <span className={data.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {data.profit >= 0 ? '+' : ''}${data.profit.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">净利: </span>
                        <span className={data.profit - data.investment >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {data.profit - data.investment >= 0 ? '+' : ''}${(data.profit - data.investment).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {view === 'tags' && (
            <div className="space-y-3">
              {tagStats.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">暂无标签数据</div>
              ) : (
                tagStats.map(([tag, data]) => {
                  const net = data.profit - data.investment
                  return (
                    <div key={tag} className="p-4 bg-[var(--input-bg)] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-sm font-medium">
                          {tag}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">{data.count} 个项目</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-[var(--text-muted)]">投入: </span>
                          <span className="text-amber-400">${data.investment.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)]">收益: </span>
                          <span className={data.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {data.profit >= 0 ? '+' : ''}${data.profit.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)]">净利: </span>
                          <span className={net >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {net >= 0 ? '+' : ''}${net.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
