'use client';

import { useState, useEffect } from 'react';

interface SessionTimerProps {
  totalMinutes: number;
  elapsedMinutes: number;
  onTimeWarning?: () => void;
  onTimeUp?: () => void;
}

export function SessionTimer({
  totalMinutes,
  elapsedMinutes,
  onTimeWarning,
  onTimeUp,
}: SessionTimerProps) {
  const remainingSeconds = (totalMinutes - elapsedMinutes) * 60;
  const [timeLeft, setTimeLeft] = useState(remainingSeconds);
  const [showWarning, setShowWarning] = useState(false);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (elapsedMinutes / totalMinutes) * 100;

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    if (timeLeft <= 120 && !showWarning) {
      setShowWarning(true);
      onTimeWarning?.();
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showWarning, onTimeWarning, onTimeUp]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-8 mb-8">
      {/* Progress */}
      <div
        className="bg-white rounded-lg p-6"
        style={{ border: '1px solid var(--border)' }}
      >
        <div
          className="text-sm uppercase font-semibold tracking-wider mb-3"
          style={{ color: 'var(--text-secondary)' }}
        >
          ⏱️ Session Progress
        </div>
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--neutral-light)' }}
            >
              <div
                className="h-full transition-all duration-1000"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #0f3a7d 0%, #1e5fa8 100%)',
                }}
              />
            </div>
            <div className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              {elapsedMinutes} minutes of {totalMinutes} minute session
            </div>
          </div>
          <div className="ml-6 text-right">
            <div
              className="text-4xl font-bold tabular-nums"
              style={{ color: 'var(--primary)' }}
            >
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Remaining
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      {showWarning && (
        <div
          className="rounded-lg p-4 text-center animate-pulse-slow"
          style={{
            background: '#fee2e2',
            border: '2px solid #ef4444',
          }}
        >
          <div className="font-bold mb-1" style={{ color: '#dc2626' }}>
            ⏰ 2 Minutes Left!
          </div>
          <div className="text-sm" style={{ color: '#991b1b' }}>
            Time to wrap up
          </div>
        </div>
      )}
    </div>
  );
}
