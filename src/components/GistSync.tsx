import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import {
  getGistConfig,
  saveGistConfig,
  clearGistConfig,
  validateToken,
  syncToGist,
  pullFromGist,
} from '../utils/gistSync'
import { Cloud, CloudOff, RefreshCw, Settings, X, Check, AlertCircle } from 'lucide-react'

export function GistSync() {
  const { exportData, importData } = useStore()
  const [isConfigured, setIsConfigured] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [token, setToken] = useState('')
  const [gistId, setGistId] = useState('')
  const [syncing, setSyncing] = useState(false)
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

  const handleSaveConfig = async () => {
    if (!token.trim()) {
      showMessage('error', '请输入 Token')
      return
    }

    setSyncing(true)
    const result = await validateToken(token)
    if (!result.valid) {
      showMessage('error', 'Token 无效，请检查')
      setSyncing(false)
      return
    }

    // 如果没有手动填 Gist ID，但找到了已有的 Gist，自动使用
    const finalGistId = gistId || result.gistId || null
    
    saveGistConfig({ token, gistId: finalGistId })
    setGistId(finalGistId || '')
    setIsConfigured(true)
    setShowSettings(false)
    
    if (result.gistId && !gistId) {
      showMessage('success', '已找到云端数据，可以拉取')
    } else {
      showMessage('success', '配置已保存')
    }
    setSyncing(false)
  }

  const handleDisconnect = () => {
    clearGistConfig()
    setIsConfigured(false)
    setToken('')
    setGistId('')
    setShowSettings(false)
    showMessage('success', '已断开连接')
  }

  const handlePush = async () => {
    setSyncing(true)
    const data = exportData()
    const result = await syncToGist(data)
    if (result.success) {
      // 更新 gistId
      const config = getGistConfig()
      if (config?.gistId) {
        setGistId(config.gistId)
        showMessage('success', `已同步到云端，Gist ID: ${config.gistId.slice(0, 8)}...`)
      } else {
        showMessage('success', '已同步到云端')
      }
    } else {
      showMessage('error', result.error || '同步失败')
    }
    setSyncing(false)
  }

  const handlePull = async () => {
    setSyncing(true)
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
    setSyncing(false)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <>
            <button
              onClick={handlePush}
              disabled={syncing}
              className="px-3 py-2.5 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-sm hover:bg-emerald-600/30 flex items-center gap-2 text-emerald-400 transition-all disabled:opacity-50"
              title="推送到云端"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Cloud className="w-4 h-4" />
              )}
              推送
            </button>
            <button
              onClick={handlePull}
              disabled={syncing}
              className="px-3 py-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-sm hover:bg-blue-600/30 flex items-center gap-2 text-blue-400 transition-all disabled:opacity-50"
              title="从云端拉取"
            >
              {syncing ? (
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
            onClick={() => setShowSettings(true)}
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
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
                  placeholder="ghp_xxxxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Gist ID（跨设备同步必填）
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gistId}
                    onChange={(e) => setGistId(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-gray-600"
                    placeholder="首次推送后自动生成"
                  />
                  {gistId && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(gistId)
                        showMessage('success', 'Gist ID 已复制')
                      }}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      复制
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {gistId ? (
                    <span className="text-emerald-400">✓ 在其他设备上只需填入相同 Token 即可自动找到</span>
                  ) : (
                    '首次推送会自动创建，其他设备只需填 Token 会自动查找'
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {isConfigured && (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl font-medium text-red-400 hover:bg-red-500/30 transition-all"
                >
                  断开连接
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
                disabled={syncing}
                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
              >
                {syncing ? '验证中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
