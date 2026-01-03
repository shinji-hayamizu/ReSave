import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('入力フィールドをレンダリングする', () => {
    // Given: Input

    // When: レンダリング
    render(<Input />);

    // Then: 入力フィールドが表示される
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('typeを指定できる', () => {
    // Given: type="email"

    // When: レンダリング
    render(<Input type="email" />);

    // Then: type属性が設定される
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('passwordタイプを指定できる', () => {
    // Given: type="password"

    // When: レンダリング
    render(<Input type="password" data-testid="password-input" />);

    // Then: type属性が設定される
    expect(screen.getByTestId('password-input')).toHaveAttribute(
      'type',
      'password'
    );
  });

  it('placeholderを表示する', () => {
    // Given: placeholder

    // When: レンダリング
    render(<Input placeholder="メールアドレスを入力" />);

    // Then: placeholderが表示される
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      'メールアドレスを入力'
    );
  });

  it('値を入力できる', async () => {
    // Given: Input
    const user = userEvent.setup();

    // When: 値を入力
    render(<Input />);
    await user.type(screen.getByRole('textbox'), 'test@example.com');

    // Then: 値が入力される
    expect(screen.getByRole('textbox')).toHaveValue('test@example.com');
  });

  it('onChangeイベントを発火する', () => {
    // Given: onChangeハンドラ
    const handleChange = vi.fn();

    // When: 値を変更
    render(<Input onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'test' },
    });

    // Then: onChangeが呼ばれる
    expect(handleChange).toHaveBeenCalled();
  });

  it('disabledの場合に入力できない', () => {
    // Given: disabled

    // When: レンダリング
    render(<Input disabled />);

    // Then: disabled属性が設定される
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('readOnlyの場合に編集できない', () => {
    // Given: readOnly

    // When: レンダリング
    render(<Input readOnly value="読み取り専用" />);

    // Then: readOnly属性が設定される
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('カスタムクラスが適用される', () => {
    // Given: カスタムクラス

    // When: レンダリング
    render(<Input className="custom-class" />);

    // Then: カスタムクラスが適用される
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('デフォルトのスタイルが適用される', () => {
    // Given: Input

    // When: レンダリング
    render(<Input />);

    // Then: デフォルトスタイルが適用される
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('rounded-md');
    expect(input).toHaveClass('border');
  });

  it('refが転送される', () => {
    // Given: ref
    const ref = { current: null } as React.RefObject<HTMLInputElement>;

    // When: レンダリング
    render(<Input ref={ref} />);

    // Then: refが設定される
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('nameを指定できる', () => {
    // Given: name

    // When: レンダリング
    render(<Input name="email" />);

    // Then: name属性が設定される
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
  });

  it('valueを制御できる', () => {
    // Given: 制御されたvalue

    // When: レンダリング
    render(<Input value="controlled value" onChange={() => {}} />);

    // Then: 値が設定される
    expect(screen.getByRole('textbox')).toHaveValue('controlled value');
  });

  it('defaultValueを設定できる', () => {
    // Given: defaultValue

    // When: レンダリング
    render(<Input defaultValue="default value" />);

    // Then: 初期値が設定される
    expect(screen.getByRole('textbox')).toHaveValue('default value');
  });

  it('onBlurイベントを発火する', () => {
    // Given: onBlurハンドラ
    const handleBlur = vi.fn();

    // When: フォーカスを外す
    render(<Input onBlur={handleBlur} />);
    fireEvent.blur(screen.getByRole('textbox'));

    // Then: onBlurが呼ばれる
    expect(handleBlur).toHaveBeenCalled();
  });

  it('onFocusイベントを発火する', () => {
    // Given: onFocusハンドラ
    const handleFocus = vi.fn();

    // When: フォーカスする
    render(<Input onFocus={handleFocus} />);
    fireEvent.focus(screen.getByRole('textbox'));

    // Then: onFocusが呼ばれる
    expect(handleFocus).toHaveBeenCalled();
  });

  it('aria属性を指定できる', () => {
    // Given: aria属性

    // When: レンダリング
    render(<Input aria-label="メールアドレス" aria-describedby="email-help" />);

    // Then: aria属性が設定される
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-label',
      'メールアドレス'
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'email-help'
    );
  });
});
