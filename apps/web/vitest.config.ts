import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    testTimeout: 30000,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['__tests__/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/types/**',
        'src/app/**',
        'src/components/ui/**',
        'src/components/providers.tsx',
        'src/components/layout/**',
        'src/components/settings/**',
        'src/components/home/**',
        'src/components/cards/**',
        'src/components/tags/**',
        'src/components/stats/**',
        'src/actions/**',
        'src/lib/supabase/**',
        'src/hooks/use-mobile.tsx',
        'src/hooks/useCards.ts',
        'src/hooks/useStats.ts',
        'src/hooks/useStudy.ts',
        'src/hooks/useTags.ts',
        'src/validations/index.ts',
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});




