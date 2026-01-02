export type ProjectStatus = 'active' | 'completed' | 'launched' | 'dead' | 'archived'
export type Priority = 'high' | 'medium' | 'low'
export type TransactionType = 'investment' | 'profit'

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  note?: string
  createdAt: number
}

export interface Project {
  id: string
  name: string
  description: string
  website?: string
  twitter?: string
  discord?: string
  nftMarket?: string  // NFT 市场链接
  status: ProjectStatus
  priority: Priority
  tasks: Task[]
  tags: string[]
  notes: string
  deadline?: number  // 截止日期时间戳
  transactions: Transaction[]  // 交易记录
  // 兼容旧数据
  investment?: number
  profit?: number
  createdAt: number
  updatedAt: number
}

export interface AppState {
  projects: Project[]
  deletedProjects: Project[]  // 回收站
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  deleteProjects: (ids: string[]) => void
  updateProjects: (ids: string[], updates: Partial<Project>) => void
  restoreProject: (id: string) => void  // 恢复项目
  permanentDeleteProject: (id: string) => void  // 永久删除
  clearTrash: () => void  // 清空回收站
  addTask: (projectId: string, title: string) => void
  toggleTask: (projectId: string, taskId: string) => void
  deleteTask: (projectId: string, taskId: string) => void
  addTransaction: (projectId: string, type: TransactionType, amount: number, note?: string) => void
  deleteTransaction: (projectId: string, transactionId: string) => void
  exportData: () => string
  importData: (json: string) => boolean
}
