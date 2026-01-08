import { useState, useEffect } from 'react'
import { FedRateChart } from '../components/economy/FedRateChart'
import { InflationChart } from '../components/economy/InflationChart'
import { UnemploymentChart } from '../components/economy/UnemploymentChart'
import { DataCard } from '../components/economy/DataCard'
import { CountrySelector } from '../components/economy/CountrySelector'
import { useEconomicStore } from '../store/economicStore'
import { useAutoRefresh, useVisibilityRefresh } from '../hooks/useAutoRefresh'
import { TrendingUp, Activity, Briefcase } from 'lucide-react'

type ChartType = 'fed-rate' | 'inflation' | 'unemployment'

export function EconomyPage() {
  const [activeChart, setActiveChart] = useState<ChartType>('fed-rate')
  
  // 使用全局状态管理
  const {
    // 数据状态
    fedRateData,
    inflationData,
    unemploymentData,
    
    // 元数据
    isLoading,
    errors,
    selectedCountry,
    
    // 操作方法
    setSelectedCountry,
    refreshAllData,
    
    // 便捷方法
    getLatestFedRate,
    getLatestInflation,
    getLatestUnemployment
  } = useEconomicStore()
  
  // 自动刷新数据
  useAutoRefresh()
  useVisibilityRefresh()
  
  // 页面加载时确保数据已加载
  useEffect(() => {
    // 如果没有任何数据，立即刷新
    if (fedRateData.length === 0 && inflationData.length === 0 && 
        unemploymentData.length === 0) {
      console.log('📊 Initial data load for EconomyPage')
      refreshAllData()
    }
  }, [refreshAllData, fedRateData.length, inflationData.length, unemploymentData.length])
  
  // 获取最新数据
  const latestFedRate = getLatestFedRate()
  const latestInflation = getLatestInflation()
  const latestUnemployment = getLatestUnemployment()
  
  // 根据选中的国家调整图表标签
  const getChartLabel = (chartId: ChartType) => {
    const baseLabels = {
      'fed-rate': selectedCountry === 'US' ? '美联储利率' : 
                  selectedCountry === 'CN' ? '央行利率' :
                  selectedCountry === 'EU' ? '欧央行利率' :
                  selectedCountry === 'JP' ? '日银利率' :
                  selectedCountry === 'UK' ? '英银利率' :
                  selectedCountry === 'CA' ? '加银利率' :
                  selectedCountry === 'AU' ? '澳储行利率' :
                  selectedCountry === 'DE' ? '德银利率' : '基准利率',
      'inflation': '通胀率',
      'unemployment': '失业率'
    }
    return baseLabels[chartId]
  }

  const charts = [
    { id: 'fed-rate' as ChartType, label: getChartLabel('fed-rate'), icon: TrendingUp, color: 'violet' },
    { id: 'inflation' as ChartType, label: getChartLabel('inflation'), icon: Activity, color: 'amber' },
    { id: 'unemployment' as ChartType, label: getChartLabel('unemployment'), icon: Briefcase, color: 'emerald' },
  ]

  return (
    <div className="space-y-6">
      {/* Country Navigation */}
      <CountrySelector 
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
      />

      {/* Stats Overview - 使用统一数据源 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DataCard
          title={selectedCountry === 'US' ? '当前利率' : 
                 selectedCountry === 'CN' ? '基准利率' :
                 selectedCountry === 'EU' ? '主要再融资利率' :
                 selectedCountry === 'JP' ? '政策利率' :
                 selectedCountry === 'UK' ? '银行利率' :
                 selectedCountry === 'CA' ? '隔夜利率' :
                 selectedCountry === 'AU' ? '现金利率' :
                 selectedCountry === 'DE' ? '基准利率' : '基准利率'}
          value={selectedCountry === 'US' ? latestFedRate?.rate : null}
          date={selectedCountry === 'US' ? latestFedRate?.date : null}
          unit="%"
          loading={isLoading.fedRate}
          error={errors.fedRate}
          color="violet"
          icon="fed-rate"
        />
        
        <DataCard
          title="通胀率"
          value={selectedCountry === 'US' ? latestInflation?.value : null}
          date={selectedCountry === 'US' ? latestInflation?.date : null}
          unit="%"
          loading={isLoading.inflation}
          error={errors.inflation}
          color="amber"
          icon="inflation"
        />
        
        <DataCard
          title="失业率"
          value={selectedCountry === 'US' ? latestUnemployment?.value : null}
          date={selectedCountry === 'US' ? latestUnemployment?.date : null}
          unit="%"
          loading={isLoading.unemployment}
          error={errors.unemployment}
          color="emerald"
          icon="unemployment"
        />
      </div>

      {/* Chart Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {charts.map((chart) => {
          const Icon = chart.icon
          const isActive = activeChart === chart.id
          return (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`p-4 rounded-xl border transition-all ${isActive
                ? `bg-${chart.color}-500/10 border-${chart.color}-500/30 shadow-lg`
                : 'bg-[var(--card-bg)] border-[var(--border)] hover:border-[var(--border-hover)]'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? `bg-${chart.color}-500/20` : 'bg-[var(--bg-tertiary)]'
                  }`}>
                  <Icon className={`w-5 h-5 ${isActive ? `text-${chart.color}-400` : 'text-[var(--text-muted)]'
                    }`} />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-medium ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    }`}>
                    {chart.label}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Chart Display */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6">
        {selectedCountry === 'US' ? (
          <>
            {activeChart === 'fed-rate' && (
              <FedRateChart 
                data={fedRateData}
                loading={isLoading.fedRate}
                error={errors.fedRate}
              />
            )}
            {activeChart === 'inflation' && (
              <InflationChart 
                data={inflationData}
                loading={isLoading.inflation}
                error={errors.inflation}
              />
            )}
            {activeChart === 'unemployment' && (
              <UnemploymentChart 
                data={unemploymentData}
                loading={isLoading.unemployment}
                error={errors.unemployment}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {selectedCountry === 'CN' ? '🇨🇳' :
               selectedCountry === 'EU' ? '🇪🇺' :
               selectedCountry === 'JP' ? '🇯🇵' :
               selectedCountry === 'UK' ? '🇬🇧' :
               selectedCountry === 'CA' ? '🇨🇦' :
               selectedCountry === 'AU' ? '🇦🇺' :
               selectedCountry === 'DE' ? '🇩🇪' : '🏳️'}
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {selectedCountry === 'CN' ? '中国' :
               selectedCountry === 'EU' ? '欧盟' :
               selectedCountry === 'JP' ? '日本' :
               selectedCountry === 'UK' ? '英国' :
               selectedCountry === 'CA' ? '加拿大' :
               selectedCountry === 'AU' ? '澳大利亚' :
               selectedCountry === 'DE' ? '德国' : '其他国家'}经济数据
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              {getChartLabel(activeChart)}数据正在开发中
            </p>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-8 max-w-md mx-auto">
              <div className="text-[var(--text-muted)] text-sm space-y-2">
                <p>📊 数据源整合中</p>
                <p>🔄 API 接口开发中</p>
                <p>📈 图表组件适配中</p>
              </div>
              <div className="mt-4 text-xs text-[var(--text-muted)]">
                预计完成时间：2025年Q2
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}