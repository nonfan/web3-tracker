/**
 * 获取网站 favicon URL
 * 使用 Favicon.im 服务，支持高清图标
 */
export function getFaviconUrl(websiteUrl: string): string | null {
  if (!websiteUrl) return null
  
  try {
    const url = new URL(websiteUrl)
    const domain = url.hostname
    // Favicon.im 提供高清图标
    return `https://favicon.im/${domain}?larger=true`
  } catch {
    return null
  }
}

/**
 * 备用方案：使用 Google favicon 服务
 */
export function getGoogleFaviconUrl(websiteUrl: string): string | null {
  if (!websiteUrl) return null
  
  try {
    const url = new URL(websiteUrl)
    const domain = url.hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  } catch {
    return null
  }
}

/**
 * 备用方案：直接使用网站的 favicon.ico
 */
export function getDirectFaviconUrl(websiteUrl: string): string | null {
  if (!websiteUrl) return null
  
  try {
    const url = new URL(websiteUrl)
    return `${url.origin}/favicon.ico`
  } catch {
    return null
  }
}
