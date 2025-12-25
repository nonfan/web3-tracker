import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import {
  getGistConfig,
  saveGistConfig,
  clearGistConfig,
  validateToken,
  findAllGists,
  syncToGist,
  pullFromGist,
  deleteGist,
  type GistInfo,
} from '../utils/gistSync'
import { Cloud, CloudOff, RefreshCw, Settings, X, Check, AlertCircle, ChevronDown, Trash2 } from 'lucide-react'

export function GistSync() {
  const { exportData, importData } = useStore()
  const [isConfigured, setIsConfigured] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [token, setToken] = useState('')
  const [gistId, setGistId] = useState('')
  const [gistList, setGistList] = useState<GistInfo[]>([])
  const [pushing, setPushing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingGists, setLoadingGists] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
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
    const result = await syncToGist(data)
    if (result.success) {
      const config = getGistConfig()
      if (config?.gistId) {
        setGistId(config.gistId)
        showMessage('success', `已同步到云端`)
      } else {
        showMessage('success', '已同步到云端')
      }
    } else {
      showMessage('error', result.error || '同步失败')
    }
    setPushing(false)
  }

  const handlePull = async () => {
    setPulling(true)
    const result = await pullFromGist()
    if (result.success && result.data) {
      const imported = importData(result.data)
      if (imported) {
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

  const handleDeleteGist = async (gistIdToDelete: string) => {
    if (!confirm(`确定删除这个云端存储？\n\nGist ID: ${gistIdToDelete}\n\n此操作不可恢复！`)) {
      return
    }
    
    setDeleting(gistIdToDelete)
    const success = await deleteGist(token, gistIdToDelete)
    if (success) {
      setGistList(gistList.filter(g => g.id !== gistIdToDelete))
      if (gistId === gistIdToDelete) {
        setGistId('')
      }
      showMessage('success', '已删除')
    } else {
      showMessage('error', '删除失败')
    }
    setDeleting(null)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <>
            <button
              onClick={handlePush}
              disabled={pushing || pulling}
              className="px-3 py-2.5 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-sm hover:bg-emerald-600/30 flex items-center gap-2 text-emerald-400 transition-all disabled:opacity-50"
              title="推送到云端"
            >
              {pushing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
              推送
            </button>
            <button
              onClick={handlePull}
              disabled={pushing || pulling}
              className="px-3 py-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-sm hover:bg-blue-600/30 flex items-center gap-2 text-blue-400 transition-all disabled:opacity-50"
              title="从云端拉取"
            >
              {pulling ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              拉取
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-2.5 bg-[#1a1a24] border border-white/5 rounded-xl text-sm hover:bg-[#22222e] hover:border-white/10 flex items-center gap-2 text-gray-400 hover:text-white transition-all"
          >
            <CloudOff className="w-4 h-4" />
            云同步
          </button>
        )}
        
        {isConfigured && (
          <button
            onClick={() => {
              setShowSettings(true)
              loadGistList(token)
            }}
            className="p-2.5 bg-[#1a1a24] border border-white/5 rounded-xl text-sm hover:bg-[#22222e] hover:border-white/10 text-gray-400 hover:text-white transition-all"
            title="同步设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message Toast */}
      {message && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-xl flex items-center gap-2 z-50 shadow-lg ${
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
          <div className="bg-[#1a1a24] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Cloud className="w-5 h-5 text-violet-400" />
                GitHub Gist 同步
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
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
                <p className="mt-2 text-xs text-gray-400">
                  路径: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → New personal access token (classic)
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  GitHub Token <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onBlur={handleTokenBlur}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
                    placeholder="ghp_xxxxxxxxxxxx"
                  />
                  {token && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(token)
                        showMessage('success', 'Token 已复制')
                      }}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      复制
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  选择云端数据
                </label>
                <div className="relative">
                  <select
                    value={gistId}
                    onChange={(e) => setGistId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all appearance-none text-gray-300"
                  >
                    <option value="">创建新存储</option>
                    {gistList.map((gist) => (
                      <option key={gist.id} value={gist.id}>
                        {gist.id.slice(0, 8)}... (更新于 {formatDate(gist.updatedAt)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                {loadingGists && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    加载中...
                  </p>
                )}
                {!loadingGists && gistList.length === 0 && token && (
                  <p className="text-xs text-gray-500 mt-1">
                    未找到已有数据，推送时将创建新存储
                  </p>
                )}
                {/* Gist 列表管理 */}
                {gistList.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-500">管理云端存储：</p>
                    {gistList.map((gist) => (
                      <div
                        key={gist.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          gist.id === gistId ? 'bg-violet-500/10 border border-violet-500/30' : 'bg-white/5'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300 truncate">{gist.id}</p>
                          <p className="text-xs text-gray-500">{formatDate(gist.updatedAt)}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(gist.id)
                              showMessage('success', 'ID 已复制')
                            }}
                            className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors text-xs"
                          >
                            复制
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGist(gist.id)}
                            disabled={deleting === gist.id}
                            className="p-1.5 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {deleting === gist.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
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
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
              >
                {saving ? '验证中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
