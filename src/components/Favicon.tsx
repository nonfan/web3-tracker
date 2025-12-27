import { useState } from 'react'
import { getFaviconUrl, getGoogleFaviconUrl } from '../utils/favicon'

interface Props {
  url: string
  name: string
  size?: number
}

export function Favicon({ url, name, size = 32 }: Props) {
  const [fallbackLevel, setFallbackLevel] = useState(0)
  
  const getFallbackUrl = () => {
    switch (fallbackLevel) {
      case 0:
        return getFaviconUrl(url) // favicon.im
      case 1:
        return getGoogleFaviconUrl(url) // Google 128px
      default:
        return null
    }
  }
  
  const faviconUrl = getFallbackUrl()

  if (!faviconUrl) {
    // 显示首字母作为占位
    return (
      <div 
        className="rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={faviconUrl}
      alt={`${name} logo`}
      width={size}
      height={size}
      className="rounded-lg object-cover shrink-0"
      style={{ imageRendering: 'auto' }}
      onError={() => setFallbackLevel(prev => prev + 1)}
      loading="lazy"
    />
  )
}
