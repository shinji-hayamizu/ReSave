import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showLabel?: boolean
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground text-right mt-1">
          {label ?? `${Math.round(percentage)}%`}
        </p>
      )}
    </div>
  )
}

export type { ProgressBarProps }
