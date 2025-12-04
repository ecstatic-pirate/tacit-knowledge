'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { CaptureTab } from '@/components/tabs';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Check, Layers } from 'lucide-react';

export default function CapturePage() {
  const { showToast } = useToast();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
  }>({ isOpen: false, title: '', content: null });

  const closeModal = () => setModalState({ isOpen: false, title: '', content: null });

  const handlePauseSession = useCallback(() => {
    showToast('Session paused', 'warning');
  }, [showToast]);

  const handleEndSession = useCallback(() => {
    setModalState({
      isOpen: true,
      title: 'Session Complete',
      content: (
        <div className="text-center space-y-6 py-4">
          <div className="w-20 h-20 bg-emerald-100/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          
          <div>
            <div className="text-2xl font-bold">Session Complete</div>
            <p className="text-muted-foreground mt-1">Great job capturing today's knowledge!</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="bg-secondary/50 p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Duration</div>
              <div className="text-lg font-bold">43m</div>
            </div>
            <div className="bg-secondary/50 p-3 rounded-lg border">
              <div className="text-xs text-muted-foreground font-semibold uppercase">Questions</div>
              <div className="text-lg font-bold">8/8</div>
            </div>
          </div>

          <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 text-left">
            <div className="font-semibold mb-3 text-primary flex items-center gap-2">
              <Layers className="w-4 h-4" />
              AI Processing Started
            </div>
            <ul className="space-y-2">
              {['Transcript extraction', 'Skill identification', 'Key insights extraction'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                showToast('Session archived');
                closeModal();
              }}
              className="flex-1"
            >
              Archive Session
            </Button>
            <Button variant="secondary" onClick={closeModal} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      ),
    });
  }, [showToast]);

  return (
    <>
      <CaptureTab onPauseSession={handlePauseSession} onEndSession={handleEndSession} />
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

