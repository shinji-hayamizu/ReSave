import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CardTabs, type CardTabValue } from '../card-tabs';

describe('CardTabs', () => {
  it('未学習と復習中の2タブのみ表示される', () => {
    // Given: デフォルトのprops
    const onChange = vi.fn();

    // When: コンポーネントをレンダリング
    render(<CardTabs value="due" onChange={onChange} />);

    // Then: 2タブのみ表示される
    expect(screen.getByText('未学習')).toBeInTheDocument();
    expect(screen.getByText('復習中')).toBeInTheDocument();
    expect(screen.queryByText('完了')).not.toBeInTheDocument();
  });

  it('countsを渡すとカウントが表示される', () => {
    // Given: カウント付きのprops
    const onChange = vi.fn();
    const counts = { due: 5, learning: 3 };

    // When: コンポーネントをレンダリング
    render(<CardTabs value="due" counts={counts} onChange={onChange} />);

    // Then: カウントが表示される
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('1000以上のカウントがk表記で表示される', () => {
    // Given: 1000以上のカウント
    const onChange = vi.fn();
    const counts = { due: 1500, learning: 1000 };

    // When: コンポーネントをレンダリング
    render(<CardTabs value="due" counts={counts} onChange={onChange} />);

    // Then: k表記で表示される
    expect(screen.getByText('1.5k')).toBeInTheDocument();
    expect(screen.getByText('1k')).toBeInTheDocument();
  });

  it('タブクリックでonChangeが呼ばれる', async () => {
    // Given: dueタブがアクティブ
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<CardTabs value="due" onChange={onChange} />);

    // When: 復習中タブをクリック
    await user.click(screen.getByText('復習中'));

    // Then: onChangeがlearningで呼ばれる
    expect(onChange).toHaveBeenCalledWith('learning');
  });

  it('アクティブタブにスタイルが適用される', () => {
    // Given: learningタブがアクティブ
    const onChange = vi.fn();

    // When: コンポーネントをレンダリング
    render(<CardTabs value="learning" onChange={onChange} />);

    // Then: learningタブにアクティブスタイルが適用される
    const learningButton = screen.getByText('復習中').closest('button');
    expect(learningButton?.className).toContain('border-b-current');

    // Then: dueタブは非アクティブ
    const dueButton = screen.getByText('未学習').closest('button');
    expect(dueButton?.className).toContain('text-muted-foreground');
  });

  it('countsなしでもエラーにならない', () => {
    // Given: countsを渡さない
    const onChange = vi.fn();

    // When: コンポーネントをレンダリング
    render(<CardTabs value="due" onChange={onChange} />);

    // Then: タブラベルのみ表示される
    expect(screen.getByText('未学習')).toBeInTheDocument();
    expect(screen.getByText('復習中')).toBeInTheDocument();
  });
});
