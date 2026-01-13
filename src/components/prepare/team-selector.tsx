'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { UsersThree, Plus, CircleNotch, CaretDown } from 'phosphor-react'

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
}: TeamSelectorProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams')
        const data = await response.json()
        if (data.success) {
          setTeams(data.teams)
        }
      } catch (err) {
        console.error('Failed to fetch teams:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeams()
  }, [])

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
        setTeams(prev => [...prev, data.team])
        onChange(data.team.id)
        setShowCreateForm(false)
        setNewTeamName('')
        setIsOpen(false)
      }
    } catch (err) {
      console.error('Failed to create team:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const selectedTeam = teams.find(t => t.id === value)

  if (isLoading) {
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div className="flex h-9 w-full items-center justify-center rounded-md border border-input bg-transparent">
          <CircleNotch className="w-4 h-4 animate-spin text-muted-foreground" weight="bold" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
            'hover:bg-accent/50',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
        >
          <span className={cn('flex items-center gap-2', !selectedTeam && 'text-muted-foreground')}>
            <UsersThree className="w-4 h-4" weight="bold" />
            {selectedTeam ? selectedTeam.name : 'Select a team'}
          </span>
          <CaretDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} weight="bold" />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
            <div className="max-h-60 overflow-auto py-1">
              {!required && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined)
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent/50 text-muted-foreground"
                >
                  No team selected
                </button>
              )}

              {teams.map(team => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    onChange(team.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent/50 flex items-center gap-2',
                    value === team.id && 'bg-accent'
                  )}
                >
                  {team.color && (
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: team.color }}
                    />
                  )}
                  <div>
                    <div className="font-medium">{team.name}</div>
                    {team.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {team.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {teams.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No teams found
                </div>
              )}

              {allowCreate && !showCreateForm && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent/50 flex items-center gap-2 border-t border-input mt-1 pt-2"
                >
                  <Plus className="w-4 h-4" weight="bold" />
                  Create new team
                </button>
              )}

              {allowCreate && showCreateForm && (
                <div className="px-3 py-2 border-t border-input mt-1 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      placeholder="Team name"
                      className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 text-sm"
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
                      className="h-8 px-3 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50"
                    >
                      {isCreating ? (
                        <CircleNotch className="w-4 h-4 animate-spin" weight="bold" />
                      ) : (
                        'Add'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
