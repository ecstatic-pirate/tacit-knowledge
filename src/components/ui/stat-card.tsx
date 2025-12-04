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
    iconColor: 'text-emerald-600',
  },
  warning: {
    iconColor: 'text-amber-600',
  },
  primary: {
    iconColor: 'text-primary',
  },
  purple: {
    iconColor: 'text-violet-600',
  },
};

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ variant, label, value, subtitle, icon: Icon, className = '', ...props }, ref) => {
    const config = variantConfig[variant];

    return (
      <Card ref={ref} className={cn("", className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
            {Icon && (
              <Icon className={cn("h-4 w-4", config.iconColor)} />
            )}
          </div>
          <div className="flex flex-col gap-1">
             <div className="text-2xl font-bold">{value}</div>
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
