'use client'

import { useState, useRef, useEffect } from 'react'
import { SortAscending, SortDescending, CaretDown, Check } from 'phosphor-react'
import { cn } from '@/lib/utils'

export interface SortOption {
  value: string
  label: string
}

interface SortDropdownProps {
  options: SortOption[]
  value: string
  direction: 'asc' | 'desc'
  onChange: (value: string, direction: 'asc' | 'desc') => void
  className?: string
}

export function SortDropdown({
  options,
  value,
  direction,
  onChange,
  className,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleOptionClick = (optionValue: string) => {
    if (optionValue === value) {
      // Toggle direction if same option selected
      onChange(value, direction === 'asc' ? 'desc' : 'asc')
    } else {
      // New option, default to descending for counts, ascending for names
      const isCountField = optionValue.includes('count') || optionValue.includes('coverage')
      onChange(optionValue, isCountField ? 'desc' : 'asc')
    }
    setIsOpen(false)
  }

  const toggleDirection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value, direction === 'asc' ? 'desc' : 'asc')
  }

  const SortIcon = direction === 'asc' ? SortAscending : SortDescending
  const currentOption = options.find(o => o.value === value)

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors text-sm"
        aria-label="Sort options"
        aria-expanded={isOpen}
      >
        <SortIcon className="w-4 h-4" weight="bold" />
        <span className="hidden sm:inline">{currentOption?.label || 'Sort'}</span>
        <CaretDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} weight="bold" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Sort direction toggle */}
          <div className="px-3 py-2 border-b border-border">
            <button
              type="button"
              onClick={toggleDirection}
              className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Order</span>
              <span className="flex items-center gap-1.5 text-xs">
                {direction === 'asc' ? (
                  <>
                    <SortAscending className="w-3.5 h-3.5" weight="bold" />
                    Ascending
                  </>
                ) : (
                  <>
                    <SortDescending className="w-3.5 h-3.5" weight="bold" />
                    Descending
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Sort options */}
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionClick(option.value)}
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2 text-sm transition-colors',
                  value === option.value
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                {option.label}
                {value === option.value && (
                  <Check className="w-4 h-4" weight="bold" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
