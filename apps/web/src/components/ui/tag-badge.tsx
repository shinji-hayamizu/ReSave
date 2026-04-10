import { memo } from 'react'

import { getTagColorClasses } from '@/components/tags/color-palette'
import { cn } from '@/lib/utils'

interface TagBadgeProps {
  children: React.ReactNode
  color?: string
  className?: string
}

export const TagBadge = memo(function TagBadge({ children, color, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 border',
        getTagColorClasses(color ?? 'blue'),
        'text-xs font-medium rounded-full',
        className
      )}
    >
      {children}
    </span>
  )
})

export type { TagBadgeProps }
