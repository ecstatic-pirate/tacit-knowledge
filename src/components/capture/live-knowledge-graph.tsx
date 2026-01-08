'use client'

import { useMemo } from 'react'
import { CheckCircle, Circle, CircleDashed, Sparkle } from 'phosphor-react'
import { cn } from '@/lib/utils'
import { useLiveGraph, LiveGraphNode, CoverageStatus } from '@/lib/hooks/use-live-graph'

interface LiveKnowledgeGraphProps {
  campaignId: string
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

const statusLabels: Record<CoverageStatus, string> = {
  covered: 'Covered',
  mentioned: 'Mentioned',
  not_discussed: 'Not discussed',
}

function StatusIcon({ status }: { status: CoverageStatus }) {
  const colors = statusColors[status]

  switch (status) {
    case 'covered':
      return <CheckCircle className={cn('w-4 h-4', colors.icon)} weight="fill" />
    case 'mentioned':
      return <Circle className={cn('w-4 h-4', colors.icon)} weight="fill" />
    case 'not_discussed':
      return <CircleDashed className={cn('w-4 h-4', colors.icon)} weight="bold" />
  }
}

function TopicCard({ node }: { node: LiveGraphNode }) {
  const colors = statusColors[node.coverageStatus]

  return (
    <div
      className={cn(
        'px-3 py-2 rounded-lg border transition-all duration-300',
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-center gap-2">
        <StatusIcon status={node.coverageStatus} />
        <span className={cn('text-sm font-medium', colors.text)}>
          {node.label}
        </span>
      </div>
      {node.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {node.description}
        </p>
      )}
    </div>
  )
}

export function LiveKnowledgeGraph({ campaignId, className }: LiveKnowledgeGraphProps) {
  const {
    nodes,
    isLoading,
    coveredCount,
    mentionedCount,
    notDiscussedCount,
    coveragePercentage,
  } = useLiveGraph({ campaignId })

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

  if (isLoading) {
    return (
      <div className={cn('p-4', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-zinc-200 rounded w-1/3" />
          <div className="h-8 bg-zinc-100 rounded" />
          <div className="h-8 bg-zinc-100 rounded" />
          <div className="h-8 bg-zinc-100 rounded" />
        </div>
      </div>
    )
  }

  if (nodes.length === 0) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <CircleDashed className="w-8 h-8 text-muted-foreground mx-auto mb-2" weight="bold" />
        <p className="text-sm text-muted-foreground">
          No topics to track yet.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Topics will appear here from the expert&apos;s self-assessment.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Coverage Progress */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkle className="w-4 h-4 text-primary" weight="fill" />
            <span className="text-sm font-medium">Topic Coverage</span>
          </div>
          <span className="text-2xl font-bold text-primary">{coveragePercentage}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
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
        <div className="flex items-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Covered ({coveredCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-muted-foreground">Mentioned ({mentionedCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-zinc-300" />
            <span className="text-muted-foreground">To discuss ({notDiscussedCount})</span>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Not discussed - show first as priority */}
        {groupedNodes.not_discussed.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Still to Cover
            </h4>
            <div className="space-y-2">
              {groupedNodes.not_discussed.map(node => (
                <TopicCard key={node.id} node={node} />
              ))}
            </div>
          </div>
        )}

        {/* Mentioned - being discussed */}
        {groupedNodes.mentioned.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Being Discussed
            </h4>
            <div className="space-y-2">
              {groupedNodes.mentioned.map(node => (
                <TopicCard key={node.id} node={node} />
              ))}
            </div>
          </div>
        )}

        {/* Covered - completed */}
        {groupedNodes.covered.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Covered
            </h4>
            <div className="space-y-2">
              {groupedNodes.covered.map(node => (
                <TopicCard key={node.id} node={node} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
