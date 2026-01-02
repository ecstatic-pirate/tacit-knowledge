import { MapPin, Compass, CaretRight } from 'phosphor-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

interface SkillCategory {
  name: string;
  skills: string[];
}

interface SkillsMapSidebarProps {
  categories: SkillCategory[];
}

export function SkillsMapSidebar({ categories }: SkillsMapSidebarProps) {
  return (
    <Card className="h-fit sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
          <MapPin className="w-4 h-4" weight="bold" />
          Skills Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => (
          <div key={category.name} className="group">
            <div className="flex items-center gap-2 font-medium text-primary mb-2">
              <Compass className="w-4 h-4" weight="bold" />
              {category.name}
            </div>
            <div className="ml-[9px] border-l pl-4 space-y-2">
              {category.skills.map((skill) => (
                <div
                  key={skill}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
                >
                  <CaretRight className="w-3 h-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" weight="bold" />
                  {skill}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="pt-4 border-t text-center">
          <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-wide">
            View All Categories
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
