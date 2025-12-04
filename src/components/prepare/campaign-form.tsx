'use client';

import { useState } from 'react';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CampaignFormProps {
  onSubmit: (data: CampaignFormData) => void;
}

export interface CampaignFormData {
  name: string;
  role: string;
  department: string;
  yearsExperience: number;
  goal: string;
  skills: string;
}

export function CampaignForm({ onSubmit }: CampaignFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    role: '',
    department: '',
    yearsExperience: 0,
    goal: '',
    skills: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Person Name"
            placeholder="e.g., James Morrison"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Role"
            placeholder="e.g., Billing Systems Lead"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
          <Input
            label="Department"
            placeholder="e.g., Operations"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <Input
            label="Years of Experience"
            type="number"
            placeholder="30"
            value={formData.yearsExperience || ''}
            onChange={(e) =>
              setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })
            }
          />
          <Textarea
            label="Goal"
            placeholder="What expertise do you want to capture from this person?"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
          />
          <Textarea
            label="Key Skills to Focus On"
            placeholder="List the skills and knowledge areas..."
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          />
          <Button type="submit" className="w-full">
            Create Campaign
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
