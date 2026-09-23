ALTER TABLE posts ADD COLUMN auto_publish INTEGER NOT NULL DEFAULT 1;
ALTER TABLE posts ADD COLUMN content_type TEXT NOT NULL DEFAULT 'photo';
ALTER TABLE posts ADD COLUMN ig_media_id TEXT;
ALTER TABLE posts ADD COLUMN ig_permalink TEXT;
ALTER TABLE posts ADD COLUMN publish_state TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE posts ADD COLUMN publish_container_id TEXT;
ALTER TABLE posts ADD COLUMN publish_started_at TEXT;
ALTER TABLE posts ADD COLUMN published_media_key TEXT;
ALTER TABLE posts ADD COLUMN published_caption TEXT;
ALTER TABLE posts ADD COLUMN publish_error TEXT;

CREATE TABLE reel_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  source_hash TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  lease_token TEXT,
  lease_until TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  video_key TEXT,
  cover_key TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_id, source_hash)
);
CREATE INDEX reel_jobs_pending ON reel_jobs(status, post_id);

CREATE TABLE crossposts (
  post_id INTEGER NOT NULL REFERENCES posts(id),
  platform TEXT NOT NULL CHECK(platform IN ('facebook','x')),
  status TEXT NOT NULL DEFAULT 'pending',
  caption TEXT,
  permalink TEXT,
  error TEXT,
  started_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(post_id, platform)
);

INSERT OR IGNORE INTO settings(key,value) VALUES
 ('reels_enabled','0'), ('reel_bgm_key',''),
 ('crosspost_start_date',date('now','+9 hours')),
 ('reels_start_date',date('now','+9 hours'));
