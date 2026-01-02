'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { FileText, Calendar } from 'phosphor-react';
import type { Icon as PhosphorIcon } from 'phosphor-react';

interface ReportCardProps {
  title: string;
  date: string;
  preview: string;
  icon?: PhosphorIcon;
  actions: { label: string; onClick: () => void }[];
}

export function ReportCard({ title, date, preview, icon: Icon = FileText, actions }: ReportCardProps) {
  return (
    <Card className="h-full flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start gap-3 space-y-0 pb-3">
        <div className="p-2 bg-secondary rounded-lg shrink-0 text-primary">
          <Icon className="w-5 h-5" weight="bold" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold leading-tight">
            {title}
          </h4>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Calendar className="w-3 h-3" weight="bold" />
            {date}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
         <div className="p-4 rounded-md bg-secondary/20 text-sm text-muted-foreground line-clamp-3 leading-relaxed border border-border/50">
           {preview}
         </div>
      </CardContent>
      
      <CardFooter className="gap-2 pt-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="secondary"
            size="sm"
            onClick={action.onClick}
            className="flex-1"
          >
            {action.label}
          </Button>
        ))}
      </CardFooter>
    </Card>
  );
}
