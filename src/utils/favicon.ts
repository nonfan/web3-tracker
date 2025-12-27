/**
 * 获取网站 favicon URL
 * 优先使用 DuckDuckGo 的图标服务，质量更好
 */
export function getFaviconUrl(websiteUrl: string): string | null {
  if (!websiteUrl) return null
  
  try {
    const url = new URL(websiteUrl)
    const domain = url.hostname
    // DuckDuckGo 图标服务，质量更好
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`
  } catch {
    return null
  }
}

/**
 * 备用方案：使用 Google favicon 服务
 */
export function getGoogleFaviconUrl(websiteUrl: string, size: number = 64): string | null {
  if (!websiteUrl) return null
  
  try {
    const url = new URL(websiteUrl)
    const domain = url.hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
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
