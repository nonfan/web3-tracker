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
import {
  getM2MoneySupplyData,
  getDR007RateData,
  getSocialFinancingData,
  getUsdCnyRateData,
  type ChinaEconomicDataPoint
} from '../utils/chinaEconomicDataApi'

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
  
  // 中国经济数据
  chinaM2Data: ChinaEconomicDataPoint[]
  chinaDR007Data: ChinaEconomicDataPoint[]
  chinaSocialFinancingData: ChinaEconomicDataPoint[]
  chinaUsdCnyData: ChinaEconomicDataPoint[]
  
  // 元数据
  lastUpdate: Record<string, number>
  isLoading: Record<string, boolean>
  errors: Record<string, string | null>
  
  // 选择的国家（目前支持美国和中国）
  selectedCountry: string
  
  // 操作方法
  setSelectedCountry: (country: string) => void
  fetchFedRateData: () => Promise<void>
  fetchInflationData: () => Promise<void>
  fetchUnemploymentData: () => Promise<void>
  fetchCryptoData: () => Promise<void>
  fetchChinaData: () => Promise<void>
  refreshAllData: () => Promise<void>
  clearErrors: () => void
  
  // 获取最新数据的便捷方法
  getLatestFedRate: () => FedRateData | null
  getLatestInflation: () => EconomicDataPoint | null
  getLatestUnemployment: () => EconomicDataPoint | null
  getLatestCrypto: () => CryptoMarketData | null
  
  // 中国数据便捷方法
  getLatestChinaM2: () => ChinaEconomicDataPoint | null
  getLatestChinaDR007: () => ChinaEconomicDataPoint | null
  getLatestChinaSocialFinancing: () => ChinaEconomicDataPoint | null
  getLatestChinaUsdCny: () => ChinaEconomicDataPoint | null
  
  // 获取当前国家的数据标签
  getCurrentCountryLabels: () => {
    interestRate: string
    inflation: string
    unemployment: string
    exchangeRate?: string
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
      
      // 中国数据初始状态
      chinaM2Data: [],
      chinaDR007Data: [],
      chinaSocialFinancingData: [],
      chinaUsdCnyData: [],
      
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
      
      // 获取中国经济数据
      fetchChinaData: async () => {
        set(state => ({ 
          isLoading: { 
            ...state.isLoading, 
            chinaM2: true,
            chinaDR007: true,
            chinaSocialFinancing: true,
            chinaUsdCny: true
          },
          errors: { 
            ...state.errors, 
            chinaM2: null,
            chinaDR007: null,
            chinaSocialFinancing: null,
            chinaUsdCny: null
          }
        }))
        
        try {
          console.log('🇨🇳 Fetching China economic data...')
          
          // 并行获取所有中国数据
          const [m2Data, dr007Data, socialFinancingData, usdCnyData] = await Promise.allSettled([
            getM2MoneySupplyData(),
            getDR007RateData(),
            getSocialFinancingData(),
            getUsdCnyRateData()
          ])
          
          // 处理M2数据
          if (m2Data.status === 'fulfilled') {
            set(state => ({
              chinaM2Data: m2Data.value,
              lastUpdate: { ...state.lastUpdate, chinaM2: Date.now() },
              isLoading: { ...state.isLoading, chinaM2: false }
            }))
            console.log('📊 China M2 data updated:', m2Data.value.length, 'points')
          } else {
            set(state => ({
              isLoading: { ...state.isLoading, chinaM2: false },
              errors: { ...state.errors, chinaM2: 'Failed to fetch M2 data' }
            }))
          }
          
          // 处理DR007数据
          if (dr007Data.status === 'fulfilled') {
            set(state => ({
              chinaDR007Data: dr007Data.value,
              lastUpdate: { ...state.lastUpdate, chinaDR007: Date.now() },
              isLoading: { ...state.isLoading, chinaDR007: false }
            }))
            console.log('📊 China DR007 data updated:', dr007Data.value.length, 'points')
          } else {
            set(state => ({
              isLoading: { ...state.isLoading, chinaDR007: false },
              errors: { ...state.errors, chinaDR007: 'Failed to fetch DR007 data' }
            }))
          }
          
          // 处理社会融资规模数据
          if (socialFinancingData.status === 'fulfilled') {
            set(state => ({
              chinaSocialFinancingData: socialFinancingData.value,
              lastUpdate: { ...state.lastUpdate, chinaSocialFinancing: Date.now() },
              isLoading: { ...state.isLoading, chinaSocialFinancing: false }
            }))
            console.log('📊 China social financing data updated:', socialFinancingData.value.length, 'points')
          } else {
            set(state => ({
              isLoading: { ...state.isLoading, chinaSocialFinancing: false },
              errors: { ...state.errors, chinaSocialFinancing: 'Failed to fetch social financing data' }
            }))
          }
          
          // 处理USD/CNY汇率数据
          if (usdCnyData.status === 'fulfilled') {
            set(state => ({
              chinaUsdCnyData: usdCnyData.value,
              lastUpdate: { ...state.lastUpdate, chinaUsdCny: Date.now() },
              isLoading: { ...state.isLoading, chinaUsdCny: false }
            }))
            console.log('📊 China USD/CNY data updated:', usdCnyData.value.length, 'points')
          } else {
            set(state => ({
              isLoading: { ...state.isLoading, chinaUsdCny: false },
              errors: { ...state.errors, chinaUsdCny: 'Failed to fetch USD/CNY data' }
            }))
          }
          
          console.log('✅ China economic data fetch completed')
        } catch (error) {
          console.error('❌ Failed to fetch China economic data:', error)
          set(state => ({
            isLoading: { 
              ...state.isLoading, 
              chinaM2: false,
              chinaDR007: false,
              chinaSocialFinancing: false,
              chinaUsdCny: false
            },
            errors: { 
              ...state.errors, 
              chinaM2: error instanceof Error ? error.message : 'Unknown error',
              chinaDR007: error instanceof Error ? error.message : 'Unknown error',
              chinaSocialFinancing: error instanceof Error ? error.message : 'Unknown error',
              chinaUsdCny: error instanceof Error ? error.message : 'Unknown error'
            }
          }))
        }
      },
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
        const { fetchFedRateData, fetchInflationData, fetchUnemploymentData, fetchCryptoData, fetchChinaData, selectedCountry } = get()
        
        // 根据选择的国家获取相应数据
        if (selectedCountry === 'US') {
          // 并行获取美国数据
          await Promise.allSettled([
            fetchFedRateData(),
            fetchInflationData(),
            fetchUnemploymentData(),
            fetchCryptoData()
          ])
        } else if (selectedCountry === 'CN') {
          // 获取中国数据和加密货币数据
          await Promise.allSettled([
            fetchChinaData(),
            fetchCryptoData()
          ])
        } else {
          // 默认获取所有数据
          await Promise.allSettled([
            fetchFedRateData(),
            fetchInflationData(),
            fetchUnemploymentData(),
            fetchCryptoData(),
            fetchChinaData()
          ])
        }
        
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
      
      // 便捷方法：获取最新的中国M2数据
      getLatestChinaM2: () => {
        const { chinaM2Data } = get()
        return chinaM2Data.length > 0 ? chinaM2Data[chinaM2Data.length - 1] : null
      },
      
      // 便捷方法：获取最新的中国DR007数据
      getLatestChinaDR007: () => {
        const { chinaDR007Data } = get()
        return chinaDR007Data.length > 0 ? chinaDR007Data[chinaDR007Data.length - 1] : null
      },
      
      // 便捷方法：获取最新的中国社会融资规模数据
      getLatestChinaSocialFinancing: () => {
        const { chinaSocialFinancingData } = get()
        return chinaSocialFinancingData.length > 0 ? chinaSocialFinancingData[chinaSocialFinancingData.length - 1] : null
      },
      
      // 便捷方法：获取最新的中国USD/CNY汇率数据
      getLatestChinaUsdCny: () => {
        const { chinaUsdCnyData } = get()
        return chinaUsdCnyData.length > 0 ? chinaUsdCnyData[chinaUsdCnyData.length - 1] : null
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
            unemployment: '社会融资规模',
            exchangeRate: '人民币汇率'
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
        chinaM2Data: state.chinaM2Data,
        chinaDR007Data: state.chinaDR007Data,
        chinaSocialFinancingData: state.chinaSocialFinancingData,
        chinaUsdCnyData: state.chinaUsdCnyData,
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