import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadMoreIndicator } from '../load-more-indicator';

describe('LoadMoreIndicator', () => {
  it('isFetchingNextPage=true: ローディングアニメーションを表示する', () => {
    render(
      <LoadMoreIndicator
        isFetchingNextPage={true}
        hasNextPage={true}
        totalCount={20}
      />
    );

    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument();
  });

  it('isFetchingNextPage=true: 3つのドットを表示する', () => {
    const { container } = render(
      <LoadMoreIndicator
        isFetchingNextPage={true}
        hasNextPage={true}
        totalCount={20}
      />
    );

    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  it('全件読み込み完了: チェックマークとカード件数を表示する', () => {
    render(
      <LoadMoreIndicator
        isFetchingNextPage={false}
        hasNextPage={false}
        totalCount={15}
      />
    );

    expect(screen.getByText('全15件のカードを表示中')).toBeInTheDocument();
  });

  it('hasNextPage=true & isFetchingNextPage=false: 何も表示しない', () => {
    const { container } = render(
      <LoadMoreIndicator
        isFetchingNextPage={false}
        hasNextPage={true}
        totalCount={20}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('totalCount=0: 何も表示しない', () => {
    const { container } = render(
      <LoadMoreIndicator
        isFetchingNextPage={false}
        hasNextPage={false}
        totalCount={0}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('ドットにアニメーション遅延が設定されている', () => {
    const { container } = render(
      <LoadMoreIndicator
        isFetchingNextPage={true}
        hasNextPage={true}
        totalCount={20}
      />
    );

    const dots = container.querySelectorAll('.animate-bounce');
    expect((dots[0] as HTMLElement).style.animationDelay).toBe('0s');
    expect((dots[1] as HTMLElement).style.animationDelay).toBe('0.15s');
    expect((dots[2] as HTMLElement).style.animationDelay).toBe('0.3s');
  });
});
