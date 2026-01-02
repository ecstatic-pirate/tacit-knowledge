import { cn } from '@/lib/utils';
import { components } from '@/lib/design-system';

interface SectionDividerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable section divider component for visual separation between sections.
 * Provides consistent styling for section headers with dividers.
 */
export function SectionDivider({ children, className }: SectionDividerProps) {
  return (
    <div className={cn(components.sectionDivider, className)}>
      {children}
    </div>
  );
}
