// Google Drive 同步工具

const STORAGE_KEY = 'web3tracker_google_config'
const FILE_NAME = 'web3tracker_data.json'
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'

interface GoogleConfig {
  clientId: string
  accessToken?: string
  expiresAt?: number
}

// 保存配置
export function saveGoogleConfig(config: GoogleConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

// 获取配置
export function getGoogleConfig(): GoogleConfig | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

// 清除配置
export function clearGoogleConfig() {
  localStorage.removeItem(STORAGE_KEY)
}

// 检查 token 是否有效
export function isTokenValid(): boolean {
  const config = getGoogleConfig()
  if (!config?.accessToken || !config?.expiresAt) return false
  return Date.now() < config.expiresAt
}

// 初始化 Google OAuth
export function initGoogleAuth(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 使用当前完整路径作为重定向 URI（去掉 hash 和 query）
    const currentUrl = new URL(window.location.href)
    const redirectUri = `${currentUrl.origin}${currentUrl.pathname}`
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'token')
    authUrl.searchParams.set('scope', SCOPES)
    authUrl.searchParams.set('prompt', 'consent')

    // 打开授权窗口
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    const authWindow = window.open(
      authUrl.toString(),
      'Google Auth',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!authWindow) {
      reject(new Error('无法打开授权窗口，请检查弹窗拦截设置'))
      return
    }

    // 监听回调
    const checkInterval = setInterval(() => {
      try {
        if (authWindow.closed) {
          clearInterval(checkInterval)
          reject(new Error('授权窗口已关闭'))
          return
        }

        const url = authWindow.location.href
        if (url.includes(currentUrl.origin)) {
          clearInterval(checkInterval)
          authWindow.close()

          // 解析 token
          const hash = new URL(url).hash.substring(1)
          const params = new URLSearchParams(hash)
          const accessToken = params.get('access_token')
          const expiresIn = params.get('expires_in')

          if (accessToken) {
            const config: GoogleConfig = {
              clientId,
              accessToken,
              expiresAt: Date.now() + (parseInt(expiresIn || '3600') * 1000)
            }
            saveGoogleConfig(config)
            resolve(accessToken)
          } else {
            reject(new Error('授权失败'))
          }
        }
      } catch {
        // 跨域错误，继续等待
      }
    }, 500)

    // 超时
    setTimeout(() => {
      clearInterval(checkInterval)
      if (!authWindow.closed) {
        authWindow.close()
      }
      reject(new Error('授权超时'))
    }, 120000)
  })
}

// 查找已有的数据文件
async function findDataFile(accessToken: string): Promise<string | null> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  )

  if (!response.ok) return null

  const data = await response.json()
  return data.files?.[0]?.id || null
}

// 同步到 Google Drive
export async function syncToGoogleDrive(jsonData: string): Promise<{ success: boolean; error?: string }> {
  const config = getGoogleConfig()
  if (!config?.accessToken) {
    return { success: false, error: '未授权' }
  }

  if (!isTokenValid()) {
    return { success: false, error: 'Token 已过期，请重新授权' }
  }

  try {
    const fileId = await findDataFile(config.accessToken)

    if (fileId) {
      // 更新现有文件
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: jsonData
        }
      )

      if (!response.ok) {
        throw new Error('更新失败')
      }
    } else {
      // 创建新文件
      const metadata = {
        name: FILE_NAME,
        parents: ['appDataFolder']
      }

      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', new Blob([jsonData], { type: 'application/json' }))

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${config.accessToken}` },
          body: form
        }
      )

      if (!response.ok) {
        throw new Error('创建失败')
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '同步失败' }
  }
}

// 从 Google Drive 拉取
export async function pullFromGoogleDrive(): Promise<{ success: boolean; data?: string; error?: string }> {
  const config = getGoogleConfig()
  if (!config?.accessToken) {
    return { success: false, error: '未授权' }
  }

  if (!isTokenValid()) {
    return { success: false, error: 'Token 已过期，请重新授权' }
  }

  try {
    const fileId = await findDataFile(config.accessToken)

    if (!fileId) {
      return { success: false, error: '云端没有数据' }
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${config.accessToken}` }
      }
    )

    if (!response.ok) {
      throw new Error('拉取失败')
    }

    const data = await response.text()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '拉取失败' }
  }
}
