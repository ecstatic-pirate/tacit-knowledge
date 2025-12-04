'use client';

import { useCallback, useState } from 'react';
import { useApp } from '@/context/app-context';
import { useToast } from '@/components/ui/toast';
import { DashboardTab } from '@/components/tabs';
import { Modal } from '@/components/ui/modal';
import { Campaign } from '@/types';
import { CheckCircle2, BarChart3, CalendarClock, Rocket, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { campaigns, tasks, toggleTask } = useApp();
  const { showToast } = useToast();
  
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
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {campaign.completedSessions} of {campaign.totalSessions}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                  Skills Captured
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  {campaign.skillsCaptured} distinct skills
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 p-4 rounded-lg border border-border flex items-start gap-3">
              <CalendarClock className="w-5 h-5 text-primary mt-0.5" />
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

  const handleReviewAISuggestions = useCallback(() => {
    setModalState({
      isOpen: true,
      title: 'AI Suggestions',
      content: (
        <div className="space-y-4">
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-lg">
            <div className="font-medium text-emerald-800 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Campaign Duration: Patricia Rodriguez
            </div>
            <p className="text-sm text-emerald-700 mb-3">
              Recommend 2 additional sessions to reach 100% coverage.
            </p>
            <Button
              size="sm"
              onClick={() => {
                showToast('Suggestion approved');
                closeModal();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Approve
            </Button>
          </div>
          {/* ... other suggestions ... */}
        </div>
      ),
    });
  }, [showToast]);

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

