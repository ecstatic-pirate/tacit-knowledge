'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Plus, ChatCircle, Trash, PencilSimple, Check, X } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import type { Conversation } from '@/types'

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (conversation: Conversation) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title || 'New conversation')
  }

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* New conversation button */}
      <div className="p-4 border-b border-border">
        <Button onClick={onNew} className="w-full gap-2" variant="outline">
          <Plus className="w-4 h-4" weight="bold" />
          New conversation
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeId}
                isEditing={conversation.id === editingId}
                editTitle={editTitle}
                onSelect={() => onSelect(conversation)}
                onDelete={() => onDelete(conversation.id)}
                onStartEdit={() => startEditing(conversation)}
                onEditChange={setEditTitle}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  isEditing: boolean
  editTitle: string
  onSelect: () => void
  onDelete: () => void
  onStartEdit: () => void
  onEditChange: (value: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}

function ConversationItem({
  conversation,
  isActive,
  isEditing,
  editTitle,
  onSelect,
  onDelete,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
}: ConversationItemProps) {
  const title = conversation.title || 'New conversation'

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 p-2 rounded-lg bg-secondary">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit()
            if (e.key === 'Escape') onCancelEdit()
          }}
          className="flex-1 bg-background px-2 py-1 text-sm rounded border border-input focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
        <button
          onClick={onSaveEdit}
          className="p-1 hover:bg-background rounded text-green-600"
        >
          <Check className="w-4 h-4" weight="bold" />
        </button>
        <button
          onClick={onCancelEdit}
          className="p-1 hover:bg-background rounded text-muted-foreground"
        >
          <X className="w-4 h-4" weight="bold" />
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-secondary' : 'hover:bg-secondary/50'
      )}
    >
      <ChatCircle
        className={cn(
          'w-4 h-4 flex-shrink-0',
          isActive ? 'text-foreground' : 'text-muted-foreground'
        )}
        weight={isActive ? 'fill' : 'regular'}
      />
      <span className="flex-1 text-sm truncate">{title}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStartEdit()
          }}
          className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
        >
          <PencilSimple className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1 hover:bg-background rounded text-muted-foreground hover:text-destructive"
        >
          <Trash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
