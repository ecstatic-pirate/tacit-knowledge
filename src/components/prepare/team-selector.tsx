'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { UsersThree, Plus, CircleNotch, Check } from 'phosphor-react'

interface Team {
  id: string
  name: string
  description: string | null
  color: string | null
}

interface TeamSelectorProps {
  value?: string
  onChange: (teamId: string | undefined) => void
  label?: string
  error?: string
  hint?: string
  required?: boolean
  allowCreate?: boolean
  className?: string
  // Optional pre-loaded teams (for instant display)
  teams?: Team[]
  isLoading?: boolean
  onTeamsChange?: (teams: Team[]) => void
}

export function TeamSelector({
  value,
  onChange,
  label = 'Team',
  error,
  hint,
  required = false,
  allowCreate = true,
  className,
  teams: externalTeams,
  isLoading: externalLoading,
  onTeamsChange,
}: TeamSelectorProps) {
  const [internalTeams, setInternalTeams] = useState<Team[]>([])
  const [internalLoading, setInternalLoading] = useState(externalTeams === undefined)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')

  // Use external teams if provided, otherwise use internal state
  const teams = externalTeams ?? internalTeams
  const isLoading = externalLoading ?? internalLoading
  const setTeams = onTeamsChange ?? setInternalTeams

  // Only fetch teams if not provided externally
  useEffect(() => {
    if (externalTeams !== undefined) return // Teams provided externally

    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams')
        const data = await response.json()
        if (data.success) {
          setInternalTeams(data.teams)
        }
      } catch (err) {
        console.error('Failed to fetch teams:', err)
      } finally {
        setInternalLoading(false)
      }
    }

    fetchTeams()
  }, [externalTeams])

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim() }),
      })
      const data = await response.json()
      if (data.success && data.team) {
        setTeams([...teams, data.team])
        onChange(data.team.id)
        setShowCreateForm(false)
        setNewTeamName('')
      }
    } catch (err) {
      console.error('Failed to create team:', err)
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div className="flex items-center justify-center py-8">
          <CircleNotch className="w-5 h-5 animate-spin text-muted-foreground" weight="bold" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* Radio button grid */}
      <div className="grid grid-cols-2 gap-2">
        {teams.map(team => {
          const isSelected = value === team.id
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onChange(team.id)}
              className={cn(
                'relative flex items-center gap-2.5 px-3 py-2.5 rounded-md border text-left transition-all',
                'hover:border-primary/50 hover:bg-accent/30',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-input bg-transparent'
              )}
            >
              {/* Radio indicator */}
              <div
                className={cn(
                  'flex items-center justify-center w-4 h-4 rounded-full border-[1.5px] shrink-0 transition-colors',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40'
                )}
              >
                {isSelected && (
                  <Check className="w-2.5 h-2.5 text-primary-foreground" weight="bold" />
                )}
              </div>

              {/* Team info */}
              <div className="flex items-center gap-1.5 min-w-0">
                {team.color ? (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: team.color }}
                  />
                ) : (
                  <UsersThree className="w-3.5 h-3.5 text-muted-foreground shrink-0" weight="bold" />
                )}
                <span className={cn(
                  'text-sm font-medium truncate',
                  isSelected ? 'text-foreground' : 'text-foreground/80'
                )}>
                  {team.name}
                </span>
              </div>
            </button>
          )
        })}

        {/* Create new team button */}
        {allowCreate && !showCreateForm && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-dashed text-left transition-all',
              'border-input hover:border-primary/50 hover:bg-accent/30'
            )}
          >
            <div className="flex items-center justify-center w-4 h-4 rounded-full border-[1.5px] border-dashed border-muted-foreground/40 shrink-0">
              <Plus className="w-2.5 h-2.5 text-muted-foreground" weight="bold" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">New team</span>
          </button>
        )}
      </div>

      {/* Create team form */}
      {allowCreate && showCreateForm && (
        <div className="flex gap-2 p-3 rounded-lg border border-input bg-accent/20">
          <input
            type="text"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            placeholder="Enter team name..."
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreateTeam()
              } else if (e.key === 'Escape') {
                setShowCreateForm(false)
                setNewTeamName('')
              }
            }}
          />
          <button
            type="button"
            onClick={handleCreateTeam}
            disabled={!newTeamName.trim() || isCreating}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors hover:bg-primary/90"
          >
            {isCreating ? (
              <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
            ) : (
              'Add'
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false)
              setNewTeamName('')
            }}
            className="h-9 px-3 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Empty state */}
      {teams.length === 0 && !showCreateForm && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No teams yet. Create your first team to get started.
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
