import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export function DatePicker({ value, onChange, placeholder = '选择日期' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value)
    return new Date()
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  // 获取当月第一天是星期几 (0=周日, 调整为周一开始)
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  // 当月天数
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 上月天数
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days: { day: number; isCurrentMonth: boolean; date: Date }[] = []

  // 上月的日期
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    days.push({ day, isCurrentMonth: false, date: new Date(year, month - 1, day) })
  }

  // 当月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) })
  }

  // 下月的日期 (补齐6行)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selectedDate = value ? new Date(value) : null
  if (selectedDate) selectedDate.setHours(0, 0, 0, 0)

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }

  const handleSelect = (date: Date) => {
    const formatted = date.toISOString().split('T')[0]
    onChange(formatted)
    setIsOpen(false)
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[34px] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-left flex items-center gap-2 text-sm"
      >
        <Calendar className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
        <span className={`flex-1 ${value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="shrink-0 p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-xl z-50 p-3 w-72">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {year}年 {MONTHS[month]}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-[var(--input-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-xs text-[var(--text-muted)] py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map(({ day, isCurrentMonth, date }, idx) => {
              const isToday = date.getTime() === today.getTime()
              const isSelected = selectedDate && date.getTime() === selectedDate.getTime()

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(date)}
                  className={`
                    w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all
                    ${!isCurrentMonth ? 'text-[var(--text-muted)] opacity-40' : 'text-[var(--text-secondary)]'}
                    ${isToday && !isSelected ? 'ring-1 ring-violet-500/50' : ''}
                    ${isSelected 
                      ? 'bg-violet-500 text-white' 
                      : 'hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              清除
            </button>
            <button
              type="button"
              onClick={() => handleSelect(new Date())}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              今天
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
