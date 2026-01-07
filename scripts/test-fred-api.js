/**
 * FRED API 测试脚本
 * 用于验证 API Key 是否有效
 * 
 * 使用方法:
 * Windows: set FRED_API_KEY=your_key && node scripts/test-fred-api.js
 * Linux/Mac: FRED_API_KEY=your_key node scripts/test-fred-api.js
 */

const FRED_API_KEY = process.env.FRED_API_KEY?.trim()

if (!FRED_API_KEY) {
  console.error('❌ FRED_API_KEY environment variable is required')
  console.log('\nUsage:')
  console.log('  Windows: set FRED_API_KEY=your_key && node scripts/test-fred-api.js')
  console.log('  Linux/Mac: FRED_API_KEY=your_key node scripts/test-fred-api.js')
  process.exit(1)
}

console.log('🔍 Testing FRED API Key...\n')
console.log('API Key Info:')
console.log(`  Length: ${FRED_API_KEY.length} characters`)
console.log(`  First 4 chars: ${FRED_API_KEY.substring(0, 4)}`)
console.log(`  Last 4 chars: ${FRED_API_KEY.substring(FRED_API_KEY.length - 4)}`)
console.log(`  Format check: ${/^[a-f0-9]{32}$/i.test(FRED_API_KEY) ? '✅ Valid' : '❌ Invalid (should be 32 hex chars)'}`)
console.log()

async function testAPI() {
  const testUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${FRED_API_KEY}&file_type=json&limit=1`
  
  console.log('📡 Making test request to FRED API...')
  console.log(`URL: ${testUrl.replace(FRED_API_KEY, '***API_KEY***')}\n`)
  
  try {
    const response = await fetch(testUrl)
    
    console.log(`Response Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('\n❌ API Request Failed')
      console.error('Error Response:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error_message) {
          console.error('\nFRED Error Message:', errorJson.error_message)
        }
      } catch (e) {
        // Not JSON, already printed as text
      }
      
      console.log('\n💡 Troubleshooting:')
      console.log('  1. Verify your API Key at: https://fred.stlouisfed.org/')
      console.log('  2. Check if the API Key is active (may take 5-10 minutes after creation)')
      console.log('  3. Ensure you copied the entire key without extra spaces')
      
      process.exit(1)
    }
    
    const data = await response.json()
    
    console.log('\n✅ API Request Successful!')
    console.log('\nResponse Data:')
    console.log(`  Real-time Start: ${data.realtime_start}`)
    console.log(`  Real-time End: ${data.realtime_end}`)
    console.log(`  Total Count: ${data.count}`)
    console.log(`  Observations: ${data.observations?.length || 0}`)
    
    if (data.observations && data.observations.length > 0) {
      const latest = data.observations[0]
      console.log(`\n  Latest Data Point:`)
      console.log(`    Date: ${latest.date}`)
      console.log(`    Value: ${latest.value}`)
    }
    
    console.log('\n🎉 Your FRED API Key is working correctly!')
    console.log('\n📋 Next Steps:')
    console.log('  1. Add this API Key to GitHub Secrets as FRED_API_KEY')
    console.log('  2. Make sure to copy it exactly as you used here')
    console.log('  3. Run the GitHub Actions workflow')
    
  } catch (error) {
    console.error('\n❌ Network Error:', error.message)
    console.log('\n💡 Possible causes:')
    console.log('  1. No internet connection')
    console.log('  2. Firewall blocking the request')
    console.log('  3. FRED API service is down')
    process.exit(1)
  }
}

testAPI()
