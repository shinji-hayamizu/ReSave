export type {
  Card,
  CardWithTags,
  CardListResponse,
  CreateCardInput,
  UpdateCardInput,
  CardStatus,
  CardFilters,
  HomeCardsData,
} from '@resave/shared/types';

export type HomeCardsPage = {
  cards: import('@resave/shared/types').CardWithTags[];
  todayStudiedCardIds: string[];
  fetchedAt: string;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type CompletedCardsPage = {
  cards: import('@resave/shared/types').CardWithTags[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};
