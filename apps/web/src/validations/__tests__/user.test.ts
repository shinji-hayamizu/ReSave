import { describe, expect, it } from 'vitest';

import {
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  updatePasswordSchema,
} from '../user';

describe('loginSchema', () => {
  describe('正常系', () => {
    it('有効なメールアドレスとパスワードで成功する', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('異常系: email', () => {
    it('空のメールアドレスでエラー', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'メールアドレスを入力してください'
        );
      }
    });

    it('不正な形式のメールアドレスでエラー', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '有効なメールアドレスを入力してください'
        );
      }
    });
  });

  describe('異常系: password', () => {
    it('空のパスワードでエラー', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードを入力してください'
        );
      }
    });
  });
});

describe('signupSchema', () => {
  describe('正常系', () => {
    it('有効な入力で成功する', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('英字と数字を含む8文字のパスワードで成功する', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'abcd1234',
        confirmPassword: 'abcd1234',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('異常系: password', () => {
    it('8文字未満のパスワードでエラー', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'pass1',
        confirmPassword: 'pass1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードは8文字以上で入力してください'
        );
      }
    });

    it('英字のみのパスワードでエラー', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'abcdefgh',
        confirmPassword: 'abcdefgh',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードは英字と数字を含める必要があります'
        );
      }
    });

    it('数字のみのパスワードでエラー', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: '12345678',
        confirmPassword: '12345678',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードは英字と数字を含める必要があります'
        );
      }
    });
  });

  describe('異常系: confirmPassword', () => {
    it('パスワードが一致しない場合エラー', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password456',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find(
          (issue) => issue.path.includes('confirmPassword')
        );
        expect(confirmPasswordError?.message).toBe('パスワードが一致しません');
      }
    });

    it('確認パスワードが空の場合エラー', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワード（確認）を入力してください'
        );
      }
    });
  });
});

describe('resetPasswordSchema', () => {
  describe('正常系', () => {
    it('有効なメールアドレスで成功する', () => {
      const result = resetPasswordSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('異常系', () => {
    it('空のメールアドレスでエラー', () => {
      const result = resetPasswordSchema.safeParse({
        email: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'メールアドレスを入力してください'
        );
      }
    });

    it('不正な形式のメールアドレスでエラー', () => {
      const result = resetPasswordSchema.safeParse({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '有効なメールアドレスを入力してください'
        );
      }
    });
  });
});

describe('updatePasswordSchema', () => {
  describe('正常系', () => {
    it('有効なパスワードで成功する', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('異常系', () => {
    it('8文字未満のパスワードでエラー', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'pass1',
        confirmPassword: 'pass1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードは8文字以上で入力してください'
        );
      }
    });

    it('英字と数字を含まないパスワードでエラー', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'onlyletters',
        confirmPassword: 'onlyletters',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードは英字と数字を含める必要があります'
        );
      }
    });

    it('パスワードが一致しない場合エラー', () => {
      const result = updatePasswordSchema.safeParse({
        password: 'password123',
        confirmPassword: 'different456',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find(
          (issue) => issue.path.includes('confirmPassword')
        );
        expect(confirmPasswordError?.message).toBe('パスワードが一致しません');
      }
    });
  });
});
