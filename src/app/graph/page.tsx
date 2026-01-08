'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, FolderSimple, UsersFour, Lightbulb, Warning, MagnifyingGlass } from 'phosphor-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { KnowledgeHubSkeleton } from '@/components/ui/skeleton';
import { ViewToggle } from '@/components/ui/view-toggle';
import { containers, spacing } from '@/lib/design-system';
import {
  useKnowledgeHubData,
  PersonCard,
  ProjectCard,
  TeamCard,
  type KnowledgeViewType,
  type KnowledgeExpert,
  type KnowledgeProject,
  type KnowledgeTeam,
} from '@/components/knowledge-hub';

export default function KnowledgeHubPage() {
  const router = useRouter();
  const { stats, experts, projects, teams, gaps, isLoading, error } = useKnowledgeHubData();
  const [viewType, setViewType] = useState<KnowledgeViewType>('person');
  const [searchQuery, setSearchQuery] = useState('');

  const viewOptions = [
    { value: 'person' as const, label: 'People', icon: <User className="w-4 h-4" weight="bold" /> },
    { value: 'project' as const, label: 'Projects', icon: <FolderSimple className="w-4 h-4" weight="bold" /> },
    { value: 'team' as const, label: 'Teams', icon: <UsersFour className="w-4 h-4" weight="bold" /> },
  ];

  // Filter data based on search query
  const filteredExperts = useMemo(() => {
    if (!searchQuery.trim()) return experts;
    const query = searchQuery.toLowerCase();
    return experts.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.role.toLowerCase().includes(query) ||
        e.teamName?.toLowerCase().includes(query)
    );
  }, [experts, searchQuery]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const query = searchQuery.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
    );
  }, [teams, searchQuery]);

  // Handlers - navigate to full page views
  const handleExpertClick = (expert: KnowledgeExpert) => {
    router.push(`/graph/person/${expert.id}`);
  };

  const handleProjectClick = (project: KnowledgeProject) => {
    router.push(`/graph/project/${project.id}`);
  };

  const handleTeamClick = (team: KnowledgeTeam) => {
    router.push(`/graph/team/${team.id}`);
  };

  if (isLoading) {
    return (
      <div className={containers.pageContainer}>
        <div className={containers.wideContainer}>
          <KnowledgeHubSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containers.pageContainer}>
        <div className={containers.pageInner}>
          <EmptyState
            icon={Warning}
            title="Error loading knowledge"
            description={error}
          />
        </div>
      </div>
    );
  }

  const hasContent = stats.totalInsights > 0;

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <PageHeader
            title="Knowledge Hub"
            subtitle={
              hasContent
                ? `Explore ${stats.totalInsights} insights from ${stats.totalExperts} experts across ${stats.totalProjects} projects`
                : 'Your organization\'s captured knowledge will appear here'
            }
          />
          {hasContent && (
            <ViewToggle
              options={viewOptions}
              value={viewType}
              onChange={setViewType}
            />
          )}
        </div>

        {!hasContent ? (
          <EmptyState
            icon={Lightbulb}
            title="No knowledge captured yet"
            description="Complete capture sessions with your experts to build your knowledge base. Knowledge will appear here once sessions are processed."
          />
        ) : (
          <>
            {/* Stats Row */}
            <div className={cn('grid grid-cols-4 gap-4', spacing.marginBottomSection)}>
              <div className="border rounded-lg bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <User className="w-4 h-4 text-primary" weight="bold" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold font-serif">{stats.totalExperts}</p>
                    <p className="text-xs text-muted-foreground">Experts</p>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <FolderSimple className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold font-serif">{stats.totalProjects}</p>
                    <p className="text-xs text-muted-foreground">Projects</p>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <UsersFour className="w-4 h-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold font-serif">{stats.totalTeams}</p>
                    <p className="text-xs text-muted-foreground">Teams</p>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-50">
                    <Lightbulb className="w-4 h-4 text-amber-600" weight="bold" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold font-serif">{stats.totalInsights}</p>
                    <p className="text-xs text-muted-foreground">Insights</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Gaps Alert */}
            {gaps.length > 0 && gaps.some((g) => g.severity === 'high') && (
              <div className={cn('border border-amber-200 bg-amber-50/50 rounded-lg p-4', spacing.marginBottomSection)}>
                <div className="flex items-start gap-3">
                  <Warning className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">Knowledge Gaps Detected</h3>
                    <p className="text-sm text-amber-700">
                      {gaps.filter((g) => g.severity === 'high').length} critical areas need documentation.{' '}
                      {gaps.filter((g) => g.severity === 'high').slice(0, 2).map((g) => g.area).join(', ')}
                      {gaps.filter((g) => g.severity === 'high').length > 2 && ' and more'}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className={cn('relative', spacing.marginBottomSection)}>
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" weight="bold" />
              <input
                type="text"
                placeholder={`Search ${viewType === 'person' ? 'experts' : viewType === 'project' ? 'projects' : 'teams'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>

            {/* Content Grid */}
            {viewType === 'person' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExperts.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      icon={User}
                      title="No experts found"
                      description={searchQuery ? 'Try adjusting your search query' : 'No experts have been documented yet'}
                    />
                  </div>
                ) : (
                  filteredExperts.map((expert) => (
                    <PersonCard
                      key={expert.id}
                      expert={expert}
                      onClick={() => handleExpertClick(expert)}
                    />
                  ))
                )}
              </div>
            )}

            {viewType === 'project' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProjects.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      icon={FolderSimple}
                      title="No projects found"
                      description={searchQuery ? 'Try adjusting your search query' : 'No projects have been documented yet'}
                    />
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={() => handleProjectClick(project)}
                    />
                  ))
                )}
              </div>
            )}

            {viewType === 'team' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      icon={UsersFour}
                      title="No teams found"
                      description={searchQuery ? 'Try adjusting your search query' : 'No teams have been documented yet'}
                    />
                  </div>
                ) : (
                  filteredTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      onClick={() => handleTeamClick(team)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
