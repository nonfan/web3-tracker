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
      <div className="bg-[#1a1a24] rounded-xl p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm text-gray-400">任务完成率</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-emerald-400">{stats.completionRate}%</span>
          <span className="text-xs text-gray-500 mb-1">
            {stats.completedTasks}/{stats.totalTasks}
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>

      {/* 高优先级 */}
      <div className="bg-[#1a1a24] rounded-xl p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-sm text-gray-400">高优先级</span>
        </div>
        <div className="text-2xl font-bold text-red-400">
          {stats.highPriorityActive.length}
        </div>
        <div className="text-xs text-gray-500 mt-1">需要关注的项目</div>
      </div>

      {/* 即将到期 */}
      <div className="bg-[#1a1a24] rounded-xl p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm text-gray-400">即将到期</span>
        </div>
        <div className="text-2xl font-bold text-amber-400">
          {stats.upcomingDeadlines.length}
        </div>
        <div className="text-xs text-gray-500 mt-1">7天内截止</div>
      </div>

      {/* 热门标签 */}
      <div className="bg-[#1a1a24] rounded-xl p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-sm text-gray-400">热门标签</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {stats.topTags.length > 0 ? (
            stats.topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded text-xs"
              >
                {tag} ({count})
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">暂无数据</span>
          )}
        </div>
      </div>
    </div>
  )
}
