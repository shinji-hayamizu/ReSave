import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from '@/components/ui/password-input';

describe('PasswordInput', () => {
  it('初期状態ではパスワードが隠れている', () => {
    // Given: PasswordInput

    // When: レンダリング
    render(<PasswordInput data-testid="password-input" />);

    // Then: type="password"
    expect(screen.getByTestId('password-input')).toHaveAttribute(
      'type',
      'password'
    );
  });

  it('トグルボタンをクリックするとパスワードが表示される', async () => {
    // Given: PasswordInput
    const user = userEvent.setup();

    // When: トグルボタンをクリック
    render(<PasswordInput data-testid="password-input" />);
    await user.click(screen.getByRole('button'));

    // Then: type="text"に変わる
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'text');
  });

  it('再度トグルボタンをクリックするとパスワードが隠れる', async () => {
    // Given: パスワードが表示されている状態
    const user = userEvent.setup();
    render(<PasswordInput data-testid="password-input" />);
    await user.click(screen.getByRole('button'));

    // When: 再度トグルボタンをクリック
    await user.click(screen.getByRole('button'));

    // Then: type="password"に戻る
    expect(screen.getByTestId('password-input')).toHaveAttribute(
      'type',
      'password'
    );
  });

  it('showToggle=falseの場合にトグルボタンが表示されない', () => {
    // Given: showToggle=false

    // When: レンダリング
    render(<PasswordInput showToggle={false} />);

    // Then: トグルボタンが存在しない
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('値を入力できる', async () => {
    // Given: PasswordInput
    const user = userEvent.setup();

    // When: 値を入力
    render(<PasswordInput data-testid="password-input" />);
    await user.type(screen.getByTestId('password-input'), 'password123');

    // Then: 値が入力される
    expect(screen.getByTestId('password-input')).toHaveValue('password123');
  });

  it('onChangeイベントを発火する', () => {
    // Given: onChangeハンドラ
    const handleChange = vi.fn();

    // When: 値を変更
    render(
      <PasswordInput data-testid="password-input" onChange={handleChange} />
    );
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'test' },
    });

    // Then: onChangeが呼ばれる
    expect(handleChange).toHaveBeenCalled();
  });

  it('disabledの場合に入力できない', () => {
    // Given: disabled

    // When: レンダリング
    render(<PasswordInput data-testid="password-input" disabled />);

    // Then: disabled属性が設定される
    expect(screen.getByTestId('password-input')).toBeDisabled();
  });

  it('カスタムクラスが適用される', () => {
    // Given: カスタムクラス

    // When: レンダリング
    render(
      <PasswordInput data-testid="password-input" className="custom-class" />
    );

    // Then: カスタムクラスが適用される
    expect(screen.getByTestId('password-input')).toHaveClass('custom-class');
  });

  it('placeholderを表示する', () => {
    // Given: placeholder

    // When: レンダリング
    render(
      <PasswordInput
        data-testid="password-input"
        placeholder="パスワードを入力"
      />
    );

    // Then: placeholderが表示される
    expect(screen.getByTestId('password-input')).toHaveAttribute(
      'placeholder',
      'パスワードを入力'
    );
  });

  it('アクセシビリティ用のテキストが表示される（非表示状態）', () => {
    // Given: パスワードが隠れている状態

    // When: レンダリング
    render(<PasswordInput />);

    // Then: 「パスワードを表示」というテキストがある
    expect(screen.getByText('パスワードを表示')).toBeInTheDocument();
  });

  it('アクセシビリティ用のテキストが表示される（表示状態）', async () => {
    // Given: パスワードが表示されている状態
    const user = userEvent.setup();
    render(<PasswordInput />);
    await user.click(screen.getByRole('button'));

    // Then: 「パスワードを隠す」というテキストがある
    expect(screen.getByText('パスワードを隠す')).toBeInTheDocument();
  });

  it('トグルボタンがtype="button"を持つ', () => {
    // Given: PasswordInput

    // When: レンダリング
    render(<PasswordInput />);

    // Then: トグルボタンがtype="button"を持つ（フォーム送信を防ぐ）
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('nameを指定できる', () => {
    // Given: name

    // When: レンダリング
    render(<PasswordInput data-testid="password-input" name="password" />);

    // Then: name属性が設定される
    expect(screen.getByTestId('password-input')).toHaveAttribute(
      'name',
      'password'
    );
  });
});
