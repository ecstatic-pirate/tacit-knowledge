'use client';

import { cn } from '@/lib/utils';

interface CoverageSegment {
  label: string;
  value: number;
  color: string;
}

interface CoverageBarProps {
  segments: CoverageSegment[];
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CoverageBar({
  segments,
  showLabels = false,
  size = 'md',
  className,
}: CoverageBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  const height = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn('w-full bg-secondary rounded-full overflow-hidden flex', height)}>
        {segments.map((segment, idx) => {
          const width = total > 0 ? (segment.value / total) * 100 : 0;
          return (
            <div
              key={idx}
              className={cn('h-full transition-all', segment.color)}
              style={{ width: `${width}%` }}
            />
          );
        })}
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-3">
          {segments.map((segment, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs">
              <div className={cn('w-2 h-2 rounded-full', segment.color)} />
              <span className="text-muted-foreground">{segment.label}</span>
              <span className="font-medium">{segment.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple progress bar variant
interface SimpleProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SimpleProgressBar({
  value,
  max = 100,
  color = 'bg-primary',
  showPercentage = false,
  size = 'md',
  className,
}: SimpleProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  const height = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-secondary rounded-full overflow-hidden', height)}>
        <div
          className={cn('h-full transition-all rounded-full', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs text-muted-foreground font-medium min-w-[2.5rem] text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
}
