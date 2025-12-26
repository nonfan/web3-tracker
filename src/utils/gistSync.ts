import type { Project } from '../types'

const GIST_FILENAME = 'web3tracker-data.json'
const STORAGE_KEY = 'web3tracker-gist-config'

interface GistConfig {
  token: string
  gistId: string | null
}

export interface GistInfo {
  id: string
  updatedAt: string
}

export interface DiffResult {
  hasConflict: boolean
  localOnly: Project[]      // 本地新增
  remoteOnly: Project[]     // 云端新增
  modified: { local: Project; remote: Project }[]  // 两边都改了
  unchanged: Project[]      // 没变化
}

// 比较本地和云端数据差异
export function compareData(localData: string, remoteData: string): DiffResult {
  const result: DiffResult = {
    hasConflict: false,
    localOnly: [],
    remoteOnly: [],
    modified: [],
    unchanged: [],
  }

  try {
    const local = JSON.parse(localData)
    const remote = JSON.parse(remoteData)
    
    const localProjects: Project[] = local.projects || []
    const remoteProjects: Project[] = remote.projects || []
    
    const localMap = new Map(localProjects.map(p => [p.id, p]))
    const remoteMap = new Map(remoteProjects.map(p => [p.id, p]))
    
    // 检查本地项目
    for (const [id, localProject] of localMap) {
      const remoteProject = remoteMap.get(id)
      if (!remoteProject) {
        // 本地有，云端没有
        result.localOnly.push(localProject)
      } else if (localProject.updatedAt !== remoteProject.updatedAt) {
        // 两边都有但不一样
        result.modified.push({ local: localProject, remote: remoteProject })
        result.hasConflict = true
      } else {
        result.unchanged.push(localProject)
      }
    }
    
    // 检查云端独有的
    for (const [id, remoteProject] of remoteMap) {
      if (!localMap.has(id)) {
        result.remoteOnly.push(remoteProject)
        result.hasConflict = true  // 云端有本地没有也算冲突
      }
    }
    
    // 本地新增不算冲突，可以直接推送
    // 但如果有 modified 或 remoteOnly 就需要处理
    
  } catch {
    // 解析失败，当作有冲突
    result.hasConflict = true
  }
  
  return result
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
}

// 查找所有 Web3Tracker Gist
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
      if (gist.files && gist.files[GIST_FILENAME]) {
        results.push({
          id: gist.id,
          updatedAt: gist.updated_at,
        })
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
async function createGist(token: string, data: string): Promise<string> {
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
          content: data,
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
async function updateGist(token: string, gistId: string, data: string): Promise<void> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: data,
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

// 同步数据到 Gist（带冲突检测）
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

  try {
    if (config.gistId) {
      // 先拉取云端数据检查冲突
      const remoteData = await readGist(config.token, config.gistId)
      
      if (remoteData) {
        const diff = compareData(data, remoteData)
        
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
        await updateGist(config.token, config.gistId, data)
      } catch (e) {
        if (e instanceof Error && e.message === 'GIST_NOT_FOUND') {
          const newGistId = await createGist(config.token, data)
          saveGistConfig({ ...config, gistId: newGistId })
        } else {
          throw e
        }
      }
    } else {
      // 没有选择 Gist，检查是否已有
      const existingGists = await findAllGists(config.token)
      if (existingGists.length > 0) {
        return { success: false, needSelect: true, error: `已有 ${existingGists.length} 个云端存储，请先在设置中选择要使用的存储` }
      }
      // 没有已有的，创建新的
      const gistId = await createGist(config.token, data)
      saveGistConfig({ ...config, gistId })
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '同步失败' }
  }
}

// 强制推送（忽略冲突）
export async function forcePushToGist(data: string): Promise<{ success: boolean; error?: string }> {
  const config = getGistConfig()
  if (!config?.token || !config.gistId) {
    return { success: false, error: '未配置' }
  }

  try {
    await updateGist(config.token, config.gistId, data)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '推送失败' }
  }
}

// 从 Gist 拉取数据
export async function pullFromGist(): Promise<{ success: boolean; data?: string; error?: string }> {
  const config = getGistConfig()
  if (!config?.token) {
    return { success: false, error: '未配置 GitHub Token' }
  }

  if (!config.gistId) {
    return { success: false, error: '未选择云端数据，请先选择或推送' }
  }

  try {
    const data = await readGist(config.token, config.gistId)
    if (!data) {
      return { success: false, error: '云端数据为空' }
    }
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '拉取失败' }
  }
}
