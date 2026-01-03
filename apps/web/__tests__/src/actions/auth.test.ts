import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signOut, getUser } from '@/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

vi.mock('@/lib/supabase/server');
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('auth actions', () => {
  const mockSignOut = vi.fn();
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        signOut: mockSignOut,
        getUser: mockGetUser,
      },
    });
  });

  describe('signOut', () => {
    it('サインアウト処理を実行する', async () => {
      // Given: サインアウトが成功する状態
      mockSignOut.mockResolvedValue({ error: null });

      // When: signOut関数を実行
      await signOut();

      // Then: supabase.auth.signOutが呼ばれる
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('キャッシュを再検証する', async () => {
      // Given: サインアウトが成功する状態
      mockSignOut.mockResolvedValue({ error: null });

      // When: signOut関数を実行
      await signOut();

      // Then: revalidatePathが正しい引数で呼ばれる
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('ログインページにリダイレクトする', async () => {
      // Given: サインアウトが成功する状態
      mockSignOut.mockResolvedValue({ error: null });

      // When: signOut関数を実行
      await signOut();

      // Then: redirectが/loginで呼ばれる
      expect(redirect).toHaveBeenCalledWith('/login');
    });
  });

  describe('getUser', () => {
    it('認証済みユーザーを返す', async () => {
      // Given: 認証済みユーザーが存在
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
      };
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });

      // When: getUser関数を実行
      const result = await getUser();

      // Then: ユーザー情報が返される
      expect(result).toEqual(mockUser);
    });

    it('未認証の場合にnullを返す', async () => {
      // Given: 未認証状態
      mockGetUser.mockResolvedValue({ data: { user: null } });

      // When: getUser関数を実行
      const result = await getUser();

      // Then: nullが返される
      expect(result).toBeNull();
    });

    it('createClientが呼ばれる', async () => {
      // Given: 認証済みユーザーが存在
      mockGetUser.mockResolvedValue({ data: { user: null } });

      // When: getUser関数を実行
      await getUser();

      // Then: createClientが呼ばれる
      expect(createClient).toHaveBeenCalled();
    });
  });
});
