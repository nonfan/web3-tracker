/**
 * 中国经济数据 API
 * 从 GitHub Gist 获取中国经济数据
 */

export interface ChinaEconomicData {
  m2: Array<{ date: string; value: number }>
  dr007: Array<{ date: string; value: number }>
  socialFinancing: Array<{ date: string; value: number }>
  usdCny: Array<{ date: string; value: number }>
  lastUpdated: string
}

/**
 * 从 Gist 获取中国经济数据
 * 
 * ⚠️ 注意：当前数据为模拟数据，非真实经济指标
 */
export async function fetchChinaEconomicData(): Promise<ChinaEconomicData | null> {
  try {
    const economicGistId = localStorage.getItem('economicGistId')
    if (!economicGistId) {
      console.warn('未设置经济数据 Gist ID')
      return null
    }

    const response = await fetch(`https://api.github.com/gists/${economicGistId}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const gist = await response.json()
    const chinaDataFile = gist.files['china-economic-data.json']
    
    if (!chinaDataFile) {
      console.warn('Gist 中未找到中国经济数据文件')
      return null
    }

    const data = JSON.parse(chinaDataFile.content)
    
    // 检查是否为模拟数据并发出警告
    if (data.dataSource === 'MOCK_DATA') {
      console.warn('🚨 警告：当前显示的中国经济数据为模拟数据，非真实经济指标！')
      console.warn('📋 需要接入真实数据源：央行、外汇管理局等官方渠道')
    }
    
    return data
  } catch (error) {
    console.error('获取中国经济数据失败:', error)
    return null
  }
}

/**
 * 获取最新的 M2 货币供应量数据
 */
export function getLatestM2(data: ChinaEconomicData): number | null {
  if (!data.m2 || data.m2.length === 0) return null
  return data.m2[data.m2.length - 1].value
}

/**
 * 获取最新的 DR007 利率数据
 */
export function getLatestDR007(data: ChinaEconomicData): number | null {
  if (!data.dr007 || data.dr007.length === 0) return null
  return data.dr007[data.dr007.length - 1].value
}

/**
 * 获取最新的社会融资规模数据
 */
export function getLatestSocialFinancing(data: ChinaEconomicData): number | null {
  if (!data.socialFinancing || data.socialFinancing.length === 0) return null
  return data.socialFinancing[data.socialFinancing.length - 1].value
}

/**
 * 获取最新的 USD/CNY 汇率数据
 */
export function getLatestUsdCny(data: ChinaEconomicData): number | null {
  if (!data.usdCny || data.usdCny.length === 0) return null
  return data.usdCny[data.usdCny.length - 1].value
}