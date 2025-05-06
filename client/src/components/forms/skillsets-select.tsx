import { useQuery } from "@tanstack/react-query";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface SkillSetsSelectProps {
  selectedSkillSetIds: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  description?: string;
}

export default function SkillSetsSelect({
  selectedSkillSetIds,
  onChange,
  label = "Skill Sets",
  description,
}: SkillSetsSelectProps) {
  // Fetch all skill sets
  const { data: skillSets, isLoading } = useQuery({
    queryKey: ['/api/skillsets'],
  });

  // Map the skill sets to the format expected by MultiSelect
  const skillSetOptions: Option[] = Array.isArray(skillSets)
    ? skillSets.map((skillSet: any) => ({
        value: skillSet.id.toString(),
        label: `${skillSet.name} (${skillSet.category}, Lvl ${skillSet.level})`,
        disabled: false,
      }))
    : [];

  // Convert number IDs to strings for MultiSelect
  const selectedValues = selectedSkillSetIds.map((id) => id.toString());

  // Handle selection changes
  const handleSelectionChange = (selected: string[]) => {
    // Convert string IDs back to numbers
    const numberIds = selected.map((id) => parseInt(id));
    onChange(numberIds);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading skill sets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      {description && (
        <p className="text-sm text-muted-foreground mb-2">{description}</p>
      )}
      <MultiSelect
        options={skillSetOptions}
        selected={selectedValues}
        onChange={handleSelectionChange}
        placeholder="Select skill sets..."
        className="mt-1"
      />
      {selectedSkillSetIds.length > 0 && (
        <p className="text-sm text-muted-foreground mt-1">
          {selectedSkillSetIds.length} skill set{selectedSkillSetIds.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
}