'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Lightbulb, FolderSimple, UsersFour, ArrowRight } from 'phosphor-react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { SimpleProgressBar } from '@/components/ui/coverage-bar';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { containers } from '@/lib/design-system';
import Link from 'next/link';

interface TeamData {
  id: string;
  name: string;
  description?: string;
  color: string;
}

interface MemberData {
  id: string;
  name: string;
  role: string;
  insightCount: number;
}

interface ProjectData {
  id: string;
  name: string;
  insightCount: number;
  coverage: number;
}

interface InsightData {
  id: string;
  title: string;
  description: string;
  type: string;
  expertName: string;
  projectName?: string;
  createdAt: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading } = useApp();
  const supabase = useMemo(() => createClient(), []);
  const teamId = typeof params.id === 'string' ? params.id : '';

  const [team, setTeam] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch team
      const { data: teamData } = await supabase
        .from('teams')
        .select('id, name, description, color')
        .eq('id', teamId)
        .single();

      if (teamData) {
        setTeam({
          id: teamData.id,
          name: teamData.name,
          description: teamData.description || undefined,
          color: teamData.color || '#6b7280',
        });

        // Fetch team members (campaigns)
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, expert_name, expert_role')
          .eq('team_id', teamData.id)
          .is('deleted_at', null);

        // Fetch all insights for this team's members
        const campaignIds = campaigns?.map(c => c.id) || [];

        let nodes: any[] = [];
        if (campaignIds.length > 0) {
          const { data: nodesData } = await supabase
            .from('graph_nodes')
            .select(`
              id, label, description, type, campaign_id, project_id, created_at,
              campaigns (expert_name),
              projects (id, name)
            `)
            .in('campaign_id', campaignIds)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
          nodes = nodesData || [];
        }

        // Build members with insight counts
        const membersList: MemberData[] = (campaigns || []).map(c => ({
          id: c.id,
          name: c.expert_name,
          role: c.expert_role,
          insightCount: nodes.filter(n => n.campaign_id === c.id).length,
        })).sort((a, b) => b.insightCount - a.insightCount);
        setMembers(membersList);

        // Build projects
        const projectMap = new Map<string, { id: string; name: string; count: number }>();
        nodes.forEach(n => {
          const project = n.projects as { id: string; name: string } | null;
          if (project) {
            const existing = projectMap.get(project.id);
            if (existing) {
              existing.count++;
            } else {
              projectMap.set(project.id, { id: project.id, name: project.name, count: 1 });
            }
          }
        });
        const projectsList: ProjectData[] = Array.from(projectMap.values())
          .map(p => ({
            id: p.id,
            name: p.name,
            insightCount: p.count,
            coverage: Math.min(100, Math.round((p.count / 10) * 100)),
          }))
          .sort((a, b) => b.insightCount - a.insightCount);
        setProjects(projectsList);

        // Build insights
        const insightsList: InsightData[] = nodes.map(n => {
          const campaign = n.campaigns as { expert_name: string } | null;
          const project = n.projects as { id: string; name: string } | null;
          return {
            id: n.id,
            title: n.label,
            description: n.description || '',
            type: n.type,
            expertName: campaign?.expert_name || 'Unknown',
            projectName: project?.name,
            createdAt: n.created_at || '',
          };
        });
        setInsights(insightsList);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [teamId, supabase, authLoading]);

  if (isLoading) {
    return (
      <div className={containers.pageContainer}>
        <div className={containers.wideContainer}>
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className={containers.pageContainer}>
        <div className={containers.wideContainer}>
          <EmptyState
            icon={UsersFour}
            title="Team not found"
            description="The team you're looking for doesn't exist or has been removed."
          />
        </div>
      </div>
    );
  }

  const avgCoverage = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.coverage, 0) / projects.length)
    : 0;

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/graph?view=team')}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
          Back to Knowledge Hub
        </Button>

        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <div
            className="w-20 h-20 min-w-[5rem] rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${team.color}20` }}
          >
            <UsersFour className="w-10 h-10" style={{ color: team.color }} weight="fill" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-serif">{team.name}</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-muted-foreground">Team Members</span>
            </div>
            <p className="text-3xl font-semibold font-serif">{members.length}</p>
          </div>
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <FolderSimple className="w-5 h-5 text-muted-foreground" weight="fill" />
              <span className="text-sm text-muted-foreground">Projects</span>
            </div>
            <p className="text-3xl font-semibold font-serif">{projects.length}</p>
          </div>
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" weight="fill" />
              <span className="text-sm text-muted-foreground">Insights</span>
            </div>
            <p className="text-3xl font-semibold font-serif">{insights.length}</p>
          </div>
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Avg. Coverage</span>
              <span className="text-sm font-semibold">{avgCoverage}%</span>
            </div>
            <SimpleProgressBar
              value={avgCoverage}
              color={avgCoverage >= 70 ? 'bg-emerald-500' : avgCoverage >= 40 ? 'bg-amber-500' : 'bg-red-400'}
              size="lg"
            />
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Members */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Team Members</h2>
            <div className="space-y-2">
              {members.map((member) => {
                const initials = member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);
                return (
                  <Link
                    key={member.id}
                    href={`/graph/person/${member.id}`}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div
                      className="w-12 h-12 min-w-[3rem] rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                      style={{ backgroundColor: `${team.color}20`, color: team.color }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lightbulb className="w-4 h-4 text-amber-500" weight="fill" />
                      <span className="text-sm font-medium">{member.insightCount}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Projects */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Projects Documented</h2>
            <div className="space-y-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/graph/project/${project.id}`}
                  className="block border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{project.name}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{project.insightCount} insights</span>
                    <span className="text-sm font-medium">{project.coverage}%</span>
                  </div>
                  <SimpleProgressBar
                    value={project.coverage}
                    color={project.coverage >= 70 ? 'bg-emerald-500' : project.coverage >= 40 ? 'bg-amber-500' : 'bg-red-400'}
                    size="sm"
                  />
                </Link>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No projects documented yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Insights */}
        {insights.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Recent Insights</h2>
            <div className="border rounded-lg overflow-hidden bg-card divide-y">
              {insights.slice(0, 10).map((insight) => (
                <div
                  key={insight.id}
                  className="px-5 py-4 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" weight="fill" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">{insight.title}</p>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{insight.expertName}</span>
                        {insight.projectName && (
                          <>
                            <span>·</span>
                            <span>{insight.projectName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-secondary rounded capitalize flex-shrink-0">
                      {insight.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
