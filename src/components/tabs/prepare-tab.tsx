'use client';

import { Container, SectionTitle } from '@/components/layout';
import {
  CampaignForm,
  CampaignFormData,
  FileUpload,
  AISuggestions,
  CaptureModeSelector,
} from '@/components/prepare';

interface PrepareTabProps {
  onCreateCampaign: (data: CampaignFormData) => void;
  onAcceptSuggestions: () => void;
  onEditSuggestions: () => void;
}

export function PrepareTab({
  onCreateCampaign,
  onAcceptSuggestions,
  onEditSuggestions,
}: PrepareTabProps) {
  return (
    <Container className="animate-fade-in">
      <SectionTitle>Prepare New Campaign</SectionTitle>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Campaign Setup */}
        <CampaignForm onSubmit={onCreateCampaign} />

        {/* Right Column */}
        <div>
          <FileUpload />
          <AISuggestions onAccept={onAcceptSuggestions} onEdit={onEditSuggestions} />
          <CaptureModeSelector />
        </div>
      </div>
    </Container>
  );
}
