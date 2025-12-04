'use client';

import { Container, SectionTitle } from '@/components/layout';
import { Button } from '@/components/ui';
import { SessionTimer, AICoachPanel, HumanGuidancePanel } from '@/components/capture';

interface CaptureTabProps {
  onPauseSession: () => void;
  onEndSession: () => void;
}

export function CaptureTab({ onPauseSession, onEndSession }: CaptureTabProps) {
  return (
    <Container className="animate-fade-in">
      <SectionTitle>Live Capture Session - Michael Chen</SectionTitle>

      {/* Timer */}
      <SessionTimer totalMinutes={60} elapsedMinutes={43} />

      {/* Session Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Side */}
        <AICoachPanel
          sessionNumber={8}
          recap="Discussed system architecture, main components, and how they interact. You covered the billing engine, reconciliation service, and ledger system."
          foundation="Building on system architecture, we're diving deeper into error handling, edge cases, and real-world incident examples."
          currentTopic="Error handling patterns and production incidents"
        />

        {/* Human Side */}
        <HumanGuidancePanel
          suggestedQuestions={[
            '"Can you walk through a specific incident?"',
            '"How did you diagnose the issue?"',
            '"What changed as a result?"',
          ]}
          capturedSkills={['Architecture', 'Reconciliation']}
          missingSkills={['Leadership', 'Compliance']}
          referenceFiles={[
            'Billing_Architecture.pdf',
            'System_Requirements.docx',
            'Incident_Reports.pdf',
          ]}
        />
      </div>

      {/* Session Controls */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Button variant="secondary" onClick={onPauseSession} className="py-4">
          Pause Session
        </Button>
        <Button onClick={onEndSession} className="py-4">
          End & Save Session
        </Button>
      </div>
    </Container>
  );
}
