'use client'

import { memo, useRef, useState } from 'react'
import { Eye, EyeOff, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface StudyCardProps {
  question: string
  answer?: string
  tags?: React.ReactNode
  ratingButtons?: React.ReactNode
  currentStep?: number
  totalSteps?: number
  onEdit?: () => void
  defaultOpen?: boolean
  className?: string
}

export const StudyCard = memo(function StudyCard({
  question,
  answer,
  tags,
  ratingButtons,
  currentStep,
  totalSteps,
  onEdit,
  defaultOpen = false,
  className,
}: StudyCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const answerRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    const willOpen = !isOpen
    setIsOpen(willOpen)

    if (willOpen) {
      // アニメーション完了後にスクロール（duration-100 = 100ms）
      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }

  const showReviewInfo = currentStep !== undefined && totalSteps !== undefined && totalSteps > 0

  return (
    <div
      className={cn(
        'bg-card rounded-xl shadow-sm overflow-hidden transition-shadow hover:shadow-md',
        className
      )}
    >
      {(ratingButtons || tags || showReviewInfo) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-card">
          {ratingButtons && <div className="flex-shrink-0">{ratingButtons}</div>}
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            {tags}
            {showReviewInfo && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {currentStep}/{totalSteps}
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
          <div className="flex justify-center py-2 bg-card">
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center gap-2 px-6 h-9 rounded-full text-sm font-semibold border-2 transition-all',
                isOpen
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                  : 'bg-transparent text-primary border-primary hover:bg-primary hover:text-primary-foreground'
              )}
              onClick={handleToggle}
            >
              {isOpen ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              <span>{isOpen ? '答えを隠す' : '答えを見る'}</span>
            </button>
          </div>

          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-100 ease-out',
              isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}
          >
            <div className="overflow-hidden">
              <div ref={answerRef} className="px-5 py-4 bg-card">
                <div className="inline-block px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-base text-foreground leading-relaxed">
                    {answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
})

export type { StudyCardProps }
