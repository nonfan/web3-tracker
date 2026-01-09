import { useEffect, useRef } from 'react'
import { useEconomicStore, shouldRefreshData } from '../store/economicStore'

/**
 * 自动刷新经济数据的Hook
 * @param interval 刷新间隔（毫秒），默认5分钟
 * @param maxAge 数据最大缓存时间（毫秒），默认1小时
 */
export function useAutoRefresh(interval = 5 * 60 * 1000, maxAge = 60 * 60 * 1000) {
  const refreshAllData = useEconomicStore(state => state.refreshAllData)
  const lastUpdate = useEconomicStore(state => state.lastUpdate)
  const hasInitialized = useRef(false)
  
  useEffect(() => {
    // 只在首次挂载时检查是否需要刷新
    if (!hasInitialized.current) {
      hasInitialized.current = true
      
      const needsRefresh = Object.keys(lastUpdate).length === 0 || 
        Object.values(lastUpdate).some(timestamp => shouldRefreshData(timestamp, maxAge))
      
      if (needsRefresh) {
        console.log('🔄 Auto-refreshing economic data (cache expired or empty)')
        refreshAllData()
      }
    }
    
    // 设置定时刷新
    const timer = setInterval(() => {
      console.log('⏰ Scheduled refresh of economic data')
      refreshAllData()
    }, interval)
    
    return () => {
      clearInterval(timer)
    }
  }, [interval, maxAge]) // 移除 refreshAllData 和 lastUpdate 依赖，避免无限循环
}

/**
 * 页面可见性变化时刷新数据的Hook
 */
export function useVisibilityRefresh() {
  const refreshAllData = useEconomicStore(state => state.refreshAllData)
  const lastUpdateRef = useRef<Record<string, number>>({})
  
  // 使用 ref 来追踪 lastUpdate，避免依赖变化导致重新绑定事件
  useEffect(() => {
    const unsubscribe = useEconomicStore.subscribe(
      state => { lastUpdateRef.current = state.lastUpdate }
    )
    return unsubscribe
  }, [])
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面变为可见时，检查数据是否需要刷新（超过10分钟）
        const needsRefresh = Object.values(lastUpdateRef.current).some(timestamp => 
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
  }, []) // 移除依赖，使用 ref 代替
}