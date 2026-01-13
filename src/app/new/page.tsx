'use client';

import { useCallback, Suspense } from 'react';
import { useApp } from '@/context/app-context';
import { useToast } from '@/components/ui/toast';
import { PrepareTab } from '@/components/tabs';
import { CampaignFormData } from '@/components/prepare';
import { CircleNotch } from 'phosphor-react';

function PreparePageContent() {
  const { addCampaign } = useApp();
  const { showToast } = useToast();

  const handleCreateCampaign = useCallback(
    async (data: CampaignFormData) => {
      const campaign = await addCampaign({
        name: data.name,
        role: data.role,
        department: data.department || undefined,
        yearsExperience: data.yearsExperience || undefined,
        goal: data.goal || undefined,
        status: 'on-track',
        progress: 0,
        totalSessions: 14,
        completedSessions: 0,
        captureMode: data.captureMode,
        expertEmail: data.expertEmail || undefined,
        collaborators: data.collaborators,
        skills: data.skills || undefined,
        subjectType: data.subjectType,
        projectId: data.projectId,
        teamId: data.teamId,
      });
      showToast(`Campaign "${data.name}" created successfully!`);

      // Send invitations to expert and collaborators
      if (campaign.id && (data.expertEmail || data.collaborators.length > 0)) {
        try {
          const response = await fetch(`/api/campaigns/${campaign.id}/send-invitations`, {
            method: 'POST',
          });
          const result = await response.json();

          if (response.ok && result.emailsSent > 0) {
            showToast(`Invitations sent to ${result.emailsSent} recipient(s)`, 'success');
          } else if (result.emailsFailed > 0) {
            showToast(`Some invitations failed to send`, 'error');
          }
        } catch {
          console.error('Failed to send invitations');
        }
      }

      return campaign;
    },
    [addCampaign, showToast]
  );

  return (
    <PrepareTab
      onCreateCampaign={handleCreateCampaign}
    />
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <CircleNotch className="w-8 h-8 animate-spin text-muted-foreground" weight="bold" />
    </div>
  );
}

export default function PreparePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PreparePageContent />
    </Suspense>
  );
}
