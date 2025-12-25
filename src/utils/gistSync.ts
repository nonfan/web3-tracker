const GIST_FILENAME = 'web3tracker-data.json'
const STORAGE_KEY = 'web3tracker-gist-config'

interface GistConfig {
  token: string
  gistId: string | null
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

// 查找已存在的 Web3Tracker Gist
async function findExistingGist(token: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) return null
    
    const gists = await response.json()
    for (const gist of gists) {
      if (gist.files && gist.files[GIST_FILENAME]) {
        return gist.id
      }
    }
    return null
  } catch {
    return null
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
      public: false, // 私有 Gist
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

// 验证 Token 是否有效，并尝试查找已有的 Gist
export async function validateToken(token: string): Promise<{ valid: boolean; gistId?: string }> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) return { valid: false }
    
    // Token 有效，尝试查找已有的 Gist
    const existingGistId = await findExistingGist(token)
    return { valid: true, gistId: existingGistId || undefined }
  } catch {
    return { valid: false }
  }
}

// 同步数据到 Gist
export async function syncToGist(data: string): Promise<{ success: boolean; error?: string }> {
  const config = getGistConfig()
  if (!config?.token) {
    return { success: false, error: '未配置 GitHub Token' }
  }

  try {
    if (config.gistId) {
      // 尝试更新现有 Gist
      try {
        await updateGist(config.token, config.gistId, data)
      } catch (e) {
        if (e instanceof Error && e.message === 'GIST_NOT_FOUND') {
          // Gist 不存在，创建新的
          const newGistId = await createGist(config.token, data)
          saveGistConfig({ ...config, gistId: newGistId })
        } else {
          throw e
        }
      }
    } else {
      // 创建新 Gist
      const gistId = await createGist(config.token, data)
      saveGistConfig({ ...config, gistId })
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '同步失败' }
  }
}

// 从 Gist 拉取数据
export async function pullFromGist(): Promise<{ success: boolean; data?: string; error?: string }> {
  const config = getGistConfig()
  if (!config?.token) {
    return { success: false, error: '未配置 GitHub Token' }
  }

  if (!config.gistId) {
    return { success: false, error: '未找到云端数据，请先同步' }
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
