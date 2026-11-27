-- Existing and manual posts retain the morning slot.
ALTER TABLE posts ADD COLUMN publish_slot TEXT NOT NULL DEFAULT 'morning' CHECK (publish_slot IN ('morning','evening'));
CREATE INDEX IF NOT EXISTS idx_posts_feed_slot ON posts(post_date,publish_slot,auto_publish);
