'use client';

import { useState, useCallback } from 'react';
import { Container, SectionTitle } from '@/components/layout';
import {
  CampaignForm,
  CampaignFormData,
  FileUpload,
  AISuggestions,
} from '@/components/prepare';
import { useApp, Campaign } from '@/context/app-context';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const { appUser } = useApp();
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

  const handleCreateCampaign = useCallback(
    async (data: CampaignFormData) => {
      setIsSubmitting(true);
      try {
        const campaign = await onCreateCampaign(data);
        setCurrentCampaign(campaign);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onCreateCampaign]
  );

  const handleSkillsExtracted = useCallback((skills: string[]) => {
    setExtractedSkills((prev) => [...new Set([...prev, ...skills])]);
  }, []);

  const handleStartNew = useCallback(() => {
    setCurrentCampaign(null);
    setExtractedSkills([]);
  }, []);

  return (
    <Container className="animate-fade-in">
      <SectionTitle>Prepare New Campaign</SectionTitle>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            !currentCampaign
              ? 'bg-primary text-white'
              : 'bg-green-100 text-green-700'
          )}
        >
          {currentCampaign ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
              1
            </span>
          )}
          Create Campaign
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-300" />
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            currentCampaign
              ? 'bg-primary text-white'
              : 'bg-neutral-100 text-neutral-400'
          )}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
            2
          </span>
          Add Documents & Review
        </div>
      </div>

      {!currentCampaign ? (
        /* Step 1: Campaign Creation */
        <div className="max-w-2xl">
          <CampaignForm onSubmit={handleCreateCampaign} isSubmitting={isSubmitting} />
        </div>
      ) : (
        /* Step 2: Document Upload & AI Suggestions */
        <div className="space-y-6">
          {/* Campaign Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">
                  Campaign created: {currentCampaign.name}
                </p>
                <p className="text-sm text-green-600">
                  {currentCampaign.role}
                  {currentCampaign.department && ` • ${currentCampaign.department}`}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleStartNew}>
              Create Another
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Upload */}
            <FileUpload
              campaignId={currentCampaign.id}
              orgId={appUser?.orgId}
              onSkillsExtracted={handleSkillsExtracted}
            />

            {/* AI Suggestions */}
            <AISuggestions
              campaignId={currentCampaign.id}
              extractedSkills={extractedSkills}
              onAccept={() => onAcceptSuggestions(currentCampaign.id)}
              onEdit={() => onEditSuggestions(currentCampaign.id)}
            />
          </div>
        </div>
      )}
    </Container>
  );
}
