'use client'

import { useMemo, useCallback } from 'react'
import { useLiveGraph, LiveGraphNode, CoverageStatus } from '@/lib/hooks/use-live-graph'
import { useSessionGuidance } from '@/lib/hooks/use-session-guidance'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sparkle,
  Lightbulb,
  CheckCircle,
  Circle,
  CircleDashed,
  ArrowClockwise,
  Play,
  Pause,
  Clock,
  CircleNotch,
} from 'phosphor-react'
import { cn } from '@/lib/utils'

interface SessionGuidePanelProps {
  campaignId: string
  sessionId: string
  recentTranscript?: string
  expertName?: string
  sessionNumber?: number
  goal?: string
  className?: string
}

// Color scheme for coverage status
const statusColors: Record<CoverageStatus, { bg: string; text: string; border: string; icon: string }> = {
  covered: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'text-emerald-500',
  },
  mentioned: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'text-amber-500',
  },
  not_discussed: {
    bg: 'bg-zinc-50',
    text: 'text-zinc-500',
    border: 'border-zinc-200',
    icon: 'text-zinc-400',
  },
}

function StatusIcon({ status }: { status: CoverageStatus }) {
  const colors = statusColors[status]

  switch (status) {
    case 'covered':
      return <CheckCircle className={cn('w-3.5 h-3.5', colors.icon)} weight="fill" />
    case 'mentioned':
      return <Circle className={cn('w-3.5 h-3.5', colors.icon)} weight="fill" />
    case 'not_discussed':
      return <CircleDashed className={cn('w-3.5 h-3.5', colors.icon)} weight="bold" />
  }
}

function TopicCard({ node }: { node: LiveGraphNode }) {
  const colors = statusColors[node.coverageStatus]

  return (
    <div className="relative group">
      <div
        className={cn(
          'px-2.5 py-1.5 rounded-md border text-xs cursor-help',
          colors.bg,
          colors.border,
          'hover:ring-2 hover:ring-offset-1 hover:ring-primary/20 transition-all'
        )}
      >
        <div className="flex items-center gap-1.5">
          <StatusIcon status={node.coverageStatus} />
          <span className={cn('font-medium truncate', colors.text)}>
            {node.label}
          </span>
        </div>
      </div>

      {/* Tooltip */}
      {node.description && (
        <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-zinc-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
          <div className="font-semibold mb-1.5">{node.label}</div>
          <div className="text-zinc-300 leading-relaxed line-clamp-6">
            {node.description}
          </div>
          {/* Arrow */}
          <div className="absolute left-4 bottom-0 translate-y-full border-8 border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  )
}

export function SessionGuidePanel({
  campaignId,
  sessionId,
  recentTranscript,
  className,
}: SessionGuidePanelProps) {
  // Data hooks
  const {
    nodes,
    isLoading: isLoadingGraph,
    coveredCount,
    mentionedCount,
    notDiscussedCount,
    coveragePercentage,
  } = useLiveGraph({ campaignId })

  const {
    guidance,
    isLoading: isLoadingGuidance,
    lastRefreshTime,
    autoRefreshEnabled,
    toggleAutoRefresh,
    refresh,
  } = useSessionGuidance({
    sessionId,
    recentTranscript,
  })

  // Group nodes by coverage status
  const groupedNodes = useMemo(() => {
    const groups: Record<CoverageStatus, LiveGraphNode[]> = {
      covered: [],
      mentioned: [],
      not_discussed: [],
    }

    nodes.forEach(node => {
      groups[node.coverageStatus].push(node)
    })

    return groups
  }, [nodes])

  // Format last refresh time
  const formatLastRefresh = useCallback(() => {
    if (!lastRefreshTime) return null
    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - lastRefreshTime.getTime()) / 1000)
    if (diffSeconds < 60) return `${diffSeconds}s ago`
    const diffMinutes = Math.floor(diffSeconds / 60)
    return `${diffMinutes}m ago`
  }, [lastRefreshTime])

  const isLoading = isLoadingGraph || isLoadingGuidance

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <CardHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
            <Sparkle className="w-4 h-4" weight="fill" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold">Session Guide</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">AI-Powered Assistance</p>
              {lastRefreshTime && (
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" weight="bold" />
                  {formatLastRefresh()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Auto-refresh toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              autoRefreshEnabled ? 'text-emerald-600' : 'text-muted-foreground'
            )}
            onClick={toggleAutoRefresh}
            title={autoRefreshEnabled ? 'Auto-refresh ON (2.5 min)' : 'Auto-refresh OFF'}
          >
            {autoRefreshEnabled ? (
              <Play className="w-3.5 h-3.5" weight="fill" />
            ) : (
              <Pause className="w-3.5 h-3.5" weight="bold" />
            )}
          </Button>
          {/* Manual refresh */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={refresh}
            disabled={isLoading}
            title="Refresh now"
          >
            <ArrowClockwise className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} weight="bold" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading State */}
        {isLoading && !guidance && (
          <div className="flex items-center justify-center py-8">
            <CircleNotch className="w-5 h-5 animate-spin text-primary" weight="bold" />
          </div>
        )}

        {/* Topic Coverage */}
        {nodes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <Sparkle className="w-3 h-3" weight="bold" />
              Topic Coverage ({coveragePercentage}%)
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(coveredCount / nodes.length) * 100}%` }}
                  />
                  <div
                    className="bg-amber-400 transition-all duration-500"
                    style={{ width: `${(mentionedCount / nodes.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 mt-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Covered ({coveredCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-muted-foreground">Mentioned ({mentionedCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  <span className="text-muted-foreground">To discuss ({notDiscussedCount})</span>
                </div>
              </div>
            </div>

            {/* Topics grouped by status */}
            <div className="space-y-3">
              {/* Still to Cover - show first as priority */}
              {groupedNodes.not_discussed.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-medium text-muted-foreground mb-1.5">
                    Still to Cover
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {groupedNodes.not_discussed.map(node => (
                      <TopicCard key={node.id} node={node} />
                    ))}
                  </div>
                </div>
              )}

              {/* Being Discussed */}
              {groupedNodes.mentioned.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-medium text-muted-foreground mb-1.5">
                    Being Discussed
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {groupedNodes.mentioned.map(node => (
                      <TopicCard key={node.id} node={node} />
                    ))}
                  </div>
                </div>
              )}

              {/* Covered */}
              {groupedNodes.covered.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-medium text-muted-foreground mb-1.5">
                    Covered
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {groupedNodes.covered.map(node => (
                      <TopicCard key={node.id} node={node} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contextual Tip */}
        {guidance?.contextualTip && (
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <Lightbulb className="w-3 h-3" weight="bold" />
              Contextual Tip
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-md p-3">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {guidance.contextualTip}
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !guidance && nodes.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            <CircleDashed className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" weight="bold" />
            <p>Start the session to receive AI guidance</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
