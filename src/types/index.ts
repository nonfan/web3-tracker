export type ProjectStatus = 'active' | 'completed' | 'launched' | 'dead'
export type Priority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
}

export interface Project {
  id: string
  name: string
  description: string
  website?: string
  twitter?: string
  discord?: string
  status: ProjectStatus
  priority: Priority
  tasks: Task[]
  tags: string[]
  notes: string
  deadline?: number  // 截止日期时间戳
  investment?: number  // 投入金额 (USD)
  profit?: number  // 收益金额 (USD)
  createdAt: number
  updatedAt: number
}

export interface AppState {
  projects: Project[]
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  deleteProjects: (ids: string[]) => void
  updateProjects: (ids: string[], updates: Partial<Project>) => void
  addTask: (projectId: string, title: string) => void
  toggleTask: (projectId: string, taskId: string) => void
  deleteTask: (projectId: string, taskId: string) => void
  exportData: () => string
  importData: (json: string) => boolean
}
