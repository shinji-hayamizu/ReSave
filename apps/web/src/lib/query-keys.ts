export const homeCardKeys = {
  all: ['cards', 'home'] as const,
  tab: (tab: 'due' | 'learning') => [...homeCardKeys.all, tab] as const,
};
