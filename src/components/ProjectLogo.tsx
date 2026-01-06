import { Favicon } from './Favicon'

interface ProjectLogoProps {
  logoUrl?: string
  website?: string
  name: string
  size?: number
}

export function ProjectLogo({ logoUrl, website, name, size = 36 }: ProjectLogoProps) {
  if (!logoUrl && !website) return null

  return (
    <div
      className="rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-secondary)] flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {logoUrl ? (
        // 自定义 Logo
        logoUrl.trim().startsWith('<svg') ? (
          // SVG 代码
          <div
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: logoUrl }}
          />
        ) : (
          // 图片 URL
          <img
            src={logoUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )
      ) : website ? (
        // 使用 Favicon
        <Favicon url={website} name={name} size={size} />
      ) : null}
    </div>
  )
}
