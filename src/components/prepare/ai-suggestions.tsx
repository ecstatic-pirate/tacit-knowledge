'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Target, Check, Calendar, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AISuggestionsProps {
  onAccept: () => void;
  onEdit: () => void;
}

const suggestedSkills = [
  { name: 'System Architecture & Design', confidence: 95 },
  { name: 'Billing Reconciliation', confidence: 92 },
  { name: 'Payment Processing', confidence: 88 },
  { name: 'Error Handling', confidence: 85 },
  { name: 'Incident Response', confidence: 90 },
  { name: 'Legacy System Integration', confidence: 78 },
];

const weeklyTopics = [
  { week: 1, topic: 'Arch' },
  { week: 2, topic: 'Bill' },
  { week: 3, topic: 'Pay' },
  { week: 4, topic: 'Error' },
  { week: 5, topic: 'Inc' },
  { week: 6, topic: 'Leg' },
  { week: 7, topic: '+8' },
];

export function AISuggestions({ onAccept, onEdit }: AISuggestionsProps) {
  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex items-center gap-3">
           <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">AI Analysis</CardTitle>
            <p className="text-xs text-muted-foreground">Generated from uploaded documents</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
          <TrendingUp className="h-3 w-3" />
          87% Match Confidence
        </Badge>
      </CardHeader>

      <CardContent className="p-6 grid gap-8 lg:grid-cols-2">
        {/* Skills Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Target className="h-3.5 w-3.5" />
              Detected Skills ({suggestedSkills.length})
            </div>
          </div>
          
          <div className="grid gap-2">
            {suggestedSkills.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center justify-between rounded-md border bg-card px-3 py-2 transition-colors hover:bg-secondary/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded border bg-secondary text-transparent">
                    <Check className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{skill.name}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{skill.confidence}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Plan Column */}
        <div className="space-y-4 lg:border-l lg:pl-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              Proposed Timeline
            </div>
            <span className="text-xs text-muted-foreground">14 Weeks Total</span>
          </div>

          <div className="space-y-6">
            {/* Timeline Visualization */}
            <div className="rounded-lg border bg-secondary/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Weekly Sessions</span>
                </div>
                <span className="text-xs text-muted-foreground">14 Sessions</span>
              </div>
              
              <div className="flex gap-1">
                {weeklyTopics.map((item) => (
                  <div key={item.week} className="group flex-1 cursor-help">
                    <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-full bg-muted-foreground/50 transition-colors group-hover:bg-primary" />
                    </div>
                    <div className="text-center text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                      W{item.week}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-3">
                <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Cadence</div>
                <div className="text-sm font-medium">Weekly</div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Format</div>
                <div className="text-sm font-medium">Live Interview</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-3 border-t bg-secondary/20 py-4">
        <Button
          variant="secondary"
          onClick={onEdit}
          size="sm"
        >
          Edit Plan
        </Button>
        <Button
          onClick={onAccept}
          size="sm"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Accept Proposal
        </Button>
      </CardFooter>
    </Card>
  );
}
