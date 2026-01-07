/**
 * 测试通胀率计算
 * 验证 CPI 指数到通胀率的转换是否正确
 */

// 模拟 FRED API 返回的 CPI 数据
const mockCPIData = [
  { date: '2024-10-01', value: '314.540' },
  { date: '2024-11-01', value: '316.450' },
  { date: '2024-12-01', value: '318.200' },
  { date: '2025-01-01', value: '319.800' },
  { date: '2025-02-01', value: '321.100' },
  { date: '2025-03-01', value: '322.400' },
  { date: '2025-04-01', value: '323.200' },
  { date: '2025-05-01', value: '323.800' },
  { date: '2025-06-01', value: '324.300' },
  { date: '2025-07-01', value: '324.600' },
  { date: '2025-08-01', value: '324.900' },
  { date: '2025-09-01', value: '325.100' },
  { date: '2025-10-01', value: '325.200' },
  { date: '2025-11-01', value: '325.031' },
]

function calculateInflationRates(cpiData) {
  const processed = cpiData.map(item => ({
    date: item.date.substring(0, 7),
    value: parseFloat(item.value)
  }))

  const inflationRates = []

  // 需要至少 13 个月的数据（12个月前 + 当前月）
  for (let i = 12; i < processed.length; i++) {
    const current = processed[i]
    const yearAgo = processed[i - 12]

    // 计算同比通胀率
    const inflationRate = ((current.value - yearAgo.value) / yearAgo.value) * 100

    inflationRates.push({
      date: current.date,
      currentCPI: current.value,
      yearAgoCPI: yearAgo.value,
      inflationRate: parseFloat(inflationRate.toFixed(2))
    })
  }

  return inflationRates
}

console.log('🧮 CPI 通胀率计算测试\n')
console.log('=' .repeat(80))

const results = calculateInflationRates(mockCPIData)

console.log('\n📊 计算结果：\n')
results.forEach(item => {
  console.log(`日期: ${item.date}`)
  console.log(`  当前 CPI: ${item.currentCPI}`)
  console.log(`  12个月前 CPI: ${item.yearAgoCPI}`)
  console.log(`  通胀率: ${item.inflationRate}%`)
  console.log(`  计算: ((${item.currentCPI} - ${item.yearAgoCPI}) / ${item.yearAgoCPI}) × 100%`)
  console.log()
})

console.log('=' .repeat(80))
console.log('\n✅ 验证：')
console.log(`最新通胀率（2025-11）: ${results[results.length - 1].inflationRate}%`)
console.log(`预期值: 约 2.71%`)
console.log()

// 验证最后一个值
const lastResult = results[results.length - 1]
const expected = ((325.031 - 316.450) / 316.450) * 100
console.log(`手动计算: ((325.031 - 316.450) / 316.450) × 100% = ${expected.toFixed(2)}%`)
console.log(`脚本计算: ${lastResult.inflationRate}%`)
console.log(`匹配: ${Math.abs(lastResult.inflationRate - expected) < 0.01 ? '✅' : '❌'}`)
console.log()

console.log('💡 说明：')
console.log('- CPI 指数值（如 325.031）不是通胀率')
console.log('- 通胀率是同比变化率（如 2.71%）')
console.log('- 需要至少 13 个月的数据才能计算第一个通胀率')
console.log()
