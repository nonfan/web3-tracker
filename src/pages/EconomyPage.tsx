import { useState, useEffect } from 'react'
import { FedRateChart } from '../components/economy/FedRateChart'
import { InflationChart } from '../components/economy/InflationChart'
import { UnemploymentChart } from '../components/economy/UnemploymentChart'
import { DataCard } from '../components/economy/DataCard'
import { CountrySelector } from '../components/economy/CountrySelector'
import { useEconomicStore } from '../store/economicStore'
import { useAutoRefresh, useVisibilityRefresh } from '../hooks/useAutoRefresh'
import { TrendingUp, Activity, Briefcase, DollarSign, RefreshCw, BarChart3 } from 'lucide-react'

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

  const isRefreshing = Object.values(isLoading).some(loading => loading)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 页面标题 */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              全球经济数据中心
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            实时追踪全球主要经济体的核心指标，数据来源权威，自动更新
          </p>
        </div>

        {/* 国家选择器 */}
        <CountrySelector 
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
        />

        {/* 数据概览卡片 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              核心经济指标
            </h2>
            <button
              onClick={refreshAllData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">
                {isRefreshing ? '更新中...' : '刷新数据'}
              </span>
            </button>
          </div>
          
          <div className={`grid gap-6 ${selectedCountry === 'CN' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            <DataCard
              title={labels.interestRate}
              value={selectedCountry === 'US' ? latestFedRate?.rate : latestChinaDR007?.value}
              date={selectedCountry === 'US' ? latestFedRate?.date : latestChinaDR007?.date}
              unit="%"
              loading={selectedCountry === 'US' ? isLoading.fedRate : isLoading.chinaDR007}
              error={selectedCountry === 'US' ? errors.fedRate : errors.chinaDR007}
              color="violet"
              icon="fed-rate"
            />
            
            <DataCard
              title={labels.inflation}
              value={selectedCountry === 'US' ? latestInflation?.value : latestChinaM2?.value}
              date={selectedCountry === 'US' ? latestInflation?.date : latestChinaM2?.date}
              unit={selectedCountry === 'US' ? '%' : '万亿元'}
              loading={selectedCountry === 'US' ? isLoading.inflation : isLoading.chinaM2}
              error={selectedCountry === 'US' ? errors.inflation : errors.chinaM2}
              color="amber"
              icon="inflation"
            />
            
            <DataCard
              title={labels.unemployment}
              value={selectedCountry === 'US' ? latestUnemployment?.value : latestChinaSocialFinancing?.value}
              date={selectedCountry === 'US' ? latestUnemployment?.date : latestChinaSocialFinancing?.date}
              unit={selectedCountry === 'US' ? '%' : '万亿元'}
              loading={selectedCountry === 'US' ? isLoading.unemployment : isLoading.chinaSocialFinancing}
              error={selectedCountry === 'US' ? errors.unemployment : errors.chinaSocialFinancing}
              color="emerald"
              icon="unemployment"
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
        </div>

        {/* 图表选择器 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            趋势分析
          </h2>
          
          <div className={`grid gap-4 ${selectedCountry === 'CN' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {charts.map((chart) => {
              const Icon = chart.icon
              const isActive = activeChart === chart.id
              return (
                <button
                  key={chart.id}
                  onClick={() => setActiveChart(chart.id)}
                  className={`group p-6 rounded-2xl border transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${
                          chart.color === 'violet' ? 'from-violet-500/20 to-purple-500/20 border-violet-500/30 shadow-xl shadow-violet-500/10' :
                          chart.color === 'amber' ? 'from-amber-500/20 to-orange-500/20 border-amber-500/30 shadow-xl shadow-amber-500/10' :
                          chart.color === 'emerald' ? 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 shadow-xl shadow-emerald-500/10' :
                          'from-blue-500/20 to-indigo-500/20 border-blue-500/30 shadow-xl shadow-blue-500/10'
                        }`
                      : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50 hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      isActive 
                        ? `${
                            chart.color === 'violet' ? 'bg-violet-500/30' :
                            chart.color === 'amber' ? 'bg-amber-500/30' :
                            chart.color === 'emerald' ? 'bg-emerald-500/30' :
                            'bg-blue-500/30'
                          }` 
                        : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
                    }`}>
                      <Icon className={`w-6 h-6 transition-all ${
                        isActive 
                          ? `${
                              chart.color === 'violet' ? 'text-violet-600 dark:text-violet-400' :
                              chart.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                              chart.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                              'text-blue-600 dark:text-blue-400'
                            }` 
                          : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                      }`} />
                    </div>
                    <div className="text-left flex-1">
                      <div className={`font-semibold transition-all ${
                        isActive 
                          ? 'text-slate-800 dark:text-slate-200' 
                          : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                      }`}>
                        {chart.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        点击查看趋势图表
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 图表显示区域 */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-3xl p-8 shadow-xl">
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
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl mb-6">
                <span className="text-4xl">🇨🇳</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">中国经济数据图表</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                {activeChart === 'interest-rate' && '显示DR007利率走势，反映银行间市场资金成本'}
                {activeChart === 'inflation' && '显示M2货币供应量走势，反映市场流动性状况'}
                {activeChart === 'unemployment' && '显示社会融资规模走势，反映实体经济融资情况'}
                {activeChart === 'exchange-rate' && '显示人民币汇率走势，反映汇率变化趋势'}
              </p>
              
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 border border-slate-200 dark:border-slate-600 rounded-2xl p-8 max-w-lg mx-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-semibold">数据统计</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                      <div className="font-semibold text-violet-600 dark:text-violet-400">{chinaDR007Data.length}</div>
                      <div className="text-slate-600 dark:text-slate-400">DR007数据点</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                      <div className="font-semibold text-amber-600 dark:text-amber-400">{chinaM2Data.length}</div>
                      <div className="text-slate-600 dark:text-slate-400">M2数据点</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">{chinaSocialFinancingData.length}</div>
                      <div className="text-slate-600 dark:text-slate-400">社融数据点</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl">
                      <div className="font-semibold text-blue-600 dark:text-blue-400">{chinaUsdCnyData.length}</div>
                      <div className="text-slate-600 dark:text-slate-400">汇率数据点</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                    <button
                      onClick={refreshAllData}
                      disabled={isRefreshing}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? '更新中...' : '重新加载数据'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-500/20 to-gray-500/20 rounded-2xl mb-6">
                <span className="text-4xl">🌍</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">其他国家数据</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                该国家的经济数据正在开发中，敬请期待
              </p>
              
              <button
                onClick={refreshAllData}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? '更新中...' : '重新加载'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}