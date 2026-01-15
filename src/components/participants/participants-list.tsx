'use client'

import { useState } from 'react'
import {
  User,
  Plus,
  PencilSimple,
  Trash,
  CircleNotch,
  Clock,
  CheckCircle,
  Circle,
  UsersThree,
  Link as LinkIcon,
  Copy,
  Check,
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Participant, ParticipantStatus } from '@/lib/supabase/database.types'

interface ParticipantsListProps {
  participants: Participant[]
  onAdd: () => void
  onEdit: (participant: Participant) => void
  onDelete: (participantId: string) => Promise<void>
  onStatusChange: (participantId: string, status: ParticipantStatus) => Promise<void>
  onGenerateSurveyLink?: (participant: Participant) => Promise<void>
}

const statusConfig: Record<
  ParticipantStatus,
  { label: string; color: string; icon: typeof Circle }
> = {
  not_interviewed: {
    label: 'Not Interviewed',
    color: 'bg-stone-100 text-stone-600',
    icon: Circle,
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  complete: {
    label: 'Complete',
    color: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle,
  },
}

function StatusBadge({
  status,
  onClick,
}: {
  status: ParticipantStatus
  onClick?: () => void
}) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 transition-opacity',
        config.color,
        onClick && 'hover:opacity-80 cursor-pointer'
      )}
    >
      <Icon className="w-3 h-3" weight={status === 'complete' ? 'fill' : 'bold'} />
      {config.label}
    </button>
  )
}

export function ParticipantsList({
  participants,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
  onGenerateSurveyLink,
}: ParticipantsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null)
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  const handleGenerateSurveyLink = async (participant: Participant) => {
    if (!onGenerateSurveyLink) return
    setGeneratingLinkId(participant.id)
    try {
      await onGenerateSurveyLink(participant)
      setCopiedLinkId(participant.id)
      setTimeout(() => setCopiedLinkId(null), 2000)
    } finally {
      setGeneratingLinkId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const cycleStatus = async (participant: Participant) => {
    const statusOrder: ParticipantStatus[] = [
      'not_interviewed',
      'in_progress',
      'complete',
    ]
    const currentIndex = statusOrder.indexOf(participant.status as ParticipantStatus)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

    setUpdatingStatusId(participant.id)
    try {
      await onStatusChange(participant.id, nextStatus)
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Calculate status summary
  const statusSummary = participants.reduce(
    (acc, p) => {
      const status = p.status as ParticipantStatus
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<ParticipantStatus, number>
  )

  const completeCount = statusSummary.complete || 0
  const inProgressCount = statusSummary.in_progress || 0
  const notInterviewedCount = statusSummary.not_interviewed || 0

  return (
    <div className="space-y-4">
      {/* Header with summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {completeCount} complete
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              {inProgressCount} in progress
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-stone-300" />
              {notInterviewedCount} pending
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Participant
        </Button>
      </div>

      {/* Participants list */}
      {participants.length > 0 ? (
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="border rounded-lg bg-card p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <p className="font-medium">{participant.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {participant.email && <span>{participant.email}</span>}
                    {participant.email && participant.role && <span>-</span>}
                    {participant.role && <span>{participant.role}</span>}
                    {(participant.email || participant.role) && participant.team && (
                      <span>-</span>
                    )}
                    {participant.team && <span>{participant.team}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {updatingStatusId === participant.id ? (
                  <CircleNotch
                    className="w-4 h-4 animate-spin text-muted-foreground"
                    weight="bold"
                  />
                ) : (
                  <StatusBadge
                    status={participant.status as ParticipantStatus}
                    onClick={() => cycleStatus(participant)}
                  />
                )}
                {onGenerateSurveyLink && participant.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenerateSurveyLink(participant)}
                    disabled={generatingLinkId === participant.id}
                    title={participant.survey_token ? 'Copy survey link' : 'Generate survey link'}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    {generatingLinkId === participant.id ? (
                      <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                    ) : copiedLinkId === participant.id ? (
                      <Check className="w-4 h-4 text-emerald-600" weight="bold" />
                    ) : participant.survey_token ? (
                      <Copy className="w-4 h-4" />
                    ) : (
                      <LinkIcon className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(participant)}
                >
                  <PencilSimple className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(participant.id)}
                  disabled={deletingId === participant.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deletingId === participant.id ? (
                    <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                  ) : (
                    <Trash className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg bg-card p-8 text-center text-muted-foreground">
          <UsersThree className="w-10 h-10 mx-auto mb-3" weight="bold" />
          <p className="font-medium mb-1">No participants yet</p>
          <p className="text-sm mb-4">
            Add participants who will be interviewed about this project.
          </p>
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Add First Participant
          </Button>
        </div>
      )}
    </div>
  )
}
