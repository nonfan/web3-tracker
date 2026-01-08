import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { AppState, Project, TransactionType, Token } from '../types'

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      deletedProjects: [],
      tokens: [],
      deletedTokens: [],
      projectOrder: [],
      tokenOrder: [],

      addProject: (projectData) => {
        const now = Date.now()
        const project: Project = {
          ...projectData,
          id: uuidv4(),
          tasks: projectData.tasks || [],
          transactions: projectData.transactions || [],
          tags: projectData.tags || [],
          priority: projectData.priority || 'medium',
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ 
          projects: [...state.projects, project],
          projectOrder: [...state.projectOrder, project.id]
        }))
      },

      reorderProjects: (newOrder: string[]) => {
        set({ projectOrder: newOrder })
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }))
      },

      deleteProject: (id) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === id)
          if (!project) return state
          return {
            projects: state.projects.filter((p) => p.id !== id),
            deletedProjects: [...state.deletedProjects, { ...project, updatedAt: Date.now() }],
            projectOrder: state.projectOrder.filter((pid) => pid !== id),
          }
        })
      },

      deleteProjects: (ids) => {
        set((state) => {
          const toDelete = state.projects.filter((p) => ids.includes(p.id))
          return {
            projects: state.projects.filter((p) => !ids.includes(p.id)),
            deletedProjects: [...state.deletedProjects, ...toDelete.map(p => ({ ...p, updatedAt: Date.now() }))],
            projectOrder: state.projectOrder.filter((pid) => !ids.includes(pid)),
          }
        })
      },

      restoreProject: (id) => {
        set((state) => {
          const project = state.deletedProjects.find((p) => p.id === id)
          if (!project) return state
          return {
            deletedProjects: state.deletedProjects.filter((p) => p.id !== id),
            projects: [...state.projects, { ...project, updatedAt: Date.now() }],
            projectOrder: [...state.projectOrder, id],
          }
        })
      },

      permanentDeleteProject: (id) => {
        set((state) => ({
          deletedProjects: state.deletedProjects.filter((p) => p.id !== id),
        }))
      },

      clearTrash: () => {
        set({ deletedProjects: [] })
      },

      updateProjects: (ids, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            ids.includes(p.id) ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }))
      },

      addTask: (projectId, title) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: [
                    ...p.tasks,
                    { id: uuidv4(), title, completed: false, createdAt: Date.now() },
                  ],
                  updatedAt: Date.now(),
                }
              : p
          ),
        }))
      },

      toggleTask: (projectId, taskId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId ? { ...t, completed: !t.completed } : t
                  ),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }))
      },

      deleteTask: (projectId, taskId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.filter((t) => t.id !== taskId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }))
      },

      addTransaction: (projectId: string, type: TransactionType, amount: number, note?: string) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  transactions: [
                    ...(p.transactions || []),
                    { id: uuidv4(), type, amount, note, createdAt: Date.now() },
                  ],
                  updatedAt: Date.now(),
                }
              : p
          ),
        }))
      },

      deleteTransaction: (projectId: string, transactionId: string) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  transactions: (p.transactions || []).filter((t) => t.id !== transactionId),
                  updatedAt: Date.now(),
                }
              : p
          ),
        }))
      },

      // 代币管理
      addToken: (tokenData) => {
        const now = Date.now()
        const token: Token = {
          ...tokenData,
          id: uuidv4(),
          status: tokenData.status || 'active',
          tags: tokenData.tags || [],
          tasks: tokenData.tasks || [],
          transactions: tokenData.transactions || [],
          investments: tokenData.investments || [],
          priceHistory: tokenData.priceHistory || [],
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ 
          tokens: [...state.tokens, token],
          tokenOrder: [...state.tokenOrder, token.id]
        }))
      },

      reorderTokens: (newOrder: string[]) => {
        set({ tokenOrder: newOrder })
      },

      updateToken: (id, updates) => {
        set((state) => ({
          tokens: state.tokens.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        }))
      },

      deleteToken: (id) => {
        set((state) => {
          const token = state.tokens.find((t) => t.id === id)
          if (!token) return state
          return {
            tokens: state.tokens.filter((t) => t.id !== id),
            deletedTokens: [...state.deletedTokens, { ...token, updatedAt: Date.now() }],
            tokenOrder: state.tokenOrder.filter((tid) => tid !== id),
          }
        })
      },

      deleteTokens: (ids) => {
        set((state) => {
          const toDelete = state.tokens.filter((t) => ids.includes(t.id))
          return {
            tokens: state.tokens.filter((t) => !ids.includes(t.id)),
            deletedTokens: [...state.deletedTokens, ...toDelete.map(t => ({ ...t, updatedAt: Date.now() }))],
            tokenOrder: state.tokenOrder.filter((tid) => !ids.includes(tid)),
          }
        })
      },

      updateTokens: (ids, updates) => {
        set((state) => ({
          tokens: state.tokens.map((t) =>
            ids.includes(t.id) ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        }))
      },

      restoreToken: (id) => {
        set((state) => {
          const token = state.deletedTokens.find((t) => t.id === id)
          if (!token) return state
          return {
            deletedTokens: state.deletedTokens.filter((t) => t.id !== id),
            tokens: [...state.tokens, { ...token, updatedAt: Date.now() }],
            tokenOrder: [...state.tokenOrder, id],
          }
        })
      },

      permanentDeleteToken: (id) => {
        set((state) => ({
          deletedTokens: state.deletedTokens.filter((t) => t.id !== id),
        }))
      },

      clearTokenTrash: () => {
        set({ deletedTokens: [] })
      },

      addTokenTransaction: (tokenId: string, type: TransactionType, amount: number, note?: string) => {
        set((state) => ({
          tokens: state.tokens.map((t) =>
            t.id === tokenId
              ? {
                  ...t,
                  transactions: [
                    ...(t.transactions || []),
                    { id: uuidv4(), type, amount, note, createdAt: Date.now() },
                  ],
                  updatedAt: Date.now(),
                }
              : t
          ),
        }))
      },

      deleteTokenTransaction: (tokenId: string, transactionId: string) => {
        set((state) => ({
          tokens: state.tokens.map((t) =>
            t.id === tokenId
              ? {
                  ...t,
                  transactions: (t.transactions || []).filter((tr) => tr.id !== transactionId),
                  updatedAt: Date.now(),
                }
              : t
          ),
        }))
      },

      addTokenInvestment: (tokenId, investment) => {
        set((state) => ({
          tokens: state.tokens.map((t) =>
            t.id === tokenId
              ? {
                  ...t,
                  investments: [
                    ...t.investments,
                    { ...investment, id: uuidv4() },
                  ],
                  updatedAt: Date.now(),
                }
              : t
          ),
        }))
      },

      addTokenPrice: (tokenId, price) => {
        set((state) => ({
          tokens: state.tokens.map((t) =>
            t.id === tokenId
              ? {
                  ...t,
                  priceHistory: [...t.priceHistory, price],
                  currentPrice: price.price,
                  updatedAt: Date.now(),
                }
              : t
          ),
        }))
      },

      exportData: () => {
        const { projects, deletedProjects, tokens, deletedTokens } = get()
        return JSON.stringify({ projects, deletedProjects, tokens, deletedTokens, exportedAt: Date.now() }, null, 2)
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.projects && Array.isArray(data.projects)) {
            // 兼容旧数据：将 investment/profit 转换为 transactions
            const migratedProjects = data.projects.map((p: Project) => {
              if (!p.transactions) {
                const transactions = []
                if (p.investment && p.investment > 0) {
                  transactions.push({
                    id: uuidv4(),
                    type: 'investment' as const,
                    amount: p.investment,
                    note: '历史数据迁移',
                    createdAt: p.createdAt,
                  })
                }
                if (p.profit !== undefined && p.profit !== 0) {
                  transactions.push({
                    id: uuidv4(),
                    type: 'profit' as const,
                    amount: p.profit,
                    note: '历史数据迁移',
                    createdAt: p.createdAt,
                  })
                }
                return { ...p, transactions }
              }
              return p
            })
            
            // 兼容旧代币数据：确保 tags 和 status 字段存在，并迁移旧状态
            const migratedTokens = (data.tokens || []).map((t: any) => {
              let status = t.status || 'active'
              // 迁移旧状态名称
              if (status === 'holding') status = 'active'
              if (status === 'sold') status = 'completed'
              if (status === 'zero') status = 'dead'
              return {
                ...t,
                status,
                tags: t.tags || [],
                tasks: t.tasks || [],
                transactions: t.transactions || [],
              }
            })
            
            // 初始化排序数组
            const projectOrder = data.projectOrder || migratedProjects.map((p: Project) => p.id)
            const tokenOrder = data.tokenOrder || migratedTokens.map((t: Token) => t.id)
            
            set({ 
              projects: migratedProjects,
              deletedProjects: data.deletedProjects || [],
              tokens: migratedTokens,
              deletedTokens: data.deletedTokens || [],
              projectOrder,
              tokenOrder,
            })
            return true
          }
          return false
        } catch {
          return false
        }
      },
    }),
    { name: 'web3tracker-storage' }
  )
)
