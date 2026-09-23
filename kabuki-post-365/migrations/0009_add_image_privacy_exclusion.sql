-- SNS投稿から除外する写真を、R2から削除せず安全に管理する。
ALTER TABLE images ADD COLUMN privacy_excluded INTEGER NOT NULL DEFAULT 0
  CHECK (privacy_excluded IN (0, 1));
ALTER TABLE images ADD COLUMN privacy_exclusion_reason TEXT;

-- 既存メタデータで「化粧」と分類済みの写真は、安全側に倒して初期除外する。
-- 完成後の舞台写真を戻す場合は、管理画面から個別に「投稿に使用」に戻せる。
UPDATE images
SET privacy_excluded = 1,
    privacy_exclusion_reason = 'performer_makeup',
    updated_at = datetime('now')
WHERE scene_type LIKE '%化粧%';

-- まだどのSNSにも配信していない投稿は、除外写真の割当と生成済み本文を外す。
-- 本文は翌回の先読み処理で、別の写真を基準に再生成される。
UPDATE posts
SET image_id = NULL,
    instagram_text = NULL,
    instagram_hashtags = NULL,
    x_text = NULL,
    x_hashtags = NULL,
    facebook_text = NULL,
    facebook_hashtags = NULL,
    bluesky_text = NULL,
    updated_at = datetime('now')
WHERE image_id IN (SELECT id FROM images WHERE privacy_excluded = 1)
  AND instagram_posted = 0
  AND x_posted = 0
  AND facebook_posted = 0
  AND bluesky_posted = 0;
