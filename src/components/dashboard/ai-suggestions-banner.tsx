'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Zap, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AISuggestionsBannerProps {
  onReviewAll: () => void;
}

const suggestions = [
  {
    text: 'Recommend 2 additional sessions for Patricia to reach 100% coverage',
    highlight: '2 additional sessions',
    priority: 'high',
  },
  {
    text: 'Consider focusing on "Team Leadership" skill gap for Michael',
    highlight: '"Team Leadership"',
    priority: 'medium',
  },
  {
    text: 'James Morrison: Ready to start initial sessions',
    highlight: 'Ready to start',
    priority: 'low',
  },
];

export function AISuggestionsBanner({ onReviewAll }: AISuggestionsBannerProps) {
  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">AI Suggested Changes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Based on progress, skills captured, and report analysis
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="px-2.5">
            3 new
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <div className="grid gap-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-md border p-3 hover:bg-secondary/40 transition-colors cursor-pointer"
            >
              <div className={cn(
                "mt-0.5 rounded-full p-1",
                suggestion.priority === 'high' && "text-red-600 bg-red-50",
                suggestion.priority === 'medium' && "text-amber-600 bg-amber-50",
                suggestion.priority === 'low' && "text-emerald-600 bg-emerald-50"
              )}>
                <Zap className="h-3 w-3" />
              </div>
              <div className="flex-1 text-sm">
                {suggestion.text.split(suggestion.highlight).map((part, i, arr) => (
                  <span key={i} className="text-muted-foreground">
                    {part}
                    {i < arr.length - 1 && (
                      <span className="font-medium text-foreground">
                        {suggestion.highlight}
                      </span>
                    )}
                  </span>
                ))}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </div>
          ))}
        </div>
        
        <Button onClick={onReviewAll} className="w-full md:w-auto mt-2 md:mt-0">
          Review All
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
