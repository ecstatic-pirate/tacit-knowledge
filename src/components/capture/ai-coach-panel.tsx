'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Robot, ListChecks, Stack, Target, Lightbulb, ArrowClockwise, CircleNotch, ChatTeardrop, Clock, Play, Pause } from 'phosphor-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Auto-refresh interval in milliseconds (2.5 minutes)
const AUTO_REFRESH_INTERVAL = 150000;

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
  topicsToProbe: string[];
  contextualTip: string;
  capturedInsights: string[];
}

interface GuidanceContext {
  expertName: string;
  sessionNumber: number;
  capturedTopicsCount: number;
  remainingTopicsCount: number;
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
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch AI guidance from the Next.js API route
  const fetchGuidance = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/session-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          recentTranscript: recentTranscript || currentNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get guidance');
      }

      const data = await response.json();

      if (data.success) {
        setGuidance({
          ...data.guidance,
          capturedInsights: [], // Will be populated from insights API if needed
        });
        setContext(data.context);
        setLastFetchedNotes(currentNotes || '');
        setLastRefreshTime(new Date());
      } else {
        throw new Error(data.error || 'Failed to get guidance');
      }
    } catch (err) {
      console.error('Error fetching AI guidance:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI guidance');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentNotes, recentTranscript]);

  // Auto-refresh timer management
  useEffect(() => {
    if (!sessionId || !autoRefreshEnabled) {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
      return;
    }

    // Start auto-refresh timer
    autoRefreshTimerRef.current = setInterval(() => {
      fetchGuidance();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [sessionId, autoRefreshEnabled, fetchGuidance]);

  // Initial fetch and significant notes change detection
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

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  // Format last refresh time
  const formatLastRefresh = useCallback(() => {
    if (!lastRefreshTime) return null;
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastRefreshTime.getTime()) / 1000);
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    return `${diffMinutes}m ago`;
  }, [lastRefreshTime]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="py-3 border-b flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
            <Robot className="w-4 h-4" weight="bold" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold">AI Coach</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Real-time Guidance</p>
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
              "h-7 w-7",
              autoRefreshEnabled ? "text-emerald-600" : "text-muted-foreground"
            )}
            onClick={toggleAutoRefresh}
            title={autoRefreshEnabled ? "Auto-refresh ON (2.5 min)" : "Auto-refresh OFF"}
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
            onClick={fetchGuidance}
            disabled={isLoading}
            title="Refresh now"
          >
            <ArrowClockwise className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} weight="bold" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 flex-1 overflow-y-auto">
        {error && (
          <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {isLoading && !guidance && (
          <div className="flex items-center justify-center py-8">
            <CircleNotch className="w-5 h-5 animate-spin text-primary" weight="bold" />
          </div>
        )}

        {guidance && (
          <>
            {/* Contextual Tip */}
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" weight="fill" />
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {guidance.contextualTip}
                </p>
              </div>
            </div>

            {/* Suggested Questions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <ChatTeardrop className="w-3 h-3" weight="bold" />
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

            {/* Topics to Probe */}
            {guidance.topicsToProbe.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <Target className="w-3 h-3" weight="bold" />
                  Topics to Explore
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {guidance.topicsToProbe.map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Topics */}
            {guidance.detectedTopics.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <Stack className="w-3 h-3" weight="bold" />
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
                  <ListChecks className="w-3 h-3" weight="bold" />
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
                  <span>Topics Captured</span>
                  <span className="font-medium text-foreground">
                    {context.capturedTopicsCount} / {context.capturedTopicsCount + context.remainingTopicsCount}
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
