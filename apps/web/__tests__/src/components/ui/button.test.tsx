import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('テキストを表示する', () => {
    // Given: テキストを持つボタン
    const buttonText = 'クリック';

    // When: ボタンをレンダリング
    render(<Button>{buttonText}</Button>);

    // Then: テキストが表示される
    expect(screen.getByRole('button')).toHaveTextContent(buttonText);
  });

  it('クリックイベントを発火する', () => {
    // Given: クリックハンドラを持つボタン
    const handleClick = vi.fn();

    // When: ボタンをレンダリングしてクリック
    render(<Button onClick={handleClick}>クリック</Button>);
    fireEvent.click(screen.getByRole('button'));

    // Then: クリックハンドラが呼ばれる
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabledの場合にクリックイベントを発火しない', () => {
    // Given: disabledなボタン
    const handleClick = vi.fn();

    // When: ボタンをレンダリングしてクリック
    render(
      <Button onClick={handleClick} disabled>
        クリック
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));

    // Then: クリックハンドラが呼ばれない
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('disabledの場合にdisabled属性を持つ', () => {
    // Given: disabledなボタン

    // When: ボタンをレンダリング
    render(<Button disabled>クリック</Button>);

    // Then: disabled属性を持つ
    expect(screen.getByRole('button')).toBeDisabled();
  });

  describe('variant', () => {
    it('defaultバリアントが適用される', () => {
      // Given: バリアント未指定

      // When: ボタンをレンダリング
      render(<Button>クリック</Button>);

      // Then: defaultのスタイルが適用される
      expect(screen.getByRole('button')).toHaveClass('bg-primary');
    });

    it('destructiveバリアントが適用される', () => {
      // Given: destructiveバリアント

      // When: ボタンをレンダリング
      render(<Button variant="destructive">クリック</Button>);

      // Then: destructiveのスタイルが適用される
      expect(screen.getByRole('button')).toHaveClass('bg-destructive');
    });

    it('outlineバリアントが適用される', () => {
      // Given: outlineバリアント

      // When: ボタンをレンダリング
      render(<Button variant="outline">クリック</Button>);

      // Then: outlineのスタイルが適用される
      expect(screen.getByRole('button')).toHaveClass('border');
    });

    it('secondaryバリアントが適用される', () => {
      // Given: secondaryバリアント

      // When: ボタンをレンダリング
      render(<Button variant="secondary">クリック</Button>);

      // Then: secondaryのスタイルが適用される
      expect(screen.getByRole('button')).toHaveClass('bg-secondary');
    });

    it('ghostバリアントが適用される', () => {
      // Given: ghostバリアント

      // When: ボタンをレンダリング
      render(<Button variant="ghost">クリック</Button>);

      // Then: ghostのスタイルが適用される（背景なし）
      expect(screen.getByRole('button')).not.toHaveClass('bg-primary');
    });

    it('linkバリアントが適用される', () => {
      // Given: linkバリアント

      // When: ボタンをレンダリング
      render(<Button variant="link">クリック</Button>);

      // Then: linkのスタイルが適用される
      expect(screen.getByRole('button')).toHaveClass('underline-offset-4');
    });
  });

  describe('size', () => {
    it('defaultサイズが適用される', () => {
      // Given: サイズ未指定

      // When: ボタンをレンダリング
      render(<Button>クリック</Button>);

      // Then: defaultのサイズが適用される
      expect(screen.getByRole('button')).toHaveClass('h-9');
    });

    it('smサイズが適用される', () => {
      // Given: smサイズ

      // When: ボタンをレンダリング
      render(<Button size="sm">クリック</Button>);

      // Then: smのサイズが適用される
      expect(screen.getByRole('button')).toHaveClass('h-8');
    });

    it('lgサイズが適用される', () => {
      // Given: lgサイズ

      // When: ボタンをレンダリング
      render(<Button size="lg">クリック</Button>);

      // Then: lgのサイズが適用される
      expect(screen.getByRole('button')).toHaveClass('h-10');
    });

    it('iconサイズが適用される', () => {
      // Given: iconサイズ

      // When: ボタンをレンダリング
      render(<Button size="icon">X</Button>);

      // Then: iconのサイズが適用される
      expect(screen.getByRole('button')).toHaveClass('w-9');
    });
  });

  it('カスタムクラスが適用される', () => {
    // Given: カスタムクラス

    // When: ボタンをレンダリング
    render(<Button className="custom-class">クリック</Button>);

    // Then: カスタムクラスが適用される
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('asChildの場合に子要素をレンダリングする', () => {
    // Given: asChildプロパティ

    // When: ボタンをレンダリング
    render(
      <Button asChild>
        <a href="/test">リンク</a>
      </Button>
    );

    // Then: リンクがレンダリングされる
    expect(screen.getByRole('link')).toHaveTextContent('リンク');
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test');
  });

  it('typeが指定できる', () => {
    // Given: type="submit"

    // When: ボタンをレンダリング
    render(<Button type="submit">送信</Button>);

    // Then: type属性が設定される
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('refが転送される', () => {
    // Given: ref
    const ref = { current: null } as unknown as React.RefObject<HTMLButtonElement>;

    // When: ボタンをレンダリング
    render(<Button ref={ref}>クリック</Button>);

    // Then: refが設定される
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
