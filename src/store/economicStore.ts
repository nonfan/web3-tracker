/**
 * 经济数据全局状态管理
 * 专注于美国经济数据
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  getFedRateData, 
  getInflationData, 
  getUnemploymentData, 
  getCryptoMarketData,
  type FedRateData,
  type EconomicDataPoint
} from '../utils/economicDataApi'

export interface CryptoMarketData {
  date: string
  btc: number
  eth: number
  total: number
}

interface EconomicState {
  // 数据状态
  fedRateData: FedRateData[]
  inflationData: EconomicDataPoint[]
  unemploymentData: EconomicDataPoint[]
  cryptoData: CryptoMarketData[]
  
  // 元数据
  lastUpdate: Record<string, number>
  isLoading: Record<string, boolean>
  errors: Record<string, string | null>
  
  // 选择的国家（目前只支持美国）
  selectedCountry: string
  
  // 操作方法
  setSelectedCountry: (country: string) => void
  fetchFedRateData: () => Promise<void>
  fetchInflationData: () => Promise<void>
  fetchUnemploymentData: () => Promise<void>
  fetchCryptoData: () => Promise<void>
  refreshAllData: () => Promise<void>
  clearErrors: () => void
  
  // 获取最新数据的便捷方法
  getLatestFedRate: () => FedRateData | null
  getLatestInflation: () => EconomicDataPoint | null
  getLatestUnemployment: () => EconomicDataPoint | null
  getLatestCrypto: () => CryptoMarketData | null
  
  // 获取当前国家的数据标签
  getCurrentCountryLabels: () => {
    interestRate: string
    inflation: string
    unemployment: string
  }
}

export const useEconomicStore = create<EconomicState>()(
  persist(
    (set, get) => ({
      // 初始状态
      fedRateData: [],
      inflationData: [],
      unemploymentData: [],
      cryptoData: [],
      
      lastUpdate: {},
      isLoading: {},
      errors: {},
      
      selectedCountry: 'US',
      
      // 设置选中的国家
      setSelectedCountry: (country: string) => {
        set({ selectedCountry: country })
        // 切换国家时重新获取数据
        get().refreshAllData()
      },
      
      // 获取联邦利率数据
      fetchFedRateData: async () => {
        const { selectedCountry } = get()
        
        set(state => ({ 
          isLoading: { ...state.isLoading, fedRate: true },
          errors: { ...state.errors, fedRate: null }
        }))
        
        try {
          // 目前只支持美国数据
          if (selectedCountry === 'US') {
            const data = await getFedRateData()
            set(state => ({
              fedRateData: data,
              lastUpdate: { ...state.lastUpdate, fedRate: Date.now() },
              isLoading: { ...state.isLoading, fedRate: false }
            }))
            console.log('📈 Fed rate data updated:', data.length, 'points')
          } else {
            // 其他国家暂时清空数据
            set(state => ({
              fedRateData: [],
              lastUpdate: { ...state.lastUpdate, fedRate: Date.now() },
              isLoading: { ...state.isLoading, fedRate: false }
            }))
          }
        } catch (error) {
          console.error('❌ Failed to fetch fed rate data:', error)
          set(state => ({
            isLoading: { ...state.isLoading, fedRate: false },
            errors: { ...state.errors, fedRate: error instanceof Error ? error.message : 'Unknown error' }
          }))
        }
      },
      
      // 获取通胀率数据
      fetchInflationData: async () => {
        const { selectedCountry } = get()
        
        set(state => ({ 
          isLoading: { ...state.isLoading, inflation: true },
          errors: { ...state.errors, inflation: null }
        }))
        
        try {
          if (selectedCountry === 'US') {
            const data = await getInflationData()
            set(state => ({
              inflationData: data,
              lastUpdate: { ...state.lastUpdate, inflation: Date.now() },
              isLoading: { ...state.isLoading, inflation: false }
            }))
            console.log('📊 Inflation data updated:', data.length, 'points')
          } else {
            set(state => ({
              inflationData: [],
              lastUpdate: { ...state.lastUpdate, inflation: Date.now() },
              isLoading: { ...state.isLoading, inflation: false }
            }))
          }
        } catch (error) {
          console.error('❌ Failed to fetch inflation data:', error)
          set(state => ({
            isLoading: { ...state.isLoading, inflation: false },
            errors: { ...state.errors, inflation: error instanceof Error ? error.message : 'Unknown error' }
          }))
        }
      },
      
      // 获取失业率数据
      fetchUnemploymentData: async () => {
        const { selectedCountry } = get()
        
        set(state => ({ 
          isLoading: { ...state.isLoading, unemployment: true },
          errors: { ...state.errors, unemployment: null }
        }))
        
        try {
          if (selectedCountry === 'US') {
            const data = await getUnemploymentData()
            set(state => ({
              unemploymentData: data,
              lastUpdate: { ...state.lastUpdate, unemployment: Date.now() },
              isLoading: { ...state.isLoading, unemployment: false }
            }))
            console.log('💼 Unemployment data updated:', data.length, 'points')
          } else {
            set(state => ({
              unemploymentData: [],
              lastUpdate: { ...state.lastUpdate, unemployment: Date.now() },
              isLoading: { ...state.isLoading, unemployment: false }
            }))
          }
        } catch (error) {
          console.error('❌ Failed to fetch unemployment data:', error)
          set(state => ({
            isLoading: { ...state.isLoading, unemployment: false },
            errors: { ...state.errors, unemployment: error instanceof Error ? error.message : 'Unknown error' }
          }))
        }
      },
      
      // 获取加密货币数据
      fetchCryptoData: async () => {
        set(state => ({ 
          isLoading: { ...state.isLoading, crypto: true },
          errors: { ...state.errors, crypto: null }
        }))
        
        try {
          const data = await getCryptoMarketData()
          set(state => ({
            cryptoData: data,
            lastUpdate: { ...state.lastUpdate, crypto: Date.now() },
            isLoading: { ...state.isLoading, crypto: false }
          }))
          console.log('🪙 Crypto data updated:', data.length, 'points')
        } catch (error) {
          console.error('❌ Failed to fetch crypto data:', error)
          set(state => ({
            isLoading: { ...state.isLoading, crypto: false },
            errors: { ...state.errors, crypto: error instanceof Error ? error.message : 'Unknown error' }
          }))
        }
      },
      
      // 刷新所有数据
      refreshAllData: async () => {
        console.log('🔄 Refreshing all economic data...')
        const { fetchFedRateData, fetchInflationData, fetchUnemploymentData, fetchCryptoData } = get()
        
        // 并行获取所有数据
        await Promise.allSettled([
          fetchFedRateData(),
          fetchInflationData(),
          fetchUnemploymentData(),
          fetchCryptoData()
        ])
        
        console.log('✅ All economic data refreshed')
      },
      
      // 清除错误
      clearErrors: () => {
        set({ errors: {} })
      },
      
      // 便捷方法：获取最新的联邦利率
      getLatestFedRate: () => {
        const { fedRateData } = get()
        return fedRateData.length > 0 ? fedRateData[fedRateData.length - 1] : null
      },
      
      // 便捷方法：获取最新的通胀率
      getLatestInflation: () => {
        const { inflationData } = get()
        return inflationData.length > 0 ? inflationData[inflationData.length - 1] : null
      },
      
      // 便捷方法：获取最新的失业率
      getLatestUnemployment: () => {
        const { unemploymentData } = get()
        return unemploymentData.length > 0 ? unemploymentData[unemploymentData.length - 1] : null
      },
      
      // 便捷方法：获取最新的加密货币数据
      getLatestCrypto: () => {
        const { cryptoData } = get()
        return cryptoData.length > 0 ? cryptoData[cryptoData.length - 1] : null
      },
      
      // 获取当前国家的数据标签
      getCurrentCountryLabels: () => {
        const { selectedCountry } = get()
        
        const labels = {
          US: {
            interestRate: '美联储利率',
            inflation: '通胀率',
            unemployment: '失业率'
          },
          CN: {
            interestRate: 'DR007利率',
            inflation: 'M2货币供应量',
            unemployment: '社会融资规模'
          }
        }
        
        return labels[selectedCountry as keyof typeof labels] || labels.US
      }
    }),
    {
      name: 'economic-data-store',
      // 只持久化数据，不持久化加载状态和错误
      partialize: (state) => ({
        fedRateData: state.fedRateData,
        inflationData: state.inflationData,
        unemploymentData: state.unemploymentData,
        cryptoData: state.cryptoData,
        lastUpdate: state.lastUpdate,
        selectedCountry: state.selectedCountry
      }),
      // 数据过期时间：1小时
      version: 3
    }
  )
)

// 数据是否需要刷新的判断函数
export function shouldRefreshData(lastUpdate: number, maxAge = 60 * 60 * 1000): boolean {
  return Date.now() - lastUpdate > maxAge
}

// 自动刷新hook（移到单独的文件中）
export function shouldRefreshEconomicData(lastUpdate: Record<string, number>, maxAge = 60 * 60 * 1000): boolean {
  return Object.values(lastUpdate).some(timestamp => 
    shouldRefreshData(timestamp, maxAge)
  )
}