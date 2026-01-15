'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkle, ArrowRight, Lightning, CaretRight, CircleNotch } from 'phosphor-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface AISuggestionsBannerProps {
  onReviewAll: () => void;
}

interface Suggestion {
  text: string;
  highlight: string;
  priority: 'high' | 'medium' | 'low';
  campaignId?: string;
}

export function AISuggestionsBanner({ onReviewAll }: AISuggestionsBannerProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function generateSuggestions() {
      setIsLoading(true);
      const generatedSuggestions: Suggestion[] = [];

      try {
        // Fetch campaigns with their progress
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, expert_name, total_sessions, completed_sessions, status')
          .is('deleted_at', null)
          .is('completed_at', null);

        // Fetch topics that are not captured
        const { data: uncapturedTopics } = await supabase
          .from('topics')
          .select('name, campaign_id, campaigns(expert_name)')
          .eq('captured', false)
          .is('deleted_at', null)
          .limit(5);

        // Fetch upcoming sessions
        const { data: scheduledSessions } = await supabase
          .from('sessions')
          .select('id, session_number, scheduled_at, campaigns(expert_name)')
          .eq('status', 'scheduled')
          .is('deleted_at', null)
          .order('scheduled_at', { ascending: true })
          .limit(3);

        // Generate suggestions based on real data
        if (campaigns) {
          for (const campaign of campaigns) {
            const progress = campaign.total_sessions
              ? (campaign.completed_sessions || 0) / campaign.total_sessions
              : 0;

            // Campaign needs more sessions
            if (progress > 0.5 && progress < 1) {
              const remaining = (campaign.total_sessions || 0) - (campaign.completed_sessions || 0);
              generatedSuggestions.push({
                text: `Recommend ${remaining} more sessions for ${campaign.expert_name} to reach 100% coverage`,
                highlight: `${remaining} more sessions`,
                priority: progress > 0.8 ? 'high' : 'medium',
                campaignId: campaign.id,
              });
            }

            // Campaign at risk
            if (campaign.status === 'danger' || campaign.status === 'keep-track') {
              generatedSuggestions.push({
                text: `${campaign.expert_name}: Campaign needs attention - consider scheduling sessions`,
                highlight: 'needs attention',
                priority: campaign.status === 'danger' ? 'high' : 'medium',
                campaignId: campaign.id,
              });
            }
          }
        }

        // Topic gap suggestions
        if (uncapturedTopics && uncapturedTopics.length > 0) {
          const topicsByExpert = uncapturedTopics.reduce((acc, topic) => {
            const expertName = (topic.campaigns as { expert_name: string } | null)?.expert_name || 'Unknown';
            if (!acc[expertName]) acc[expertName] = [];
            acc[expertName].push(topic.name);
            return acc;
          }, {} as Record<string, string[]>);

          for (const [expert, topics] of Object.entries(topicsByExpert)) {
            if (topics.length > 0) {
              generatedSuggestions.push({
                text: `Focus on "${topics[0]}" topic gap for ${expert}`,
                highlight: `"${topics[0]}"`,
                priority: 'medium',
              });
            }
          }
        }

        // Ready to start suggestions
        if (scheduledSessions && scheduledSessions.length > 0) {
          const session = scheduledSessions[0];
          const expertName = (session.campaigns as { expert_name: string } | null)?.expert_name || 'Expert';
          generatedSuggestions.push({
            text: `${expertName}: Ready to start Session ${session.session_number}`,
            highlight: 'Ready to start',
            priority: 'low',
          });
        }

        setSuggestions(generatedSuggestions.slice(0, 3));
      } catch (error) {
        console.error('Error generating suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    generateSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Don't render if no suggestions
  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkle className="h-4 w-4" weight="bold" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">AI Suggested Actions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Based on campaign progress and topic coverage
              </p>
            </div>
          </div>
          {suggestions.length > 0 && (
            <Badge variant="secondary" className="px-2.5">
              {suggestions.length} new
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <CircleNotch className="w-5 h-5 animate-spin text-muted-foreground" weight="bold" />
          </div>
        ) : (
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
                  <Lightning className="h-3 w-3" weight="bold" />
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
                <CaretRight className="h-4 w-4 text-muted-foreground/50" weight="bold" />
              </div>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <Button onClick={onReviewAll} className="w-full md:w-auto mt-2 md:mt-0">
            Review All
            <ArrowRight className="ml-2 h-4 w-4" weight="bold" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
