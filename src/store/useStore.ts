import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { AppState, Project } from '../types'

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (projectData) => {
        const now = Date.now()
        const project: Project = {
          ...projectData,
          id: uuidv4(),
          tasks: [],
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
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }))
      },

      deleteProjects: (ids) => {
        set((state) => ({
          projects: state.projects.filter((p) => !ids.includes(p.id)),
        }))
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

      exportData: () => {
        const { projects } = get()
        return JSON.stringify({ projects, exportedAt: Date.now() }, null, 2)
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.projects && Array.isArray(data.projects)) {
            set({ projects: data.projects })
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
