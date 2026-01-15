'use client';

import { useState } from 'react';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { ListChecks, FloppyDisk } from 'phosphor-react';

interface PlannerSidebarProps {
  personName: string;
  goal: string;
  wantedTopics: string;
  notes: string;
  onUpdate: () => void;
}

export function PlannerSidebar({
  personName,
  goal: initialGoal,
  wantedTopics: initialTopics,
  notes: initialNotes,
  onUpdate,
}: PlannerSidebarProps) {
  const [goal, setGoal] = useState(initialGoal);
  const [wantedTopics, setWantedTopics] = useState(initialTopics);
  const [notes, setNotes] = useState(initialNotes);

  return (
    <Card className="h-fit sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" weight="bold" />
          Plan Details
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Input
          label="Person"
          value={personName}
          readOnly
          className="bg-secondary/50"
        />
        <Textarea
          label="Goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="min-h-[100px]"
        />
        <Textarea
          label="Wanted Topics"
          value={wantedTopics}
          onChange={(e) => setWantedTopics(e.target.value)}
          className="min-h-[100px]"
        />
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[100px]"
        />
        <Button className="w-full mt-2" onClick={onUpdate}>
          <FloppyDisk className="w-4 h-4 mr-2" weight="bold" /> Update Plan
        </Button>
      </CardContent>
    </Card>
  );
}
