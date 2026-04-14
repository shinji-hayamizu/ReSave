import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { TagFilterBar } from './tag-filter-bar';
import type { Tag } from '@/types/tag';

function createTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 'tag-1',
    userId: 'user-1',
    name: 'AWS',
    color: 'blue',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const baseTags: Tag[] = [
  createTag({ id: 'tag-1', name: 'AWS', color: 'blue' }),
  createTag({ id: 'tag-2', name: 'React', color: 'green' }),
  createTag({ id: 'tag-3', name: 'DB', color: 'purple' }),
];

describe('TagFilterBar', () => {
  it('タグが0件の場合に何もレンダリングしない', () => {
    // Given: タグが空配列
    const onTagSelect = vi.fn();

    // When: コンポーネントをレンダリング
    const { container } = render(
      <TagFilterBar tags={[]} selectedTagId={null} onTagSelect={onTagSelect} />
    );

    // Then: 何も表示されない
    expect(container.firstChild).toBeNull();
  });

  it('すべてチップと各タグチップを表示する', () => {
    // Given: 3つのタグがある
    const onTagSelect = vi.fn();

    // When: コンポーネントをレンダリング
    render(
      <TagFilterBar tags={baseTags} selectedTagId={null} onTagSelect={onTagSelect} />
    );

    // Then: 「すべて」と各タグ名が表示される
    expect(screen.getByText('すべて')).toBeInTheDocument();
    expect(screen.getByText('AWS')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('DB')).toBeInTheDocument();
  });

  it('タグ未選択時にすべてチップがアクティブスタイルを持つ', () => {
    // Given: タグが未選択（selectedTagId=null）
    const onTagSelect = vi.fn();

    // When: コンポーネントをレンダリング
    render(
      <TagFilterBar tags={baseTags} selectedTagId={null} onTagSelect={onTagSelect} />
    );

    // Then: 「すべて」ボタンがforegroundスタイルを持つ
    const allButton = screen.getByText('すべて');
    expect(allButton).toHaveClass('bg-foreground');
  });

  it('タグ選択時に該当チップがアクティブスタイルを持つ', () => {
    // Given: tag-1が選択されている
    const onTagSelect = vi.fn();

    // When: コンポーネントをレンダリング
    render(
      <TagFilterBar tags={baseTags} selectedTagId="tag-1" onTagSelect={onTagSelect} />
    );

    // Then: 「すべて」はアクティブでなく、AWSチップがアクティブスタイル
    const allButton = screen.getByText('すべて');
    expect(allButton).not.toHaveClass('bg-foreground');
    const awsButton = screen.getByText('AWS');
    expect(awsButton.closest('button')).toHaveClass('ring-1');
  });

  it('タグチップクリックでonTagSelectがタグIDで呼ばれる', async () => {
    // Given: タグ未選択状態
    const user = userEvent.setup();
    const onTagSelect = vi.fn();
    render(
      <TagFilterBar tags={baseTags} selectedTagId={null} onTagSelect={onTagSelect} />
    );

    // When: AWSチップをクリック
    await user.click(screen.getByText('AWS'));

    // Then: onTagSelectがtag-1で呼ばれる
    expect(onTagSelect).toHaveBeenCalledWith('tag-1');
  });

  it('選択中のタグチップをクリックするとnullで解除される', async () => {
    // Given: tag-1が選択されている
    const user = userEvent.setup();
    const onTagSelect = vi.fn();
    render(
      <TagFilterBar tags={baseTags} selectedTagId="tag-1" onTagSelect={onTagSelect} />
    );

    // When: 選択中のAWSチップをクリック
    await user.click(screen.getByText('AWS'));

    // Then: onTagSelectがnullで呼ばれる（解除）
    expect(onTagSelect).toHaveBeenCalledWith(null);
  });

  it('すべてチップクリックでonTagSelectがnullで呼ばれる', async () => {
    // Given: tag-1が選択されている
    const user = userEvent.setup();
    const onTagSelect = vi.fn();
    render(
      <TagFilterBar tags={baseTags} selectedTagId="tag-1" onTagSelect={onTagSelect} />
    );

    // When: 「すべて」チップをクリック
    await user.click(screen.getByText('すべて'));

    // Then: onTagSelectがnullで呼ばれる
    expect(onTagSelect).toHaveBeenCalledWith(null);
  });

  it.each([
    { color: 'blue', expectedBg: 'bg-blue-100' },
    { color: 'green', expectedBg: 'bg-emerald-100' },
    { color: 'purple', expectedBg: 'bg-violet-100' },
    { color: 'orange', expectedBg: 'bg-orange-100' },
  ])('$colorタグ選択時に$expectedBgスタイルが適用される', ({ color, expectedBg }) => {
    // Given: 指定色のタグが選択されている
    const tag = createTag({ id: 'tag-color', color, name: `${color}-tag` });
    const onTagSelect = vi.fn();

    // When: コンポーネントをレンダリング
    render(
      <TagFilterBar tags={[tag]} selectedTagId="tag-color" onTagSelect={onTagSelect} />
    );

    // Then: 選択中チップに対応する背景色クラスが適用される
    const button = screen.getByText(`${color}-tag`).closest('button');
    expect(button).toHaveClass(expectedBg);
  });

  it('未知のカラーの場合にblueのフォールバックが適用される', () => {
    // Given: 未知のカラーを持つタグが選択されている
    const tag = createTag({ id: 'tag-unknown', color: 'unknown', name: 'unknown-tag' });
    const onTagSelect = vi.fn();

    // When: コンポーネントをレンダリング
    render(
      <TagFilterBar tags={[tag]} selectedTagId="tag-unknown" onTagSelect={onTagSelect} />
    );

    // Then: blueのフォールバックスタイルが適用される
    const button = screen.getByText('unknown-tag').closest('button');
    expect(button).toHaveClass('bg-blue-100');
  });
});
