-- Bluesky columns
ALTER TABLE posts ADD COLUMN bluesky_text TEXT;
ALTER TABLE posts ADD COLUMN bluesky_posted INTEGER NOT NULL DEFAULT 0;

-- Audit log table for SNS auto-posting
CREATE TABLE IF NOT EXISTS post_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  platform TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  platform_post_id TEXT,
  error_message TEXT,
  executed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
CREATE INDEX idx_post_log_post_id ON post_log(post_id);
CREATE INDEX idx_post_log_executed_at ON post_log(executed_at);

-- Worker base URL setting for constructing public image URLs
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('worker_base_url', 'https://kabuki-post-365.kerakabuki.workers.dev');
