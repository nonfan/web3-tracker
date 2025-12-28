import { useState, useMemo, useEffect } from 'react'
import { useStore } from './store/useStore'
import { useTheme } from './store/useTheme'
import { ProjectCard } from './components/ProjectCard'
import { ProjectForm } from './components/ProjectForm'
import { DataSync } from './components/DataSync'
import { GistSync } from './components/GistSync'
import { TrashBin } from './components/TrashBin'
import { StatsChart } from './components/StatsChart'
import { BatchActions } from './components/BatchActions'
import { ThemeToggle } from './components/ThemeToggle'
import { Tooltip } from './components/Tooltip'
import { Dropdown } from './components/Dropdown'
import { LogoWithText } from './components/LogoWithText'
import { Analytics } from './components/Analytics'
import { TemplateSelector } from './components/TemplateSelector'
import type { ProjectTemplate } from './utils/templates'
import { requestNotificationPermission, sendNotification, checkDeadlines, shouldNotifyToday, markNotified } from './utils/notifications'
import type { Project, ProjectStatus, Priority } from './types'
import { Plus, Search, Inbox, FolderSearch, CheckSquare, X, SortAsc, BarChart3, Bell, Archive, ArchiveX, ChevronDown } from 'lucide-react'

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
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [archiveToast, setArchiveToast] = useState(false)
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // 初始化主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // 检查通知权限
  useEffect(() => {
    setNotificationEnabled(Notification.permission === 'granted')
  }, [])

  // 检查截止日期提醒
  useEffect(() => {
    if (!notificationEnabled || !shouldNotifyToday()) return
    
    const upcoming = checkDeadlines(projects)
    if (upcoming.length > 0) {
      const message = upcoming.map(p => 
        p.daysLeft === 0 ? `${p.name} 今天到期！` :
        p.daysLeft === 1 ? `${p.name} 明天到期` :
        `${p.name} ${p.daysLeft}天后到期`
      ).join('\n')
      
      sendNotification('项目截止提醒', message)
      markNotified()
    }
  }, [projects, notificationEnabled])

  const handleEnableNotification = async () => {
    const granted = await requestNotificationPermission()
    setNotificationEnabled(granted)
    if (granted) {
      sendNotification('通知已开启', '将在项目截止前提醒你')
    }
  }

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
      .filter((p) => {
        // 归档筛选
        if (showArchived) return p.status === 'archived'
        if (p.status === 'archived') return false
        // 状态筛选
        return filter === 'all' || p.status === filter
      })
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
  }, [projects, filter, search, tagFilter, sortBy, showArchived])

  const stats = {
    total: projects.filter(p => p.status !== 'archived').length,
    active: projects.filter((p) => p.status === 'active').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    launched: projects.filter((p) => p.status === 'launched').length,
    archived: projects.filter((p) => p.status === 'archived').length,
  }

  const handleSubmit = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'transactions'>) => {
    if (editingProject?.id) {
      updateProject(editingProject.id, data)
    } else {
      // 新建项目时，如果有模板任务则一起传入
      const tasks = editingProject?.tasks || []
      addProject({ ...data, tasks, transactions: [] })
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

  const handleTemplateSelect = (template: ProjectTemplate) => {
    // 设置编辑项目为模板数据
    setEditingProject({
      id: '',
      name: '',
      description: '',
      status: 'active',
      priority: template.defaultData.priority,
      tags: template.defaultData.tags,
      tasks: template.defaultData.tasks.map((title, i) => ({
        id: `temp-${i}`,
        title,
        completed: false,
        createdAt: Date.now(),
      })),
      transactions: [],
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as Project)
    setShowForm(true)
  }

  return (
    <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gradient-to-br from-[#0a0a0f] via-[#0f0f18] to-[#0a0a0f]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Logo & Title */}
            <LogoWithText />
            
            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 主题 & 通知 */}
              <div className="flex items-center gap-1 bg-[var(--input-bg)] border border-[var(--border)] p-1 rounded-xl">
                <ThemeToggle />
                <Tooltip content={notificationEnabled ? '通知已开启' : '开启截止提醒'}>
                  <button
                    onClick={handleEnableNotification}
                    className={`p-2 rounded-lg transition-all ${
                      notificationEnabled 
                        ? 'text-emerald-400 hover:bg-emerald-500/10' 
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>

              {/* 数据分析 & 回收站 */}
              <div className="flex items-center gap-1 bg-[var(--input-bg)] border border-[var(--border)] p-1 rounded-xl">
                <Tooltip content="数据分析">
                  <button
                    onClick={() => setShowAnalytics(true)}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </Tooltip>
                <TrashBin />
              </div>

              {/* 云同步 & 数据导入导出 */}
              <div className="flex items-center gap-1 bg-[var(--input-bg)] border border-[var(--border)] p-1 rounded-xl">
                <GistSync />
                <div className="w-px h-5 bg-[var(--border)]" />
                <DataSync />
              </div>
              
              {/* 操作按钮 */}
              {!selectionMode ? (
                <div className="flex items-center gap-2">
                  <Tooltip content="批量操作">
                    <button
                      onClick={() => setSelectionMode(true)}
                      className="p-2.5 bg-[var(--bg-tertiary)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <div className="flex">
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-l-xl hover:from-violet-500 hover:to-purple-500 font-medium flex items-center gap-2 shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 text-white text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      添加项目
                    </button>
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="px-2 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 rounded-r-xl hover:from-purple-500 hover:to-purple-600 font-medium shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 text-white text-sm border-l border-white/20"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
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
        </header>        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: '总项目', value: stats.total, color: 'slate', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
            { label: '进行中', value: stats.active, color: 'emerald', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
            { label: '已完成', value: stats.completed, color: 'blue', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
            { label: '已发币', value: stats.launched, color: 'violet', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bgColor} border ${stat.borderColor} rounded-xl p-4 transition-all hover:scale-[1.02]`}
            >
              <div className="text-xs text-[var(--text-muted)] font-medium mb-1">{stat.label}</div>
              <div className={`text-3xl font-bold ${
                stat.color === 'slate' ? 'text-[var(--text-primary)]' :
                stat.color === 'emerald' ? 'text-emerald-400' :
                stat.color === 'blue' ? 'text-blue-400' : 'text-violet-400'
              }`}>
                {stat.value}
              </div>
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
            <Dropdown
              value={sortBy}
              onChange={(v) => setSortBy(v as SortBy)}
              icon={<SortAsc className="w-4 h-4 text-[var(--text-muted)]" />}
              options={[
                { value: 'updated', label: '最近更新' },
                { value: 'priority', label: '优先级' },
                { value: 'deadline', label: '截止日期' },
                { value: 'name', label: '名称' },
              ]}
            />

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
              {/* 归档按钮 */}
              <Tooltip content={showArchived ? '返回项目列表' : `${stats.archived} 个已归档`}>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    showArchived
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
                onArchive={(archived) => {
                  if (archived && !showArchived) {
                    // 归档后如果不在归档视图，显示提示
                    setArchiveToast(true)
                    setTimeout(() => setArchiveToast(false), 3000)
                  }
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

        {/* Analytics Modal */}
        <Analytics 
          projects={projects} 
          isOpen={showAnalytics} 
          onClose={() => setShowAnalytics(false)} 
        />

        {/* Template Selector */}
        <TemplateSelector
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelect={handleTemplateSelect}
        />

        {/* Archive Toast */}
        {archiveToast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex items-center gap-3 z-50">
            <span className="text-slate-300">项目已归档</span>
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
    </div>
  )
}

export default App
