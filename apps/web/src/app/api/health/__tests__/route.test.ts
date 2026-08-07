import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server');

describe('GET /api/health', () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockLimit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    mockLimit.mockResolvedValue({ error: null, count: 0 });
    mockSelect.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ select: mockSelect });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: mockFrom,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('正常系', () => {
    it('DB到達成功時に200とreachableを返す', async () => {
      // Given: DBが到達可能

      // When: GETリクエストを実行
      const response = await GET();
      const json = await response.json();

      // Then: 成功レスポンスが返される
      expect(response.status).toBe(200);
      expect(json).toMatchObject({ status: 'ok', db: 'reachable' });
    });

    it('成功時にCache-Controlヘッダへno-storeを含める', async () => {
      // Given: DBが到達可能

      // When: GETリクエストを実行
      const response = await GET();

      // Then: no-storeヘッダが返される
      expect(response.headers.get('Cache-Control')).toContain('no-store');
    });

    it('成功時にISO8601形式のtimestampを返す', async () => {
      // Given: DBが到達可能

      // When: GETリクエストを実行
      const response = await GET();
      const json = await response.json();

      // Then: timestampがISO8601形式で返される
      expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
    });

    it('レスポンスキーはstatus, db, timestampのみ返す', async () => {
      // Given: DBが到達可能

      // When: GETリクエストを実行
      const response = await GET();
      const json = await response.json();

      // Then: 公開してよいキーのみ含まれる
      expect(Object.keys(json)).toEqual(['status', 'db', 'timestamp']);
      expect(JSON.stringify(json)).not.toContain('user');
      expect(JSON.stringify(json)).not.toContain('email');
      expect(JSON.stringify(json)).not.toContain('env');
      expect(JSON.stringify(json)).not.toContain('error');
    });

    it('review_schedulesテーブルへ問い合わせる', async () => {
      // Given: DBが到達可能

      // When: GETリクエストを実行
      await GET();

      // Then: keep-alive対象テーブルが使われる
      expect(mockFrom).toHaveBeenCalledWith('review_schedules');
    });

    it('idをhead指定でselectする', async () => {
      // Given: DBが到達可能

      // When: GETリクエストを実行
      await GET();

      // Then: 行データを取得しないselectが使われる
      expect(mockSelect).toHaveBeenCalledWith('id', {
        count: 'exact',
        head: true,
      });
    });
  });

  describe('異常系', () => {
    it('DBエラー時に503とunreachableを返す', async () => {
      // Given: DBがエラーを返す
      mockLimit.mockResolvedValue({
        error: { code: 'XX000', message: 'boom' },
        count: null,
      });

      // When: GETリクエストを実行
      const response = await GET();
      const json = await response.json();

      // Then: 到達不可レスポンスが返される
      expect(response.status).toBe(503);
      expect(json).toMatchObject({ status: 'error', db: 'unreachable' });
    });

    it('DBエラー時にエラー詳細をレスポンスへ含めない', async () => {
      // Given: DBがエラーを返す
      mockLimit.mockResolvedValue({
        error: { code: 'XX000', message: 'boom' },
        count: null,
      });

      // When: GETリクエストを実行
      const response = await GET();
      const json = await response.json();

      // Then: 内部エラー詳細は公開されない
      expect(JSON.stringify(json)).not.toContain('boom');
      expect(JSON.stringify(json)).not.toContain('XX000');
    });

    it('エラー時もCache-Controlヘッダへno-storeを含める', async () => {
      // Given: DBがエラーを返す
      mockLimit.mockResolvedValue({
        error: { code: 'XX000', message: 'boom' },
        count: null,
      });

      // When: GETリクエストを実行
      const response = await GET();

      // Then: no-storeヘッダが返される
      expect(response.headers.get('Cache-Control')).toContain('no-store');
    });

    it('createClientがrejectした時に503を返す', async () => {
      // Given: Supabaseクライアント生成が失敗する
      (createClient as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('conn failed')
      );

      // When: GETリクエストを実行
      const response = await GET();
      const json = await response.json();

      // Then: 到達不可レスポンスが返される
      expect(response.status).toBe(503);
      expect(json).toMatchObject({ status: 'error', db: 'unreachable' });
    });

    it('throw時にエラー詳細をレスポンスへ含めない', async () => {
      // Given: Supabaseクライアント生成が失敗する
      (createClient as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('conn failed')
      );

      // When: GETリクエストを実行
      const response = await GET();
      const json = await response.json();

      // Then: 内部エラー詳細は公開されない
      expect(JSON.stringify(json)).not.toContain('conn failed');
    });

    it('DBエラー時にconsole.errorを呼び出す', async () => {
      // Given: DBがエラーを返す
      mockLimit.mockResolvedValue({
        error: { code: 'XX000', message: 'boom' },
        count: null,
      });

      // When: GETリクエストを実行
      await GET();

      // Then: エラーがログ出力される
      expect(console.error).toHaveBeenCalled();
    });
  });
});
