import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        'rounded-xl bg-gradient-to-b from-muted/30 to-muted/10',
        className
      )}
    >
      {icon && (
        <div className="mb-5 text-muted-foreground/60 [&>svg]:h-20 [&>svg]:w-20">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}

export type { EmptyStateProps }
