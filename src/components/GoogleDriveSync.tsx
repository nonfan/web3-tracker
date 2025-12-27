import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import {
  getGoogleConfig,
  saveGoogleConfig,
  clearGoogleConfig,
  isTokenValid,
  initGoogleAuth,
  syncToGoogleDrive,
  pullFromGoogleDrive,
} from '../utils/googleDriveSync'
import { Tooltip } from './Tooltip'
import { Cloud, CloudOff, RefreshCw, X, Check, AlertCircle } from 'lucide-react'

export function GoogleDriveSync() {
  const { exportData, importData } = useStore()
  const [isConfigured, setIsConfigured] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [clientId, setClientId] = useState('')
  const [pushing, setPushing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [authorizing, setAuthorizing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const config = getGoogleConfig()
    setIsConfigured(!!config?.clientId)
    setIsAuthorized(isTokenValid())
    if (config?.clientId) {
      setClientId(config.clientId)
    }
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSaveClientId = () => {
    if (!clientId.trim()) {
      showMessage('error', '请输入 Client ID')
      return
    }
    saveGoogleConfig({ clientId: clientId.trim() })
    setIsConfigured(true)
    showMessage('success', 'Client ID 已保存，请点击授权')
  }

  const handleAuth = async () => {
    const config = getGoogleConfig()
    if (!config?.clientId) {
      showMessage('error', '请先配置 Client ID')
      return
    }

    setAuthorizing(true)
    try {
      await initGoogleAuth(config.clientId)
      setIsAuthorized(true)
      showMessage('success', '授权成功')
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : '授权失败')
    }
    setAuthorizing(false)
  }

  const handleDisconnect = () => {
    clearGoogleConfig()
    setIsConfigured(false)
    setIsAuthorized(false)
    setClientId('')
    setShowSettings(false)
    showMessage('success', '已断开连接')
  }

  const handlePush = async () => {
    if (!isAuthorized) {
      showMessage('error', '请先授权')
      return
    }

    setPushing(true)
    const data = exportData()
    const result = await syncToGoogleDrive(data)
    if (result.success) {
      showMessage('success', '已同步到 Google Drive')
    } else {
      if (result.error?.includes('过期')) {
        setIsAuthorized(false)
      }
      showMessage('error', result.error || '同步失败')
    }
    setPushing(false)
  }

  const handlePull = async () => {
    if (!isAuthorized) {
      showMessage('error', '请先授权')
      return
    }

    setPulling(true)
    const result = await pullFromGoogleDrive()
    if (result.success && result.data) {
      const imported = importData(result.data)
      if (imported) {
        showMessage('success', '已从 Google Drive 拉取数据')
      } else {
        showMessage('error', '数据格式错误')
      }
    } else {
      if (result.error?.includes('过期')) {
        setIsAuthorized(false)
      }
      showMessage('error', result.error || '拉取失败')
    }
    setPulling(false)
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {isAuthorized ? (
          <>
            <Tooltip content="推送到 Google Drive">
              <button
                onClick={handlePush}
                disabled={pushing || pulling}
                className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-50"
              >
                {pushing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
              </button>
            </Tooltip>
            <Tooltip content="从 Google Drive 拉取">
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
          </>
        ) : isConfigured ? (
          <Tooltip content="Google Drive 授权">
            <button
              onClick={handleAuth}
              disabled={authorizing}
              className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50"
            >
              {authorizing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CloudOff className="w-4 h-4" />
              )}
            </button>
          </Tooltip>
        ) : null}
        <Tooltip content="Google Drive 设置">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-[var(--input-bg)] transition-all"
          >
            <svg className="w-4 h-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </Tooltip>
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
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-lg border border-[var(--border-hover)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-[var(--text-primary)]">
                <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                Google Drive 同步
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 配置步骤说明 */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm">
                <p className="font-medium text-blue-400 mb-3">配置步骤：</p>
                <ol className="space-y-2 text-[var(--text-secondary)]">
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-medium">1.</span>
                    <span>
                      访问{' '}
                      <a
                        href="https://console.cloud.google.com/projectcreate"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        Google Cloud Console
                      </a>
                      {' '}创建新项目
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-medium">2.</span>
                    <span>
                      在项目中启用{' '}
                      <a
                        href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        Google Drive API
                      </a>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-medium">3.</span>
                    <span>
                      进入{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        凭据页面
                      </a>
                      {' '}→ 创建凭据 → OAuth 客户端 ID
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-medium">4.</span>
                    <span>应用类型选择「Web 应用」</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-medium">5.</span>
                    <div>
                      <span>添加已授权的重定向 URI：</span>
                      <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs block mt-1 break-all">
                        {window.location.href.split('?')[0].split('#')[0]}
                      </code>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-400 font-medium">6.</span>
                    <span>复制生成的 Client ID 填入下方</span>
                  </li>
                </ol>
                <p className="text-xs text-[var(--text-muted)] mt-3">
                  注：首次使用需配置 OAuth 同意屏幕，选择「外部」用户类型，填写应用名称即可
                </p>
              </div>

              {/* Client ID 输入 */}
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  Client ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)] text-sm"
                  placeholder="xxxx.apps.googleusercontent.com"
                />
              </div>

              {/* 状态显示 */}
              {isConfigured && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                  isAuthorized 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  {isAuthorized ? (
                    <>
                      <Check className="w-4 h-4" />
                      已授权，可以同步数据
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      已配置，请点击下方按钮授权
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {isConfigured && (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl font-medium text-red-400 hover:bg-red-500/30 transition-all text-sm"
                >
                  断开
                </button>
              )}
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all text-sm"
              >
                取消
              </button>
              {!isAuthorized ? (
                <>
                  <button
                    onClick={handleSaveClientId}
                    className="flex-1 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all text-sm"
                  >
                    保存
                  </button>
                  {isConfigured && (
                    <button
                      onClick={handleAuth}
                      disabled={authorizing}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-medium hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 text-white text-sm"
                    >
                      {authorizing ? '授权中...' : '授权'}
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-medium hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20 text-white text-sm"
                >
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
