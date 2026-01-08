'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Lightbulb, FolderSimple, ArrowRight } from 'phosphor-react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { SimpleProgressBar } from '@/components/ui/coverage-bar';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { containers } from '@/lib/design-system';
import { cn } from '@/lib/utils';

interface ExpertData {
  id: string;
  name: string;
  role: string;
  department?: string;
  teamId?: string;
  teamName?: string;
  teamColor?: string;
}

interface InsightData {
  id: string;
  title: string;
  description: string;
  type: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
}

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading } = useApp();
  const supabase = useMemo(() => createClient(), []);
  const personId = typeof params.id === 'string' ? params.id : '';

  const [expert, setExpert] = useState<ExpertData | null>(null);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch campaign (expert)
      const { data: campaign } = await supabase
        .from('campaigns')
        .select(`
          id, expert_name, expert_role, department, team_id,
          teams (id, name, color)
        `)
        .eq('id', personId)
        .single();

      if (campaign) {
        const team = campaign.teams as { id: string; name: string; color: string } | null;
        setExpert({
          id: campaign.id,
          name: campaign.expert_name,
          role: campaign.expert_role,
          department: campaign.department || undefined,
          teamId: campaign.team_id || undefined,
          teamName: team?.name,
          teamColor: team?.color,
        });

        // Fetch insights for this expert
        const { data: nodes } = await supabase
          .from('graph_nodes')
          .select(`
            id, label, description, type, project_id, created_at,
            projects (id, name)
          `)
          .eq('campaign_id', campaign.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (nodes) {
          setInsights(nodes.map(n => {
            const project = n.projects as { id: string; name: string } | null;
            return {
              id: n.id,
              title: n.label,
              description: n.description || '',
              type: n.type,
              projectId: project?.id,
              projectName: project?.name,
              createdAt: n.created_at || '',
            };
          }));
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [personId, supabase, authLoading]);

  if (isLoading) {
    return (
      <div className={containers.pageContainer}>
        <div className={containers.wideContainer}>
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className={containers.pageContainer}>
        <div className={containers.wideContainer}>
          <EmptyState
            icon={Lightbulb}
            title="Expert not found"
            description="The expert you're looking for doesn't exist or has been removed."
          />
        </div>
      </div>
    );
  }

  const initials = expert.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const coverage = Math.min(100, Math.round((insights.length / 15) * 100));

  // Group insights by project
  const insightsByProject = insights.reduce<Record<string, InsightData[]>>((acc, insight) => {
    const key = insight.projectName || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(insight);
    return acc;
  }, {});

  // Get unique topics
  const topics = [...new Set(insights.map(i => i.type))].slice(0, 8);

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/graph')}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
          Back to Knowledge Hub
        </Button>

        {/* Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 min-w-[5rem] rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-serif mb-1">{expert.name}</h1>
            <p className="text-lg text-muted-foreground mb-3">{expert.role}</p>
            {expert.teamName && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium"
                style={{
                  backgroundColor: expert.teamColor ? `${expert.teamColor}20` : 'hsl(var(--secondary))',
                  color: expert.teamColor || 'hsl(var(--muted-foreground))',
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: expert.teamColor || 'currentColor' }}
                />
                {expert.teamName}
              </span>
            )}
          </div>
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
              <FolderSimple className="w-5 h-5 text-muted-foreground" weight="fill" />
              <span className="text-sm text-muted-foreground">Projects Documented</span>
            </div>
            <p className="text-3xl font-semibold font-serif">{Object.keys(insightsByProject).length}</p>
          </div>
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Knowledge Coverage</span>
              <span className="text-sm font-semibold">{coverage}%</span>
            </div>
            <SimpleProgressBar
              value={coverage}
              color={coverage >= 70 ? 'bg-emerald-500' : coverage >= 40 ? 'bg-amber-500' : 'bg-red-400'}
              size="lg"
            />
          </div>
        </div>

        {/* Topics */}
        {topics.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Expertise Areas</h2>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-secondary text-sm text-muted-foreground rounded-full capitalize"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Insights by Project */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Knowledge by Project</h2>
          <div className="space-y-6">
            {Object.entries(insightsByProject).map(([projectName, projectInsights]) => (
              <div key={projectName} className="border rounded-lg overflow-hidden bg-card">
                <div className="bg-secondary/30 px-5 py-3 flex items-center justify-between border-b">
                  <span className="font-semibold">{projectName}</span>
                  <span className="text-sm text-muted-foreground">{projectInsights.length} insights</span>
                </div>
                <div className="divide-y">
                  {projectInsights.map((insight) => (
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
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-secondary rounded capitalize flex-shrink-0">
                          {insight.type}
                        </span>
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
  );
}
