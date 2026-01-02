import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { components } from '@/lib/design-system';

interface LoadingStateProps {
  className?: string;
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <div className={cn(components.loadingContainer, className)}>
      <Loader2 className={components.loadingSpinner} />
    </div>
  );
}
