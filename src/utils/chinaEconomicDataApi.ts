/**
 * 中国经济数据API
 * 从GitHub Actions生成的Gist中获取中国经济数据
 */

export interface ChinaEconomicDataPoint {
  date: string
  value: number
}

export interface ChinaEconomicData {
  lastUpdate: string
  country: string
  name: string
  currency: string
  data: {
    m2MoneySupply: ChinaEconomicDataPoint[]      // M2货币供应量
    dr007Rate: ChinaEconomicDataPoint[]          // DR007利率
    reverseRepoRate: ChinaEconomicDataPoint[]    // 逆回购利率
    usdCnyRate: ChinaEconomicDataPoint[]         // USD/CNY汇率
    socialFinancing: ChinaEconomicDataPoint[]    // 社会融资规模
  }
  indicators: {
    [key: string]: {
      name: string
      unit: string
      description: string
    }
  }
}

// 经济数据专用 Gist 配置键
const ECONOMIC_GIST_CONFIG_KEY = 'web3tracker-economic-gist-config'
const PROJECT_GIST_CONFIG_KEY = 'web3tracker-gist-config'

interface EconomicGistConfig {
  token: string
  gistId: string | null
  useProjectGist: boolean
}

interface ProjectGistConfig {
  token: string
  gistId: string | null
}

/**
 * 获取项目 Gist 配置
 */
function getProjectGistConfig(): ProjectGistConfig | null {
  const stored = localStorage.getItem(PROJECT_GIST_CONFIG_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * 获取经济数据专用 Gist 配置
 */
function getEconomicGistConfig(): EconomicGistConfig | null {
  const stored = localStorage.getItem(ECONOMIC_GIST_CONFIG_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * 获取当前使用的 Gist 配置
 */
function getCurrentGistConfig(): { token: string; gistId: string } | null {
  // 1. 先检查经济数据专用配置
  const economicConfig = getEconomicGistConfig()
  if (economicConfig && economicConfig.token && economicConfig.gistId && !economicConfig.useProjectGist) {
    return {
      token: economicConfig.token,
      gistId: economicConfig.gistId
    }
  }
  
  // 2. 使用项目 Gist 配置
  const projectConfig = getProjectGistConfig()
  if (projectConfig && projectConfig.token && projectConfig.gistId) {
    return {
      token: projectConfig.token,
      gistId: projectConfig.gistId
    }
  }
  
  return null
}

/**
 * 从Gist获取中国经济数据
 */
export async function fetchChinaEconomicData(): Promise<ChinaEconomicData | null> {
  const config = getCurrentGistConfig()
  
  if (!config) {
    console.log('📊 No Gist configured for China economic data')
    return null
  }
  
  try {
    const url = `https://api.github.com/gists/${config.gistId}`
    console.log('📊 Fetching China economic data from Gist:', config.gistId.substring(0, 8) + '...')
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      cache: 'no-cache'
    })
    
    if (!response.ok) {
      throw new Error(`Gist fetch failed: ${response.status}`)
    }
    
    const gistData = await response.json()
    
    // 检查是否是经济数据专用 Gist
    const economicConfig = getEconomicGistConfig()
    const isEconomicGist = economicConfig && !economicConfig.useProjectGist && economicConfig.gistId === config.gistId
    
    let chinaData: any = null
    
    if (isEconomicGist) {
      // 经济数据专用 Gist，查找中国数据
      const economicFile = gistData.files['economic-data.json']?.content
      if (economicFile) {
        const data = JSON.parse(economicFile)
        chinaData = data.chinaEconomicData
        console.log('📊 Using China economic data from dedicated Gist')
      }
    } else {
      // 项目 Gist，读取 web3tracker-data.json 中的中国数据
      const fileContent = gistData.files['web3tracker-data.json']?.content
      if (fileContent) {
        const data = JSON.parse(fileContent)
        chinaData = data.chinaEconomicData
        console.log('📊 Using China economic data from project Gist')
      }
    }
    
    if (!chinaData) {
      console.log('📊 No China economic data found in Gist')
      return null
    }
    
    // 检查数据是否过期
    if (chinaData.lastUpdate) {
      const lastUpdate = new Date(chinaData.lastUpdate)
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceUpdate > 7) {
        console.warn(`⚠️ China economic data is ${Math.floor(daysSinceUpdate)} days old`)
      } else {
        console.log(`✅ Using China economic data (updated ${Math.floor(daysSinceUpdate)} days ago)`)
      }
    }
    
    return chinaData
  } catch (error) {
    console.error('❌ Error fetching China economic data from Gist:', error)
    return null
  }
}

/**
 * 获取M2货币供应量数据
 */
export async function getM2MoneySupplyData(): Promise<ChinaEconomicDataPoint[]> {
  try {
    const chinaData = await fetchChinaEconomicData()
    
    if (chinaData?.data?.m2MoneySupply && chinaData.data.m2MoneySupply.length > 0) {
      console.log('✅ Using M2 money supply data from Gist')
      return chinaData.data.m2MoneySupply
    }
    
    console.log('⚠️ No M2 money supply data available from Gist')
    return []
  } catch (error) {
    console.error('Error fetching M2 money supply data:', error)
    return []
  }
}

/**
 * 获取DR007利率数据
 */
export async function getDR007RateData(): Promise<ChinaEconomicDataPoint[]> {
  try {
    const chinaData = await fetchChinaEconomicData()
    
    if (chinaData?.data?.dr007Rate && chinaData.data.dr007Rate.length > 0) {
      console.log('✅ Using DR007 rate data from Gist')
      return chinaData.data.dr007Rate
    }
    
    console.log('⚠️ No DR007 rate data available from Gist')
    return []
  } catch (error) {
    console.error('Error fetching DR007 rate data:', error)
    return []
  }
}

/**
 * 获取社会融资规模数据
 */
export async function getSocialFinancingData(): Promise<ChinaEconomicDataPoint[]> {
  try {
    const chinaData = await fetchChinaEconomicData()
    
    if (chinaData?.data?.socialFinancing && chinaData.data.socialFinancing.length > 0) {
      console.log('✅ Using social financing data from Gist')
      return chinaData.data.socialFinancing
    }
    
    console.log('⚠️ No social financing data available from Gist')
    return []
  } catch (error) {
    console.error('Error fetching social financing data:', error)
    return []
  }
}

/**
 * 获取USD/CNY汇率数据
 */
export async function getUsdCnyRateData(): Promise<ChinaEconomicDataPoint[]> {
  try {
    const chinaData = await fetchChinaEconomicData()
    
    if (chinaData?.data?.usdCnyRate && chinaData.data.usdCnyRate.length > 0) {
      console.log('✅ Using USD/CNY rate data from Gist')
      return chinaData.data.usdCnyRate
    }
    
    console.log('⚠️ No USD/CNY rate data available from Gist')
    return []
  } catch (error) {
    console.error('Error fetching USD/CNY rate data:', error)
    return []
  }
}

/**
 * 检查是否有中国经济数据配置
 */
export function hasChinaDataConfig(): boolean {
  return !!getCurrentGistConfig()
}