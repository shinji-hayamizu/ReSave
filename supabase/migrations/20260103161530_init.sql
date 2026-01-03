-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Cards table
-- ===========================================
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  review_level INT NOT NULL DEFAULT 0 CHECK (review_level >= 0 AND review_level <= 6),
  next_review_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cards IS 'Spaced repetition flashcards';
COMMENT ON COLUMN cards.review_level IS 'Review level 0-6: intervals are 1,3,7,14,30,180 days';
COMMENT ON COLUMN cards.next_review_at IS 'NULL means card is completed/mastered';

-- ===========================================
-- Tags table
-- ===========================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

COMMENT ON TABLE tags IS 'Labels for categorizing cards';
COMMENT ON COLUMN tags.color IS 'Hex color code (#RRGGBB)';

-- ===========================================
-- Card-Tag junction table
-- ===========================================
CREATE TABLE IF NOT EXISTS card_tags (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, tag_id)
);

COMMENT ON TABLE card_tags IS 'Many-to-many relationship between cards and tags';

-- ===========================================
-- Study logs table
-- ===========================================
CREATE TABLE IF NOT EXISTS study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  assessment VARCHAR(20) NOT NULL CHECK (assessment IN ('ok', 'remembered', 'again')),
  studied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE study_logs IS 'Record of card review sessions';
COMMENT ON COLUMN study_logs.assessment IS 'ok: level+1, remembered: completed, again: reset to 0';

-- ===========================================
-- Indexes for performance
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_next_review_at ON cards(next_review_at);
CREATE INDEX IF NOT EXISTS idx_cards_user_next_review ON cards(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_card_tags_card_id ON card_tags(card_id);
CREATE INDEX IF NOT EXISTS idx_card_tags_tag_id ON card_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_user_id_studied_at ON study_logs(user_id, studied_at);
CREATE INDEX IF NOT EXISTS idx_study_logs_card_id ON study_logs(card_id);

-- ===========================================
-- Row Level Security
-- ===========================================
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS Policies - Cards
-- ===========================================
CREATE POLICY "Users can SELECT own cards" ON cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can INSERT own cards" ON cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can UPDATE own cards" ON cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can DELETE own cards" ON cards
  FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- RLS Policies - Tags
-- ===========================================
CREATE POLICY "Users can SELECT own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can INSERT own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can UPDATE own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can DELETE own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- RLS Policies - Card Tags
-- ===========================================
CREATE POLICY "Users can SELECT own card_tags" ON card_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cards WHERE cards.id = card_id AND cards.user_id = auth.uid())
  );

CREATE POLICY "Users can INSERT own card_tags" ON card_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM cards WHERE cards.id = card_id AND cards.user_id = auth.uid())
  );

CREATE POLICY "Users can DELETE own card_tags" ON card_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM cards WHERE cards.id = card_id AND cards.user_id = auth.uid())
  );

-- ===========================================
-- RLS Policies - Study Logs
-- ===========================================
CREATE POLICY "Users can SELECT own study_logs" ON study_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can INSERT own study_logs" ON study_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- Updated_at trigger function
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to cards table
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
