'use client';

import { Container } from '@/components/layout';
import { HumanGuidancePanel, AICoachPanel } from '@/components/capture';
import { Button } from '@/components/ui/button';
import { Mic, Pause, Square, Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CaptureTabProps {
  onPauseSession: () => void;
  onEndSession: () => void;
}

export function CaptureTab({ onPauseSession, onEndSession }: CaptureTabProps) {
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);
  const [showCoach, setShowCoach] = useState(true);

  // Mock timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Bar - Focus Mode */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm font-medium">{formatTime(duration)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium text-muted-foreground">Session with Patricia Rodriguez</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowCoach(!showCoach)} className={cn(showCoach && "bg-secondary")}>
            <Wand2 className="w-4 h-4 mr-2" />
            AI Coach
          </Button>
          <Badge variant="outline" className="bg-secondary/50 font-normal">
            High Fidelity Mode
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Capture Area */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div className="max-w-3xl w-full space-y-8 pb-24">
            {/* Live Transcript Placeholder */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Interviewer (AI Agent)</p>
                  <p className="text-base leading-relaxed">
                    Could you describe the specific challenges you faced during the legacy billing system migration in 2018? Specifically regarding the data reconciliation process.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  PR
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Patricia Rodriguez</p>
                  <p className="text-base leading-relaxed">
                    Oh, that was a massive undertaking. The biggest issue wasn't the data format itself, but the timing differences between the mainframe batch jobs and the new real-time event stream. We had to build a custom buffer layer...
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-50/50 text-yellow-700 text-xs rounded border border-yellow-200/50 mt-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                     Key Insight Detected: Custom Buffer Architecture
                  </div>
                </div>
              </div>

              {/* Streaming placeholder */}
              <div className="flex gap-4 opacity-50">
                 <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  PR
                </div>
                 <div className="space-y-2 w-full">
                    <div className="h-4 bg-secondary/50 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-secondary/50 rounded w-1/2 animate-pulse" />
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        {showCoach && (
          <div className="w-80 border-l bg-muted/10 flex flex-col h-full animate-in slide-in-from-right duration-300">
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AICoachPanel
                  sessionNumber={8}
                  recap="Previous session covered initial system architecture. Focus today is on operational failure modes."
                  foundation="Patricia is an expert in legacy billing systems."
                  currentTopic="Data Reconciliation Issues"
                />
                <HumanGuidancePanel
                  suggestedQuestions={[
                    "What specific metrics signaled the reconciliation failure?",
                    "Who were the key stakeholders involved in the fix?",
                    "How was the buffer layer tested?"
                  ]}
                  capturedSkills={[
                    "Legacy Migration",
                    "Event Streaming",
                    "Batch Processing"
                  ]}
                  missingSkills={[
                    "Incident Response",
                    "Post-Mortem Analysis"
                  ]}
                  referenceFiles={[
                    "2018-migration-plan.pdf",
                    "billing-architecture-v1.png"
                  ]}
                />
             </div>
          </div>
        )}
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-background/80 backdrop-blur-md border rounded-full shadow-lg z-20">
        <Button
          variant={isRecording ? "secondary" : "default"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={() => {
            setIsRecording(!isRecording);
            onPauseSession();
          }}
        >
          {isRecording ? <Pause className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={onEndSession}
        >
          <Square className="h-5 w-5 fill-current" />
        </Button>
      </div>
    </div>
  );
}
