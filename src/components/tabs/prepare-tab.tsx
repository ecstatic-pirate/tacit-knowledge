'use client';

import { useState, useCallback } from 'react';
import {
  CampaignForm,
  CampaignFormData,
  FileUpload,
  AISuggestions,
} from '@/components/prepare';
import { useApp, Campaign } from '@/context/app-context';
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

interface PrepareTabProps {
  onCreateCampaign: (data: CampaignFormData) => Promise<Campaign>;
  onAcceptSuggestions: (campaignId: string) => void;
  onEditSuggestions: (campaignId: string) => void;
}

export function PrepareTab({
  onCreateCampaign,
  onAcceptSuggestions,
  onEditSuggestions,
}: PrepareTabProps) {
  const { appUser, isLoading: isAppLoading } = useApp();
  const { showToast } = useToast();
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

  const handleCreateCampaign = useCallback(
    async (data: CampaignFormData) => {
      if (!appUser) {
        showToast('Please wait for user data to load or sign in again', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        const campaign = await onCreateCampaign(data);
        setCurrentCampaign(campaign);
      } catch (error) {
        console.error('Error creating campaign:', error);
        showToast(
          error instanceof Error ? error.message : 'Failed to create campaign',
          'error'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [onCreateCampaign, appUser, showToast]
  );

  const handleSkillsExtracted = useCallback((skills: string[]) => {
    setExtractedSkills((prev) => [...new Set([...prev, ...skills])]);
  }, []);

  const handleStartNew = useCallback(() => {
    setCurrentCampaign(null);
    setExtractedSkills([]);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">New Campaign</h1>
        <p className="text-muted-foreground">
          Create a campaign to start capturing knowledge from an expert.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
            !currentCampaign
              ? 'bg-foreground text-background'
              : 'bg-secondary text-muted-foreground'
          )}
        >
          {currentCampaign ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">
              1
            </span>
          )}
          Expert Details
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
            currentCampaign
              ? 'bg-foreground text-background'
              : 'bg-secondary text-muted-foreground'
          )}
        >
          <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">
            2
          </span>
          Documents & Skills
        </div>
      </div>

      {!currentCampaign ? (
        <CampaignForm onSubmit={handleCreateCampaign} isSubmitting={isSubmitting} />
      ) : (
        <div className="space-y-6">
          {/* Campaign Summary */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-900">
                  Campaign created: {currentCampaign.name}
                </p>
                <p className="text-sm text-emerald-700">
                  {currentCampaign.role}
                  {currentCampaign.department && ` · ${currentCampaign.department}`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleStartNew}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Start Over
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FileUpload
              campaignId={currentCampaign.id}
              orgId={appUser?.orgId}
              onSkillsExtracted={handleSkillsExtracted}
            />

            <AISuggestions
              campaignId={currentCampaign.id}
              extractedSkills={extractedSkills}
              onAccept={() => onAcceptSuggestions(currentCampaign.id)}
              onEdit={() => onEditSuggestions(currentCampaign.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
