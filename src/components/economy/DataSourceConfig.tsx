import { useState } from 'react'
import { ExternalLink, Info, CheckCircle, Github, Save, Trash2, RefreshCw } from 'lucide-react'
import { DATA_SOURCES, getGistConfig, saveGistConfig, clearGistConfig, testGistConfig } from '../../utils/economicDataApi'

export function DataSourceConfig() {
  const currentConfig = getGistConfig()
  const [username, setUsername] = useState(currentConfig.username || '')
  const [gistId, setGistId] = useState(currentConfig.gistId || '')
  const [isTestingConfig, setIsTestingConfig] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const handleSaveConfig = async () => {
    if (!username.trim() || !gistId.trim()) {
      alert('请输入 GitHub 用户名和 Gist ID')
      return
    }

    setIsTestingConfig(true)
    setTestResult(null)

    const isValid = await testGistConfig(username.trim(), gistId.trim())

    if (isValid) {
      saveGistConfig(username.trim(), gistId.trim())
      setTestResult('success')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } else {
      setTestResult('error')
    }

    setIsTestingConfig(false)
  }

  const handleClearConfig = () => {
    if (confirm('确定要清除 Gist 配置吗？将使用本地备份数据。')) {
      clearGistConfig()
      setUsername('')
      setGistId('')
      setTestResult(null)
      window.location.reload()
    }
  }

  const isConfigured = currentConfig.username && currentConfig.gistId

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-400 mb-1">关于数据源</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              本应用使用 GitHub Actions 自动从 FRED API 获取经济数据并存储到 GitHub Gist。完全免费，无需服务器。
            </p>
            <div className="space-y-2 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>官方权威数据（FRED）</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>每天自动更新</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>完全免费，无需 API Key</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gist Configuration */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Github className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">GitHub Gist 配置</h3>
        </div>

        {isConfigured ? (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Gist 已配置</span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] space-y-1">
                <div>用户名: <span className="text-[var(--text-primary)] font-mono">{currentConfig.username}</span></div>
                <div>Gist ID: <span className="text-[var(--text-primary)] font-mono">{currentConfig.gistId}</span></div>
              </div>
            </div>
            <button
              onClick={handleClearConfig}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清除配置
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-[var(--text-secondary)] mb-2">
                当前使用本地备份数据。配置 Gist 后可获取每日自动更新的最新数据。
              </p>
              <a
                href="https://github.com/your-repo/blob/main/FRED_API_SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
              >
                <span>查看完整设置指南</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[var(--text-muted)]">GitHub 用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-github-username"
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[var(--text-muted)]">Gist ID</label>
              <input
                type="text"
                value={gistId}
                onChange={(e) => setGistId(e.target.value)}
                placeholder="abc123def456..."
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <p className="text-xs text-[var(--text-muted)]">
                从 Gist URL 中获取：gist.github.com/username/<span className="text-violet-400">gist-id</span>
              </p>
            </div>

            {testResult === 'success' && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                ✓ Gist 配置验证成功！正在刷新页面...
              </div>
            )}

            {testResult === 'error' && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                ✗ 无法访问 Gist，请检查用户名和 ID 是否正确
              </div>
            )}

            <button
              onClick={handleSaveConfig}
              disabled={isTestingConfig || !username.trim() || !gistId.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 disabled:cursor-not-allowed rounded-lg text-sm text-white transition-colors w-full justify-center"
            >
              {isTestingConfig ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  保存并验证
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Data Sources */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">数据来源</h3>
        <div className="space-y-3">
          {Object.entries(DATA_SOURCES).map(([key, source]: [string, any]) => (
            <div key={key} className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">{source.name}</h4>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                  免费
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-2">{source.description}</p>
              <div className="flex items-center justify-between">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <span>访问官网</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-xs text-[var(--text-muted)]">更新: {source.lastUpdate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Guide */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">设置指南</h3>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <p>1. 按照 <a href="https://github.com/your-repo/blob/main/FRED_API_SETUP.md" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300">FRED_API_SETUP.md</a> 设置 GitHub Actions</p>
          <p>2. 创建 GitHub Gist 存储数据</p>
          <p>3. 在上方输入 Gist 配置</p>
          <p>4. 数据将每天自动更新</p>
        </div>
      </div>
    </div>
  )
}
