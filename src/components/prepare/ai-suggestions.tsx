'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkle,
  Calendar,
  CheckCircle,
  CircleNotch,
  ArrowClockwise,
  WarningCircle,
  Question,
  Lightning,
  Brain,
  Target,
  CaretRight,
  Lightbulb,
} from 'phosphor-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { InterviewQuestion } from '@/lib/supabase/database.types';

interface AISuggestionsProps {
  campaignId?: string;
  extractedSkills?: string[];
  onAccept: () => void;
  onEdit: () => void;
}

interface InterviewPlanResult {
  questions: InterviewQuestion[];
  gaps: string[];
  topics: string[];
  contextSummary: string;
}

interface SessionPlan {
  sessionNumber: number;
  topic: string;
  skills: string[];
}

interface CampaignPlan {
  totalSessions: number;
  cadence: string;
  duration: string;
  sessions: SessionPlan[];
  overallConfidence: number;
}

const priorityStyles = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-secondary text-muted-foreground border-border',
};

export function AISuggestions({
  campaignId,
  extractedSkills = [],
  onAccept,
  onEdit,
}: AISuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlanResult | null>(null);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const generateInterviewPlan = useCallback(async () => {
    if (!campaignId) return;

    setIsGeneratingPlan(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate plan');
      }

      const data = await response.json();
      setInterviewPlan(data.plan);

      const questions = data.plan.questions as InterviewQuestion[];
      const highPriorityQuestions = questions.filter((q) => q.priority === 'high');
      const sessionsNeeded = Math.max(8, Math.min(16, Math.ceil(questions.length / 3) + 4));

      const sessionPlan: SessionPlan[] = [];
      for (let i = 0; i < Math.min(7, sessionsNeeded); i++) {
        const questionsForSession = highPriorityQuestions.slice(i, i + 2);
        sessionPlan.push({
          sessionNumber: i + 1,
          topic: questionsForSession[0]?.category || `Session ${i + 1}`,
          skills: questionsForSession.map((q) => q.question.slice(0, 50) + '...'),
        });
      }

      setPlan({
        totalSessions: sessionsNeeded,
        cadence: 'Weekly',
        duration: `${Math.ceil(sessionsNeeded / 1.5)} weeks`,
        sessions: sessionPlan,
        overallConfidence: 85,
      });
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [campaignId]);

  const fetchSuggestions = useCallback(async () => {
    if (!campaignId) return;

    setIsLoading(true);
    setError(null);

    try {
      const existingPlanResponse = await fetch(`/api/ai/generate-plan?campaignId=${campaignId}`);

      if (existingPlanResponse.ok) {
        const existingData = await existingPlanResponse.json();
        if (existingData.plan) {
          setInterviewPlan(existingData.plan);

          const questions = existingData.plan.questions as InterviewQuestion[];
          const sessionsNeeded = Math.max(8, Math.min(16, Math.ceil(questions.length / 3) + 4));

          const sessionPlan: SessionPlan[] = [];
          for (let i = 0; i < Math.min(7, sessionsNeeded); i++) {
            const questionsForSession = questions.slice(i * 2, i * 2 + 2);
            sessionPlan.push({
              sessionNumber: i + 1,
              topic: questionsForSession[0]?.category || `Session ${i + 1}`,
              skills: questionsForSession.map((q) => q.question.slice(0, 50) + '...'),
            });
          }

          setPlan({
            totalSessions: sessionsNeeded,
            cadence: 'Weekly',
            duration: `${Math.ceil(sessionsNeeded / 1.5)} weeks`,
            sessions: sessionPlan,
            overallConfidence: 85,
          });
        }
      }

      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId && (extractedSkills.length > 0 || !hasFetched)) {
      fetchSuggestions();
    }
  }, [campaignId, extractedSkills.length, hasFetched, fetchSuggestions]);

  // Placeholder state
  if (!campaignId) {
    return (
      <div className="border rounded-lg bg-card opacity-60">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="p-2 rounded-md bg-secondary">
            <Brain className="w-4 h-4 text-muted-foreground" weight="bold" />
          </div>
          <div>
            <h3 className="font-medium">AI Interview Plan</h3>
            <p className="text-xs text-muted-foreground">Complete previous steps first</p>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-3">
            <Sparkle className="w-6 h-6 text-muted-foreground" weight="bold" />
          </div>
          <p className="text-sm text-muted-foreground">
            Fill in campaign details and self-assessment to generate an AI-powered interview plan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-md',
            interviewPlan ? 'bg-primary' : 'bg-secondary'
          )}>
            <Brain className={cn(
              'w-4 h-4',
              interviewPlan ? 'text-primary-foreground' : 'text-muted-foreground'
            )} weight="bold" />
          </div>
          <div>
            <h3 className="font-medium">AI Interview Plan</h3>
            <p className="text-xs text-muted-foreground">
              {interviewPlan
                ? `${interviewPlan.questions.length} questions across ${interviewPlan.topics.length} topics`
                : 'Generate a comprehensive interview strategy'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          title="Refresh"
        >
          <ArrowClockwise className={cn(
            'w-4 h-4 text-muted-foreground',
            isLoading && 'animate-spin'
          )} weight="bold" />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
          <WarningCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" weight="bold" />
          <div>
            <p className="text-sm font-medium text-destructive">Generation Failed</p>
            <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {isLoading || isGeneratingPlan ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-3">
              <CircleNotch className="w-6 h-6 text-primary-foreground animate-spin" weight="bold" />
            </div>
            <p className="text-sm font-medium">
              {isGeneratingPlan ? 'Generating plan...' : 'Loading...'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
          </div>
        ) : !interviewPlan ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-6 h-6 text-muted-foreground" weight="bold" />
            </div>
            <h4 className="font-medium mb-1">Ready to Generate Plan</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              Our AI will analyze your documents and self-assessment to create a tailored interview strategy
            </p>
            <Button onClick={generateInterviewPlan}>
              <Sparkle className="w-4 h-4 mr-2" weight="bold" />
              Generate Interview Plan
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Context Summary */}
            {interviewPlan.contextSummary && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" weight="bold" />
                  <p className="text-sm text-foreground/80">
                    {interviewPlan.contextSummary}
                  </p>
                </div>
              </div>
            )}

            {/* Topics */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-emerald-600" weight="bold" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Key Topics
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {interviewPlan.topics.slice(0, 8).map((topic, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Knowledge Gaps */}
            {interviewPlan.gaps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightning className="w-4 h-4 text-amber-600" weight="bold" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Knowledge Gaps
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {interviewPlan.gaps.slice(0, 4).map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Questions List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Question className="w-4 h-4 text-muted-foreground" weight="bold" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Interview Questions
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {interviewPlan.questions.length} total
                </span>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {interviewPlan.questions.slice(0, 8).map((question, idx) => {
                  const isExpanded = expandedQuestion === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-border bg-card overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                        className="w-full px-3 py-2 flex items-start gap-2 text-left"
                      >
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 mt-0.5',
                          priorityStyles[question.priority]
                        )}>
                          {question.priority.charAt(0).toUpperCase()}
                        </span>
                        <p className={cn(
                          'text-sm flex-1',
                          !isExpanded && 'line-clamp-2'
                        )}>
                          {question.question}
                        </p>
                        <CaretRight className={cn(
                          'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
                          isExpanded && 'rotate-90'
                        )} weight="bold" />
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-2 pt-0 border-t border-border/40">
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              {question.category}
                            </span>
                          </div>
                          {question.relatedGap && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Gap:</span> {question.relatedGap}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {interviewPlan.questions.length > 8 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  +{interviewPlan.questions.length - 8} more questions
                </p>
              )}
            </div>

            {/* Timeline */}
            {plan && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" weight="bold" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Proposed Timeline
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold">{plan.totalSessions}</p>
                    <p className="text-xs text-muted-foreground">sessions</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <p className="text-2xl font-bold">{plan.duration}</p>
                    <p className="text-xs text-muted-foreground">duration</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {interviewPlan && (
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={generateInterviewPlan}
            disabled={isGeneratingPlan}
          >
            <ArrowClockwise className={cn('w-4 h-4 mr-1', isGeneratingPlan && 'animate-spin')} weight="bold" />
            Regenerate
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onEdit}>
              Edit Plan
            </Button>
            <Button size="sm" onClick={onAccept}>
              <CheckCircle className="w-4 h-4 mr-1" weight="bold" />
              Accept
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
