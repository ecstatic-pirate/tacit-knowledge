'use client';

import { Calendar, Clock, ArrowClockwise } from 'phosphor-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TimelineProps {
  totalSessions: number;
  cadence: string;
  duration: string;
  weeks: number;
}

export function Timeline({ totalSessions, cadence, duration, weeks }: TimelineProps) {
  const weekBlocks = Array.from({ length: Math.min(weeks, 8) }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <Calendar className="w-5 h-5 text-primary" weight="bold" />
           Interview Schedule
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-3 bg-secondary/50 px-4 py-3 rounded-lg border">
            <div className="p-2 bg-background rounded border shadow-sm">
              <Calendar className="w-4 h-4 text-primary" weight="bold" />
            </div>
            <div>
              <span className="block font-bold text-lg leading-none mb-0.5">{totalSessions}</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Total Sessions</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-secondary/50 px-4 py-3 rounded-lg border">
            <div className="p-2 bg-background rounded border shadow-sm">
              <ArrowClockwise className="w-4 h-4 text-primary" weight="bold" />
            </div>
            <div>
              <span className="block font-bold text-lg leading-none mb-0.5">{cadence}</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Cadence</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-secondary/50 px-4 py-3 rounded-lg border">
            <div className="p-2 bg-background rounded border shadow-sm">
              <Clock className="w-4 h-4 text-primary" weight="bold" />
            </div>
            <div>
              <span className="block font-bold text-lg leading-none mb-0.5">{duration}</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Duration</span>
            </div>
          </div>
        </div>

        {/* Timeline grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {weekBlocks.map((week) => (
            <div
              key={week}
              className="group rounded-lg p-4 text-center cursor-pointer transition-all border bg-card hover:border-primary hover:shadow-sm"
            >
              <div className="font-semibold text-sm mb-1 text-primary">
                Week {week}
              </div>
              <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Session {week}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

