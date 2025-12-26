import { useState } from 'react'
import { getFaviconUrl } from '../utils/favicon'
import { Globe } from 'lucide-react'

interface Props {
  url: string
  name: string
  size?: number
}

export function Favicon({ url, name, size = 32 }: Props) {
  const [error, setError] = useState(false)
  const faviconUrl = getFaviconUrl(url)

  if (!faviconUrl || error) {
    // 显示首字母作为占位
    return (
      <div 
        className="rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold"
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
      className="rounded-lg object-contain bg-white/5"
      onError={() => setError(true)}
    />
  )
}
