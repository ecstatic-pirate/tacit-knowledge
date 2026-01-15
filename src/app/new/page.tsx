'use client';

import { useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { useToast } from '@/components/ui/toast';
import { PrepareTab } from '@/components/tabs';
import { CampaignFormData } from '@/components/prepare';
import { CircleNotch } from 'phosphor-react';

function PreparePageContent() {
  const router = useRouter();
  const { addCampaign } = useApp();
  const { showToast } = useToast();

  const handleCreateCampaign = useCallback(
    async (data: CampaignFormData) => {
      let projectId = data.projectId;

      // Auto-create project for project campaigns if not already linked
      if (data.subjectType === 'project' && !projectId) {
        try {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.name,
              description: data.goal || undefined,
            }),
          });
          const result = await response.json();
          if (result.success && result.project) {
            projectId = result.project.id;
          }
        } catch (err) {
          console.error('Failed to auto-create project:', err);
        }
      }

      const campaign = await addCampaign({
        name: data.name,
        role: data.role,
        goal: data.goal || undefined,
        status: 'on-track',
        progress: 0,
        totalSessions: 14,
        completedSessions: 0,
        captureMode: data.captureMode,
        expertEmail: data.expertEmail || undefined,
        departureDate: data.departureDate || undefined,
        collaborators: data.collaborators,
        subjectType: data.subjectType,
        projectId: projectId,
        teamId: data.teamId,
      });

      // Create demo documents if selected
      if (campaign.id && data.selectedDemoDocuments?.length) {
        try {
          for (const doc of data.selectedDemoDocuments) {
            await fetch('/api/documents', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                campaignId: campaign.id,
                filename: doc.filename,
                fileType: doc.fileType,
                extractedText: doc.content,
              }),
            });
          }
        } catch (err) {
          console.error('Failed to create demo documents:', err);
        }
      }

      // Send invitations to expert and collaborators (fire and forget)
      if (campaign.id && (data.expertEmail || data.collaborators.length > 0)) {
        fetch(`/api/campaigns/${campaign.id}/send-invitations`, {
          method: 'POST',
        }).catch(() => {
          console.error('Failed to send invitations');
        });
      }

      // Show success and redirect to campaign page
      showToast(`Campaign "${data.name}" created! Redirecting...`, 'success');
      router.push(`/campaigns/${campaign.id}`);

      return campaign;
    },
    [addCampaign, showToast, router]
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
