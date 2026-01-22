'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useLiveGraph, LiveGraphNode, CoverageStatus } from '@/lib/hooks/use-live-graph'
import { useSessionGuidance } from '@/lib/hooks/use-session-guidance'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sparkle,
  CheckCircle,
  Circle,
  CircleDashed,
  ArrowClockwise,
  CircleNotch,
  ChatCircle,
  CaretRight,
  CaretDown,
  ArrowRight,
  ListBullets,
  X,
  Crosshair,
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

function StatusIcon({ status, size = 'sm' }: { status: CoverageStatus; size?: 'sm' | 'xs' }) {
  const colors = statusColors[status]
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'

  switch (status) {
    case 'covered':
      return <CheckCircle className={cn(sizeClass, colors.icon)} weight="fill" />
    case 'mentioned':
      return <Circle className={cn(sizeClass, colors.icon)} weight="fill" />
    case 'not_discussed':
      return <CircleDashed className={cn(sizeClass, colors.icon)} weight="bold" />
  }
}

interface TopicChipProps {
  node: LiveGraphNode
  isSelected?: boolean
  onClick?: (node: LiveGraphNode) => void
}

function TopicChip({ node, isSelected, onClick }: TopicChipProps) {
  const colors = statusColors[node.coverageStatus]
  const isClickable = !!onClick

  return (
    <button
      type="button"
      onClick={() => onClick?.(node)}
      disabled={!isClickable}
      className={cn(
        'px-2 py-1 rounded-md border text-xs inline-flex items-center gap-1.5 transition-all',
        colors.bg,
        colors.border,
        isClickable && 'cursor-pointer hover:ring-2 hover:ring-primary/30 hover:ring-offset-1',
        isSelected && 'ring-2 ring-primary ring-offset-1 bg-primary/10',
        !isClickable && 'cursor-default'
      )}
    >
      <StatusIcon status={node.coverageStatus} size="xs" />
      <span className={cn('font-medium', isSelected ? 'text-primary' : colors.text)}>{node.label}</span>
    </button>
  )
}

// Progress ring component
function ProgressRing({ percentage, size = 40 }: { percentage: number; size?: number }) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-foreground">{percentage}%</span>
      </div>
    </div>
  )
}

export function SessionGuidePanel({
  campaignId,
  sessionId,
  recentTranscript,
  className,
}: SessionGuidePanelProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isMoreQuestionsOpen, setIsMoreQuestionsOpen] = useState(false)
  const [isTopicsOpen, setIsTopicsOpen] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)

  // Data hooks
  const {
    nodes,
    isLoading: isLoadingGraph,
    coveredCount,
    coveragePercentage,
  } = useLiveGraph({ campaignId })

  // Find the selected topic's label for the API call
  const selectedTopic = useMemo(() =>
    nodes.find(n => n.id === selectedTopicId),
    [nodes, selectedTopicId]
  )

  const {
    guidance,
    isLoading: isLoadingGuidance,
    refresh,
  } = useSessionGuidance({
    sessionId,
    recentTranscript,
    focusTopic: selectedTopic?.label,
  })

  // Handle topic selection
  const handleTopicClick = useCallback((node: LiveGraphNode) => {
    if (selectedTopicId === node.id) {
      // Deselect if clicking the same topic
      setSelectedTopicId(null)
    } else {
      setSelectedTopicId(node.id)
      setCurrentQuestionIndex(0) // Reset question index when topic changes
    }
  }, [selectedTopicId])

  const clearTopicSelection = useCallback(() => {
    setSelectedTopicId(null)
    setCurrentQuestionIndex(0)
  }, [])

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

  // Get current topic being discussed
  const currentTopic = useMemo(() => {
    // First check for mentioned topics (actively being discussed)
    if (groupedNodes.mentioned.length > 0) {
      return groupedNodes.mentioned[0]
    }
    // Fall back to first not discussed topic
    if (groupedNodes.not_discussed.length > 0) {
      return groupedNodes.not_discussed[0]
    }
    return null
  }, [groupedNodes])

  // Questions management
  const questions = guidance?.suggestedQuestions || []

  // Reset index when questions change and current index is out of bounds
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= questions.length) {
      setCurrentQuestionIndex(0)
    }
  }, [questions.length, currentQuestionIndex])

  const currentQuestion = questions[currentQuestionIndex]

  // Track remaining questions with their original indices
  const remainingQuestionsWithIndices = useMemo(() =>
    questions
      .map((question, index) => ({ question, index }))
      .filter(item => item.index !== currentQuestionIndex),
    [questions, currentQuestionIndex]
  )

  const handleSkipQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev =>
      prev < questions.length - 1 ? prev + 1 : 0
    )
  }, [questions.length])

  const handleSelectQuestion = useCallback((originalIndex: number) => {
    setCurrentQuestionIndex(originalIndex)
    setIsMoreQuestionsOpen(false)
  }, [])

  const isLoading = isLoadingGraph || isLoadingGuidance

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      {/* Minimal Header */}
      <CardHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Sparkle className="w-4 h-4 text-primary" weight="fill" />
          <h3 className="text-sm font-semibold">Session Guide</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={refresh}
          disabled={isLoading}
          title="Refresh guidance"
        >
          <ArrowClockwise className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} weight="bold" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {/* Loading State */}
        {isLoading && !guidance && !nodes.length && (
          <div className="flex items-center justify-center py-12">
            <CircleNotch className="w-5 h-5 animate-spin text-primary" weight="bold" />
          </div>
        )}

        {/* Hero Question Section */}
        {currentQuestion && (
          <div className="p-4 bg-primary/5 border-b border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ChatCircle className="w-4 h-4 text-primary" weight="fill" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Ask Next</span>
              </div>
              {selectedTopic && (
                <button
                  onClick={clearTopicSelection}
                  className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
                >
                  <Crosshair className="w-3 h-3" weight="bold" />
                  <span className="max-w-[120px] truncate">{selectedTopic.label}</span>
                  <X className="w-3 h-3" weight="bold" />
                </button>
              )}
            </div>
            <div className="bg-white rounded-lg border border-primary/20 p-4 shadow-sm">
              <p className="text-sm text-foreground leading-relaxed mb-3">
                "{currentQuestion}"
              </p>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={handleSkipQuestion}
                >
                  Skip
                  <ArrowRight className="w-3 h-3" weight="bold" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Progress + Current Topic */}
        {nodes.length > 0 && (
          <div className="px-4 py-3 border-b flex items-center gap-4">
            <ProgressRing percentage={coveragePercentage} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground mb-0.5">
                {coveredCount}/{nodes.length} topics covered
              </div>
              {currentTopic && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Now:</span>
                  <TopicChip
                    node={currentTopic}
                    onClick={handleTopicClick}
                    isSelected={selectedTopicId === currentTopic.id}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsible More Questions Section */}
        {remainingQuestionsWithIndices.length > 0 && (
          <div className="border-b">
            <button
              onClick={() => setIsMoreQuestionsOpen(!isMoreQuestionsOpen)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isMoreQuestionsOpen ? (
                  <CaretDown className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                ) : (
                  <CaretRight className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                )}
                <ChatCircle className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                <span className="text-xs font-medium text-muted-foreground">
                  More questions ({remainingQuestionsWithIndices.length})
                </span>
              </div>
            </button>
            {isMoreQuestionsOpen && (
              <div className="px-4 pb-3 space-y-2">
                {remainingQuestionsWithIndices.map(({ question, index }) => (
                  <button
                    key={index}
                    onClick={() => handleSelectQuestion(index)}
                    className="w-full text-left p-2.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <p className="text-xs text-foreground/70 group-hover:text-foreground leading-relaxed line-clamp-2">
                      "{question}"
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Collapsible Topics Section */}
        {nodes.length > 0 && (
          <div>
            <button
              onClick={() => setIsTopicsOpen(!isTopicsOpen)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isTopicsOpen ? (
                  <CaretDown className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                ) : (
                  <CaretRight className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                )}
                <ListBullets className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                <span className="text-xs font-medium text-muted-foreground">
                  All topics ({nodes.length})
                </span>
              </div>
              {/* Mini status indicators */}
              <div className="flex items-center gap-1.5">
                {groupedNodes.covered.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                    <CheckCircle className="w-2.5 h-2.5" weight="fill" />
                    {groupedNodes.covered.length}
                  </span>
                )}
                {groupedNodes.mentioned.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                    <Circle className="w-2.5 h-2.5" weight="fill" />
                    {groupedNodes.mentioned.length}
                  </span>
                )}
                {groupedNodes.not_discussed.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                    <CircleDashed className="w-2.5 h-2.5" weight="bold" />
                    {groupedNodes.not_discussed.length}
                  </span>
                )}
              </div>
            </button>
            {isTopicsOpen && (
              <div className="px-4 pb-3 space-y-3">
                {/* Hint about clicking topics */}
                <p className="text-[10px] text-muted-foreground/70 italic">
                  Click a topic to get questions about it
                </p>

                {/* Still to Cover */}
                {groupedNodes.not_discussed.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Still to Cover
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {groupedNodes.not_discussed.map(node => (
                        <TopicChip
                          key={node.id}
                          node={node}
                          onClick={handleTopicClick}
                          isSelected={selectedTopicId === node.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Being Discussed */}
                {groupedNodes.mentioned.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Being Discussed
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {groupedNodes.mentioned.map(node => (
                        <TopicChip
                          key={node.id}
                          node={node}
                          onClick={handleTopicClick}
                          isSelected={selectedTopicId === node.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Covered */}
                {groupedNodes.covered.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Covered
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {groupedNodes.covered.map(node => (
                        <TopicChip
                          key={node.id}
                          node={node}
                          onClick={handleTopicClick}
                          isSelected={selectedTopicId === node.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !guidance && nodes.length === 0 && (
          <div className="text-center text-muted-foreground py-12 px-4">
            <CircleDashed className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" weight="bold" />
            <p className="text-sm">Start the session to receive AI guidance</p>
          </div>
        )}

        {/* No questions state but has topics */}
        {!isLoading && !currentQuestion && nodes.length > 0 && (
          <div className="p-4 bg-muted/30 border-b">
            <div className="flex items-center gap-2 mb-2">
              <ChatCircle className="w-4 h-4 text-muted-foreground" weight="bold" />
              <span className="text-xs font-medium text-muted-foreground">Questions</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Continue the conversation. AI will suggest questions based on the discussion.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
