import type { Project } from '../types'

const GIST_FILENAME = 'web3tracker-data.json'
const STORAGE_KEY = 'web3tracker-gist-config'
const SYNC_STATE_KEY = 'web3tracker-sync-state'

interface GistConfig {
  token: string
  projectGistId: string | null    // 项目数据 Gist ID
  economicGistId: string | null   // 经济数据 Gist ID
}

// 同步状态：记录上次同步的版本号
interface SyncState {
  version: number        // 版本号
  lastSyncAt: number     // 上次同步时间
  lastSyncHash: string   // 上次同步时的数据哈希
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
export async function findAllGists(token: string): Promise<GistInfo[]> {
  try {
    const response = await fetch('https://api.github.com/gists?per_page=100', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) return []
    
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
    return results
  } catch {
    return []
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

// 创建新的私有 Gist
async function createGist(token: string, data: string, version: number): Promise<string> {
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
  return gist.id
}

// 更新现有 Gist
async function updateGist(token: string, gistId: string, data: string, version: number): Promise<void> {
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
}

// 从 Gist 读取数据
async function readGist(token: string, gistId: string): Promise<string | null> {
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
  return file ? file.content : null
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

// 同步数据到 Gist（带版本控制）
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
      // 先拉取云端数据检查冲突
      const remoteData = await readGist(config.token, gistId)
      
      if (remoteData) {
        const diff = compareDataWithSync(data, remoteData, syncState)
        
        if (diff.hasConflict) {
          // 有冲突，返回差异信息让用户处理
          return { 
            success: false, 
            conflict: true, 
            diff,
            remoteData,
            error: '检测到数据冲突，请先处理'
          }
        }
      }
      
      // 无冲突，直接更新
      try {
        await updateGist(config.token, gistId, data, currentVersion)
        // 更新同步状态
        saveSyncState({
          version: currentVersion,
          lastSyncAt: Date.now(),
          lastSyncHash: simpleHash(data),
        })
      } catch (e) {
        if (e instanceof Error && e.message === 'GIST_NOT_FOUND') {
          const newGistId = await createGist(config.token, data, currentVersion)
          saveGistConfig({ ...config, projectGistId: newGistId })
          saveSyncState({
            version: currentVersion,
            lastSyncAt: Date.now(),
            lastSyncHash: simpleHash(data),
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
      const gistId = await createGist(config.token, data, currentVersion)
      saveGistConfig({ ...config, projectGistId: gistId })
      saveSyncState({
        version: currentVersion,
        lastSyncAt: Date.now(),
        lastSyncHash: simpleHash(data),
      })
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '同步失败' }
  }
}

// 强制推送（忽略冲突）
export async function forcePushToGist(data: string): Promise<{ success: boolean; error?: string }> {
  const config = getGistConfig()
  if (!config?.token || !config.projectGistId) {
    return { success: false, error: '未配置' }
  }

  const syncState = getSyncState()
  const currentVersion = (syncState?.version || 0) + 1

  try {
    await updateGist(config.token, config.projectGistId, data, currentVersion)
    saveSyncState({
      version: currentVersion,
      lastSyncAt: Date.now(),
      lastSyncHash: simpleHash(data),
    })
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '推送失败' }
  }
}

// 从 Gist 拉取数据
export async function pullFromGist(): Promise<{ success: boolean; data?: string; error?: string; version?: number }> {
  const config = getGistConfig()
  if (!config?.token) {
    return { success: false, error: '未配置 GitHub Token' }
  }

  if (!config.projectGistId) {
    return { success: false, error: '未选择项目数据存储，请先选择或推送' }
  }

  try {
    const data = await readGist(config.token, config.projectGistId)
    if (!data) {
      return { success: false, error: '云端数据为空' }
    }
    
    // 解析版本号
    const dataObj = JSON.parse(data)
    const version = dataObj.syncVersion || 0
    
    return { success: true, data, version }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '拉取失败' }
  }
}

// 拉取后更新同步状态
export function updateSyncStateAfterPull(data: string, version: number) {
  saveSyncState({
    version,
    lastSyncAt: Date.now(),
    lastSyncHash: simpleHash(data),
  })
}
