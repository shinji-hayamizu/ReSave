'use client';

import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEFAULT_DAILY_NEW_CARDS = 20;

export function LearningSettings() {
  const [dailyNewCards, setDailyNewCards] = useState(DEFAULT_DAILY_NEW_CARDS);

  function handleDailyNewCardsChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(event.target.value);
    if (value >= 1 && value <= 100) {
      setDailyNewCards(value);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>学習設定</CardTitle>
        <CardDescription>毎日の学習に関する設定</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="daily-new-cards">1日の新規カード上限</Label>
          <Input
            id="daily-new-cards"
            type="number"
            min={1}
            max={100}
            value={dailyNewCards}
            onChange={handleDailyNewCardsChange}
            className="w-32"
          />
          <p className="text-sm text-muted-foreground">
            1日に学習する新規カードの最大枚数（1〜100枚）
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
