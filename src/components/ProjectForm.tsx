import { useState, useEffect, useRef, useCallback } from 'react'
import type { Project, ProjectStatus, Priority } from '../types'
import { PRESET_TAGS } from '../utils/tagAnalyzer'
import { DatePicker } from './DatePicker'
import { ConfirmDialog } from './ConfirmDialog'
import { X, Plus, Globe, MessageCircle, Flag } from 'lucide-react'
import gsap from 'gsap'

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
  const [showConfirm, setShowConfirm] = useState(false)
  
  const overlayRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // 检查表单是否有数据（新建时）或有修改（编辑时）
  const hasFormData = useCallback(() => {
    // 编辑模式：有 project 且有 id
    if (project && project.id) {
      // 检查是否有修改
      return (
        name !== project.name ||
        description !== project.description ||
        website !== (project.website || '') ||
        twitter !== extractTwitterUsername(project.twitter || '') ||
        discord !== (project.discord || '') ||
        status !== project.status ||
        priority !== (project.priority || 'medium') ||
        JSON.stringify(tags) !== JSON.stringify(project.tags || []) ||
        deadline !== (project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '') ||
        notes !== project.notes
      )
    }
    // 新建模式（包括模板）：检查是否填写了任何数据
    return !!(
      name.trim() ||
      description.trim() ||
      website.trim() ||
      twitter.trim() ||
      discord.trim() ||
      tags.length > 0 ||
      deadline ||
      notes.trim()
    )
  }, [name, description, website, twitter, discord, status, priority, tags, deadline, notes, project])

  // 处理关闭
  const handleClose = useCallback(() => {
    if (hasFormData()) {
      setShowConfirm(true)
    } else {
      onCancel()
    }
  }, [hasFormData, onCancel])

  useEffect(() => {
    if (overlayRef.current && formRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2 }
      )
      gsap.fromTo(formRef.current,
        { opacity: 0, scale: 0.9, y: -20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'back.out(1.5)' }
      )
    }
  }, [])

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
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
      style={{ opacity: 0 }}
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--card-bg)] rounded-2xl p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[var(--border-hover)] shadow-2xl"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {project?.id ? '编辑项目' : '添加项目'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 第一行：项目名称 + 描述 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                项目名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
                placeholder="如：LayerZero"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">描述</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
                placeholder="简短描述"
              />
            </div>
          </div>

          {/* 第二行：链接 */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3 shrink-0" /> 官网
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Twitter
              </label>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
                placeholder="用户名"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <MessageCircle className="w-3 h-3 shrink-0" /> Discord
              </label>
              <input
                type="url"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
                placeholder="邀请链接"
              />
            </div>
          </div>

          {/* 第三行：状态 + 优先级 + 截止日期 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">状态</label>
              <div className="grid grid-cols-4 gap-1 h-[34px]">
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
                    className={`h-full rounded-lg text-xs font-medium transition-all ${
                      status === s.value
                        ? s.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
                        : s.color === 'blue' ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                        : s.color === 'violet' ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50'
                        : 'bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/50'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <Flag className="w-3 h-3 shrink-0" /> 优先级
              </label>
              <div className="grid grid-cols-3 gap-1 h-[34px]">
                {[
                  { value: 'high', label: '高', color: 'red' },
                  { value: 'medium', label: '中', color: 'amber' },
                  { value: 'low', label: '低', color: 'gray' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value as Priority)}
                    className={`h-full rounded-lg text-xs font-medium transition-all ${
                      priority === p.value
                        ? p.color === 'red' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50'
                        : p.color === 'amber' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50'
                        : 'bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/50'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">截止日期</label>
              <DatePicker
                value={deadline}
                onChange={setDeadline}
                placeholder="选择日期"
              />
            </div>
          </div>

          {/* 第四行：标签 */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">标签</label>
            <div className="flex gap-2 mb-2">
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
                placeholder="输入标签，回车添加"
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
              />
              <button
                type="button"
                onClick={() => addTag(newTag)}
                className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition-colors text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {/* 已选标签 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded text-xs font-medium flex items-center gap-1"
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
            {/* 预设标签 */}
            <div className="flex flex-wrap gap-1">
              {PRESET_TAGS.filter(t => !tags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-2 py-0.5 bg-[var(--input-bg)] text-[var(--text-muted)] rounded text-xs font-medium hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 第五行：备注 */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
              rows={2}
              placeholder="其他备注信息..."
            />
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg font-medium text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg font-medium text-sm hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20 text-white"
          >
            {project?.id ? '保存' : '添加'}
          </button>
        </div>
      </form>

      {/* 关闭确认弹窗 */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="放弃编辑？"
        message="表单中有未保存的内容，确定要放弃吗？"
        confirmText="放弃"
        cancelText="继续编辑"
        onConfirm={onCancel}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
