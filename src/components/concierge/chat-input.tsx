'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { PaperPlaneTilt, CircleNotch } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const handleSend = () => {
    if (!message.trim() || disabled) return
    onSend(message.trim())
    setMessage('')
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-3 p-4 border-t border-border bg-background">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Ask about your captured knowledge...'}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full resize-none rounded-xl border border-input bg-background px-4 py-3 pr-12',
            'text-sm placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[48px] max-h-[200px]'
          )}
        />
      </div>
      <Button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        size="icon"
        className="h-12 w-12 rounded-xl flex-shrink-0"
      >
        {disabled ? (
          <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
        ) : (
          <PaperPlaneTilt className="w-5 h-5" weight="fill" />
        )}
      </Button>
    </div>
  )
}
