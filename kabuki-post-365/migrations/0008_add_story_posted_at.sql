-- 夕方の舞台裏ストーリーズ投稿の使用履歴。
-- フィード投稿の usage_count とは独立させ、ストーリーズのローテがフィードローテに
-- 影響を与えないようにする（NULL＝ストーリーズ未使用、古いものから優先で選ぶ）。
ALTER TABLE images ADD COLUMN story_posted_at TEXT;
