import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server');

describe('GET /api/health', () => {
  const originalEnv = process.env;
  const mockGetUser = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockLimit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };

    mockLimit.mockResolvedValue({ error: null });
    mockSelect.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('環境変数が設定されている場合に成功レスポンスを返す', async () => {
    // Given: 環境変数が設定されている

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: 成功レスポンスが返される
    expect(response.status).toBe(200);
    expect(json.status).toBe('ok');
    expect(json.message).toBe('Supabase接続成功');
  });

  it('環境変数のステータスを返す', async () => {
    // Given: 環境変数が設定されている

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: 環境変数のステータスが含まれる
    expect(json.env.supabaseUrl).toBe('set');
    expect(json.env.supabaseAnonKey).toBe('set');
  });

  it('SUPABASE_URLが未設定の場合にエラーを返す', async () => {
    // Given: SUPABASE_URLが未設定
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: エラーレスポンスが返される
    expect(response.status).toBe(500);
    expect(json.status).toBe('error');
    expect(json.message).toBe('環境変数が設定されていません');
    expect(json.env.supabaseUrl).toBe('missing');
  });

  it('SUPABASE_ANON_KEYが未設定の場合にエラーを返す', async () => {
    // Given: SUPABASE_ANON_KEYが未設定
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: エラーレスポンスが返される
    expect(response.status).toBe(500);
    expect(json.status).toBe('error');
    expect(json.env.supabaseAnonKey).toBe('missing');
  });

  it('認証済みユーザーの情報を返す', async () => {
    // Given: 認証済みユーザーが存在
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
    };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: ユーザー情報が含まれる
    expect(json.supabase.auth.connected).toBe(true);
    expect(json.supabase.auth.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
    });
  });

  it('未認証の場合にuserがnullを返す', async () => {
    // Given: 未認証状態

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: userがnull
    expect(json.supabase.auth.user).toBeNull();
  });

  it('データベース接続成功時にconnectedを返す', async () => {
    // Given: データベース接続が成功

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: database.statusがconnected
    expect(json.supabase.database.status).toBe('connected');
  });

  it('RLS権限エラー時にconnected_rls_activeを返す', async () => {
    // Given: RLS権限エラー
    mockLimit.mockResolvedValue({
      error: { code: '42501', message: 'permission denied' },
    });

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: database.statusがconnected_rls_active
    expect(json.supabase.database.status).toBe('connected_rls_active');
  });

  it('テーブルが存在しない場合にtable_not_foundを返す', async () => {
    // Given: テーブルが存在しない
    mockLimit.mockResolvedValue({
      error: { code: 'PGRST116', message: 'table not found' },
    });

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: database.statusがtable_not_found
    expect(json.supabase.database.status).toBe('table_not_found');
  });

  it('その他のDBエラー時にerrorを返す', async () => {
    // Given: その他のエラー
    mockLimit.mockResolvedValue({
      error: { code: 'UNKNOWN', message: 'unknown error' },
    });

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: database.statusがerror
    expect(json.supabase.database.status).toBe('error');
  });

  it('createClient失敗時にエラーレスポンスを返す', async () => {
    // Given: createClientが失敗
    (createClient as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Connection failed')
    );

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: エラーレスポンスが返される
    expect(response.status).toBe(500);
    expect(json.status).toBe('error');
    expect(json.message).toBe('Supabase接続失敗');
    expect(json.error).toBe('Connection failed');
  });

  it('ローカル環境を検出する', async () => {
    // Given: ローカルURL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: 環境がlocal
    expect(json.env.environment).toBe('local');
  });

  it('localhost環境を検出する', async () => {
    // Given: localhostURL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: 環境がlocal
    expect(json.env.environment).toBe('local');
  });

  it('本番環境を検出する', async () => {
    // Given: 本番URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefgh.supabase.co';

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: 環境がproduction
    expect(json.env.environment).toBe('production');
  });

  it('開発環境を検出する', async () => {
    // Given: 開発URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://dev-project.supabase.co';

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: 環境がdevelopment
    expect(json.env.environment).toBe('development');
  });

  it('カスタム環境を検出する', async () => {
    // Given: カスタムURL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom.example.com';

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: 環境がcustom
    expect(json.env.environment).toBe('custom');
  });

  it('timestampが含まれる', async () => {
    // Given: 正常な状態

    // When: GETリクエストを実行
    const response = await GET();
    const json = await response.json();

    // Then: timestampが含まれる
    expect(json.timestamp).toBeDefined();
    expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
  });
});
