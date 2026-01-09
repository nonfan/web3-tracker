import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store/useStore'
import type { Project } from '../types'
import {
  getGistConfig,
  saveGistConfig,
  clearGistConfig,
  validateToken,
  findAllGists,
  syncToGist,
  pullFromGist,
  forcePushToGist,
  updateSyncStateAfterPull,
  type GistInfo,
  type DiffResult,
} from '../utils/gistSync'
import { Tooltip } from './Tooltip'
import { Cloud, CloudOff, RefreshCw, Settings, X, Check, AlertCircle, ChevronDown, AlertTriangle } from 'lucide-react'
import gsap from 'gsap'

// Modal 组件 - 使用 Portal 渲染到 body
function Modal({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose()
        }
      }}
    >
      {children}
    </div>,
    document.body
  )
}

// 复制按钮组件，带勾选状态反馈
function CopyButton({ text, onCopy, className = '' }: { text: string; onCopy?: () => void; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }, [text, onCopy])

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`transition-all flex items-center justify-center w-[54px] ${className}`}
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <span>复制</span>
      )}
    </button>
  )
}

interface GistDropdownProps {
  label: string
  value: string
  options: GistInfo[]
  onChange: (value: string) => void
  formatDate: (date: string) => string
  type: 'project' | 'economic'
}

function GistDropdown({ label, value, options, onChange, formatDate, type }: GistDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && menuRef.current) {
      gsap.fromTo(menuRef.current,
        { opacity: 0, y: -8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [isOpen])

  // 过滤对应类型的 Gist
  const filteredOptions = options.filter(o => o.type === type)
  const selectedOption = filteredOptions.find(o => o.id === value)
  
  const displayText = selectedOption 
    ? `${selectedOption.fileName || selectedOption.description || selectedOption.id.slice(0, 8) + '...'} (更新于 ${formatDate(selectedOption.updatedAt)})`
    : '创建新存储'

  const focusRingClass = type === 'economic' ? 'focus:ring-emerald-500/50 focus:border-emerald-500/50' : 'focus:ring-violet-500/50 focus:border-violet-500/50'
  const bgColorClass = type === 'economic' ? 'bg-emerald-400' : 'bg-violet-400'
  const selectedBgClass = type === 'economic' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400'

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm text-[var(--text-secondary)] mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none ${focusRingClass} transition-all text-left flex items-center justify-between text-[var(--text-secondary)]`}
      >
        <span className="truncate flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${bgColorClass}`}></span>
          {displayText}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute top-full left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          style={{ zIndex: 100000 }}
        >
          <button
            type="button"
            onClick={() => {
              onChange('')
              setIsOpen(false)
            }}
            className={`w-full px-4 py-3 text-sm text-left transition-colors ${
              !value
                ? selectedBgClass
                : 'text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]'
            }`}
          >
            创建新存储
          </button>
          
          {filteredOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                option.id === value
                  ? selectedBgClass
                  : 'text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="truncate flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${bgColorClass}`}></span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">
                    {option.fileName || option.description || `Gist ${option.id.slice(0, 8)}...`}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] truncate">
                    {option.id} • 更新于 {formatDate(option.updatedAt)}
                  </div>
                </div>
              </div>
            </button>
          ))}
          
          {filteredOptions.length === 0 && (
            <div className="px-4 py-3 text-sm text-[var(--text-muted)] text-center">
              暂无{type === 'economic' ? '经济数据' : '项目数据'}存储
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function GistSync() {
  const { exportData, importData } = useStore()
  const [isConfigured, setIsConfigured] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTechDocs, setShowTechDocs] = useState(false)
  const [showConflict, setShowConflict] = useState(false)
  const [conflictDiff, setConflictDiff] = useState<DiffResult | null>(null)
  const [remoteData, setRemoteData] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [projectGistId, setProjectGistId] = useState('')
  const [economicGistId, setEconomicGistId] = useState('')
  const [gistList, setGistList] = useState<GistInfo[]>([])
  const [pushing, setPushing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingGists, setLoadingGists] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const config = getGistConfig()
    setIsConfigured(!!config?.token)
    if (config) {
      setToken(config.token)
      setProjectGistId(config.projectGistId || '')
      setEconomicGistId(config.economicGistId || '')
    }
  }, [])

  // 当弹窗打开且有 token 时自动加载 Gist 列表
  useEffect(() => {
    if (showSettings && token && token.startsWith('ghp_') && gistList.length === 0) {
      loadGistList(token)
    }
  }, [showSettings, token])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 加载 Gist 列表
  const loadGistList = async (tokenToUse: string) => {
    if (!tokenToUse) return
    setLoadingGists(true)
    const gists = await findAllGists(tokenToUse)
    setGistList(gists)
    setLoadingGists(false)
  }

  // Token 输入后自动加载 Gist 列表
  const handleTokenBlur = async () => {
    if (token && token.startsWith('ghp_')) {
      await loadGistList(token)
    }
  }

  const handleSaveConfig = async () => {
    if (!token.trim()) {
      showMessage('error', '请输入 Token')
      return
    }

    setSaving(true)
    const valid = await validateToken(token)
    if (!valid) {
      showMessage('error', 'Token 无效，请检查')
      setSaving(false)
      return
    }

    // 保存项目 Gist 配置
    saveGistConfig({ 
      token, 
      projectGistId: projectGistId || null,
      economicGistId: economicGistId || null
    })
    
    // 同时保存经济数据 Gist 配置
    if (economicGistId) {
      const { saveEconomicGistConfig } = await import('../utils/economicDataApi')
      saveEconomicGistConfig({
        token,
        gistId: economicGistId,
        useProjectGist: false
      })
    }
    
    setIsConfigured(true)
    setShowSettings(false)
    
    const configuredItems = []
    if (projectGistId) configuredItems.push('项目数据')
    if (economicGistId) configuredItems.push('经济数据')
    
    if (configuredItems.length > 0) {
      showMessage('success', `已配置 ${configuredItems.join(' 和 ')} 存储`)
    } else {
      showMessage('success', '配置已保存，推送时将创建新存储')
    }
    setSaving(false)
  }

  const handleDisconnect = () => {
    clearGistConfig()
    setIsConfigured(false)
    setToken('')
    setProjectGistId('')
    setEconomicGistId('')
    setGistList([])
    setShowSettings(false)
    showMessage('success', '已断开连接')
  }

  const handlePush = async () => {
    setPushing(true)
    const data = exportData()
    
    // 检查是否为空数据
    try {
      const parsed = JSON.parse(data)
      if (!parsed.projects || parsed.projects.length === 0) {
        showMessage('error', '本地没有数据，无法推送空数据覆盖云端')
        setPushing(false)
        return
      }
    } catch {
      showMessage('error', '数据格式错误')
      setPushing(false)
      return
    }
    
    const result = await syncToGist(data)
    if (result.success) {
      const config = getGistConfig()
      if (config?.projectGistId) {
        setProjectGistId(config.projectGistId)
        showMessage('success', `已同步到云端`)
      } else {
        showMessage('success', '已同步到云端')
      }
    } else if (result.conflict && result.diff) {
      // 有冲突，显示冲突处理弹窗
      setConflictDiff(result.diff)
      setRemoteData(result.remoteData || null)
      setShowConflict(true)
    } else if (result.needSelect) {
      showMessage('error', result.error || '请先选择云端存储')
      setShowSettings(true)
      await loadGistList(token)
    } else {
      showMessage('error', result.error || '同步失败')
    }
    setPushing(false)
  }

  // 强制用本地覆盖云端
  const handleForceLocal = async () => {
    setPushing(true)
    const data = exportData()
    const result = await forcePushToGist(data)
    if (result.success) {
      showMessage('success', '已用本地数据覆盖云端')
    } else {
      showMessage('error', result.error || '推送失败')
    }
    setShowConflict(false)
    setConflictDiff(null)
    setPushing(false)
  }

  // 用云端覆盖本地
  const handleForceRemote = async () => {
    if (remoteData) {
      const imported = importData(remoteData)
      if (imported) {
        // 获取云端版本号并更新同步状态
        try {
          const parsed = JSON.parse(remoteData)
          updateSyncStateAfterPull(remoteData, parsed.syncVersion || 0)
        } catch {
          // 忽略解析错误
        }
        showMessage('success', '已用云端数据覆盖本地')
      } else {
        showMessage('error', '导入失败')
      }
    }
    setShowConflict(false)
    setConflictDiff(null)
  }

  const formatProjectName = (p: Project) => p.name

  const handlePull = async () => {
    setPulling(true)
    const result = await pullFromGist()
    if (result.success && result.data) {
      const imported = importData(result.data)
      if (imported) {
        // 更新同步状态
        updateSyncStateAfterPull(result.data, result.version || 0)
        showMessage('success', '已从云端拉取数据')
      } else {
        showMessage('error', '数据格式错误')
      }
    } else {
      showMessage('error', result.error || '拉取失败')
    }
    setPulling(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {isConfigured ? (
          <>
            <Tooltip content="推送到云端">
              <button
                onClick={handlePush}
                disabled={pushing || pulling}
                className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
              >
                {pushing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="从云端拉取">
              <button
                onClick={handlePull}
                disabled={pushing || pulling}
                className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-50"
              >
                {pulling ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="同步设置">
              <button
                onClick={() => {
                  setShowSettings(true)
                  loadGistList(token)
                }}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>
            </Tooltip>
          </>
        ) : (
          <Tooltip content="配置云同步">
            <button
              data-gist-settings
              onClick={() => {
                setShowSettings(true)
                if (token) {
                  loadGistList(token)
                }
              }}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
            >
              <CloudOff className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Message Toast - z-[10001] 确保在所有遮罩层之上 */}
      {message && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
          style={{ zIndex: 10001 }}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message.text}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)}>
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-md border border-[var(--border-hover)] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                <Cloud className="w-5 h-5 text-violet-400" />
                GitHub Gist 同步
              </h2>
              <div className="flex items-center gap-1">
                <Tooltip content="技术文档">
                  <button
                    onClick={() => setShowTechDocs(true)}
                    className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </Tooltip>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm text-violet-300">
                <p className="mb-2">数据将存储在你的私有 GitHub Gist 中，完全安全。</p>
                <p>
                  需要创建一个{' '}
                  <a
                    href="https://github.com/settings/tokens/new?scopes=gist&description=Web3Tracker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 underline"
                  >
                    Personal Access Token
                  </a>
                  ，勾选 <code className="bg-white/10 px-1 rounded">gist</code> 权限。
                </p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  路径: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → New personal access token (classic)
                </p>
              </div>

              {/* 选择数据类型提示 */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm">
                <p className="text-blue-300 font-medium mb-2">💡 选择数据类型</p>
                <div className="space-y-1 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                    <span><strong>项目数据</strong>：存储你的 Web3 项目信息</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span><strong>经济数据</strong>：存储 FRED 经济数据和加密货币市值（适合 GitHub Actions 自动更新）</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  GitHub Token <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onBlur={handleTokenBlur}
                    className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
                    placeholder="ghp_xxxxxxxxxxxx"
                  />
                  {token && (
                    <CopyButton
                      text={token}
                      onCopy={() => showMessage('success', 'Token 已复制')}
                      className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                    />
                  )}
                </div>
              </div>

              <div>
                <div className="space-y-4">
                  <GistDropdown
                    label="项目数据存储"
                    value={projectGistId}
                    options={gistList}
                    onChange={setProjectGistId}
                    formatDate={formatDate}
                    type="project"
                  />
                  
                  <GistDropdown
                    label="经济数据存储"
                    value={economicGistId}
                    options={gistList}
                    onChange={setEconomicGistId}
                    formatDate={formatDate}
                    type="economic"
                  />
                </div>
                
                {loadingGists && (
                  <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    加载中...
                  </p>
                )}
                {!loadingGists && gistList.length === 0 && token && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    未找到已有数据，推送时将创建新存储
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {isConfigured && (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl font-medium text-red-400 hover:bg-red-500/30 transition-all"
                >
                  断开
                </button>
              )}
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 text-white"
              >
                {saving ? '验证中...' : '保存'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Conflict Modal */}
      {showConflict && conflictDiff && (
        <Modal onClose={() => { setShowConflict(false); setConflictDiff(null); }}>
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-lg border border-[var(--border-hover)] shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                检测到数据冲突
              </h2>
              <button
                onClick={() => {
                  setShowConflict(false)
                  setConflictDiff(null)
                }}
                className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              <p className="text-sm text-[var(--text-secondary)]">
                本地数据与云端数据不一致，请选择保留哪边的数据：
              </p>

              {/* 云端独有 */}
              {conflictDiff.remoteOnly.length > 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-sm font-medium text-blue-400 mb-2">
                    云端有、本地没有 ({conflictDiff.remoteOnly.length})
                  </p>
                  <div className="space-y-1">
                    {conflictDiff.remoteOnly.map(p => (
                      <div key={p.id} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        {formatProjectName(p)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 本地独有 */}
              {conflictDiff.localOnly.length > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-sm font-medium text-emerald-400 mb-2">
                    本地有、云端没有 ({conflictDiff.localOnly.length})
                  </p>
                  <div className="space-y-1">
                    {conflictDiff.localOnly.map(p => (
                      <div key={p.id} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {formatProjectName(p)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 两边都改了 */}
              {conflictDiff.modified.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-sm font-medium text-amber-400 mb-2">
                    两边都有修改 ({conflictDiff.modified.length})
                  </p>
                  <div className="space-y-2">
                    {conflictDiff.modified.map(({ local, remote }) => (
                      <div key={local.id} className="text-xs bg-[var(--input-bg)] rounded-lg p-2">
                        <div className="font-medium text-[var(--text-primary)] mb-1">{formatProjectName(local)}</div>
                        <div className="grid grid-cols-2 gap-2 text-[var(--text-muted)]">
                          <div>
                            <span className="text-emerald-400">本地:</span> {new Date(local.updatedAt).toLocaleString('zh-CN')}
                          </div>
                          <div>
                            <span className="text-blue-400">云端:</span> {new Date(remote.updatedAt).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 未变化 */}
              {conflictDiff.unchanged.length > 0 && (
                <div className="p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl">
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-1">
                    未变化 ({conflictDiff.unchanged.length})
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {conflictDiff.unchanged.map(p => formatProjectName(p)).join('、')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  setShowConflict(false)
                  setConflictDiff(null)
                }}
                className="flex-1 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"
              >
                取消
              </button>
              <button
                onClick={handleForceRemote}
                className="flex-1 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl font-medium text-blue-400 hover:bg-blue-500/30 transition-all"
              >
                用云端覆盖本地
              </button>
              <button
                onClick={handleForceLocal}
                disabled={pushing}
                className="flex-1 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl font-medium text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
              >
                {pushing ? '推送中...' : '用本地覆盖云端'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Tech Documentation Modal */}
      {showTechDocs && (
        <Modal onClose={() => setShowTechDocs(false)}>
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-4xl border border-[var(--border-hover)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                GitHub Actions 自动更新技术文档
              </h2>
              <button
                onClick={() => setShowTechDocs(false)}
                className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-sm">
              {/* 概述 */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <h3 className="text-blue-400 font-semibold mb-2">📋 概述</h3>
                <p className="text-[var(--text-secondary)]">
                  通过 GitHub Actions 自动获取经济数据（FRED API）和加密货币市值数据，并同步到你的 Gist 存储中。
                  这样可以确保数据始终保持最新，无需手动更新。
                </p>
              </div>

              {/* 步骤1: 创建GitHub仓库 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-6 h-6 bg-violet-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  创建 GitHub 仓库
                </h3>
                <div className="pl-8 space-y-2">
                  <p className="text-[var(--text-secondary)]">在 GitHub 上创建一个新的私有仓库用于存放 Actions 脚本：</p>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3">
                    <code className="text-emerald-400">仓库名称: web3tracker-data-sync</code>
                  </div>
                </div>
              </div>

              {/* 步骤2: 添加Secrets */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-6 h-6 bg-violet-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  配置 Repository Secrets
                </h3>
                <div className="pl-8 space-y-3">
                  <p className="text-[var(--text-secondary)]">在仓库设置中添加以下 Secrets：</p>
                  <div className="space-y-2">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3">
                      <div className="font-medium text-amber-400 mb-1">GITHUB_TOKEN</div>
                      <div className="text-xs text-[var(--text-muted)]">你的 GitHub Personal Access Token (需要 gist 权限)</div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3">
                      <div className="font-medium text-amber-400 mb-1">ECONOMIC_GIST_ID</div>
                      <div className="text-xs text-[var(--text-muted)]">经济数据存储的 Gist ID (从上面的设置中获取)</div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-3">
                      <div className="font-medium text-amber-400 mb-1">FRED_API_KEY</div>
                      <div className="text-xs text-[var(--text-muted)]">FRED API 密钥 (可选，用于获取美联储数据)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 步骤3: 创建Actions文件 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-6 h-6 bg-violet-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  创建 GitHub Actions 工作流
                </h3>
                <div className="pl-8 space-y-3">
                  <p className="text-[var(--text-secondary)]">创建文件 <code className="bg-[var(--bg-secondary)] px-2 py-1 rounded">.github/workflows/update-data.yml</code>：</p>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap">
{`name: Update Economic Data

on:
  schedule:
    # 每天 UTC 时间 02:00 (北京时间 10:00) 运行
    - cron: '0 2 * * *'
  workflow_dispatch: # 允许手动触发

jobs:
  update-data:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm init -y
        npm install axios
        
    - name: Update economic data
      run: node update-economic-data.js
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        ECONOMIC_GIST_ID: \${{ secrets.ECONOMIC_GIST_ID }}
        FRED_API_KEY: \${{ secrets.FRED_API_KEY }}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* 步骤4: 创建更新脚本 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-6 h-6 bg-violet-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  创建数据更新脚本
                </h3>
                <div className="pl-8 space-y-3">
                  <p className="text-[var(--text-secondary)]">创建文件 <code className="bg-[var(--bg-secondary)] px-2 py-1 rounded">update-economic-data.js</code>：</p>
                  
                  {/* 多国数据源说明 */}
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm">
                    <h4 className="text-emerald-400 font-semibold mb-2">🌍 多国数据源推荐</h4>
                    <div className="space-y-2 text-[var(--text-secondary)]">
                      <div><strong className="text-emerald-300">🇨🇳 中国</strong>: AkShare (Python库) - 爬取东方财富、新浪财经、统计局数据，中文友好</div>
                      <div><strong className="text-blue-300">🇯🇵 日本</strong>: e-Stat API - 日本政府统计门户，覆盖最全的本土数据</div>
                      <div><strong className="text-violet-300">🌐 全球</strong>: World Bank API - 长期全球发展指标，完全免费</div>
                      <div><strong className="text-amber-300">📈 金融市场</strong>: Yahoo Finance API - 日经225 (^N225)、上证指数 (000001.SS)</div>
                    </div>
                  </div>

                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap">
{`const axios = require('axios');

async function updateEconomicData() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GIST_ID = process.env.ECONOMIC_GIST_ID;
  const FRED_API_KEY = process.env.FRED_API_KEY;

  if (!GITHUB_TOKEN || !GIST_ID) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  try {
    const currentDate = new Date().toISOString().split('T')[0];
    let newData = [];

    // 1. 获取加密货币市值数据 (全球)
    console.log('Fetching crypto market data...');
    const cryptoResponse = await axios.get(
      'https://api.coingecko.com/api/v3/global'
    );
    
    const cryptoData = {
      date: currentDate,
      total: (cryptoResponse.data.data.total_market_cap.usd / 1e12).toFixed(2),
      btc: (cryptoResponse.data.data.market_cap_percentage.btc * 
            cryptoResponse.data.data.total_market_cap.usd / 100 / 1e12).toFixed(2),
      eth: (cryptoResponse.data.data.market_cap_percentage.eth * 
            cryptoResponse.data.data.total_market_cap.usd / 100 / 1e12).toFixed(2),
      type: 'crypto'
    };
    newData.push(cryptoData);

    // 2. 获取美国经济数据 (FRED API)
    if (FRED_API_KEY) {
      console.log('Fetching US economic data...');
      
      // 美联储利率
      const fedRateResponse = await axios.get(
        \`https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=\${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc\`
      );
      
      if (fedRateResponse.data.observations.length > 0) {
        const latestRate = fedRateResponse.data.observations[0];
        newData.push({
          date: latestRate.date,
          rate: parseFloat(latestRate.value),
          type: 'fed_rate',
          country: 'US'
        });
      }

      // 通胀率 (CPI)
      const inflationResponse = await axios.get(
        \`https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=\${FRED_API_KEY}&file_type=json&limit=12&sort_order=desc\`
      );
      
      if (inflationResponse.data.observations.length >= 12) {
        const latest = inflationResponse.data.observations[0];
        const yearAgo = inflationResponse.data.observations[11];
        const inflationRate = ((parseFloat(latest.value) - parseFloat(yearAgo.value)) / parseFloat(yearAgo.value) * 100).toFixed(2);
        
        newData.push({
          date: latest.date,
          value: parseFloat(inflationRate),
          type: 'inflation',
          country: 'US'
        });
      }
    }

    // 3. 获取全球股指数据 (Yahoo Finance)
    console.log('Fetching global stock indices...');
    const indices = [
      { symbol: '^N225', name: 'Nikkei 225', country: 'JP' },
      { symbol: '000001.SS', name: 'Shanghai Composite', country: 'CN' },
      { symbol: '^GSPC', name: 'S&P 500', country: 'US' }
    ];

    for (const index of indices) {
      try {
        // 注意: Yahoo Finance API 可能需要替代方案或代理
        // 这里提供示例结构，实际使用时可能需要调整
        const response = await axios.get(
          \`https://query1.finance.yahoo.com/v8/finance/chart/\${index.symbol}\`,
          { timeout: 5000 }
        );
        
        if (response.data.chart.result[0]) {
          const result = response.data.chart.result[0];
          const meta = result.meta;
          
          newData.push({
            date: currentDate,
            symbol: index.symbol,
            name: index.name,
            price: meta.regularMarketPrice,
            change: meta.regularMarketPrice - meta.previousClose,
            changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100).toFixed(2),
            type: 'stock_index',
            country: index.country
          });
        }
      } catch (error) {
        console.warn(\`Failed to fetch \${index.name}: \${error.message}\`);
      }
    }

    // 4. 获取世界银行数据 (可选 - 年度数据)
    console.log('Fetching World Bank data...');
    try {
      // GDP 增长率 (最新年份)
      const wbResponse = await axios.get(
        'https://api.worldbank.org/v2/country/CN;JP;US/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2023&per_page=10'
      );
      
      if (wbResponse.data[1]) {
        wbResponse.data[1].forEach(item => {
          if (item.value !== null) {
            newData.push({
              date: \`\${item.date}-12-31\`,
              value: parseFloat(item.value.toFixed(2)),
              country: item.countryiso3code,
              type: 'gdp_growth',
              indicator: 'GDP Growth Rate'
            });
          }
        });
      }
    } catch (error) {
      console.warn(\`Failed to fetch World Bank data: \${error.message}\`);
    }

    // 获取现有 Gist 数据
    console.log('Updating Gist...');
    const gistResponse = await axios.get(
      \`https://api.github.com/gists/\${GIST_ID}\`,
      {
        headers: {
          'Authorization': \`token \${GITHUB_TOKEN}\`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    let existingData = [];
    try {
      existingData = JSON.parse(gistResponse.data.files['economic-data.json'].content);
    } catch (e) {
      console.log('Creating new data file');
    }

    // 合并新数据 (避免重复)
    const today = currentDate;
    existingData = existingData.filter(item => item.date !== today || item.type === 'gdp_growth');
    existingData.push(...newData);

    // 按日期排序
    existingData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 更新 Gist
    await axios.patch(
      \`https://api.github.com/gists/\${GIST_ID}\`,
      {
        files: {
          'economic-data.json': {
            content: JSON.stringify(existingData, null, 2)
          }
        }
      },
      {
        headers: {
          'Authorization': \`token \${GITHUB_TOKEN}\`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    console.log(\`Successfully updated economic data with \${newData.length} new entries\`);
    console.log('Data types updated:', [...new Set(newData.map(d => d.type))]);
    
  } catch (error) {
    console.error('Error updating data:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

updateEconomicData();`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* 步骤5: 测试和监控 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-6 h-6 bg-violet-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  测试和监控
                </h3>
                <div className="pl-8 space-y-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      <span className="text-[var(--text-secondary)]">在 Actions 页面手动触发工作流进行测试</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      <span className="text-[var(--text-secondary)]">检查 Gist 是否成功更新数据</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      <span className="text-[var(--text-secondary)]">设置 Actions 失败时的邮件通知</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 注意事项 */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <h3 className="text-amber-400 font-semibold mb-2">⚠️ 注意事项</h3>
                <div className="space-y-1 text-[var(--text-secondary)] text-xs">
                  <p>• GitHub Actions 有使用限制，私有仓库每月 2000 分钟免费额度</p>
                  <p>• FRED API 有请求频率限制，建议不要过于频繁更新</p>
                  <p>• Yahoo Finance API 可能需要代理或替代方案</p>
                  <p>• 确保 Gist 权限正确设置，否则无法写入数据</p>
                  <p>• 定期检查 Actions 运行状态，确保数据正常更新</p>
                </div>
              </div>

              {/* 高级配置: Python数据源 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">+</span>
                  高级配置: Python 数据源
                </h3>
                <div className="pl-8 space-y-3">
                  <p className="text-[var(--text-secondary)]">对于中国数据，推荐使用 Python + AkShare 获取更准确的本土数据：</p>
                  
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <div className="text-xs text-[var(--text-muted)] mb-2">requirements.txt</div>
                    <pre className="text-xs text-emerald-400">
{`akshare>=1.12.0
requests>=2.28.0
pandas>=1.5.0`}
                    </pre>
                  </div>

                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <div className="text-xs text-[var(--text-muted)] mb-2">update-china-data.py</div>
                    <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap">
{`import akshare as ak
import requests
import json
import os
from datetime import datetime

def update_china_economic_data():
    github_token = os.environ.get('GITHUB_TOKEN')
    gist_id = os.environ.get('ECONOMIC_GIST_ID')
    
    if not github_token or not gist_id:
        print("Missing required environment variables")
        return
    
    try:
        current_date = datetime.now().strftime('%Y-%m-%d')
        new_data = []
        
        # 1. 获取中国央行利率 (存款准备金率)
        print("Fetching China central bank data...")
        try:
            rate_data = ak.tool_trade_date_hist_sina()
            if not rate_data.empty:
                # 这里需要根据实际API调整
                latest_rate = 3.45  # 示例数据，实际需要从API获取
                new_data.append({
                    'date': current_date,
                    'rate': latest_rate,
                    'type': 'central_bank_rate',
                    'country': 'CN'
                })
        except Exception as e:
            print(f"Failed to fetch China rate data: {e}")
        
        # 2. 获取中国CPI数据
        print("Fetching China CPI data...")
        try:
            cpi_data = ak.macro_china_cpi()
            if not cpi_data.empty:
                latest_cpi = cpi_data.iloc[-1]
                new_data.append({
                    'date': latest_cpi['月份'],
                    'value': float(latest_cpi['全国-同比']),
                    'type': 'inflation',
                    'country': 'CN'
                })
        except Exception as e:
            print(f"Failed to fetch China CPI data: {e}")
        
        # 3. 获取上证指数
        print("Fetching Shanghai Composite...")
        try:
            sh_index = ak.stock_zh_index_daily(symbol="sh000001")
            if not sh_index.empty:
                latest = sh_index.iloc[-1]
                new_data.append({
                    'date': latest['date'].strftime('%Y-%m-%d'),
                    'symbol': '000001.SS',
                    'name': 'Shanghai Composite',
                    'price': float(latest['close']),
                    'change': float(latest['close'] - latest['open']),
                    'type': 'stock_index',
                    'country': 'CN'
                })
        except Exception as e:
            print(f"Failed to fetch Shanghai index: {e}")
        
        # 更新 Gist
        if new_data:
            print("Updating Gist...")
            headers = {
                'Authorization': f'token {github_token}',
                'Accept': 'application/vnd.github.v3+json'
            }
            
            # 获取现有数据
            response = requests.get(f'https://api.github.com/gists/{gist_id}', headers=headers)
            existing_data = []
            
            if response.status_code == 200:
                try:
                    content = response.json()['files']['economic-data.json']['content']
                    existing_data = json.loads(content)
                except:
                    pass
            
            # 合并数据
            existing_data.extend(new_data)
            
            # 更新 Gist
            update_data = {
                'files': {
                    'economic-data.json': {
                        'content': json.dumps(existing_data, indent=2, ensure_ascii=False)
                    }
                }
            }
            
            response = requests.patch(f'https://api.github.com/gists/{gist_id}', 
                                    headers=headers, json=update_data)
            
            if response.status_code == 200:
                print(f"Successfully updated {len(new_data)} records")
            else:
                print(f"Failed to update Gist: {response.status_code}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_china_economic_data()`}
                    </pre>
                  </div>

                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm">
                    <p className="text-blue-300 font-medium mb-1">💡 GitHub Actions 中使用 Python</p>
                    <p className="text-[var(--text-secondary)] text-xs">
                      在 .github/workflows/update-data.yml 中添加 Python 步骤，先运行 Python 脚本获取中国数据，再运行 Node.js 脚本获取其他数据。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTechDocs(false)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl font-medium hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-500/20 text-white"
              >
                我知道了
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
