'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Target,
  Check,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface AISuggestionsProps {
  campaignId?: string;
  extractedSkills?: string[];
  onAccept: () => void;
  onEdit: () => void;
}

interface SuggestedSkill {
  name: string;
  confidence: number;
  category?: string;
}

interface SessionPlan {
  sessionNumber: number;
  topic: string;
  skills: string[];
}

interface CampaignPlan {
  totalSessions: number;
  cadence: string;
  duration: string;
  sessions: SessionPlan[];
  overallConfidence: number;
}

export function AISuggestions({
  campaignId,
  extractedSkills = [],
  onAccept,
  onEdit,
}: AISuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<SuggestedSkill[]>([]);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const supabase = createClient();

  // Fetch AI suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!campaignId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Get existing skills for this campaign
      const { data: existingSkills } = await supabase
        .from('skills')
        .select('name, confidence, category')
        .eq('campaign_id', campaignId);

      // Get documents for context
      const { data: documents } = await supabase
        .from('documents')
        .select('filename, extracted_skills')
        .eq('campaign_id', campaignId)
        .eq('ai_processed', true);

      // Combine all skills
      const allSkills: SuggestedSkill[] = [];

      // Add existing skills from database
      if (existingSkills) {
        existingSkills.forEach((s) => {
          allSkills.push({
            name: s.name,
            confidence: (s.confidence ?? 0.8) * 100,
            category: s.category ?? undefined,
          });
        });
      }

      // Add extracted skills from props (from document processing)
      extractedSkills.forEach((skillName) => {
        if (!allSkills.find((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
          allSkills.push({
            name: skillName,
            confidence: 85,
          });
        }
      });

      // Add skills extracted from documents
      if (documents) {
        documents.forEach((doc) => {
          const docSkills = doc.extracted_skills as string[] | null;
          if (docSkills) {
            docSkills.forEach((skillName: string) => {
              if (!allSkills.find((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
                allSkills.push({
                  name: skillName,
                  confidence: 80,
                });
              }
            });
          }
        });
      }

      // Sort by confidence
      allSkills.sort((a, b) => b.confidence - a.confidence);
      setSkills(allSkills.slice(0, 10)); // Top 10 skills

      // Generate a simple plan based on skills count
      const totalSkills = allSkills.length;
      const sessionsNeeded = Math.max(8, Math.min(16, Math.ceil(totalSkills / 2) + 4));

      const sessionPlan: SessionPlan[] = [];
      for (let i = 0; i < Math.min(7, sessionsNeeded); i++) {
        const skillsForSession = allSkills.slice(i * 2, i * 2 + 2);
        sessionPlan.push({
          sessionNumber: i + 1,
          topic: skillsForSession[0]?.name.split(' ')[0] || `Session ${i + 1}`,
          skills: skillsForSession.map((s) => s.name),
        });
      }

      setPlan({
        totalSessions: sessionsNeeded,
        cadence: 'Weekly',
        duration: `${Math.ceil(sessionsNeeded / 1.5)} weeks`,
        sessions: sessionPlan,
        overallConfidence: allSkills.length > 0
          ? Math.round(allSkills.reduce((sum, s) => sum + s.confidence, 0) / allSkills.length)
          : 75,
      });

      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, extractedSkills, supabase]);

  // Auto-fetch when campaign or skills change
  useEffect(() => {
    if (campaignId && (extractedSkills.length > 0 || !hasFetched)) {
      fetchSuggestions();
    }
  }, [campaignId, extractedSkills.length, hasFetched, fetchSuggestions]);

  // Show placeholder when no campaign
  if (!campaignId) {
    return (
      <Card className="mb-8 opacity-60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">AI Analysis</CardTitle>
              <p className="text-xs text-muted-foreground">
                Create a campaign to generate suggestions
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-neutral-400 py-8">
            Upload documents after creating a campaign to get AI-powered skill suggestions
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base">AI Analysis</CardTitle>
            <p className="text-xs text-muted-foreground">
              {skills.length > 0
                ? 'Generated from uploaded documents'
                : 'Upload documents to generate suggestions'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
          {plan && (
            <Badge
              variant="outline"
              className="gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
            >
              <TrendingUp className="h-3 w-3" />
              {plan.overallConfidence}% Match Confidence
            </Badge>
          )}
        </div>
      </CardHeader>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <CardContent className="p-6 grid gap-8 lg:grid-cols-2">
        {/* Skills Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Target className="h-3.5 w-3.5" />
              Detected Skills ({skills.length})
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : skills.length === 0 ? (
            <div className="text-center text-neutral-400 py-8 text-sm">
              Upload and analyze documents to detect skills
            </div>
          ) : (
            <div className="grid gap-2">
              {skills.map((skill) => (
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
                  <span className="text-xs font-mono text-muted-foreground">
                    {Math.round(skill.confidence)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Plan Column */}
        <div className="space-y-4 lg:border-l lg:pl-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5" />
              Proposed Timeline
            </div>
            {plan && (
              <span className="text-xs text-muted-foreground">
                {plan.totalSessions} Sessions Total
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !plan ? (
            <div className="text-center text-neutral-400 py-8 text-sm">
              Plan will be generated after skill detection
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timeline Visualization */}
              <div className="rounded-lg border bg-secondary/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">Weekly Sessions</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {plan.totalSessions} Sessions
                  </span>
                </div>

                <div className="flex gap-1">
                  {plan.sessions.map((session) => (
                    <div key={session.sessionNumber} className="group flex-1 cursor-help">
                      <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full w-full bg-muted-foreground/50 transition-colors group-hover:bg-primary" />
                      </div>
                      <div className="text-center text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                        W{session.sessionNumber}
                      </div>
                    </div>
                  ))}
                  {plan.totalSessions > 7 && (
                    <div className="group flex-1">
                      <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full w-1/2 bg-muted-foreground/30" />
                      </div>
                      <div className="text-center text-[10px] font-medium text-muted-foreground">
                        +{plan.totalSessions - 7}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-card p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                    Cadence
                  </div>
                  <div className="text-sm font-medium">{plan.cadence}</div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
                    Duration
                  </div>
                  <div className="text-sm font-medium">{plan.duration}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-3 border-t bg-secondary/20 py-4">
        <Button variant="secondary" onClick={onEdit} size="sm" disabled={skills.length === 0}>
          Edit Plan
        </Button>
        <Button onClick={onAccept} size="sm" disabled={skills.length === 0}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Accept Proposal
        </Button>
      </CardFooter>
    </Card>
  );
}
