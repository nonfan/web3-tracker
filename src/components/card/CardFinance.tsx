import { Clock, DollarSign, TrendingUp, List } from 'lucide-react'
import { formatCurrency } from '../../utils/numberFormat'
import { formatDeadline, type FinanceData } from './cardUtils'

interface CardFinanceProps {
  deadline?: number
  finance: FinanceData
  isToken: boolean
  transactionCount: number
  onShowTransactionList: () => void
}

export function CardFinance({ 
  deadline, 
  finance, 
  isToken, 
  transactionCount,
  onShowTransactionList 
}: CardFinanceProps) {
  const { totalInvestment, totalProfit } = finance
  const deadlineInfo = deadline ? formatDeadline(deadline) : null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
      {deadlineInfo && (
        <div className={`flex items-center gap-1.5 ${deadlineInfo.urgent ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>截止: {deadlineInfo.text}</span>
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
      
      {transactionCount > 0 && (
        <button
          onClick={onShowTransactionList}
          className="flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
        >
          <List className="w-3.5 h-3.5" />
          <span>{transactionCount}笔</span>
        </button>
      )}
    </div>
  )
}
