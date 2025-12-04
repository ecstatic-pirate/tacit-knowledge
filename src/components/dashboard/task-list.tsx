'use client';

import { Task } from '@/types';
import { ListTodo, CheckSquare, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TaskListProps {
  tasks: Task[];
  onTaskToggle: (taskId: string) => void;
}

const priorityConfig = {
  urgent: { variant: 'destructive', label: 'Urgent' },
  'this-week': { variant: 'warning', label: 'This week' },
  'on-track': { variant: 'success', label: 'On track' },
} as const;

export function TaskList({ tasks, onTaskToggle }: TaskListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-primary" />
          Open Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "group flex items-center gap-4 p-4 rounded-lg border transition-all duration-200",
              task.completed 
                ? "bg-secondary/50 opacity-75" 
                : "bg-card hover:border-primary/50 hover:shadow-sm"
            )}
          >
            <button
              onClick={() => onTaskToggle(task.id)}
              className={cn(
                "w-5 h-5 rounded border flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                task.completed 
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-input text-transparent hover:border-primary"
              )}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            
            <span
              className={cn(
                "flex-1 font-medium transition-colors text-sm",
                task.completed ? "line-through text-muted-foreground" : "text-foreground"
              )}
            >
              {task.title}
            </span>
            
            <Badge variant={priorityConfig[task.priority].variant as any} className="gap-1.5">
              {task.priority === 'urgent' && <Clock className="w-3 h-3" />}
              {priorityConfig[task.priority].label}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
