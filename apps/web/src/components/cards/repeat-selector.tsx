'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type RepeatMode = 'spaced' | 'daily' | 'weekly' | 'none';

interface RepeatSelectorProps {
  value: RepeatMode;
  onChange: (value: RepeatMode) => void;
}

const REPEAT_OPTIONS: { value: RepeatMode; label: string }[] = [
  { value: 'spaced', label: '間隔反復' },
  { value: 'daily', label: '毎日' },
  { value: 'weekly', label: '毎週' },
  { value: 'none', label: 'なし' },
];

export function RepeatSelector({ value, onChange }: RepeatSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="リピート方式を選択" />
      </SelectTrigger>
      <SelectContent>
        {REPEAT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { REPEAT_OPTIONS };
export type { RepeatMode };
