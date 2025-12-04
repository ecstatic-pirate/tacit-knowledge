import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  companyName?: string;
  activeCampaigns?: number;
}

export function Header({ companyName = 'CNA Insurance', activeCampaigns = 3 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-sm font-semibold leading-none tracking-tight">
              Tacit Knowledge
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium">
              Enterprise Intelligence
            </p>
          </div>
          <div className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            BETA
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-foreground">{activeCampaigns} Active Campaigns</span>
             </div>
             <div className="font-medium text-foreground">{companyName}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
