export const homeCardKeys = {
  all: ['cards', 'home'] as const,
  tab: (tab: 'due' | 'learning' | 'completed') => [...homeCardKeys.all, tab] as const,
  dueCount: () => [...homeCardKeys.all, 'due-count'] as const,
};
