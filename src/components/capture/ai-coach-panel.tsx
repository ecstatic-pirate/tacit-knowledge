'use client';

import { Bot, ClipboardList, Layers, Target } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface AICoachPanelProps {
  sessionNumber: number;
  recap: string;
  foundation: string;
  currentTopic: string;
}

export function AICoachPanel({
  sessionNumber,
  recap,
  foundation,
  currentTopic,
}: AICoachPanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-4 border-b flex-row items-center gap-3 space-y-0">
         <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary text-secondary-foreground">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold">AI Coach</h3>
          <p className="text-xs text-muted-foreground">Session Guidance</p>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6 flex-1">
        {/* Recap */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <ClipboardList className="w-3 h-3" />
            Session {sessionNumber} Recap
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {recap}
          </p>
        </div>

        <div className="h-px bg-border w-full" />

        {/* Foundation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <Layers className="w-3 h-3" />
            Context Foundation
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {foundation}
          </p>
        </div>

        <div className="h-px bg-border w-full" />

        {/* Current Topic */}
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <Target className="w-3 h-3" />
            Active Topic
          </div>
          <div className="flex items-start gap-3 bg-secondary/50 rounded-md p-3 border border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse" />
            <span className="text-sm font-medium">{currentTopic}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
