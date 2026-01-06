import { DollarSign, TrendingUp } from 'lucide-react'

interface ProjectStatsProps {
  totalInvestment: number
  totalProfit: number
}

export function ProjectStats({ totalInvestment, totalProfit }: ProjectStatsProps) {
  if (totalInvestment === 0 && totalProfit === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {totalInvestment > 0 && (
        <div className="flex items-center gap-1 text-[var(--text-muted)]">
          <DollarSign className="w-3.5 h-3.5" />
          <span>投入: ${totalInvestment.toLocaleString()}</span>
        </div>
      )}
      {totalProfit !== 0 && (
        <div className={`flex items-center gap-1 ${totalProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          <TrendingUp className="w-3.5 h-3.5" />
          <span>收益: {totalProfit > 0 ? '+' : ''}${totalProfit.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
