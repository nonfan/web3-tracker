import { useState, useEffect } from 'react'
import type { Project, ProjectStatus, Priority } from '../types'
import { PRESET_TAGS } from '../utils/tagAnalyzer'
import { X, Plus, Globe, MessageCircle, Calendar, Flag } from 'lucide-react'

interface Props {
  project?: Project
  onSubmit: (data: {
    name: string
    description: string
    website: string
    twitter: string
    discord: string
    status: ProjectStatus
    priority: Priority
    tags: string[]
    deadline?: number
    notes: string
  }) => void
  onCancel: () => void
}

function normalizeTwitter(input: string): string {
  if (!input.trim()) return ''
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input
  }
  const username = input.replace(/^@/, '').trim()
  return `https://x.com/${username}`
}

function extractTwitterUsername(url: string): string {
  if (!url) return ''
  const match = url.match(/(?:twitter\.com|x\.com)\/([^/?]+)/)
  return match ? match[1] : url
}

export function ProjectForm({ project, onSubmit, onCancel }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [discord, setDiscord] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [priority, setPriority] = useState<Priority>('medium')
  const [tags, setTags] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description)
      setWebsite(project.website || '')
      setTwitter(extractTwitterUsername(project.twitter || ''))
      setDiscord(project.discord || '')
      setStatus(project.status)
      setPriority(project.priority || 'medium')
      setTags(project.tags || [])
      setDeadline(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '')
      setNotes(project.notes)
    }
  }, [project])

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setNewTag('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ 
      name, 
      description, 
      website, 
      twitter: normalizeTwitter(twitter), 
      discord, 
      status,
      priority,
      tags,
      deadline: deadline ? new Date(deadline).getTime() : undefined,
      notes 
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1a1a24] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {project ? '编辑项目' : '添加项目'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* 项目名称 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              项目名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
              placeholder="如：LayerZero"
              required
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
              placeholder="简短描述"
            />
          </div>

          {/* 链接 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> 官网
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter
              </label>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
                placeholder="用户名"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> Discord
              </label>
              <input
                type="url"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
                placeholder="邀请链接"
              />
            </div>
          </div>

          {/* 状态和优先级 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">状态</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'active', label: '进行中', color: 'emerald' },
                  { value: 'completed', label: '已完成', color: 'blue' },
                  { value: 'launched', label: '已发币', color: 'violet' },
                  { value: 'dead', label: '已凉', color: 'gray' },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value as ProjectStatus)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      status === s.value
                        ? s.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
                        : s.color === 'blue' ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                        : s.color === 'violet' ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50'
                        : 'bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/50'
                        : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> 优先级
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'high', label: '高', color: 'red' },
                  { value: 'medium', label: '中', color: 'amber' },
                  { value: 'low', label: '低', color: 'gray' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value as Priority)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      priority === p.value
                        ? p.color === 'red' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50'
                        : p.color === 'amber' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                        : 'bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/50'
                        : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 截止日期 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> 截止日期（快照/TGE）
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-gray-300"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">标签</label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-violet-500/20 text-violet-400 rounded-lg text-xs font-medium flex items-center gap-1.5"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(newTag)
                  }
                }}
                placeholder="输入自定义标签，回车添加"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => addTag(newTag)}
                className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.filter(t => !tags.includes(t)).slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-2.5 py-1 bg-white/5 text-gray-500 rounded-lg text-xs font-medium hover:bg-white/10 hover:text-gray-300 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none placeholder:text-gray-600"
              rows={3}
              placeholder="其他备注信息..."
            />
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20"
          >
            {project ? '保存' : '添加'}
          </button>
        </div>
      </form>
    </div>
  )
}
