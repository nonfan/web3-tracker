import { useState, useMemo } from 'react'
import { useStore } from './store/useStore'
import { ProjectCard } from './components/ProjectCard'
import { ProjectForm } from './components/ProjectForm'
import { DataSync } from './components/DataSync'
import { GistSync } from './components/GistSync'
import { StatsChart } from './components/StatsChart'
import { BatchActions } from './components/BatchActions'
import type { Project, ProjectStatus, Priority } from './types'
import { Target, Plus, Search, Inbox, FolderSearch, CheckSquare, X, SortAsc } from 'lucide-react'

type FilterStatus = ProjectStatus | 'all'
type SortBy = 'updated' | 'priority' | 'deadline' | 'name'

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

function App() {
  const { projects, addProject, updateProject } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('updated')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f18] to-[#0a0a0f]">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Web3 Tracker
              </h1>
              <p className="text-gray-500 text-sm">撸毛项目追踪管理</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GistSync />
            <DataSync />
            {!selectionMode ? (
              <>
                <button
                  onClick={() => setSelectionMode(true)}
                  className="px-3 py-2.5 bg-[#1a1a24] border border-white/5 rounded-xl text-sm hover:bg-[#22222e] hover:border-white/10 flex items-center gap-2 text-gray-400 hover:text-white transition-all"
                >
                  <CheckSquare className="w-4 h-4" />
                  批量
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:from-violet-500 hover:to-purple-500 font-medium flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/30"
                >
                  <Plus className="w-4 h-4" />
                  添加项目
                </button>
              </>
            ) : (
              <button
                onClick={exitSelectionMode}
                className="px-4 py-2.5 bg-[#1a1a24] border border-white/5 rounded-xl text-sm hover:bg-[#22222e] flex items-center gap-2 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
                退出批量
              </button>
            )}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索项目..."
                className="w-full bg-[#1a1a24] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
              />
            </div>
            
            {/* Sort */}
            <div className="flex items-center gap-2 bg-[#1a1a24] border border-white/5 rounded-xl px-3">
              <SortAsc className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="bg-transparent py-2.5 text-sm text-gray-300 outline-none"
              >
                <option value="updated">最近更新</option>
                <option value="priority">优先级</option>
                <option value="deadline">截止日期</option>
                <option value="name">名称</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex gap-1 bg-[#1a1a24] p-1 rounded-xl border border-white/5">
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
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
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
              <span className="text-xs text-gray-500">标签筛选:</span>
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
                    className="px-2 py-1 bg-white/5 text-gray-400 rounded-lg text-xs font-medium hover:bg-white/10 hover:text-white transition-colors"
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
                <div className="w-16 h-16 bg-[#1a1a24] rounded-2xl flex items-center justify-center border border-white/5">
                  <Inbox className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500">还没有项目，点击上方按钮添加第一个</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-[#1a1a24] rounded-2xl flex items-center justify-center border border-white/5">
                  <FolderSearch className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500">没有找到匹配的项目</p>
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
