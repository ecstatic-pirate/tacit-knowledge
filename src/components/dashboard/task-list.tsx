'use client';

import { Task } from '@/types';
import { Check, Clock, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TaskListProps {
  tasks: Task[];
  onTaskToggle: (taskId: string) => void;
}

const priorityConfig: Record<string, { variant: string; label: string }> = {
  urgent: { variant: 'destructive', label: 'Urgent' },
  'this-week': { variant: 'warning', label: 'This week' },
  'on-track': { variant: 'success', label: 'Later' },
};

const defaultPriorityConfig = { variant: 'secondary', label: 'Normal' };

export function TaskList({ tasks, onTaskToggle }: TaskListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-base font-semibold">
          My Priorities
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "group flex items-start gap-3 p-2 rounded-md transition-colors hover:bg-secondary/40 cursor-pointer",
              task.completed && "opacity-50"
            )}
            onClick={() => onTaskToggle(task.id)}
          >
            <div
              className={cn(
                "mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0",
                task.completed 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-input text-transparent hover:border-primary"
              )}
            >
              <Check className="h-3 w-3" />
            </div>
            
            <div className="flex-1 space-y-1">
               <p className={cn(
                  "text-sm font-medium leading-none transition-colors",
                  task.completed ? "line-through text-muted-foreground" : "text-foreground"
                )}>
                {task.title}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant={(priorityConfig[task.priority] ?? defaultPriorityConfig).variant as any} className="h-4 px-1 text-[10px] gap-1 font-normal bg-opacity-10 border-opacity-20 bg-transparent border">
                  {task.priority === 'urgent' && <Clock className="w-2.5 h-2.5" />}
                  {(priorityConfig[task.priority] ?? defaultPriorityConfig).label}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
