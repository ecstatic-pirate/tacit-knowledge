'use client';

import { User, MessageSquare, Map, Check, Circle, FileText, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HumanGuidancePanelProps {
  suggestedQuestions: string[];
  capturedSkills: string[];
  missingSkills: string[];
  referenceFiles: string[];
}

export function HumanGuidancePanel({
  suggestedQuestions,
  capturedSkills,
  missingSkills,
  referenceFiles,
}: HumanGuidancePanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-4 border-b flex-row items-center gap-3 space-y-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary text-secondary-foreground">
          <User className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold">Interviewer Guide</h3>
          <p className="text-xs text-muted-foreground">Suggested questions & references</p>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6 flex-1 overflow-y-auto">
        {/* Suggested Questions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <MessageSquare className="w-3 h-3" />
            Recommended Questions
          </div>
          <div className="space-y-2">
            {suggestedQuestions.map((question, index) => (
              <div
                key={index}
                className="group relative pl-4 py-1 cursor-pointer hover:text-foreground text-muted-foreground transition-colors"
              >
                <div className="absolute left-0 top-2.5 w-1 h-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
                <span className="text-sm leading-relaxed block">{question}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-border w-full" />

        {/* Skills Map */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <Map className="w-3 h-3" />
            Skill Coverage
          </div>
          <div className="flex flex-wrap gap-1.5">
            {capturedSkills.map((skill) => (
              <Badge key={skill} variant="success" className="gap-1">
                <Check className="w-2.5 h-2.5" /> {skill}
              </Badge>
            ))}
            {missingSkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="gap-1 text-muted-foreground">
                <Circle className="w-2.5 h-2.5" /> {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div className="h-px bg-border w-full" />

        {/* Reference Materials */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <FileText className="w-3 h-3" />
            References
          </div>
          <div className="space-y-1">
            {referenceFiles.map((file) => (
              <div key={file} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-secondary/50 cursor-pointer group transition-colors -mx-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground font-medium truncate">{file}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
