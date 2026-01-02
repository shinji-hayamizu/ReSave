export type Assessment = 'ok' | 'remembered' | 'again'

export interface StudyLog {
  id: string
  userId: string
  cardId: string
  assessment: Assessment
  studiedAt: string
}

export interface CreateStudyLogInput {
  cardId: string
  assessment: Assessment
}
