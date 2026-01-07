/**
 * 经济数据集成
 * 优先从 GitHub Gist 读取 FRED 数据（由 GitHub Actions 自动更新）
 * 降级方案：使用本地备份数据
 * 数据更新时间：每天自动更新
 * 
 * 注意：复用项目的 GitHub Token 和 Gist 配置
 */

export interface EconomicDataPoint {
  date: string
  value: number
  source?: string
}

export interface FedRateData {
  date: string
  rate: number
  change: number
  type: 'actual' | 'forecast'
  event?: string
}

// 经济数据 Gist 配置键（独立于项目数据）
const ECONOMIC_GIST_CONFIG_KEY = 'web3tracker-economic-gist-config'

interface EconomicGistConfig {
  gistId: string
  username: string
}

/**
 * 获取经济数据 Gist 配置
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
 * 保存经济数据 Gist 配置
 */
export function saveEconomicGistConfig(username: string, gistId: string) {
  localStorage.setItem(ECONOMIC_GIST_CONFIG_KEY, JSON.stringify({ username, gistId }))
}

/**
 * 清除经济数据 Gist 配置
 */
export function clearEconomicGistConfig() {
  localStorage.removeItem(ECONOMIC_GIST_CONFIG_KEY)
}

/**
 * 获取经济数据 Gist 配置（用于 UI 显示）
 */
export function getEconomicGistConfigForUI() {
  return getEconomicGistConfig()
}

/**
 * 从 GitHub Gist 获取经济数据
 * 使用独立的 Gist（不同于项目数据的 Gist）
 */
async function fetchFromGist() {
  const config = getEconomicGistConfig()
  
  // 如果未配置经济数据 Gist，直接返回 null
  if (!config || !config.username || !config.gistId) {
    console.log('📊 Economic Gist not configured, using local data')
    return null
  }
  
  try {
    const url = `https://gist.githubusercontent.com/${config.username}/${config.gistId}/raw/economic-data.json`
    console.log('📊 Fetching economic data from Gist:', url)
    
    const response = await fetch(url, {
      cache: 'no-cache' // 确保获取最新数据
    })
    
    if (!response.ok) {
      throw new Error(`Gist fetch failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 检查数据是否过期（超过7天）
    if (data.lastUpdate) {
      const lastUpdate = new Date(data.lastUpdate)
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceUpdate > 7) {
        console.warn(`⚠️ Gist data is ${Math.floor(daysSinceUpdate)} days old`)
      } else {
        console.log(`✅ Using Gist data (updated ${Math.floor(daysSinceUpdate)} days ago)`)
      }
    }
    
    return data.data
  } catch (error) {
    console.error('❌ Error fetching from Gist:', error)
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
      source: current.source
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
    console.log('🔄 Fetching crypto market data from CoinGecko...')
    
    // 使用 CoinGecko Global API 获取市场总览
    const globalResponse = await fetch(
      'https://api.coingecko.com/api/v3/global',
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )
    
    if (!globalResponse.ok) {
      console.warn(`❌ CoinGecko API request failed: ${globalResponse.status} ${globalResponse.statusText}`)
      console.warn('Using backup data')
      return getBackupCryptoData()
    }
    
    const globalData = await globalResponse.json()
    console.log('📦 Raw API response:', globalData)
    
    // 验证数据结构
    if (!globalData.data || !globalData.data.total_market_cap || !globalData.data.market_cap_percentage) {
      console.warn('❌ Invalid API response structure:', globalData)
      console.warn('Using backup data')
      return getBackupCryptoData()
    }
    
    // 获取当前市值数据
    const totalMarketCap = globalData.data.total_market_cap.usd / 1e12 // 转换为万亿
    const btcMarketCap = globalData.data.market_cap_percentage.btc * totalMarketCap / 100
    const ethMarketCap = globalData.data.market_cap_percentage.eth * totalMarketCap / 100
    
    console.log('✅ CoinGecko API data fetched successfully:', {
      total: `$${totalMarketCap.toFixed(2)}T`,
      btc: `$${btcMarketCap.toFixed(2)}T (${globalData.data.market_cap_percentage.btc.toFixed(1)}%)`,
      eth: `$${ethMarketCap.toFixed(2)}T (${globalData.data.market_cap_percentage.eth.toFixed(1)}%)`
    })
    
    // 获取历史数据（使用备份数据作为历史）
    const backupData = getBackupCryptoData()
    
    // 移除2025-12的备份数据，使用实时数据替代
    const filteredBackupData = backupData.filter(d => d.date !== '2025-12')
    
    // 更新最后一个数据点为实时数据
    const now = new Date()
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    console.log(`📅 Current date: ${currentDate}`)
    
    // 添加实时数据
    filteredBackupData.push({
      date: currentDate,
      btc: parseFloat(btcMarketCap.toFixed(2)),
      eth: parseFloat(ethMarketCap.toFixed(2)),
      total: parseFloat(totalMarketCap.toFixed(2))
    })
    
    console.log('📊 Final data array length:', filteredBackupData.length)
    console.log('📊 Latest data point:', filteredBackupData[filteredBackupData.length - 1])
    
    return filteredBackupData
  } catch (error) {
    console.error('❌ Error fetching crypto market data:', error)
    console.warn('Using backup data')
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
    description: '数据存储服务，用于缓存 FRED 数据',
    needsApiKey: false,
    free: true,
    lastUpdate: '实时',
  },
  coingecko: {
    name: 'CoinGecko',
    url: 'https://www.coingecko.com',
    description: '加密货币市场数据（实时API）',
    needsApiKey: false,
    free: true,
    lastUpdate: '实时',
  }
}

// 测试经济数据 Gist 配置
export async function testEconomicGistConfig(username: string, gistId: string): Promise<boolean> {
  try {
    const url = `https://gist.githubusercontent.com/${username}/${gistId}/raw/economic-data.json`
    const response = await fetch(url)
    
    if (!response.ok) return false
    
    const data = await response.json()
    return !!(data.data && (data.data.fedRate || data.data.inflation || data.data.unemployment))
  } catch {
    return false
  }
}

/**
 * 从项目的 Gist 配置中获取 Token
 * 复用项目同步功能的 Token
 */
function getProjectGistToken(): string | null {
  const STORAGE_KEY = 'web3tracker-gist-config'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    const config = JSON.parse(stored)
    return config.token || null
  } catch {
    return null
  }
}

/**
 * 查找所有包含经济数据的 Gist
 * 使用项目的 Token 进行查询
 */
export async function findEconomicGists(): Promise<Array<{ id: string; updatedAt: string; description: string }>> {
  const token = getProjectGistToken()
  if (!token) {
    console.warn('⚠️ No project token found, cannot search for economic gists')
    return []
  }

  try {
    const response = await fetch('https://api.github.com/gists?per_page=100', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      console.error('❌ Failed to fetch gists:', response.status)
      return []
    }
    
    const gists = await response.json()
    const results: Array<{ id: string; updatedAt: string; description: string }> = []
    
    // 查找包含 economic-data.json 的 Gist
    for (const gist of gists) {
      if (gist.files && gist.files['economic-data.json']) {
        results.push({
          id: gist.id,
          updatedAt: gist.updated_at,
          description: gist.description || '经济数据存储'
        })
      }
    }
    
    console.log(`✅ Found ${results.length} economic data gists`)
    return results
  } catch (error) {
    console.error('❌ Error searching for economic gists:', error)
    return []
  }
}

/**
 * 检查项目 Token 是否已配置
 */
export function hasProjectToken(): boolean {
  return !!getProjectGistToken()
}