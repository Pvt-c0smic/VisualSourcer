import { useQuery } from "@tanstack/react-query";
import { MultiSelect, MultiSelectItem, MultiSelectProvider } from "@/components/ui/multi-select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

type SkillSet = {
  id: number;
  name: string;
  category: string;
  level: number;
  description?: string;
};

type SkillSetsSelectProps = {
  selectedSkillSetIds: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  description?: string;
  filterByCategory?: string;
  filterByLevel?: number;
  max?: number;
  isRequired?: boolean;
  className?: string;
};

export default function SkillSetsSelect({
  selectedSkillSetIds,
  onChange,
  label = "Skill Sets",
  description,
  filterByCategory,
  filterByLevel,
  max,
  isRequired = false,
  className = "",
}: SkillSetsSelectProps) {
  
  // Fetch all skill sets
  const { data: skillSets, isLoading } = useQuery({
    queryKey: ['/api/skillsets'],
  });

  // Group skill sets by category for better organization
  const [groupedSkillSets, setGroupedSkillSets] = useState<Record<string, SkillSet[]>>({});
  
  useEffect(() => {
    if (skillSets) {
      // Group by category
      const grouped = (skillSets as SkillSet[]).reduce((acc: Record<string, SkillSet[]>, skillSet) => {
        // Apply filters if provided
        if (
          (filterByCategory && skillSet.category !== filterByCategory) ||
          (filterByLevel !== undefined && skillSet.level !== filterByLevel)
        ) {
          return acc;
        }
        
        if (!acc[skillSet.category]) {
          acc[skillSet.category] = [];
        }
        acc[skillSet.category].push(skillSet);
        return acc;
      }, {});
      
      setGroupedSkillSets(grouped);
    }
  }, [skillSets, filterByCategory, filterByLevel]);

  // Handle selection change
  const handleChange = (values: string[]) => {
    const ids = values.map(v => parseInt(v));
    onChange(ids);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="skillsets">
        {label}{isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {description && (
        <p className="text-sm text-gray-500 mb-2">{description}</p>
      )}
      
      <MultiSelectProvider 
        values={selectedSkillSetIds.map(id => id.toString())}
        onValuesChange={handleChange}
        max={max}
      >
        <MultiSelect
          placeholder="Select skill sets..."
          values={selectedSkillSetIds.map(id => id.toString())}
          onValuesChange={handleChange}
          max={max}
        >
          {Object.entries(groupedSkillSets).map(([category, skills]) => (
            <div key={category}>
              <div className="px-2 py-1 text-sm font-semibold text-gray-500 bg-gray-100">
                {category}
              </div>
              {skills.map((skill) => (
                <MultiSelectItem
                  key={skill.id}
                  value={skill.id.toString()}
                  textValue={skill.name}
                >
                  <div className="flex justify-between w-full">
                    <span>{skill.name}</span>
                    <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5 text-gray-700">
                      Level {skill.level}
                    </span>
                  </div>
                  {skill.description && (
                    <p className="text-xs text-gray-500 mt-1">{skill.description}</p>
                  )}
                </MultiSelectItem>
              ))}
            </div>
          ))}
        </MultiSelect>
      </MultiSelectProvider>
    </div>
  );
}