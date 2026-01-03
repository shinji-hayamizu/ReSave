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
        'flex flex-col items-center justify-center py-12 px-5 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground [&>svg]:h-16 [&>svg]:w-16">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export type { EmptyStateProps }
