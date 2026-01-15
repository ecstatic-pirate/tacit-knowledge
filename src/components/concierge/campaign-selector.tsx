'use client'

import { useState, useRef, useEffect } from 'react'
import { FolderOpen, CaretDown, Check, X, Globe } from 'phosphor-react'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/context/app-context'

interface CampaignSelectorProps {
  campaigns: Campaign[]
  selectedCampaign: Campaign | null
  onSelect: (campaign: Campaign | null) => void
  disabled?: boolean
}

export function CampaignSelector({
  campaigns,
  selectedCampaign,
  onSelect,
  disabled,
}: CampaignSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getSubjectTypeLabel = (type: string) => {
    return type === 'person' ? 'Expert' : 'Project'
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
          selectedCampaign
            ? 'border-primary/30 bg-primary/5 text-foreground'
            : 'border-border bg-card hover:bg-secondary/50 text-muted-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
      >
        {selectedCampaign ? (
          <>
            <FolderOpen className="w-4 h-4 text-primary" weight="fill" />
            <span className="max-w-[150px] truncate font-medium">
              {selectedCampaign.name}
            </span>
          </>
        ) : (
          <>
            <Globe className="w-4 h-4" weight="bold" />
            <span>All Knowledge</span>
          </>
        )}
        <CaretDown
          className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')}
          weight="bold"
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* All Knowledge option */}
          <button
            onClick={() => {
              onSelect(null)
              setIsOpen(false)
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-secondary/50 transition-colors',
              !selectedCampaign && 'bg-secondary/30'
            )}
          >
            <Globe className="w-4 h-4 text-muted-foreground" weight="bold" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">All Knowledge</p>
              <p className="text-xs text-muted-foreground">Search across all campaigns</p>
            </div>
            {!selectedCampaign && (
              <Check className="w-4 h-4 text-primary" weight="bold" />
            )}
          </button>

          {campaigns.length > 0 && (
            <div className="border-t border-border">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-secondary/20">
                Campaigns
              </div>
              <div className="max-h-60 overflow-y-auto">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => {
                      onSelect(campaign)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-secondary/50 transition-colors',
                      selectedCampaign?.id === campaign.id && 'bg-secondary/30'
                    )}
                  >
                    <FolderOpen
                      className={cn(
                        'w-4 h-4',
                        campaign.subjectType === 'person' ? 'text-blue-500' : 'text-amber-500'
                      )}
                      weight={selectedCampaign?.id === campaign.id ? 'fill' : 'regular'}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getSubjectTypeLabel(campaign.subjectType)} · {campaign.topicsCaptured} topics
                      </p>
                    </div>
                    {selectedCampaign?.id === campaign.id && (
                      <Check className="w-4 h-4 text-primary" weight="bold" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {campaigns.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No campaigns available
            </div>
          )}
        </div>
      )}

      {/* Clear selection button when campaign is selected */}
      {selectedCampaign && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelect(null)
          }}
          className="absolute -right-6 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          title="Clear selection"
        >
          <X className="w-3.5 h-3.5" weight="bold" />
        </button>
      )}
    </div>
  )
}
