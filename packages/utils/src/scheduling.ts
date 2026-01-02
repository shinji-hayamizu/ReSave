/**
 * 固定間隔スケジューリング
 *
 * review_level: 0 -> 1日後
 * review_level: 1 -> 3日後
 * review_level: 2 -> 7日後
 * review_level: 3 -> 14日後
 * review_level: 4 -> 30日後
 * review_level: 5 -> 180日後
 * review_level: 6 -> 完了（next_review_at = null）
 */

export const REVIEW_INTERVALS: Record<number, number> = {
  0: 1,
  1: 3,
  2: 7,
  3: 14,
  4: 30,
  5: 180,
}

export const MAX_REVIEW_LEVEL = 6

export function getReviewIntervalDays(reviewLevel: number): number | null {
  if (reviewLevel >= MAX_REVIEW_LEVEL) {
    return null
  }
  return REVIEW_INTERVALS[reviewLevel] ?? null
}

export function calculateNextReviewDate(
  currentDate: Date,
  reviewLevel: number
): Date | null {
  const intervalDays = getReviewIntervalDays(reviewLevel)

  if (intervalDays === null) {
    return null
  }

  const nextDate = new Date(currentDate)
  nextDate.setDate(nextDate.getDate() + intervalDays)
  return nextDate
}

export function isReviewDue(nextReviewAt: Date | string | null): boolean {
  if (nextReviewAt === null) {
    return false
  }

  const reviewDate = typeof nextReviewAt === 'string' ? new Date(nextReviewAt) : nextReviewAt
  const now = new Date()

  return reviewDate <= now
}
