'use client'

import { useState, useRef, useEffect } from 'react'
import { MagnifyingGlass, X } from 'phosphor-react'
import { cn } from '@/lib/utils'

interface ExpandableSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function ExpandableSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: ExpandableSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  // Close on click outside (only if no search query)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !value
      ) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded, value])

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        if (value) {
          onChange('')
        } else {
          setIsExpanded(false)
          inputRef.current?.blur()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, value, onChange])

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  const handleExpand = () => {
    setIsExpanded(true)
  }

  // Keep expanded if there's a value
  const showExpanded = isExpanded || !!value

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {showExpanded ? (
        // Expanded state - full search input
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 w-64 md:w-64 transition-all duration-200">
          <MagnifyingGlass
            className="w-4 h-4 text-muted-foreground shrink-0"
            weight="bold"
          />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm outline-none min-w-0"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" weight="bold" />
            </button>
          )}
        </div>
      ) : (
        // Collapsed state - icon button
        <button
          type="button"
          onClick={handleExpand}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open search"
        >
          <MagnifyingGlass className="w-4 h-4" weight="bold" />
        </button>
      )}
    </div>
  )
}
