'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

import { Button } from '@/components/ui/button';
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
    .max(HIDDEN_TEXT_MAX_LENGTH, `${HIDDEN_TEXT_MAX_LENGTH}文字以内で入力してください`),
  tagIds: z.array(z.string()).max(10, 'タグは10個までです'),
  sourceUrl: z.string().url('有効なURLを入力してください').or(z.literal('')),
});

type CardInputFormValues = z.infer<typeof cardInputSchema>;

const defaultFormValues: CardInputFormValues = {
  front: '',
  back: '',
  tagIds: [],
  sourceUrl: '',
};

interface CardInputFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CardInputFormValues>;
  onSubmit: (data: CardInputFormValues) => Promise<void>;
  isSubmitting?: boolean;
  formId?: string;
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
        'text-xs tabular-nums transition-colors',
        !isWarning && !isDanger && 'text-muted-foreground',
        isWarning && 'text-amber-500',
        isDanger && 'text-destructive font-medium',
        className
      )}
    >
      {current} / {max}
    </span>
  );
}

export function CardInputForm({
  mode: _mode,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  formId,
}: CardInputFormProps) {
  const form = useForm<CardInputFormValues>({
    resolver: zodResolver(cardInputSchema),
    defaultValues: {
      ...defaultFormValues,
      ...defaultValues,
    },
  });

  const frontValue = form.watch('front');
  const isSaveDisabled = !frontValue.trim() || isSubmitting;

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        ...defaultFormValues,
        ...defaultValues,
      });
    }
  }, [defaultValues, form]);

  async function handleSubmit(data: CardInputFormValues) {
    await onSubmit(data);
  }

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Main Card */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Required Fields */}
          <div className="p-5 space-y-5">
            {/* Text Field (Required) */}
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-sm font-medium">
                      テキスト <span className="text-destructive">*</span>
                    </FormLabel>
                    <CharacterCounter
                      current={field.value?.length ?? 0}
                      max={TEXT_MAX_LENGTH}
                    />
                  </div>
                  <FormControl>
                    <TextareaAutosize
                      placeholder="覚えたいことを入力してください"
                      minRows={4}
                      maxLength={TEXT_MAX_LENGTH}
                      className={cn(
                        'flex w-full rounded-lg border border-input bg-background px-3.5 py-3',
                        'text-base leading-relaxed placeholder:text-muted-foreground',
                        'transition-all duration-150',
                        'hover:border-muted-foreground/50',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'resize-none'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="flex items-center gap-1.5 mt-2 text-[13px]" />
                </FormItem>
              )}
            />

            {/* Hidden Text Field (Optional but in main area) */}
            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="text-sm font-medium">
                      隠しテキスト（答え）
                    </FormLabel>
                    <CharacterCounter
                      current={field.value?.length ?? 0}
                      max={HIDDEN_TEXT_MAX_LENGTH}
                    />
                  </div>
                  <FormControl>
                    <TextareaAutosize
                      placeholder="タップで表示される答えを入力（任意）"
                      minRows={3}
                      maxLength={HIDDEN_TEXT_MAX_LENGTH}
                      className={cn(
                        'flex w-full rounded-lg border border-input bg-background px-3.5 py-3',
                        'text-base leading-relaxed placeholder:text-muted-foreground',
                        'transition-all duration-150',
                        'hover:border-muted-foreground/50',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'resize-none'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium mb-2 block">タグ</FormLabel>
                  <FormControl>
                    <TagSelector
                      selectedTagIds={field.value}
                      onChange={field.onChange}
                      maxTags={10}
                    />
                  </FormControl>
                  <FormDescription className="text-[13px] mt-2">
                    タグは最大10個まで設定できます
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Source URL */}
          <div className="px-5 pb-5">
            <FormField
              control={form.control}
              name="sourceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium mb-2 block">
                    ソースURL
                  </FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        className="h-11 pr-10"
                        {...field}
                      />
                      {field.value && (
                        <button
                          type="button"
                          className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => field.onChange('')}
                          title="クリア"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription className="text-[13px] mt-2">
                    参照元のURLを記録できます
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit Button - Desktop only, mobile uses sticky footer in parent */}
        <div className="hidden sm:flex justify-end">
          <Button
            type="submit"
            disabled={isSaveDisabled}
            className="min-w-[120px] h-11"
          >
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export { cardInputSchema };
export type { CardInputFormValues };
