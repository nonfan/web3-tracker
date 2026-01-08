import { useEffect } from 'react'
import { useEconomicStore, shouldRefreshData } from '../store/economicStore'

/**
 * 自动刷新经济数据的Hook
 * @param interval 刷新间隔（毫秒），默认5分钟
 * @param maxAge 数据最大缓存时间（毫秒），默认1小时
 */
export function useAutoRefresh(interval = 5 * 60 * 1000, maxAge = 60 * 60 * 1000) {
  const refreshAllData = useEconomicStore(state => state.refreshAllData)
  const lastUpdate = useEconomicStore(state => state.lastUpdate)
  
  useEffect(() => {
    // 检查是否需要立即刷新
    const needsRefresh = Object.values(lastUpdate).some(timestamp => 
      shouldRefreshData(timestamp, maxAge)
    )
    
    if (needsRefresh || Object.keys(lastUpdate).length === 0) {
      console.log('🔄 Auto-refreshing economic data (cache expired or empty)')
      refreshAllData()
    }
    
    // 设置定时刷新
    const timer = setInterval(() => {
      console.log('⏰ Scheduled refresh of economic data')
      refreshAllData()
    }, interval)
    
    return () => {
      clearInterval(timer)
    }
  }, [refreshAllData, lastUpdate, interval, maxAge])
}

/**
 * 页面可见性变化时刷新数据的Hook
 */
export function useVisibilityRefresh() {
  const refreshAllData = useEconomicStore(state => state.refreshAllData)
  const lastUpdate = useEconomicStore(state => state.lastUpdate)
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面变为可见时，检查数据是否需要刷新（超过10分钟）
        const needsRefresh = Object.values(lastUpdate).some(timestamp => 
          shouldRefreshData(timestamp, 10 * 60 * 1000)
        )
        
        if (needsRefresh) {
          console.log('👁️ Page became visible, refreshing stale data')
          refreshAllData()
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshAllData, lastUpdate])
}