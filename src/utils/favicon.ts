/**
 * 获取网站 favicon URL
 * 使用 Google 的 favicon 服务，支持大多数网站
 */
export function getFaviconUrl(websiteUrl: string): string | null {
  if (!websiteUrl) return null
  
  try {
    const url = new URL(websiteUrl)
    const domain = url.hostname
    // 使用 Google 的 favicon 服务，获取高清图标
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
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
