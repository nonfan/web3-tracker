import { useEffect } from 'react'
import { CryptoMarketChart } from '../components/economy/CryptoMarketChart'
import { DataCard } from '../components/economy/DataCard'
import { useEconomicStore } from '../store/economicStore'
import { useAutoRefresh, useVisibilityRefresh } from '../hooks/useAutoRefresh'
import { Bitcoin, TrendingUp, BarChart3 } from 'lucide-react'

export function CryptoPage() {
  // 使用全局状态管理
  const {
    // 数据状态
    cryptoData,
    
    // 元数据
    isLoading,
    errors,
    
    // 操作方法
    refreshAllData,
    
    // 便捷方法
    getLatestCrypto
  } = useEconomicStore()
  
  // 自动刷新数据
  useAutoRefresh()
  useVisibilityRefresh()
  
  // 页面加载时确保数据已加载
  useEffect(() => {
    if (cryptoData.length === 0) {
      console.log('🪙 Initial crypto data load for CryptoPage')
      refreshAllData()
    }
  }, [refreshAllData, cryptoData.length])
  
  // 获取最新数据
  const latestCrypto = getLatestCrypto()
  
  // 计算市场统计
  const btcDominance = latestCrypto ? ((latestCrypto.btc / latestCrypto.total) * 100).toFixed(1) : '0'
  const ethDominance = latestCrypto ? ((latestCrypto.eth / latestCrypto.total) * 100).toFixed(1) : '0'
  const altcoinMarketCap = latestCrypto ? (latestCrypto.total - latestCrypto.btc - latestCrypto.eth).toFixed(2) : '0'

  return (
    <div className="space-y-6">
      {/* Market Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DataCard
          title="总市值"
          value={latestCrypto?.total}
          date={latestCrypto?.date}
          unit="T"
          loading={isLoading.crypto}
          error={errors.crypto}
          color="blue"
          icon="crypto"
        />
        
        <DataCard
          title="BTC市值"
          value={latestCrypto?.btc}
          date={latestCrypto?.date}
          unit="T"
          loading={isLoading.crypto}
          error={errors.crypto}
          color="orange"
          icon="crypto"
          subtitle={`占比 ${btcDominance}%`}
        />
        
        <DataCard
          title="ETH市值"
          value={latestCrypto?.eth}
          date={latestCrypto?.date}
          unit="T"
          loading={isLoading.crypto}
          error={errors.crypto}
          color="violet"
          icon="crypto"
          subtitle={`占比 ${ethDominance}%`}
        />
        
        <DataCard
          title="山寨币市值"
          value={parseFloat(altcoinMarketCap)}
          date={latestCrypto?.date}
          unit="T"
          loading={isLoading.crypto}
          error={errors.crypto}
          color="emerald"
          icon="crypto"
          subtitle={`占比 ${(100 - parseFloat(btcDominance) - parseFloat(ethDominance)).toFixed(1)}%`}
        />
      </div>

      {/* Market Insights */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Bitcoin className="w-4 h-4 text-orange-400" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">比特币主导地位</h3>
          </div>
          <div className="text-2xl font-bold text-orange-400 mb-1">{btcDominance}%</div>
          <p className="text-sm text-[var(--text-secondary)]">
            {parseFloat(btcDominance) > 50 ? '市场主导地位强劲' : '山寨币季节可能来临'}
          </p>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">以太坊生态</h3>
          </div>
          <div className="text-2xl font-bold text-violet-400 mb-1">{ethDominance}%</div>
          <p className="text-sm text-[var(--text-secondary)]">
            智能合约平台领导者
          </p>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-[var(--text-primary)]">市场多样性</h3>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mb-1">
            {(100 - parseFloat(btcDominance) - parseFloat(ethDominance)).toFixed(1)}%
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            其他加密货币占比
          </p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
        <CryptoMarketChart 
          data={cryptoData}
          loading={isLoading.crypto}
          error={errors.crypto}
        />
      </div>
    </div>
  )
}