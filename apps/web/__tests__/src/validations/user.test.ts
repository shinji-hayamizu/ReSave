import { describe, it, expect } from 'vitest';
import {
  userSchema,
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '@/validations/user';

describe('userSchema', () => {
  const validUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  it('有効なユーザーデータの場合にパースに成功する', () => {
    // Given: 有効なユーザーデータ
    const input = validUser;

    // When: スキーマでパース
    const result = userSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('idが不正なUUIDの場合にパースに失敗する', () => {
    // Given: 不正なUUID
    const input = { ...validUser, id: 'invalid-uuid' };

    // When: スキーマでパース
    const result = userSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('emailが不正な形式の場合にパースに失敗する', () => {
    // Given: 不正なメールアドレス
    const input = { ...validUser, email: 'invalid-email' };

    // When: スキーマでパース
    const result = userSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '有効なメールアドレスを入力してください'
      );
    }
  });

  it('createdAtが不正な日時形式の場合にパースに失敗する', () => {
    // Given: 不正な日時形式
    const input = { ...validUser, createdAt: '2024-01-01' };

    // When: スキーマでパース
    const result = userSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('有効なログインデータの場合にパースに成功する', () => {
    // Given: 有効なログインデータ
    const input = {
      email: 'test@example.com',
      password: 'password123',
    };

    // When: スキーマでパース
    const result = loginSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('emailが空の場合にパースに失敗する', () => {
    // Given: emailが空
    const input = {
      email: '',
      password: 'password123',
    };

    // When: スキーマでパース
    const result = loginSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'メールアドレスを入力してください'
      );
    }
  });

  it('emailが不正な形式の場合にパースに失敗する', () => {
    // Given: 不正なメールアドレス
    const input = {
      email: 'invalid-email',
      password: 'password123',
    };

    // When: スキーマでパース
    const result = loginSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '有効なメールアドレスを入力してください'
      );
    }
  });

  it('passwordが空の場合にパースに失敗する', () => {
    // Given: passwordが空
    const input = {
      email: 'test@example.com',
      password: '',
    };

    // When: スキーマでパース
    const result = loginSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'パスワードを入力してください'
      );
    }
  });
});

describe('signupSchema', () => {
  it('有効なサインアップデータの場合にパースに成功する', () => {
    // Given: 有効なサインアップデータ
    const input = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    // When: スキーマでパース
    const result = signupSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('emailが空の場合にパースに失敗する', () => {
    // Given: emailが空
    const input = {
      email: '',
      password: 'password123',
      confirmPassword: 'password123',
    };

    // When: スキーマでパース
    const result = signupSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'メールアドレスを入力してください'
      );
    }
  });

  it('emailが不正な形式の場合にパースに失敗する', () => {
    // Given: 不正なメールアドレス
    const input = {
      email: 'invalid-email',
      password: 'password123',
      confirmPassword: 'password123',
    };

    // When: スキーマでパース
    const result = signupSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('passwordが8文字未満の場合にパースに失敗する', () => {
    // Given: passwordが7文字
    const input = {
      email: 'test@example.com',
      password: 'pass123',
      confirmPassword: 'pass123',
    };

    // When: スキーマでパース
    const result = signupSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'パスワードは8文字以上で入力してください'
      );
    }
  });

  it('passwordに英字のみの場合にパースに失敗する', () => {
    // Given: 英字のみのpassword
    const input = {
      email: 'test@example.com',
      password: 'passwordonly',
      confirmPassword: 'passwordonly',
    };

    // When: スキーマでパース
    const result = signupSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'パスワードは英字と数字を含める必要があります'
      );
    }
  });

  it('passwordに数字のみの場合にパースに失敗する', () => {
    // Given: 数字のみのpassword
    const input = {
      email: 'test@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    };

    // When: スキーマでパース
    const result = signupSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('confirmPasswordが空の場合にパースに失敗する', () => {
    // Given: confirmPasswordが空
    const input = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: '',
    };

    // When: スキーマでパース
    const result = signupSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'パスワード（確認）を入力してください'
      );
    }
  });

  it('passwordとconfirmPasswordが一致しない場合にパースに失敗する', () => {
    // Given: パスワードが一致しない
    const input = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password456',
    };

    // When: スキーマでパース
    const result = signupSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (issue) => issue.path[0] === 'confirmPassword'
      );
      expect(confirmError?.message).toBe('パスワードが一致しません');
    }
  });
});

describe('resetPasswordSchema', () => {
  it('有効なメールアドレスの場合にパースに成功する', () => {
    // Given: 有効なメールアドレス
    const input = {
      email: 'test@example.com',
    };

    // When: スキーマでパース
    const result = resetPasswordSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('emailが空の場合にパースに失敗する', () => {
    // Given: emailが空
    const input = {
      email: '',
    };

    // When: スキーマでパース
    const result = resetPasswordSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'メールアドレスを入力してください'
      );
    }
  });

  it('emailが不正な形式の場合にパースに失敗する', () => {
    // Given: 不正なメールアドレス
    const input = {
      email: 'invalid-email',
    };

    // When: スキーマでパース
    const result = resetPasswordSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('updatePasswordSchema', () => {
  it('有効なパスワード更新データの場合にパースに成功する', () => {
    // Given: 有効なパスワード更新データ
    const input = {
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
    };

    // When: スキーマでパース
    const result = updatePasswordSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('passwordが8文字未満の場合にパースに失敗する', () => {
    // Given: passwordが7文字
    const input = {
      password: 'pass123',
      confirmPassword: 'pass123',
    };

    // When: スキーマでパース
    const result = updatePasswordSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('passwordに英字と数字が含まれない場合にパースに失敗する', () => {
    // Given: 英字のみのpassword
    const input = {
      password: 'passwordonly',
      confirmPassword: 'passwordonly',
    };

    // When: スキーマでパース
    const result = updatePasswordSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('confirmPasswordが空の場合にパースに失敗する', () => {
    // Given: confirmPasswordが空
    const input = {
      password: 'newpassword123',
      confirmPassword: '',
    };

    // When: スキーマでパース
    const result = updatePasswordSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('passwordとconfirmPasswordが一致しない場合にパースに失敗する', () => {
    // Given: パスワードが一致しない
    const input = {
      password: 'newpassword123',
      confirmPassword: 'newpassword456',
    };

    // When: スキーマでパース
    const result = updatePasswordSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (issue) => issue.path[0] === 'confirmPassword'
      );
      expect(confirmError?.message).toBe('パスワードが一致しません');
    }
  });
});
