'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Lightbulb, Users, Warning, ArrowRight } from 'phosphor-react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { CoverageBar } from '@/components/ui/coverage-bar';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { containers } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold';
}

interface ContributorData {
  id: string;
  name: string;
  insightCount: number;
  teamColor?: string;
}

interface TeamBreakdown {
  teamId: string;
  teamName: string;
  teamColor: string;
  insightCount: number;
}

interface InsightData {
  id: string;
  title: string;
  description: string;
  type: string;
  expertId: string;
  expertName: string;
  createdAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading } = useApp();
  const supabase = useMemo(() => createClient(), []);
  const projectId = typeof params.id === 'string' ? params.id : '';

  const [project, setProject] = useState<ProjectData | null>(null);
  const [contributors, setContributors] = useState<ContributorData[]>([]);
  const [teamBreakdown, setTeamBreakdown] = useState<TeamBreakdown[]>([]);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch project
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, name, description, status')
        .eq('id', projectId)
        .single();

      if (projectData) {
        setProject({
          id: projectData.id,
          name: projectData.name,
          description: projectData.description || undefined,
          status: (projectData.status as ProjectData['status']) || 'active',
        });

        // Fetch insights for this project
        const { data: nodes } = await supabase
          .from('graph_nodes')
          .select(`
            id, label, description, type, campaign_id, created_at,
            campaigns (id, expert_name, team_id, teams (id, name, color))
          `)
          .eq('project_id', projectData.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (nodes) {
          // Build insights
          const insightsList: InsightData[] = nodes.map(n => {
            const campaign = n.campaigns as { id: string; expert_name: string; team_id: string | null; teams: { id: string; name: string; color: string } | null } | null;
            return {
              id: n.id,
              title: n.label,
              description: n.description || '',
              type: n.type,
              expertId: campaign?.id || '',
              expertName: campaign?.expert_name || 'Unknown',
              createdAt: n.created_at || '',
            };
          });
          setInsights(insightsList);

          // Build contributors
          const contributorMap = new Map<string, ContributorData>();
          nodes.forEach(n => {
            const campaign = n.campaigns as { id: string; expert_name: string; team_id: string | null; teams: { id: string; name: string; color: string } | null } | null;
            if (campaign) {
              const existing = contributorMap.get(campaign.id);
              if (existing) {
                existing.insightCount++;
              } else {
                contributorMap.set(campaign.id, {
                  id: campaign.id,
                  name: campaign.expert_name,
                  insightCount: 1,
                  teamColor: campaign.teams?.color,
                });
              }
            }
          });
          setContributors(Array.from(contributorMap.values()).sort((a, b) => b.insightCount - a.insightCount));

          // Build team breakdown
          const teamMap = new Map<string, TeamBreakdown>();
          nodes.forEach(n => {
            const campaign = n.campaigns as { id: string; expert_name: string; team_id: string | null; teams: { id: string; name: string; color: string } | null } | null;
            const team = campaign?.teams;
            if (team) {
              const existing = teamMap.get(team.id);
              if (existing) {
                existing.insightCount++;
              } else {
                teamMap.set(team.id, {
                  teamId: team.id,
                  teamName: team.name,
                  teamColor: team.color,
                  insightCount: 1,
                });
              }
            }
          });
          setTeamBreakdown(Array.from(teamMap.values()).sort((a, b) => b.insightCount - a.insightCount));
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [projectId, supabase, authLoading]);

  if (isLoading) {
    return (
      <div className={containers.pageContainer}>
        <div className={containers.wideContainer}>
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={containers.pageContainer}>
        <div className={containers.wideContainer}>
          <EmptyState
            icon={Lightbulb}
            title="Project not found"
            description="The project you're looking for doesn't exist or has been removed."
          />
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-emerald-50 text-emerald-700',
    completed: 'bg-secondary text-muted-foreground',
    on_hold: 'bg-amber-50 text-amber-700',
  };

  const statusLabels = {
    active: 'Active',
    completed: 'Completed',
    on_hold: 'On Hold',
  };

  const coverageSegments = teamBreakdown.map(team => ({
    label: team.teamName,
    value: team.insightCount,
    color: team.teamColor,
  }));

  // Detect coverage gaps
  const coverageGaps: string[] = [];
  if (teamBreakdown.length === 1) coverageGaps.push('Single team perspective');
  if (contributors.length === 1) coverageGaps.push('Single contributor');
  if (insights.length < 5) coverageGaps.push('Limited documentation');

  // Group insights by type
  const insightsByType = insights.reduce<Record<string, InsightData[]>>((acc, insight) => {
    const key = insight.type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(insight);
    return acc;
  }, {});

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/graph?view=project')}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
          Back to Knowledge Hub
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-serif">{project.name}</h1>
            <span className={cn('px-3 py-1 rounded text-sm font-medium', statusColors[project.status])}>
              {statusLabels[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="text-lg text-muted-foreground">{project.description}</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" weight="fill" />
              <span className="text-sm text-muted-foreground">Total Insights</span>
            </div>
            <p className="text-3xl font-semibold font-serif">{insights.length}</p>
          </div>
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" weight="fill" />
              <span className="text-sm text-muted-foreground">Contributors</span>
            </div>
            <p className="text-3xl font-semibold font-serif">{contributors.length}</p>
          </div>
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-muted-foreground">Teams Involved</span>
            </div>
            <p className="text-3xl font-semibold font-serif">{teamBreakdown.length}</p>
          </div>
        </div>

        {/* Team Coverage */}
        {coverageSegments.length > 0 && (
          <div className="border rounded-lg bg-card p-5 mb-8">
            <h2 className="text-lg font-semibold mb-4">Team Coverage</h2>
            <CoverageBar segments={coverageSegments} showLabels size="lg" />
          </div>
        )}

        {/* Coverage Gaps */}
        {coverageGaps.length > 0 && (
          <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-5 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Warning className="w-5 h-5 text-amber-600" weight="fill" />
              <h2 className="font-semibold text-amber-800">Knowledge Gaps Detected</h2>
            </div>
            <ul className="space-y-2">
              {coverageGaps.map((gap, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-amber-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contributors */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Contributors</h2>
            <div className="space-y-2">
              {contributors.map((contributor) => {
                const initials = contributor.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);
                return (
                  <Link
                    key={contributor.id}
                    href={`/graph/person/${contributor.id}`}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div
                      className="w-10 h-10 min-w-[2.5rem] rounded-full flex items-center justify-center text-sm font-semibold border-2 flex-shrink-0"
                      style={{
                        backgroundColor: contributor.teamColor ? `${contributor.teamColor}20` : 'hsl(var(--primary)/0.1)',
                        borderColor: contributor.teamColor || 'hsl(var(--primary))',
                        color: contributor.teamColor || 'hsl(var(--primary))',
                      }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground">{contributor.insightCount} insights</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Insights by Type */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Knowledge by Type</h2>
            <div className="space-y-6">
              {Object.entries(insightsByType).map(([type, typeInsights]) => (
                <div key={type} className="border rounded-lg overflow-hidden bg-card">
                  <div className="bg-secondary/30 px-5 py-3 flex items-center justify-between border-b">
                    <span className="font-semibold capitalize">{type}</span>
                    <span className="text-sm text-muted-foreground">{typeInsights.length} insights</span>
                  </div>
                  <div className="divide-y">
                    {typeInsights.map((insight) => (
                      <div
                        key={insight.id}
                        className="px-5 py-4 hover:bg-secondary/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Lightbulb className="w-4 h-4 text-amber-500" weight="fill" />
                              <p className="font-medium">{insight.title}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                            <p className="text-xs text-muted-foreground">by {insight.expertName}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
