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
        <CardTitle>Learning Settings</CardTitle>
        <CardDescription>Configure your daily learning preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="daily-new-cards">Daily New Cards Limit</Label>
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
            Maximum number of new cards to learn per day (1-100)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
