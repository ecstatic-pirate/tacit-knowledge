'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Bot, ClipboardList, Layers, Target, Lightbulb, RefreshCw, Loader2, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface AICoachPanelProps {
  sessionId: string;
  currentNotes?: string;
  recentTranscript?: string;
  expertName?: string;
  sessionNumber?: number;
  goal?: string;
}

interface GuidanceData {
  suggestedQuestions: string[];
  detectedTopics: string[];
  skillsToProbe: string[];
  contextualTip: string;
  capturedInsights: string[];
}

interface GuidanceContext {
  expertName: string;
  sessionNumber: number;
  capturedSkillsCount: number;
  remainingSkillsCount: number;
}

export function AICoachPanel({
  sessionId,
  currentNotes,
  recentTranscript,
  expertName,
  sessionNumber,
  goal,
}: AICoachPanelProps) {
  const [guidance, setGuidance] = useState<GuidanceData | null>(null);
  const [context, setContext] = useState<GuidanceContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedNotes, setLastFetchedNotes] = useState<string>('');

  const supabase = useMemo(() => createClient(), []);

  // Fetch AI guidance
  const fetchGuidance = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('session-guidance', {
        body: {
          sessionId,
          currentNotes,
          recentTranscript,
        },
      });

      if (fnError) throw fnError;

      if (data.success) {
        setGuidance(data.guidance);
        setContext(data.context);
        setLastFetchedNotes(currentNotes || '');
      } else {
        throw new Error(data.error || 'Failed to get guidance');
      }
    } catch (err) {
      console.error('Error fetching AI guidance:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI guidance');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentNotes, recentTranscript, supabase]);

  // Auto-fetch on mount and when notes change significantly
  useEffect(() => {
    if (!sessionId) return;

    // Initial fetch
    if (!guidance && !isLoading) {
      fetchGuidance();
      return;
    }

    // Refresh when notes have changed by more than 200 characters
    if (currentNotes && Math.abs((currentNotes?.length || 0) - lastFetchedNotes.length) > 200) {
      const debounce = setTimeout(() => {
        fetchGuidance();
      }, 3000); // Wait 3 seconds after typing stops
      return () => clearTimeout(debounce);
    }
  }, [sessionId, guidance, isLoading, currentNotes, lastFetchedNotes, fetchGuidance]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="py-3 border-b flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold">AI Coach</h3>
            <p className="text-xs text-muted-foreground">Real-time Guidance</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={fetchGuidance}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4 flex-1 overflow-y-auto">
        {error && (
          <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {isLoading && !guidance && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {guidance && (
          <>
            {/* Contextual Tip */}
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {guidance.contextualTip}
                </p>
              </div>
            </div>

            {/* Suggested Questions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <MessageSquare className="w-3 h-3" />
                Suggested Questions
              </div>
              <div className="space-y-2">
                {guidance.suggestedQuestions.map((question, i) => (
                  <div
                    key={i}
                    className="text-sm p-2.5 bg-secondary/50 rounded-md border border-border/50 hover:bg-secondary/70 transition-colors cursor-pointer"
                  >
                    {question}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills to Probe */}
            {guidance.skillsToProbe.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <Target className="w-3 h-3" />
                  Skills to Explore
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {guidance.skillsToProbe.map((skill, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Topics */}
            {guidance.detectedTopics.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <Layers className="w-3 h-3" />
                  Detected Topics
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {guidance.detectedTopics.map((topic, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Captured Insights */}
            {guidance.capturedInsights.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <ClipboardList className="w-3 h-3" />
                  Key Insights
                </div>
                <ul className="space-y-1.5">
                  {guidance.capturedInsights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Session Progress */}
            {context && (
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Skills Captured</span>
                  <span className="font-medium text-foreground">
                    {context.capturedSkillsCount} / {context.capturedSkillsCount + context.remainingSkillsCount}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Fallback when no session */}
        {!sessionId && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            Start a session to receive AI coaching
          </div>
        )}
      </CardContent>
    </Card>
  );
}
