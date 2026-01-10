'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Check, Eye, EyeOff, Pencil, X } from 'lucide-react'
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
  onSave?: (data: { front?: string; back?: string }) => void
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
  onSave,
  defaultOpen = false,
  className,
}: StudyCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [editingField, setEditingField] = useState<'front' | 'back' | null>(null)
  const [editValue, setEditValue] = useState('')
  const answerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleToggle = () => {
    const willOpen = !isOpen
    setIsOpen(willOpen)

    if (willOpen) {
      setTimeout(() => {
        answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    } else {
      if (editingField === 'back') {
        setEditingField(null)
      }
    }
  }

  const startEdit = useCallback((field: 'front' | 'back') => {
    if (field === 'back' && !isOpen) return
    setEditingField(field)
    setEditValue(field === 'front' ? question : (answer ?? ''))
  }, [isOpen, question, answer])

  const cancelEdit = useCallback(() => {
    setEditingField(null)
    setEditValue('')
  }, [])

  const saveEdit = useCallback(() => {
    if (!editingField || !onSave) return
    const trimmed = editValue.trim()
    if (!trimmed) {
      cancelEdit()
      return
    }
    if (editingField === 'front') {
      onSave({ front: trimmed })
    } else {
      onSave({ back: trimmed })
    }
    setEditingField(null)
    setEditValue('')
  }, [editingField, editValue, onSave, cancelEdit])

  useEffect(() => {
    if (editingField && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editingField])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingField && e.key === 'Escape') {
        cancelEdit()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editingField, cancelEdit])

  const showReviewInfo = currentStep !== undefined && totalSteps !== undefined && totalSteps > 0
  const canInlineEdit = Boolean(onSave)

  return (
    <div
      className={cn(
        'bg-card',
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
        {editingField === 'front' ? (
          <div>
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full min-h-[60px] p-3 text-base text-foreground leading-relaxed border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
              rows={2}
            />
            <div className="flex justify-center gap-2 mt-3">
              <button
                type="button"
                onClick={saveEdit}
                className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 inline-flex items-center justify-center hover:bg-emerald-200 transition-colors"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="h-10 w-10 rounded-lg bg-rose-100 text-rose-500 inline-flex items-center justify-center hover:bg-rose-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <p
              className={cn(
                'text-base text-foreground leading-relaxed flex-1',
                canInlineEdit && 'cursor-text rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-muted/50 transition-colors'
              )}
              onClick={canInlineEdit ? () => startEdit('front') : undefined}
            >
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
        )}
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
                {editingField === 'back' ? (
                  <div>
                    <textarea
                      ref={textareaRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full min-h-[100px] p-3 text-base text-foreground leading-relaxed bg-amber-50 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                      rows={4}
                    />
                    <div className="flex justify-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 inline-flex items-center justify-center hover:bg-emerald-200 transition-colors"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="h-10 w-10 rounded-lg bg-rose-100 text-rose-500 inline-flex items-center justify-center hover:bg-rose-200 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'inline-block px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg',
                      canInlineEdit && 'cursor-text hover:border-amber-300 hover:bg-amber-100/50 transition-colors'
                    )}
                    onClick={canInlineEdit ? () => startEdit('back') : undefined}
                  >
                    <p className="text-base text-foreground leading-relaxed">
                      {answer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
})

export type { StudyCardProps }
