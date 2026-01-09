/**
 * 中国经济数据 API
 * 从 GitHub Gist 获取中国经济数据
 */

export interface ChinaEconomicDataPoint {
  date: string
  value: number
}

export interface ChinaEconomicData {
  m2: Array<{ date: string; value: number }>
  dr007: Array<{ date: string; value: number }>
  socialFinancing: Array<{ date: string; value: number }>
  usdCny: Array<{ date: string; value: number }>
  lastUpdated: string
}

// Gist 中实际的数据结构
export interface GistChinaEconomicData {
  lastUpdate: string
  country: string
  name: string
  currency: string
  data: {
    m2MoneySupply: Array<{ date: string; value: number }>
    dr007Rate: Array<{ date: string; value: number }>
    socialFinancing: Array<{ date: string; value: number }>
    usdCnyRate: Array<{ date: string; value: number }>
  }
}

/**
 * 从 Gist 获取中国经济数据
 * 
 * ⚠️ 注意：当前数据为模拟数据，非真实经济指标
 */
export async function fetchChinaEconomicData(): Promise<ChinaEconomicData | null> {
  try {
    // 优先使用 localStorage 中的配置，如果没有则使用环境变量
    let economicGistId = localStorage.getItem('economicGistId')
    if (!economicGistId) {
      // 从环境变量获取 GIST_ID 作为后备
      economicGistId = import.meta.env.VITE_GIST_ID || 'cdd0e8f0991321350c731d718ba807b5'
      console.log('🔧 使用环境变量中的 Gist ID:', economicGistId)
    }
    
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

    const rawData = JSON.parse(chinaDataFile.content)
    console.log('🇨🇳 原始中国数据结构:', rawData)
    
    // 检查是否有 chinaEconomicData 字段
    const chinaData = rawData.chinaEconomicData || rawData
    
    if (!chinaData || !chinaData.data) {
      console.warn('⚠️ 中国经济数据结构不正确')
      return null
    }
    
    // 转换数据结构以匹配我们的接口
    const data: ChinaEconomicData = {
      m2: chinaData.data.m2MoneySupply || [],
      dr007: chinaData.data.dr007Rate || [],
      socialFinancing: chinaData.data.socialFinancing || [],
      usdCny: chinaData.data.usdCnyRate || [],
      lastUpdated: chinaData.lastUpdate || new Date().toISOString()
    }
    
    // 验证数据完整性
    const hasData = data.m2.length > 0 || data.dr007.length > 0 || 
                   data.socialFinancing.length > 0 || data.usdCny.length > 0
    
    if (!hasData) {
      console.warn('⚠️ 中国经济数据为空，不显示数据')
      return null
    }
    
    console.log('✅ 成功获取中国经济数据:', {
      m2: data.m2.length,
      dr007: data.dr007.length,
      socialFinancing: data.socialFinancing.length,
      usdCny: data.usdCny.length
    })
    
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

/**
 * 获取 M2 货币供应量数据
 */
export async function getM2MoneySupplyData(): Promise<ChinaEconomicDataPoint[]> {
  const data = await fetchChinaEconomicData()
  if (!data || !data.m2) return []
  return data.m2.map(item => ({ date: item.date, value: item.value }))
}

/**
 * 获取 DR007 利率数据
 */
export async function getDR007RateData(): Promise<ChinaEconomicDataPoint[]> {
  const data = await fetchChinaEconomicData()
  if (!data || !data.dr007) return []
  return data.dr007.map(item => ({ date: item.date, value: item.value }))
}

/**
 * 获取社会融资规模数据
 */
export async function getSocialFinancingData(): Promise<ChinaEconomicDataPoint[]> {
  const data = await fetchChinaEconomicData()
  if (!data || !data.socialFinancing) return []
  return data.socialFinancing.map(item => ({ date: item.date, value: item.value }))
}

/**
 * 获取 USD/CNY 汇率数据
 */
export async function getUsdCnyRateData(): Promise<ChinaEconomicDataPoint[]> {
  const data = await fetchChinaEconomicData()
  if (!data || !data.usdCny) return []
  return data.usdCny.map(item => ({ date: item.date, value: item.value }))
}