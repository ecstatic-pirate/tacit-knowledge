import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { components } from '@/lib/design-system';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(components.emptyStateContainer, className)}>
      <div className={components.emptyStateBox}>
        <Icon className={components.emptyStateIcon} />
        <h2 className={components.emptyStateTitle}>{title}</h2>
        <p className={components.emptyStateDescription}>{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}
