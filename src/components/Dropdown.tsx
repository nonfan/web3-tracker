import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import gsap from 'gsap'

interface Option {
  value: string
  label: string
}

interface Props {
  value: string
  options: Option[]
  onChange: (value: string) => void
  icon?: React.ReactNode
}

export function Dropdown({ value, options, onChange, icon }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && menuRef.current) {
      gsap.fromTo(menuRef.current,
        { opacity: 0, y: -8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [isOpen])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-all"
      >
        {icon}
        <span>{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute top-full left-0 mt-1 min-w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50"
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-2.5 text-sm text-left flex items-center justify-between gap-3 transition-colors ${
                option.value === value
                  ? 'bg-violet-500/10 text-violet-400'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
