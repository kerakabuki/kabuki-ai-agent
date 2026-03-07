-- KABUKI POST 365 - Initial Schema
-- 5 tables: characters, images, posts, quiz_posts, settings

CREATE TABLE IF NOT EXISTS characters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_reading TEXT NOT NULL DEFAULT '',
  aliases TEXT,
  related_play TEXT NOT NULL DEFAULT '',
  description TEXT,
  personality_tags TEXT,
  season_tags TEXT,
  related_characters TEXT,
  kabuki_navi_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  character_id INTEGER,
  play_name TEXT,
  scene_type TEXT,
  visual_features TEXT,
  season_tag TEXT DEFAULT '通年',
  usage_count INTEGER NOT NULL DEFAULT 0,
  navi_display_order INTEGER,
  navi_caption TEXT,
  navi_visible INTEGER NOT NULL DEFAULT 1,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_date TEXT NOT NULL UNIQUE,
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
  cta_type TEXT,
  cta_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  instagram_posted INTEGER NOT NULL DEFAULT 0,
  x_posted INTEGER NOT NULL DEFAULT 0,
  facebook_posted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS quiz_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'intermediate',
  category TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_post_date ON posts(post_date);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_images_character_id ON images(character_id);
CREATE INDEX IF NOT EXISTS idx_images_season_tag ON images(season_tag);

-- Seed settings
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('start_date', '2026-04-01'),
  ('instagram_base_url', 'https://www.instagram.com/'),
  ('x_base_url', 'https://x.com/'),
  ('facebook_base_url', 'https://www.facebook.com/'),
  ('common_hashtags', '#歌舞伎 #kabuki #伝統芸能 #日本文化'),
  ('cta_a_template', '▶ もっと詳しく: {url}'),
  ('cta_b_template', '▶ 公演情報はこちら: {url}'),
  ('cta_c_template', '▶ 歌舞伎の世界を体験: {url}'),
  ('cta_d_template', '▶ クイズの答えは来週金曜日！'),
  ('kabuki_navi_base_url', 'https://kabukiplus.com');
