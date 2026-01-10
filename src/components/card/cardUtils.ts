import type { Project, Transaction } from '../../types'

// 状态配置
export const priorityConfig = {
  high: { bg: 'bg-red-500/20', text: 'text-red-400', label: '高' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '中' },
  low: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '低' },
}

export function getStatusConfig(isToken: boolean) {
  return {
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
  }
}

export function formatDeadline(timestamp: number): { text: string; urgent: boolean } {
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

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

// 计算投资收益
export interface FinanceData {
  totalInvestment: number
  totalProfit: number
  currentHoldings: number
  currentValue: number
}

export function calculateFinance(
  transactions: Transaction[],
  isToken: boolean,
  project: Project,
  legacyInvestment?: number,
  legacyProfit?: number
): FinanceData {
  let investment = 0
  let profit = 0
  let holdings = 0

  // 兼容旧数据
  if (transactions.length === 0) {
    investment = legacyInvestment || 0
    profit = legacyProfit || 0
    return { totalInvestment: investment, totalProfit: profit, currentHoldings: 0, currentValue: 0 }
  }

  // 计算投入、收益和持有数量
  for (const t of transactions) {
    if (t.type === 'investment') {
      investment += t.amount
      if (t.note && isToken) {
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

  // 计算当前市值
  if (isToken && 'currentPrice' in project && (project as any).currentPrice) {
    const currentPrice = (project as any).currentPrice
    const currentValue = holdings * currentPrice
    return { totalInvestment: investment, totalProfit: profit, currentHoldings: holdings, currentValue }
  }

  return { totalInvestment: investment, totalProfit: profit, currentHoldings: holdings, currentValue: 0 }
}
