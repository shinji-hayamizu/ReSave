'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Check, Eye, EyeOff, ExternalLink, Link, Pencil, SquarePen, Trash2, X } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface StudyCardProps {
  question: string
  answer?: string
  tags?: React.ReactNode
  ratingButtons?: React.ReactNode
  currentStep?: number
  totalSteps?: number
  sourceUrl?: string | null
  isSaving?: boolean
  onEdit?: () => void
  onDelete?: () => void
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
  sourceUrl,
  isSaving = false,
  onEdit,
  onDelete,
  onSave,
  defaultOpen = false,
  className,
}: StudyCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [editingField, setEditingField] = useState<'front' | 'back' | null>(null)
  const [frontValue, setFrontValue] = useState('')
  const [backValue, setBackValue] = useState('')
  const [isWritingAnswer, setIsWritingAnswer] = useState(false)
  const [writeAnswerValue, setWriteAnswerValue] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)
  const frontTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const backTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const writeAnswerRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [])

  const handleToggle = () => {
    const willOpen = !isOpen
    setIsOpen(willOpen)

    if (willOpen) {
      scrollTimerRef.current = setTimeout(() => {
        if (cardRef.current) {
          const rect = cardRef.current.getBoundingClientRect()
          const scrollTop = window.scrollY + rect.top - 60
          window.scrollTo({ top: scrollTop, behavior: 'smooth' })
        }
      }, 100)
    } else {
      if (editingField === 'back') {
        setEditingField(null)
        setBackValue('')
      }
    }
  }

  const startEdit = useCallback((field: 'front' | 'back') => {
    if (isSaving) return
    if (field === 'back' && !isOpen) return
    setEditingField(field)
    if (field === 'front') {
      setFrontValue(question)
    } else {
      setBackValue(answer ?? '')
    }
  }, [isSaving, isOpen, question, answer])

  const cancelEdit = useCallback(() => {
    setEditingField(null)
    setFrontValue('')
    setBackValue('')
  }, [])

  const startWriteAnswer = useCallback(() => {
    if (isSaving) return
    setIsWritingAnswer(true)
    setWriteAnswerValue('')
  }, [isSaving])

  const cancelWriteAnswer = useCallback(() => {
    setIsWritingAnswer(false)
    setWriteAnswerValue('')
  }, [])

  const saveWriteAnswer = useCallback(() => {
    if (!onSave) return
    const trimmed = writeAnswerValue.trim()
    if (!trimmed) {
      cancelWriteAnswer()
      return
    }
    onSave({ back: trimmed })
    setIsWritingAnswer(false)
    setWriteAnswerValue('')
  }, [writeAnswerValue, onSave, cancelWriteAnswer])

  const saveEdit = useCallback(() => {
    if (!editingField || !onSave) return
    const value = editingField === 'front' ? frontValue : backValue
    const trimmed = value.trim()
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
    setFrontValue('')
    setBackValue('')
  }, [editingField, frontValue, backValue, onSave, cancelEdit])

  useEffect(() => {
    if (editingField === 'front' && frontTextareaRef.current) {
      frontTextareaRef.current.focus()
      frontTextareaRef.current.select()
    } else if (editingField === 'back' && backTextareaRef.current) {
      backTextareaRef.current.focus()
      backTextareaRef.current.select()
    }
  }, [editingField])

  useEffect(() => {
    if (isWritingAnswer && writeAnswerRef.current) {
      writeAnswerRef.current.focus()
    }
  }, [isWritingAnswer])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingField) {
          cancelEdit()
        }
        if (isWritingAnswer) {
          cancelWriteAnswer()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editingField, cancelEdit, isWritingAnswer, cancelWriteAnswer])

  const showReviewInfo = currentStep !== undefined && totalSteps !== undefined && totalSteps > 0
  const canInlineEdit = Boolean(onSave) && !isSaving

  return (
    <div
      ref={cardRef}
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
          <div className="flex gap-3 items-start">
            <TextareaAutosize
              ref={frontTextareaRef}
              value={frontValue}
              onChange={(e) => setFrontValue(e.target.value)}
              minRows={2}
              className="flex-1 p-3 text-base text-foreground leading-relaxed border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={isSaving}
                className="h-10 w-10 rounded-lg bg-success/10 text-success inline-flex items-center justify-center hover:bg-success/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isSaving}
                className="h-10 w-10 rounded-lg bg-destructive/10 text-destructive inline-flex items-center justify-center hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            {(onEdit || onDelete) && (
              <div className="flex gap-1 flex-shrink-0">
                {onEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={onEdit}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">編集</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">削除</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {answer ? (
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
              'grid transition-[grid-template-rows] duration-200 ease-out',
              isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            )}
          >
            <div className="overflow-hidden">
              <div className="px-5 py-4 bg-card">
                {editingField === 'back' ? (
                  <div className="flex gap-3 items-start">
                    <TextareaAutosize
                      ref={backTextareaRef}
                      value={backValue}
                      onChange={(e) => setBackValue(e.target.value)}
                      minRows={3}
                      className="flex-1 p-3 text-base text-foreground leading-relaxed bg-amber-50 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={isSaving}
                        className="h-10 w-10 rounded-lg bg-success/10 text-success inline-flex items-center justify-center hover:bg-success/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isSaving}
                        className="h-10 w-10 rounded-lg bg-destructive/10 text-destructive inline-flex items-center justify-center hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                      {answer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : canInlineEdit && (
        <div className="px-5 py-3 bg-card">
          {isWritingAnswer ? (
            <div className="flex gap-3 items-start">
              <TextareaAutosize
                ref={writeAnswerRef}
                value={writeAnswerValue}
                onChange={(e) => setWriteAnswerValue(e.target.value)}
                minRows={3}
                className="flex-1 p-3 text-base text-foreground leading-relaxed bg-amber-50 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="答えを入力..."
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={saveWriteAnswer}
                  disabled={isSaving}
                  className="h-10 w-10 rounded-lg bg-success/10 text-success inline-flex items-center justify-center hover:bg-success/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={cancelWriteAnswer}
                  disabled={isSaving}
                  className="h-10 w-10 rounded-lg bg-destructive/10 text-destructive inline-flex items-center justify-center hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 hover:border-primary hover:bg-primary/5 transition-colors cursor-text text-left"
              onClick={startWriteAnswer}
            >
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <SquarePen className="h-4 w-4" />
                答えを入力...
              </span>
            </button>
          )}
        </div>
      )}

      {sourceUrl && (() => {
        let hostname = sourceUrl
        try { hostname = new URL(sourceUrl).hostname } catch {}
        return (
          <div className="px-4 pb-3 bg-card">
            <div className="border-t border-border pt-2">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Link className="h-3 w-3 flex-shrink-0" />
                <span>{hostname}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </div>
          </div>
        )
      })()}
    </div>
  )
})

export type { StudyCardProps }
