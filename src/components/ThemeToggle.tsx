import { useTheme } from '../store/useTheme'
import { Tooltip } from './Tooltip'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { mode, cycleTheme } = useTheme()

  const getTooltip = () => {
    switch (mode) {
      case 'dark': return '切换到亮色模式'
      case 'light': return '切换到跟随系统'
      case 'system': return '切换到暗色模式'
    }
  }

  const getIcon = () => {
    switch (mode) {
      case 'dark': return <Moon className="w-4 h-4" />
      case 'light': return <Sun className="w-4 h-4" />
      case 'system': return <Monitor className="w-4 h-4" />
    }
  }

  return (
    <Tooltip content={getTooltip()}>
      <button
        onClick={cycleTheme}
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
      >
        {getIcon()}
      </button>
    </Tooltip>
  )
}
