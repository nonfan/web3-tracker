import { Globe, MessageCircle, MessageSquare } from 'lucide-react'
import type { Project } from '../../types'
import { ContextMenu } from '../ContextMenu'

interface CardLinksProps {
  project: Project
  isToken: boolean
  twitterLinkRef: React.RefObject<HTMLAnchorElement>
  onShowTwitterViewer: () => void
}

export function CardLinks({ project, isToken, twitterLinkRef, onShowTwitterViewer }: CardLinksProps) {
  return (
    <div className="flex gap-2 mb-3">
      {project.website && (
        <a
          href={project.website}
          target="_blank"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          官网
        </a>
      )}
      
      {project.twitter && (
        <ContextMenu
          items={[
            {
              label: '查看推文',
              icon: <MessageSquare className="w-4 h-4" />,
              onClick: onShowTwitterViewer
            }
          ]}
        >
          <a
            ref={twitterLinkRef}
            href={project.twitter}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Twitter
          </a>
        </ContextMenu>
      )}
      
      {/* 代币显示区块浏览器，项目显示 Discord */}
      {isToken && 'blockchain' in project && (project as any).blockchain ? (
        <a
          href={(project as any).blockchain}
          target="_blank"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          区块浏览器
        </a>
      ) : (
        project.discord && (
          <a
            href={project.discord}
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Discord
          </a>
        )
      )}
      
      {project.nftMarket && (
        <a
          href={project.nftMarket}
          target="_blank"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--input-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          NFT
        </a>
      )}
    </div>
  )
}
