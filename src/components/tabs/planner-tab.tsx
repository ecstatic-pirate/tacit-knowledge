'use client';

import { useState, useEffect } from 'react';
import { Container, SectionTitle } from '@/components/layout';
import { PlannerSidebar, Timeline, SessionScheduler } from '@/components/planner';
import { useApp, Campaign } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { ChevronDown, Calendar, Users, AlertCircle } from 'lucide-react';

interface PlannerTabProps {
  onUpdatePlan: () => void;
}

export function PlannerTab({ onUpdatePlan }: PlannerTabProps) {
  const { campaigns } = useApp();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Auto-select first campaign if none selected
  useEffect(() => {
    if (!selectedCampaignId && campaigns.length > 0) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  // No campaigns state
  if (campaigns.length === 0) {
    return (
      <Container className="animate-fade-in">
        <SectionTitle>Interview Planner</SectionTitle>
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No Campaigns Yet</h3>
          <p className="text-neutral-500 mb-6">
            Create a campaign in the Prepare tab to start planning interview sessions.
          </p>
          <a
            href="/prepare"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Users className="w-4 h-4" />
            Create Campaign
          </a>
        </div>
      </Container>
    );
  }

  return (
    <Container className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <SectionTitle className="mb-0">Interview Planner</SectionTitle>

        {/* Campaign Selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-white hover:bg-neutral-50 transition-colors min-w-[250px]',
              isDropdownOpen ? 'border-primary ring-2 ring-primary/20' : 'border-neutral-200'
            )}
          >
            <div className="flex-1 text-left">
              <div className="text-xs text-neutral-500">Active Campaign</div>
              <div className="font-medium text-neutral-900 truncate">
                {selectedCampaign?.name || 'Select campaign'}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-neutral-400 transition-transform',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full bg-white rounded-xl border border-neutral-200 shadow-lg z-50 py-2">
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => {
                    setSelectedCampaignId(campaign.id);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors',
                    campaign.id === selectedCampaignId && 'bg-primary/5'
                  )}
                >
                  <div className="font-medium text-neutral-900">{campaign.name}</div>
                  <div className="text-xs text-neutral-500">
                    {campaign.role}
                    {campaign.department && ` • ${campaign.department}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCampaign ? (
        <div className="space-y-8">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
            <PlannerSidebar
              personName={selectedCampaign.name}
              goal={selectedCampaign.goal || 'Capture expertise and institutional knowledge'}
              wantedSkills="Skills will be populated from AI analysis"
              notes="Focus on undocumented workarounds and institutional knowledge."
              onUpdate={onUpdatePlan}
            />
            <Timeline
              totalSessions={selectedCampaign.totalSessions}
              cadence="1x/week"
              duration={`${Math.ceil(selectedCampaign.totalSessions / 1.5)} weeks`}
              weeks={Math.min(8, selectedCampaign.totalSessions)}
            />
          </div>

          {/* Session Scheduler */}
          <SessionScheduler
            campaignId={selectedCampaign.id}
            expertName={selectedCampaign.name}
            expertEmail={selectedCampaign.expertEmail}
          />
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800">Please select a campaign to view the planner.</p>
        </div>
      )}
    </Container>
  );
}
