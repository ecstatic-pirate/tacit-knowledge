import { components } from '@/lib/design-system';

interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'error' | 'neutral' | 'default';
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable status badge component with consistent styling across the application.
 * Supports multiple variants for different status types.
 */
export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  const variantClasses = {
    success: components.badgeSuccess,
    warning: components.badgeWarning,
    error: components.badgeError,
    neutral: components.badgeNeutral,
    default: components.badgeDefault,
  };

  return (
    <span className={variantClasses[variant]}>
      {children}
    </span>
  );
}
