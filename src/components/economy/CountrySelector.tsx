import { Globe } from 'lucide-react'
import { getSupportedCountries } from '../../utils/multiCountryEconomicDataApi'

interface CountrySelectorProps {
  selectedCountry: string
  onCountryChange: (country: string) => void
}

export function CountrySelector({ selectedCountry, onCountryChange }: CountrySelectorProps) {
  const supportedCountries = getSupportedCountries()
  const currentCountry = supportedCountries.find(c => c.code === selectedCountry) || supportedCountries[0]
  
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
        {supportedCountries.map((country) => (
          <button
            key={country.code}
            onClick={() => onCountryChange(country.code)}
            className={`p-3 rounded-xl border transition-all ${
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
            </div>
          </button>
        ))}
      </div>
      
      {selectedCountry !== 'US' && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <span className="font-medium">数据开发中</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {currentCountry.name}的经济数据正在开发中，目前仅支持美国数据。加密货币市场数据对所有地区可用。
          </p>
        </div>
      )}
    </div>
  )
}