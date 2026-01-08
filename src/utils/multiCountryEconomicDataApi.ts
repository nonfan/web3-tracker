/**
 * 多国经济数据API
 * 从GitHub Actions生成的Gist中获取多国经济数据
 */

export interface CountryEconomicData {
  country: string
  name: string
  currency: string
  interestRate: Array<{ date: string; value: number }>
  inflation: Array<{ date: string; value: number }>
  unemployment: Array<{ date: string; value: number }>
  lastUpdate: string
}

export interface MultiCountryData {
  lastUpdate: string
  countries: string[]
  data: { [countryCode: string]: CountryEconomicData }
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
 * 从Gist获取多国经济数据
 */
export async function fetchMultiCountryEconomicData(): Promise<MultiCountryData | null> {
  const config = getCurrentGistConfig()
  
  if (!config) {
    console.log('📊 No Gist configured for multi-country economic data')
    return null
  }
  
  try {
    const url = `https://api.github.com/gists/${config.gistId}`
    console.log('📊 Fetching multi-country economic data from Gist:', config.gistId.substring(0, 8) + '...')
    
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
    
    let multiCountryData: any = null
    
    if (isEconomicGist) {
      // 经济数据专用 Gist，查找多国数据文件
      const multiCountryFile = gistData.files['multi-country-economic-data.json']?.content
      if (multiCountryFile) {
        const data = JSON.parse(multiCountryFile)
        multiCountryData = data
        console.log('📊 Using multi-country economic data from dedicated Gist')
      } else {
        // 尝试读取单国数据文件
        const singleCountryFile = gistData.files['economic-data.json']?.content
        if (singleCountryFile) {
          const data = JSON.parse(singleCountryFile)
          // 转换为多国格式
          multiCountryData = convertSingleToMultiCountry(data)
          console.log('📊 Converted single-country data to multi-country format')
        }
      }
    } else {
      // 项目 Gist，读取 web3tracker-data.json 中的多国数据
      const fileContent = gistData.files['web3tracker-data.json']?.content
      if (fileContent) {
        const data = JSON.parse(fileContent)
        multiCountryData = data.multiCountryEconomicData
        console.log('📊 Using multi-country economic data from project Gist')
      }
    }
    
    if (!multiCountryData) {
      console.log('📊 No multi-country economic data found in Gist')
      return null
    }
    
    // 检查数据是否过期
    if (multiCountryData.lastUpdate) {
      const lastUpdate = new Date(multiCountryData.lastUpdate)
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceUpdate > 7) {
        console.warn(`⚠️ Multi-country economic data is ${Math.floor(daysSinceUpdate)} days old`)
      } else {
        console.log(`✅ Using multi-country economic data (updated ${Math.floor(daysSinceUpdate)} days ago)`)
      }
    }
    
    return multiCountryData
  } catch (error) {
    console.error('❌ Error fetching multi-country economic data from Gist:', error)
    return null
  }
}

/**
 * 将单国数据转换为多国格式
 */
function convertSingleToMultiCountry(singleData: any): MultiCountryData {
  const usData: CountryEconomicData = {
    country: 'US',
    name: '美国',
    currency: 'USD',
    interestRate: singleData.data?.fedRate || singleData.fedRate || [],
    inflation: singleData.data?.inflation || singleData.inflation || [],
    unemployment: singleData.data?.unemployment || singleData.unemployment || [],
    lastUpdate: singleData.lastUpdate || new Date().toISOString()
  }
  
  return {
    lastUpdate: singleData.lastUpdate || new Date().toISOString(),
    countries: ['US'],
    data: {
      US: usData
    }
  }
}

/**
 * 获取指定国家的经济数据
 */
export async function getCountryEconomicData(countryCode: string): Promise<CountryEconomicData | null> {
  const multiCountryData = await fetchMultiCountryEconomicData()
  
  if (!multiCountryData || !multiCountryData.data[countryCode]) {
    console.log(`📊 No economic data available for country: ${countryCode}`)
    return null
  }
  
  return multiCountryData.data[countryCode]
}

/**
 * 获取所有可用国家的经济数据
 */
export async function getAllCountriesEconomicData(): Promise<MultiCountryData | null> {
  return await fetchMultiCountryEconomicData()
}

/**
 * 获取支持的国家列表
 */
export function getSupportedCountries(): Array<{
  code: string
  name: string
  currency: string
  flag: string
}> {
  return [
    { code: 'US', name: '美国', currency: 'USD', flag: '🇺🇸' },
    { code: 'CN', name: '中国', currency: 'CNY', flag: '🇨🇳' },
    { code: 'EU', name: '欧盟', currency: 'EUR', flag: '🇪🇺' },
    { code: 'JP', name: '日本', currency: 'JPY', flag: '🇯🇵' },
    { code: 'UK', name: '英国', currency: 'GBP', flag: '🇬🇧' },
    { code: 'CA', name: '加拿大', currency: 'CAD', flag: '🇨🇦' },
    { code: 'AU', name: '澳大利亚', currency: 'AUD', flag: '🇦🇺' },
    { code: 'DE', name: '德国', currency: 'EUR', flag: '🇩🇪' }
  ]
}

/**
 * 检查是否有多国经济数据配置
 */
export function hasMultiCountryDataConfig(): boolean {
  return !!getCurrentGistConfig()
}