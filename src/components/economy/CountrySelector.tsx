import { Globe, MapPin, Database } from 'lucide-react'

interface CountrySelectorProps {
  selectedCountry: string
  onCountryChange: (country: string) => void
}

export function CountrySelector({ selectedCountry, onCountryChange }: CountrySelectorProps) {
  // 支持美国和中国数据
  const supportedCountries = [
    { 
      code: 'US', 
      name: '美国', 
      flag: '🇺🇸', 
      currency: 'USD',
      description: '美联储 FRED 数据库',
      indicators: ['联邦基金利率', 'CPI通胀率', '失业率']
    },
    { 
      code: 'CN', 
      name: '中国', 
      flag: '🇨🇳', 
      currency: 'CNY',
      description: '央行及官方数据源',
      indicators: ['DR007利率', 'M2货币供应量', '社会融资规模', '人民币汇率']
    }
  ]
  
  const currentCountry = supportedCountries.find(c => c.code === selectedCountry) || supportedCountries[0]
  
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">选择国家/地区</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">切换不同经济体的数据视图</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-600 dark:text-slate-400">当前选择</div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span className="text-lg">{currentCountry.flag}</span>
            {currentCountry.name}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {supportedCountries.map((country) => (
          <button
            key={country.code}
            onClick={() => onCountryChange(country.code)}
            className={`group p-6 rounded-2xl border transition-all duration-300 text-left ${
              selectedCountry === country.code
                ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30 shadow-lg shadow-blue-500/10'
                : 'bg-slate-50/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:border-blue-500/30 hover:shadow-md hover:scale-[1.02]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                selectedCountry === country.code
                  ? 'bg-blue-500/20 shadow-lg'
                  : 'bg-white dark:bg-slate-600 group-hover:bg-blue-50 dark:group-hover:bg-slate-500'
              }`}>
                {country.flag}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-bold text-lg ${
                    selectedCountry === country.code 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-300'
                  }`}>
                    {country.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    selectedCountry === country.code
                      ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                  }`}>
                    {country.currency}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {country.description}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-500 font-medium">核心指标:</div>
                  <div className="flex flex-wrap gap-1">
                    {country.indicators.map((indicator, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-md text-xs ${
                          selectedCountry === country.code
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedCountry === country.code && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {/* 数据源说明 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">数据来源说明</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
              {selectedCountry === 'US' 
                ? '美国经济数据来源于美联储经济数据库 (FRED)，提供权威的宏观经济指标，通过 GitHub Actions 每日自动更新，确保数据的及时性和准确性。'
                : '中国经济数据来源于中国人民银行、外汇交易中心、国家统计局等官方权威机构，涵盖货币政策、汇率、融资等核心指标，通过自动化脚本定期更新。'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}