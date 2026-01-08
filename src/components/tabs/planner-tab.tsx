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

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedCampaignId && campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  // Fetch sessions for the selected campaign
  const fetchSessions = useCallback(async () => {
    if (!selectedCampaignId) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        campaigns!inner (
          id,
          expert_name,
          expert_role
        )
      `)
      .eq('campaign_id', selectedCampaignId)
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true });

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
    if (!selectedCampaignId) return;

    const subscription = supabase
      .channel('sessions-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `campaign_id=eq.${selectedCampaignId}`
      }, () => fetchSessions())
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
                <div className="text-xs text-muted-foreground">Campaign</div>
                <div className="font-medium truncate">
                  {selectedCampaign?.name || 'Select campaign'}
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

        {selectedCampaign && (
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/campaigns/${selectedCampaignId}`)}
                    >
                      <Plus className="w-4 h-4 mr-2" weight="bold" />
                      Add Session
                    </Button>
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
                    onSessionDeleted={fetchSessions}
                    emptyMessage="No upcoming sessions. Schedule a session from the campaign page."
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
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <SessionList
                    sessions={completedSessions}
                    emptyMessage="No completed sessions yet."
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
