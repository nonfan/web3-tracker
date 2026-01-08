/**
 * 格式化数字，使用 k、m、b 等单位来减少显示宽度
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (num === 0) return '0'
  
  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  
  if (absNum >= 1e9) {
    return sign + (absNum / 1e9).toFixed(decimals).replace(/\.0+$/, '') + 'b'
  }
  if (absNum >= 1e6) {
    return sign + (absNum / 1e6).toFixed(decimals).replace(/\.0+$/, '') + 'm'
  }
  if (absNum >= 1e3) {
    return sign + (absNum / 1e3).toFixed(decimals).replace(/\.0+$/, '') + 'k'
  }
  
  // 小于1000的数字直接显示
  if (absNum >= 1) {
    return sign + absNum.toFixed(0)
  }
  
  // 小数保留更多位数
  return sign + absNum.toFixed(decimals)
}

/**
 * 格式化代币数量，专门用于代币持有量显示
 */
export function formatTokenAmount(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0'
  return formatNumber(amount, 1)
}

/**
 * 格式化货币金额，保留2位小数
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '$0'
  if (Math.abs(amount) >= 1000) {
    return '$' + formatNumber(amount, 2)
  }
  return '$' + amount.toFixed(2)
}