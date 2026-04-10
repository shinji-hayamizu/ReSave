'use client';

import { memo } from 'react';

import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FabButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FabButton = memo(function FabButton({ onClick, isOpen }: FabButtonProps) {
  return (
    <button
      aria-label="新規カード作成"
      className={cn(
        'fixed bottom-20 right-4 z-50',
        'flex h-14 w-14 items-center justify-center',
        'rounded-full bg-primary text-primary-foreground shadow-lg',
        'transition-transform duration-200 ease-in-out',
        'active:scale-95',
        isOpen && 'rotate-45'
      )}
      type="button"
      onClick={onClick}
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
});
