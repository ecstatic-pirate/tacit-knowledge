'use client'

import { useState } from 'react'
import {
  Lightning,
  Plus,
  PencilSimple,
  Trash,
  CircleNotch,
  CheckCircle,
  Circle,
  User,
  Graph,
  ArrowRight,
  CaretDown,
  CaretUp,
  ChatCircleText,
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TopicKnowledgeLink {
  nodeId: string
  nodeLabel: string
  coverageLevel: 'mentioned' | 'partial' | 'full'
  sessionId: string | null
}

export interface Question {
  id: string
  text: string
  priority: 'high' | 'medium' | 'low' | null
  category: string | null
  asked: boolean
}

export interface TopicWithDetails {
  id: string
  name: string
  category: string | null
  captured: boolean
  suggested_by: string | null
  // Knowledge nodes that cover this topic
  coveringKnowledgeNodes?: TopicKnowledgeLink[]
  // Questions for this topic
  questions?: Question[]
}

interface TopicsListProps {
  topics: TopicWithDetails[]
  questions?: Question[]
  onAdd: () => void
  onEdit: (topic: TopicWithDetails) => void
  onDelete: (topicId: string) => Promise<void>
  onToggleCaptured: (topicId: string, captured: boolean) => Promise<void>
}

const categoryLabels: Record<string, string> = {
  architecture: 'Architecture',
  decision_rationale: 'Decision Rationale',
  domain_knowledge: 'Domain Knowledge',
  edge_cases: 'Edge Cases',
  integration: 'Integration',
  process: 'Process',
  technical: 'Technical',
  people: 'People & Relationships',
  relationships: 'Relationships',
  strategy: 'Strategy',
  operations: 'Operations',
  other: 'Other',
}

export function TopicsList({
  topics,
  questions = [],
  onAdd,
  onEdit,
  onDelete,
  onToggleCaptured,
}: TopicsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  const toggleExpanded = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      if (next.has(topicId)) {
        next.delete(topicId)
      } else {
        next.add(topicId)
      }
      return next
    })
  }

  // Get questions for a specific topic
  const getTopicQuestions = (topicId: string): Question[] => {
    // First check if topic has questions directly attached
    const topic = topics.find(t => t.id === topicId)
    if (topic?.questions && topic.questions.length > 0) {
      return topic.questions
    }
    // Otherwise filter from the questions prop (for backwards compatibility)
    return questions.filter(q => (q as { topic_id?: string }).topic_id === topicId)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleCaptured = async (topic: TopicWithDetails) => {
    setTogglingId(topic.id)
    try {
      await onToggleCaptured(topic.id, !topic.captured)
    } finally {
      setTogglingId(null)
    }
  }

  // Calculate coverage stats
  const capturedCount = topics.filter((t) => t.captured).length
  const partialCount = topics.filter((t) => !t.captured && t.coveringKnowledgeNodes && t.coveringKnowledgeNodes.length > 0).length
  const totalCount = topics.length

  // Group topics by category
  const groupedTopics = topics.reduce(
    (acc, topic) => {
      const category = topic.category || 'uncategorized'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(topic)
      return acc
    },
    {} as Record<string, TopicWithDetails[]>
  )

  const categoryOrder = [
    'process',
    'technical',
    'people',
    'strategy',
    'operations',
    'other',
    'uncategorized',
  ]

  const sortedCategories = Object.keys(groupedTopics).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  )

  return (
    <div className="space-y-4">
      {/* Header with summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {capturedCount} captured
            </span>
            {partialCount > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                {partialCount} in progress
              </span>
            )}
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-stone-300" />
              {totalCount - capturedCount - partialCount} to discuss
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Topic
        </Button>
      </div>

      {/* Topics list */}
      {topics.length > 0 ? (
        <div className="space-y-6">
          {sortedCategories.map((category) => (
            <div key={category}>
              {/* Category header */}
              {category !== 'uncategorized' && (
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {categoryLabels[category] || category}
                </h3>
              )}
              {category === 'uncategorized' && sortedCategories.length > 1 && (
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Uncategorized
                </h3>
              )}

              {/* Topics in category */}
              <div className="space-y-2">
                {groupedTopics[category].map((topic) => {
                  const topicQuestions = getTopicQuestions(topic.id)
                  const hasQuestions = topicQuestions.length > 0
                  const isExpanded = expandedTopics.has(topic.id)

                  return (
                    <div
                      key={topic.id}
                      className={cn(
                        'border rounded-lg bg-card transition-colors overflow-hidden',
                        topic.captured && 'border-emerald-200 bg-emerald-50/50'
                      )}
                    >
                      {/* Topic header */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Capture status toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleCaptured(topic)
                            }}
                            disabled={togglingId === topic.id}
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                              topic.captured
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            )}
                          >
                            {togglingId === topic.id ? (
                              <CircleNotch
                                className="w-3.5 h-3.5 animate-spin"
                                weight="bold"
                              />
                            ) : topic.captured ? (
                              <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" weight="bold" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={cn(
                                  'font-medium truncate',
                                  topic.captured && 'text-emerald-800'
                                )}
                              >
                                {topic.name}
                              </p>
                              {hasQuestions && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <ChatCircleText className="w-3 h-3" weight="bold" />
                                  {topicQuestions.length}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {topic.suggested_by && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <User className="w-3 h-3" weight="bold" />
                                  Suggested by {topic.suggested_by === 'ai' ? 'AI' : topic.suggested_by}
                                </span>
                              )}
                              {/* Knowledge coverage indicator */}
                              {topic.coveringKnowledgeNodes && topic.coveringKnowledgeNodes.length > 0 && (
                                <span className="text-xs text-blue-600 flex items-center gap-1">
                                  <Graph className="w-3 h-3" weight="bold" />
                                  {topic.coveringKnowledgeNodes.length} knowledge node{topic.coveringKnowledgeNodes.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {/* Show linked knowledge nodes */}
                            {topic.coveringKnowledgeNodes && topic.coveringKnowledgeNodes.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {topic.coveringKnowledgeNodes.slice(0, 3).map((node) => (
                                  <span
                                    key={node.nodeId}
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                                      node.coverageLevel === 'full' && 'bg-emerald-100 text-emerald-700',
                                      node.coverageLevel === 'partial' && 'bg-amber-100 text-amber-700',
                                      node.coverageLevel === 'mentioned' && 'bg-blue-100 text-blue-700'
                                    )}
                                  >
                                    <ArrowRight className="w-2.5 h-2.5" weight="bold" />
                                    {node.nodeLabel}
                                  </span>
                                ))}
                                {topic.coveringKnowledgeNodes.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{topic.coveringKnowledgeNodes.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {/* Expand/collapse button */}
                          {hasQuestions && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(topic.id)}
                              className="text-muted-foreground"
                            >
                              {isExpanded ? (
                                <CaretUp className="w-4 h-4" weight="bold" />
                              ) : (
                                <CaretDown className="w-4 h-4" weight="bold" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(topic)}
                          >
                            <PencilSimple className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(topic.id)}
                            disabled={deletingId === topic.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingId === topic.id ? (
                              <CircleNotch
                                className="w-4 h-4 animate-spin"
                                weight="bold"
                              />
                            ) : (
                              <Trash className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded questions section */}
                      {isExpanded && hasQuestions && (
                        <div className="px-4 pb-4 border-t border-border/50 bg-secondary/20">
                          <div className="pt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                              <ChatCircleText className="w-3.5 h-3.5" weight="bold" />
                              Interview Questions
                            </p>
                            <ul className="space-y-2">
                              {topicQuestions.map((question) => (
                                <li
                                  key={question.id}
                                  className={cn(
                                    'flex items-start gap-2 text-sm p-2 rounded-md',
                                    question.asked ? 'bg-emerald-50 text-emerald-800' : 'bg-white'
                                  )}
                                >
                                  <span className="text-muted-foreground mt-0.5">•</span>
                                  <span className="flex-1">{question.text}</span>
                                  {question.priority === 'high' && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
                                      High
                                    </span>
                                  )}
                                  {question.asked && (
                                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" weight="fill" />
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg bg-card p-8 text-center text-muted-foreground">
          <Lightning className="w-10 h-10 mx-auto mb-3" weight="bold" />
          <p className="font-medium mb-1">No topics yet</p>
          <p className="text-sm mb-4">
            Add topics you want to capture knowledge about during sessions.
          </p>
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Add First Topic
          </Button>
        </div>
      )}
    </div>
  )
}
