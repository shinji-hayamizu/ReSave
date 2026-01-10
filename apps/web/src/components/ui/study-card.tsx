'use client'

import { memo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const TOTAL_REVIEW_LEVELS = 6

interface StudyCardProps {
  question: string
  answer?: string
  tags?: React.ReactNode
  ratingButtons?: React.ReactNode
  reviewLevel?: number
  onEdit?: () => void
  defaultOpen?: boolean
  className?: string
}

export const StudyCard = memo(function StudyCard({
  question,
  answer,
  tags,
  ratingButtons,
  reviewLevel,
  onEdit,
  defaultOpen = false,
  className,
}: StudyCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        'bg-card rounded-xl shadow-sm overflow-hidden transition-shadow hover:shadow-md',
        className
      )}
    >
      {(ratingButtons || tags || reviewLevel !== undefined) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-card">
          {ratingButtons && <div className="flex-shrink-0">{ratingButtons}</div>}
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            {tags}
            {reviewLevel !== undefined && reviewLevel > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                <Check className="h-3 w-3" />
                {reviewLevel}/{TOTAL_REVIEW_LEVELS}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base text-foreground leading-relaxed flex-1">
            {question}
          </p>
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">編集</span>
            </Button>
          )}
        </div>
      </div>

      {answer && (
        <>
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full py-3 bg-card text-primary text-sm font-medium hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>答えを隠す</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>答えを見る</span>
              </>
            )}
          </button>

          {isOpen && (
            <div className="px-5 py-4 bg-card">
              <div className="inline-block px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-base text-foreground leading-relaxed">
                  {answer}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
})

export type { StudyCardProps }
