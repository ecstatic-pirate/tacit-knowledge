'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '@/context/app-context'
import { ConversationList, ChatContainer, CampaignSelector } from '@/components/concierge'
import { ConciergeSkeleton } from '@/components/ui/skeleton'
import { SidebarSimple } from 'phosphor-react'
import { cn } from '@/lib/utils'
import type { Conversation, Message, MessageSource } from '@/types'
import type { Campaign } from '@/context/app-context'

export default function ConciergePage() {
  const { isLoading: appLoading, campaigns } = useApp()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [pendingSources, setPendingSources] = useState<MessageSource[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/concierge/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/concierge/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(
          (data.messages || []).map((m: Record<string, unknown>) => ({
            id: m.id as string,
            conversationId: m.conversation_id as string,
            role: m.role as 'user' | 'assistant',
            content: m.content as string,
            sources: m.sources as MessageSource[] | undefined,
            createdAt: m.created_at as string,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const handleSelectConversation = async (conversation: Conversation) => {
    // Abort any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setStreamingContent('')
    setPendingSources([])
    setActiveConversation(conversation)
    await fetchMessages(conversation.id)
    // Close sidebar on mobile after selecting
    setShowSidebar(false)
  }

  const handleNewConversation = useCallback(async () => {
    try {
      const response = await fetch('/api/concierge/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (response.ok) {
        const data = await response.json()
        const newConversation: Conversation = {
          id: data.conversation.id,
          userId: data.conversation.user_id,
          orgId: data.conversation.org_id,
          title: data.conversation.title,
          createdAt: data.conversation.created_at,
          updatedAt: data.conversation.updated_at,
        }
        setConversations((prev) => [newConversation, ...prev])
        setActiveConversation(newConversation)
        setMessages([])
        setStreamingContent('')
        setPendingSources([])
        setShowSidebar(false)
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }, [])

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/concierge/conversations/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (activeConversation?.id === id) {
          setActiveConversation(null)
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const handleRenameConversation = async (id: string, title: string) => {
    try {
      const response = await fetch(`/api/concierge/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (response.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title } : c))
        )
        if (activeConversation?.id === id) {
          setActiveConversation((prev) => (prev ? { ...prev, title } : null))
        }
      }
    } catch (error) {
      console.error('Error renaming conversation:', error)
    }
  }

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeConversation || isSending) return

      // Abort any previous stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setIsSending(true)
      setStreamingContent('')
      setPendingSources([])

      // Optimistically add user message
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: activeConversation.id,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, tempUserMessage])

      try {
        const response = await fetch('/api/concierge/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeConversation.id,
            message: content,
            campaignId: selectedCampaign?.id,
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No reader available')

        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''
        let sources: MessageSource[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type === 'sources') {
                  sources = data.sources || []
                  setPendingSources(sources)
                } else if (data.type === 'delta') {
                  fullContent += data.delta
                  setStreamingContent(fullContent)
                } else if (data.type === 'done') {
                  // Replace temp user message and add assistant message
                  setMessages((prev) => {
                    const filtered = prev.filter((m) => m.id !== tempUserMessage.id)
                    return [
                      ...filtered,
                      {
                        id: data.userMessageId || tempUserMessage.id,
                        conversationId: activeConversation.id,
                        role: 'user',
                        content,
                        createdAt: new Date().toISOString(),
                      },
                      {
                        id: data.assistantMessageId || `assistant-${Date.now()}`,
                        conversationId: activeConversation.id,
                        role: 'assistant',
                        content: fullContent,
                        sources,
                        createdAt: new Date().toISOString(),
                      },
                    ]
                  })
                  setStreamingContent('')
                  setPendingSources([])

                  // Update conversation title if it was the first message
                  if (messages.length === 0) {
                    const newTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '')
                    setConversations((prev) =>
                      prev.map((c) =>
                        c.id === activeConversation.id ? { ...c, title: newTitle } : c
                      )
                    )
                    setActiveConversation((prev) =>
                      prev ? { ...prev, title: newTitle } : null
                    )
                  }
                } else if (data.type === 'error') {
                  console.error('Stream error:', data.error)
                }
              } catch {
                // Ignore parse errors for incomplete JSON
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // Stream was aborted, ignore
          return
        }
        console.error('Error sending message:', error)
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
      } finally {
        setIsSending(false)
        abortControllerRef.current = null
      }
    },
    [activeConversation, isSending, messages.length, selectedCampaign]
  )

  if (appLoading || isLoadingConversations) {
    return <ConciergeSkeleton />
  }

  return (
    <div className="h-screen flex relative">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-background min-w-0">
        {/* Header with campaign selector and sidebar toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-lg font-semibold">Concierge</h1>
            <CampaignSelector
              campaigns={campaigns}
              selectedCampaign={selectedCampaign}
              onSelect={setSelectedCampaign}
              disabled={isSending}
            />
          </div>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={cn(
              'p-2 rounded-lg hover:bg-secondary transition-colors',
              showSidebar && 'bg-secondary'
            )}
            title={showSidebar ? 'Hide conversations' : 'Show conversations'}
          >
            <SidebarSimple className="w-5 h-5" weight="bold" />
          </button>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden">
          {activeConversation ? (
            <ChatContainer
              messages={messages}
              isLoading={isSending || isLoadingMessages}
              streamingContent={streamingContent}
              onSendMessage={handleSendMessage}
              selectedCampaign={selectedCampaign}
            />
          ) : (
            <ChatContainer
              messages={[]}
              isLoading={false}
              selectedCampaign={selectedCampaign}
              onSendMessage={async (content) => {
                // Create new conversation first, then send message
                try {
                  const response = await fetch('/api/concierge/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                  })
                  if (response.ok) {
                    const data = await response.json()
                    const newConversation: Conversation = {
                      id: data.conversation.id,
                      userId: data.conversation.user_id,
                      orgId: data.conversation.org_id,
                      title: data.conversation.title,
                      createdAt: data.conversation.created_at,
                      updatedAt: data.conversation.updated_at,
                    }
                    setConversations((prev) => [newConversation, ...prev])
                    setActiveConversation(newConversation)
                    setMessages([])

                    // Now send the message with the new conversation
                    setTimeout(() => {
                      handleSendMessageWithConversation(newConversation, content)
                    }, 0)
                  }
                } catch (error) {
                  console.error('Error creating conversation:', error)
                }
              }}
              onNewConversation={handleNewConversation}
            />
          )}
        </div>
      </div>

      {/* Sidebar with conversations (right side, collapsible) */}
      <div
        className={cn(
          'border-l border-border bg-card flex-shrink-0 transition-all duration-200 overflow-hidden',
          showSidebar ? 'w-72' : 'w-0'
        )}
      >
        <div className="w-72 h-full">
          <ConversationList
            conversations={conversations}
            activeId={activeConversation?.id}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
            onRename={handleRenameConversation}
          />
        </div>
      </div>
    </div>
  )

  // Helper function to send message with a specific conversation
  function handleSendMessageWithConversation(conversation: Conversation, content: string) {
    if (isSending) return

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsSending(true)
    setStreamingContent('')
    setPendingSources([])

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: conversation.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    fetch('/api/concierge/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: conversation.id,
        message: content,
        campaignId: selectedCampaign?.id,
      }),
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No reader available')

        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''
        let sources: MessageSource[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type === 'sources') {
                  sources = data.sources || []
                  setPendingSources(sources)
                } else if (data.type === 'delta') {
                  fullContent += data.delta
                  setStreamingContent(fullContent)
                } else if (data.type === 'done') {
                  setMessages((prev) => {
                    const filtered = prev.filter((m) => m.id !== tempUserMessage.id)
                    return [
                      ...filtered,
                      {
                        id: data.userMessageId || tempUserMessage.id,
                        conversationId: conversation.id,
                        role: 'user',
                        content,
                        createdAt: new Date().toISOString(),
                      },
                      {
                        id: data.assistantMessageId || `assistant-${Date.now()}`,
                        conversationId: conversation.id,
                        role: 'assistant',
                        content: fullContent,
                        sources,
                        createdAt: new Date().toISOString(),
                      },
                    ]
                  })
                  setStreamingContent('')
                  setPendingSources([])

                  // Update conversation title
                  const newTitle = content.slice(0, 50) + (content.length > 50 ? '...' : '')
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === conversation.id ? { ...c, title: newTitle } : c
                    )
                  )
                  setActiveConversation((prev) =>
                    prev ? { ...prev, title: newTitle } : null
                  )
                } else if (data.type === 'error') {
                  console.error('Stream error:', data.error)
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      })
      .catch((error) => {
        if ((error as Error).name === 'AbortError') return
        console.error('Error sending message:', error)
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
      })
      .finally(() => {
        setIsSending(false)
        abortControllerRef.current = null
      })
  }
}
