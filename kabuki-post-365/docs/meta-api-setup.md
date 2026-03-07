# Meta API セットアップ手順

## 現在の状況（2026-03-02 設定完了）

- ✅ Meta Developer アプリ: **JIKABUKILABO**（App ID: 1496913162049946、開発中モード）
- ✅ 権限: instagram_basic, instagram_content_publish, pages_read_engagement, pages_show_list, business_management
- ✅ ビジネスポートフォリオ「気良歌舞伎」にFacebookページ＋Instagramアカウント紐づけ済み
- ✅ 長期トークン発行済み（有効期限: 約60日 → **2026年5月頃に再発行が必要**）
- ✅ Wrangler シークレット設定済み

### 設定済みの値

| シークレット | 値 |
|------------|-----|
| FACEBOOK_PAGE_ID | `264545300260903`（気良歌舞伎） |
| INSTAGRAM_USER_ID | `17841474751641148`（@kerakabuki_official） |
| META_ACCESS_TOKEN | 長期トークン（Wrangler secret に格納） |

---

## トークン再発行手順（60日ごと）

### Step 1: 短期トークン取得
1. https://developers.facebook.com/tools/explorer/ にアクセス
2. アプリ「JIKABUKILABO」を選択
3. 「ユーザーアクセストークン」を選択
4. 権限にチェック: pages_show_list, business_management, instagram_basic, instagram_content_publish, pages_read_engagement
5. 「Generate Access Token」→ 許可

### Step 2: 長期トークンに変換
```bash
curl "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=1496913162049946&client_secret={APP_SECRET}&fb_exchange_token={短期トークン}"
```

### Step 3: Wrangler に再設定
```bash
cd kabuki-post-365
wrangler secret put META_ACCESS_TOKEN      # 新しい長期トークンを貼り付け
```

---

## 初回セットアップ手順（参考）

### Step 1: ビジネスポートフォリオにFacebookページを追加
1. https://business.facebook.com/ にログイン
2. 左メニュー → 設定（歯車） → アカウント → ページ
3. 「追加」→「Facebookページを追加」→「気良歌舞伎」を検索して追加

### Step 2: InstagramをFacebookページにリンク
1. Instagramアプリ → 設定 → アカウント → プロアカウントに切り替え
2. Meta Business Suite → 設定 → アカウント → Instagramアカウント → 追加

### Step 3: アプリにビジネスポートフォリオを紐づけ
1. https://developers.facebook.com/ → マイアプリ → JIKABUKILABO
2. 左メニュー → アプリの設定 → ベーシック
3. 「ビジネスポートフォリオ」で「気良歌舞伎」を選択 → 保存

### Step 4〜7: トークン生成・ID取得・シークレット設定
上記「トークン再発行手順」と同じ + 以下でID取得:
```bash
curl "https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account&access_token={長期トークン}"
```

## 構成図
```
個人Facebookアカウント（澤 奈央也）
  └─ ビジネスポートフォリオ「気良歌舞伎」
      ├─ Facebookページ「気良歌舞伎（けらかぶき）」(ID: 264545300260903)
      └─ Instagramプロアカウント「@kerakabuki_official」(ID: 17841474751641148)
          └─ Metaアプリ「JIKABUKILABO」(App ID: 1496913162049946)
```
