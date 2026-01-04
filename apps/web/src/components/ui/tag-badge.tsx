import { memo } from 'react'

import { cn } from '@/lib/utils'

interface TagBadgeProps {
  children: React.ReactNode
  className?: string
}

export const TagBadge = memo(function TagBadge({ children, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1',
        'bg-sky-100 text-sky-700 border border-sky-200',
        'text-xs font-medium rounded-full',
        className
      )}
    >
      {children}
    </span>
  )
})

export type { TagBadgeProps }
