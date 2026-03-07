-- Remove Pinterest support (API access denied, platform not needed)
-- Note: SQLite does not support DROP COLUMN in older versions.
-- D1 uses a recent SQLite version that supports ALTER TABLE DROP COLUMN.
ALTER TABLE posts DROP COLUMN pinterest_text;
ALTER TABLE posts DROP COLUMN pinterest_hashtags;
ALTER TABLE posts DROP COLUMN pinterest_board;
ALTER TABLE posts DROP COLUMN pinterest_posted;

DELETE FROM settings WHERE key = 'sns_pinterest';
