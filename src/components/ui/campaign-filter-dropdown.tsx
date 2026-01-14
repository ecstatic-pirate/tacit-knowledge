'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Funnel, CaretDown, Check, User, FolderSimple } from 'phosphor-react'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/context/app-context'

interface CampaignFilterDropdownProps {
  campaigns: Campaign[]
  value: string
  onChange: (campaignId: string) => void
  className?: string
}

export function CampaignFilterDropdown({
  campaigns,
  value,
  onChange,
  className,
}: CampaignFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Group campaigns by type
  const { personCampaigns, projectCampaigns } = useMemo(() => ({
    personCampaigns: campaigns.filter(c => c.subjectType === 'person'),
    projectCampaigns: campaigns.filter(c => c.subjectType === 'project'),
  }), [campaigns])

  const selectedCampaign = value === 'all'
    ? null
    : campaigns.find(c => c.id === value)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSelect = (campaignId: string) => {
    onChange(campaignId)
    setIsOpen(false)
  }

  const getDisplayLabel = () => {
    if (value === 'all') return 'All Campaigns'
    return selectedCampaign?.name || 'Filter'
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors text-sm"
        aria-label="Filter campaigns"
        aria-expanded={isOpen}
      >
        <Funnel className="w-4 h-4" weight="bold" />
        <span className="hidden sm:inline max-w-[150px] truncate">
          {getDisplayLabel()}
        </span>
        <CaretDown
          className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')}
          weight="bold"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto py-1">
            {/* All Campaigns option */}
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2 text-sm transition-colors',
                value === 'all'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              All Campaigns
              {value === 'all' && <Check className="w-4 h-4" weight="bold" />}
            </button>

            {/* People section */}
            {personCampaigns.length > 0 && (
              <>
                <div className="px-3 py-1.5 mt-1 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <User className="w-3 h-3" weight="bold" />
                    People
                  </div>
                </div>
                {personCampaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => handleSelect(campaign.id)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 text-sm transition-colors',
                      campaign.id === value
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    )}
                  >
                    <span className="truncate">{campaign.name}</span>
                    {campaign.id === value && (
                      <Check className="w-4 h-4 flex-shrink-0" weight="bold" />
                    )}
                  </button>
                ))}
              </>
            )}

            {/* Projects section */}
            {projectCampaigns.length > 0 && (
              <>
                <div className="px-3 py-1.5 mt-1 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <FolderSimple className="w-3 h-3" weight="bold" />
                    Projects
                  </div>
                </div>
                {projectCampaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => handleSelect(campaign.id)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 text-sm transition-colors',
                      campaign.id === value
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    )}
                  >
                    <span className="truncate">{campaign.name}</span>
                    {campaign.id === value && (
                      <Check className="w-4 h-4 flex-shrink-0" weight="bold" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
