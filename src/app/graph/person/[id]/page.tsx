'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Lightbulb, FolderSimple, ArrowRight, TreeStructure, GitBranch, Brain, Target, Sparkle } from 'phosphor-react';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/context/app-context';
import { useKnowledgeCoverageStats } from '@/lib/hooks/use-knowledge-coverage';
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

interface InsightTypeCount {
  type: string;
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}

const INSIGHT_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  concept: { label: 'Concepts', icon: Brain, color: '#8b5cf6' },
  process: { label: 'Processes', icon: TreeStructure, color: '#3b82f6' },
  decision: { label: 'Decisions', icon: GitBranch, color: '#f59e0b' },
  lesson: { label: 'Lessons', icon: Sparkle, color: '#10b981' },
  skill: { label: 'Skills', icon: Target, color: '#ef4444' },
};

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading: authLoading } = useApp();
  const supabase = useMemo(() => createClient(), []);
  const personId = typeof params.id === 'string' ? params.id : '';

  const [expert, setExpert] = useState<ExpertData | null>(null);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Use the knowledge coverage hook for accurate coverage calculation
  const { coveragePercentage, coveredCount, totalCount, isLoading: coverageLoading } = useKnowledgeCoverageStats(personId);

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

  // Calculate type counts
  const typeCounts = new Map<string, number>();
  insights.forEach(insight => {
    const type = insight.type || 'concept';
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });

  const insightTypeCounts: InsightTypeCount[] = Object.entries(INSIGHT_TYPE_CONFIG)
    .map(([type, config]) => ({
      type,
      label: config.label,
      count: typeCounts.get(type) || 0,
      icon: config.icon,
      color: config.color,
    }))
    .filter(tc => tc.count > 0)
    .sort((a, b) => b.count - a.count);

  // Get unique projects
  const projectsWithCounts = insights.reduce<Record<string, { id: string; name: string; count: number }>>((acc, insight) => {
    if (insight.projectId && insight.projectName) {
      if (!acc[insight.projectId]) {
        acc[insight.projectId] = { id: insight.projectId, name: insight.projectName, count: 0 };
      }
      acc[insight.projectId].count++;
    }
    return acc;
  }, {});
  const projects = Object.values(projectsWithCounts).sort((a, b) => b.count - a.count);

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
            <p className="text-3xl font-semibold font-serif">{projects.length}</p>
          </div>
          <div className="border rounded-lg bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Knowledge Coverage</span>
              <span className="text-sm font-semibold">
                {totalCount > 0 ? `${coveragePercentage}%` : 'No topics defined'}
              </span>
            </div>
            {totalCount > 0 ? (
              <>
                <SimpleProgressBar
                  value={coveragePercentage}
                  color={coveragePercentage >= 70 ? 'bg-emerald-500' : coveragePercentage >= 40 ? 'bg-amber-500' : 'bg-red-400'}
                  size="lg"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {coveredCount} of {totalCount} topics covered
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Topics will be tracked during interview sessions
              </p>
            )}
          </div>
        </div>

        {/* Insights with Filters */}
        {insights.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Insights</h2>

            {/* Filter Chips */}
            <div className="space-y-3 mb-4">
              {/* Type filters */}
              {insightTypeCounts.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium min-w-[60px]">Type:</span>
                  {insightTypeCounts.map(({ type, label, count, icon: Icon, color }) => {
                    const isSelected = selectedTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedTypes(prev =>
                          isSelected ? prev.filter(t => t !== type) : [...prev, type]
                        )}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-foreground text-background'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        <Icon className="w-3 h-3" style={{ color: isSelected ? 'currentColor' : color }} weight="fill" />
                        {label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Project filters */}
              {projects.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium min-w-[60px]">Project:</span>
                  {projects.map((project) => {
                    const isSelected = selectedProjects.includes(project.id);
                    return (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProjects(prev =>
                          isSelected ? prev.filter(p => p !== project.id) : [...prev, project.id]
                        )}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-foreground text-background'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        <FolderSimple className="w-3 h-3" weight="fill" />
                        {project.name} ({project.count})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Clear filters */}
              {(selectedTypes.length > 0 || selectedProjects.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedTypes([]);
                    setSelectedProjects([]);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Filtered Insights List */}
            {(() => {
              const filteredInsights = insights.filter(insight => {
                const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(insight.type);
                const projectMatch = selectedProjects.length === 0 ||
                  (insight.projectId && selectedProjects.includes(insight.projectId));
                return typeMatch && projectMatch;
              });

              if (filteredInsights.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No insights match the selected filters
                  </div>
                );
              }

              return (
                <div className="border rounded-lg overflow-hidden bg-card divide-y">
                  {filteredInsights.slice(0, 20).map((insight) => (
                    <div
                      key={insight.id}
                      className="px-5 py-4 hover:bg-secondary/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" weight="fill" />
                        <div className="flex-1">
                          <p className="font-medium mb-1">{insight.title}</p>
                          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                          {insight.projectName && (
                            <p className="text-xs text-muted-foreground">{insight.projectName}</p>
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 bg-secondary rounded capitalize flex-shrink-0">
                          {insight.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
