import { cn } from '@/lib/utils';
import { components } from '@/lib/design-system';

interface ListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * Reusable list item component for consistent styling across lists.
 * Supports compact and regular sizing variants.
 * Can be interactive with optional click handler.
 */
export function ListItem({
  children,
  onClick,
  compact = false,
  className,
}: ListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        compact ? components.listItemCompact : components.listItem,
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
