import { useState, useEffect } from 'react'
import {
  saveEconomicGistConfig,
  clearEconomicGistConfig,
  testEconomicGistConfig,
  getEconomicGistConfigForUI,
  DATA_SOURCES
} from '../../utils/economicDataApi'
import { Check, AlertCircle, ExternalLink, Info } from 'lucide-react'

export function DataSourceConfig() {
  const [username, setUsername] = useState('')
  const [gistId, setGistId] = useState('')
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    const config = getEconomicGistConfigForUI()
    if (config) {
      setUsername(config.username)
      setGistId(config.gistId)
    }
  }, [])

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleTest = async () => {
    if (!username.trim() || !gistId.trim()) {
      showMessage('error', '请填写完整信息')
      return
    }

    setTesting(true)
    const success = await testEconomicGistConfig(username, gistId)

    if (success) {
      showMessage('success', '连接成功！数据格式正确')
    } else {
      showMessage('error', '连接失败，请检查配置或 Gist 数据格式')
    }
    setTesting(false)
  }

  const handleSave = () => {
    if (!username.trim() || !gistId.trim()) {
      showMessage('error', '请填写完整信息')
      return
    }

    saveEconomicGistConfig(username, gistId)
    showMessage('success', '配置已保存，刷新页面后生效')
  }

  const handleClear = () => {
    clearEconomicGistConfig()
    setUsername('')
    setGistId('')
    showMessage('info', '配置已清除，将使用本地备份数据')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">数据源配置</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          配置 GitHub Gist 以获取最新的经济数据（由 GitHub Actions 自动更新）
        </p>
      </div>

      {/* 重要提示 */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="text-blue-300 font-medium">💡 使用项目的 GitHub Token</p>
            <p className="text-[var(--text-secondary)]">
              经济数据使用<strong>独立的 Gist</strong>（不同于项目数据），但<strong>复用项目的 GitHub Token</strong>。
            </p>
            <p className="text-[var(--text-secondary)]">
              你只需要配置经济数据 Gist 的 ID，Token 会自动使用项目同步功能中配置的 Token。
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : message.type === 'error'
                ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
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

      {/* Configuration Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-2">
            GitHub 用户名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
            placeholder="your-github-username"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-2">
            经济数据 Gist ID <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={gistId}
            onChange={(e) => setGistId(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
            placeholder="abc123def456..."
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            这是存储经济数据的 Gist ID（不是项目数据的 Gist）
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex-1 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl font-medium text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-50"
          >
            {testing ? '测试中...' : '测试连接'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20 text-white"
          >
            保存配置
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-xl font-medium text-red-400 hover:bg-red-500/30 transition-all"
          >
            清除
          </button>
        </div>
      </div>

      {/* Data Sources Info */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">数据来源</h3>
        {Object.entries(DATA_SOURCES).map(([key, source]) => (
          <div key={key} className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-[var(--text-primary)]">{source.name}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">{source.description}</p>
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span className={source.free ? 'text-emerald-400' : 'text-amber-400'}>
                {source.free ? '免费' : '付费'}
              </span>
              <span>更新: {source.lastUpdate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Setup Guide */}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-violet-400 mb-2">📚 配置指南</h3>
        <ol className="text-sm text-[var(--text-secondary)] space-y-2 list-decimal list-inside">
          <li>在项目同步功能中配置 GitHub Token（如果还没有）</li>
          <li>创建一个新的 Gist 用于存储经济数据</li>
          <li>配置 GitHub Actions 自动更新（参考 FRED_API_SETUP.md）</li>
          <li>在此处填写 Gist ID 并保存</li>
          <li>刷新页面即可看到最新数据</li>
        </ol>
      </div>
    </div>
  )
}
