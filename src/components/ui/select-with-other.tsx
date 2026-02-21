"use client";

import { LegacySelect } from "./select";
import type { LegacySelectOption } from "./select";
import { Input } from "./input";

interface SelectWithOtherProps {
  label?: string;
  options: LegacySelectOption[];
  value: string;
  customValue?: string;
  onChange: (value: string) => void;
  onCustomChange?: (value: string) => void;
  placeholder?: string;
  customPlaceholder?: string;
  error?: string;
}

export function SelectWithOther({
  label,
  options,
  value,
  customValue = "",
  onChange,
  onCustomChange,
  placeholder,
  customPlaceholder = "Please specify...",
  error,
}: SelectWithOtherProps) {
  const isOther = value === "other";

  return (
    <div className="w-full space-y-2">
      <LegacySelect
        label={label}
        options={options}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        error={!isOther ? error : undefined}
      />
      {isOther && (
        <Input
          placeholder={customPlaceholder}
          value={customValue}
          onChange={(e) => onCustomChange?.(e.target.value)}
          error={error}
        />
      )}
    </div>
  );
}
