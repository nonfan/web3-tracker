import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'dark' | 'light' | 'system'
type ResolvedTheme = 'dark' | 'light'

interface ThemeState {
  mode: ThemeMode
  theme: ResolvedTheme // 实际应用的主题
  setMode: (mode: ThemeMode) => void
  cycleTheme: () => void
}

// 获取系统主题
function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

// 根据模式解析实际主题
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      theme: 'dark',
      
      setMode: (mode: ThemeMode) => {
        const theme = resolveTheme(mode)
        set({ mode, theme })
        document.documentElement.setAttribute('data-theme', theme)
      },
      
      cycleTheme: () => {
        const currentMode = get().mode
        // 循环: dark -> light -> system -> dark
        const nextMode: ThemeMode = 
          currentMode === 'dark' ? 'light' : 
          currentMode === 'light' ? 'system' : 'dark'
        
        const theme = resolveTheme(nextMode)
        set({ mode: nextMode, theme })
        document.documentElement.setAttribute('data-theme', theme)
      },
    }),
    {
      name: 'web3tracker-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const theme = resolveTheme(state.mode)
          state.theme = theme
          document.documentElement.setAttribute('data-theme', theme)
        }
      },
    }
  )
)

// 监听系统主题变化
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const state = useTheme.getState()
    if (state.mode === 'system') {
      const theme = e.matches ? 'dark' : 'light'
      useTheme.setState({ theme })
      document.documentElement.setAttribute('data-theme', theme)
    }
  })
}
