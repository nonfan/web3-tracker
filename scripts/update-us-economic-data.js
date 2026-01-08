/**
 * GitHub Actions 脚本：使用 FRED API 自动获取美国经济数据并更新到经济专用 Gist
 * 运行频率：每天一次
 * 
 * FRED API 文档：https://fred.stlouisfed.org/docs/api/fred/
 * 获取免费 API Key：https://fred.stlouisfed.org/docs/api/api_key.html
 * 
 * 数据处理说明：
 * - FEDFUNDS: 联邦基金利率（直接使用百分比值）
 * - CPIAUCSL: CPI 指数（计算同比通胀率 YoY）
 * - UNRATE: 失业率（直接使用百分比值）
 */

// 获取环境变量并清理可能的空格/换行符
const FRED_API_KEY = process.env.FRED_API_KEY?.trim()
const GIST_TOKEN = process.env.GIST_TOKEN?.trim()
const ECONOMIC_GIST_ID = process.env.ECONOMIC_GIST_ID?.trim()

const FRED_API_BASE = 'https://api.stlouisfed.org/fred'

// FRED 数据系列 ID
const SERIES_IDS = {
  fedRate: 'FEDFUNDS',        // 联邦基金利率
  inflation: 'CPIAUCSL',      // CPI 消费者物价指数
  unemployment: 'UNRATE'      // 失业率
}

// 获取 FRED 数据
async function fetchFredSeries(seriesId, seriesName) {
  try {
    // 计算日期范围（最近5年）
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 5)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
    const url = `${FRED_API_BASE}/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&observation_start=${startDateStr}&observation_end=${endDateStr}`
    
    console.log(`Fetching ${seriesName} (${seriesId})...`)
    console.log(`URL: ${url.replace(FRED_API_KEY, '***API_KEY***')}`)
    
    const response = await fetch(url)
    
    console.log(`Response status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      // 尝试读取错误响应
      const errorText = await response.text()
      console.error(`Error response: ${errorText}`)
      throw new Error(`FRED API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    
    // 检查 FRED API 错误消息
    if (data.error_code) {
      console.error(`FRED API Error Code: ${data.error_code}`)
      console.error(`FRED API Error Message: ${data.error_message}`)
      throw new Error(`FRED API error: ${data.error_message}`)
    }
    
    if (data.observations && data.observations.length > 0) {
      const processed = processObservations(data.observations, seriesId)
      console.log(`✓ ${seriesName}: ${processed.length} data points`)
      return processed
    }
    
    throw new Error('No observations received')
  } catch (error) {
    console.error(`✗ Error fetching ${seriesName}:`, error.message)
    return null
  }
}

// 处理 FRED 观测数据
function processObservations(observations, seriesId) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  // 过滤和处理数据
  const processed = observations
    .filter(obs => {
      // 过滤掉无效值
      if (obs.value === '.' || obs.value === null) return false
      
      // 过滤未来日期
      const obsDate = new Date(obs.date)
      const obsYear = obsDate.getFullYear()
      const obsMonth = obsDate.getMonth() + 1
      
      if (obsYear > currentYear) return false
      if (obsYear === currentYear && obsMonth > currentMonth) return false
      
      return true
    })
    .map(obs => {
      const date = obs.date.substring(0, 7) // YYYY-MM
      const value = parseFloat(obs.value)
      
      return { date, value }
    })
  
  // 只保留月度数据（去重，取每月最后一个值）
  const monthlyData = {}
  processed.forEach(item => {
    monthlyData[item.date] = item.value
  })
  
  const sortedData = Object.entries(monthlyData)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
  
  // 对于 CPI 数据，计算同比通胀率（Year-over-Year）
  if (seriesId === 'CPIAUCSL') {
    const inflationRates = []
    
    for (let i = 12; i < sortedData.length; i++) {
      const current = sortedData[i]
      const yearAgo = sortedData[i - 12]
      
      // 计算同比变化率: ((current - yearAgo) / yearAgo) * 100
      const inflationRate = ((current.value - yearAgo.value) / yearAgo.value) * 100
      
      inflationRates.push({
        date: current.date,
        value: parseFloat(inflationRate.toFixed(2))
      })
    }
    
    return inflationRates.slice(-60) // 最多保留60个月
  }
  
  // 其他数据直接返回
  return sortedData.slice(-60) // 最多保留60个月
}

// 获取所有美国经济数据
async function fetchAllUSEconomicData() {
  console.log('📈 Fetching US economic data from FRED API...')
  
  const [fedRate, inflation, unemployment] = await Promise.all([
    fetchFredSeries(SERIES_IDS.fedRate, 'Federal Funds Rate'),
    fetchFredSeries(SERIES_IDS.inflation, 'CPI Inflation'),
    fetchFredSeries(SERIES_IDS.unemployment, 'Unemployment Rate')
  ])
  
  return { fedRate, inflation, unemployment }
}

// 更新经济专用 Gist
async function updateEconomicGist(usData) {
  if (!GIST_TOKEN || !ECONOMIC_GIST_ID) {
    console.error('Missing GIST_TOKEN or ECONOMIC_GIST_ID')
    return false
  }

  try {
    console.log('💾 Updating US economic data to economic Gist...')
    
    // 首先获取现有的 Gist 内容
    const getResponse = await fetch(`https://api.github.com/gists/${ECONOMIC_GIST_ID}`, {
      headers: {
        'Authorization': `token ${GIST_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    let existingData = {}
    if (getResponse.ok) {
      const gistData = await getResponse.json()
      const economicFile = gistData.files['economic-data.json']?.content
      if (economicFile) {
        try {
          existingData = JSON.parse(economicFile)
        } catch (e) {
          console.log('Creating new economic data structure')
        }
      }
    }
    
    // 更新美国数据部分
    const updatedData = {
      ...existingData,
      lastUpdate: new Date().toISOString(),
      usEconomicData: {
        lastUpdate: new Date().toISOString(),
        country: 'US',
        name: '美国',
        currency: 'USD',
        data: usData,
        indicators: {
          fedRate: {
            name: '联邦基金利率',
            unit: '%',
            description: 'Federal Funds Effective Rate'
          },
          inflation: {
            name: 'CPI通胀率',
            unit: '%',
            description: 'Consumer Price Index Year-over-Year Change'
          },
          unemployment: {
            name: '失业率',
            unit: '%',
            description: 'Unemployment Rate'
          }
        }
      }
    }
    
    const response = await fetch(`https://api.github.com/gists/${ECONOMIC_GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GIST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'economic-data.json': {
            content: JSON.stringify(updatedData, null, 2)
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`)
    }

    console.log('✅ US economic data updated to economic Gist successfully')
    return true
  } catch (error) {
    console.error('❌ Error updating economic Gist:', error)
    return false
  }
}

// 主函数
async function main() {
  console.log('='.repeat(60))
  console.log('Starting US Economic Data Update')
  console.log(`Time: ${new Date().toISOString()}`)
  console.log('='.repeat(60))

  // 检查必需的环境变量
  if (!FRED_API_KEY) {
    console.error('✗ FRED_API_KEY is required')
    console.log('Get your free API key at: https://fred.stlouisfed.org/docs/api/api_key.html')
    process.exit(1)
  }

  // 验证 API Key 格式（FRED API Key 是32位十六进制字符串）
  if (FRED_API_KEY.length !== 32 || !/^[a-f0-9]{32}$/i.test(FRED_API_KEY)) {
    console.warn('⚠️ Warning: FRED API Key format may be incorrect')
    console.warn('Expected: 32-character hexadecimal string (e.g., abcdef1234567890abcdef1234567890)')
    console.warn(`Received: ${FRED_API_KEY.length} characters`)
  }

  if (!GIST_TOKEN || !ECONOMIC_GIST_ID) {
    console.error('✗ GIST_TOKEN and ECONOMIC_GIST_ID are required')
    process.exit(1)
  }

  // 获取所有美国数据
  const { fedRate, inflation, unemployment } = await fetchAllUSEconomicData()

  // 检查是否有数据
  if (!fedRate && !inflation && !unemployment) {
    console.error('✗ Failed to fetch any data from FRED')
    process.exit(1)
  }

  console.log('\n📊 US Economic Data Summary:')
  console.log(`联邦基金利率: ${fedRate ? fedRate.length : 0} points`)
  console.log(`CPI通胀率: ${inflation ? inflation.length : 0} points`)
  console.log(`失业率: ${unemployment ? unemployment.length : 0} points`)

  // 更新经济专用 Gist
  console.log('\n💾 Updating to Economic Gist...')
  const success = await updateEconomicGist({
    fedRate: fedRate || [],
    inflation: inflation || [],
    unemployment: unemployment || []
  })

  if (success) {
    console.log('\n' + '='.repeat(60))
    console.log('✅ US economic data updated successfully!')
    console.log('Updated indicators: 联邦基金利率, CPI通胀率, 失业率')
    console.log('='.repeat(60))
    process.exit(0)
  } else {
    console.error('\n✗ Failed to update economic Gist')
    process.exit(1)
  }
}

main()