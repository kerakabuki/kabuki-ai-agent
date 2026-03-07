コラム記事をKABUKI PLUS+に投入します。

## 引数
`$ARGUMENTS` にはコラムIDを指定してください（例: `shiranami-serifu`）。

## 手順

1. ユーザーにnote記事の本文を貼り付けてもらう
2. 本文を以下のルールでリライト:
   - 歌舞伎初心者が読んでもわかるように平易な表現に
   - noteへのリンクや自己紹介は除去
   - 見出し・段落構成を整理
   - マークダウン形式で記述
3. 以下のJSON構造で `column/{id}.json` を生成:
```json
{
  "id": "コラムID",
  "title": "タイトル",
  "subtitle": "サブタイトル",
  "body": "本文（マークダウン）",
  "enmoku_id": "関連演目ID（あれば）",
  "category": "serifu|guide|report",
  "tags": ["タグ1", "タグ2"],
  "source_url": "https://note.com/kerakabuki/n/xxx",
  "created": "YYYY-MM-DD",
  "updated": "YYYY-MM-DD"
}
```
4. R2にアップロード:
```bash
npx wrangler r2 object put kabuki-content/column/{id}.json --file tmp/column-{id}.json
```
5. `columns.json` を更新（R2から取得→追記→再アップロード）:
```bash
npx wrangler r2 object get kabuki-content/columns.json --file tmp/columns.json
# JSONに新エントリを追加
npx wrangler r2 object put kabuki-content/columns.json --file tmp/columns.json
```

## カテゴリ
- `serifu` — 台詞解説・超訳
- `guide` — 初心者向け演目紹介
- `report` — 活動報告・お知らせ

## 注意
- コラムID: ケバブケース（例: `shiranami-serifu`, `renjishi-guide`）
- `enmoku_id` はR2の演目JSONファイル名と一致させる
- `created` はnote記事の公開日
- `updated` は今日の日付
