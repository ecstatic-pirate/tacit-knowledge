'use client';

import { useState } from 'react';
import { Mic, User, Bot, Users, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type CaptureMode = 'human' | 'ai' | 'hybrid';

interface CaptureModeOption {
  id: CaptureMode;
  label: string;
  description: string;
  icon: LucideIcon;
}

const options: CaptureModeOption[] = [
  {
    id: 'human',
    label: 'Human-Led',
    description: 'Expert interviewer conducts all sessions',
    icon: User,
  },
  {
    id: 'ai',
    label: 'AI-Guided',
    description: 'Your team leads with AI guidance & support',
    icon: Bot,
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    description: 'Combination of human experts & AI assistance',
    icon: Users,
  },
];

interface CaptureModeSelectorProps {
  value?: CaptureMode;
  onChange?: (mode: CaptureMode) => void;
}

export function CaptureModeSelector({
  value = 'human',
  onChange,
}: CaptureModeSelectorProps) {
  const [selected, setSelected] = useState<CaptureMode>(value);

  const handleChange = (mode: CaptureMode) => {
    setSelected(mode);
    onChange?.(mode);
  };

  return (
    <div className="bg-white rounded-xl p-8 border border-border shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Mic className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-neutral-900">
          Capture Mode
        </h3>
      </div>
      <p className="text-sm mb-6 text-neutral-500">
        Can also be edited on a per-session basis once campaign starts
      </p>

      <div className="space-y-4">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;
          
          return (
            <label
              key={option.id}
              className={cn(
                "flex gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-neutral-200 bg-white hover:border-primary/30 hover:bg-neutral-50"
              )}
            >
              <input
                type="radio"
                name="capture-mode"
                value={option.id}
                checked={isSelected}
                onChange={() => handleChange(option.id)}
                className="w-5 h-5 cursor-pointer mt-0.5 accent-primary"
              />
              <div>
                <div className={cn("font-bold flex items-center gap-2", isSelected ? "text-primary" : "text-neutral-900")}>
                  <Icon className="w-4 h-4" /> {option.label}
                </div>
                <div className="text-sm text-neutral-500 mt-1">
                  {option.description}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
