'use client';

import { cn } from '@/lib/utils';

interface ViewOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface ViewToggleProps<T extends string> {
  options: ViewOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function ViewToggle<T extends string>({
  options,
  value,
  onChange,
  className,
}: ViewToggleProps<T>) {
  return (
    <div className={cn('inline-flex rounded-lg bg-secondary/50 p-1', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.icon}
          {option.label}
          {option.count !== undefined && (
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium',
                value === option.value
                  ? 'bg-foreground/10 text-foreground'
                  : 'bg-muted-foreground/20 text-muted-foreground'
              )}
            >
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
