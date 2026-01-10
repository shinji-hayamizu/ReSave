-- ============================================
-- current_step = 0 のカードを status = 'new' に更新
-- ============================================

UPDATE cards
SET status = 'new',
    next_review_at = NULL,
    updated_at = NOW()
WHERE current_step = 0
  AND status != 'new';
