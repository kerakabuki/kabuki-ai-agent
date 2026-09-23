-- 化粧中写真はSNS利用可。前の初期判定を取り消す。
UPDATE images
SET privacy_excluded = 0,
    privacy_exclusion_reason = NULL,
    updated_at = datetime('now')
WHERE privacy_exclusion_reason = 'performer_makeup';
