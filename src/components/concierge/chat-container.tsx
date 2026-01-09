'use client'

import { useRef, useEffect } from 'react'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { Sparkle } from 'phosphor-react'
import type { Message } from '@/types'

interface ChatContainerProps {
  messages: Message[]
  isLoading: boolean
  streamingContent?: string
  onSendMessage: (message: string) => void
  onNewConversation?: () => void
}

export function ChatContainer({
  messages,
  isLoading,
  streamingContent,
  onSendMessage,
  onNewConversation,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const isEmpty = messages.length === 0 && !streamingContent

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState onSendMessage={onSendMessage} />
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                sources={message.sources}
              />
            ))}
            {/* Streaming message */}
            {streamingContent && (
              <ChatMessage
                role="assistant"
                content={streamingContent}
                isStreaming={true}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSend={onSendMessage}
        disabled={isLoading}
        placeholder="Ask about your captured knowledge..."
      />
    </div>
  )
}

function EmptyState({ onSendMessage }: { onSendMessage: (message: string) => void }) {
  const suggestions = [
    {
      title: "What are the key insights?",
      description: "Get a summary of the most important findings",
      query: "What are the key insights from the captured knowledge?"
    },
    {
      title: "Who knows about...?",
      description: "Find experts on specific topics",
      query: "Who are the experts and what topics do they know about?"
    },
    {
      title: "What processes are documented?",
      description: "Discover captured workflows and procedures",
      query: "What processes and workflows have been documented?"
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Sparkle className="w-8 h-8 text-primary" weight="fill" />
      </div>
      <h2 className="font-serif text-2xl font-semibold mb-2">
        Knowledge Concierge
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Ask questions about your captured knowledge. I can search through
        transcripts, insights, and your knowledge graph to find answers.
      </p>
      <div className="grid gap-3 w-full max-w-md">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSendMessage(suggestion.query)}
            className="p-4 rounded-xl border border-border/60 bg-card hover:bg-secondary/30 hover:border-border transition-colors text-left"
          >
            <p className="font-medium text-sm">{suggestion.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
