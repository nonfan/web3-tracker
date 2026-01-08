/**
 * 经济数据全局状态管理
 * 支持多国经济数据
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  getCryptoMarketData,
  type EconomicDataPoint
} from '../utils/economicDataApi'
import {
  fetchMultiCountryEconomicData,
  getCountryEconomicData,
  type CountryEconomicData,
  type MultiCountryData
} from '../utils/multiCountryEconomicDataApi'

export interface CryptoMarketData {
  date: string
  btc: number
  eth: number
  total: number
}

interface EconomicState {
  // 多国数据状态
  multiCountryData: MultiCountryData | null
  currentCountryData: CountryEconomicData | null
  cryptoData: CryptoMarketData[]
  
  // 元数据
  lastUpdate: Record<string, number>
  isLoading: Record<string, boolean>
  errors: Record<string, string | null>
  
  // 选择的国家
  selectedCountry: string
  
  // 操作方法
  setSelectedCountry: (country: string) => void
  fetchMultiCountryData: () => Promise<void>
  fetchCountryData: (countryCode: string) => Promise<void>
  fetchCryptoData: () => Promise<void>
  refreshAllData: () => Promise<void>
  clearErrors: () => void
  
  // 获取最新数据的便捷方法
  getLatestInterestRate: () => EconomicDataPoint | null
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
      multiCountryData: null,
      currentCountryData: null,
      cryptoData: [],
      
      lastUpdate: {},
      isLoading: {},
      errors: {},
      
      selectedCountry: 'US',
      
      // 设置选中的国家
      setSelectedCountry: (country: string) => {
        set({ selectedCountry: country })
        // 切换国家时获取该国家的数据
        get().fetchCountryData(country)
      },
      
      // 获取多国经济数据
      fetchMultiCountryData: async () => {
        set(state => ({ 
          isLoading: { ...state.isLoading, multiCountry: true },
          errors: { ...state.errors, multiCountry: null }
        }))
        
        try {
          const data = await fetchMultiCountryEconomicData()
          set(state => ({
            multiCountryData: data,
            lastUpdate: { ...state.lastUpdate, multiCountry: Date.now() },
            isLoading: { ...state.isLoading, multiCountry: false }
          }))
          
          if (data) {
            console.log('📈 Multi-country economic data updated:', Object.keys(data.data).length, 'countries')
            
            // 如果当前选中的国家有数据，更新当前国家数据
            const { selectedCountry } = get()
            if (data.data[selectedCountry]) {
              set({ currentCountryData: data.data[selectedCountry] })
            }
          }
        } catch (error) {
          console.error('❌ Failed to fetch multi-country economic data:', error)
          set(state => ({
            isLoading: { ...state.isLoading, multiCountry: false },
            errors: { ...state.errors, multiCountry: error instanceof Error ? error.message : 'Unknown error' }
          }))
        }
      },
      
      // 获取指定国家的经济数据
      fetchCountryData: async (countryCode: string) => {
        set(state => ({ 
          isLoading: { ...state.isLoading, country: true },
          errors: { ...state.errors, country: null }
        }))
        
        try {
          const data = await getCountryEconomicData(countryCode)
          set(state => ({
            currentCountryData: data,
            lastUpdate: { ...state.lastUpdate, country: Date.now() },
            isLoading: { ...state.isLoading, country: false }
          }))
          
          if (data) {
            console.log(`📊 ${data.name} economic data updated:`, {
              interestRate: data.interestRate.length,
              inflation: data.inflation.length,
              unemployment: data.unemployment.length
            })
          } else {
            console.log(`⚠️ No economic data available for ${countryCode}`)
          }
        } catch (error) {
          console.error(`❌ Failed to fetch economic data for ${countryCode}:`, error)
          set(state => ({
            isLoading: { ...state.isLoading, country: false },
            errors: { ...state.errors, country: error instanceof Error ? error.message : 'Unknown error' }
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
        const { fetchMultiCountryData, fetchCryptoData, selectedCountry } = get()
        
        // 并行获取所有数据
        await Promise.allSettled([
          fetchMultiCountryData(),
          fetchCryptoData()
        ])
        
        console.log('✅ All economic data refreshed')
      },
      
      // 清除错误
      clearErrors: () => {
        set({ errors: {} })
      },
      
      // 便捷方法：获取最新的利率
      getLatestInterestRate: () => {
        const { currentCountryData } = get()
        if (!currentCountryData || !currentCountryData.interestRate.length) return null
        return currentCountryData.interestRate[currentCountryData.interestRate.length - 1]
      },
      
      // 便捷方法：获取最新的通胀率
      getLatestInflation: () => {
        const { currentCountryData } = get()
        if (!currentCountryData || !currentCountryData.inflation.length) return null
        return currentCountryData.inflation[currentCountryData.inflation.length - 1]
      },
      
      // 便捷方法：获取最新的失业率
      getLatestUnemployment: () => {
        const { currentCountryData } = get()
        if (!currentCountryData || !currentCountryData.unemployment.length) return null
        return currentCountryData.unemployment[currentCountryData.unemployment.length - 1]
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
            interestRate: '央行利率',
            inflation: '通胀率',
            unemployment: '失业率'
          },
          EU: {
            interestRate: '欧央行利率',
            inflation: '通胀率',
            unemployment: '失业率'
          },
          JP: {
            interestRate: '日银利率',
            inflation: '通胀率',
            unemployment: '失业率'
          },
          UK: {
            interestRate: '英银利率',
            inflation: '通胀率',
            unemployment: '失业率'
          },
          CA: {
            interestRate: '加银利率',
            inflation: '通胀率',
            unemployment: '失业率'
          },
          AU: {
            interestRate: '澳储行利率',
            inflation: '通胀率',
            unemployment: '失业率'
          },
          DE: {
            interestRate: '德银利率',
            inflation: '通胀率',
            unemployment: '失业率'
          }
        }
        
        return labels[selectedCountry as keyof typeof labels] || labels.US
      }
    }),
    {
      name: 'economic-data-store',
      // 只持久化数据，不持久化加载状态和错误
      partialize: (state) => ({
        multiCountryData: state.multiCountryData,
        currentCountryData: state.currentCountryData,
        cryptoData: state.cryptoData,
        lastUpdate: state.lastUpdate,
        selectedCountry: state.selectedCountry
      }),
      // 数据过期时间：1小时
      version: 2
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