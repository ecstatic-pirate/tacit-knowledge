'use client'

import { cn } from '@/lib/utils'
import { User, Sparkle, CaretDown, CaretUp } from 'phosphor-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { MessageSource } from '@/types'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  sources?: MessageSource[]
  isStreaming?: boolean
}

export function ChatMessage({ role, content, sources, isStreaming }: ChatMessageProps) {
  const [showSources, setShowSources] = useState(false)
  const isUser = role === 'user'
  const hasSources = sources && sources.length > 0

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          isUser ? 'bg-secondary' : 'bg-primary'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-muted-foreground" weight="bold" />
        ) : (
          <Sparkle className="w-4 h-4 text-primary-foreground" weight="fill" />
        )}
      </div>

      {/* Message content */}
      <div className={cn('flex flex-col gap-2 max-w-[80%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-secondary text-foreground rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="text-sm prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:my-3 prose-headings:font-semibold">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}
        </div>

        {/* Sources */}
        {hasSources && !isUser && (
          <div className="w-full">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSources ? (
                <CaretUp className="w-3 h-3" weight="bold" />
              ) : (
                <CaretDown className="w-3 h-3" weight="bold" />
              )}
              {sources.length} source{sources.length !== 1 ? 's' : ''}
            </button>

            {showSources && (
              <div className="mt-2 space-y-2">
                {sources.map((source, index) => (
                  <SourceCard key={index} source={source} index={index} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SourceCard({ source, index }: { source: MessageSource; index: number }) {
  const typeLabel = {
    transcript: 'Transcript',
    insight: 'Insight',
    graph_node: 'Knowledge',
    document: 'Document',
  }[source.type]

  const typeColor = {
    transcript: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    insight: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    graph_node: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    document: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  }[source.type]

  // Extract session info from metadata
  const metadata = source.metadata || {}
  const sessionInfo = metadata.sessionTitle
    ? `Session: ${metadata.sessionTitle}`
    : metadata.sessionNumber
      ? `Session #${metadata.sessionNumber}`
      : null
  const expertInfo = metadata.expertName ? `Expert: ${metadata.expertName}` : null

  return (
    <div className="p-3 rounded-lg bg-card border border-border/40">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
          [{index + 1}]
        </span>
        <span className={cn('text-xs px-1.5 py-0.5 rounded', typeColor)}>
          {typeLabel}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(source.relevanceScore * 100)}% match
        </span>
      </div>
      <p className="text-sm font-medium">{source.title}</p>
      {(sessionInfo || expertInfo) && (
        <p className="text-xs text-muted-foreground mt-0.5">
          {[sessionInfo, expertInfo].filter(Boolean).join(' · ')}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {source.excerpt}
      </p>
    </div>
  )
}
