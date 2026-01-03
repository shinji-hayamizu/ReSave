import { describe, it, expect } from 'vitest';
import {
  userSchema,
  loginSchema,
  signupSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '@/validations/user';

describe('userSchema', () => {
  it('有効なユーザーデータを受け入れる', () => {
    const validUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('無効なUUIDを拒否する', () => {
    const invalidUser = {
      id: 'not-a-uuid',
      email: 'test@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });

  it('無効なメールアドレスを拒否する', () => {
    const invalidUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'invalid-email',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('有効なメールアドレスを入力してください');
    }
  });

  it('無効な日時形式を拒否する', () => {
    const invalidUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      createdAt: 'not-a-datetime',
    };

    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('有効なログインデータを受け入れる', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'password123',
    };

    const result = loginSchema.safeParse(validLogin);
    expect(result.success).toBe(true);
  });

  it('空のメールアドレスを拒否する', () => {
    const invalidLogin = {
      email: '',
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('メールアドレスを入力してください');
    }
  });

  it('無効なメールアドレス形式を拒否する', () => {
    const invalidLogin = {
      email: 'invalid-email',
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('有効なメールアドレスを入力してください');
    }
  });

  it('空のパスワードを拒否する', () => {
    const invalidLogin = {
      email: 'test@example.com',
      password: '',
    };

    const result = loginSchema.safeParse(invalidLogin);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('パスワードを入力してください');
    }
  });
});

describe('signupSchema', () => {
  it('有効な登録データを受け入れる', () => {
    const validSignup = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const result = signupSchema.safeParse(validSignup);
    expect(result.success).toBe(true);
  });

  it('空のメールアドレスを拒否する', () => {
    const invalidSignup = {
      email: '',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const result = signupSchema.safeParse(invalidSignup);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('メールアドレスを入力してください');
    }
  });

  it('8文字未満のパスワードを拒否する', () => {
    const invalidSignup = {
      email: 'test@example.com',
      password: 'pass1',
      confirmPassword: 'pass1',
    };

    const result = signupSchema.safeParse(invalidSignup);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('パスワードは8文字以上で入力してください');
    }
  });

  it('英字のみのパスワードを拒否する', () => {
    const invalidSignup = {
      email: 'test@example.com',
      password: 'passwordonly',
      confirmPassword: 'passwordonly',
    };

    const result = signupSchema.safeParse(invalidSignup);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('パスワードは英字と数字を含める必要があります');
    }
  });

  it('数字のみのパスワードを拒否する', () => {
    const invalidSignup = {
      email: 'test@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    };

    const result = signupSchema.safeParse(invalidSignup);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('パスワードは英字と数字を含める必要があります');
    }
  });

  it('パスワード不一致を拒否する', () => {
    const invalidSignup = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different123',
    };

    const result = signupSchema.safeParse(invalidSignup);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path.includes('confirmPassword'));
      expect(confirmError?.message).toBe('パスワードが一致しません');
    }
  });

  it('空の確認パスワードを拒否する', () => {
    const invalidSignup = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: '',
    };

    const result = signupSchema.safeParse(invalidSignup);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('パスワード（確認）を入力してください');
    }
  });
});

describe('resetPasswordSchema', () => {
  it('有効なメールアドレスを受け入れる', () => {
    const validReset = {
      email: 'test@example.com',
    };

    const result = resetPasswordSchema.safeParse(validReset);
    expect(result.success).toBe(true);
  });

  it('空のメールアドレスを拒否する', () => {
    const invalidReset = {
      email: '',
    };

    const result = resetPasswordSchema.safeParse(invalidReset);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('メールアドレスを入力してください');
    }
  });

  it('無効なメールアドレス形式を拒否する', () => {
    const invalidReset = {
      email: 'not-an-email',
    };

    const result = resetPasswordSchema.safeParse(invalidReset);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('有効なメールアドレスを入力してください');
    }
  });
});

describe('updatePasswordSchema', () => {
  it('有効なパスワード更新データを受け入れる', () => {
    const validUpdate = {
      password: 'newpassword123',
      confirmPassword: 'newpassword123',
    };

    const result = updatePasswordSchema.safeParse(validUpdate);
    expect(result.success).toBe(true);
  });

  it('8文字未満のパスワードを拒否する', () => {
    const invalidUpdate = {
      password: 'short1',
      confirmPassword: 'short1',
    };

    const result = updatePasswordSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('パスワードは8文字以上で入力してください');
    }
  });

  it('英字のみのパスワードを拒否する', () => {
    const invalidUpdate = {
      password: 'onlyletters',
      confirmPassword: 'onlyletters',
    };

    const result = updatePasswordSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('パスワードは英字と数字を含める必要があります');
    }
  });

  it('パスワード不一致を拒否する', () => {
    const invalidUpdate = {
      password: 'newpassword123',
      confirmPassword: 'different123',
    };

    const result = updatePasswordSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path.includes('confirmPassword'));
      expect(confirmError?.message).toBe('パスワードが一致しません');
    }
  });

  it('空の確認パスワードを拒否する', () => {
    const invalidUpdate = {
      password: 'newpassword123',
      confirmPassword: '',
    };

    const result = updatePasswordSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('パスワード（確認）を入力してください');
    }
  });
});
