---
name: import-column
description: note記事などのコラムをKABUKI PLUS+のコラムページ（/kabuki/navi/column）に投入する。本文をリライトして column/{id}.json を生成し、R2バケット kerakabuki-content にアップロード、columns.json 一覧も更新する。「コラムを追加/インポート」「note記事をコラム化」といった依頼で使用。
argument-hint: コラムID（ケバブケース。例 shiranami-serifu）
---

コラム記事をKABUKI PLUS+に投入します。

## 引数
`$ARGUMENTS` にはコラムIDを指定してください（例: `shiranami-serifu`）。

## 手順

1. 記事本文を取得する:
   - note記事のURLが与えられた場合は note API `https://note.com/api/v3/notes/{記事key}` からJSONを取得（URLだけで完結）
   - URLがない場合はユーザーに本文を貼り付けてもらう
2. 本文を以下のルールでリライト:
   - 歌舞伎初心者が読んでもわかるように平易な表現に
   - noteへのリンクや自己紹介は除去
   - 見出し・段落構成を整理
   - マークダウン形式で記述
3. 以下のJSON構造で `column/{id}.json` を生成（作業ファイルは `__tmp_column-{id}.json`。`__tmp_*` は.gitignore対象）:
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
4. R2にアップロード（バケットは `kerakabuki-content`、本番反映には `--remote` 必須）:
```bash
npx wrangler r2 object put kerakabuki-content/column/{id}.json --file __tmp_column-{id}.json --remote
```
5. `columns.json` を更新（R2から取得→追記→再アップロード）:
```bash
npx wrangler r2 object get kerakabuki-content/columns.json --file __tmp_columns.json --remote
# JSONに新エントリを追加
npx wrangler r2 object put kerakabuki-content/columns.json --file __tmp_columns.json --remote
```
6. 反映確認: `https://kabukiplus.com/kabuki/navi/column/{id}` を開いて表示を確認する

## カテゴリ
- `serifu` — 台詞解説・超訳
- `guide` — 初心者向け演目紹介
- `report` — 活動報告・お知らせ

## 注意
- コラムID: ケバブケース（例: `shiranami-serifu`, `renjishi-guide`）
- `enmoku_id` はR2の演目JSONファイル名と一致させる
- `created` はnote記事の公開日
- `updated` は今日の日付
- **気良歌舞伎ストーリー系の記事はコラムに入れない**（専用ページに既存）
