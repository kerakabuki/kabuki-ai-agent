ALTER TABLE posts ADD COLUMN pinterest_text TEXT;
ALTER TABLE posts ADD COLUMN pinterest_hashtags TEXT;
ALTER TABLE posts ADD COLUMN pinterest_posted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE posts ADD COLUMN pinterest_board TEXT;
