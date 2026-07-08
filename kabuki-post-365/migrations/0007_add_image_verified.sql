-- 画像の検品フラグ。人間が管理画面の「写真チェック」で確認した画像だけが
-- キャラクター文脈として本文生成に渡る（Gemini Visionの誤判定によるSNS投稿事故の防止）。
-- 既存レコードの verified=1 化は運用側で行うためここには含めない。
ALTER TABLE images ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;
