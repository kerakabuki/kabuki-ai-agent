# 曽根崎心中解説動画 生成AI画像プロンプト集

> 台本: `docs/youtube-script-sonezaki-kaisetsu.md`
> 生成物の保存先: `D:\気良歌舞伎\youtubeチャンネル用\超訳！歌舞伎ナビ\歌舞伎ナビ05曽根崎心中\画像\生成\`

## 使用ツール: **Gemini**（決定 2026-07-04）

- 理由: 参照画像つき生成でキャラ一貫性を保てる／GEMINI_API_KEY・画像生成パイプラインが既にある／Google AI Studioで対話的に修正できる
- 手順: ①人物カード3枚を先に確定 → ②カードを参照画像にして場面カットを生成（「同じお初で」） → ③人物なしカットは独立生成 → ④8枚並べて色調を揃える
- **自動生成スクリプトあり**: `scripts/generate_sonezaki_images.mjs` — 本ドキュメントの8カットを一括生成し `画像\生成\` に保存（参照画像の受け渡しも自動）。`$env:GEMINI_API_KEY` を設定して `node scripts/generate_sonezaki_images.mjs`。気に入らないカットは番号指定+`--force` で作り直し

## 方針（どこに生成AIを使い、どこに使わないか）

| パート | 素材 | 生成AI |
|--------|------|--------|
| ブロック1・7・8 | 稽古写真・稽古映像（8月撮影） | 使わない（実写優先） |
| ブロック3〜6 あらすじ | **場面イラスト** — 初演なので舞台写真が存在しない | **ここに使う** |
| ブロック3〜5 登場人物カード | お初/徳兵衛/九平次の3枚 | **ここに使う** |
| ブロック6-2 ゆかりの地 | お初天神・生玉神社の実写（仕分け済み） | 使わない |
| サムネ背景 | 稽古写真が本命、無ければ生成背景+けらのすけ | 予備として使う |

**ルール**
- 全カット同一スタイル（浮世絵風イラスト）で統一。1枚だけ画風が違うと素人感が出る
- **心中の直接描写はしない**（刃物・死の瞬間はNG）。道行は後ろ姿のシルエット、結末は月と森で示唆
- 人物の顔は「浮世絵風の様式化された顔」に寄せる（リアル調の顔は破綻しやすく、不気味の谷に落ちる）
- 手・指の破綻、着物の左前（右前が正しい。合わせが「y」の字に見えるのが正解）を必ず目視チェック
- 概要欄に「イラスト: 生成AI」を明記。YouTubeの投稿設定でAI生成コンテンツの開示にチェック（イラスト調なら必須ではないが誠実に）

## 共通スタイル指定（全プロンプトの前置き）

```
A traditional Japanese ukiyo-e woodblock print style illustration, Edo period aesthetic,
muted color palette of deep indigo, soft gold, pale pink and dark vermilion,
flat colors with visible line work, no text, no watermark, 16:9 aspect ratio
```

ネガティブ（対応ツールの場合）: `photorealistic, 3d render, modern clothing, text, letters, extra fingers, deformed hands`

---

## カット別プロンプト

### 1. 登場人物カード: お初（ブロック3〜）

```
{共通スタイル} A young courtesan of the Edo period standing gracefully,
wearing an elegant purple kimono with floral patterns, traditional nihongami hairstyle
with kanzashi hairpins, gentle but determined expression, full body, plain pale background
```

- 既存エピソードの「工藤.png」等と同様に背景を抜いてカード化
- 気良の実際の衣装が決まったら、色味を稽古写真に寄せて作り直すとなお良い

### 2. 登場人物カード: 徳兵衛（ブロック3〜）

```
{共通スタイル} A young Edo period merchant clerk (tedai) standing,
wearing a simple striped brown and indigo kimono, honest and earnest face,
slightly worried expression, full body, plain pale background
```

### 3. 登場人物カード: 九平次（ブロック3〜）

```
{共通スタイル} A sly villainous Edo period townsman standing with arms crossed,
wearing a dark green kimono, smug cunning grin, sharp eyes, full body, plain pale background
```

### 4. 生玉社前・場面背景（ブロック3）

```
{共通スタイル} The precincts of an Edo period shrine in Osaka with a wooden torii gate,
stone lanterns and low teahouse benches, daytime, spring atmosphere, no people
```

※実写（生玉神社(2)）と組み合わせて「昔↔いま」の対比にすると効果的

### 5. 天満屋・店先の夜（ブロック5の背景）

```
{共通スタイル} The interior of an Edo period teahouse at night, wooden veranda (engawa),
paper lanterns with warm glow, low wooden floor with dark shadow space beneath it,
quiet tense atmosphere, no people
```

※縁の下の「足の会話」自体は描かない。暗がりのある縁側の空間だけ見せてナレーションに語らせる

### 6. 道行・ふたりの後ろ姿（ブロック6）

```
{共通スタイル} Two lovers walking away hand in hand seen from behind as small silhouettes,
a man and a woman in kimono, moonlit forest path at night, large pale full moon,
torii gate silhouette in the distance, deep indigo night sky, melancholic and beautiful atmosphere
```

★このカットが動画の情感のピーク。後ろ姿シルエットなので顔の破綻リスクもない

### 7. 天神の森・月夜（ブロック6の締め／note記事プロンプトの改稿版）

```
{共通スタイル} A moonlit sacred forest at Sonezaki shrine at night, no people,
a large pale full moon behind tree silhouettes, a small torii gate, drifting mist,
fireflies faintly glowing, atmospheric, melancholic and serene
```

※note記事版の桜は9月公演と季節が合わないため蛍と霧に変更

### 8. サムネ背景（予備）

```
{共通スタイル} Dramatic night scene of Sonezaki forest with a huge full moon,
two small silhouettes of lovers in kimono standing together under the moon,
high contrast composition with large empty space on the left side for text
```

※左側にタイトル文字とけらのすけを載せる前提の余白構図

### 9. 天満屋見世先（2026-07-05追加・実舞台の構図を参照）

```
{共通スタイル} {01・02を参照画像に+STYLE_MATCH} a wide night scene styled like a kabuki
stage picture: the right half is the wooden facade of an Edo period teahouse,
ONE warmly lit open room where the woman in the purple kimono sits quietly (lantern
glow through shoji); the rest sunk in deep indigo darkness with faint wooden lattice
windows; on the left the man in the striped kimono stands alone in a deep sedge hat
(amigasa) hiding his face, turned toward the lit room; strong warm/cold contrast,
theatrical flat stage-like composition, no other people, no text
```

※歌舞伎座公演DVDの舞台面（下手の暗い往来に編笠の男・上手に灯りの座敷）の構図を参考に再解釈。ブロック5の冒頭カットとして使用（→ 05_天満屋の夜へ切替）

---

## 生成後チェックリスト

- [ ] 8枚を通しで並べて画風が揃っているか（色調・線の太さ）
- [ ] 着物の合わせが右前になっているか（左前=死装束は今回の題材では特に注意。道行・シルエット以外で左前が出たら作り直し）
- [ ] 手指・顔の破綻がないか
- [ ] 16:9で書き出し、`画像\生成\` に カット番号_内容.png で保存（例: `06_道行シルエット.png`）
- [ ] 概要欄テンプレに「イラスト: 生成AI」を追記（台本本体の概要欄を更新）

---

*作成: 2026-07-04*
