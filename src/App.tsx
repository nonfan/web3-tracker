import { useState, useMemo, useEffect } from 'react'
import { useStore } from './store/useStore'
import { useTheme } from './store/useTheme'
import { ProjectCard } from './components/ProjectCard'
import { ProjectForm } from './components/ProjectForm'
import { DataSync } from './components/DataSync'
import { GistSync } from './components/GistSync'
import { StatsChart } from './components/StatsChart'
import { BatchActions } from './components/BatchActions'
import { ThemeToggle } from './components/ThemeToggle'
import type { Project, ProjectStatus, Priority } from './types'
import { Target, Plus, Search, Inbox, FolderSearch, CheckSquare, X, SortAsc } from 'lucide-react'

type FilterStatus = ProjectStatus | 'all'
type SortBy = 'updated' | 'priority' | 'deadline' | 'name'

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

function App() {
  const { projects, addProject, updateProject } = useStore()
  const { theme } = useTheme()
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('updated')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // 初始化主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagCounts: Record<string, number> = {}
    projects.forEach((p) => {
      p.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => filter === 'all' || p.status === filter)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .filter((p) => !tagFilter || p.tags.includes(tagFilter))
      .sort((a, b) => {
        switch (sortBy) {
          case 'priority':
            return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium']
          case 'deadline':
            if (!a.deadline && !b.deadline) return 0
            if (!a.deadline) return 1
            if (!b.deadline) return -1
            return a.deadline - b.deadline
          case 'name':
            return a.name.localeCompare(b.name)
          default:
            return b.updatedAt - a.updatedAt
        }
      })
  }, [projects, filter, search, tagFilter, sortBy])

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    launched: projects.filter((p) => p.status === 'launched').length,
  }

  const handleSubmit = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => {
    if (editingProject) {
      updateProject(editingProject.id, data)
    } else {
      addProject(data)
    }
    setShowForm(false)
    setEditingProject(undefined)
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
    <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gradient-to-br from-[#0a0a0f] via-[#0f0f18] to-[#0a0a0f]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Web3 Tracker
                </h1>
                <p className="text-[var(--text-muted)] text-xs">撸毛项目追踪管理</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 工具按钮组 */}
              <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl">
                <ThemeToggle />
                <div className="w-px h-5 bg-[var(--border)]" />
                <GistSync />
                <DataSync />
              </div>
              
              {/* 操作按钮 */}
              {!selectionMode ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectionMode(true)}
                    className="p-2.5 bg-[var(--bg-tertiary)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
                    title="批量操作"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:from-violet-500 hover:to-purple-500 font-medium flex items-center gap-2 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 text-white text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加项目
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
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '总项目', value: stats.total, gradient: 'from-gray-600 to-gray-700', shadow: 'shadow-gray-500/10' },
            { label: '进行中', value: stats.active, gradient: 'from-emerald-600 to-green-600', shadow: 'shadow-emerald-500/20' },
            { label: '已完成', value: stats.completed, gradient: 'from-blue-600 to-cyan-600', shadow: 'shadow-blue-500/20' },
            { label: '已发币', value: stats.launched, gradient: 'from-violet-600 to-purple-600', shadow: 'shadow-violet-500/20' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 text-center shadow-lg ${stat.shadow} border border-white/5`}
            >
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Advanced Stats */}
        <StatsChart projects={projects} />

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索项目..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
              />
            </div>
            
            {/* Sort */}
            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3">
              <SortAsc className="w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-transparent py-2.5 text-sm text-[var(--text-secondary)] outline-none"
              >
                <option value="updated">最近更新</option>
                <option value="priority">优先级</option>
                <option value="deadline">截止日期</option>
                <option value="name">名称</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)]">
              {[
                { value: 'all', label: '全部' },
                { value: 'active', label: '进行中' },
                { value: 'completed', label: '已完成' },
                { value: 'launched', label: '已发币' },
                { value: 'dead', label: '已凉' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value as FilterStatus)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === f.value
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
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

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => {
                  setEditingProject(project)
                  setShowForm(true)
                }}
                selectionMode={selectionMode}
                selected={selectedIds.includes(project.id)}
                onSelect={toggleSelection}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border)]">
                  <Inbox className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <p className="text-[var(--text-secondary)]">还没有项目，点击上方按钮添加第一个</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border)]">
                  <FolderSearch className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                <p className="text-[var(--text-secondary)]">没有找到匹配的项目</p>
              </div>
            )}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <ProjectForm
            project={editingProject}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false)
              setEditingProject(undefined)
            }}
          />
        )}

        {/* Batch Actions */}
        {selectionMode && (
          <BatchActions selectedIds={selectedIds} onClear={exitSelectionMode} />
        )}
      </div>
    </div>
  )
}

export default App
