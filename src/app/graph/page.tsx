'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, FolderSimple, UsersFour, Lightbulb, Warning, Plus } from 'phosphor-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { KnowledgeHubSkeleton } from '@/components/ui/skeleton';
import { ViewToggle } from '@/components/ui/view-toggle';
import { ExpandableSearch } from '@/components/ui/expandable-search';
import { SortDropdown, type SortOption } from '@/components/ui/sort-dropdown';
import { Button } from '@/components/ui/button';
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
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle capture knowledge - navigate to campaign creation with pre-filled subject type
  const handleCaptureKnowledge = (subjectType: 'person' | 'project' | 'team') => {
    router.push(`/new?subjectType=${subjectType}`);
  };

  const viewOptions = useMemo(() => [
    { value: 'person' as const, label: 'People', icon: <User className="w-4 h-4" weight="bold" />, count: stats.totalExperts },
    { value: 'project' as const, label: 'Projects', icon: <FolderSimple className="w-4 h-4" weight="bold" />, count: stats.totalProjects },
    { value: 'team' as const, label: 'Teams', icon: <UsersFour className="w-4 h-4" weight="bold" />, count: stats.totalTeams },
  ], [stats.totalExperts, stats.totalProjects, stats.totalTeams]);

  // Sort options for each view type
  const sortOptions: Record<KnowledgeViewType, SortOption[]> = {
    person: [
      { value: 'name', label: 'Name' },
      { value: 'insightCount', label: 'Insights' },
      { value: 'coverage', label: 'Coverage' },
    ],
    project: [
      { value: 'name', label: 'Name' },
      { value: 'insightCount', label: 'Insights' },
      { value: 'contributorCount', label: 'Contributors' },
    ],
    team: [
      { value: 'name', label: 'Name' },
      { value: 'memberCount', label: 'Members' },
      { value: 'insightCount', label: 'Insights' },
    ],
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Reset sort when view type changes
  const handleViewTypeChange = (newViewType: KnowledgeViewType) => {
    setViewType(newViewType);
    setSortField('name');
    setSortDirection('desc');
  };

  // Filter and sort data
  const filteredExperts = useMemo(() => {
    let result = experts;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.role.toLowerCase().includes(query) ||
          e.teamName?.toLowerCase().includes(query)
      );
    }
    // Sort
    return [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'insightCount':
          comparison = (a.totalInsights || 0) - (b.totalInsights || 0);
          break;
        case 'coverage':
          comparison = (a.coverage || 0) - (b.coverage || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [experts, searchQuery, sortField, sortDirection]);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }
    // Sort
    return [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'insightCount':
          comparison = (a.totalInsights || 0) - (b.totalInsights || 0);
          break;
        case 'contributorCount':
          comparison = (a.contributors?.length || 0) - (b.contributors?.length || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [projects, searchQuery, sortField, sortDirection]);

  const filteredTeams = useMemo(() => {
    let result = teams;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }
    // Sort
    return [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'memberCount':
          comparison = (a.memberCount || 0) - (b.memberCount || 0);
          break;
        case 'insightCount':
          comparison = (a.totalInsights || 0) - (b.totalInsights || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [teams, searchQuery, sortField, sortDirection]);

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
        <PageHeader
          title="Knowledge Hub"
          subtitle={
            hasContent
              ? `Explore ${stats.totalInsights} insights from ${stats.totalExperts} experts across ${stats.totalProjects} projects`
              : 'Your organization\'s captured knowledge will appear here'
          }
          className="mb-8"
        />

        {!hasContent ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Lightbulb className="w-8 h-8 text-amber-500" weight="fill" />
            </div>
            <h2 className="font-serif text-2xl font-semibold mb-2">No knowledge captured yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Start capturing knowledge from your experts to build your organization&apos;s knowledge base.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <button
                onClick={() => handleCaptureKnowledge('person')}
                className="p-6 border border-border rounded-xl bg-card hover:bg-secondary/50 transition-colors text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6 text-primary" weight="bold" />
                </div>
                <h3 className="font-semibold mb-1">Capture from Expert</h3>
                <p className="text-sm text-muted-foreground">
                  Interview an expert to capture their knowledge
                </p>
              </button>
              <button
                onClick={() => handleCaptureKnowledge('project')}
                className="p-6 border border-border rounded-xl bg-card hover:bg-secondary/50 transition-colors text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FolderSimple className="w-6 h-6 text-blue-600" weight="bold" />
                </div>
                <h3 className="font-semibold mb-1">Document Project</h3>
                <p className="text-sm text-muted-foreground">
                  Capture knowledge about a specific project
                </p>
              </button>
              <button
                onClick={() => handleCaptureKnowledge('team')}
                className="p-6 border border-border rounded-xl bg-card hover:bg-secondary/50 transition-colors text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UsersFour className="w-6 h-6 text-purple-600" weight="bold" />
                </div>
                <h3 className="font-semibold mb-1">Document Team</h3>
                <p className="text-sm text-muted-foreground">
                  Capture team practices and processes
                </p>
              </button>
            </div>
          </div>
        ) : (
          <>
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

            {/* Filter and Search */}
            <div className={cn('flex items-center justify-between gap-4', spacing.marginBottomSection)}>
              <ViewToggle
                options={viewOptions}
                value={viewType}
                onChange={handleViewTypeChange}
              />
              <div className="flex items-center gap-2">
                <SortDropdown
                  options={sortOptions[viewType]}
                  value={sortField}
                  direction={sortDirection}
                  onChange={handleSortChange}
                />
                <ExpandableSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Search ${viewType === 'person' ? 'experts' : viewType === 'project' ? 'projects' : 'teams'}...`}
                />
              </div>
            </div>

            {/* Content Grid */}
            {viewType === 'person' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExperts.length === 0 ? (
                  <div className="col-span-full">
                    {searchQuery ? (
                      <EmptyState
                        icon={User}
                        title="No experts found"
                        description="Try adjusting your search query"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" weight="light" />
                        <h3 className="font-semibold mb-1">No experts documented yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Start capturing knowledge from your team members</p>
                        <Button onClick={() => handleCaptureKnowledge('person')} variant="outline" className="gap-2">
                          <Plus className="w-4 h-4" weight="bold" />
                          Capture from Expert
                        </Button>
                      </div>
                    )}
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
                    {searchQuery ? (
                      <EmptyState
                        icon={FolderSimple}
                        title="No projects found"
                        description="Try adjusting your search query"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FolderSimple className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" weight="light" />
                        <h3 className="font-semibold mb-1">No projects documented yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Capture knowledge about your important projects</p>
                        <Button onClick={() => handleCaptureKnowledge('project')} variant="outline" className="gap-2">
                          <Plus className="w-4 h-4" weight="bold" />
                          Document Project
                        </Button>
                      </div>
                    )}
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
                    {searchQuery ? (
                      <EmptyState
                        icon={UsersFour}
                        title="No teams found"
                        description="Try adjusting your search query"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <UsersFour className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" weight="light" />
                        <h3 className="font-semibold mb-1">No teams documented yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Capture team practices and processes</p>
                        <Button onClick={() => handleCaptureKnowledge('team')} variant="outline" className="gap-2">
                          <Plus className="w-4 h-4" weight="bold" />
                          Document Team
                        </Button>
                      </div>
                    )}
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
