import { useState, useEffect, useRef, useCallback } from 'react'
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
  value: string
  options: GistInfo[]
  onChange: (value: string) => void
  formatDate: (date: string) => string
}

function GistDropdown({ value, options, onChange, formatDate }: GistDropdownProps) {
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

  const selectedOption = options.find(o => o.id === value)
  const displayText = selectedOption 
    ? `${selectedOption.id.slice(0, 8)}... (更新于 ${formatDate(selectedOption.updatedAt)})`
    : '创建新存储'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-left flex items-center justify-between text-[var(--text-secondary)]"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute top-full left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto"
        >
          <button
            type="button"
            onClick={() => {
              onChange('')
              setIsOpen(false)
            }}
            className={`w-full px-4 py-3 text-sm text-left transition-colors ${
              !value
                ? 'bg-violet-500/10 text-violet-400'
                : 'text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]'
            }`}
          >
            创建新存储
          </button>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-3 text-sm text-left transition-colors ${
                option.id === value
                  ? 'bg-violet-500/10 text-violet-400'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className="truncate">{option.id.slice(0, 8)}...</div>
              <div className="text-xs text-[var(--text-muted)]">更新于 {formatDate(option.updatedAt)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function GistSync() {
  const { exportData, importData } = useStore()
  const [isConfigured, setIsConfigured] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showConflict, setShowConflict] = useState(false)
  const [conflictDiff, setConflictDiff] = useState<DiffResult | null>(null)
  const [remoteData, setRemoteData] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [gistId, setGistId] = useState('')
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
      setGistId(config.gistId || '')
    }
  }, [])

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

    saveGistConfig({ token, gistId: gistId || null })
    setIsConfigured(true)
    setShowSettings(false)
    
    if (gistId) {
      showMessage('success', '配置已保存，可以拉取数据')
    } else {
      showMessage('success', '配置已保存，推送时将创建新存储')
    }
    setSaving(false)
  }

  const handleDisconnect = () => {
    clearGistConfig()
    setIsConfigured(false)
    setToken('')
    setGistId('')
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
      if (config?.gistId) {
        setGistId(config.gistId)
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
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
            >
              <CloudOff className="w-4 h-4" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Message Toast - z-[9999] 确保在所有遮罩层之上 */}
      {message && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-xl flex items-center gap-2 z-[9999] shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-md border border-[var(--border-hover)] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                <Cloud className="w-5 h-5 text-violet-400" />
                GitHub Gist 同步
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
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
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  选择云端数据
                </label>
                <GistDropdown
                  value={gistId}
                  options={gistList}
                  onChange={setGistId}
                  formatDate={formatDate}
                />
                {loadingGists && (
                  <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    加载中...
                  </p>
                )}
                {!loadingGists && gistList.length === 0 && token && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    未找到已有数据，推送时将创建新存储
                  </p>
                )}
                {/* Gist 列表管理 */}
                {gistList.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-[var(--text-muted)]">已有云端存储（删除请前往 gist.github.com）：</p>
                    {gistList.map((gist) => (
                      <div
                        key={gist.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          gist.id === gistId ? 'bg-violet-500/10 border border-violet-500/30' : 'bg-[var(--input-bg)]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--text-secondary)] truncate">{gist.id}</p>
                          <p className="text-xs text-[var(--text-muted)]">{formatDate(gist.updatedAt)}</p>
                        </div>
                        <CopyButton
                          text={gist.id}
                          onCopy={() => showMessage('success', 'ID 已复制')}
                          className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs ml-2"
                        />
                      </div>
                    ))}
                  </div>
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
        </div>
      )}

      {/* Conflict Modal */}
      {showConflict && conflictDiff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
        </div>
      )}
    </>
  )
}
