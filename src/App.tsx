import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore'
import { useTheme } from './store/useTheme'
import { DataSync } from './components/DataSync'
import { GistSync } from './components/GistSync'
import { TrashBin } from './components/TrashBin'
import { ThemeToggle } from './components/ThemeToggle'
import { CacheManager } from './components/CacheManager'
import { Tooltip } from './components/Tooltip'
import { LogoWithText } from './components/LogoWithText'
import { requestNotificationPermission, sendNotification, checkDeadlines, shouldNotifyToday, markNotified } from './utils/notifications'
import { cleanExpiredCache } from './utils/priceDataCache'
import { Bell, BellOff, Coins, FolderKanban } from 'lucide-react'

function App() {
  const { projects } = useStore()
  const { theme } = useTheme()
  const location = useLocation()
  const [notificationEnabled, setNotificationEnabled] = useState(false)

  // 初始化主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // 清理过期的价格数据缓存
  useEffect(() => {
    cleanExpiredCache()
  }, [])

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

  const handleToggleNotification = async () => {
    if (notificationEnabled) {
      // 关闭通知
      setNotificationEnabled(false)
      sendNotification('通知已关闭', '不再接收截止日期提醒')
    } else {
      // 开启通知
      const granted = await requestNotificationPermission()
      setNotificationEnabled(granted)
      if (granted) {
        sendNotification('通知已开启', '将在项目截止前提醒你')
      }
    }
  }

  return (
    <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gradient-to-br from-[#0a0a0f] via-[#0f0f18] to-[#0a0a0f]' : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'}`}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:relative">
            {/* Logo */}
            <div className="flex items-center">
              <LogoWithText />
            </div>

            {/* Navigation Tabs - Centered */}
            <nav className="flex gap-2 bg-[var(--bg-secondary)] p-1.5 rounded-2xl border border-[var(--border)] md:absolute md:left-1/2 md:-translate-x-1/2">
              <Link
                to="/"
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${location.pathname === '/'
                  ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-lg border border-[var(--border-hover)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>Projects</span>
              </Link>
              <Link
                to="/tokens"
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${location.pathname === '/tokens'
                  ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-lg border border-[var(--border-hover)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
              >
                <Coins className="w-4 h-4" />
                <span>Tokens</span>
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 主题 & 通知 */}
              <div className="flex items-center gap-1 bg-[var(--input-bg)] border border-[var(--border)] p-1 rounded-xl">
                <ThemeToggle />
                <Tooltip content={notificationEnabled ? '关闭通知' : '开启截止提醒'}>
                  <button
                    onClick={handleToggleNotification}
                    className={`p-2 rounded-lg transition-all ${notificationEnabled
                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--input-bg)]'
                      }`}
                  >
                    {notificationEnabled ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </button>
                </Tooltip>
              </div>

              {/* 回收站 */}
              <div className="flex items-center gap-1 bg-[var(--input-bg)] border border-[var(--border)] p-1 rounded-xl">
                <TrashBin />
              </div>

              {/* 云同步 & 数据导入导出 */}
              <div className="flex items-center gap-1 bg-[var(--input-bg)] border border-[var(--border)] p-1 rounded-xl">
                <GistSync />
                <div className="w-px h-5 bg-[var(--border)]" />
                <DataSync />
                <div className="w-px h-5 bg-[var(--border)]" />
                <CacheManager />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <Outlet />
      </div>
    </div>
  )
}

export default App

