-- Allow multiple posts per day (remove UNIQUE constraint on post_date)
-- SQLite doesn't support DROP CONSTRAINT, so recreate the table

CREATE TABLE IF NOT EXISTS posts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_date TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  theme TEXT NOT NULL,
  image_id INTEGER,
  character_id INTEGER,
  special_day TEXT,
  instagram_text TEXT,
  instagram_hashtags TEXT,
  x_text TEXT,
  x_hashtags TEXT,
  facebook_text TEXT,
  facebook_hashtags TEXT,
  bluesky_text TEXT,
  cta_type TEXT,
  cta_url TEXT,
  quiz_answer_comment TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  instagram_posted INTEGER NOT NULL DEFAULT 0,
  x_posted INTEGER NOT NULL DEFAULT 0,
  facebook_posted INTEGER NOT NULL DEFAULT 0,
  bluesky_posted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);

INSERT INTO posts_new SELECT
  id, post_date, day_of_week, theme, image_id, character_id, special_day,
  instagram_text, instagram_hashtags, x_text, x_hashtags,
  facebook_text, facebook_hashtags, bluesky_text,
  cta_type, cta_url, quiz_answer_comment, status,
  instagram_posted, x_posted, facebook_posted, bluesky_posted,
  created_at, updated_at
FROM posts;

DROP TABLE posts;
ALTER TABLE posts_new RENAME TO posts;

CREATE INDEX IF NOT EXISTS idx_posts_post_date ON posts(post_date);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
