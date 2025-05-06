import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  badgeClassName?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
  badgeClassName,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (option: string) => {
    onChange(selected.filter((s) => s !== option));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = e.target as HTMLInputElement;
    if (input.value === "") {
      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (selected.length > 0) {
            handleUnselect(selected[selected.length - 1]);
          }
          break;
        default:
          break;
      }
    }
  };

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn(
        "overflow-visible bg-white dark:bg-gray-950 rounded-md border border-input",
        className
      )}
    >
      <div className="group flex items-center flex-wrap gap-1 p-1 text-sm w-full">
        {selected.map((selectedOption) => {
          const option = options.find((o) => o.value === selectedOption);
          return (
            <Badge
              key={selectedOption}
              className={cn(
                "data-[selected]:bg-primary data-[selected]:text-primary-foreground py-1 px-2",
                badgeClassName
              )}
            >
              {option?.label || selectedOption}
              <button
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnselect(selectedOption);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(selectedOption)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          );
        })}
        <CommandPrimitive.Input
          placeholder={selected.length === 0 ? placeholder : undefined}
          value={inputValue}
          onValueChange={setInputValue}
          onBlur={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          className="ml-1 bg-transparent outline-none placeholder:text-muted-foreground flex-1 min-w-[120px] min-h-[28px]"
        />
      </div>
      <div className="relative mt-1">
        {open && (
          <div className="absolute top-0 left-0 w-full z-10 bg-popover rounded-md border border-input shadow-md overflow-y-auto max-h-60">
            <CommandGroup className="overflow-visible">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={() => {
                    onChange(
                      selected.includes(option.value)
                        ? selected.filter((s) => s !== option.value)
                        : [...selected, option.value]
                    );
                    setInputValue("");
                  }}
                  className={cn(
                    "cursor-pointer",
                    selected.includes(option.value) && "bg-muted"
                  )}
                >
                  {selected.includes(option.value) ? (
                    <span className="mr-2">✓</span>
                  ) : (
                    <span className="mr-2 opacity-0">✓</span>
                  )}
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        )}
      </div>
    </Command>
  );
}