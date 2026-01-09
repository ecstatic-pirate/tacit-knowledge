'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { User, FolderSimple, UsersFour, Lightbulb, Warning, MagnifyingGlass, Plus } from 'phosphor-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { KnowledgeHubSkeleton } from '@/components/ui/skeleton';
import { ViewToggle } from '@/components/ui/view-toggle';
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
  const [showCaptureMenu, setShowCaptureMenu] = useState(false);

  // Handle capture knowledge - navigate to campaign creation with pre-filled subject type
  const handleCaptureKnowledge = (subjectType: 'person' | 'project' | 'team') => {
    router.push(`/new?subjectType=${subjectType}`);
    setShowCaptureMenu(false);
  };

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
          <div className="flex items-center gap-3">
            {/* Capture Knowledge CTA */}
            <div className="relative">
              <Button
                onClick={() => setShowCaptureMenu(!showCaptureMenu)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" weight="bold" />
                Capture Knowledge
              </Button>
              {showCaptureMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCaptureMenu(false)}
                  />
                  {/* Dropdown menu */}
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-2">
                      <button
                        onClick={() => handleCaptureKnowledge('person')}
                        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-secondary transition-colors text-left"
                      >
                        <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" weight="bold" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">From a Person</p>
                          <p className="text-xs text-muted-foreground">Capture expertise from an individual</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleCaptureKnowledge('project')}
                        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-secondary transition-colors text-left"
                      >
                        <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FolderSimple className="w-5 h-5 text-blue-600" weight="bold" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">About a Project</p>
                          <p className="text-xs text-muted-foreground">Document knowledge about a project</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleCaptureKnowledge('team')}
                        className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-secondary transition-colors text-left"
                      >
                        <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-purple-50 flex items-center justify-center">
                          <UsersFour className="w-5 h-5 text-purple-600" weight="bold" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">About a Team</p>
                          <p className="text-xs text-muted-foreground">Capture team practices and processes</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            {hasContent && (
              <ViewToggle
                options={viewOptions}
                value={viewType}
                onChange={setViewType}
              />
            )}
          </div>
        </div>

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
