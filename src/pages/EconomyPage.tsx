import { useState, useEffect } from 'react'
import { FedRateChart } from '../components/economy/FedRateChart'
import { InflationChart } from '../components/economy/InflationChart'
import { UnemploymentChart } from '../components/economy/UnemploymentChart'
import { DataCard } from '../components/economy/DataCard'
import { CountrySelector } from '../components/economy/CountrySelector'
import { useEconomicStore } from '../store/economicStore'
import { useAutoRefresh, useVisibilityRefresh } from '../hooks/useAutoRefresh'
import { TrendingUp, Activity, Briefcase, DollarSign } from 'lucide-react'

type ChartType = 'interest-rate' | 'inflation' | 'unemployment' | 'exchange-rate'

export function EconomyPage() {
  const [activeChart, setActiveChart] = useState<ChartType>('interest-rate')
  
  // 使用全局状态管理
  const {
    // 数据状态
    fedRateData,
    inflationData,
    unemploymentData,
    
    // 中国数据状态
    chinaM2Data,
    chinaDR007Data,
    chinaSocialFinancingData,
    chinaUsdCnyData,
    
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
    getLatestUnemployment,
    getLatestChinaM2,
    getLatestChinaDR007,
    getLatestChinaSocialFinancing,
    getLatestChinaUsdCny,
    getCurrentCountryLabels
  } = useEconomicStore()
  
  // 自动刷新数据
  useAutoRefresh()
  useVisibilityRefresh()

  // 检查中国数据是否可用（只要有任何一个数据源可用就显示）
  const isChinaDataAvailable = chinaM2Data.length > 0 || chinaDR007Data.length > 0 || 
                               chinaSocialFinancingData.length > 0 || chinaUsdCnyData.length > 0
  
  // 调试信息
  console.log('🇨🇳 China data status:', {
    m2: chinaM2Data.length,
    dr007: chinaDR007Data.length,
    socialFinancing: chinaSocialFinancingData.length,
    usdCny: chinaUsdCnyData.length,
    available: isChinaDataAvailable
  })
  
  // 可用的国家列表
  const availableCountries = ['US'] // 美国数据总是可用
  if (isChinaDataAvailable) {
    availableCountries.push('CN')
  }
  
  // 如果当前选择的国家不可用，切换到美国
  useEffect(() => {
    if (selectedCountry === 'CN' && !isChinaDataAvailable) {
      setSelectedCountry('US')
    }
  }, [selectedCountry, isChinaDataAvailable, setSelectedCountry])
  
  // 页面加载时确保数据已加载
  useEffect(() => {
    console.log('📊 Initial data load for EconomyPage')
    refreshAllData()
  }, [refreshAllData])
  
  // 获取最新数据
  const latestFedRate = getLatestFedRate()
  const latestInflation = getLatestInflation()
  const latestUnemployment = getLatestUnemployment()
  
  // 获取中国数据
  const latestChinaM2 = getLatestChinaM2()
  const latestChinaDR007 = getLatestChinaDR007()
  const latestChinaSocialFinancing = getLatestChinaSocialFinancing()
  const latestChinaUsdCny = getLatestChinaUsdCny()
  
  // 获取当前国家的标签
  const labels = getCurrentCountryLabels()
  
  const charts = [
    { id: 'interest-rate' as ChartType, label: labels.interestRate, icon: TrendingUp, color: 'violet' },
    { id: 'inflation' as ChartType, label: labels.inflation, icon: Activity, color: 'amber' },
    { id: 'unemployment' as ChartType, label: labels.unemployment, icon: Briefcase, color: 'emerald' },
    ...(selectedCountry === 'CN' && labels.exchangeRate ? [
      { id: 'exchange-rate' as ChartType, label: labels.exchangeRate, icon: DollarSign, color: 'blue' }
    ] : [])
  ]

  return (
    <div className="space-y-6">
      {/* Country Navigation */}
      <CountrySelector 
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        availableCountries={availableCountries}
      />

      {/* Stats Overview - 使用统一数据源 */}
      <div className={`grid gap-6 ${selectedCountry === 'CN' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        <DataCard
          title={labels.interestRate}
          value={selectedCountry === 'US' ? latestFedRate?.rate : latestChinaDR007?.value}
          date={selectedCountry === 'US' ? latestFedRate?.date : latestChinaDR007?.date}
          unit="%"
          loading={selectedCountry === 'US' ? isLoading.fedRate : isLoading.chinaDR007}
          error={selectedCountry === 'US' ? errors.fedRate : errors.chinaDR007}
          color="violet"
          icon={selectedCountry === 'US' ? "fed-rate" : "dr007-rate"}
        />
        
        <DataCard
          title={labels.inflation}
          value={selectedCountry === 'US' ? latestInflation?.value : latestChinaM2?.value}
          date={selectedCountry === 'US' ? latestInflation?.date : latestChinaM2?.date}
          unit={selectedCountry === 'US' ? '%' : '万亿元'}
          loading={selectedCountry === 'US' ? isLoading.inflation : isLoading.chinaM2}
          error={selectedCountry === 'US' ? errors.inflation : errors.chinaM2}
          color="amber"
          icon={selectedCountry === 'US' ? "inflation" : "m2-money"}
        />
        
        <DataCard
          title={labels.unemployment}
          value={selectedCountry === 'US' ? latestUnemployment?.value : latestChinaSocialFinancing?.value}
          date={selectedCountry === 'US' ? latestUnemployment?.date : latestChinaSocialFinancing?.date}
          unit={selectedCountry === 'US' ? '%' : '万亿元'}
          loading={selectedCountry === 'US' ? isLoading.unemployment : isLoading.chinaSocialFinancing}
          error={selectedCountry === 'US' ? errors.unemployment : errors.chinaSocialFinancing}
          color="emerald"
          icon={selectedCountry === 'US' ? "unemployment" : "social-financing"}
        />
        
        {/* 中国专用：人民币汇率 */}
        {selectedCountry === 'CN' && labels.exchangeRate && (
          <DataCard
            title={labels.exchangeRate}
            value={latestChinaUsdCny?.value}
            date={latestChinaUsdCny?.date}
            unit="CNY"
            loading={isLoading.chinaUsdCny}
            error={errors.chinaUsdCny}
            color="blue"
            icon="exchange-rate"
          />
        )}
      </div>

      {/* Chart Selector */}
      <div className={`grid gap-4 ${selectedCountry === 'CN' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
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
            {activeChart === 'interest-rate' && (
              <FedRateChart 
                data={fedRateData}
                loading={isLoading.fedRate}
                error={errors.fedRate}
                countryName="美国"
                countryCode="US"
              />
            )}
            {activeChart === 'inflation' && (
              <InflationChart 
                data={inflationData}
                loading={isLoading.inflation}
                error={errors.inflation}
                countryName="美国"
                countryCode="US"
              />
            )}
            {activeChart === 'unemployment' && (
              <UnemploymentChart 
                data={unemploymentData}
                loading={isLoading.unemployment}
                error={errors.unemployment}
                countryName="美国"
                countryCode="US"
              />
            )}
          </>
        ) : selectedCountry === 'CN' ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🇨🇳</div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">中国经济数据图表</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              {activeChart === 'interest-rate' && '显示DR007利率走势'}
              {activeChart === 'inflation' && '显示M2货币供应量走势'}
              {activeChart === 'unemployment' && '显示社会融资规模走势'}
              {activeChart === 'exchange-rate' && '显示人民币汇率走势'}
            </p>
            
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-8 max-w-md mx-auto">
              <div className="text-[var(--text-muted)] text-sm space-y-2">
                <p>📊 中国经济数据已配置</p>
                <p>📈 数据卡片已显示最新数值</p>
                <p>🔄 图表功能开发中</p>
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-left">
                    <p>• DR007数据: {chinaDR007Data.length} 个数据点</p>
                    <p>• M2数据: {chinaM2Data.length} 个数据点</p>
                    <p>• 社融数据: {chinaSocialFinancingData.length} 个数据点</p>
                    <p>• 汇率数据: {chinaUsdCnyData.length} 个数据点</p>
                  </div>
                  <button
                    onClick={refreshAllData}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    重新加载数据
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">其他国家数据</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              该国家的经济数据正在开发中
            </p>
            
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-8 max-w-md mx-auto">
              <div className="text-[var(--text-muted)] text-sm space-y-2">
                <p>🔄 数据获取功能开发中</p>
                <div className="mt-4">
                  <button
                    onClick={refreshAllData}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    重新加载
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}