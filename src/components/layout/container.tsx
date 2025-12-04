import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("container mx-auto px-4 py-8", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const SectionTitle = forwardRef<HTMLHeadingElement, SectionTitleProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn("scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-6", className)}
        {...props}
      >
        {children}
      </h2>
    );
  }
);

SectionTitle.displayName = 'SectionTitle';
