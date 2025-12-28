import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { AppState, Project, TransactionType } from '../types'

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      deletedProjects: [],

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
        set((state) => ({ projects: [...state.projects, project] }))
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
          }
        })
      },

      deleteProjects: (ids) => {
        set((state) => {
          const toDelete = state.projects.filter((p) => ids.includes(p.id))
          return {
            projects: state.projects.filter((p) => !ids.includes(p.id)),
            deletedProjects: [...state.deletedProjects, ...toDelete.map(p => ({ ...p, updatedAt: Date.now() }))],
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

      exportData: () => {
        const { projects, deletedProjects } = get()
        return JSON.stringify({ projects, deletedProjects, exportedAt: Date.now() }, null, 2)
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
            set({ 
              projects: migratedProjects,
              deletedProjects: data.deletedProjects || [],
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
