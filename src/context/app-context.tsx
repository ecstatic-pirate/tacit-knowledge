'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Campaign, Task } from '@/types';

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Michael Chen',
    role: 'Leader, Operations Technologies',
    status: 'on-track',
    progress: 65,
    totalSessions: 14,
    completedSessions: 9,
    skillsCaptured: 47,
  },
  {
    id: '2',
    name: 'Patricia Rodriguez',
    role: 'Premium Audit Expert',
    status: 'keep-track',
    progress: 36,
    totalSessions: 14,
    completedSessions: 5,
    skillsCaptured: 23,
  },
  {
    id: '3',
    name: 'James Morrison',
    role: 'Billing Systems Lead',
    status: 'danger',
    progress: 0,
    totalSessions: 14,
    completedSessions: 0,
    skillsCaptured: 0,
  },
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Set up knowledge capture for James Morrison',
    priority: 'urgent',
    completed: false,
  },
  {
    id: '2',
    title: 'Review session 8 notes for Patricia',
    priority: 'this-week',
    completed: false,
  },
  {
    id: '3',
    title: "Export knowledge graph for Michael's campaign",
    priority: 'on-track',
    completed: false,
  },
];

interface AppContextType {
  campaigns: Campaign[];
  tasks: Task[];
  toggleTask: (taskId: string) => void;
  updateCampaign: (campaign: Campaign) => void;
  addCampaign: (campaign: Campaign) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const toggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  const updateCampaign = useCallback((updatedCampaign: Campaign) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c))
    );
  }, []);

  const addCampaign = useCallback((newCampaign: Campaign) => {
    setCampaigns((prev) => [...prev, newCampaign]);
  }, []);

  return (
    <AppContext.Provider value={{ campaigns, tasks, toggleTask, updateCampaign, addCampaign }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within a AppProvider');
  }
  return context;
}

