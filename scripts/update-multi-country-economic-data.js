/**
 * GitHub Actions 脚本：获取多国经济数据并更新到 Gist
 * 支持国家：美国(US)、中国(CN)、欧盟(EU)、日本(JP)等
 * 
 * 数据源：
 * - 美国：FRED API (免费)
 * - 中国：需要 AkShare 或其他数据源
 * - 欧盟：ECB API
 * - 日本：e-Stat API
 * - 全球：World Bank API
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载本地环境变量 (仅用于本地测试)
function loadLocalEnv() {
  try {
    const envPath = join(__dirname, '..', '.env.local')
    const envContent = readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      line = line.trim()
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        const value = valueParts.join('=')
        if (key && value && !process.env[key]) {
          process.env[key] = value
        }
      }
    })
    console.log('✓ Loaded local environment variables from .env.local')
  } catch (error) {
    // .env.local 文件不存在或无法读取，使用系统环境变量
    console.log('ℹ Using system environment variables (no .env.local found)')
  }
}

// 在GitHub Actions环境中不加载.env.local
if (!process.env.GITHUB_ACTIONS) {
  loadLocalEnv()
}

// 导入 fetch (Node.js 18+ 内置)
// 如果需要兼容旧版本，可以使用: import fetch from 'node-fetch'

// 获取环境变量
const FRED_API_KEY = process.env.FRED_API_KEY?.trim()
const GIST_TOKEN = process.env.GIST_TOKEN?.trim()
const GIST_ID = process.env.GIST_ID?.trim()
const ENABLED_COUNTRIES = (process.env.ENABLED_COUNTRIES || 'US').split(',').map(c => c.trim())

// API 基础 URL
const FRED_API_BASE = 'https://api.stlouisfed.org/fred'
const WORLD_BANK_API_BASE = 'https://api.worldbank.org/v2'

// 国家配置
const COUNTRY_CONFIG = {
  US: {
    name: '美国',
    currency: 'USD',
    dataSources: ['FRED'],
    series: {
      interestRate: 'FEDFUNDS',
      inflation: 'CPIAUCSL',
      unemployment: 'UNRATE'
    }
  },
  CN: {
    name: '中国',
    currency: 'CNY',
    dataSources: ['WorldBank'],
    series: {
      interestRate: 'FR.INR.RINR',  // 实际利率
      inflation: 'FP.CPI.TOTL.ZG',
      unemployment: 'SL.UEM.TOTL.ZS'
    }
  },
  EU: {
    name: '欧盟',
    currency: 'EUR',
    dataSources: ['WorldBank'],
    series: {
      interestRate: 'FR.INR.RINR',  // 实际利率
      inflation: 'FP.CPI.TOTL.ZG',
      unemployment: 'SL.UEM.TOTL.ZS'
    }
  },
  JP: {
    name: '日本',
    currency: 'JPY',
    dataSources: ['WorldBank'],
    series: {
      interestRate: 'FR.INR.RINR',  // 实际利率
      inflation: 'FP.CPI.TOTL.ZG',
      unemployment: 'SL.UEM.TOTL.ZS'
    }
  }
}

// 获取 FRED 数据（美国）
async function fetchFredData(seriesId, countryCode) {
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 3)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    const url = `${FRED_API_BASE}/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&observation_start=${startDateStr}&observation_end=${endDateStr}`
    
    console.log(`Fetching FRED data for ${countryCode}: ${seriesId}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.error_code) {
      throw new Error(`FRED API error: ${data.error_message}`)
    }
    
    if (!data.observations || data.observations.length === 0) {
      throw new Error('No observations received')
    }
    
    return processObservations(data.observations, seriesId)
  } catch (error) {
    console.error(`Error fetching FRED data for ${countryCode}:`, error.message)
    return []
  }
}

// 获取世界银行数据
async function fetchWorldBankData(indicator, countryCode) {
  try {
    const currentYear = new Date().getFullYear()
    const startYear = currentYear - 5
    
    const url = `${WORLD_BANK_API_BASE}/country/${countryCode.toLowerCase()}/indicator/${indicator}?date=${startYear}:${currentYear}&format=json&per_page=100`
    
    console.log(`Fetching World Bank data for ${countryCode}: ${indicator}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`World Bank API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error('Invalid World Bank API response')
    }
    
    const observations = data[1] // 第二个元素是数据数组
    
    if (!observations || observations.length === 0) {
      console.warn(`No World Bank data available for ${countryCode}: ${indicator}`)
      return []
    }
    
    return observations
      .filter(obs => obs.value !== null)
      .map(obs => ({
        date: `${obs.date}-12`, // 年度数据，设为12月
        value: parseFloat(obs.value)
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-36) // 最多保留36个月
  } catch (error) {
    console.error(`Error fetching World Bank data for ${countryCode}:`, error.message)
    return []
  }
}

// 处理观测数据
function processObservations(observations, seriesId) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  const processed = observations
    .filter(obs => {
      if (obs.value === '.' || obs.value === null) return false
      
      const obsDate = new Date(obs.date)
      const obsYear = obsDate.getFullYear()
      const obsMonth = obsDate.getMonth() + 1
      
      if (obsYear > currentYear) return false
      if (obsYear === currentYear && obsMonth > currentMonth) return false
      
      return true
    })
    .map(obs => ({
      date: obs.date.substring(0, 7),
      value: parseFloat(obs.value)
    }))
  
  // 去重，取每月最后一个值
  const monthlyData = {}
  processed.forEach(item => {
    monthlyData[item.date] = item.value
  })
  
  const sortedData = Object.entries(monthlyData)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
  
  // CPI 数据计算同比通胀率
  if (seriesId === 'CPIAUCSL') {
    const inflationRates = []
    
    for (let i = 12; i < sortedData.length; i++) {
      const current = sortedData[i]
      const yearAgo = sortedData[i - 12]
      
      const inflationRate = ((current.value - yearAgo.value) / yearAgo.value) * 100
      
      inflationRates.push({
        date: current.date,
        value: parseFloat(inflationRate.toFixed(2))
      })
    }
    
    return inflationRates.slice(-36)
  }
  
  return sortedData.slice(-36)
}

// 获取单个国家的数据
async function fetchCountryData(countryCode) {
  const config = COUNTRY_CONFIG[countryCode]
  if (!config) {
    console.warn(`Unsupported country: ${countryCode}`)
    return null
  }
  
  console.log(`\nFetching data for ${config.name} (${countryCode})...`)
  
  const countryData = {
    country: countryCode,
    name: config.name,
    currency: config.currency,
    interestRate: [],
    inflation: [],
    unemployment: [],
    lastUpdate: new Date().toISOString()
  }
  
  try {
    if (countryCode === 'US' && FRED_API_KEY) {
      // 美国使用 FRED API
      const [interestRate, inflation, unemployment] = await Promise.all([
        fetchFredData(config.series.interestRate, countryCode),
        fetchFredData(config.series.inflation, countryCode),
        fetchFredData(config.series.unemployment, countryCode)
      ])
      
      countryData.interestRate = interestRate
      countryData.inflation = inflation
      countryData.unemployment = unemployment
    } else {
      // 其他国家使用世界银行 API
      const [interestRate, inflation, unemployment] = await Promise.all([
        fetchWorldBankData(config.series.interestRate, countryCode),
        fetchWorldBankData(config.series.inflation, countryCode),
        fetchWorldBankData(config.series.unemployment, countryCode)
      ])
      
      countryData.interestRate = interestRate
      countryData.inflation = inflation
      countryData.unemployment = unemployment
    }
    
    console.log(`✓ ${config.name} data fetched:`)
    console.log(`  - Interest Rate: ${countryData.interestRate.length} points`)
    console.log(`  - Inflation: ${countryData.inflation.length} points`)
    console.log(`  - Unemployment: ${countryData.unemployment.length} points`)
    
    return countryData
  } catch (error) {
    console.error(`Error fetching data for ${config.name}:`, error.message)
    return countryData // 返回空数据结构
  }
}

// 更新 Gist
async function updateGist(allCountriesData) {
  if (!GIST_TOKEN || !GIST_ID) {
    console.error('Missing GIST_TOKEN or GIST_ID')
    return false
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GIST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'multi-country-economic-data.json': {
            content: JSON.stringify({
              lastUpdate: new Date().toISOString(),
              countries: ENABLED_COUNTRIES,
              data: allCountriesData
            }, null, 2)
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`)
    }

    console.log('✓ Gist updated successfully')
    return true
  } catch (error) {
    console.error('Error updating Gist:', error.message)
    return false
  }
}

// 主函数
async function main() {
  console.log('='.repeat(60))
  console.log('Starting Multi-Country Economic Data Update')
  console.log(`Time: ${new Date().toISOString()}`)
  console.log(`Countries: ${ENABLED_COUNTRIES.join(', ')}`)
  console.log('='.repeat(60))

  // 检查环境变量
  if (!GIST_TOKEN || !GIST_ID) {
    console.error('✗ GIST_TOKEN and GIST_ID are required')
    process.exit(1)
  }

  if (ENABLED_COUNTRIES.includes('US') && !FRED_API_KEY) {
    console.warn('⚠️ Warning: FRED_API_KEY not provided, US data will be limited')
  }

  // 获取所有国家数据
  const allCountriesData = {}
  
  for (const countryCode of ENABLED_COUNTRIES) {
    const countryData = await fetchCountryData(countryCode)
    if (countryData) {
      allCountriesData[countryCode] = countryData
    }
  }

  // 检查是否有数据
  const hasData = Object.keys(allCountriesData).length > 0
  if (!hasData) {
    console.error('✗ Failed to fetch data for any country')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
  console.log('Data Summary:')
  Object.entries(allCountriesData).forEach(([code, data]) => {
    console.log(`${data.name} (${code}):`)
    console.log(`  - Interest Rate: ${data.interestRate.length} points`)
    console.log(`  - Inflation: ${data.inflation.length} points`)
    console.log(`  - Unemployment: ${data.unemployment.length} points`)
  })

  // 更新 Gist
  console.log('\nUpdating GitHub Gist...')
  const success = await updateGist(allCountriesData)

  if (success) {
    console.log('\n' + '='.repeat(60))
    console.log('✓ Multi-country economic data updated successfully!')
    console.log(`Updated countries: ${Object.keys(allCountriesData).join(', ')}`)
    console.log('='.repeat(60))
    process.exit(0)
  } else {
    console.error('\n✗ Failed to update Gist')
    process.exit(1)
  }
}

// 运行主函数
main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})