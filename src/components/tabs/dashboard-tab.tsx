'use client';

import { Campaign, Task } from '@/types';
import {
  Users,
  CaretRight,
  Plus,
  CheckCircle,
  User,
  FolderSimple
} from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { ViewToggle } from '@/components/ui/view-toggle';
import { ExpandableSearch } from '@/components/ui/expandable-search';
import { containers, spacing, typography } from '@/lib/design-system';

type CampaignFilter = 'all' | 'person' | 'project';

interface DashboardTabProps {
  campaigns: Campaign[];
  tasks: Task[];
  onViewCampaignDetails: (campaign: Campaign) => void;
  onEditCampaign: (campaign: Campaign) => void;
  onReviewAISuggestions: () => void;
  onTaskToggle: (taskId: string) => void;
}

export function DashboardTab({
  campaigns,
  tasks,
  onViewCampaignDetails,
  onTaskToggle,
}: DashboardTabProps) {
  const router = useRouter();
  const [filterType, setFilterType] = useState<CampaignFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Count campaigns by type
  const { personCount, projectCount } = useMemo(() => ({
    personCount: campaigns.filter(c => c.subjectType === 'person').length,
    projectCount: campaigns.filter(c => c.subjectType === 'project').length,
  }), [campaigns]);

  // Filter options for ViewToggle
  const filterOptions = useMemo(() => [
    { value: 'all' as const, label: 'All', count: campaigns.length },
    { value: 'person' as const, label: 'People', icon: <User className="w-4 h-4" weight="bold" />, count: personCount },
    { value: 'project' as const, label: 'Projects', icon: <FolderSimple className="w-4 h-4" weight="bold" />, count: projectCount },
  ], [campaigns.length, personCount, projectCount]);

  // Filter and search campaigns
  const filteredCampaigns = useMemo(() => {
    let result = campaigns;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(c => c.subjectType === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.role?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [campaigns, filterType, searchQuery]);

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        <PageHeader
          title="Campaigns"
          subtitle="Track and manage your knowledge capture campaigns."
          className="mb-6"
        />

        {/* Filter Row */}
        <div className={cn('flex items-center justify-between gap-4', spacing.marginBottomSection)}>
          <ViewToggle
            options={filterOptions}
            value={filterType}
            onChange={setFilterType}
          />
          <ExpandableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search campaigns..."
          />
        </div>

        {/* Campaigns List */}
        <div className={spacing.marginBottomSection}>
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Users as unknown as React.ComponentType<{ className?: string }>}
              title="No campaigns yet"
              description="Create your first campaign to start capturing expert knowledge."
              action={
                <Button onClick={() => router.push('/new')} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              }
            />
          ) : filteredCampaigns.length === 0 ? (
            <EmptyState
              icon={Users as unknown as React.ComponentType<{ className?: string }>}
              title="No campaigns found"
              description={searchQuery ? "Try adjusting your search query" : "No campaigns match the selected filter"}
            />
          ) : (
            <div className="border rounded-lg divide-y bg-card">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => onViewCampaignDetails(campaign)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                    {campaign.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {campaign.completedSessions}/{campaign.totalSessions} sessions
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground rounded-full"
                          style={{ width: `${(campaign.completedSessions / campaign.totalSessions) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((campaign.completedSessions / campaign.totalSessions) * 100)}%
                      </span>
                    </div>
                  </div>
                  <StatusBadge variant={
                    campaign.status === 'on-track' ? 'success' :
                    campaign.status === 'keep-track' ? 'warning' : 'error'
                  }>
                    {campaign.status === 'on-track' ? 'On Track' :
                     campaign.status === 'keep-track' ? 'Attention' : 'At Risk'}
                  </StatusBadge>
                  <CaretRight className="w-4 h-4 text-muted-foreground" weight="bold" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      {tasks.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Tasks
          </h2>
          <div className="border rounded-lg divide-y bg-card">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className={cn("flex items-center gap-3", spacing.cardPaddingCompact)}
              >
                <button
                  onClick={() => onTaskToggle(task.id)}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    task.completed
                      ? "bg-foreground border-foreground"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {task.completed && <CheckCircle className="w-3 h-3 text-background" weight="fill" />}
                </button>
                <span className={cn(
                  "text-sm flex-1",
                  task.completed && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  task.priority === 'urgent' && "bg-red-50 text-red-700",
                  task.priority === 'this-week' && "bg-amber-50 text-amber-700",
                  task.priority === 'on-track' && "bg-secondary text-muted-foreground"
                )}>
                  {task.priority === 'urgent' ? 'Urgent' :
                   task.priority === 'this-week' ? 'This Week' : 'Later'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
