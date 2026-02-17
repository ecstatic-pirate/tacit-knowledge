'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  Lightbulb,
  FileText,
  Plus,
  Warning,
  ArrowRight,
} from 'phosphor-react';
import { useApp } from '@/context/app-context';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { useKnowledgeHubData } from '@/components/knowledge-hub';
import { ProfileSetupModal } from '@/components/onboarding/profile-setup-modal';
import { getCheckInStatus } from '@/lib/initiative-helpers';
import {
  components,
  containers,
  listContainer,
  sectionHeader,
  spacing,
  typography,
} from '@/lib/design-system';

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

interface ReportItem {
  id: string;
  title: string;
  date: string;
  status: string;
  expertName?: string;
}

function formatSessionTime(value?: string) {
  if (!value) return 'To be scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'To be scheduled';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function normalizeAiSuggestedTopics(data: unknown): Session['aiSuggestedTopics'] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Session['aiSuggestedTopics'];
  if (typeof data === 'object' && data !== null && 'topics' in data) {
    const topics = (data as { topics?: Array<{ name: string }> }).topics || [];
    return topics.map((topic) => ({ topic: topic.name }));
  }
  return [];
}

interface Suggestion {
  type: 'stale-checkin' | 'missing-fields';
  campaignId: string;
  message: string;
}

export default function HomePage() {
  const router = useRouter();
  const { campaigns, appUser, user, refreshData } = useApp();
  const supabase = useMemo(() => createClient(), []);
  const { stats, isLoading: knowledgeLoading, error: knowledgeError } = useKnowledgeHubData();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Check if user needs onboarding
  useEffect(() => {
    if (!user || onboardingChecked) return;

    async function checkProfile() {
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!data) {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);
    }

    checkProfile();
  }, [user, supabase, onboardingChecked]);

  const roleType = appUser?.roleType ?? 'builder';
  const showBuilder = roleType === 'builder' || roleType === 'both';
  const showManagement = roleType === 'management' || roleType === 'both';

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [campaigns]);

  // Concierge suggestions for builders
  const suggestions = useMemo<Suggestion[]>(() => {
    if (!showBuilder) return [];
    const items: Suggestion[] = [];

    for (const c of campaigns) {
      if (items.length >= 3) break;
      const checkIn = getCheckInStatus(c.lastCheckIn);
      if (checkIn.isStale) {
        items.push({
          type: 'stale-checkin',
          campaignId: c.id,
          message: `Time for a check-in on ${c.name}`,
        });
      }
    }

    for (const c of campaigns) {
      if (items.length >= 3) break;
      if (!c.initiativeType || !c.businessUnit) {
        items.push({
          type: 'missing-fields',
          campaignId: c.id,
          message: `Complete your initiative profile for ${c.name}`,
        });
      }
    }

    return items.slice(0, 3);
  }, [campaigns, showBuilder]);

  // Region breakdown for management
  const regionBreakdown = useMemo(() => {
    if (!showManagement) return [];
    const counts: Record<string, number> = {};
    for (const c of campaigns) {
      const r = c.region || 'Unassigned';
      counts[r] = (counts[r] || 0) + 1;
    }
    return Object.entries(counts).map(([region, count]) => ({ region, count }));
  }, [campaigns, showManagement]);

  useEffect(() => {
    let isMounted = true;

    async function fetchSessions() {
      setSessionsLoading(true);

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
        .is('deleted_at', null)
        .order('scheduled_at', { ascending: true });

      if (!isMounted) return;

      if (error) {
        console.error('Error fetching sessions:', error);
        setSessions([]);
        setSessionsLoading(false);
        return;
      }

      setSessions(
        (data || []).map((s) => ({
          id: s.id,
          sessionNumber: s.session_number,
          title: s.title || undefined,
          scheduledAt: s.scheduled_at || '',
          durationMinutes: s.duration_minutes || 60,
          status: s.status || 'scheduled',
          topics: s.topics || [],
          aiSuggestedTopics: normalizeAiSuggestedTopics(s.ai_suggested_topics),
          calendarEventId: s.calendar_event_id || undefined,
          calendarProvider: s.calendar_provider || undefined,
          campaignId: s.campaign_id,
          campaignName: s.campaigns?.expert_name,
          expertName: s.campaigns?.expert_name,
        }))
      );
      setSessionsLoading(false);
    }

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    async function fetchReports() {
      setReportsLoading(true);

      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          type,
          status,
          created_at,
          campaigns (expert_name)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!isMounted) return;

      if (error) {
        console.error('Error fetching reports:', error);
        setReports([]);
        setReportsLoading(false);
        return;
      }

      const mappedReports = (data || []).map((report) => {
        const campaign = report.campaigns as { expert_name: string } | null;
        const date = report.created_at ? new Date(report.created_at) : new Date();
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        return {
          id: report.id,
          title: report.title,
          status: report.status || 'ready',
          date: formattedDate,
          expertName: campaign?.expert_name,
        };
      });

      setReports(mappedReports);
      setReportsLoading(false);
    }

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const upcomingSessions = useMemo(() => {
    return sessions.filter(
      s => s.status === 'scheduled' || s.status === 'in_progress' || s.status === 'paused'
    );
  }, [sessions]);

  const knowledgeInsights = knowledgeLoading || knowledgeError
    ? null
    : stats.totalInsights;

  const displayedCampaigns = sortedCampaigns.slice(0, 4);

  const renderCampaignList = () => {
    if (campaigns.length === 0) {
      return (
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
      );
    }

    if (displayedCampaigns.length === 0) {
      return (
        <EmptyState
          icon={Users as unknown as React.ComponentType<{ className?: string }>}
          title="No campaigns found"
          description="Create a campaign to get started."
        />
      );
    }

    return (
      <div className={listContainer.container}>
        {displayedCampaigns.map((campaign) => {
          const progress = campaign.totalSessions > 0
            ? (campaign.completedSessions / campaign.totalSessions) * 100
            : 0;

          return (
            <div
              key={campaign.id}
              className={listContainer.item}
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
            >
              <div className="flex items-center justify-between">
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
                          style={{ width: `${Math.min(100, Math.round(progress))}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(progress)}%
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={containers.pageContainer}>
      <div className={containers.wideContainer}>
        {/* Onboarding Modal */}
        {user && (
          <ProfileSetupModal
            isOpen={showOnboarding}
            onComplete={() => {
              setShowOnboarding(false);
              refreshData();
            }}
            userId={user.id}
            defaultName={appUser?.fullName}
          />
        )}

        <PageHeader
          title="Home"
          subtitle="A quick snapshot of campaigns, sessions, and knowledge capture."
          className="mb-6"
        />

        <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', spacing.marginBottomSection)}>
          <div className={components.card}>
            <div className="flex items-center justify-between">
              <p className={typography.label}>{showManagement ? 'All Initiatives' : 'Campaigns'}</p>
              <Users className="w-4 h-4 text-muted-foreground" weight="bold" />
            </div>
            <div className="mt-4 text-2xl font-semibold">{campaigns.length}</div>
          </div>
          <div className={components.card}>
            <div className="flex items-center justify-between">
              <p className={typography.label}>Upcoming Sessions</p>
              <Calendar className="w-4 h-4 text-muted-foreground" weight="bold" />
            </div>
            <div className="mt-4 text-2xl font-semibold">
              {sessionsLoading ? '—' : upcomingSessions.length}
            </div>
          </div>
          <div className={components.card}>
            <div className="flex items-center justify-between">
              <p className={typography.label}>Insights Captured</p>
              <Lightbulb className="w-4 h-4 text-muted-foreground" weight="bold" />
            </div>
            <div className="mt-4 text-2xl font-semibold">
              {knowledgeInsights ?? '—'}
            </div>
          </div>
          <div className={components.card}>
            <div className="flex items-center justify-between">
              <p className={typography.label}>Recent Reports</p>
              <FileText className="w-4 h-4 text-muted-foreground" weight="bold" />
            </div>
            <div className="mt-4 text-2xl font-semibold">
              {reportsLoading ? '—' : reports.length}
            </div>
          </div>
        </div>

        {/* Management: Region breakdown */}
        {showManagement && regionBreakdown.length > 0 && (
          <div className={cn('grid gap-4 grid-cols-3', spacing.marginBottomSection)}>
            {regionBreakdown.map(({ region, count }) => (
              <div key={region} className={components.cardCompact}>
                <p className="text-xs font-medium text-muted-foreground">{region}</p>
                <p className="text-xl font-semibold mt-1">{count} initiative{count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className={cn('lg:col-span-2', components.card)}>
            <div className={cn('flex items-start justify-between', sectionHeader.container)}>
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-foreground font-sans">
                  {showManagement && !showBuilder ? 'All Initiatives' : 'Recent Campaigns'}
                </h3>
              </div>
              <Link href="/campaigns" className="text-sm text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>

            {renderCampaignList()}
          </section>

          <div className="space-y-6">
            {/* Concierge Suggestions for builders */}
            {showBuilder && suggestions.length > 0 && (
              <section className={components.card}>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-semibold tracking-wide text-foreground font-sans">Concierge Suggestions</h3>
                </div>
                <div className={listContainer.container}>
                  {suggestions.map((s) => (
                    <div
                      key={`${s.type}-${s.campaignId}`}
                      className={cn(listContainer.itemCompact, 'cursor-pointer')}
                      onClick={() => router.push(`/campaigns/${s.campaignId}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Warning className="w-4 h-4 text-amber-500 flex-shrink-0" weight="fill" />
                        <p className="text-sm">{s.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Management: quick link to portfolio */}
            {showManagement && (
              <div
                className={cn(components.cardCompact, 'cursor-pointer hover:border-foreground/20 transition-colors')}
                onClick={() => router.push('/portfolio')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Portfolio Dashboard</p>
                    <p className="text-xs text-muted-foreground">View all initiatives across regions</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}

            <section className={components.card}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-foreground font-sans">Upcoming Sessions</h3>
                </div>
                <Link href="/planner" className="text-sm text-muted-foreground hover:text-foreground">
                  View all
                </Link>
              </div>

              {sessionsLoading ? (
                <LoadingState className="py-6" />
              ) : upcomingSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming sessions scheduled yet.</p>
              ) : (
                <div className={listContainer.container}>
                  {upcomingSessions.slice(0, 3).map((session) => (
                    <div key={session.id} className={listContainer.itemCompact}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {session.title || `Session ${session.sessionNumber}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatSessionTime(session.scheduledAt)}
                            {session.expertName ? ` • ${session.expertName}` : ''}
                          </p>
                        </div>
                        <StatusBadge variant={session.status === 'in_progress' ? 'warning' : 'default'}>
                          {session.status === 'in_progress' ? 'Live' : 'Scheduled'}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={components.card}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-foreground font-sans">Recent Reports</h3>
                </div>
                <Link href="/reports" className="text-sm text-muted-foreground hover:text-foreground">
                  View all
                </Link>
              </div>

              {reportsLoading ? (
                <LoadingState className="py-6" />
              ) : reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reports generated yet.</p>
              ) : (
                <div className={listContainer.container}>
                  {reports.map((report) => (
                    <div key={report.id} className={listContainer.itemCompact}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{report.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.expertName ? `${report.expertName} • ` : ''}{report.date}
                          </p>
                        </div>
                        <StatusBadge variant={
                          report.status === 'ready' ? 'success' :
                          report.status === 'processing' ? 'warning' :
                          report.status === 'failed' ? 'error' :
                          'default'
                        }>
                          {report.status === 'ready' ? 'Ready' :
                           report.status === 'processing' ? 'Processing' :
                           report.status === 'failed' ? 'Failed' :
                           'Unknown'}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
