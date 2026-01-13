'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Folder, Plus, CircleNotch, CaretDown } from 'phosphor-react'

interface Project {
  id: string
  name: string
  description: string | null
  status: string | null
}

interface ProjectSelectorProps {
  value?: string
  onChange: (projectId: string | undefined) => void
  label?: string
  error?: string
  hint?: string
  required?: boolean
  allowCreate?: boolean
  className?: string
}

export function ProjectSelector({
  value,
  onChange,
  label = 'Project',
  error,
  hint,
  required = false,
  allowCreate = true,
  className,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        const data = await response.json()
        if (data.success) {
          setProjects(data.projects)
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim() }),
      })
      const data = await response.json()
      if (data.success && data.project) {
        setProjects(prev => [...prev, data.project])
        onChange(data.project.id)
        setShowCreateForm(false)
        setNewProjectName('')
        setIsOpen(false)
      }
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const selectedProject = projects.find(p => p.id === value)

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
          <span className={cn('flex items-center gap-2', !selectedProject && 'text-muted-foreground')}>
            <Folder className="w-4 h-4" weight="bold" />
            {selectedProject ? selectedProject.name : 'Select a project'}
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
                  No project selected
                </button>
              )}

              {projects.map(project => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    onChange(project.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent/50',
                    value === project.id && 'bg-accent'
                  )}
                >
                  <div className="font-medium">{project.name}</div>
                  {project.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {project.description}
                    </div>
                  )}
                </button>
              ))}

              {projects.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No projects found
                </div>
              )}

              {allowCreate && !showCreateForm && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent/50 flex items-center gap-2 border-t border-input mt-1 pt-2"
                >
                  <Plus className="w-4 h-4" weight="bold" />
                  Create new project
                </button>
              )}

              {allowCreate && showCreateForm && (
                <div className="px-3 py-2 border-t border-input mt-1 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      placeholder="Project name"
                      className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleCreateProject()
                        } else if (e.key === 'Escape') {
                          setShowCreateForm(false)
                          setNewProjectName('')
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateProject}
                      disabled={!newProjectName.trim() || isCreating}
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
