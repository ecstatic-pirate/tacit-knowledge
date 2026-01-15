'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Pause, Square, Play, CircleNotch, WarningCircle,
  VideoCamera, VideoCameraSlash, Microphone, MicrophoneSlash, Lightbulb,
  ChatTeardrop, Sparkle, CaretRight, Plus
} from 'phosphor-react';
import { cn } from '@/lib/utils';
import { useSession, useMediaCapture, TranscriptLine } from '@/lib/hooks';
import { createClient } from '@/lib/supabase/client';
import { components, spacing } from '@/lib/design-system';

interface CaptureTabProps {
  sessionId: string | null;
  onPauseSession: () => void;
  onEndSession: (duration: number, capturedTopicsCount: number) => void;
}

interface CapturedInsight {
  id: string;
  title: string;
  insight: string;
}

// AI suggested questions based on session context
const getContextualQuestions = (transcriptLength: number): string[] => {
  if (transcriptLength < 3) {
    return [
      'Can you walk me through a typical day in your role?',
      'What are the most critical decisions you make regularly?',
      'Who do you collaborate with most often and why?',
    ];
  }
  return [
    'Can you give me a specific example of that?',
    'What happens when that approach doesn\'t work?',
    'How did you learn to do it that way?',
    'Who else should know this before you leave?',
  ];
};

export function CaptureTab({ sessionId, onPauseSession, onEndSession }: CaptureTabProps) {
  const {
    session,
    isLoading,
    error,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
  } = useSession(sessionId);

  const supabase = useMemo(() => createClient(), []);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activePanel, setActivePanel] = useState<'transcript' | 'coach' | 'captured'>('transcript');
  const [capturedInsights, setCapturedInsights] = useState<CapturedInsight[]>([]);
  const [dbTranscriptLines, setDbTranscriptLines] = useState<TranscriptLine[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Save transcript line to database
  const saveTranscriptLine = useCallback(async (line: TranscriptLine) => {
    if (!sessionId) return;

    const { error: insertError } = await supabase
      .from('transcript_lines')
      .insert({
        session_id: sessionId,
        speaker: line.speaker,
        text: line.text,
        timestamp_seconds: line.timestampSeconds,
        confidence: line.confidence || null,
        is_final: line.isFinal,
      });

    if (insertError) {
      console.error('Error saving transcript line:', insertError);
    }
  }, [sessionId, supabase]);

  const {
    isMediaReady,
    isVideoOn,
    isAudioOn,
    localVideoRef,
    mediaError,
    isTranscribing,
    transcriptLines,
    currentInterim,
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    startTranscription,
    stopTranscription,
  } = useMediaCapture(saveTranscriptLine);

  // Load existing transcript lines from database
  useEffect(() => {
    if (!sessionId) return;

    async function loadTranscript() {
      const { data, error: fetchError } = await supabase
        .from('transcript_lines')
        .select('*')
        .eq('session_id', sessionId as string)
        .order('timestamp_seconds', { ascending: true });

      if (fetchError) {
        console.error('Error loading transcript:', fetchError);
        return;
      }

      if (data) {
        setDbTranscriptLines(data.map(line => ({
          id: line.id,
          speaker: line.speaker,
          text: line.text,
          timestampSeconds: line.timestamp_seconds,
          isFinal: line.is_final ?? true,
          confidence: line.confidence ?? undefined,
        })));
      }
    }

    loadTranscript();
  }, [sessionId, supabase]);

  // Load existing captured insights from database
  useEffect(() => {
    if (!sessionId) return;

    async function loadInsights() {
      const { data, error: fetchError } = await supabase
        .from('captured_insights')
        .select('*')
        .eq('session_id', sessionId as string)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error loading insights:', fetchError);
        return;
      }

      if (data) {
        setCapturedInsights(data.map(item => ({
          id: item.id,
          title: item.title,
          insight: item.insight,
        })));
      }
    }

    loadInsights();
  }, [sessionId, supabase]);

  // Combine database transcript with live transcript
  const allTranscriptLines = useMemo(() => {
    const dbIds = new Set(dbTranscriptLines.map(l => l.id));
    const newLines = transcriptLines.filter(l => !dbIds.has(l.id));
    return [...dbTranscriptLines, ...newLines];
  }, [dbTranscriptLines, transcriptLines]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allTranscriptLines, currentInterim]);

  // Timer effect
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

  // Handle starting the call
  const handleStartCall = useCallback(async () => {
    await startMedia();
    await startSession();
    startTranscription();
  }, [startMedia, startSession, startTranscription]);

  // Handle ending session
  const handleEndSession = useCallback(async () => {
    stopTranscription();
    stopMedia();
    await endSession();
    const capturedCount = session?.campaignTopics.filter(s => s.captured).length || 0;
    onEndSession(elapsedSeconds, capturedCount);
  }, [stopTranscription, stopMedia, endSession, session?.campaignTopics, elapsedSeconds, onEndSession]);

  // Handle pause/resume
  const handlePauseResume = useCallback(async () => {
    if (session?.status === 'in_progress') {
      stopTranscription();
      await pauseSession();
      onPauseSession();
    } else {
      startTranscription();
      await resumeSession();
    }
  }, [session?.status, stopTranscription, pauseSession, onPauseSession, startTranscription, resumeSession]);

  // Manually capture an insight
  const handleCaptureInsight = useCallback(async () => {
    if (!sessionId || !session?.campaignId) return;

    const title = prompt('Enter a title for this insight:');
    if (!title) return;

    const insight = prompt('Describe the insight:');
    if (!insight) return;

    const { data, error: insertError } = await supabase
      .from('captured_insights')
      .insert({
        session_id: sessionId,
        campaign_id: session.campaignId,
        title,
        insight,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error capturing insight:', insertError);
      return;
    }

    if (data) {
      setCapturedInsights(prev => [...prev, {
        id: data.id,
        title: data.title,
        insight: data.insight,
      }]);
    }
  }, [sessionId, session?.campaignId, supabase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <CircleNotch className="w-6 h-6 animate-spin text-muted-foreground" weight="bold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <WarningCircle className="w-8 h-8 text-red-500 mx-auto mb-3" weight="bold" />
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <WarningCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" weight="bold" />
          <p className="text-muted-foreground mb-4">
            No session selected. Please select a session from the planner.
          </p>
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
  const suggestedQuestions = getContextualQuestions(allTranscriptLines.length);

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen">
      {/* Top Bar */}
      <div className="h-12 border-b flex items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-3">
          {isActive && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
          {isPaused && <div className="h-2 w-2 rounded-full bg-amber-500" />}
          <span className="font-mono text-sm font-medium">{formatTime(elapsedSeconds)}</span>
          <span className="text-sm text-muted-foreground">
            · Session {session.sessionNumber} with {session.campaign?.expertName || 'Expert'}
          </span>
          {isTranscribing && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              Recording
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(isActive || isPaused) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePauseResume}
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleEndSession}>
                <Square className="w-3 h-3 mr-1" />
                End
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Media Error Banner */}
      {mediaError && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2 text-sm text-red-700 flex items-center gap-2">
          <WarningCircle className="w-4 h-4" weight="bold" />
          {mediaError}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Video Call Area */}
        <div className="flex-1 flex flex-col bg-zinc-900 relative">
          {/* Main Video Area */}
          <div className="flex-1 flex items-center justify-center">
            {isScheduled && !isMediaReady ? (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-white">
                    {session.campaign?.expertName?.split(' ').map(n => n[0]).join('') || 'E'}
                  </span>
                </div>
                <p className="text-white/80 mb-6">Ready to start session with {session.campaign?.expertName}</p>
                <Button size="lg" onClick={handleStartCall}>
                  <VideoCamera className="w-4 h-4 mr-2" />
                  Start Call
                </Button>
              </div>
            ) : (
              <>
                {/* Expert placeholder (would be their video in real implementation) */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-zinc-700 flex items-center justify-center mx-auto mb-3">
                      <span className="text-4xl text-white">
                        {session.campaign?.expertName?.split(' ').map(n => n[0]).join('') || 'E'}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">{session.campaign?.expertName}</p>
                    <p className="text-white/40 text-xs mt-1">Expert video would appear here</p>
                  </div>
                </div>

                {/* Self view (real camera) */}
                <div className="absolute bottom-20 right-4 w-48 h-36 rounded-lg bg-zinc-700 border-2 border-zinc-600 overflow-hidden">
                  {isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover mirror"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoCameraSlash className="w-6 h-6 text-zinc-400" weight="bold" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 text-xs text-white/80 bg-black/50 px-1.5 py-0.5 rounded">
                    You
                  </div>
                </div>

                {/* Call Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-800/80 backdrop-blur rounded-full px-4 py-2">
                  <button
                    onClick={toggleAudio}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isAudioOn ? "bg-zinc-700 text-white" : "bg-red-500 text-white"
                    )}
                  >
                    {isAudioOn ? <Microphone className="w-5 h-5" weight="bold" /> : <MicrophoneSlash className="w-5 h-5" weight="bold" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isVideoOn ? "bg-zinc-700 text-white" : "bg-red-500 text-white"
                    )}
                  >
                    {isVideoOn ? <VideoCamera className="w-5 h-5" weight="bold" /> : <VideoCameraSlash className="w-5 h-5" weight="bold" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className={components.sidePanelResponsive}>
          {/* Panel Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActivePanel('transcript')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                activePanel === 'transcript'
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ChatTeardrop className="w-4 h-4 inline mr-1.5" weight="bold" />
              Transcript
            </button>
            <button
              onClick={() => setActivePanel('coach')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                activePanel === 'coach'
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkle className="w-4 h-4 inline mr-1.5" weight="bold" />
              AI Coach
            </button>
            <button
              onClick={() => setActivePanel('captured')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
                activePanel === 'captured'
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Lightbulb className="w-4 h-4 inline mr-1.5" />
              Captured
              {capturedInsights.length > 0 && (
                <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">
                  {capturedInsights.length}
                </span>
              )}
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {activePanel === 'transcript' && (
              <div className={cn("p-4", spacing.sectionGapTiny)}>
                {isActive || isPaused ? (
                  <>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      {isTranscribing ? (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          Live transcript
                        </>
                      ) : (
                        <>
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Transcript paused
                        </>
                      )}
                    </div>

                    {allTranscriptLines.length === 0 && !currentInterim ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {isTranscribing
                          ? 'Start speaking and your words will appear here...'
                          : 'Resume the session to continue transcribing'}
                      </p>
                    ) : (
                      <>
                        {allTranscriptLines.map((line) => (
                          <div key={line.id} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-xs font-medium",
                                line.speaker === 'You' ? "text-blue-600" : "text-foreground"
                              )}>
                                {line.speaker}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(line.timestampSeconds)}
                              </span>
                            </div>
                            <p className="text-sm">{line.text}</p>
                          </div>
                        ))}

                        {/* Interim (in-progress) transcript */}
                        {currentInterim && (
                          <div className="space-y-1 opacity-60">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-blue-600">You</span>
                              <span className="text-xs text-muted-foreground">...</span>
                            </div>
                            <p className="text-sm italic">{currentInterim}</p>
                          </div>
                        )}

                        <div ref={transcriptEndRef} />
                      </>
                    )}

                    {isTranscribing && (
                      <div className="flex items-center gap-2 pt-2">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/50 animate-pulse" />
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/50 animate-pulse delay-100" />
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/50 animate-pulse delay-200" />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Transcript will appear here once the call starts
                  </p>
                )}
              </div>
            )}

            {activePanel === 'coach' && (
              <div className="p-4 space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-700 mb-1">Session Goal</p>
                  <p className="text-sm text-blue-900">
                    {session.campaign?.goal || 'Capture tacit knowledge from expert'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Suggested Questions</p>
                  <div className="space-y-2">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        className="w-full text-left p-3 rounded-lg border hover:bg-secondary/50 transition-colors group"
                      >
                        <p className="text-sm">{q}</p>
                        <CaretRight className="w-4 h-4 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity" weight="bold" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Tips</p>
                  <p className="text-xs text-muted-foreground">
                    Ask for specific examples and numbers. &quot;Can you give me an example?&quot; helps capture actionable knowledge.
                  </p>
                </div>
              </div>
            )}

            {activePanel === 'captured' && (
              <div className="p-4 space-y-3">
                {(isActive || isPaused) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-3"
                    onClick={handleCaptureInsight}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Capture Insight
                  </Button>
                )}

                {capturedInsights.length > 0 ? (
                  capturedInsights.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg border bg-amber-50 border-amber-100">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-amber-900">{item.title}</p>
                          <p className="text-xs text-amber-700 mt-1">{item.insight}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {isActive || isPaused
                      ? 'Click "Capture Insight" to save key knowledge'
                      : 'Insights will be captured during the session'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
