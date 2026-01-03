/**
 * Assessment values for card review
 * - 'ok': Review level +1, schedule next review
 * - 'remembered': Mark as completed (next_review_at = null)
 * - 'again': Reset review level to 0
 */
export type Assessment = 'ok' | 'remembered' | 'again';

/**
 * Base study log entity representing a single card review record
 */
export type StudyLog = {
  id: string;
  userId: string;
  cardId: string;
  assessment: Assessment;
  studiedAt: string;
};

/**
 * Input for submitting card assessment
 */
export type SubmitAssessmentInput = {
  cardId: string;
  assessment: Assessment;
};

/**
 * Statistics for user study progress
 */
export type StudyStats = {
  totalCards: number;
  dueToday: number;
  completedToday: number;
  streak: number;
};

/**
 * Response type for today's study cards endpoint
 */
export type TodayStudyResponse = {
  cards: {
    id: string;
    front: string;
    back: string;
    deckId: string;
    deckName: string;
    reviewLevel: number;
  }[];
  stats: StudyStats;
};
