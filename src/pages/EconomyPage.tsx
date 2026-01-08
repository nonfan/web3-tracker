import { useState, useEffect } from 'react'
import { FedRateChart } from '../components/economy/FedRateChart'
import { InflationChart } from '../components/economy/InflationChart'
import { UnemploymentChart } from '../components/economy/UnemploymentChart'
import { DataCard } from '../components/economy/DataCard'
import { CountrySelector } from '../components/economy/CountrySelector'
import { useEconomicStore } from '../store/economicStore'
import { useAutoRefresh, useVisibilityRefresh } from '../hooks/useAutoRefresh'
import { TrendingUp, Activity, Briefcase } from 'lucide-react'

type ChartType = 'interest-rate' | 'inflation' | 'unemployment'

export function EconomyPage() {
  const [activeChart, setActiveChart] = useState<ChartType>('interest-rate')
  
  // 使用全局状态管理
  const {
    // 数据状态
    currentCountryData,
    
    // 元数据
    isLoading,
    errors,
    selectedCountry,
    
    // 操作方法
    setSelectedCountry,
    refreshAllData,
    
    // 便捷方法
    getLatestInterestRate,
    getLatestInflation,
    getLatestUnemployment,
    getCurrentCountryLabels
  } = useEconomicStore()
  
  // 自动刷新数据
  useAutoRefresh()
  useVisibilityRefresh()
  
  // 页面加载时确保数据已加载
  useEffect(() => {
    console.log('📊 Initial data load for EconomyPage')
    refreshAllData()
  }, [refreshAllData])
  
  // 获取最新数据
  const latestInterestRate = getLatestInterestRate()
  const latestInflation = getLatestInflation()
  const latestUnemployment = getLatestUnemployment()
  
  // 获取当前国家的标签
  const labels = getCurrentCountryLabels()
  
  const charts = [
    { id: 'interest-rate' as ChartType, label: labels.interestRate, icon: TrendingUp, color: 'violet' },
    { id: 'inflation' as ChartType, label: labels.inflation, icon: Activity, color: 'amber' },
    { id: 'unemployment' as ChartType, label: labels.unemployment, icon: Briefcase, color: 'emerald' },
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
          title={labels.interestRate}
          value={latestInterestRate?.value}
          date={latestInterestRate?.date}
          unit="%"
          loading={isLoading.country}
          error={errors.country}
          color="violet"
          icon="fed-rate"
        />
        
        <DataCard
          title={labels.inflation}
          value={latestInflation?.value}
          date={latestInflation?.date}
          unit="%"
          loading={isLoading.country}
          error={errors.country}
          color="amber"
          icon="inflation"
        />
        
        <DataCard
          title={labels.unemployment}
          value={latestUnemployment?.value}
          date={latestUnemployment?.date}
          unit="%"
          loading={isLoading.country}
          error={errors.country}
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
        {currentCountryData ? (
          <>
            {activeChart === 'interest-rate' && (
              <FedRateChart 
                data={currentCountryData.interestRate.map(item => ({
                  date: item.date,
                  rate: item.value,
                  change: 0, // TODO: 计算变化
                  type: 'actual' as const
                }))}
                loading={isLoading.country}
                error={errors.country}
                countryName={currentCountryData.name}
                countryCode={selectedCountry}
              />
            )}
            {activeChart === 'inflation' && (
              <InflationChart 
                data={currentCountryData.inflation}
                loading={isLoading.country}
                error={errors.country}
                countryName={currentCountryData.name}
                countryCode={selectedCountry}
              />
            )}
            {activeChart === 'unemployment' && (
              <UnemploymentChart 
                data={currentCountryData.unemployment}
                loading={isLoading.country}
                error={errors.country}
                countryName={currentCountryData.name}
                countryCode={selectedCountry}
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
               selectedCountry === 'DE' ? '🇩🇪' : 
               selectedCountry === 'US' ? '🇺🇸' : '🏳️'}
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              {selectedCountry === 'CN' ? '中国' :
               selectedCountry === 'EU' ? '欧盟' :
               selectedCountry === 'JP' ? '日本' :
               selectedCountry === 'UK' ? '英国' :
               selectedCountry === 'CA' ? '加拿大' :
               selectedCountry === 'AU' ? '澳大利亚' :
               selectedCountry === 'DE' ? '德国' :
               selectedCountry === 'US' ? '美国' : '其他国家'}经济数据
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              {isLoading.country ? '正在加载数据...' : 
               selectedCountry === 'US' ? '请配置 GitHub Gist 来获取经济数据' :
               `${labels.interestRate}数据正在开发中`}
            </p>
            
            {!isLoading.country && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-8 max-w-md mx-auto">
                {selectedCountry === 'US' ? (
                  <div className="text-[var(--text-muted)] text-sm space-y-2">
                    <p>📊 请配置 GitHub Gist</p>
                    <p>🔑 设置 API Token</p>
                    <p>📈 启用数据同步</p>
                    <div className="mt-4">
                      <button
                        onClick={refreshAllData}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        重新加载
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[var(--text-muted)] text-sm space-y-2">
                    <p>📊 数据源整合中</p>
                    <p>🔄 API 接口开发中</p>
                    <p>📈 图表组件适配中</p>
                    <div className="mt-4 text-xs text-[var(--text-muted)]">
                      预计完成时间：2025年Q2
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}