-- ============================================
-- cards.status に 'new' を追加
-- 新規カードは未学習状態で作成される
-- ============================================

-- 1. 既存のCHECK制約を削除
ALTER TABLE cards DROP CONSTRAINT cards_status_check;

-- 2. 新しいCHECK制約を追加（'new' を含む）
ALTER TABLE cards ADD CONSTRAINT cards_status_check
  CHECK (status IN ('new', 'active', 'completed'));

-- 3. デフォルト値を 'new' に変更
ALTER TABLE cards ALTER COLUMN status SET DEFAULT 'new';

-- 4. next_review_at のデフォルトを NULL に変更
ALTER TABLE cards ALTER COLUMN next_review_at SET DEFAULT NULL;

-- 5. コメント更新
COMMENT ON COLUMN cards.status IS 'new (unlearned), active (in review cycle), or completed';
