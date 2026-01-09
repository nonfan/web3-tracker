export type ProjectStatus = 'research' | 'active' | 'completed' | 'dead' | 'archived' // 研究中、进行中、已完成、已凉、已归档
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

// 代币相关类型
export type TokenStatus = 'active' | 'launched' | 'completed' | 'dead' | 'archived' // 进行中、已买币、已卖币、已归零、已归档

export interface TokenInvestment {
  id: string
  amount: number  // 投资金额 USD
  quantity: number  // 购买数量
  price: number  // 购买价格
  date: number  // 购买时间戳
  note?: string
}

export interface TokenPricePoint {
  date: number
  price: number
  high?: number
  low?: number
}

export interface Token {
  id: string
  symbol: string  // 代币符号，如 BTC, ETH
  name: string  // 代币名称
  description?: string  // 描述
  logoUrl?: string  // Logo URL
  projectId?: string  // 关联的项目 ID
  contractAddress?: string  // 合约地址
  chain?: string  // 所在链
  blockchain?: string  // 区块链浏览器
  website?: string  // 官网
  twitter?: string  // Twitter
  coingeckoId?: string  // CoinGecko ID
  status: TokenStatus  // 状态
  priority?: Priority  // 优先级（兼容 ProjectCard）
  tags: string[]  // 标签
  tasks: Task[]  // 任务列表（兼容 ProjectCard）
  transactions: Transaction[]  // 交易记录（兼容 ProjectCard）
  investments: TokenInvestment[]  // 投资记录
  priceHistory: TokenPricePoint[]  // 价格历史
  currentPrice?: number  // 当前价格
  lastPriceUpdate?: number  // 最后价格更新时间
  deadline?: number  // 截止日期（兼容 ProjectCard）
  notes: string
  createdAt: number
  updatedAt: number
}

export interface Project {
  id: string
  name: string
  description: string
  logoUrl?: string  // 自定义 Logo URL 或 SVG
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
  tokens: Token[]  // 代币列表
  deletedTokens: Token[]  // 代币回收站
  projectOrder: string[]  // 项目排序
  tokenOrder: string[]  // 代币排序
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  deleteProjects: (ids: string[]) => void
  updateProjects: (ids: string[], updates: Partial<Project>) => void
  restoreProject: (id: string) => void  // 恢复项目
  permanentDeleteProject: (id: string) => void  // 永久删除
  clearTrash: () => void  // 清空回收站
  reorderProjects: (newOrder: string[]) => void  // 重新排序项目
  addTask: (projectId: string, title: string) => void
  toggleTask: (projectId: string, taskId: string) => void
  deleteTask: (projectId: string, taskId: string) => void
  addTransaction: (projectId: string, type: TransactionType, amount: number, note?: string) => void
  deleteTransaction: (projectId: string, transactionId: string) => void
  // 代币管理
  addToken: (token: Omit<Token, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateToken: (id: string, updates: Partial<Token>) => void
  deleteToken: (id: string) => void
  deleteTokens: (ids: string[]) => void
  updateTokens: (ids: string[], updates: Partial<Token>) => void
  restoreToken: (id: string) => void
  permanentDeleteToken: (id: string) => void
  clearTokenTrash: () => void
  reorderTokens: (newOrder: string[]) => void  // 重新排序代币
  addTokenInvestment: (tokenId: string, investment: Omit<TokenInvestment, 'id'>) => void
  addTokenPrice: (tokenId: string, price: TokenPricePoint) => void
  exportData: () => string
  importData: (json: string) => boolean
}
