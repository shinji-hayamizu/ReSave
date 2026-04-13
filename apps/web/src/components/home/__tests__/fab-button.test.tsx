import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { FabButton } from '@/components/home/fab-button';

describe('FabButton', () => {
  it('ボタンが表示される', () => {
    // Given: FABボタンコンポーネント
    const handleClick = vi.fn();

    // When: レンダリング
    render(<FabButton isOpen={false} onClick={handleClick} />);

    // Then: ボタンが表示される
    expect(screen.getByRole('button', { name: '新規カード作成' })).toBeInTheDocument();
  });

  it('クリックするとonClickが呼ばれる', () => {
    // Given: クリックハンドラ付きのFABボタン
    const handleClick = vi.fn();
    render(<FabButton isOpen={false} onClick={handleClick} />);

    // When: ボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: '新規カード作成' }));

    // Then: onClickが1回呼ばれる
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('isOpen=trueのとき回転クラスが適用される', () => {
    // Given: isOpen=trueのFABボタン
    const handleClick = vi.fn();
    render(<FabButton isOpen={true} onClick={handleClick} />);

    // When: ボタンを取得
    const button = screen.getByRole('button', { name: '新規カード作成' });

    // Then: rotate-45クラスが適用される
    expect(button.className).toContain('rotate-45');
  });

  it('isOpen=falseのとき回転クラスが適用されない', () => {
    // Given: isOpen=falseのFABボタン
    const handleClick = vi.fn();
    render(<FabButton isOpen={false} onClick={handleClick} />);

    // When: ボタンを取得
    const button = screen.getByRole('button', { name: '新規カード作成' });

    // Then: rotate-45クラスが適用されない
    expect(button.className).not.toContain('rotate-45');
  });
});
