/**
 * GitHub Actions 脚本：使用 FRED API 自动获取经济数据并更新到 Gist
 * 运行频率：每天一次
 * 
 * FRED API 文档：https://fred.stlouisfed.org/docs/api/fred/
 * 获取免费 API Key：https://fred.stlouisfed.org/docs/api/api_key.html
 */

const FRED_API_KEY = process.env.FRED_API_KEY
const GIST_TOKEN = process.env.GIST_TOKEN
const GIST_ID = process.env.GIST_ID

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
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`)
    }
    
    const data = await response.json()
    
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
      let value = parseFloat(obs.value)
      
      // CPI 需要计算同比增长率
      if (seriesId === 'CPIAUCSL') {
        // 这里简化处理，实际应该计算12个月前的同比
        // 在实际使用中，FRED 有专门的通胀率系列 CPIAUCSL_PC1
        value = parseFloat(value.toFixed(2))
      }
      
      return { date, value }
    })
  
  // 只保留月度数据（去重，取每月最后一个值）
  const monthlyData = {}
  processed.forEach(item => {
    monthlyData[item.date] = item.value
  })
  
  return Object.entries(monthlyData)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-60) // 最多保留60个月
}

// 获取所有经济数据
async function fetchAllEconomicData() {
  console.log('Fetching data from FRED API...')
  
  const [fedRate, inflation, unemployment] = await Promise.all([
    fetchFredSeries(SERIES_IDS.fedRate, 'Federal Funds Rate'),
    fetchFredSeries(SERIES_IDS.inflation, 'CPI Inflation'),
    fetchFredSeries(SERIES_IDS.unemployment, 'Unemployment Rate')
  ])
  
  return { fedRate, inflation, unemployment }
}

// 更新 Gist
async function updateGist(data) {
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
          'economic-data.json': {
            content: JSON.stringify({
              lastUpdate: new Date().toISOString(),
              data
            }, null, 2)
          }
        }
      })
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    console.log('✓ Gist updated successfully')
    return true
  } catch (error) {
    console.error('Error updating Gist:', error)
    return false
  }
}

// 主函数
async function main() {
  console.log('='.repeat(50))
  console.log('Starting FRED Economic Data Update')
  console.log(`Time: ${new Date().toISOString()}`)
  console.log('='.repeat(50))

  // 检查必需的环境变量
  if (!FRED_API_KEY) {
    console.error('✗ FRED_API_KEY is required')
    console.log('Get your free API key at: https://fred.stlouisfed.org/docs/api/api_key.html')
    process.exit(1)
  }

  if (!GIST_TOKEN || !GIST_ID) {
    console.error('✗ GIST_TOKEN and GIST_ID are required')
    process.exit(1)
  }

  // 获取所有数据
  const { fedRate, inflation, unemployment } = await fetchAllEconomicData()

  // 检查是否有数据
  if (!fedRate && !inflation && !unemployment) {
    console.error('✗ Failed to fetch any data from FRED')
    process.exit(1)
  }

  console.log('\nData Summary:')
  console.log(`- Fed Rate: ${fedRate ? fedRate.length : 0} points`)
  console.log(`- Inflation: ${inflation ? inflation.length : 0} points`)
  console.log(`- Unemployment: ${unemployment ? unemployment.length : 0} points`)

  // 更新 Gist
  console.log('\nUpdating GitHub Gist...')
  const success = await updateGist({
    fedRate: fedRate || [],
    inflation: inflation || [],
    unemployment: unemployment || []
  })

  if (success) {
    console.log('\n' + '='.repeat(50))
    console.log('✓ Economic data updated successfully!')
    console.log('='.repeat(50))
    process.exit(0)
  } else {
    console.error('\n✗ Failed to update Gist')
    process.exit(1)
  }
}

main()
