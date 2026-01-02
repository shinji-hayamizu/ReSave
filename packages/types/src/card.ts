export interface Card {
  id: string
  userId: string
  front: string
  back: string
  reviewLevel: number
  nextReviewAt: string | null
  createdAt: string
  updatedAt: string
  tags?: Tag[]
}

export interface CreateCardInput {
  front: string
  back: string
  tagIds?: string[]
}

export interface UpdateCardInput {
  front?: string
  back?: string
  tagIds?: string[]
}

import type { Tag } from './tag'
