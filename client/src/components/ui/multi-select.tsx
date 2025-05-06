import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type Option = {
  label: string;
  value: string;
  disable?: boolean;
  textValue?: string;
};

type MultiSelectProps = {
  options?: Option[];
  placeholder?: string;
  values: string[];
  onValuesChange: (values: string[]) => void;
  className?: string;
  max?: number;
  customOption?: (option: Option) => React.ReactNode;
  children?: React.ReactNode;
};

export function MultiSelect({
  options,
  placeholder = "Select options",
  values,
  onValuesChange,
  className,
  max,
  customOption,
  children,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (value: string) => {
    onValuesChange(values.filter((v) => v !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;

    if (e.key === "Backspace" || e.key === "Delete") {
      onValuesChange(values.slice(0, -1));
    }
  };

  const getDisplayValue = () => {
    if (!values.length) return "";

    if (options) {
      return options
        .filter((option) => values.includes(option.value))
        .map((option) => option.label)
        .join(", ");
    }

    return values.join(", ");
  };

  const handleSelect = (value: string) => {
    if (values.includes(value)) {
      onValuesChange(values.filter((v) => v !== value));
    } else {
      if (max && values.length >= max) return;
      onValuesChange([...values, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            values.length > 0 ? "h-auto" : "h-10",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-wrap gap-1 max-w-full">
            {values.length > 0 ? (
              <>
                {values.map((value) => {
                  // Find the corresponding option if available
                  const currentOption = options?.find(
                    (option) => option.value === value
                  );
                  
                  return (
                    <Badge
                      variant="secondary"
                      key={value}
                      className="mr-1 mb-1 py-1"
                    >
                      {currentOption ? currentOption.label : value}
                      <button
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUnselect(value);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={() => handleUnselect(value)}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  );
                })}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[var(--radix-popover-trigger-width)] max-h-[350px]">
        <Command onKeyDown={handleKeyDown}>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {options ? (
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = values.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      disabled={option.disable}
                      onSelect={() => handleSelect(option.value)}
                      className={cn(
                        "cursor-pointer",
                        option.disable && "cursor-not-allowed opacity-50"
                      )}
                      textValue={option.textValue || option.label}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {customOption ? customOption(option) : option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : (
              children
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export interface MultiSelectItemProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  textValue?: string; // For searchable text value that might differ from display
}

export const MultiSelectItem = React.forwardRef<
  HTMLDivElement,
  MultiSelectItemProps
>(({ children, value, disabled, textValue, ...props }, ref) => {
  const { values, onValuesChange, max } = React.useContext(MultiSelectContext);
  const isSelected = values?.includes(value);

  const handleSelect = (value: string) => {
    if (!onValuesChange) return;
    
    if (values?.includes(value)) {
      onValuesChange(values.filter((v) => v !== value));
    } else {
      if (max && values && values.length >= max) return;
      onValuesChange([...(values || []), value]);
    }
  };

  return (
    <CommandItem
      ref={ref}
      disabled={disabled}
      onSelect={() => handleSelect(value)}
      className={cn(
        "cursor-pointer",
        disabled && "cursor-not-allowed opacity-50"
      )}
      textValue={textValue}
      {...props}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4",
          isSelected ? "opacity-100" : "opacity-0"
        )}
      />
      {children}
    </CommandItem>
  );
});

MultiSelectItem.displayName = "MultiSelectItem";

// Context for MultiSelectItem
interface MultiSelectContextValue {
  values?: string[];
  onValuesChange?: (values: string[]) => void;
  max?: number;
}

const MultiSelectContext = React.createContext<MultiSelectContextValue>({});

export interface MultiSelectProviderProps {
  children: React.ReactNode;
  values: string[];
  onValuesChange: (values: string[]) => void;
  max?: number;
}

export function MultiSelectProvider({
  children,
  values,
  onValuesChange,
  max,
}: MultiSelectProviderProps) {
  return (
    <MultiSelectContext.Provider value={{ values, onValuesChange, max }}>
      {children}
    </MultiSelectContext.Provider>
  );
}