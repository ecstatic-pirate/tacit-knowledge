import { HTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

type StatCardVariant = 'success' | 'warning' | 'primary' | 'purple';

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  variant: StatCardVariant;
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
}

const variantConfig: Record<StatCardVariant, {
  iconColor: string;
}> = {
  success: {
    iconColor: 'text-emerald-800',
  },
  warning: {
    iconColor: 'text-amber-800',
  },
  primary: {
    iconColor: 'text-primary',
  },
  purple: {
    iconColor: 'text-stone-700',
  },
};

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ variant, label, value, subtitle, icon: Icon, className = '', ...props }, ref) => {
    const config = variantConfig[variant];

    return (
      <Card ref={ref} className={cn("border-border/60 shadow-sm", className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium text-muted-foreground font-sans uppercase tracking-wide text-[10px]">
              {label}
            </span>
            {Icon && (
              <Icon className={cn("h-4 w-4", config.iconColor)} />
            )}
          </div>
          <div className="flex flex-col gap-1">
             <div className="text-3xl font-bold font-serif text-foreground">{value}</div>
             {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
             )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard';
