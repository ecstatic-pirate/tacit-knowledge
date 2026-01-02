import { MapPin, Compass, Tag } from 'phosphor-react';

interface SkillCategory {
  name: string;
  skills: string[];
}

interface SkillsMapProps {
  personName: string;
  categories: SkillCategory[];
}

export function SkillsMap({ personName, categories }: SkillsMapProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="w-5 h-5 text-primary" weight="bold" />
        <h3 className="text-lg font-bold text-neutral-900">
          Skills Map - {personName}
        </h3>
      </div>

      <div className="bg-white rounded-xl p-8 border border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div
              key={category.name}
              className="p-5 rounded-xl bg-neutral-50 border-l-4 border-primary transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-2 font-bold mb-4 text-primary text-lg">
                <Compass className="w-5 h-5" weight="bold" />
                {category.name}
              </div>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1.5 inline-flex px-3 py-1.5 bg-white rounded-md text-sm font-medium text-neutral-700 border border-neutral-200 shadow-sm"
                  >
                    <Tag className="w-3 h-3 text-neutral-400" weight="bold" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
