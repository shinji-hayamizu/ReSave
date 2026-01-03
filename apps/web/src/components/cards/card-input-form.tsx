'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { TagSelector } from '@/components/cards/tag-selector';
import { RepeatSelector } from '@/components/cards/repeat-selector';
import { cn } from '@/lib/utils';

const TEXT_MAX_LENGTH = 500;
const HIDDEN_TEXT_MAX_LENGTH = 2000;

const cardInputSchema = z.object({
  front: z
    .string()
    .min(1, 'テキストを入力してください')
    .max(TEXT_MAX_LENGTH, `${TEXT_MAX_LENGTH}文字以内で入力してください`),
  back: z
    .string()
    .max(HIDDEN_TEXT_MAX_LENGTH, `${HIDDEN_TEXT_MAX_LENGTH}文字以内で入力してください`)
    .default(''),
  tagIds: z.array(z.string()).max(10, 'タグは10個までです').default([]),
  sourceUrl: z.string().url('有効なURLを入力してください').or(z.literal('')).default(''),
  repeatMode: z.enum(['spaced', 'daily', 'weekly', 'none']).default('spaced'),
});

type CardInputFormValues = z.infer<typeof cardInputSchema>;

interface CardInputFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CardInputFormValues>;
  onSubmit: (data: CardInputFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

function CharacterCounter({
  current,
  max,
  className,
}: {
  current: number;
  max: number;
  className?: string;
}) {
  const isWarning = current >= max * 0.9 && current < max;
  const isDanger = current >= max;

  return (
    <span
      className={cn(
        'text-xs text-muted-foreground',
        isWarning && 'text-yellow-600',
        isDanger && 'text-destructive',
        className
      )}
    >
      {current} / {max}
    </span>
  );
}

export function CardInputForm({
  mode,
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: CardInputFormProps) {
  const form = useForm<CardInputFormValues>({
    resolver: zodResolver(cardInputSchema),
    defaultValues: {
      front: '',
      back: '',
      tagIds: [],
      sourceUrl: '',
      repeatMode: 'spaced',
      ...defaultValues,
    },
  });

  const frontValue = form.watch('front');
  const backValue = form.watch('back');
  const isSaveDisabled = !frontValue.trim() || isSubmitting;

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        front: '',
        back: '',
        tagIds: [],
        sourceUrl: '',
        repeatMode: 'spaced',
        ...defaultValues,
      });
    }
  }, [defaultValues, form]);

  async function handleSubmit(data: CardInputFormValues) {
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0">
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          {/* Required Section */}
          <div className="p-5 space-y-4">
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">
                      テキスト <span className="text-destructive">*</span>
                    </FormLabel>
                    <CharacterCounter
                      current={field.value?.length ?? 0}
                      max={TEXT_MAX_LENGTH}
                    />
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="覚えたいことを入力"
                      className="min-h-[80px] resize-none"
                      maxLength={TEXT_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium">隠しテキスト</FormLabel>
                    <CharacterCounter
                      current={field.value?.length ?? 0}
                      max={HIDDEN_TEXT_MAX_LENGTH}
                    />
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="答え（任意）"
                      className="min-h-[80px] resize-none"
                      maxLength={HIDDEN_TEXT_MAX_LENGTH}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col items-center gap-2 pt-2">
              <Button type="submit" disabled={isSaveDisabled} className="w-full sm:w-auto">
                {isSubmitting ? '保存中...' : '保存'}
              </Button>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                必須項目
              </p>
            </div>
          </div>

          {/* Optional Section */}
          <div className="p-5 space-y-4 border-t bg-muted/30">
            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">タグ</FormLabel>
                  <FormControl>
                    <TagSelector
                      selectedTagIds={field.value}
                      onChange={field.onChange}
                      maxTags={10}
                    />
                  </FormControl>
                  <FormDescription>タグは最大10個まで</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">ソース</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repeatMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">リピート</FormLabel>
                  <FormControl>
                    <RepeatSelector value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <a
                    href="#"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        '間隔反復（Spaced Repetition）とは:\n\n記憶の定着を最大化するため、復習間隔を徐々に延ばしていく学習法です。\n\nデフォルト間隔: 1日 -> 3日 -> 7日 -> 14日 -> 30日 -> 180日'
                      );
                    }}
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>間隔反復について</span>
                  </a>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-center pt-2">
              <Button type="submit" disabled={isSaveDisabled} className="w-full sm:w-auto">
                {isSubmitting ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

export { cardInputSchema };
export type { CardInputFormValues };
