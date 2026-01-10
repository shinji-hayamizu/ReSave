-- ============================================
-- 1. review_schedules テーブル作成
-- ============================================
CREATE TABLE review_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  intervals INT[] NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, name)
);

-- ユーザーごとにデフォルトは1つまで
CREATE UNIQUE INDEX idx_review_schedules_default
  ON review_schedules(user_id) WHERE is_default = true;

-- インデックス
CREATE INDEX idx_review_schedules_user_id ON review_schedules(user_id);

-- RLS
ALTER TABLE review_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can SELECT own schedules" ON review_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can INSERT own schedules" ON review_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can UPDATE own schedules" ON review_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can DELETE own schedules" ON review_schedules
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE review_schedules IS 'Spaced repetition schedule templates';
COMMENT ON COLUMN review_schedules.intervals IS 'Array of review intervals in days';
COMMENT ON COLUMN review_schedules.is_default IS 'Only one default schedule per user';

-- ============================================
-- 2. cards テーブル更新
-- ============================================

-- 新しいカラムを追加
ALTER TABLE cards ADD COLUMN schedule INT[] NOT NULL DEFAULT ARRAY[1, 3, 7, 14, 30, 90];
ALTER TABLE cards ADD COLUMN current_step INT NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE cards ADD COLUMN completed_at TIMESTAMPTZ;

-- review_level カラムを削除
ALTER TABLE cards DROP COLUMN review_level;

-- CHECK制約を追加
ALTER TABLE cards ADD CONSTRAINT cards_status_check
  CHECK (status IN ('active', 'completed'));

ALTER TABLE cards ADD CONSTRAINT cards_current_step_check
  CHECK (current_step >= 0);

-- インデックス更新（古いものを削除して新しく作成）
DROP INDEX IF EXISTS idx_cards_next_review_at;
DROP INDEX IF EXISTS idx_cards_user_next_review;

CREATE INDEX idx_cards_next_review ON cards(user_id, status, next_review_at);
CREATE INDEX idx_cards_status ON cards(user_id, status);

-- コメント更新
COMMENT ON COLUMN cards.schedule IS 'Copy of review intervals in days at card creation';
COMMENT ON COLUMN cards.current_step IS 'Current step in the schedule (0-indexed)';
COMMENT ON COLUMN cards.status IS 'active or completed';
COMMENT ON COLUMN cards.completed_at IS 'Timestamp when card was marked as completed';
