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

// 缓存数据
let cachedData: ChinaEconomicData | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

/**
 * 获取经济数据 Gist ID
 * 优先级: localStorage > 环境变量 > 硬编码后备
 */
function getEconomicGistId(): string {
  // 1. 优先使用 localStorage 中的配置
  const localStorageId = localStorage.getItem('economicGistId')
  if (localStorageId) {
    return localStorageId
  }
  
  // 2. 使用环境变量
  const envGistId = import.meta.env.VITE_GIST_ID
  if (envGistId) {
    return envGistId
  }
  
  // 3. 硬编码后备 - 确保在任何环境下都能工作
  return 'cdd0e8f0991321350c731d718ba807b5'
}

/**
 * 从 Gist 获取中国经济数据
 */
export async function fetchChinaEconomicData(): Promise<ChinaEconomicData | null> {
  // 检查缓存
  const now = Date.now()
  if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedData
  }

  try {
    const economicGistId = getEconomicGistId()

    const gistUrl = `https://api.github.com/gists/${economicGistId}`
    
    const response = await fetch(gistUrl)
    if (!response.ok) {
      console.error('❌ Gist API 请求失败:', response.status, response.statusText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const gist = await response.json()
    
    // 查找经济数据文件
    const possibleFileNames = [
      'economic-data.json',        // 主要的经济数据文件
      'china-economic-data.json',  // 中国专用数据文件
      'us-economic-data.json'      // 美国专用数据文件
    ]
    
    let dataFile = null
    
    for (const name of possibleFileNames) {
      if (gist.files[name]) {
        dataFile = gist.files[name]
        break
      }
    }
    
    if (!dataFile) {
      console.warn('❌ Gist 中未找到经济数据文件')
      return null
    }

    const rawData = JSON.parse(dataFile.content)
    
    // 检查是否有 chinaEconomicData 字段
    const chinaData = rawData.chinaEconomicData || rawData
    
    if (!chinaData || !chinaData.data) {
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
      return null
    }
    
    // 缓存数据
    cachedData = data
    cacheTimestamp = now
    
    return data
  } catch (error) {
    console.error('❌ 获取中国经济数据失败:', error)
    return null
  }
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