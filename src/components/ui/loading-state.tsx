import { CircleNotch } from 'phosphor-react';
import { cn } from '@/lib/utils';
import { components } from '@/lib/design-system';

interface LoadingStateProps {
  className?: string;
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <div className={cn(components.loadingContainer, className)}>
      <CircleNotch className={components.loadingSpinner} weight="bold" />
    </div>
  );
}
