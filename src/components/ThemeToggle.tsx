import { useTheme } from '../store/useTheme'
import { Tooltip } from './Tooltip'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Tooltip content={theme === 'dark' ? '亮色模式' : '暗色模式'}>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-all"
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </button>
    </Tooltip>
  )
}
