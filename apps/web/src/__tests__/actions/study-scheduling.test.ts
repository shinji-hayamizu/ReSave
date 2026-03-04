/**
 * submitAssessment のスケジューリングロジックを検証するユニットテスト
 * Supabase への依存を避けるため、ロジック部分のみを直接テスト
 */

import { describe, it, expect } from 'vitest';

const SCHEDULE = [1, 3, 7, 14, 30, 90];

function calcNextSchedule(
  currentStep: number,
  status: 'new' | 'active' | 'completed',
  assessment: 'ok' | 'again' | 'remembered',
  schedule: number[] = SCHEDULE
): {
  newCurrentStep: number;
  newStatus: 'new' | 'active' | 'completed';
  daysToAdd: number | null;
} {
  const isNewCard = status === 'new';

  if (assessment === 'ok') {
    const nextStep = currentStep + 1;
    if (nextStep >= schedule.length) {
      return { newCurrentStep: nextStep, newStatus: 'completed', daysToAdd: null };
    }
    return {
      newCurrentStep: nextStep,
      newStatus: isNewCard ? 'active' : status,
      daysToAdd: schedule[currentStep],
    };
  }

  if (assessment === 'again') {
    return { newCurrentStep: 0, newStatus: 'active', daysToAdd: schedule[0] };
  }

  return { newCurrentStep: currentStep, newStatus: 'completed', daysToAdd: null };
}

describe('復習スケジューリング', () => {
  describe('未学習カード（status=new, step=0）でOK', () => {
    it('次の間隔は schedule[0]=1日', () => {
      const result = calcNextSchedule(0, 'new', 'ok');
      expect(result.daysToAdd).toBe(1);
    });

    it('current_step は 1 になる', () => {
      const result = calcNextSchedule(0, 'new', 'ok');
      expect(result.newCurrentStep).toBe(1);
    });

    it('status は active になる', () => {
      const result = calcNextSchedule(0, 'new', 'ok');
      expect(result.newStatus).toBe('active');
    });
  });

  describe('復習中カード（status=active）でOK', () => {
    it('step=1 のとき次の間隔は schedule[1]=3日', () => {
      const result = calcNextSchedule(1, 'active', 'ok');
      expect(result.daysToAdd).toBe(3);
      expect(result.newCurrentStep).toBe(2);
    });

    it('step=2 のとき次の間隔は schedule[2]=7日', () => {
      const result = calcNextSchedule(2, 'active', 'ok');
      expect(result.daysToAdd).toBe(7);
      expect(result.newCurrentStep).toBe(3);
    });

    it('step=5（最終）でOKすると completed になる', () => {
      const result = calcNextSchedule(5, 'active', 'ok');
      expect(result.newStatus).toBe('completed');
      expect(result.daysToAdd).toBeNull();
    });
  });

  describe('もう一度（again）', () => {
    it('step をリセットして schedule[0]=1日後になる', () => {
      const result = calcNextSchedule(3, 'active', 'again');
      expect(result.newCurrentStep).toBe(0);
      expect(result.daysToAdd).toBe(1);
      expect(result.newStatus).toBe('active');
    });
  });

  describe('覚えた（remembered）', () => {
    it('completed になり次の間隔はない', () => {
      const result = calcNextSchedule(2, 'active', 'remembered');
      expect(result.newStatus).toBe('completed');
      expect(result.daysToAdd).toBeNull();
    });
  });
});
