import { cn } from '@/lib/utils';
import { pageHeader } from '@/lib/design-system';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn(pageHeader.container, className)}>
      <h1 className={pageHeader.title}>{title}</h1>
      {subtitle && <p className={pageHeader.subtitle}>{subtitle}</p>}
    </div>
  );
}
