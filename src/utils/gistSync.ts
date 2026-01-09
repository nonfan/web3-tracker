import type { Project } from '../types'

const GIST_FILENAME = 'web3tracker-data.json'
const STORAGE_KEY = 'web3tracker-gist-config'
const SYNC_STATE_KEY = 'web3tracker-sync-state'

interface GistConfig {
  token: string
  projectGistId: string | null    // 项目数据 Gist ID
  economicGistId: string | null   // 经济数据 Gist ID
}

// 同步状态：记录上次同步的版本号和远程更新时间（乐观锁）
interface SyncState {
  version: number           // 本地版本号
  lastSyncAt: number        // 上次同步时间
  lastSyncHash: string      // 上次同步时的数据哈希
  remoteUpdatedAt?: string  // 远程 Gist 的 updated_at（乐观锁关键字段）
}

export interface GistInfo {
  id: string
  updatedAt: string
  type: 'project' | 'economic'
  description?: string
  fileName?: string  // 添加文件名字段
  owner?: string     // 添加所有者字段
}

export interface DiffResult {
  hasConflict: boolean
  localOnly: Project[]      // 本地新增
  remoteOnly: Project[]     // 云端新增
  modified: { local: Project; remote: Project }[]  // 两边都改了
  unchanged: Project[]      // 没变化
  localModified: Project[]  // 本地修改（云端未变）
  remoteModified: Project[] // 云端修改（本地未变）
}

// 简单的哈希函数
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

// 获取同步状态
export function getSyncState(): SyncState | null {
  const stored = localStorage.getItem(SYNC_STATE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

// 保存同步状态
export function saveSyncState(state: SyncState) {
  localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state))
}

// 清除同步状态
export function clearSyncState() {
  localStorage.removeItem(SYNC_STATE_KEY)
}

// 比较本地和云端数据差异（基于上次同步状态）
export function compareDataWithSync(
  localData: string, 
  remoteData: string,
  syncState: SyncState | null
): DiffResult {
  const result: DiffResult = {
    hasConflict: false,
    localOnly: [],
    remoteOnly: [],
    modified: [],
    unchanged: [],
    localModified: [],
    remoteModified: [],
  }

  try {
    const local = JSON.parse(localData)
    const remote = JSON.parse(remoteData)
    
    const localProjects: Project[] = local.projects || []
    const remoteProjects: Project[] = remote.projects || []
    const remoteVersion = remote.syncVersion || 0
    
    const localMap = new Map(localProjects.map(p => [p.id, p]))
    const remoteMap = new Map(remoteProjects.map(p => [p.id, p]))
    
    const lastSyncAt = syncState?.lastSyncAt || 0
    
    // 检查本地项目
    for (const [id, localProject] of localMap) {
      const remoteProject = remoteMap.get(id)
      
      if (!remoteProject) {
        // 本地有，云端没有
        if (localProject.createdAt > lastSyncAt) {
          // 上次同步后新建的，是本地新增
          result.localOnly.push(localProject)
        } else {
          // 上次同步前就有，说明云端删除了，这是冲突
          result.localOnly.push(localProject)
          result.hasConflict = true
        }
      } else if (localProject.updatedAt === remoteProject.updatedAt) {
        // 完全一样
        result.unchanged.push(localProject)
      } else {
        // 不一样，判断是谁修改的
        const localModifiedAfterSync = localProject.updatedAt > lastSyncAt
        const remoteModifiedAfterSync = remoteProject.updatedAt > lastSyncAt
        
        if (localModifiedAfterSync && remoteModifiedAfterSync) {
          // 两边都修改了 - 冲突
          result.modified.push({ local: localProject, remote: remoteProject })
          result.hasConflict = true
        } else if (localModifiedAfterSync) {
          // 只有本地修改了
          result.localModified.push(localProject)
        } else if (remoteModifiedAfterSync) {
          // 只有云端修改了
          result.remoteModified.push(remoteProject)
          result.hasConflict = true // 需要先拉取
        } else {
          // 都没修改但不一样？用更新的那个
          if (localProject.updatedAt > remoteProject.updatedAt) {
            result.localModified.push(localProject)
          } else {
            result.remoteModified.push(remoteProject)
            result.hasConflict = true
          }
        }
      }
    }
    
    // 检查云端独有的
    for (const [id, remoteProject] of remoteMap) {
      if (!localMap.has(id)) {
        // 云端有，本地没有
        if (remoteProject.createdAt > lastSyncAt) {
          // 云端新增的
          result.remoteOnly.push(remoteProject)
          result.hasConflict = true // 需要先拉取
        } else {
          // 本地删除了
          result.remoteOnly.push(remoteProject)
          // 本地删除不算冲突，推送时会删除云端的
        }
      }
    }
    
    // 如果云端版本号比本地记录的高，说明有其他设备推送过
    const localVersion = syncState?.version || 0
    if (remoteVersion > localVersion && (result.remoteOnly.length > 0 || result.remoteModified.length > 0)) {
      result.hasConflict = true
    }
    
  } catch {
    result.hasConflict = true
  }
  
  return result
}

// 旧的比较函数保留兼容
export function compareData(localData: string, remoteData: string): DiffResult {
  return compareDataWithSync(localData, remoteData, getSyncState())
}

export function getGistConfig(): GistConfig | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function saveGistConfig(config: GistConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function clearGistConfig() {
  localStorage.removeItem(STORAGE_KEY)
  clearSyncState()
}

// 查找所有 Web3Tracker 相关的 Gist（项目数据和经济数据）
// 添加缓存避免重复请求
let gistListCache: { data: GistInfo[], timestamp: number } | null = null
const GIST_LIST_CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

export async function findAllGists(token: string): Promise<GistInfo[]> {
  // 检查缓存
  if (gistListCache && (Date.now() - gistListCache.timestamp) < GIST_LIST_CACHE_DURATION) {
    console.log('📋 使用缓存的 Gist 列表')
    return gistListCache.data
  }

  try {
    const response = await fetch('https://api.github.com/gists?per_page=100', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}))
      if (errorData.message?.includes('rate limit')) {
        console.error('⚠️ GitHub API 速率限制，请稍后再试')
        // 返回缓存数据（如果有的话）
        return gistListCache?.data || []
      }
    }
    
    if (!response.ok) return gistListCache?.data || []
    
    const gists = await response.json()
    const results: GistInfo[] = []
    for (const gist of gists) {
      if (gist.files) {
        // 检查是否是项目数据 Gist
        if (gist.files[GIST_FILENAME]) {
          const fileName = Object.keys(gist.files)[0] // 获取第一个文件名
          const owner = gist.owner?.login || 'unknown'
          results.push({
            id: gist.id,
            updatedAt: gist.updated_at,
            type: 'project',
            description: gist.description || 'Web3 Tracker Data Backup',
            fileName: `${owner} / ${fileName}`,
            owner
          })
        }
        // 检查是否是经济数据 Gist
        else if (gist.files['economic-data.json']) {
          const fileName = 'economic-data.json'
          const owner = gist.owner?.login || 'unknown'
          results.push({
            id: gist.id,
            updatedAt: gist.updated_at,
            type: 'economic',
            description: gist.description || 'Web3 Tracker Economic Data',
            fileName: `${owner} / ${fileName}`,
            owner
          })
        }
      }
    }
    
    // 更新缓存
    gistListCache = { data: results, timestamp: Date.now() }
    
    return results
  } catch {
    return gistListCache?.data || []
  }
}

// 验证 Token 是否有效
export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

// 创建新的私有 Gist（返回 id 和 updated_at）
async function createGist(token: string, data: string, version: number): Promise<{ id: string; updatedAt: string }> {
  // 添加版本号到数据中
  const dataObj = JSON.parse(data)
  dataObj.syncVersion = version
  
  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Web3 Tracker Data Backup',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(dataObj, null, 2),
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create gist: ${response.status}`)
  }

  const gist = await response.json()
  return { id: gist.id, updatedAt: gist.updated_at }
}

// 更新现有 Gist（返回新的 updated_at）
async function updateGist(token: string, gistId: string, data: string, version: number): Promise<string> {
  // 添加版本号到数据中
  const dataObj = JSON.parse(data)
  dataObj.syncVersion = version
  
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(dataObj, null, 2),
        },
      },
    }),
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('GIST_NOT_FOUND')
    }
    throw new Error(`Failed to update gist: ${response.status}`)
  }
  
  const gist = await response.json()
  return gist.updated_at
}

// 从 Gist 读取数据（返回内容和元数据）
interface GistReadResult {
  content: string | null
  updatedAt: string | null
  version: number
}

async function readGist(token: string, gistId: string): Promise<GistReadResult | null> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error(`Failed to read gist: ${response.status}`)
  }

  const gist = await response.json()
  const file = gist.files[GIST_FILENAME]
  
  if (!file) {
    return null
  }
  
  // 解析版本号
  let version = 0
  try {
    const dataObj = JSON.parse(file.content)
    version = dataObj.syncVersion || 0
  } catch {
    // 忽略解析错误
  }
  
  return {
    content: file.content,
    updatedAt: gist.updated_at,
    version
  }
}

// 删除 Gist
export async function deleteGist(token: string, gistId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.status === 204
  } catch {
    return false
  }
}

// 同步数据到 Gist（带乐观锁版本控制）
export async function syncToGist(data: string): Promise<{ 
  success: boolean
  error?: string
  needSelect?: boolean
  conflict?: boolean
  diff?: DiffResult
  remoteData?: string
}> {
  const config = getGistConfig()
  if (!config?.token) {
    return { success: false, error: '未配置 GitHub Token' }
  }

  // 使用项目数据 Gist ID
  const gistId = config.projectGistId
  const syncState = getSyncState()
  const currentVersion = (syncState?.version || 0) + 1

  try {
    if (gistId) {
      // 【乐观锁核心】先拉取云端数据，检查 updated_at 是否变化
      const remoteResult = await readGist(config.token, gistId)
      
      if (remoteResult && remoteResult.content) {
        // 检查乐观锁：远程 updated_at 是否与上次同步时一致
        const lastRemoteUpdatedAt = syncState?.remoteUpdatedAt
        
        if (lastRemoteUpdatedAt && remoteResult.updatedAt !== lastRemoteUpdatedAt) {
          // 远程已被其他设备更新，需要先处理冲突
          console.log('🔒 乐观锁检测到冲突:', {
            lastKnown: lastRemoteUpdatedAt,
            current: remoteResult.updatedAt
          })
          
          const diff = compareDataWithSync(data, remoteResult.content, syncState)
          
          // 即使 diff 显示无冲突，也要提示用户远程有更新
          return { 
            success: false, 
            conflict: true, 
            diff,
            remoteData: remoteResult.content,
            error: '云端数据已被其他设备更新，请先拉取最新数据'
          }
        }
        
        // 即使 updated_at 一致，也检查数据差异
        const diff = compareDataWithSync(data, remoteResult.content, syncState)
        
        if (diff.hasConflict) {
          return { 
            success: false, 
            conflict: true, 
            diff,
            remoteData: remoteResult.content,
            error: '检测到数据冲突，请先处理'
          }
        }
      }
      
      // 无冲突，执行更新
      try {
        const newUpdatedAt = await updateGist(config.token, gistId, data, currentVersion)
        // 更新同步状态（包含新的 remoteUpdatedAt）
        saveSyncState({
          version: currentVersion,
          lastSyncAt: Date.now(),
          lastSyncHash: simpleHash(data),
          remoteUpdatedAt: newUpdatedAt,
        })
        console.log('✅ 同步成功，新版本:', currentVersion, '远程时间:', newUpdatedAt)
      } catch (e) {
        if (e instanceof Error && e.message === 'GIST_NOT_FOUND') {
          const result = await createGist(config.token, data, currentVersion)
          saveGistConfig({ ...config, projectGistId: result.id })
          saveSyncState({
            version: currentVersion,
            lastSyncAt: Date.now(),
            lastSyncHash: simpleHash(data),
            remoteUpdatedAt: result.updatedAt,
          })
        } else {
          throw e
        }
      }
    } else {
      // 没有选择 Gist，检查是否已有
      const existingGists = await findAllGists(config.token)
      const projectGists = existingGists.filter(g => g.type === 'project')
      if (projectGists.length > 0) {
        return { success: false, needSelect: true, error: `已有 ${projectGists.length} 个项目数据存储，请先在设置中选择要使用的存储` }
      }
      // 没有已有的，创建新的
      const result = await createGist(config.token, data, currentVersion)
      saveGistConfig({ ...config, projectGistId: result.id })
      saveSyncState({
        version: currentVersion,
        lastSyncAt: Date.now(),
        lastSyncHash: simpleHash(data),
        remoteUpdatedAt: result.updatedAt,
      })
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '同步失败' }
  }
}

// 强制推送（忽略冲突，用于用户确认后覆盖）
export async function forcePushToGist(data: string): Promise<{ success: boolean; error?: string }> {
  const config = getGistConfig()
  if (!config?.token || !config.projectGistId) {
    return { success: false, error: '未配置' }
  }

  const syncState = getSyncState()
  const currentVersion = (syncState?.version || 0) + 1

  try {
    const newUpdatedAt = await updateGist(config.token, config.projectGistId, data, currentVersion)
    saveSyncState({
      version: currentVersion,
      lastSyncAt: Date.now(),
      lastSyncHash: simpleHash(data),
      remoteUpdatedAt: newUpdatedAt,
    })
    console.log('✅ 强制推送成功，新版本:', currentVersion)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '推送失败' }
  }
}

// 从 Gist 拉取数据
export async function pullFromGist(): Promise<{ 
  success: boolean
  data?: string
  error?: string
  version?: number
  updatedAt?: string
}> {
  const config = getGistConfig()
  if (!config?.token) {
    return { success: false, error: '未配置 GitHub Token' }
  }

  if (!config.projectGistId) {
    return { success: false, error: '未选择项目数据存储，请先选择或推送' }
  }

  try {
    const result = await readGist(config.token, config.projectGistId)
    if (!result || !result.content) {
      return { success: false, error: '云端数据为空' }
    }
    
    return { 
      success: true, 
      data: result.content, 
      version: result.version,
      updatedAt: result.updatedAt || undefined
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '拉取失败' }
  }
}

// 拉取后更新同步状态（包含远程 updated_at）
export function updateSyncStateAfterPull(data: string, version: number, remoteUpdatedAt?: string) {
  saveSyncState({
    version,
    lastSyncAt: Date.now(),
    lastSyncHash: simpleHash(data),
    remoteUpdatedAt,
  })
  console.log('✅ 拉取完成，同步状态已更新，版本:', version)
}
