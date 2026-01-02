'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { CaptureTab } from '@/components/tabs';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Check, Columns, ArrowRight } from 'phosphor-react';

export default function CaptureSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const sessionId = params.sessionId as string;

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
  }>({ isOpen: false, title: '', content: null });

  const closeModal = () => setModalState({ isOpen: false, title: '', content: null });

  const handlePauseSession = useCallback(() => {
    showToast('Session paused', 'warning');
  }, [showToast]);

  const handleEndSession = useCallback((duration: number, capturedSkillsCount: number) => {
    const minutes = Math.floor(duration / 60);

    setModalState({
      isOpen: true,
      title: 'Session Complete',
      content: (
        <div className="text-center space-y-6 py-4">
          <div className="w-20 h-20 bg-emerald-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-emerald-600" weight="bold" />
          </div>

          <div>
            <div className="text-2xl font-bold">Session Complete</div>
            <p className="text-muted-foreground mt-1">Great job capturing knowledge!</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="bg-secondary/50 p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Duration</div>
              <div className="text-lg font-bold">{minutes}m</div>
            </div>
            <div className="bg-secondary/50 p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Skills</div>
              <div className="text-lg font-bold">{capturedSkillsCount}</div>
            </div>
          </div>

          <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 text-left">
            <div className="font-semibold mb-3 text-primary flex items-center gap-2">
              <Columns className="w-4 h-4" weight="bold" />
              AI Processing Started
            </div>
            <ul className="space-y-2">
              {['Extracting key insights', 'Mapping skills to knowledge graph', 'Generating session report'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                showToast('Redirecting to dashboard...');
                closeModal();
                router.push('/dashboard');
              }}
              className="flex-1"
            >
              View Dashboard
              <ArrowRight className="w-4 h-4 ml-2" weight="bold" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                closeModal();
                router.push('/planner');
              }}
              className="flex-1"
            >
              Back to Planner
            </Button>
          </div>
        </div>
      ),
    });
  }, [showToast, router]);

  return (
    <>
      <CaptureTab
        sessionId={sessionId}
        onPauseSession={handlePauseSession}
        onEndSession={handleEndSession}
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
