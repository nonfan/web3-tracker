import { useMemo } from 'react'
import type { Project } from '../types'
import { TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Props {
  projects: Project[]
}

export function StatsChart({ projects }: Props) {
  const stats = useMemo(() => {
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay

    // 即将到期的项目（7天内）
    const upcomingDeadlines = projects.filter(
      (p) => p.deadline && p.deadline > now && p.deadline - now < oneWeek && p.status === 'active'
    )

    // 高优先级进行中
    const highPriorityActive = projects.filter(
      (p) => p.priority === 'high' && p.status === 'active'
    )

    // 总任务完成率
    const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0)
    const completedTasks = projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.completed).length,
      0
    )
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // 按标签统计
    const tagCounts: Record<string, number> = {}
    projects.forEach((p) => {
      p.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      upcomingDeadlines,
      highPriorityActive,
      completionRate,
      totalTasks,
      completedTasks,
      topTags,
    }
  }, [projects])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* 任务完成率 */}
      <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 bg-emerald-500/15 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[var(--text-muted)] mb-0.5">任务完成率</div>
            <div className="text-lg font-bold text-emerald-400">{stats.completionRate}%</div>
          </div>
        </div>
        <div className="h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-2">
          {stats.completedTasks} / {stats.totalTasks} 任务
        </div>
      </div>

      {/* 高优先级 */}
      <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 bg-red-500/15 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4.5 h-4.5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[var(--text-muted)] mb-0.5">高优先级</div>
            <div className="text-lg font-bold text-red-400">{stats.highPriorityActive.length}</div>
          </div>
        </div>
        <div className="text-xs text-[var(--text-muted)]">需要优先关注</div>
      </div>

      {/* 即将到期 */}
      <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 bg-amber-500/15 rounded-lg flex items-center justify-center">
            <Clock className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[var(--text-muted)] mb-0.5">即将到期</div>
            <div className="text-lg font-bold text-amber-400">{stats.upcomingDeadlines.length}</div>
          </div>
        </div>
        <div className="text-xs text-[var(--text-muted)]">7 天内截止</div>
      </div>

      {/* 热门标签 */}
      <div className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 bg-violet-500/15 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[var(--text-muted)]">热门标签</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {stats.topTags.length > 0 ? (
            stats.topTags.slice(0, 3).map(([tag]) => (
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
  )
}
