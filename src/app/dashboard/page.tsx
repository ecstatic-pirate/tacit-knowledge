'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/app-context';
import { useToast } from '@/components/ui/toast';
import { DashboardTab } from '@/components/tabs';
import { Modal } from '@/components/ui/modal';
import { Campaign } from '@/types';
import { CheckCircle, ChartBar, CalendarCheck, Rocket, Star, Check, CircleNotch } from 'phosphor-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface AISuggestion {
  id: string;
  expertName: string;
  message: string;
  type: 'sessions' | 'attention' | 'skill';
  campaignId?: string;
}

export default function DashboardPage() {
  const { campaigns, tasks, toggleTask } = useApp();
  const { showToast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
  }>({ isOpen: false, title: '', content: null });

  const closeModal = () => setModalState({ isOpen: false, title: '', content: null });

  const handleViewCampaignDetails = useCallback(
    (campaign: Campaign) => {
      setModalState({
        isOpen: true,
        title: 'Campaign Details',
        content: (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                  Name
                </div>
                <div className="font-medium">{campaign.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                  Role
                </div>
                <div className="font-medium">{campaign.role}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                  Sessions Completed
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" weight="fill" />
                  {campaign.completedSessions} of {campaign.totalSessions}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                  Skills Captured
                </div>
                <div className="flex items-center gap-2">
                  <ChartBar className="w-4 h-4 text-primary" weight="bold" />
                  {campaign.skillsCaptured} distinct skills
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 p-4 rounded-lg border border-border flex items-start gap-3">
              <CalendarCheck className="w-5 h-5 text-primary mt-0.5" weight="bold" />
              <div>
                <div className="font-semibold mb-1">Next Session</div>
                <div className="text-sm text-muted-foreground">
                  Scheduled for Friday, Dec 6 at 2:00 PM
                </div>
              </div>
            </div>
          </div>
        ),
      });
    },
    []
  );

  const handleEditCampaign = useCallback(
    (campaign: Campaign) => {
      // In a real app, this would be a form
      showToast('Edit campaign functionality not implemented in this demo', 'info');
    },
    [showToast]
  );

  const handleReviewAISuggestions = useCallback(async () => {
    // Show loading state first
    setModalState({
      isOpen: true,
      title: 'AI Suggestions',
      content: (
        <div className="flex items-center justify-center py-8">
          <CircleNotch className="w-5 h-5 animate-spin text-muted-foreground" weight="bold" />
        </div>
      ),
    });

    // Fetch suggestions inline
    const suggestions: AISuggestion[] = [];

    try {
      const { data: dbCampaigns } = await supabase
        .from('campaigns')
        .select('id, expert_name, total_sessions, completed_sessions, status')
        .is('deleted_at', null)
        .is('completed_at', null);

      if (dbCampaigns) {
        for (const campaign of dbCampaigns) {
          const progress = campaign.total_sessions
            ? (campaign.completed_sessions || 0) / campaign.total_sessions
            : 0;

          if (progress > 0.5 && progress < 1) {
            const remaining = (campaign.total_sessions || 0) - (campaign.completed_sessions || 0);
            suggestions.push({
              id: `sessions-${campaign.id}`,
              expertName: campaign.expert_name,
              message: `Recommend ${remaining} additional sessions to reach 100% coverage.`,
              type: 'sessions',
              campaignId: campaign.id,
            });
          }

          if (campaign.status === 'danger' || campaign.status === 'keep_track') {
            suggestions.push({
              id: `attention-${campaign.id}`,
              expertName: campaign.expert_name,
              message: 'Campaign needs attention - consider scheduling sessions soon.',
              type: 'attention',
              campaignId: campaign.id,
            });
          }
        }
      }

      const { data: uncapturedSkills } = await supabase
        .from('skills')
        .select('name, campaigns(expert_name)')
        .eq('captured', false)
        .is('deleted_at', null)
        .limit(3);

      if (uncapturedSkills) {
        for (const skill of uncapturedSkills) {
          const campaign = skill.campaigns as { expert_name: string } | null;
          if (campaign) {
            suggestions.push({
              id: `skill-${skill.name}`,
              expertName: campaign.expert_name,
              message: `Focus on capturing "${skill.name}" skill in the next session.`,
              type: 'skill',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    }

    const finalSuggestions = suggestions.slice(0, 5);

    // Update modal with real content
    setModalState({
      isOpen: true,
      title: 'AI Suggestions',
      content: (
        <div className="space-y-4">
          {finalSuggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" weight="fill" />
              <p>No suggestions at this time</p>
              <p className="text-xs mt-1">All campaigns are on track!</p>
            </div>
          ) : (
            finalSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-4 rounded-lg border ${
                  suggestion.type === 'sessions'
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : suggestion.type === 'attention'
                    ? 'bg-amber-50/50 border-amber-100'
                    : 'bg-stone-50/50 border-stone-100'
                }`}
              >
                <div
                  className={`font-medium mb-1 flex items-center gap-2 ${
                    suggestion.type === 'sessions'
                      ? 'text-emerald-900'
                      : suggestion.type === 'attention'
                      ? 'text-amber-900'
                      : 'text-stone-900'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" weight="fill" />
                  {suggestion.expertName}
                </div>
                <p
                  className={`text-sm mb-3 ${
                    suggestion.type === 'sessions'
                      ? 'text-emerald-800'
                      : suggestion.type === 'attention'
                      ? 'text-amber-800'
                      : 'text-stone-700'
                  }`}
                >
                  {suggestion.message}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    showToast('Suggestion approved');
                    closeModal();
                  }}
                  className={
                    suggestion.type === 'sessions'
                      ? 'border-emerald-200 hover:bg-emerald-100 hover:text-emerald-900'
                      : suggestion.type === 'attention'
                      ? 'border-amber-200 hover:bg-amber-100 hover:text-amber-900'
                      : 'border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                  }
                >
                  Approve
                </Button>
              </div>
            ))
          )}
        </div>
      ),
    });
  }, [supabase, showToast]);

  return (
    <>
      <DashboardTab
        campaigns={campaigns}
        tasks={tasks}
        onViewCampaignDetails={handleViewCampaignDetails}
        onEditCampaign={handleEditCampaign}
        onReviewAISuggestions={handleReviewAISuggestions}
        onTaskToggle={toggleTask}
      />
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
      >
        {modalState.content}
      </Modal>
    </>
  );
}

