'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SessionList } from '@/components/sessions';
import { useApp } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { CaretDown, Calendar, Plus, ArrowClockwise } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { SessionCardSkeleton } from '@/components/ui/skeleton';
import { containers } from '@/lib/design-system';
import { createClient } from '@/lib/supabase/client';

interface PlannerTabProps {
  onUpdatePlan: () => void;
}

interface Session {
  id: string;
  sessionNumber: number;
  title?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  topics: string[];
  aiSuggestedTopics?: Array<{
    topic: string;
    description?: string;
    questions?: string[];
  }>;
  calendarEventId?: string;
  calendarProvider?: string;
  campaignId?: string;
  campaignName?: string;
  expertName?: string;
}

export function PlannerTab({ onUpdatePlan }: PlannerTabProps) {
  const { campaigns } = useApp();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedCampaign = selectedCampaignId === 'all'
    ? null
    : campaigns.find((c) => c.id === selectedCampaignId);

  // Fetch sessions for the selected campaign (or all campaigns)
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from('sessions')
      .select(`
        *,
        campaigns!inner (
          id,
          expert_name,
          expert_role
        )
      `)
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true });

    // Filter by campaign if not "all"
    if (selectedCampaignId !== 'all') {
      query = query.eq('campaign_id', selectedCampaignId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } else {
      setSessions(
        (data || []).map((s) => ({
          id: s.id,
          sessionNumber: s.session_number,
          title: s.title || undefined,
          scheduledAt: s.scheduled_at || '',
          durationMinutes: s.duration_minutes || 60,
          status: s.status || 'scheduled',
          topics: s.topics || [],
          aiSuggestedTopics: (s.ai_suggested_topics as Session['aiSuggestedTopics']) || [],
          calendarEventId: s.calendar_event_id || undefined,
          calendarProvider: s.calendar_provider || undefined,
          campaignId: s.campaign_id,
          campaignName: s.campaigns?.expert_name,
          expertName: s.campaigns?.expert_name,
        }))
      );
    }

    setIsLoading(false);
  }, [supabase, selectedCampaignId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Real-time subscription for sessions
  useEffect(() => {
    const channelConfig: {
      event: '*';
      schema: 'public';
      table: 'sessions';
      filter?: string;
    } = {
      event: '*',
      schema: 'public',
      table: 'sessions',
    };

    // Only add filter if specific campaign selected
    if (selectedCampaignId !== 'all') {
      channelConfig.filter = `campaign_id=eq.${selectedCampaignId}`;
    }

    const subscription = supabase
      .channel('sessions-list')
      .on('postgres_changes', channelConfig, () => fetchSessions())
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, selectedCampaignId, fetchSessions]);

  // Filter to show only upcoming/active sessions
  const upcomingSessions = sessions.filter(
    s => s.status === 'scheduled' || s.status === 'in_progress' || s.status === 'paused'
  );
  const completedSessions = sessions.filter(s => s.status === 'completed');

  if (campaigns.length === 0) {
    return (
      <div className={containers.pageContainer}>
        <div className={containers.wideContainer}>
          <PageHeader
            title="Sessions"
            subtitle="View and manage capture sessions."
          />
          <EmptyState
            icon={Calendar}
            title="No campaigns yet"
            description="Create a campaign first to schedule sessions."
            action={
              <Button onClick={() => router.push('/new')} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <PageHeader
            title="Sessions"
            subtitle="View and manage capture sessions."
          />

          {/* Campaign Selector */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg border bg-card hover:bg-secondary/50 transition-colors w-full md:min-w-[220px]',
                isDropdownOpen && 'ring-2 ring-foreground/10'
              )}
            >
              <div className="flex-1 text-left">
                <div className="text-xs text-muted-foreground">Filter</div>
                <div className="font-medium truncate">
                  {selectedCampaignId === 'all' ? 'All Sessions' : selectedCampaign?.name || 'Select filter'}
                </div>
              </div>
              <CaretDown
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform',
                  isDropdownOpen && 'rotate-180'
                )}
                weight="bold"
              />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 md:right-0 left-0 md:left-auto mt-2 w-full md:w-auto bg-popover rounded-lg border shadow-md z-50 py-1">
                  {/* All Sessions option */}
                  <button
                    onClick={() => {
                      setSelectedCampaignId('all');
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left hover:bg-secondary/50 transition-colors',
                      selectedCampaignId === 'all' && 'bg-secondary'
                    )}
                  >
                    <div className="font-medium">All Sessions</div>
                    <div className="text-xs text-muted-foreground">
                      View sessions from all campaigns
                    </div>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-border my-1" />

                  {/* Campaign options */}
                  {campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      onClick={() => {
                        setSelectedCampaignId(campaign.id);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left hover:bg-secondary/50 transition-colors',
                        campaign.id === selectedCampaignId && 'bg-secondary'
                      )}
                    >
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {campaign.role}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary">
                    <Calendar className="w-5 h-5 text-primary-foreground" weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Upcoming Sessions</h3>
                    <p className="text-xs text-neutral-500">
                      {upcomingSessions.length} session{upcomingSessions.length !== 1 ? 's' : ''} scheduled
                      {selectedCampaignId === 'all' && ' across all campaigns'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchSessions}
                    className="text-neutral-500 hover:text-neutral-700 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Refresh"
                  >
                    <ArrowClockwise className="w-4 h-4" weight="bold" />
                  </button>
                  {selectedCampaignId !== 'all' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/campaigns/${selectedCampaignId}`)}
                    >
                      <Plus className="w-4 h-4 mr-2" weight="bold" />
                      Add Session
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  <SessionCardSkeleton />
                  <SessionCardSkeleton />
                  <SessionCardSkeleton />
                </div>
              ) : (
                <SessionList
                  sessions={upcomingSessions}
                  showLinks
                  showCampaignInfo={selectedCampaignId === 'all'}
                  onSessionDeleted={fetchSessions}
                  emptyMessage={selectedCampaignId === 'all'
                    ? "No upcoming sessions across any campaign."
                    : "No upcoming sessions. Schedule a session from the campaign page."
                  }
                />
              )}
            </div>
          </div>

          {/* Completed Sessions */}
          {completedSessions.length > 0 && (
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-700">
                    <Calendar className="w-5 h-5 text-white" weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Completed Sessions</h3>
                    <p className="text-xs text-neutral-500">
                      {completedSessions.length} session{completedSessions.length !== 1 ? 's' : ''} completed
                      {selectedCampaignId === 'all' && ' across all campaigns'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <SessionList
                  sessions={completedSessions}
                  showCampaignInfo={selectedCampaignId === 'all'}
                  emptyMessage="No completed sessions yet."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
