export const homeCardKeys = {
  all: ['cards', 'home'] as const,
  tab: (tab: 'due' | 'learning' | 'completed') => [...homeCardKeys.all, tab] as const,
};
