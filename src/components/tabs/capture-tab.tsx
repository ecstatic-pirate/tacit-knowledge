'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container } from '@/components/layout';
import { HumanGuidancePanel, AICoachPanel } from '@/components/capture';
import { Button } from '@/components/ui/button';
import { Mic, Pause, Square, Wand2, Play, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/hooks';

interface CaptureTabProps {
  sessionId: string | null;
  onPauseSession: () => void;
  onEndSession: (duration: number, capturedSkillsCount: number) => void;
}

export function CaptureTab({ sessionId, onPauseSession, onEndSession }: CaptureTabProps) {
  const {
    session,
    isLoading,
    error,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    updateNotes,
  } = useSession(sessionId);

  const [showCoach, setShowCoach] = useState(true);
  const [notes, setNotes] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync notes from session
  useEffect(() => {
    if (session?.notes && !notes) {
      setNotes(session.notes);
    }
  }, [session?.notes, notes]);

  // Timer for active sessions
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;

    const startTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();

    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [session?.status, session?.startedAt]);

  // Handle notes change
  const handleNotesChange = useCallback((newNotes: string) => {
    setNotes(newNotes);
    updateNotes(newNotes);
  }, [updateNotes]);

  // Handle end session
  const handleEndSession = useCallback(async () => {
    await endSession();
    const capturedCount = session?.skills.filter(s => s.captured).length || 0;
    onEndSession(elapsedSeconds, capturedCount);
  }, [endSession, session?.skills, elapsedSeconds, onEndSession]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No session state
  if (!session) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground mb-4">No session selected. Please select a session from the planner.</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isActive = session.status === 'in_progress';
  const isPaused = session.status === 'paused';
  const isScheduled = session.status === 'scheduled';

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isActive && <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />}
            {isPaused && <div className="h-2 w-2 rounded-full bg-amber-500" />}
            {isScheduled && <div className="h-2 w-2 rounded-full bg-stone-400" />}
            <span className="font-mono text-sm font-medium">{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium text-muted-foreground">
            Session {session.sessionNumber} with {session.campaign?.expertName || 'Expert'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCoach(!showCoach)}
            className={cn(showCoach && "bg-secondary")}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            AI Coach
          </Button>
          <Badge variant="outline" className="bg-secondary/50 font-normal">
            {session.campaign?.expertRole || 'Expert Session'}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Capture Area */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div className="max-w-3xl w-full space-y-6 pb-24">
            {/* Session Goal */}
            {session.campaign?.goal && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                <div className="text-xs font-semibold text-primary uppercase mb-1">Session Goal</div>
                <p className="text-sm text-foreground/80">{session.campaign.goal}</p>
              </div>
            )}

            {/* Notes Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Session Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Start typing your notes here. The AI will analyze your content and provide real-time suggestions..."
                className="w-full min-h-[400px] p-4 border rounded-lg bg-card text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                disabled={!isActive && !isPaused}
              />
              <div className="text-xs text-muted-foreground">
                {notes.length} characters · Auto-saved
              </div>
            </div>

            {/* Topics */}
            {session.topics.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Topics Covered</div>
                <div className="flex flex-wrap gap-2">
                  {session.topics.map((topic, i) => (
                    <Badge key={i} variant="secondary">{topic}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Progress */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Skills Progress</div>
              <div className="grid grid-cols-2 gap-2">
                {session.skills.slice(0, 8).map((skill) => (
                  <div
                    key={skill.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border text-sm",
                      skill.captured
                        ? "bg-emerald-50/50 border-emerald-100 text-emerald-900"
                        : "bg-secondary/30 border-border text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      skill.captured ? "bg-emerald-600" : "bg-muted-foreground/30"
                    )} />
                    {skill.name}
                  </div>
                ))}
              </div>
              {session.skills.length > 8 && (
                <div className="text-xs text-muted-foreground">
                  +{session.skills.length - 8} more skills
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel - AI Coach */}
        {showCoach && sessionId && (
          <div className="w-80 border-l bg-muted/10 flex flex-col h-full animate-in slide-in-from-right duration-300">
            <div className="flex-1 overflow-y-auto p-4">
              <AICoachPanel
                sessionId={sessionId}
                currentNotes={notes}
                expertName={session.campaign?.expertName}
                sessionNumber={session.sessionNumber}
                goal={session.campaign?.goal || undefined}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-background/80 backdrop-blur-md border rounded-full shadow-lg z-20">
        {/* Start button (for scheduled sessions) */}
        {isScheduled && (
          <Button
            variant="default"
            size="lg"
            className="rounded-full h-12 px-6"
            onClick={startSession}
          >
            <Play className="h-5 w-5 mr-2" />
            Start Session
          </Button>
        )}

        {/* Pause/Resume button */}
        {(isActive || isPaused) && (
          <Button
            variant={isActive ? "secondary" : "default"}
            size="icon"
            className="rounded-full h-12 w-12"
            onClick={() => {
              if (isActive) {
                pauseSession();
                onPauseSession();
              } else {
                resumeSession();
              }
            }}
          >
            {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
        )}

        {/* End button */}
        {(isActive || isPaused) && (
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full h-12 w-12"
            onClick={handleEndSession}
          >
            <Square className="h-5 w-5 fill-current" />
          </Button>
        )}
      </div>
    </div>
  );
}
