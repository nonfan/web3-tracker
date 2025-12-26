interface Props {
  size?: number
  className?: string
}

export function Logo({ size = 40, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="greenGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>

      {/* 外圈轨道 */}
      <circle 
        cx="50" cy="50" r="42" 
        stroke="url(#greenGrad)" 
        strokeWidth="1.5" 
        fill="none"
        strokeDasharray="4 3"
        opacity="0.6"
      />

      {/* 轨道上的小点 */}
      <circle cx="15" cy="35" r="2.5" fill="#A855F7" />
      <circle cx="12" cy="55" r="2" fill="#EC4899" />
      <circle cx="20" cy="75" r="2.5" fill="#A855F7" />
      <circle cx="85" cy="30" r="2" fill="#06B6D4" />
      <circle cx="88" cy="60" r="2.5" fill="#3B82F6" />

      {/* 中心六边形网络 - 顶部 */}
      <polygon 
        points="50,18 58,23 58,33 50,38 42,33 42,23" 
        fill="url(#greenGrad)"
      />
      <path d="M50 23 L50 28 M47 25.5 L53 25.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>

      {/* 左上六边形 */}
      <polygon 
        points="32,28 40,33 40,43 32,48 24,43 24,33" 
        fill="url(#blueGrad)"
      />

      {/* 右上六边形 */}
      <polygon 
        points="68,28 76,33 76,43 68,48 60,43 60,33" 
        fill="url(#cyanGrad)"
      />

      {/* 左下六边形 */}
      <polygon 
        points="32,52 40,57 40,67 32,72 24,67 24,57" 
        fill="url(#greenGrad)"
      />

      {/* 右下六边形 */}
      <polygon 
        points="68,52 76,57 76,67 68,72 60,67 60,57" 
        fill="url(#blueGrad)"
      />

      {/* 底部六边形 */}
      <polygon 
        points="50,62 58,67 58,77 50,82 42,77 42,67" 
        fill="url(#cyanGrad)"
      />

      {/* 连接线 */}
      <g stroke="#3B82F6" strokeWidth="1" opacity="0.5">
        <line x1="42" y1="33" x2="40" y2="33" />
        <line x1="58" y1="33" x2="60" y2="33" />
        <line x1="40" y1="43" x2="42" y2="57" />
        <line x1="60" y1="43" x2="58" y2="57" />
        <line x1="40" y1="67" x2="42" y2="67" />
        <line x1="60" y1="67" x2="58" y2="67" />
      </g>

      {/* 中心放大镜 */}
      <circle 
        cx="50" cy="50" r="12" 
        stroke="#34D399" 
        strokeWidth="3" 
        fill="none"
      />
      <line 
        x1="59" y1="59" x2="68" y2="68" 
        stroke="#34D399" 
        strokeWidth="3" 
        strokeLinecap="round"
      />

      {/* 放大镜内的箭头 */}
      <path 
        d="M50 55 L50 45 M46 49 L50 45 L54 49" 
        stroke="#34D399" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
