/**
 * 经济数据集成
 * 支持多国经济数据
 * 数据存储在项目的 GitHub Gist 同步功能中
 * 
 * 数据格式：
 * - v1.0: 仅美国数据 { fedRate, inflation, unemployment }
 * - v2.0: 多国数据 { countries: { US: {...}, CN: {...} } }
 */

export interface EconomicDataPoint {
  date: string
  value: number
  source?: string
  cpiIndex?: number  // 原始 CPI 指数值（如果有）
}

export interface FedRateData {
  date: string
  rate: number
  change: number
  type: 'actual' | 'forecast'
  event?: string
}

export interface IndicatorData {
  name: string
  unit: string
  source: string
  seriesId?: string
  data: EconomicDataPoint[]
}

export interface CountryData {
  name: string
  currency: string
  lastUpdate: string
  data: {
    interestRate?: IndicatorData
    inflation?: IndicatorData
    unemployment?: IndicatorData
    gdp?: IndicatorData
  }
}

export interface MultiCountryEconomicData {
  lastUpdate: string
  version: string
  countries: {
    [countryCode: string]: CountryData
  }
  cryptoMarket: {
    lastUpdate: string
    data: Array<{
      date: string
      btc: number
      eth: number
      total: number
    }>
  }
}

// 向后兼容的旧格式
export interface LegacyEconomicData {
  lastUpdate: string
  data: {
    fedRate: EconomicDataPoint[]
    inflation: EconomicDataPoint[]
    unemployment: EconomicDataPoint[]
    cryptoMarket?: {
      lastUpdate: string
      data: Array<{
        date: string
        btc: number
        eth: number
        total: number
      }>
    }
  }
}

/**
 * 解析经济数据，支持新旧格式
 */
function parseEconomicData(rawData: any): {
  isMultiCountry: boolean
  countries: { [key: string]: CountryData }
  cryptoMarket: any
} {
  // 检测数据版本
  if (rawData.version === '2.0' || rawData.countries) {
    // 新格式：多国数据
    return {
      isMultiCountry: true,
      countries: rawData.countries || {},
      cryptoMarket: rawData.cryptoMarket
    }
  } else {
    // 旧格式：仅美国数据，转换为新格式
    const usData: CountryData = {
      name: 'United States',
      currency: 'USD',
      lastUpdate: rawData.lastUpdate || new Date().toISOString(),
      data: {}
    }
    
    if (rawData.fedRate) {
      usData.data.interestRate = {
        name: 'Federal Funds Rate',
        unit: '%',
        source: 'FRED',
        data: rawData.fedRate
      }
    }
    
    if (rawData.inflation) {
      usData.data.inflation = {
        name: 'CPI Inflation Rate',
        unit: '%',
        source: 'FRED',
        data: rawData.inflation
      }
    }
    
    if (rawData.unemployment) {
      usData.data.unemployment = {
        name: 'Unemployment Rate',
        unit: '%',
        source: 'FRED',
        data: rawData.unemployment
      }
    }
    
    return {
      isMultiCountry: false,
      countries: { US: usData },
      cryptoMarket: rawData.cryptoMarket
    }
  }
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
const PROJECT_GIST_CONFIG_KEY = 'web3tracker-gist-config'
// 经济数据专用 Gist 配置键
const ECONOMIC_GIST_CONFIG_KEY = 'web3tracker-economic-gist-config'

interface ProjectGistConfig {
  token: string
  gistId: string | null
}

interface EconomicGistConfig {
  token: string
  gistId: string | null
  useProjectGist: boolean  // 是否使用项目 Gist
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
 * 保存经济数据专用 Gist 配置
 */
export function saveEconomicGistConfig(config: EconomicGistConfig) {
  localStorage.setItem(ECONOMIC_GIST_CONFIG_KEY, JSON.stringify(config))
}

/**
 * 获取当前使用的 Gist 配置（优先使用经济数据专用配置）
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
 * 从 Gist 获取经济数据
 * 支持使用专用的经济数据 Gist 或项目 Gist
 */
async function fetchFromGist() {
  const config = getCurrentGistConfig()
  
  // 如果未配置任何 Gist，直接返回 null
  if (!config) {
    console.log('📊 No Gist configured for economic data')
    return null
  }
  
  try {
    const url = `https://api.github.com/gists/${config.gistId}`
    console.log('📊 Fetching economic data from Gist:', config.gistId.substring(0, 8) + '...')
    
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
    
    let fileContent: string | null = null
    let economicData: any = null
    
    if (isEconomicGist) {
      // 经济数据专用 Gist，直接读取 economic-data.json
      fileContent = gistData.files['economic-data.json']?.content
      if (fileContent) {
        const data = JSON.parse(fileContent)
        // GitHub Actions 脚本的数据格式：{ lastUpdate, data: { fedRate, inflation, unemployment } }
        if (data.data) {
          economicData = data.data
          console.log('📊 Using dedicated economic data Gist (GitHub Actions format)')
        } else {
          // 直接格式：{ lastUpdate, fedRate, inflation, unemployment, cryptoMarket }
          economicData = data
          console.log('📊 Using dedicated economic data Gist (direct format)')
        }
      }
    } else {
      // 项目 Gist，读取 web3tracker-data.json 中的 economicData 字段
      fileContent = gistData.files['web3tracker-data.json']?.content
      if (fileContent) {
        const data = JSON.parse(fileContent)
        economicData = data.economicData?.data
        console.log('📊 Using project Gist economic data')
      }
    }
    
    if (!economicData) {
      console.log('📊 No economic data found in Gist')
      return null
    }
    
    // 检查数据是否过期（超过7天）
    if (economicData.lastUpdate || (isEconomicGist && economicData.cryptoMarket?.lastUpdate)) {
      const lastUpdate = new Date(economicData.lastUpdate || economicData.cryptoMarket?.lastUpdate)
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceUpdate > 7) {
        console.warn(`⚠️ Economic data is ${Math.floor(daysSinceUpdate)} days old`)
      } else {
        console.log(`✅ Using economic data from Gist (updated ${Math.floor(daysSinceUpdate)} days ago)`)
      }
    }
    
    return economicData
  } catch (error) {
    console.error('❌ Error fetching economic data from Gist:', error)
    return null
  }
}

/**
 * 获取美联储利率数据
 */
export async function getFedRateData(): Promise<FedRateData[]> {
  try {
    const gistData = await fetchFromGist()
    
    if (gistData?.fedRate && gistData.fedRate.length > 0) {
      return processFedRateFromGist(gistData.fedRate)
    }
    
    console.log('⚠️ No Fed rate data available from Gist')
    return []
  } catch (error) {
    console.error('Error fetching Fed rate data:', error)
    return []
  }
}

/**
 * 获取通胀率数据
 * 注意：如果 Gist 中存储的是 CPI 指数值（>100），会自动计算通胀率
 */
export async function getInflationData(): Promise<EconomicDataPoint[]> {
  try {
    const gistData = await fetchFromGist()
    
    if (gistData?.inflation && gistData.inflation.length > 0) {
      const rawData = gistData.inflation.map((item: any) => ({
        date: item.date,
        value: item.value,
        source: 'FRED'
      }))
      
      // 检查数据是否是 CPI 指数值（通常 > 100）还是通胀率（通常 < 20）
      const firstValue = rawData[0].value
      
      if (firstValue > 100) {
        // 数据是 CPI 指数，需要计算通胀率
        console.warn('⚠️ Gist contains CPI index values, calculating inflation rates...')
        return calculateInflationRatesFromCPI(rawData)
      }
      
      // 数据已经是通胀率
      console.log('✅ Using inflation rate data from Gist')
      return rawData
    }
    
    console.log('⚠️ No inflation data available from Gist')
    return []
  } catch (error) {
    console.error('Error fetching inflation data:', error)
    return []
  }
}

/**
 * 从 CPI 指数计算通胀率（Year-over-Year）
 */
function calculateInflationRatesFromCPI(cpiData: EconomicDataPoint[]): EconomicDataPoint[] {
  const inflationRates: EconomicDataPoint[] = []
  
  // 需要至少 13 个月的数据
  for (let i = 12; i < cpiData.length; i++) {
    const current = cpiData[i]
    const yearAgo = cpiData[i - 12]
    
    // 计算同比通胀率
    const inflationRate = ((current.value - yearAgo.value) / yearAgo.value) * 100
    
    inflationRates.push({
      date: current.date,
      value: parseFloat(inflationRate.toFixed(2)),
      source: current.source,
      cpiIndex: current.value  // 保留原始 CPI 指数
    })
  }
  
  console.log(`📊 Calculated ${inflationRates.length} inflation rate data points from CPI index`)
  return inflationRates
}

/**
 * 获取失业率数据
 */
export async function getUnemploymentData(): Promise<EconomicDataPoint[]> {
  try {
    const gistData = await fetchFromGist()
    
    if (gistData?.unemployment && gistData.unemployment.length > 0) {
      return gistData.unemployment.map((item: any) => ({
        date: item.date,
        value: item.value,
        source: 'FRED'
      }))
    }
    
    console.log('⚠️ No unemployment data available from Gist')
    return []
  } catch (error) {
    console.error('Error fetching unemployment data:', error)
    return []
  }
}

/**
 * 处理 Gist 中的联邦基金利率数据
 */
function processFedRateFromGist(data: any[]): FedRateData[] {
  const result: FedRateData[] = []
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    const rate = item.value
    const prevRate = i > 0 ? data[i - 1].value : rate
    const change = parseFloat((rate - prevRate).toFixed(2))
    
    result.push({
      date: item.date,
      rate,
      change,
      type: 'actual'
    })
  }
  
  return result
}

/**
 * 获取加密货币市场数据
 */
export async function getCryptoMarketData() {
  try {
    // 1. 先尝试从 Gist 读取缓存数据
    const gistData = await fetchFromGist()
    
    if (gistData?.cryptoMarket) {
      const { data, lastUpdate } = gistData.cryptoMarket
      const cacheAge = Date.now() - new Date(lastUpdate).getTime()
      const oneHour = 60 * 60 * 1000
      
      // 如果缓存未过期（1小时内），直接使用
      if (cacheAge < oneHour && data && data.length > 0) {
        console.log(`✅ Using cached crypto data (${Math.floor(cacheAge / 1000 / 60)} minutes old)`)
        return data
      }
      
      console.log(`⏰ Cache expired (${Math.floor(cacheAge / 1000 / 60)} minutes old), fetching new data...`)
    }
    
    // 2. 缓存过期或不存在，调用 CoinGecko API
    console.log('🔄 Fetching crypto market data from CoinGecko...')
    
    const timestamp = Date.now()
    const globalResponse = await fetch(
      `https://api.coingecko.com/api/v3/global?t=${timestamp}`,
      {
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-cache'
      }
    )
    
    if (!globalResponse.ok) {
      console.warn(`❌ CoinGecko API request failed: ${globalResponse.status}`)
      // 如果有旧缓存，即使过期也使用
      if (gistData?.cryptoMarket?.data) {
        console.warn('Using expired cache data')
        return gistData.cryptoMarket.data
      }
      return getBackupCryptoData()
    }
    
    const globalData = await globalResponse.json()
    
    // 验证数据结构
    if (!globalData.data || !globalData.data.total_market_cap || !globalData.data.market_cap_percentage) {
      console.warn('❌ Invalid API response structure')
      if (gistData?.cryptoMarket?.data) {
        return gistData.cryptoMarket.data
      }
      return getBackupCryptoData()
    }
    
    // 获取当前市值数据
    const totalMarketCap = globalData.data.total_market_cap.usd / 1e12
    const btcMarketCap = globalData.data.market_cap_percentage.btc * totalMarketCap / 100
    const ethMarketCap = globalData.data.market_cap_percentage.eth * totalMarketCap / 100
    
    console.log('✅ CoinGecko API data fetched successfully:', {
      total: `${totalMarketCap.toFixed(2)}T`,
      btc: `${btcMarketCap.toFixed(2)}T`,
      eth: `${ethMarketCap.toFixed(2)}T`
    })
    
    // 获取历史数据
    const backupData = getBackupCryptoData()
    const now = new Date()
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    // 过滤掉当前月份及之后的备份数据
    const filteredBackupData = backupData.filter(d => d.date < currentDate)
    
    // 添加实时数据
    const newData = [
      ...filteredBackupData,
      {
        date: currentDate,
        btc: parseFloat(btcMarketCap.toFixed(2)),
        eth: parseFloat(ethMarketCap.toFixed(2)),
        total: parseFloat(totalMarketCap.toFixed(2))
      }
    ]
    
    console.log('📊 Latest data point:', newData[newData.length - 1])
    
    // 3. 保存到 Gist（异步，不阻塞返回）
    saveCryptoMarketDataToGist(newData).catch(err => {
      console.error('Failed to save crypto data to Gist:', err)
    })
    
    return newData
  } catch (error) {
    console.error('❌ Error fetching crypto market data:', error)
    
    // 尝试使用 Gist 缓存
    const gistData = await fetchFromGist()
    if (gistData?.cryptoMarket?.data) {
      console.warn('Using cached data due to error')
      return gistData.cryptoMarket.data
    }
    
    return getBackupCryptoData()
  }
}

function getBackupCryptoData() {
  // 历史真实数据（仅作为备份，优先使用 CoinGecko API 实时数据）
  // 数据来源：CoinGecko 历史数据
  // 最后更新：2024年12月
  return [
    { date: '2020-03', btc: 0.12, eth: 0.02, total: 0.18 },
    { date: '2020-12', btc: 0.54, eth: 0.08, total: 0.78 },
    { date: '2021-05', btc: 1.08, eth: 0.45, total: 2.20 },
    { date: '2021-11', btc: 1.28, eth: 0.56, total: 2.98 },
    { date: '2022-06', btc: 0.38, eth: 0.14, total: 0.92 },
    { date: '2022-12', btc: 0.32, eth: 0.15, total: 0.82 },
    { date: '2023-06', btc: 0.58, eth: 0.22, total: 1.12 },
    { date: '2023-12', btc: 0.85, eth: 0.28, total: 1.68 },
    { date: '2024-03', btc: 1.35, eth: 0.42, total: 2.58 },
    { date: '2024-06', btc: 1.25, eth: 0.38, total: 2.35 },
    { date: '2024-09', btc: 1.18, eth: 0.32, total: 2.15 },
    { date: '2024-12', btc: 1.95, eth: 0.45, total: 3.52 },
    // 最新数据从 CoinGecko API 实时获取
    // 如果 API 失败，则显示最后已知的历史数据（2024-12）
  ]
}

// Gist 配置管理已移至上方，使用独立的配置键

export const DATA_SOURCES = {
  fred: {
    name: 'FRED (Federal Reserve Economic Data)',
    url: 'https://fred.stlouisfed.org',
    description: '美联储官方经济数据库，通过 GitHub Actions 自动更新',
    needsApiKey: false,
    free: true,
    lastUpdate: '每天自动更新',
    setupUrl: 'https://github.com/your-repo#setup',
  },
  gist: {
    name: 'GitHub Gist',
    url: 'https://gist.github.com',
    description: '使用项目 Gist 同步功能存储经济数据（右上角同步按钮）',
    needsApiKey: false,
    free: true,
    lastUpdate: '实时',
  },
  coingecko: {
    name: 'CoinGecko',
    url: 'https://www.coingecko.com',
    description: '加密货币市场数据（实时API，1小时缓存）',
    needsApiKey: false,
    free: true,
    lastUpdate: '实时',
  }
}

/**
 * 检查是否已配置经济数据 Gist（项目 Gist 或专用 Gist）
 */
export function hasProjectGist(): boolean {
  return !!getCurrentGistConfig()
}

/**
 * 检查是否使用专用的经济数据 Gist
 */
export function hasEconomicGist(): boolean {
  const economicConfig = getEconomicGistConfig()
  return !!(economicConfig && economicConfig.token && economicConfig.gistId && !economicConfig.useProjectGist)
}


/**
 * 创建经济数据专用 Gist
 */
export async function createEconomicGist(token: string): Promise<string> {
  const initialData = {
    lastUpdate: new Date().toISOString(),
    cryptoMarket: {
      lastUpdate: new Date().toISOString(),
      data: getBackupCryptoData()
    },
    fedRate: [],
    inflation: [],
    unemployment: []
  }

  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Web3 Tracker Economic Data',
      public: false,
      files: {
        'economic-data.json': {
          content: JSON.stringify(initialData, null, 2),
        },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create economic gist: ${response.status}`)
  }

  const gist = await response.json()
  return gist.id
}

/**
 * 验证 Token 并创建经济数据 Gist（如果需要）
 */
export async function validateAndSetupEconomicGist(token: string, gistId?: string): Promise<{ success: boolean; gistId?: string; error?: string }> {
  try {
    // 验证 Token
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (!userResponse.ok) {
      return { success: false, error: 'GitHub Token 无效' }
    }

    // 如果提供了 Gist ID，验证是否存在
    if (gistId) {
      const gistResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!gistResponse.ok) {
        return { success: false, error: 'Gist ID 无效或无权限访问' }
      }
      
      return { success: true, gistId }
    }

    // 没有提供 Gist ID，创建新的
    const newGistId = await createEconomicGist(token)
    return { success: true, gistId: newGistId }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '未知错误' }
  }
}

/**
 * 保存加密货币市场数据到 Gist
 * 根据配置保存到项目 Gist 或经济数据专用 Gist
 */
async function saveCryptoMarketDataToGist(data: any[]) {
  const config = getCurrentGistConfig()
  if (!config) {
    console.warn('⚠️ No Gist configured, cannot save crypto data')
    return
  }
  
  const economicConfig = getEconomicGistConfig()
  const isEconomicGist = economicConfig && !economicConfig.useProjectGist && economicConfig.gistId === config.gistId
  
  try {
    console.log('💾 Saving crypto market data to Gist...', config.gistId.substring(0, 8) + '...')
    
    const gistUrl = `https://api.github.com/gists/${config.gistId}`
    const getResponse = await fetch(gistUrl, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!getResponse.ok) {
      throw new Error(`Failed to read Gist: ${getResponse.status}`)
    }
    
    const gistData = await getResponse.json()
    let fileContent: any = {}
    let fileName: string
    
    if (isEconomicGist) {
      // 经济数据专用 Gist
      fileName = 'economic-data.json'
      const existingContent = gistData.files[fileName]?.content
      if (existingContent) {
        try {
          fileContent = JSON.parse(existingContent)
        } catch (e) {
          console.warn('Failed to parse existing economic data')
        }
      }
      
      // 直接更新加密货币市值数据
      fileContent.cryptoMarket = {
        lastUpdate: new Date().toISOString(),
        data
      }
      fileContent.lastUpdate = new Date().toISOString()
    } else {
      // 项目 Gist
      fileName = 'web3tracker-data.json'
      const existingContent = gistData.files[fileName]?.content
      if (existingContent) {
        try {
          fileContent = JSON.parse(existingContent)
        } catch (e) {
          console.warn('Failed to parse existing project data')
        }
      }
      
      // 初始化 economicData 字段
      if (!fileContent.economicData) {
        fileContent.economicData = {
          lastUpdate: new Date().toISOString(),
          data: {}
        }
      }
      
      // 更新加密货币市值数据
      fileContent.economicData.data.cryptoMarket = {
        lastUpdate: new Date().toISOString(),
        data
      }
      
      // 更新整体的 lastUpdate
      fileContent.economicData.lastUpdate = new Date().toISOString()
    }
    
    const updateResponse = await fetch(gistUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [fileName]: {
            content: JSON.stringify(fileContent, null, 2)
          }
        }
      })
    })
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update Gist: ${updateResponse.status}`)
    }
    
    console.log('✅ Crypto market data saved to Gist successfully')
  } catch (error) {
    console.error('❌ Error saving crypto data to Gist:', error)
    throw error
  }
}
