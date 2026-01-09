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
import { Bell, BellOff, Coins, FolderKanban, TrendingUp, Bitcoin } from 'lucide-react'

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
      {/* Full Width Header */}
      <header className="sticky top-0 z-50 bg-[var(--card-bg)] border-b border-[var(--border)] p-4 md:p-6 backdrop-blur-sm bg-opacity-95">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo */}
            <div className="flex items-center gap-4 min-w-0">
              <LogoWithText />
            </div>

            {/* Center Section - Navigation */}
            <nav className="flex items-center flex-shrink-0">
              <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border)]">
                <Link
                  to="/"
                  className={`px-4 lg:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === '/'
                      ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span className="hidden sm:inline">Projects</span>
                </Link>
                
                <Link
                  to="/tokens"
                  className={`px-4 lg:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === '/tokens'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span className="hidden sm:inline">Tokens</span>
                </Link>
                
                <Link
                  to="/economy"
                  className={`px-4 lg:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === '/economy'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Economy</span>
                </Link>
                
                <Link
                  to="/crypto"
                  className={`px-4 lg:px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === '/crypto'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <Bitcoin className="w-4 h-4" />
                  <span className="hidden sm:inline">Crypto</span>
                </Link>
              </div>
            </nav>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Theme & Notification Group */}
              <div className="flex items-center gap-1 bg-[var(--input-bg)] border border-[var(--border)] p-1 rounded-xl">
                <ThemeToggle />
                <div className="w-px h-6 bg-[var(--border)]" />
                <Tooltip content={notificationEnabled ? '关闭通知' : '开启截止提醒'}>
                  <button
                    onClick={handleToggleNotification}
                    className={`p-2.5 rounded-lg transition-all duration-300 ${
                      notificationEnabled
                        ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
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

              {/* Tools Group */}
              <div className="hidden md:flex items-center gap-1 bg-[var(--input-bg)] border border-[var(--border)] p-1 rounded-xl">
                <TrashBin />
              </div>

              {/* Sync & Data Group */}
              <div className="flex items-center gap-1 bg-[var(--input-bg)] border border-[var(--border)] p-1 rounded-xl">
                <GistSync />
                <div className="w-px h-6 bg-[var(--border)]" />
                <DataSync />
                <div className="hidden lg:block w-px h-6 bg-[var(--border)]" />
                <div className="hidden lg:block">
                  <CacheManager />
                </div>
              </div>
            </div>
          </div>
      </header>

      {/* Page Content with Container */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Outlet />
      </div>
    </div>
  )
}

export default App

