import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const formAlertVariants = cva(
  'px-4 py-3 rounded-lg text-sm',
  {
    variants: {
      variant: {
        error: 'bg-destructive/10 border border-destructive/30 text-destructive',
        warning: 'bg-warning/10 border border-warning/30 text-warning',
        success: 'bg-success/10 border border-success/30 text-success',
      },
    },
    defaultVariants: {
      variant: 'error',
    },
  }
)

interface FormAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formAlertVariants> {
  children: React.ReactNode
}

export function FormAlert({
  className,
  variant,
  children,
  ...props
}: FormAlertProps) {
  return (
    <div
      role="alert"
      className={cn(formAlertVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { formAlertVariants }
export type { FormAlertProps }
