-- Add navi_image_url to characters for linking to NAVI enmoku cast images
ALTER TABLE characters ADD COLUMN navi_image_url TEXT;

-- Add navi_enmoku_id and navi_cast_id for tracking the source
ALTER TABLE characters ADD COLUMN navi_enmoku_id TEXT;
ALTER TABLE characters ADD COLUMN navi_cast_id TEXT;
