import { Globe } from 'lucide-react'
import { useEconomicStore } from '../../store/economicStore'
import { getSupportedCountries } from '../../utils/multiCountryEconomicDataApi'

interface CountrySelectorProps {
  selectedCountry: string
  onCountryChange: (country: string) => void
}

export function CountrySelector({ selectedCountry, onCountryChange }: CountrySelectorProps) {
  const { multiCountryData } = useEconomicStore()
  const allSupportedCountries = getSupportedCountries()
  
  // 根据Gist数据过滤可用的国家
  const availableCountries = allSupportedCountries.filter(country => {
    // 如果没有多国数据，只显示美国
    if (!multiCountryData) {
      return country.code === 'US'
    }
    
    // 显示在Gist数据中有实际数据的国家
    return multiCountryData.data[country.code] && (
      multiCountryData.data[country.code].interestRate.length > 0 ||
      multiCountryData.data[country.code].inflation.length > 0 ||
      multiCountryData.data[country.code].unemployment.length > 0
    )
  })
  
  // 如果没有可用国家，显示所有支持的国家（用于初始状态）
  const displayCountries = availableCountries.length > 0 ? availableCountries : allSupportedCountries
  
  const currentCountry = displayCountries.find(c => c.code === selectedCountry) || displayCountries[0]
  
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="w-5 h-5 text-[var(--text-secondary)]" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">选择国家/地区</h2>
        <div className="flex-1"></div>
        <div className="text-sm text-[var(--text-muted)]">
          当前: {currentCountry.flag} {currentCountry.name}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {displayCountries.map((country) => {
          const hasData = multiCountryData?.data[country.code] && (
            multiCountryData.data[country.code].interestRate.length > 0 ||
            multiCountryData.data[country.code].inflation.length > 0 ||
            multiCountryData.data[country.code].unemployment.length > 0
          )
          
          return (
            <button
              key={country.code}
              onClick={() => onCountryChange(country.code)}
              className={`p-3 rounded-xl border transition-all relative ${
                selectedCountry === country.code
                  ? 'bg-blue-500/10 border-blue-500/30 shadow-lg'
                  : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--input-bg)]'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{country.flag}</div>
                <div className={`text-xs font-medium ${
                  selectedCountry === country.code 
                    ? 'text-blue-400' 
                    : 'text-[var(--text-secondary)]'
                }`}>
                  {country.name}
                </div>
                <div className={`text-xs ${
                  selectedCountry === country.code 
                    ? 'text-blue-300' 
                    : 'text-[var(--text-muted)]'
                }`}>
                  {country.currency}
                </div>
                
                {/* 数据状态指示器 */}
                {multiCountryData && (
                  <div className="absolute top-1 right-1">
                    <div className={`w-2 h-2 rounded-full ${
                      hasData ? 'bg-green-400' : 'bg-gray-400'
                    }`} title={hasData ? '有数据' : '无数据'} />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
      
      {/* 数据状态说明 */}
      {multiCountryData && (
        <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>有数据</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span>无数据</span>
          </div>
          <div className="flex-1"></div>
          <div>
            数据更新时间: {new Date(multiCountryData.lastUpdate).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  )
}