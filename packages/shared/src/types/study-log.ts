export type Assessment = 'ok' | 'remembered' | 'again';

export type StudyLog = {
  id: string;
  userId: string;
  cardId: string;
  assessment: Assessment;
  studiedAt: string;
};

export type SubmitAssessmentInput = {
  cardId: string;
  assessment: Assessment;
};

export type StudyStats = {
  totalCards: number;
  dueToday: number;
  completedToday: number;
  streak: number;
};

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
