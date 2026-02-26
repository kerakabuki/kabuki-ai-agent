// src/mypage_page.js
// =========================================================
// KABUKI RECO — /reco (/mypage 後方互換あり)
// 記録する：観劇ログ + 推し俳優
// =========================================================
import { pageShell } from "./web_layout.js";

export function mypagePageHTML(opts) {
  var googleClientId = (opts && opts.googleClientId) || '';
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span>KABUKI RECO
    </div>
    <div id="app">
      <div class="loading">読み込み中…</div>
    </div>

    <style>
      /* ═══════════════════════════════════════
         歌舞伎ログ — デザインガイド準拠エイリアス
      ═══════════════════════════════════════ */
      :root {
        --kl-bg: var(--bg-page);
        --kl-card: var(--bg-card);
        --kl-subtle: var(--bg-subtle);
        --kl-accent-soft: var(--bg-accent-soft);
        --kl-text: var(--text-primary);
        --kl-text2: var(--text-secondary);
        --kl-text3: var(--text-tertiary);
        --kl-gold: var(--gold);
        --kl-gold-light: var(--gold-light);
        --kl-gold-soft: var(--gold-soft);
        --kl-gold-dark: var(--gold-dark);
        --kl-red: var(--accent-1);
        --kl-red-soft: var(--accent-1-soft);
        --kl-green: var(--accent-3);
        --kl-green-soft: var(--accent-3-soft);
        --kl-blue-soft: var(--accent-2-soft);
        --kl-border: var(--border-light);
        --kl-border2: var(--border-medium);
        --kl-shadow-sm: var(--shadow-sm);
        --kl-shadow-md: var(--shadow-md);
        --kl-radius: var(--radius-md);
        /* アバター・アクセント */
        --kl-gold-warm: #ede3d0;
        /* チャート・可視化用カラー */
        --kl-blue: #6ca0dc;
        --kl-blue-bg: #e8f0fe;
        --kl-blue-text: #3c78d0;
        --kl-purple: #9b59b6;
        /* ランクバッジ */
        --kl-rank-gold-start: #F2D06B;
        --kl-rank-gold-end: #C5A255;
        --kl-rank-silver: #D4D0CA;
        --kl-rank-bronze: #C9A47A;
      }

      /* 共通 */
      .mp-header { margin-bottom: 1.2rem; }
      .mp-header h2 { font-size: 1.15rem; color: var(--kl-text); letter-spacing: 0.12em; font-weight: 600; }
      .mp-summary { font-size: 0.82rem; color: var(--kl-text2); line-height: 1.6; }
      .mp-section { margin-bottom: 1.5rem; }
      .mp-section-title {
        display: flex; align-items: center; gap: 10px;
        font-size: 0.95rem; font-weight: 600; color: var(--kl-text);
        letter-spacing: 0.08em; margin-bottom: 0.8rem;
      }
      .mp-section-title::before {
        content: ''; display: block;
        width: 3px; height: 18px;
        background: var(--kl-gold); border-radius: 2px;
        flex-shrink: 0;
      }

      .mp-empty { text-align: center; padding: 2rem 1rem; color: var(--kl-text3); font-size: 0.88rem; }

      .mp-item {
        display: flex; align-items: center; gap: 0.6rem;
        padding: 0.7rem 0.9rem;
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: var(--kl-radius); margin-bottom: 0.4rem;
        cursor: pointer; transition: all 0.2s;
        text-decoration: none; color: var(--kl-text);
        box-shadow: var(--kl-shadow-sm);
      }
      .mp-item:hover { border-color: var(--kl-gold); transform: translateX(3px); text-decoration: none; }
      .mp-item-icon { font-size: 1.1rem; flex-shrink: 0; }
      .mp-item-body { flex: 1; min-width: 0; }
      .mp-item-title { font-size: 0.9rem; font-weight: 600; color: var(--kl-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mp-item-sub { font-size: 0.72rem; color: var(--kl-text3); margin-top: 1px; }
      .mp-item-time { font-size: 0.7rem; color: var(--kl-text3); flex-shrink: 0; }

      .mp-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.8rem; }
      .mp-btn {
        padding: 0.5rem 1rem; border-radius: 8px;
        font-size: 0.82rem; font-family: inherit;
        border: 1px solid var(--kl-border2); background: var(--kl-card); color: var(--kl-text2);
        cursor: pointer; transition: all 0.2s; text-decoration: none;
      }
      .mp-btn:hover { border-color: var(--kl-gold); color: var(--kl-gold-dark); background: var(--kl-gold-soft); text-decoration: none; }
      .mp-btn-primary {
        background: linear-gradient(135deg, var(--kl-gold), var(--kl-gold-dark));
        border-color: var(--kl-gold); color: #fff;
      }
      .mp-btn-primary:hover { box-shadow: var(--kl-shadow-md); }
      .mp-btn-danger { background: transparent; border-color: var(--kl-border2); color: var(--kl-text3); }
      .mp-btn-danger:hover { border-color: var(--kl-red); color: var(--kl-red); }

      .mp-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--kl-border); margin-bottom: 1rem; }
      .mp-tab {
        padding: 0.5rem 1rem; font-size: 0.82rem; color: var(--kl-text3);
        cursor: pointer; border-bottom: 2px solid transparent;
        background: none; border-top: none; border-left: none; border-right: none;
        font-family: inherit; transition: all 0.2s;
      }
      .mp-tab:hover { color: var(--kl-text2); }
      .mp-tab-active { color: var(--kl-gold-dark); border-bottom-color: var(--kl-gold); }

      /* ── 下部固定タブ ── */
      .kl-bottom-tabs {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
        display: flex; background: var(--bg-page, #FAF7F2);
        border-top: 1px solid var(--kl-border);
        box-shadow: 0 -2px 8px rgba(61,49,39,0.06);
        padding-bottom: env(safe-area-inset-bottom, 0);
      }
      .kl-tab-btn {
        flex: 1; display: flex; flex-direction: column; align-items: center;
        gap: 2px; padding: 10px 4px 8px; border: none; background: none;
        color: var(--kl-text3); font-size: 10px; font-family: inherit;
        cursor: pointer; transition: color 0.15s; letter-spacing: 0.5px;
      }
      .kl-tab-btn:hover { color: var(--kl-text2); }
      .kl-tab-icon { font-size: 20px; line-height: 1; }
      .kl-tab-active { color: var(--kl-gold-dark) !important; font-weight: 600; }
      .kl-tab-active .kl-tab-icon { transform: scale(1.1); }
      /* メインコンテンツの下部にタブ分の余白 */
      #app { padding-bottom: 70px; }

      /* ── ログタブ フィルタ ── */
      .log-filters {
        display: flex; gap: 0; border-bottom: 1px solid var(--kl-border);
        margin-bottom: 1rem;
      }
      .log-filter-btn {
        flex: 1; padding: 10px 8px; border: none; background: none;
        color: var(--kl-text3); font-size: 13px; font-family: inherit;
        cursor: pointer; border-bottom: 2px solid transparent;
        transition: all 0.15s; text-align: center;
      }
      .log-filter-btn:hover { color: var(--kl-text2); }
      .log-filter-active { color: var(--kl-gold-dark); border-bottom-color: var(--kl-gold); font-weight: 600; }

      /* ── 折りたたみエントリ ── */
      .tl-entry-detail { display: none; }
      .tl-entry-detail.tl-entry-expanded { display: block; }
      .tl-entry-toggle {
        display: inline-flex; align-items: center; gap: 4px;
        background: none; border: none; color: var(--kl-text3);
        font-size: 11px; font-family: inherit; cursor: pointer;
        padding: 4px 8px; border-radius: 6px; transition: all 0.15s;
        margin-top: 6px;
      }
      .tl-entry-toggle:hover { color: var(--kl-gold-dark); background: var(--kl-gold-soft); }
      .tl-entry-more-menu {
        position: relative; display: inline-block;
      }
      .tl-entry-more-btn {
        background: none; border: none; color: #ccc; font-size: 16px;
        cursor: pointer; padding: 2px 8px; border-radius: 6px;
        font-family: inherit; transition: all 0.15s; letter-spacing: 2px;
      }
      .tl-entry-more-btn:hover { color: var(--kl-text2); background: rgba(0,0,0,0.04); }
      .tl-entry-dropdown {
        display: none; position: absolute; right: 0; top: 100%; z-index: 10;
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: 8px; box-shadow: var(--kl-shadow-md);
        overflow: hidden; min-width: 100px;
      }
      .tl-entry-dropdown.tl-dropdown-open { display: block; }
      .tl-entry-dropdown button {
        display: block; width: 100%; padding: 10px 16px;
        border: none; background: none; color: var(--kl-text);
        font-size: 13px; font-family: inherit; cursor: pointer;
        text-align: left; transition: background 0.15s;
      }
      .tl-entry-dropdown button:hover { background: var(--kl-subtle); }
      .tl-entry-dropdown .tl-drop-danger { color: var(--kl-red); }
      .tl-entry-dropdown .tl-drop-danger:hover { background: var(--kl-red-soft); }

      /* ── 推しバッジ ── */
      .tl-oshi-badge {
        display: inline-block; font-size: 10px; font-weight: 600;
        color: var(--kl-gold-dark); background: var(--kl-gold-soft);
        padding: 1px 6px; border-radius: 4px; margin-left: 6px;
      }

      /* ── 総合サマリー ── */
      .kl-summary-row {
        display: flex; gap: 8px; margin-bottom: 16px;
      }
      .kl-summary-chip {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
        padding: 10px 8px; border-radius: var(--kl-radius);
        background: var(--kl-card); border: 1px solid var(--kl-border);
        box-shadow: var(--kl-shadow-sm); font-size: 13px; color: var(--kl-text);
      }
      .kl-summary-num { font-size: 18px; font-weight: 700; color: var(--kl-gold-dark); }

      /* ── 紹介テキスト ── */
      .kl-intro {
        text-align: center; font-size: 13px; color: var(--kl-text2);
        line-height: 1.8; margin-bottom: 1rem; letter-spacing: 0.5px;
      }

      /* ── 統計カード ── */
      .tl-stats {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        margin-bottom: 1rem;
      }
      .tl-stat-card {
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: var(--kl-radius); padding: 20px 12px; text-align: center;
        box-shadow: var(--kl-shadow-sm); transition: transform 0.15s, box-shadow 0.15s;
      }
      .tl-stat-card:hover { transform: translateY(-2px); box-shadow: var(--kl-shadow-md); }
      .tl-stat-icon { font-size: 20px; margin-bottom: 4px; }
      .tl-stat-num { font-size: 32px; font-weight: 700; color: var(--kl-gold-dark); line-height: 1.2; }
      .tl-stat-unit { font-size: 12px; color: var(--kl-text2); margin-top: 2px; letter-spacing: 1px; }

      /* ── 推し俳優ランキング ── */
      .tl-actor-ranking {
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: var(--kl-radius); box-shadow: var(--kl-shadow-sm);
        overflow: hidden; margin-bottom: 1rem;
      }
      .tl-actor-ranking-title {
        padding: 14px 20px 10px; border-bottom: 1px solid var(--kl-border);
        font-size: 14px; font-weight: 600; color: var(--kl-text); letter-spacing: 1px;
      }
      .tl-actor-rank-row {
        display: flex; align-items: center; padding: 12px 20px;
        border-bottom: 1px solid var(--kl-subtle); transition: background 0.15s;
      }
      .tl-actor-rank-row:last-child { border-bottom: none; }
      .tl-actor-rank-row:hover { background: var(--kl-accent-soft); }
      .tl-actor-rank-pos {
        width: 28px; height: 28px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 600; margin-right: 14px; flex-shrink: 0;
        background: var(--kl-subtle); color: var(--kl-text2);
      }
      .tl-actor-rank-row:nth-child(1) .tl-actor-rank-pos { background: linear-gradient(135deg, var(--kl-rank-gold-start), var(--kl-rank-gold-end)); color: #fff; }
      .tl-actor-rank-row:nth-child(2) .tl-actor-rank-pos { background: var(--kl-rank-silver); color: #fff; }
      .tl-actor-rank-row:nth-child(3) .tl-actor-rank-pos { background: var(--kl-rank-bronze); color: #fff; }
      .tl-actor-rank-name { font-size: 14px; font-weight: 500; flex: 1; color: var(--kl-text); }
      .tl-actor-yago {
        display: inline-block; font-size: 10px; font-weight: 500;
        color: var(--kl-gold-dark); background: var(--kl-gold-soft);
        padding: 1px 6px; border-radius: 4px; margin-left: 6px;
        vertical-align: middle;
      }
      .tl-actor-yago:empty { display: none; }
      .tl-actor-rank-count {
        font-size: 12px; color: var(--kl-text3); background: var(--kl-subtle);
        padding: 2px 10px; border-radius: 20px; flex-shrink: 0;
      }
      .tl-fav-star {
        background: none; border: none; cursor: pointer;
        font-size: 1rem; padding: 0 6px; color: #ccc; flex-shrink: 0; line-height: 1;
        transition: all 0.15s;
      }
      .tl-fav-star:hover { color: var(--kl-gold); }
      .tl-fav-active { color: var(--kl-gold) !important; }
      .tl-fav-manage-btn {
        display: block; width: 100%; padding: 12px 20px;
        border-top: 1px solid var(--kl-border);
        background: none; border-left: none; border-right: none; border-bottom: none;
        color: var(--kl-text2); font-size: 13px; font-family: inherit;
        cursor: pointer; text-align: center; transition: all 0.15s;
      }
      .tl-fav-manage-btn:hover { color: var(--kl-gold-dark); background: var(--kl-gold-soft); }
      .tl-fav-guide { margin-bottom: 1rem; }
      .tl-fav-item {
        display: flex; align-items: center; gap: 0.5rem;
        padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--kl-subtle);
      }
      .tl-fav-item:last-child { border-bottom: none; }
      .tl-fav-item-name { flex: 1; font-size: 0.88rem; color: var(--kl-gold-dark); font-weight: 500; }
      .tl-fav-item-remove {
        background: none; border: 1px solid var(--kl-border2); border-radius: 6px;
        padding: 2px 10px; color: var(--kl-text3); font-size: 0.72rem; cursor: pointer; transition: all 0.15s;
      }
      .tl-fav-item-remove:hover { color: var(--kl-red); border-color: var(--kl-red); }

      /* ── タイムラインエントリ ── */
      .tl-entry {
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: var(--kl-radius); box-shadow: var(--kl-shadow-sm);
        padding: 20px; margin-bottom: 12px; position: relative;
      }
      .tl-entry-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 10px; }
      .tl-entry-date-col {
        text-align: center; flex-shrink: 0;
        background: var(--kl-red-soft); border-radius: 8px; padding: 8px 12px; min-width: 56px;
      }
      .tl-entry-month { font-size: 11px; color: var(--kl-red); font-weight: 500; }
      .tl-entry-day { font-size: 24px; font-weight: 700; color: var(--kl-red); line-height: 1.2; }
      .tl-entry-dow { font-size: 10px; color: var(--kl-text3); }
      .tl-entry-body { flex: 1; min-width: 0; }
      .tl-entry-venue {
        display: flex; align-items: center; gap: 0.4rem;
      }
      .tl-entry-venue-tag {
        display: inline-block; font-size: 11px; color: var(--kl-text3);
        background: var(--kl-subtle); padding: 2px 8px; border-radius: 4px;
      }
      .tl-entry-seat {
        display: inline-block; font-size: 0.65rem; color: var(--kl-text3);
        background: var(--kl-subtle); padding: 1px 6px; border-radius: 4px;
      }
      .tl-entry-perf { font-size: 15px; font-weight: 600; color: var(--kl-text); margin-bottom: 2px; }
      .tl-entry-plays { font-size: 13px; color: var(--kl-gold-dark); font-weight: 500; }
      .tl-entry-play-link {
        color: var(--kl-gold-dark); text-decoration: none;
        border-bottom: 1px dotted rgba(168,135,58,0.4); transition: all 0.15s;
      }
      .tl-entry-play-link:hover { border-bottom-color: var(--kl-gold-dark); }
      .tl-play-scene { font-size: 0.72rem; color: var(--kl-text3); font-weight: normal; }
      .tl-entry-actors {
        font-size: 12px; color: var(--kl-text2); line-height: 1.9;
        padding-top: 10px; border-top: 1px solid var(--kl-border); margin-top: 10px;
      }
      .tl-entry-cast-play { font-size: 11px; color: var(--kl-text3); margin-top: 3px; letter-spacing: 0.03em; }
      .tl-entry-cast-play::before { content: "▸ "; font-size: 10px; }
      .tl-entry-cast-pairs { font-size: 12px; color: var(--kl-text2); padding-left: 0.2rem; }
      .tl-cast-role { color: var(--kl-text3); }
      .tl-cast-linked {
        color: var(--kl-gold-dark); text-decoration: none;
        border-bottom: 1px dotted var(--kl-gold); transition: all 0.2s;
      }
      .tl-cast-linked:hover { color: var(--kl-text); border-color: var(--kl-text); }
      .tl-cast-play-link { color: inherit; text-decoration: none; border-bottom: 1px dotted rgba(0,0,0,0.15); }
      .tl-cast-play-link:hover { color: var(--kl-gold-dark); border-color: var(--kl-gold-dark); }
      .tl-cast-sep { color: var(--kl-border2); margin: 0 0.15rem; }
      .tl-entry-memo { font-size: 12px; color: var(--kl-text3); margin-top: 8px; font-style: italic; }
      .tl-entry-bottom { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
      .tl-entry-bottom-tag {
        font-size: 11px; padding: 3px 10px; border-radius: 20px;
        background: var(--kl-green-soft); color: var(--kl-green); font-weight: 500;
      }
      .tl-entry-actions { position: absolute; top: 16px; right: 16px; }
      .tl-entry-del {
        background: none; border: none; color: #ccc; font-size: 0.82rem;
        cursor: pointer; padding: 2px 6px; border-radius: 6px; font-family: inherit; transition: all 0.15s;
      }
      .tl-entry-del:hover { color: var(--kl-red); background: rgba(212,97,75,0.06); }

      /* ── 学習ログ称号 ── */
      .badge-row {
        display: flex; align-items: center; gap: 12px;
        padding: 16px 20px; margin-bottom: 16px;
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: var(--kl-radius); box-shadow: var(--kl-shadow-sm);
      }
      .badge-icon { font-size: 28px; }
      .badge-label { font-size: 11px; color: var(--kl-text3); letter-spacing: 1px; }
      .badge-title { font-size: 18px; font-weight: 700; color: var(--kl-gold-dark); }
      .badge-sub { font-size: 12px; color: var(--kl-text2); }

      /* ── 統一セクションカード ── */
      .kl-section-card {
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: var(--kl-radius); padding: 16px; margin-bottom: 12px;
        box-shadow: var(--kl-shadow-sm);
      }
      .kl-section-header {
        font-size: 14px; font-weight: 600; color: var(--kl-text);
        letter-spacing: 0.04em; margin-bottom: 12px;
        padding-bottom: 8px; border-bottom: 1px solid var(--kl-border);
      }

      /* ── XPレベル ── */
      .kl-xp-track {
        width: 100%; height: 8px; border-radius: 4px;
        background: var(--kl-subtle); overflow: hidden;
      }
      .kl-xp-fill {
        height: 100%; border-radius: 4px;
        background: linear-gradient(90deg, var(--kl-gold), var(--kl-gold-dark));
        transition: width 0.4s ease;
      }
      .kl-xp-nums { display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px; color: var(--kl-text3); }

      /* ── 今日のひとくち ── */
      .kl-hitokuchi { cursor: pointer; transition: all 0.15s; }
      .kl-hitokuchi:hover { border-color: var(--kl-gold); box-shadow: var(--kl-shadow-md); }
      .kl-hitokuchi-label { font-size: 11px; color: var(--kl-gold-dark); font-weight: 600; letter-spacing: 1px; margin-bottom: 6px; }
      .kl-hitokuchi-text { font-size: 14px; color: var(--kl-text); line-height: 1.6; font-weight: 500; }
      .kl-hitokuchi-sub { font-size: 11px; color: var(--kl-text3); margin-top: 4px; }

      /* ── 週間グラフ ── */
      .kl-weekly-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
      .kl-weekly-title { font-size: 13px; color: var(--kl-text); font-weight: 600; }
      .kl-weekly-total { font-size: 11px; color: var(--kl-text3); }
      .kl-weekly-bars { display: flex; align-items: flex-end; gap: 6px; height: 64px; margin-bottom: 4px; }
      .kl-weekly-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
      .kl-weekly-bar-stack { width: 100%; display: flex; flex-direction: column-reverse; gap: 1px; }
      .kl-weekly-seg { width: 100%; border-radius: 2px; min-height: 0; transition: height 0.3s ease; }
      .kl-weekly-seg-views { background: var(--kl-red); opacity: 0.7; }
      .kl-weekly-seg-clips { background: var(--kl-blue); opacity: 0.7; }
      .kl-weekly-seg-quiz { background: var(--kl-gold); opacity: 0.8; }
      .kl-weekly-seg-keiko { background: var(--kl-green); opacity: 0.7; }
      .kl-weekly-seg-theater { background: var(--kl-purple); opacity: 0.7; }
      .kl-weekly-num { font-size: 9px; color: var(--kl-text2); font-weight: 600; min-height: 12px; }
      .kl-weekly-day { font-size: 10px; color: var(--kl-text3); }
      .kl-weekly-day-today { color: var(--kl-gold-dark); font-weight: 700; }
      .kl-weekly-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--kl-border); }
      .kl-weekly-leg { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--kl-text3); }
      .kl-weekly-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }

      /* ── バッジ ── */
      .kl-badges { display: flex; flex-wrap: wrap; gap: 8px; }
      .kl-badge-item {
        display: flex; align-items: center; gap: 6px;
        padding: 6px 10px; border-radius: 8px;
        background: var(--kl-card); border: 1px solid var(--kl-border);
        font-size: 11px; color: var(--kl-text2);
        box-shadow: var(--kl-shadow-sm);
      }
      .kl-badge-item-earned { border-color: var(--kl-gold-light); background: var(--kl-gold-soft); color: var(--kl-gold-dark); font-weight: 600; }
      .kl-badge-icon { font-size: 16px; }
      .kl-badge-locked { opacity: 0.4; filter: grayscale(1); }

      /* ── プログレスバー ── */
      .lc-progress { margin-top: 4px; }
      .lc-progress-track {
        width: 100%; height: 4px; border-radius: 2px;
        background: var(--kl-subtle); overflow: hidden;
      }
      .lc-progress-fill {
        height: 100%; border-radius: 2px; transition: width 0.3s ease;
      }
      .lc-progress-fill-red { background: var(--kl-red); }
      .lc-progress-fill-blue { background: var(--kl-blue); }
      .lc-progress-fill-gold { background: var(--kl-gold); }
      .lc-progress-fill-green { background: var(--kl-green); }
      .lc-progress-text { font-size: 9px; color: var(--kl-text3); margin-top: 2px; }
      .lc-msg { font-size: 10px; color: var(--kl-text3); margin-top: 2px; line-height: 1.3; }

      /* ── 学び直しレコメンド ── */
      .kl-recommend { }
      .kl-reco-item {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 12px; border-bottom: 1px solid var(--kl-border);
        text-decoration: none; color: var(--kl-text);
        font-size: 13px; transition: background 0.15s;
      }
      .kl-reco-item:hover { background: var(--kl-accent-soft); text-decoration: none; }
      .kl-reco-item:last-child { border-bottom: none; }
      .kl-reco-icon { font-size: 16px; flex-shrink: 0; }
      .kl-reco-reason { font-size: 10px; color: var(--kl-text3); }

      /* ── 学習グリッド ── */
      .learn-grid {
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
      }
      .learn-card {
        background: var(--kl-subtle); border: 1px solid var(--kl-border);
        border-radius: 10px; padding: 12px;
        display: flex; align-items: center; gap: 10px;
        transition: transform 0.15s, box-shadow 0.15s; cursor: pointer;
      }
      .learn-card:hover { transform: translateY(-2px); box-shadow: var(--kl-shadow-sm); }
      .lc-icon {
        width: 40px; height: 40px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; flex-shrink: 0;
      }
      .lc-icon-enmoku { background: var(--kl-red-soft); }
      .lc-icon-glossary { background: var(--kl-blue-soft); }
      .lc-icon-quiz { background: var(--kl-gold-soft); }
      .lc-icon-recent { background: var(--kl-green-soft); }
      .lc-label { font-size: 12px; color: var(--kl-text3); }
      .lc-value { font-size: 20px; font-weight: 700; color: var(--kl-text); line-height: 1.2; }
      .lc-value span { font-size: 13px; font-weight: 400; color: var(--kl-text2); }
      .lc-badge {
        display: inline-block; font-size: 11px; font-weight: 600;
        color: var(--kl-gold-dark); background: var(--kl-gold-soft);
        padding: 2px 8px; border-radius: 4px; margin-bottom: 2px;
      }

      /* ── 稽古メニュー ── */
      .practice-intro {
        font-size: 13px; color: var(--kl-text2); line-height: 1.7;
        margin-bottom: 12px; padding: 0 4px;
      }
      .practice-list { display: flex; flex-direction: column; gap: 10px; }
      .practice-item {
        display: flex; align-items: center; gap: 14px;
        background: var(--kl-subtle); border: 1px solid var(--kl-border);
        border-radius: 10px; padding: 14px 16px;
        cursor: pointer; transition: all 0.15s; text-decoration: none; color: inherit;
      }
      .practice-item:hover {
        border-color: var(--kl-gold-light); background: var(--kl-accent-soft);
        transform: translateX(4px); text-decoration: none;
      }
      .pi-icon { font-size: 22px; flex-shrink: 0; }
      .pi-text { flex: 1; }
      .pi-title { font-size: 14px; font-weight: 500; color: var(--kl-text); }
      .pi-desc { font-size: 12px; color: var(--kl-text3); }
      .pi-arrow { color: var(--kl-text3); font-size: 14px; transition: transform 0.15s; }
      .practice-item:hover .pi-arrow { transform: translateX(3px); color: var(--kl-gold); }

      /* ── 最近の閲覧 ── */
      .mp-recent-heading {
        font-size: 12px; font-weight: 600; color: var(--kl-text3);
        margin: 16px 0 8px; letter-spacing: 1px;
      }

      /* ── 推しの観劇ログ ── */
      .oshi-log-filters {
        display: flex; gap: 6px; flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .oshi-log-filter-btn {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 6px 14px; border-radius: 20px;
        font-size: 12px; font-family: inherit; font-weight: 500;
        border: 1px solid var(--kl-border2); background: var(--kl-card);
        color: var(--kl-text2); cursor: pointer;
        transition: all 0.15s; letter-spacing: 0.3px;
      }
      .oshi-log-filter-btn:hover {
        border-color: var(--kl-gold); color: var(--kl-gold-dark);
        background: var(--kl-gold-soft);
      }
      .oshi-log-filter-active {
        background: linear-gradient(135deg, var(--kl-gold), var(--kl-gold-dark));
        color: #fff; border-color: var(--kl-gold);
      }
      .oshi-log-filter-active:hover {
        background: linear-gradient(135deg, var(--kl-gold), var(--kl-gold-dark));
        color: #fff;
      }
      .oshi-log-entry {
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: var(--kl-radius); margin-bottom: 10px;
        box-shadow: var(--kl-shadow-sm); overflow: hidden;
        transition: transform 0.15s, box-shadow 0.15s;
      }
      .oshi-log-entry:hover {
        transform: translateY(-1px); box-shadow: var(--kl-shadow-md);
      }
      .oshi-log-entry-header {
        display: flex; align-items: flex-start; gap: 12px;
        padding: 14px 16px;
      }
      .oshi-log-date {
        text-align: center; flex-shrink: 0;
        background: var(--kl-red-soft); border-radius: 8px;
        padding: 4px 10px; min-width: 50px;
      }
      .oshi-log-date-m { font-size: 10px; color: var(--kl-red); font-weight: 500; }
      .oshi-log-date-d { font-size: 22px; font-weight: 700; color: var(--kl-red); line-height: 1.2; }
      .oshi-log-info { flex: 1; min-width: 0; }
      .oshi-log-venue {
        display: inline-block; font-size: 10px; color: var(--kl-text3);
        background: var(--kl-subtle); padding: 1px 7px;
        border-radius: 4px; margin-bottom: 3px;
      }
      .oshi-log-perf {
        font-size: 14px; font-weight: 600; color: var(--kl-text);
        line-height: 1.4;
      }
      .oshi-log-plays {
        font-size: 12px; color: var(--kl-text2); margin-top: 3px;
      }
      .oshi-log-plays a {
        color: var(--kl-gold-dark); text-decoration: none;
      }
      .oshi-log-plays a:hover { text-decoration: underline; }
      .oshi-log-role {
        display: flex; align-items: center; gap: 6px;
        padding: 8px 16px; border-top: 1px solid var(--kl-border);
        font-size: 12px; color: var(--kl-text2);
        background: var(--kl-subtle);
      }
      .oshi-log-role-label {
        font-weight: 600; color: var(--kl-gold-dark);
      }
      .oshi-log-memo {
        padding: 10px 16px; border-top: 1px solid var(--kl-border);
        font-size: 13px; color: var(--kl-text); line-height: 1.6;
        background: var(--kl-accent-soft);
      }
      .oshi-log-no-entries {
        text-align: center; padding: 24px 16px;
        font-size: 13px; color: var(--kl-text3);
      }

      /* ── 推し俳優誘導バナー ── */
      .oshi-banner {
        display: flex; align-items: center; gap: 14px;
        background: linear-gradient(135deg, var(--kl-gold-soft) 0%, var(--kl-accent-soft) 100%);
        border: 1px solid var(--kl-gold-light);
        border-radius: var(--kl-radius);
        padding: 16px 20px; margin-bottom: 20px;
        cursor: pointer; transition: all 0.2s;
        box-shadow: var(--kl-shadow-sm);
      }
      .oshi-banner:hover {
        border-color: var(--kl-gold);
        box-shadow: var(--kl-shadow-md);
        transform: translateY(-1px);
      }
      .oshi-banner-icon { font-size: 28px; flex-shrink: 0; }
      .oshi-banner-body { flex: 1; min-width: 0; }
      .oshi-banner-title {
        font-size: 15px; font-weight: 600; color: var(--kl-gold-dark);
        letter-spacing: 0.5px; margin-bottom: 2px;
      }
      .oshi-banner-desc { font-size: 12px; color: var(--kl-text2); line-height: 1.5; }
      .oshi-banner-arrow {
        font-size: 16px; color: var(--kl-gold); flex-shrink: 0;
        transition: transform 0.15s;
      }
      .oshi-banner:hover .oshi-banner-arrow { transform: translateX(3px); }
      .oshi-banner-has {
        background: var(--kl-card);
        border-color: var(--kl-border);
      }
      .oshi-banner-has:hover { border-color: var(--kl-gold); }
      .oshi-banner-count {
        font-size: 13px; font-weight: 400; color: var(--kl-text2);
        margin-left: 4px;
      }

      /* 推し俳優セクション（登録済み） */
      .oshi-section {
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: var(--kl-radius); box-shadow: var(--kl-shadow-sm);
        margin-bottom: 20px; overflow: hidden;
      }
      .oshi-section-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 20px; border-bottom: 1px solid var(--kl-border);
        cursor: pointer; transition: background 0.15s;
      }
      .oshi-section-header:hover { background: var(--kl-accent-soft); }
      .oshi-section-title {
        font-size: 14px; font-weight: 600; color: var(--kl-text); letter-spacing: 0.5px;
      }
      .oshi-section-count { font-size: 13px; font-weight: 400; color: var(--kl-text3); margin-left: 4px; }
      .oshi-section-manage { font-size: 12px; color: var(--kl-gold-dark); transition: transform 0.15s; }
      .oshi-section-header:hover .oshi-section-manage { transform: translateX(2px); }
      .oshi-news-btn {
        display: block; width: calc(100% - 40px); margin: 10px 20px 16px;
        padding: 10px 16px; background: var(--kl-subtle); color: var(--kl-gold-dark);
        border: 1px solid var(--kl-border); border-radius: var(--kl-radius);
        font-size: 13px; font-weight: 500; font-family: inherit;
        cursor: pointer; transition: all 0.15s; text-align: center;
      }
      .oshi-news-btn:hover { border-color: var(--kl-gold); background: var(--kl-gold-soft); }
      .oshi-news-btn:disabled { opacity: 0.6; cursor: wait; }

      .oshi-profiles {
        display: flex; gap: 12px; padding: 16px 20px;
        overflow-x: auto; -webkit-overflow-scrolling: touch;
      }
      .oshi-profiles::-webkit-scrollbar { height: 3px; }
      .oshi-profiles::-webkit-scrollbar-thumb { background: var(--kl-border2); border-radius: 3px; }

      .oshi-profile-card {
        flex-shrink: 0; width: 90px;
        display: flex; flex-direction: column; align-items: center;
        text-align: center; gap: 4px;
      }
      .oshi-profile-yago-icon {
        width: 48px; height: 48px; border-radius: 50%;
        background: linear-gradient(135deg, var(--kl-gold-soft), var(--kl-gold-warm));
        border: 2px solid var(--kl-gold-light);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; color: var(--kl-gold-dark);
        letter-spacing: -0.5px; line-height: 1;
      }
      .oshi-profile-yago-empty {
        background: var(--kl-subtle); border-color: var(--kl-border);
        font-size: 20px; font-weight: 400;
      }
      .oshi-profile-name {
        font-size: 12px; font-weight: 600; color: var(--kl-text);
        line-height: 1.3; max-width: 90px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }

      /* ── 区切り線 ── */
      .tl-divider { border: 0; border-top: 1px solid var(--kl-border); margin: 28px 0; }

      /* ── 推し俳優検索 ── */
      .fav-search-input {
        width: 100%; box-sizing: border-box;
        padding: 0.6rem 0.8rem; border: 1px solid var(--kl-border2);
        border-radius: 8px; background: var(--kl-card); color: var(--kl-text);
        font-size: 0.9rem; font-family: inherit; margin-bottom: 0.5rem;
      }
      .fav-search-input:focus { border-color: var(--kl-gold); outline: none; }
      .fav-search-results { max-height: 60vh; overflow-y: auto; }
      /* 全俳優から探すボタン */
      .btn-all-actors {
        display: block; width: 100%; margin-top: 12px;
        padding: 10px 16px; font-size: 13px; font-weight: 600;
        font-family: 'Noto Serif JP', serif; letter-spacing: 0.04em;
        color: var(--kl-gold-dark, #8b6914); background: var(--kl-gold-soft, #fdf8ec);
        border: 1px solid var(--kl-gold-light); border-radius: 8px; cursor: pointer;
        transition: all 0.15s; text-align: center;
      }
      .btn-all-actors:hover { background: var(--kl-gold, #c9a227); color: #fff; border-color: var(--kl-gold, #c9a227); }
      .fav-actor-card {
        display: flex; align-items: center; gap: 0.6rem;
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: var(--kl-radius); padding: 0.5rem 0.7rem;
        margin-bottom: 0.4rem; cursor: pointer; transition: all 0.2s;
      }
      .fav-actor-card:hover { border-color: var(--kl-gold); }
      .fav-actor-selected { border-color: var(--kl-gold); background: rgba(197,162,85,0.08); }
      .fav-actor-registered { cursor: default; }
      .fav-actor-icon {
        width: 36px; height: 36px; border-radius: 50%;
        background: var(--kl-gold-soft);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.1rem; flex-shrink: 0;
      }
      .fav-actor-yago-badge {
        width: 36px; height: 36px; border-radius: 50%;
        background: linear-gradient(135deg, var(--kl-gold-soft), var(--kl-gold-warm));
        border: 2px solid var(--kl-gold-light);
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; font-weight: 700; color: var(--kl-gold-dark);
        letter-spacing: -0.5px; line-height: 1; flex-shrink: 0;
      }
      .fav-actor-info { flex: 1; min-width: 0; }
      .fav-actor-name { font-size: 0.88rem; font-weight: 500; color: var(--kl-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .fav-actor-sub { font-size: 0.72rem; color: var(--kl-text3); margin-top: 1px; }
      .fav-actor-remove {
        padding: 0.3rem 0.6rem; border: 1px solid var(--kl-border2);
        border-radius: 6px; background: transparent; color: var(--kl-text3);
        font-size: 0.72rem; font-family: inherit; cursor: pointer; flex-shrink: 0;
      }
      .fav-actor-remove:hover { border-color: var(--kl-red); color: var(--kl-red); }
      .fav-actor-badge {
        padding: 0.2rem 0.5rem; border-radius: 4px;
        font-size: 0.68rem; font-weight: 600; flex-shrink: 0;
        color: var(--kl-gold-dark); background: var(--kl-gold-soft);
      }
      .fav-actor-badge-add { color: var(--kl-text3); background: var(--kl-subtle); }

      /* 屋号タブ */
      .yago-tabs {
        display: flex; flex-wrap: wrap; gap: 6px;
        margin-bottom: 12px; padding-bottom: 8px;
        max-height: 120px; overflow-y: auto;
      }
      .yago-tabs::-webkit-scrollbar { width: 3px; }
      .yago-tabs::-webkit-scrollbar-thumb { background: var(--kl-border2); border-radius: 3px; }
      .yago-tab {
        padding: 5px 12px; border: 1px solid var(--kl-border);
        border-radius: 20px; background: var(--kl-card); color: var(--kl-text2);
        font-size: 12px; font-family: inherit; cursor: pointer;
        white-space: nowrap; transition: all 0.15s;
      }
      .yago-tab:hover { border-color: var(--kl-gold); color: var(--kl-gold-dark); }
      .yago-tab-active {
        background: var(--kl-gold); color: #fff; border-color: var(--kl-gold);
        font-weight: 600;
      }
      .yago-tab-active:hover { background: var(--kl-gold-dark); }
      .yago-tab-count {
        font-size: 10px; opacity: 0.7; margin-left: 2px;
      }
      .yago-actor-list {
        max-height: 60vh; overflow-y: auto;
      }
      .yago-actor-list::-webkit-scrollbar { width: 4px; }
      .yago-actor-list::-webkit-scrollbar-thumb { background: var(--kl-border2); border-radius: 4px; }

      /* 推しニュース検索ボタン */
      .fav-news-btn {
        display: flex; align-items: center; justify-content: center; gap: 6px;
        width: 100%; padding: 12px 16px; margin-top: 12px;
        background: linear-gradient(135deg, var(--kl-gold), var(--kl-gold-dark));
        color: #fff; border: none; border-radius: var(--kl-radius);
        font-size: 14px; font-weight: 600; font-family: 'Noto Serif JP', serif;
        letter-spacing: 1px; cursor: pointer;
        box-shadow: var(--kl-shadow-sm); transition: transform 0.15s, box-shadow 0.15s;
      }
      .fav-news-btn:hover { transform: translateY(-1px); box-shadow: var(--kl-shadow-md); }
      .fav-news-btn:disabled { opacity: 0.6; cursor: wait; transform: none; }
      .fav-news-results { margin-top: 12px; }
      .fav-news-header {
        font-size: 14px; font-weight: 600; color: var(--kl-text);
        margin-bottom: 8px; letter-spacing: 0.5px;
      }
      .fav-news-empty {
        padding: 16px; text-align: center; font-size: 13px;
        color: var(--kl-text3); background: var(--kl-subtle);
        border-radius: var(--kl-radius);
      }

      /* ── 推し俳優モーダル ── */
      .fav-modal-overlay {
        position: fixed; inset: 0; z-index: 1000;
        background: rgba(30, 25, 20, 0.75);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        animation: fadeIn 0.2s ease-out;
        backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

      /* ── バッジ解除演出 ── */
      .badge-celebration-overlay {
        position: fixed; inset: 0; z-index: 2000;
        background: rgba(20, 15, 10, 0.8);
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
        animation: fadeIn 0.3s ease-out;
        backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      }
      .badge-celebration {
        background: var(--bg-page, #FAF7F2); border-radius: 20px;
        box-shadow: 0 16px 48px rgba(30, 25, 20, 0.4);
        width: 100%; max-width: 320px;
        text-align: center; padding: 40px 24px 28px;
        animation: slideUp 0.35s ease-out;
      }
      .badge-celebration-icon {
        font-size: 64px; line-height: 1;
        animation: badgeBounce 0.6s ease-out;
        display: inline-block;
        filter: drop-shadow(0 0 12px rgba(242, 208, 107, 0.6));
      }
      .badge-celebration-label {
        margin-top: 4px; font-size: 11px; letter-spacing: 1px;
        color: var(--kl-gold-dark); font-weight: 600; text-transform: uppercase;
      }
      .badge-celebration-name {
        margin-top: 12px; font-size: 20px; font-weight: 700;
        color: var(--kl-text); letter-spacing: 0.5px;
      }
      .badge-celebration-desc {
        margin-top: 6px; font-size: 13px; color: var(--kl-text2); line-height: 1.5;
      }
      .badge-celebration-ok {
        margin-top: 24px; padding: 10px 32px;
        background: var(--kl-gold); color: #fff; border: none; border-radius: 8px;
        font-size: 14px; font-weight: 600; font-family: inherit; cursor: pointer;
        transition: background 0.15s;
      }
      .badge-celebration-ok:hover { background: var(--kl-gold-dark); }
      @keyframes badgeBounce {
        0%   { transform: scale(0.3) rotate(-15deg); opacity: 0; }
        50%  { transform: scale(1.25) rotate(5deg); opacity: 1; }
        70%  { transform: scale(0.9) rotate(-2deg); }
        100% { transform: scale(1) rotate(0deg); }
      }

      .fav-modal {
        background: var(--bg-page, #FAF7F2); border-radius: 16px;
        box-shadow: 0 12px 40px rgba(30, 25, 20, 0.35);
        width: 100%; max-width: 560px; max-height: 85vh;
        display: flex; flex-direction: column;
        animation: slideUp 0.25s ease-out;
      }
      @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      .fav-modal-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px; border-bottom: 1px solid var(--kl-border);
        flex-shrink: 0;
      }
      .fav-modal-title {
        font-size: 16px; font-weight: 600; color: var(--kl-text);
        margin: 0; letter-spacing: 0.5px;
      }
      .fav-modal-close {
        background: none; border: none; font-size: 18px; color: var(--kl-text3);
        cursor: pointer; padding: 4px 8px; border-radius: 6px;
        transition: all 0.15s;
      }
      .fav-modal-close:hover { background: var(--kl-subtle); color: var(--kl-text); }
      .fav-modal-body {
        overflow-y: auto; padding: 16px 20px; flex: 1;
        -webkit-overflow-scrolling: touch;
      }
      .fav-modal-body::-webkit-scrollbar { width: 4px; }
      .fav-modal-body::-webkit-scrollbar-thumb { background: var(--kl-border2); border-radius: 4px; }

      /* ── 推しニュース ── */
      .oshi-news-card {
        display: block; padding: 0.6rem 0.5rem;
        border-bottom: 1px solid var(--kl-border); text-decoration: none;
        transition: background 0.15s;
      }
      .oshi-news-card:hover { background: var(--kl-accent-soft); }
      .oshi-news-title { font-size: 0.82rem; color: var(--kl-text); line-height: 1.5; }
      .oshi-highlight { color: var(--kl-red); font-weight: 700; }
      .oshi-news-meta { display: flex; gap: 0.5rem; font-size: 0.68rem; color: var(--kl-text3); margin-top: 2px; }
      .oshi-news-more { font-size: 0.75rem; color: var(--kl-gold-dark); text-decoration: none; }
      .oshi-news-more:hover { text-decoration: underline; }

      /* レスポンシブ */
      @media (max-width: 480px) {
        .learn-grid { grid-template-columns: 1fr; }
        .tl-stats { gap: 8px; }
        .tl-stat-card { padding: 16px 8px; }
        .tl-stat-num { font-size: 26px; }
      }

      /* ═══════════════════════════════════════
         観劇ログ CTA
      ═══════════════════════════════════════ */
      .tl-cta {
        display: flex; align-items: center; justify-content: center; gap: 0.6rem;
        width: 100%;
        padding: 1rem;
        border-radius: 14px;
        border: 2px dashed var(--gold);
        background: linear-gradient(135deg, rgba(201,162,39,0.08) 0%, rgba(201,162,39,0.02) 100%);
        color: var(--gold-dark);
        font-size: 1rem;
        font-weight: bold;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.25s;
        letter-spacing: 0.08em;
        margin-bottom: 1.2rem;
      }
      .tl-cta:hover {
        background: linear-gradient(135deg, rgba(201,162,39,0.15) 0%, rgba(201,162,39,0.05) 100%);
        border-color: var(--gold);
        box-shadow: 0 4px 16px rgba(201,162,39,0.15);
        transform: translateY(-2px);
      }
      .tl-cta-icon { font-size: 1.3rem; }

      /* ═══════════════════════════════════════
         入力フォーム
      ═══════════════════════════════════════ */
      .tl-form {
        background: var(--kl-card); border: 1px solid var(--kl-border);
        border-radius: var(--kl-radius); padding: 1.2rem;
        margin-bottom: 1.2rem; box-shadow: var(--kl-shadow-sm);
        animation: tl-slide-in 0.25s ease;
      }
      @keyframes tl-slide-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .tl-form-title {
        font-size: 1rem; font-weight: 600; color: var(--kl-text);
        margin-bottom: 1rem; letter-spacing: 0.1em;
        display: flex; align-items: center; justify-content: space-between;
      }
      .tl-form-close {
        background: none; border: none; color: var(--kl-text3); font-size: 1.2rem;
        cursor: pointer; padding: 2px 6px; border-radius: 6px;
        transition: all 0.15s; font-family: inherit;
      }
      .tl-form-close:hover { color: var(--kl-text); background: rgba(0,0,0,0.04); }

      .tl-step { margin-bottom: 1rem; animation: tl-step-in 0.2s ease; }
      @keyframes tl-step-in {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .tl-step-hidden { display: none; }
      .tl-step-label {
        font-size: 0.82rem; font-weight: 600; color: var(--kl-text2);
        margin-bottom: 0.5rem; letter-spacing: 0.08em;
      }
      .tl-step-label .tl-step-num {
        display: inline-flex; align-items: center; justify-content: center;
        width: 20px; height: 20px; border-radius: 50%;
        background: var(--kl-gold); color: #fff;
        font-size: 0.68rem; font-weight: 900; margin-right: 0.4rem;
      }
      .tl-step-check { color: var(--kl-green); margin-left: 0.4rem; font-size: 0.82rem; }

      .tl-date-input {
        padding: 0.6rem 1rem; border-radius: 10px;
        border: 1.5px solid var(--kl-border2); background: var(--kl-subtle);
        color: var(--kl-text); font-size: 0.95rem; font-family: inherit;
        width: 100%; max-width: 220px; transition: border-color 0.15s;
      }
      .tl-date-input:focus { border-color: var(--kl-gold); outline: none; }

      .tl-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
      .tl-chip {
        padding: 0.5rem 0.9rem; border-radius: 999px;
        border: 1.5px solid var(--kl-border2); background: var(--kl-subtle);
        color: var(--kl-text); font-size: 0.82rem; font-family: inherit;
        cursor: pointer; transition: all 0.15s; white-space: nowrap;
      }
      .tl-chip:hover { border-color: var(--kl-gold); }
      .tl-chip-active {
        border-color: var(--kl-gold) !important;
        background: var(--kl-gold-soft) !important;
        color: var(--kl-gold-dark) !important; font-weight: bold;
      }
      .tl-chip-group-label { font-size: 0.72rem; color: var(--kl-text3); margin: 0.4rem 0 0.2rem; width: 100%; }

      .tl-venue-custom { display: flex; gap: 0.4rem; margin-top: 0.4rem; align-items: center; }
      .tl-venue-custom-input {
        padding: 0.45rem 0.8rem; border-radius: 10px;
        border: 1.5px solid var(--kl-border2); background: var(--kl-subtle);
        color: var(--kl-text); font-size: 0.82rem; font-family: inherit;
        flex: 1; max-width: 200px; transition: border-color 0.15s;
      }
      .tl-venue-custom-input:focus { border-color: var(--kl-gold); outline: none; }
      .tl-venue-custom-btn {
        padding: 0.45rem 0.7rem; border-radius: 10px;
        border: 1.5px solid var(--kl-gold); background: var(--kl-gold-soft);
        color: var(--kl-gold-dark); font-size: 0.78rem; font-family: inherit;
        cursor: pointer; transition: all 0.15s; font-weight: bold;
      }
      .tl-venue-custom-btn:hover { background: var(--kl-gold-light); }

      .tl-perf-cards { display: flex; flex-direction: column; gap: 0.4rem; }
      .tl-perf-card {
        padding: 0.6rem 0.9rem; border-radius: 10px;
        border: 1.5px solid var(--kl-border); background: var(--kl-card);
        cursor: pointer; transition: all 0.15s; box-shadow: var(--kl-shadow-sm);
      }
      .tl-perf-card:hover { border-color: var(--kl-gold); }
      .tl-perf-card-active { border-color: var(--kl-gold) !important; background: var(--kl-gold-soft) !important; }
      .tl-perf-card-title { font-size: 0.88rem; font-weight: 600; color: var(--kl-text); line-height: 1.4; }
      .tl-perf-card-period { font-size: 0.72rem; color: var(--kl-text3); margin-top: 2px; }
      .tl-perf-card-status { font-size: 0.68rem; color: var(--kl-green); margin-top: 2px; }
      .tl-perf-loading { font-size: 0.82rem; color: var(--kl-text3); padding: 0.5rem 0; }
      .tl-perf-none { font-size: 0.82rem; color: var(--kl-text3); padding: 0.5rem 0; }

      .tl-play-input {
        padding: 0.5rem 0.8rem; border-radius: 10px;
        border: 1.5px solid var(--kl-border2); background: var(--kl-subtle);
        color: var(--kl-text); font-size: 0.85rem; font-family: inherit;
        width: 100%; transition: border-color 0.15s;
      }
      .tl-play-input:focus { border-color: var(--kl-gold); outline: none; }
      .tl-play-hint { font-size: 0.72rem; color: var(--kl-text3); margin-top: 0.3rem; }
      .tl-play-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.4rem; }
      .tl-play-tag {
        display: inline-flex; align-items: center; gap: 0.3rem;
        padding: 0.3rem 0.7rem; border-radius: 999px;
        background: var(--kl-gold-soft); border: 1px solid var(--kl-gold-light);
        color: var(--kl-gold-dark); font-size: 0.78rem;
      }
      .tl-play-tag-remove {
        background: none; border: none; color: var(--kl-text3);
        font-size: 0.82rem; cursor: pointer; padding: 0; line-height: 1; font-family: inherit;
      }
      .tl-play-tag-remove:hover { color: var(--kl-red); }

      .tl-memo-input {
        padding: 0.5rem 0.8rem; border-radius: 10px;
        border: 1.5px solid var(--kl-border2); background: var(--kl-subtle);
        color: var(--kl-text); font-size: 0.85rem; font-family: inherit;
        width: 100%; min-height: 60px; resize: vertical; transition: border-color 0.15s;
      }
      .tl-memo-input:focus { border-color: var(--kl-gold); outline: none; }

      /* ── 写真アップロード ── */
      .tl-upload-status { font-size: 12px; margin-left: 8px; }
      .tl-image-preview { position: relative; display: inline-block; margin-top: 8px; }
      .tl-image-preview img {
        max-width: 100%; max-height: 200px; border-radius: 8px;
        border: 1px solid var(--kl-border); display: block;
      }
      .tl-image-remove {
        position: absolute; top: 4px; right: 4px;
        background: rgba(0,0,0,0.6); color: #fff; border: none;
        border-radius: 50%; width: 24px; height: 24px;
        font-size: 14px; cursor: pointer; line-height: 24px; text-align: center;
      }
      .tl-entry-image { margin-top: 10px; }
      .tl-entry-image img {
        max-width: 100%; border-radius: 8px; cursor: pointer;
        border: 1px solid var(--kl-border);
      }
      /* ── 画像拡大モーダル ── */
      .tl-image-lightbox {
        position: fixed; inset: 0; z-index: 2000;
        background: rgba(0,0,0,0.85); display: flex;
        align-items: center; justify-content: center;
        padding: 20px; cursor: pointer;
        animation: fadeIn 0.2s ease-out;
      }
      .tl-image-lightbox img {
        max-width: 95%; max-height: 90vh; border-radius: 4px;
        object-fit: contain;
      }

      .tl-save-row { margin-top: 1rem; display: flex; gap: 0.5rem; }
      .tl-save-btn {
        flex: 1; padding: 0.8rem; border-radius: 12px; border: none;
        background: linear-gradient(135deg, var(--kl-gold), var(--kl-gold-dark));
        color: #fff; font-size: 0.95rem; font-weight: 700; font-family: inherit;
        cursor: pointer; transition: all 0.2s; letter-spacing: 0.1em;
      }
      .tl-save-btn:hover { box-shadow: 0 6px 20px rgba(197,162,85,0.25); transform: translateY(-2px); }
      .tl-save-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

      /* メディアフォーム用 */
      .tl-text-input {
        padding: 0.6rem 1rem; border-radius: 10px;
        border: 1.5px solid var(--kl-border2); background: var(--kl-subtle);
        color: var(--kl-text); font-size: 0.9rem; font-family: inherit;
        width: 100%; transition: border-color 0.15s; box-sizing: border-box;
      }
      .tl-text-input:focus { border-color: var(--kl-gold); outline: none; }
      .tl-inline-add { display: flex; gap: 0.4rem; align-items: center; }
      .tl-inline-add .tl-text-input { flex: 1; }
      .tl-add-btn {
        padding: 0.55rem 1rem; border-radius: 10px;
        border: 1.5px solid var(--kl-gold); background: var(--kl-gold-soft);
        color: var(--kl-gold-dark); font-size: 0.82rem; font-family: inherit;
        cursor: pointer; transition: all 0.15s; font-weight: bold;
        white-space: nowrap;
      }
      .tl-add-btn:hover { background: var(--kl-gold-light); }
      .tl-selected-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.5rem; }
      .tl-tag {
        display: inline-flex; align-items: center; gap: 0.3rem;
        padding: 0.3rem 0.7rem; border-radius: 999px;
        background: var(--kl-gold-soft); border: 1px solid var(--kl-gold-light);
        color: var(--kl-gold-dark); font-size: 0.78rem;
      }
      .tl-tag-remove {
        background: none; border: none; color: var(--kl-text3);
        font-size: 0.82rem; cursor: pointer; padding: 0; line-height: 1; font-family: inherit;
      }
      .tl-tag-remove:hover { color: var(--kl-red); }
      .tl-hint { font-size: 0.72rem; color: var(--kl-text3); margin-top: 0.3rem; }

      /* 映像鑑賞ログセクション */
      .media-stats { }
      .media-entry { border-left-color: var(--kl-blue); }
      .media-type-tag {
        background: var(--kl-blue-bg); color: var(--kl-blue-text); font-weight: 600;
      }
      .tl-entry-actors-text { font-size: 0.82rem; color: var(--kl-text2); margin-top: 0.2rem; }
      .media-empty { color: var(--kl-text3); }

      /* 演目チェック候補 */
      .tl-play-candidates { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.4rem; }
      .tl-play-program-label { font-size: 0.75rem; color: var(--kl-text3); margin: 0.3rem 0 0.1rem; letter-spacing: 0.06em; font-weight: bold; }
      .tl-play-check {
        display: flex; align-items: center; gap: 0.5rem;
        padding: 0.5rem 0.8rem; border-radius: 10px;
        border: 1.5px solid var(--kl-border2); background: var(--kl-subtle);
        cursor: pointer; transition: all 0.15s; user-select: none;
      }
      .tl-play-check:hover { border-color: var(--kl-gold); }
      .tl-play-check-active { border-color: var(--kl-gold) !important; background: var(--kl-gold-soft) !important; }
      .tl-play-check-box {
        display: flex; align-items: center; justify-content: center;
        width: 20px; height: 20px; border-radius: 5px;
        border: 2px solid var(--kl-border2); font-size: 0.72rem; font-weight: 900;
        flex-shrink: 0; transition: all 0.15s; color: var(--kl-gold-dark);
      }
      .tl-play-check-active .tl-play-check-box { border-color: var(--kl-gold); background: var(--kl-gold-soft); }
      .tl-play-check-content { display: flex; flex-direction: column; gap: 1px; }
      .tl-play-check-label { font-size: 0.88rem; color: var(--kl-text); font-weight: 600; }
      .tl-play-check-actors { font-size: 0.7rem; color: var(--kl-text3); letter-spacing: 0.02em; }
      .tl-perf-card-plays { font-size: 0.68rem; color: var(--kl-green); margin-top: 2px; }

      /* ── 月次アクティビティカレンダー ── */
      .kl-month-cal {
        display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px;
        margin-top: 6px;
      }
      .kl-cal-header-cell {
        text-align: center; font-size: 10px; color: var(--kl-text3);
        padding: 2px 0; font-weight: 500;
      }
      .kl-cal-header-cell:first-child { color: var(--kl-red); }
      .kl-cal-header-cell:last-child  { color: var(--kl-blue); }
      .kl-cal-cell {
        aspect-ratio: 1; border-radius: 4px;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; color: var(--kl-text3);
      }
      .kl-cal-empty {}
      .kl-cal-theater { background: var(--kl-red-soft); color: var(--kl-red); font-weight: 600; }
      .kl-cal-media   { background: var(--kl-blue-bg); color: var(--kl-blue-text); font-weight: 600; }
      .kl-cal-activity { background: var(--kl-accent-soft); color: var(--kl-gold-dark); }
      .kl-cal-today {
        background: var(--kl-gold-soft); color: var(--kl-gold-dark);
        font-weight: 700; border: 1px solid var(--kl-gold-light);
      }
      .kl-cal-theater.kl-cal-today, .kl-cal-media.kl-cal-today {
        border-color: var(--kl-red);
      }
      .kl-cal-legend {
        display: flex; gap: 10px; flex-wrap: wrap;
        margin-top: 8px; padding-top: 8px;
        border-top: 1px solid var(--kl-border);
        font-size: 10px; color: var(--kl-text3);
      }
      .kl-cal-leg { display: flex; align-items: center; gap: 4px; }
      .kl-cal-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }

    </style>

    <script>
    window.__GOOGLE_CLIENT_ID = ${JSON.stringify(googleClientId)};
    </script>
    <script>
    (function(){
      var app = document.getElementById("app");

      /* =====================================================
         認証状態管理
      ===================================================== */
      var authState = { loggedIn: false, user: null, checked: false, serverData: null };

      function checkAuth(callback) {
        fetch('/api/auth/me', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            authState.checked = true;
            authState.loggedIn = !!data.loggedIn;
            authState.user = data.user || null;
            if (authState.loggedIn) {
              loadServerData(callback);
            } else {
              if (callback) callback();
            }
          })
          .catch(function() {
            authState.checked = true;
            if (callback) callback();
          });
      }

      function loadServerData(callback) {
        fetch('/api/userdata', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (!data.error) {
              authState.serverData = data;
              syncFromServer(data);
            }
            if (callback) callback();
          })
          .catch(function() { if (callback) callback(); });
      }

      function syncFromServer(data) {
        if (data.theater_log && data.theater_log.entries && data.theater_log.entries.length > 0) {
          try { localStorage.setItem('theater_log_v1', JSON.stringify(data.theater_log)); } catch(e){}
        }
        if (data.favorite_actors && data.favorite_actors.length > 0) {
          try { localStorage.setItem('favorite_actors_v1', JSON.stringify(data.favorite_actors)); } catch(e){}
        }
        if (data.learning_log) {
          try { localStorage.setItem('keranosuke_log_v1', JSON.stringify(data.learning_log)); } catch(e){}
        }
        if (data.quiz_state) {
          try { localStorage.setItem('keranosuke_quiz_state', JSON.stringify(data.quiz_state)); } catch(e){}
        }
      }

      function saveToServer() {
        if (!authState.loggedIn) return;
        var payload = {
          theater_log: loadTlog(),
          learning_log: loadLog(),
          favorite_actors: loadFavorites(),
          quiz_state: loadQuizState(),
          updated_at: new Date().toISOString()
        };
        fetch('/api/userdata', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(function(e) { console.error('Server sync error:', e); });
      }

      function doMigration() {
        var data = {
          theater_log_v1: loadTlog(),
          favorite_actors_v1: loadFavorites(),
          keranosuke_log_v1: loadLog(),
          keranosuke_quiz_state: loadQuizState()
        };
        fetch('/api/auth/migrate', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        .then(function(r) { return r.json(); })
        .then(function(result) {
          if (result.ok) {
            loadServerData(function() { render(); });
          }
        })
        .catch(function(e) { console.error('Migration error:', e); });
      }


      /* =====================================================
         会場マスター
      ===================================================== */
      var VENUES = [
        { id: "kabukiza",  name: "歌舞伎座",   group: "大歌舞伎" },
        { id: "shinbashi", name: "新橋演舞場", group: "大歌舞伎" },
        { id: "osaka",     name: "大阪松竹座", group: "大歌舞伎" },
        { id: "kyoto",     name: "南座",       group: "大歌舞伎" },
        { id: "nagoya",    name: "御園座",     group: "大歌舞伎" },
        { id: "hakataza",  name: "博多座",     group: "大歌舞伎" }
      ];
      var SEAT_TYPES = [
        { id: "1F",  label: "1階" },
        { id: "2F",  label: "2階" },
        { id: "3F",  label: "3階" },
        { id: "BOX", label: "桟敷" },
        { id: "NA",  label: "未指定" }
      ];

      /* =====================================================
         観劇ログ CRUD (localStorage)
      ===================================================== */
      var TLOG_KEY = "theater_log_v1";

      function defaultTlog() { return { v: 1, entries: [] }; }
      function loadTlog() {
        try {
          var raw = localStorage.getItem(TLOG_KEY);
          if (!raw) return defaultTlog();
          var d = JSON.parse(raw);
          if (!Array.isArray(d.entries)) d.entries = [];
          return d;
        } catch(e) { return defaultTlog(); }
      }
      function saveTlog(tlog) {
        try { localStorage.setItem(TLOG_KEY, JSON.stringify(tlog)); } catch(e) {}
        saveToServer();
      }
      function addEntry(entry) {
        var tlog = loadTlog();
        entry.id = "tl_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        entry.created_at = Math.floor(Date.now() / 1000);
        tlog.entries.unshift(entry);
        saveTlog(tlog);
        /* XP加算（観劇記録=5XP） */
        addXP(5, 'theater_log');
        return tlog;
      }
      function removeEntry(id) {
        var tlog = loadTlog();
        tlog.entries = tlog.entries.filter(function(e){ return e.id !== id; });
        saveTlog(tlog);
        return tlog;
      }
      function updateEntry(id, fields) {
        var tlog = loadTlog();
        for (var i = 0; i < tlog.entries.length; i++) {
          if (tlog.entries[i].id === id) {
            for (var k in fields) {
              if (fields.hasOwnProperty(k)) tlog.entries[i][k] = fields[k];
            }
            tlog.entries[i].updated_at = Math.floor(Date.now() / 1000);
            break;
          }
        }
        saveTlog(tlog);
        return tlog;
      }

      /* =====================================================
         推し俳優 CRUD (localStorage)
      ===================================================== */
      var FAV_KEY = "favorite_actors_v1";
      function loadFavorites() {
        try { var r = localStorage.getItem(FAV_KEY); return r ? JSON.parse(r) : []; } catch(e) { return []; }
      }
      function saveFavorites(list) {
        try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch(e) {}
        saveToServer();
      }
      var MAX_FAVORITES = 5;
      function toggleFavorite(name) {
        var fav = loadFavorites();
        var idx = fav.indexOf(name);
        if (idx >= 0) {
          fav.splice(idx, 1);
        } else {
          if (fav.length >= MAX_FAVORITES) {
            alert('\\u63a8\\u3057\\u4ff3\\u512a\\u306e\\u767b\\u9332\\u306f' + MAX_FAVORITES + '\\u4eba\\u307e\\u3067\\u3067\\u3059\\u3002\\n\\u65e2\\u5b58\\u306e\\u767b\\u9332\\u3092\\u89e3\\u9664\\u3057\\u3066\\u304b\\u3089\\u8ffd\\u52a0\\u3057\\u3066\\u304f\\u3060\\u3055\\u3044\\u3002');
            return fav;
          }
          fav.push(name);
        }
        saveFavorites(fav);
        return fav;
      }
      function isFavorite(name) { return loadFavorites().indexOf(name) >= 0; }

      /* =====================================================
         閲覧ログ / クイズ（既存）
      ===================================================== */
      var LOG_KEY = "keranosuke_log_v1";
      function defaultLog() {
        return {
          v: 2, updated_at: 0, recent: [], clips: { enmoku: [], person: [], term: [] },
          practice: { serifu: { last_ts: 0, progress: 0 }, kakegoe: { last_ts: 0, best_great: 0, best_good: 0, best_miss: 0, sessions: 0 }, serifu_v2: {} },
          xp: 0, streak: { current: 0, last_date: '', best: 0 },
          badges: [], daily_log: {}
        };
      }
      function loadLog() {
        try {
          var raw = localStorage.getItem(LOG_KEY);
          if (!raw) return defaultLog();
          var log = JSON.parse(raw);
          if (!log.recent) log.recent = [];
          if (!log.clips) log.clips = {};
          if (!log.clips.enmoku) log.clips.enmoku = [];
          if (!log.clips.person) log.clips.person = [];
          if (!log.clips.term) log.clips.term = [];
          if (!log.practice) log.practice = { serifu: { last_ts: 0, progress: 0 } };
          if (!log.practice.kakegoe) log.practice.kakegoe = { last_ts: 0, best_great: 0, best_good: 0, best_miss: 0, sessions: 0 };
          if (!log.practice.serifu_v2) log.practice.serifu_v2 = {};
          if (typeof log.xp !== 'number') log.xp = 0;
          if (!log.streak) log.streak = { current: 0, last_date: '', best: 0 };
          if (!log.badges) log.badges = [];
          if (!log.daily_log) log.daily_log = {};
          return log;
        } catch(e) { return defaultLog(); }
      }
      function saveLog(log) {
        log.updated_at = Math.floor(Date.now() / 1000);
        try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch(e) {}
        saveToServer();
      }
      function loadQuizState() {
        try {
          var raw = localStorage.getItem("keranosuke_quiz_state");
          if (raw) return JSON.parse(raw);
        } catch(e) {}
        return { answered_total: 0, correct_total: 0, wrong_ids: [] };
      }

      /* =====================================================
         XP / レベル計算
      ===================================================== */
      var XP_VALUES = { view_enmoku: 1, save_clip: 2, quiz_correct: 3, theater_log: 5, keiko_complete: 3 };
      var LEVEL_TABLE = [
        { xp: 0, level: 1, title: '見習い' },
        { xp: 10, level: 2, title: '前座' },
        { xp: 30, level: 3, title: '名題下' },
        { xp: 60, level: 4, title: '名題' },
        { xp: 100, level: 5, title: '幹部' },
        { xp: 160, level: 6, title: '大幹部' },
        { xp: 250, level: 7, title: '人間国宝' }
      ];
      function calcLevel(xp) {
        var result = LEVEL_TABLE[0];
        for (var li = LEVEL_TABLE.length - 1; li >= 0; li--) {
          if (xp >= LEVEL_TABLE[li].xp) { result = LEVEL_TABLE[li]; break; }
        }
        var nextIdx = -1;
        for (var ni = 0; ni < LEVEL_TABLE.length; ni++) {
          if (LEVEL_TABLE[ni].xp > xp) { nextIdx = ni; break; }
        }
        var next = nextIdx >= 0 ? LEVEL_TABLE[nextIdx] : null;
        var pct = 100;
        if (next) {
          var range = next.xp - result.xp;
          pct = range > 0 ? Math.floor(((xp - result.xp) / range) * 100) : 100;
        }
        return { level: result.level, title: result.title, xp: xp, nextXp: next ? next.xp : result.xp, pct: pct, nextTitle: next ? next.title : null };
      }
      function addXP(amount, reason) {
        var log = loadLog();
        log.xp = (log.xp || 0) + amount;
        /* 日次ログ */
        var today = todayStr();
        if (!log.daily_log) log.daily_log = {};
        if (!log.daily_log[today]) log.daily_log[today] = { views: 0, clips: 0, quiz: 0, keiko: 0, theater: 0 };
        if (reason === 'view_enmoku') log.daily_log[today].views++;
        else if (reason === 'save_clip') log.daily_log[today].clips++;
        else if (reason === 'quiz_correct') log.daily_log[today].quiz++;
        else if (reason === 'keiko_complete') log.daily_log[today].keiko++;
        else if (reason === 'theater_log') log.daily_log[today].theater++;
        saveLog(log);
        checkBadges(log);
        return log;
      }
      function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      }

      /* =====================================================
         ストリーク
      ===================================================== */
      function updateStreak() {
        var log = loadLog();
        var today = todayStr();
        if (log.streak.last_date === today) return log.streak;
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        var yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth()+1).padStart(2,'0') + '-' + String(yesterday.getDate()).padStart(2,'0');
        if (log.streak.last_date === yesterdayStr) {
          log.streak.current++;
        } else {
          log.streak.current = 1;
        }
        log.streak.last_date = today;
        if (log.streak.current > (log.streak.best || 0)) log.streak.best = log.streak.current;
        saveLog(log);
        return log.streak;
      }

      /* =====================================================
         実績バッジ
      ===================================================== */
      var BADGE_DEFS = [
        { id: 'first_theater', icon: '🎭', name: '初観劇', desc: '最初の観劇記録' },
        { id: 'enmoku10', icon: '📋', name: '演目通', desc: '演目を10件閲覧' },
        { id: 'term20', icon: '📘', name: '博識', desc: '用語を20件理解' },
        { id: 'quiz100', icon: '❓', name: '百問一答', desc: 'クイズ100問回答' },
        { id: 'kakegoe_done', icon: '📣', name: '声の達人', desc: '大向う稽古を完了' },
        { id: 'serifu3', icon: '🎤', name: '名台詞マスター', desc: '台詞稽古3演目完了' },
        { id: 'streak7', icon: '🔥', name: '一週間皆勤', desc: '7日連続学習' },
        { id: 'streak30', icon: '💎', name: '一ヶ月皆勤', desc: '30日連続学習' },
        { id: 'xp100', icon: '⭐', name: '歌舞伎通', desc: '累計100XP達成' },
        { id: 'xp250', icon: '👑', name: '歌舞伎マスター', desc: '累計250XP達成' },
        { id: 'theater10', icon: '🏛️', name: '常連', desc: '観劇記録10件' },
        { id: 'clip_all', icon: '📌', name: 'コレクター', desc: '理解+保存合計50件' }
      ];
      function checkBadges(log) {
        if (!log) log = loadLog();
        var qs = loadQuizState();
        var tlog = loadTlog();
        var prevBadges = (log.badges || []).slice();
        var earned = log.badges || [];
        function award(id) {
          if (earned.indexOf(id) < 0) earned.push(id);
        }
        /* チェック */
        if (tlog.entries.length >= 1) award('first_theater');
        if (tlog.entries.length >= 10) award('theater10');
        var viewedEnmoku = {};
        for (var ri = 0; ri < log.recent.length; ri++) {
          if (log.recent[ri].type === 'enmoku') viewedEnmoku[log.recent[ri].id] = true;
        }
        if (Object.keys(viewedEnmoku).length >= 10) award('enmoku10');
        if (log.clips.term.length >= 20) award('term20');
        if (qs.answered_total >= 100) award('quiz100');
        if (log.practice.kakegoe && log.practice.kakegoe.sessions >= 1) award('kakegoe_done');
        var serifuCount = Object.keys(log.practice.serifu_v2 || {}).length;
        if (serifuCount >= 3) award('serifu3');
        if ((log.streak.best || 0) >= 7) award('streak7');
        if ((log.streak.best || 0) >= 30) award('streak30');
        if ((log.xp || 0) >= 100) award('xp100');
        if ((log.xp || 0) >= 250) award('xp250');
        var totalClips = (log.clips.enmoku.length || 0) + (log.clips.person.length || 0) + (log.clips.term.length || 0);
        if (totalClips >= 50) award('clip_all');
        log.badges = earned;
        saveLog(log);
        /* 新規取得バッジを検出して演出 */
        var newBadges = [];
        for (var ni = 0; ni < earned.length; ni++) {
          if (prevBadges.indexOf(earned[ni]) < 0) newBadges.push(earned[ni]);
        }
        if (newBadges.length > 0) showBadgeCelebration(newBadges);
      }
      function showBadgeCelebration(badgeIds) {
        var queue = [];
        for (var i = 0; i < badgeIds.length; i++) {
          for (var j = 0; j < BADGE_DEFS.length; j++) {
            if (BADGE_DEFS[j].id === badgeIds[i]) { queue.push(BADGE_DEFS[j]); break; }
          }
        }
        if (!queue.length) return;
        var idx = 0;
        function showNext() {
          if (idx >= queue.length) return;
          var b = queue[idx];
          var overlay = document.createElement('div');
          overlay.className = 'badge-celebration-overlay';
          overlay.innerHTML = '<div class="badge-celebration">'
            + '<div class="badge-celebration-icon">' + b.icon + '</div>'
            + '<div class="badge-celebration-label">BADGE UNLOCKED</div>'
            + '<div class="badge-celebration-name">' + b.name + '</div>'
            + '<div class="badge-celebration-desc">' + b.desc + '</div>'
            + '<button class="badge-celebration-ok" onclick="this.closest(\\'.badge-celebration-overlay\\').remove()">OK</button>'
            + '</div>';
          document.body.appendChild(overlay);
          overlay.querySelector('.badge-celebration-ok').addEventListener('click', function() {
            idx++;
            setTimeout(showNext, 200);
          });
          overlay.addEventListener('click', function(ev) {
            if (ev.target === overlay) {
              overlay.remove();
              idx++;
              setTimeout(showNext, 200);
            }
          });
        }
        /* 最初のバッジは即表示、以降は1.5秒間隔（OKボタンで即進む） */
        showNext();
      }

      /* =====================================================
         ひとくちキャッシュ
      ===================================================== */
      var hitokuchiCache = null;

      /* =====================================================
         公演データ
      ===================================================== */
      var perfCache = null;
      function fetchPerformances(cb) {
        if (perfCache) { cb(perfCache); return; }
        fetch("/api/performances").then(function(r){ return r.json(); }).then(function(data){
          perfCache = (data && data.items) || [];
          cb(perfCache);
        }).catch(function(){ cb([]); });
      }

      /* period_text パース: "2026年2月2日（日）～25日（火）" → { start, end } */
      function parsePeriod(text) {
        if (!text) return null;
        var m = text.match(/(\\d{4})年(\\d{1,2})月(\\d{1,2})日/);
        if (!m) return null;
        var year = parseInt(m[1],10), month = parseInt(m[2],10), startDay = parseInt(m[3],10);
        var start = new Date(year, month-1, startDay);
        /* 終了日: まず「～3月26日」（月またぎ）を試す → なければ「～26日」（同月） */
        var mCross = text.match(/～\\s*(\\d{1,2})月(\\d{1,2})日/);
        var end;
        if (mCross) {
          /* 月またぎ: ～3月26日 */
          var em = parseInt(mCross[1],10);
          var ed = parseInt(mCross[2],10);
          end = new Date(year, em-1, ed);
        } else {
          var mSame = text.match(/～\\s*(\\d{1,2})日/);
          if (mSame) {
            /* 同月: ～26日 */
            end = new Date(year, month-1, parseInt(mSame[1],10));
          } else {
            /* フォールバック */
            end = new Date(year, month-1, startDay + 25);
          }
        }
        end.setHours(23,59,59);
        return { start: start, end: end };
      }

      function matchPerformances(allPerfs, dateStr, venueName) {
        var d = new Date(dateStr + "T00:00:00");
        /* デバッグ: 最初の3件の劇場名と期間をチェック */
        for (var dbg = 0; dbg < Math.min(3, allPerfs.length); dbg++) {
          var pp = allPerfs[dbg];
          var nameMatch = pp.theater === venueName;
          var nameChars = Array.from(pp.theater).map(function(c){ return c.charCodeAt(0).toString(16); }).join(",");
          var venueChars = Array.from(venueName).map(function(c){ return c.charCodeAt(0).toString(16); }).join(",");
          var pr = parsePeriod(pp.period_text);
        }
        return allPerfs.filter(function(p){
          if (p.theater !== venueName) return false;
          var pr = parsePeriod(p.period_text);
          if (!pr) return false;
          return d >= pr.start && d <= pr.end;
        });
      }

      /* =====================================================
         演目ガイドカタログ（enmoku link 用）
      ===================================================== */
      var enmokuCatalogCache = null;
      function fetchEnmokuCatalog(cb) {
        if (enmokuCatalogCache) { cb(enmokuCatalogCache); return; }
        fetch("/api/enmoku/catalog").then(function(r){ return r.json(); }).then(function(data){
          enmokuCatalogCache = Array.isArray(data) ? data : [];
          cb(enmokuCatalogCache);
        }).catch(function(){ enmokuCatalogCache = []; cb([]); });
      }
      /* 演目名で演目ガイド ID を検索（部分一致＋aliases） */
      function findEnmokuId(playTitle) {
        if (!enmokuCatalogCache || !playTitle) return null;
        var t = playTitle.replace(/\s+/g, "");
        for (var i = 0; i < enmokuCatalogCache.length; i++) {
          var e = enmokuCatalogCache[i];
          var s = (e.short || "").replace(/\s+/g, "");
          var f = (e.full || "").replace(/\s+/g, "");
          if (s && (s === t || t.indexOf(s) >= 0 || s.indexOf(t) >= 0)) return e.id;
          if (f && (f === t || t.indexOf(f) >= 0 || f.indexOf(t) >= 0)) return e.id;
          if (e.aliases) {
            for (var j = 0; j < e.aliases.length; j++) {
              var a = (e.aliases[j] || "").replace(/\s+/g, "");
              if (a && (a === t || t.indexOf(a) >= 0 || a.indexOf(t) >= 0)) return e.id;
            }
          }
        }
        return null;
      }

      /* 文字列 short が long の部分列かどうか判定 */
      function isSubseq(short, long) {
        var si = 0;
        for (var li = 0; li < long.length && si < short.length; li++) {
          if (long.charAt(li) === short.charAt(si)) si++;
        }
        return si === short.length;
      }

      /* 役名からenmoku登場人物リンクを検索 */
      function findCharLink(enmokuId, roleName) {
        if (!enmokuCatalogCache || !roleName || !enmokuId) return null;
        var entry = null;
        for (var i = 0; i < enmokuCatalogCache.length; i++) {
          if (enmokuCatalogCache[i].id === enmokuId) { entry = enmokuCatalogCache[i]; break; }
        }
        if (!entry || !entry.cast_names) return null;

        /* 役名を ／ や ・ で分割して個別にマッチ */
        var parts = roleName.split(/[／・\/]/);
        for (var j = 0; j < entry.cast_names.length; j++) {
          var c = entry.cast_names[j];
          var cn = (c.name || "").replace(/\s+/g, "").replace(/[（(][^）)]*[）)]/g, "");
          if (!cn || cn.length < 2) continue;
          for (var p = 0; p < parts.length; p++) {
            var r = parts[p].replace(/\s+/g, "").replace(/[（(][^）)]*[）)]/g, "");
            if (!r || r.length < 2) continue;
            if (r === cn) return c.id;
            if (r.indexOf(cn) >= 0 || cn.indexOf(r) >= 0) return c.id;
            var sh = cn.length <= r.length ? cn : r;
            var lo = cn.length <= r.length ? r : cn;
            if (sh.length >= 3 && isSubseq(sh, lo)) return c.id;
          }
        }
        return null;
      }

      /* =====================================================
         ユーティリティ
      ===================================================== */
      function esc(s) {
        if (!s) return "";
        var d = document.createElement("div");
        d.textContent = s;
        return d.innerHTML;
      }
      function relTime(ts) {
        if (!ts) return "";
        var d = Math.floor(Date.now() / 1000) - ts;
        if (d < 60) return "たった今";
        if (d < 3600) return Math.floor(d/60) + "分前";
        if (d < 86400) return Math.floor(d/3600) + "時間前";
        if (d < 604800) return Math.floor(d/86400) + "日前";
        return Math.floor(d/604800) + "週前";
      }
      function typeIcon(t) { return t === "enmoku" ? "📜" : t === "person" ? "🎭" : "📖"; }
      function typeName(t) { return t === "enmoku" ? "演目" : t === "person" ? "人物" : "用語"; }
      function itemLink(r) {
        if (r.type === "enmoku") return "/kabuki/navi/enmoku/" + encodeURIComponent(r.id);
        if (r.type === "term") return "/kabuki/navi/glossary/term/" + encodeURIComponent(r.id);
        if (r.type === "person" && r.parent) return "/kabuki/navi/enmoku/" + encodeURIComponent(r.parent) + "#cast-" + encodeURIComponent(r.id);
        return "#";
      }
      function todayStr() {
        var d = new Date();
        return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
      }
      function seatLabel(id) {
        for (var i = 0; i < SEAT_TYPES.length; i++) {
          if (SEAT_TYPES[i].id === id) return SEAT_TYPES[i].label;
        }
        return id;
      }
      function venueName(id) {
        for (var i = 0; i < VENUES.length; i++) {
          if (VENUES[i].id === id) return VENUES[i].name;
        }
        return id;
      }
      var DOW = ["日","月","火","水","木","金","土"];
      function dateParts(dateStr) {
        var d = new Date(dateStr + "T00:00:00");
        return {
          month: (d.getMonth()+1),
          day: d.getDate(),
          dow: DOW[d.getDay()]
        };
      }
      function calcTitle(correct, total) {
        var t = total || 100;
        var p = t > 0 ? correct / t : 0;
        if (p >= 1.0) return "国宝";
        if (p >= 0.9) return "名人";
        if (p >= 0.7) return "千両役者";
        if (p >= 0.5) return "看板役者";
        if (p >= 0.3) return "二枚目";
        if (p >= 0.15) return "三枚目";
        if (p >= 0.05) return "名題";
        return "名題下";
      }

      /* =====================================================
         フォーム状態
      ===================================================== */
      var formOpen = false;
      var formState = {};
      var editingEntryId = null; /* 編集中エントリID */
      var perfCandidates = []; /* マッチした公演候補（programs付き） */

      /* メディア視聴タイプ定義 */
      var MEDIA_TYPES = [
        { id: "theater",   label: "劇場",    icon: "🏛️" },
        { id: "dvd",       label: "DVD/BD",  icon: "💿" },
        { id: "tv",        label: "テレビ",  icon: "📺" },
        { id: "youtube",   label: "YouTube", icon: "▶️" },
        { id: "streaming", label: "配信",    icon: "☁️" },
        { id: "other",     label: "その他",  icon: "🎬" }
      ];
      function mediaIcon(typeId) {
        for (var i = 0; i < MEDIA_TYPES.length; i++) {
          if (MEDIA_TYPES[i].id === typeId) return MEDIA_TYPES[i].icon;
        }
        return "🎬";
      }
      function mediaLabel(typeId) {
        for (var i = 0; i < MEDIA_TYPES.length; i++) {
          if (MEDIA_TYPES[i].id === typeId) return MEDIA_TYPES[i].label;
        }
        return typeId;
      }

      function resetForm() {
        editingEntryId = null;
        formState = {
          viewing_type: null,     /* null=未選択, "theater"=劇場, その他=メディア視聴 */
          date: todayStr(),
          venue_id: null,
          venue_name: null,
          seat_type: null,
          performance_title: null,
          play_titles: [],
          memo: "",
          image_url: "",
          /* メディア視聴用 */
          media_title: "",
          media_plays: [],       /* 演目名リスト（手入力） */
          media_actors_text: ""  /* 俳優名テキスト */
        };
        perfCandidates = [];
      }
      resetForm();

      /* =====================================================
         画面管理
      ===================================================== */
      var currentView = "home";   /* home | log | oshi */
      var logFilter = "all";      /* all | theater | media */
      var oshiLogFilter = "all";  /* all | actorName */
      var clipTab = "enmoku";
      var subView = null;         /* null | "recent" | "clips" | "review" */
      var migrationDone = false;

      function render() {
        if (subView === "recent") { renderRecent(); renderBottomTabs(); return; }
        if (subView === "clips") { renderClips(); renderBottomTabs(); return; }
        if (subView === "review") { renderReview(); renderBottomTabs(); return; }
        if (currentView === "home") renderHome();
        else if (currentView === "log") renderLogTab();
        else if (currentView === "oshi") renderOshiTab();
        else renderHome();
        renderBottomTabs();
        /* Google ボタンの再描画 */
        setTimeout(function() { if (window.__initGoogleSignIn) window.__initGoogleSignIn(); }, 100);
      }

      function renderBottomTabs() {
        var existingTabs = document.getElementById("kl-bottom-tabs");
        if (existingTabs) existingTabs.remove();
        var t = '<div class="kl-bottom-tabs" id="kl-bottom-tabs">';
        t += '<button class="kl-tab-btn' + (currentView === "home" && !subView ? " kl-tab-active" : "") + '" onclick="MP.switchTab(\\'home\\')">';
        t += '<span class="kl-tab-icon">🏠</span>ホーム</button>';
        t += '<button class="kl-tab-btn' + (currentView === "log" && !subView ? " kl-tab-active" : "") + '" onclick="MP.switchTab(\\'log\\')">';
        t += '<span class="kl-tab-icon">📝</span>ログ</button>';
        t += '<button class="kl-tab-btn' + (currentView === "oshi" && !subView ? " kl-tab-active" : "") + '" onclick="MP.switchTab(\\'oshi\\')">';
        t += '<span class="kl-tab-icon">⭐</span>推し</button>';
        t += '</div>';
        document.body.insertAdjacentHTML('beforeend', t);
      }

      /* =====================================================
         ホーム画面（ダッシュボード）
      ===================================================== */
      function renderHome() {
        var tlog = loadTlog();
        var log = loadLog();
        var quizState = loadQuizState();

        /* マイグレーション確認（ログイン直後 & ローカルデータあり & サーバーが空） */
        if (authState.loggedIn && authState.serverData && !migrationDone) {
          var localHasData = tlog.entries.length > 0 || loadFavorites().length > 0;
          var serverEmpty = !authState.serverData.theater_log || authState.serverData.theater_log.entries.length === 0;
          if (localHasData && serverEmpty) {
            migrationDone = true;
            setTimeout(function() {
              if (confirm('ブラウザに保存されているデータをサーバーに移行しますか？\\n（移行後は複数端末で同じデータを利用できます）')) {
                doMigration();
              }
            }, 500);
          }
        }

        /* エントリを分類 */
        var theaterEntries = [];
        var mediaEntries = [];
        for (var ei = 0; ei < tlog.entries.length; ei++) {
          var eType = tlog.entries[ei].viewing_type || "theater";
          if (eType === "theater") theaterEntries.push(tlog.entries[ei]);
          else mediaEntries.push(tlog.entries[ei]);
        }

        var h = '';

        /* ── 紹介テキスト ── */
        h += '<div class="kl-intro">';
        h += '幕が降りたら、ここに一筆。<br>観劇の記録と推し俳優を積み上げよう。';
        h += '</div>';

        /* ── クイック記録ボタン / フォーム ── */
        if (!formOpen) {
          h += '<button class="tl-cta" onclick="MP.openForm()">';
          h += '<span class="tl-cta-icon">🎭</span> 観たものを記録する';
          h += '</button>';
        } else {
          h += renderForm();
        }

        /* ── 今月の歌舞伎ライフ（総合サマリー） ── */
        var now = new Date();
        var thisMonth = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
        var monthTheater = 0, monthMedia = 0;
        for (var ti = 0; ti < tlog.entries.length; ti++) {
          if ((tlog.entries[ti].date || '').substring(0,7) === thisMonth) {
            if ((tlog.entries[ti].viewing_type || 'theater') === 'theater') monthTheater++;
            else monthMedia++;
          }
        }
        var monthLearn = 0;
        var weekAgo = Math.floor(Date.now()/1000) - 7*86400;
        for (var li = 0; li < log.recent.length; li++) {
          if (log.recent[li].ts >= weekAgo) monthLearn++;
        }
        h += '<div class="kl-summary-row">';
        h += '<div class="kl-summary-chip">🏛️ <span class="kl-summary-num">' + monthTheater + '</span> 劇場</div>';
        h += '<div class="kl-summary-chip">📺 <span class="kl-summary-num">' + monthMedia + '</span> 映像</div>';
        h += '<div class="kl-summary-chip">📚 <span class="kl-summary-num">' + monthLearn + '</span> 学び</div>';
        h += '</div>';

        /* ── 推し俳優バナー ── */
        var favBanner = loadFavorites();
        if (favBanner.length === 0) {
          h += '<div class="oshi-banner" onclick="MP.switchTab(\\'oshi\\')">';
          h += '<div class="oshi-banner-icon">⭐</div>';
          h += '<div class="oshi-banner-body">';
          h += '<div class="oshi-banner-title">推し俳優を登録しよう</div>';
          h += '<div class="oshi-banner-desc">推しタブで俳優を登録すると、ニュースや観劇回数を追跡できます</div>';
          h += '</div>';
          h += '<span class="oshi-banner-arrow">→</span>';
          h += '</div>';
        } else {
          h += '<div class="oshi-section">';
          h += '<div class="oshi-section-header" onclick="MP.switchTab(\\'oshi\\')">';
          h += '<div class="oshi-section-title">⭐ 推し俳優 <span class="oshi-section-count">' + favBanner.length + '人</span></div>';
          h += '<span class="oshi-section-manage">推しタブ →</span>';
          h += '</div>';
          h += '<div class="oshi-profiles" id="oshi-profiles-area">';
          for (var fi = 0; fi < favBanner.length; fi++) {
            h += '<div class="oshi-profile-card"><div class="oshi-profile-yago-icon oshi-profile-yago-empty">🎭</div>';
            h += '<div class="oshi-profile-name">' + esc(favBanner[fi]) + '</div></div>';
          }
          h += '</div>';
          h += '</div>';
        }

        /* ── 推しニュース（自動読込、最大5件） ── */
        h += '<div class="mp-section" id="oshi-news-section" style="display:none;"></div>';

        /* ── 最近の記録（直近3件） ── */
        h += '<div class="mp-section">';
        h += '<div class="mp-section-title">📝 最近の記録</div>';
        var allEntries = tlog.entries.slice(0, 3);
        if (allEntries.length > 0) {
          for (var re = 0; re < allEntries.length; re++) {
            var e = allEntries[re];
            var dp = dateParts(e.date);
            var isMedia = (e.viewing_type || "theater") !== "theater";
            h += '<div class="tl-entry" style="padding:14px 16px;">';
            h += '<div class="tl-entry-header" style="margin-bottom:0;">';
            h += '<div class="tl-entry-date-col" style="padding:6px 10px;min-width:48px;">';
            h += '<div class="tl-entry-month" style="font-size:10px;">' + dp.month + '月</div>';
            h += '<div class="tl-entry-day" style="font-size:20px;">' + dp.day + '</div>';
            h += '</div>';
            h += '<div class="tl-entry-body">';
            if (isMedia) {
              h += '<span class="tl-entry-venue-tag media-type-tag">' + mediaIcon(e.viewing_type) + ' ' + mediaLabel(e.viewing_type) + '</span> ';
              h += '<div class="tl-entry-perf" style="font-size:14px;">' + esc(e.media_title || '') + '</div>';
            } else {
              if (e.performance_title) h += '<span class="tl-entry-venue-tag">' + esc(e.performance_title) + '</span> ';
              h += '<div class="tl-entry-perf" style="font-size:14px;">' + esc(e.venue_name || venueName(e.venue_id)) + '</div>';
            }
            if (e.play_titles && e.play_titles.length > 0) {
              h += '<div class="tl-entry-plays" style="font-size:12px;">🎭 ' + e.play_titles.map(function(t){ return esc(t); }).join(' / ') + '</div>';
            }
            h += '</div></div></div>';
          }
          if (tlog.entries.length > 3) {
            h += '<div class="mp-actions"><button class="mp-btn" onclick="MP.switchTab(\\'log\\')">ログタブで全件を見る →</button></div>';
          }
        } else {
          h += '<div class="mp-empty">まだ記録がありません 🎭<br>上のボタンから記録してみよう！</div>';
        }
        h += '</div>';

        h += '<div style="height:16px;"></div>';

        /* ── ステータスバー（ストリーク + XP を1カード） ── */
        var streak = updateStreak();
        var lvl = calcLevel(log.xp || 0);
        h += '<div class="kl-section-card">';
        h += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">';
        if (streak.current > 0) {
          h += '<span style="font-size:20px;">🔥</span>';
          h += '<span style="font-size:15px;font-weight:700;color:var(--kl-gold-dark);">' + streak.current + '日連続</span>';
        } else {
          h += '<span style="font-size:13px;color:var(--kl-text3);">今日から連続記録スタート！</span>';
        }
        h += '<span style="margin-left:auto;font-size:13px;color:var(--kl-text2);">Lv.' + lvl.level + ' ' + lvl.title + '</span>';
        h += '</div>';
        h += '<div class="kl-xp-track"><div class="kl-xp-fill" style="width:' + lvl.pct + '%;"></div></div>';
        h += '<div class="kl-xp-nums">';
        h += '<span>' + (log.xp || 0) + ' XP</span>';
        h += '<span>' + (lvl.nextTitle ? '次: ' + lvl.nextTitle + ' (' + lvl.nextXp + 'XP)' : '最高レベル到達！') + '</span>';
        h += '</div>';
        h += '</div>';

        /* ── 今日のひとくち歌舞伎 ── */
        h += '<div class="kl-section-card kl-hitokuchi" id="hitokuchi-area">';
        h += '<div class="kl-hitokuchi-label">📖 今日のひとくち歌舞伎</div>';
        h += '<div class="kl-hitokuchi-text" id="hitokuchi-text">読み込み中...</div>';
        h += '<div class="kl-hitokuchi-sub" id="hitokuchi-sub"></div>';
        h += '</div>';

        /* ── 今週の学習 ── */
        h += renderWeeklyGraph(log);

        /* ── 今月のアクティビティカレンダー ── */
        h += renderActivityCalendar(tlog, log);

        /* ── KABUKI DOJO への誘導 ── */
        h += '<a href="/kabuki/dojo" class="kl-section-card" style="display:flex;align-items:center;gap:14px;text-decoration:none;color:var(--kl-text);cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;">';
        h += '<span style="font-size:24px;">🥋</span>';
        h += '<div style="flex:1;">';
        h += '<div class="kl-section-header" style="margin:0;">KABUKI DOJO</div>';
        h += '<div style="font-size:12px;color:var(--kl-text2);">クイズ・台詞稽古・大向う道場・学習進捗</div>';
        h += '</div>';
        h += '<span style="color:var(--kl-text3);font-size:18px;">→</span>';
        h += '</a>';

        /* ── データ管理 ── */
        h += '<div class="kl-section-card">';
        h += '<div class="kl-section-header">💾 データ管理</div>';
        h += '<div style="display:flex;gap:8px;">';
        h += '<button class="mp-btn" onclick="MP.exportData()" style="flex:1;">📤 エクスポート</button>';
        h += '<button class="mp-btn" onclick="MP.importData()" style="flex:1;">📥 インポート</button>';
        h += '</div>';
        h += '<input type="file" id="kl-import-file" accept=".json" style="display:none;" onchange="MP.doImport(event)">';
        h += '</div>';

        h += '</div>';

        app.innerHTML = h;
        bindFormEvents();

        /* 推しプロフィールを名鑑データでリッチ化 */
        enrichOshiProfiles();

        /* 推しニュース非同期読込 */
        loadOshiNews();

        /* ひとくち歌舞伎を非同期読込 */
        loadHitokuchi();
      }

      /* =====================================================
         ログタブ（タイムライン全件）
      ===================================================== */
      function renderLogTab() {
        var tlog = loadTlog();
        var favList = loadFavorites();

        /* エントリ分類 */
        var theaterEntries = [];
        var mediaEntries = [];
        for (var ei = 0; ei < tlog.entries.length; ei++) {
          var eType = tlog.entries[ei].viewing_type || "theater";
          if (eType === "theater") theaterEntries.push(tlog.entries[ei]);
          else mediaEntries.push(tlog.entries[ei]);
        }

        /* フィルタに応じた表示エントリ */
        var displayEntries;
        if (logFilter === "theater") displayEntries = theaterEntries;
        else if (logFilter === "media") displayEntries = mediaEntries;
        else displayEntries = tlog.entries;

        var h = '';

        /* ── フォーム ── */
        if (formOpen) {
          h += renderForm();
        } else {
          h += '<button class="tl-cta" onclick="MP.openForm()">';
          h += '<span class="tl-cta-icon">🎭</span> 観たものを記録する';
          h += '</button>';
        }

        /* ── フィルタタブ ── */
        h += '<div class="log-filters">';
        h += '<button class="log-filter-btn' + (logFilter === "all" ? " log-filter-active" : "") + '" onclick="MP.setLogFilter(\\'all\\')">全て <span style="font-size:11px;">(' + tlog.entries.length + ')</span></button>';
        h += '<button class="log-filter-btn' + (logFilter === "theater" ? " log-filter-active" : "") + '" onclick="MP.setLogFilter(\\'theater\\')">🏛️ 劇場 <span style="font-size:11px;">(' + theaterEntries.length + ')</span></button>';
        h += '<button class="log-filter-btn' + (logFilter === "media" ? " log-filter-active" : "") + '" onclick="MP.setLogFilter(\\'media\\')">📺 映像 <span style="font-size:11px;">(' + mediaEntries.length + ')</span></button>';
        h += '</div>';

        /* ── 統計バー ── */
        if (displayEntries.length > 0) {
          h += '<div style="font-size:13px;color:var(--kl-text2);margin-bottom:12px;text-align:center;">';
          h += '合計 <strong>' + displayEntries.length + '</strong> 件';
          if (logFilter === "all" && theaterEntries.length > 0 && mediaEntries.length > 0) {
            h += '（劇場 ' + theaterEntries.length + ' / 映像 ' + mediaEntries.length + '）';
          }
          h += '</div>';
        }

        /* ── エントリ一覧（折りたたみ） ── */
        if (displayEntries.length === 0) {
          h += '<div class="mp-empty">記録がありません</div>';
        }
        for (var i = 0; i < displayEntries.length; i++) {
          var e = displayEntries[i];
          var dp = dateParts(e.date);
          var isMedia = (e.viewing_type || "theater") !== "theater";
          var hasOshi = false;
          if (!isMedia && e.actors) {
            for (var oa = 0; oa < e.actors.length; oa++) {
              if (favList.indexOf(e.actors[oa].actor) >= 0) { hasOshi = true; break; }
            }
          }

          h += '<div class="tl-entry' + (isMedia ? ' media-entry' : '') + '">';
          h += '<div class="tl-entry-header">';
          h += '<div class="tl-entry-date-col">';
          h += '<div class="tl-entry-month">' + dp.month + '月</div>';
          h += '<div class="tl-entry-day">' + dp.day + '</div>';
          h += '<div class="tl-entry-dow">' + dp.dow + '</div>';
          h += '</div>';
          h += '<div class="tl-entry-body">';

          if (isMedia) {
            h += '<span class="tl-entry-venue-tag media-type-tag">' + mediaIcon(e.viewing_type) + ' ' + mediaLabel(e.viewing_type) + '</span>';
            h += '<div class="tl-entry-perf">' + esc(e.media_title || '') + '</div>';
          } else {
            if (e.performance_title) {
              h += '<span class="tl-entry-venue-tag">' + esc(e.performance_title) + '</span>';
            }
            h += '<div class="tl-entry-perf">' + esc(e.venue_name || venueName(e.venue_id));
            if (e.seat_type && e.seat_type !== "NA") {
              h += ' <span class="tl-entry-seat">' + seatLabel(e.seat_type) + '</span>';
            }
            h += '</div>';
          }

          if (e.play_titles && e.play_titles.length > 0) {
            var psMap = e.play_scenes || {};
            var playLinks = e.play_titles.map(function(pt) {
              var eid = findEnmokuId(pt);
              return eid ? '<a href="/kabuki/navi/enmoku/' + esc(eid) + '" class="tl-entry-play-link">' + esc(pt) + '</a>' : esc(pt);
            });
            h += '<div class="tl-entry-plays">🎭 ' + playLinks.join(' / ');
            if (hasOshi) h += ' <span class="tl-oshi-badge">★推し出演</span>';
            h += '</div>';
          } else if (hasOshi) {
            h += '<div style="margin-top:2px;"><span class="tl-oshi-badge">★推し出演</span></div>';
          }

          if (isMedia && e.actors_text) {
            h += '<div class="tl-entry-actors-text">👤 ' + esc(e.actors_text) + '</div>';
          }

          h += '</div>'; /* tl-entry-body */
          h += '</div>'; /* tl-entry-header */

          /* ── 折りたたみ詳細 ── */
          var hasDetail = false;
          if (!isMedia && e.actors && e.actors.length > 0) hasDetail = true;
          if (e.memo) hasDetail = true;
          if (!isMedia && e.play_scenes) {
            var sceneKeys = Object.keys(e.play_scenes);
            if (sceneKeys.length > 0) hasDetail = true;
          }

          if (hasDetail) {
            h += '<div class="tl-entry-detail" id="detail-' + e.id + '">';

            /* 配役 */
            if (!isMedia && e.actors && e.actors.length > 0) {
              var playGroups = {};
              var playOrder = [];
              for (var ai = 0; ai < e.actors.length; ai++) {
                var a = e.actors[ai];
                var key = a.play || "";
                if (!playGroups[key]) { playGroups[key] = []; playOrder.push(key); }
                playGroups[key].push(a);
              }
              h += '<div class="tl-entry-actors">';
              for (var gi = 0; gi < playOrder.length; gi++) {
                var gKey = playOrder[gi];
                var gActors = playGroups[gKey];
                var gEnmokuId = findEnmokuId(gKey);
                if (playOrder.length > 1 && gKey) {
                  if (gEnmokuId) {
                    h += '<div class="tl-entry-cast-play"><a href="/kabuki/navi/enmoku/' + esc(gEnmokuId) + '" class="tl-cast-play-link">' + esc(gKey) + '</a></div>';
                  } else {
                    h += '<div class="tl-entry-cast-play">' + esc(gKey) + '</div>';
                  }
                }
                var pairs = [];
                for (var pi = 0; pi < gActors.length; pi++) {
                  var role = gActors[pi].role;
                  var charId = gEnmokuId && role ? findCharLink(gEnmokuId, role) : null;
                  var pair;
                  if (role && charId) {
                    pair = '<span class="tl-cast-role">' + esc(role) + '</span> <a href="/kabuki/navi/enmoku/' + esc(gEnmokuId) + '#cast-' + esc(charId) + '" class="tl-cast-linked">' + esc(gActors[pi].actor) + '</a>';
                  } else if (role) {
                    pair = '<span class="tl-cast-role">' + esc(role) + '</span> ' + esc(gActors[pi].actor);
                  } else {
                    pair = esc(gActors[pi].actor);
                  }
                  pairs.push(pair);
                }
                h += '<div class="tl-entry-cast-pairs">' + pairs.join('<span class="tl-cast-sep">／</span>') + '</div>';
              }
              h += '</div>';
            }

            /* 場名 */
            if (!isMedia && e.play_titles && e.play_scenes) {
              var sceneTags = [];
              for (var si = 0; si < e.play_titles.length; si++) {
                var pt = e.play_titles[si];
                if (e.play_scenes[pt]) sceneTags.push('🌿 ' + e.play_scenes[pt]);
              }
              if (sceneTags.length > 0) {
                h += '<div class="tl-entry-bottom">';
                for (var st = 0; st < sceneTags.length; st++) {
                  h += '<span class="tl-entry-bottom-tag">' + esc(sceneTags[st]) + '</span>';
                }
                h += '</div>';
              }
            }

            if (e.memo) {
              h += '<div class="tl-entry-memo">💬 ' + esc(e.memo) + '</div>';
            }
            if (e.image_url) {
              h += '<div class="tl-entry-image"><img src="' + esc(e.image_url) + '" alt="写真" loading="lazy" onclick="MP.openLightbox(\\'' + esc(e.image_url) + '\\')"></div>';
            }
            h += '</div>'; /* tl-entry-detail */

            h += '<button class="tl-entry-toggle" onclick="MP.toggleDetail(\\'' + e.id + '\\',this)">▼ 詳細</button>';
          }

          /* "..."メニュー */
          h += '<div class="tl-entry-actions">';
          h += '<div class="tl-entry-more-menu">';
          h += '<button class="tl-entry-more-btn" onclick="MP.toggleMenu(\\'' + e.id + '\\')">⋯</button>';
          h += '<div class="tl-entry-dropdown" id="menu-' + e.id + '">';
          h += '<button onclick="MP.editEntry(\\'' + e.id + '\\')">編集</button>';
          h += '<button class="tl-drop-danger" onclick="MP.deleteEntry(\\'' + e.id + '\\')">削除</button>';
          h += '</div>';
          h += '</div>';
          h += '</div>';

          h += '</div>'; /* tl-entry */
        }

        app.innerHTML = h;
        bindFormEvents();
      }

      /* =====================================================
         推しタブ
      ===================================================== */
      function renderOshiTab() {
        var favList = loadFavorites();
        var tlog = loadTlog();

        var h = '';

        /* ── 登録済み俳優 ── */
        h += '<div class="mp-section">';
        h += '<div class="mp-section-title">⭐ 登録済み（<span id="fav-count">' + favList.length + '</span>人）</div>';
        h += '<div id="oshi-registered-area">';
        if (favList.length === 0) {
          h += '<div class="mp-empty" style="padding:1rem;">まだ推し俳優が登録されていません<br>下の検索から追加しましょう</div>';
        } else {
          for (var fi = 0; fi < favList.length; fi++) {
            h += '<div class="fav-actor-card fav-actor-registered">';
            h += '<div class="fav-actor-icon">🎭</div>';
            h += '<div class="fav-actor-info">';
            h += '<div class="fav-actor-name">★ ' + esc(favList[fi]) + '</div>';
            h += '<div class="fav-actor-sub" id="oshi-sub-' + fi + '"></div>';
            h += '</div>';
            h += '<button class="fav-actor-remove" onclick="MP.removeFavOshi(\\'' + esc(favList[fi]).replace(/'/g, "\\\\'") + '\\')">解除</button>';
            h += '</div>';
          }
        }
        h += '</div>';
        h += '</div>';

        /* ── 人気俳優から選ぶ（デフォルト） ── */
        h += '<div class="mp-section" id="popular-actors-section">';
        h += '<div class="mp-section-title">\u2728 \u4eba\u6c17\u4ff3\u512a\u304b\u3089\u9078\u3076<\/div>';
        h += '<div id="popular-actors-grid" class="fav-search-results"><\/div>';
        h += '<button class="btn-all-actors" onclick="MP.toggleAllActors()">\uD83D\uDD0D \u5168\u4ff3\u512a\u304b\u3089\u63a2\u3059 \u2192<\/button>';
        h += '<\/div>';

        /* ── 全俳優検索（「全俳優から探す」タップ後に表示） ── */
        h += '<div class="mp-section" id="full-search-section" style="display:none">';
        h += '<div class="mp-section-title">\uD83D\uDD0D \u4ff3\u512a\u3092\u691c\u7d22\u3057\u3066\u8ffd\u52a0<\/div>';
        h += '<input type="text" class="fav-search-input" id="fav-search" placeholder="\u540d\u524d\u30fb\u5c4b\u53f7\u3067\u691c\u7d22" oninput="MP.filterActors()">';
        h += '<div id="fav-search-results" class="fav-search-results"><\/div>';
        h += '<\/div>';

        h += '<div class="mp-section" id="yago-section" style="display:none">';
        h += '<div class="mp-section-title">\uD83C\uDFE0 \u5c4b\u53f7\u304b\u3089\u9078\u3076<\/div>';
        h += '<div id="yago-tabs" class="yago-tabs"><\/div>';
        h += '<div id="yago-actor-list" class="yago-actor-list"><\/div>';
        h += '<\/div>';

        /* ── 推しニュース ── */
        if (favList.length > 0) {
          h += '<div class="mp-section">';
          h += '<div class="mp-section-title">📰 推しニュース</div>';
          h += '<div id="oshi-tab-news"><div class="mp-empty" style="padding:0.5rem;">ニュースを読み込み中…</div></div>';

          /* 過去ニュース検索 */
          h += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--kl-border);">';
          h += '<div style="font-size:13px;font-weight:600;color:var(--kl-text);margin-bottom:8px;">🔍 過去のニュースを検索</div>';
          h += '<div class="oshi-log-filters" id="news-search-actors">';
          for (var nsi = 0; nsi < favList.length; nsi++) {
            var nsName = favList[nsi];
            var nsShort = nsName.replace(/\\s/g, "");
            h += '<button class="oshi-log-filter-btn" onclick="MP.searchPastNews(\\'' + esc(nsName).replace(/'/g, "\\\\'") + '\\', this)">' + esc(nsShort) + '</button>';
          }
          h += '</div>';
          h += '<div id="past-news-results" style="display:none;"></div>';
          h += '</div>';

          h += '</div>';
        }

        /* ── 推し観劇ランキング ── */
        var actorCount = {};
        for (var ti = 0; ti < tlog.entries.length; ti++) {
          var te = tlog.entries[ti];
          if ((te.viewing_type || "theater") !== "theater") continue;
          if (!te.actors) continue;
          var seenInEntry = {};
          for (var ai = 0; ai < te.actors.length; ai++) {
            var aName = te.actors[ai].actor;
            if (!seenInEntry[aName]) { seenInEntry[aName] = true; actorCount[aName] = (actorCount[aName] || 0) + 1; }
          }
        }
        var actorKeys = Object.keys(actorCount);
        if (actorKeys.length > 0) {
          actorKeys.sort(function(a, b) { return actorCount[b] - actorCount[a]; });
          var topActors = actorKeys.slice(0, 10);
          h += '<div class="mp-section">';
          h += '<div class="mp-section-title">🏆 推し観劇ランキング</div>';
          h += '<div class="tl-actor-ranking" id="actor-ranking-area">';
          for (var ri = 0; ri < topActors.length; ri++) {
            var rName = topActors[ri];
            var rCount = actorCount[rName];
            var isFav = favList.indexOf(rName) >= 0;
            h += '<div class="tl-actor-rank-row" data-actor="' + esc(rName) + '">';
            h += '<button class="tl-fav-star' + (isFav ? ' tl-fav-active' : '') + '" onclick="MP.toggleFav(\\'' + esc(rName).replace(/'/g, "\\\\'") + '\\')" title="推し登録">' + (isFav ? '★' : '☆') + '</button>';
            h += '<span class="tl-actor-rank-pos">' + (ri + 1) + '</span>';
            h += '<span class="tl-actor-rank-name">' + esc(rName) + '<span class="tl-actor-yago" id="yago-' + ri + '"></span></span>';
            h += '<span class="tl-actor-rank-count">' + rCount + '回</span>';
            h += '</div>';
          }
          h += '</div>';
          h += '</div>';
        }

        /* ── 推しの観劇ログ（感想一覧） ── */
        if (favList.length > 0) {
          var oshiEntries = [];
          for (var oli = 0; oli < tlog.entries.length; oli++) {
            var oe = tlog.entries[oli];
            if ((oe.viewing_type || "theater") !== "theater") continue;
            if (!oe.actors) continue;
            for (var oai = 0; oai < oe.actors.length; oai++) {
              if (favList.indexOf(oe.actors[oai].actor) >= 0) {
                oshiEntries.push(oe);
                break;
              }
            }
          }

          h += '<div class="mp-section">';
          h += '<div class="mp-section-title">📝 推しの観劇ログ</div>';

          /* フィルタ */
          h += '<div class="oshi-log-filters">';
          h += '<button class="oshi-log-filter-btn' + (oshiLogFilter === "all" ? ' oshi-log-filter-active' : '') + '" onclick="MP.setOshiLogFilter(\\'all\\')">全推し（' + oshiEntries.length + '）</button>';
          for (var ofi = 0; ofi < favList.length; ofi++) {
            var ofName = favList[ofi];
            var ofCount = 0;
            for (var oei = 0; oei < oshiEntries.length; oei++) {
              var oeActors = oshiEntries[oei].actors || [];
              for (var oxi = 0; oxi < oeActors.length; oxi++) {
                if (oeActors[oxi].actor === ofName) { ofCount++; break; }
              }
            }
            if (ofCount > 0) {
              var shortName = ofName.replace(/\\s/g, "");
              if (shortName.length > 4) shortName = shortName.substring(shortName.length - 3);
              h += '<button class="oshi-log-filter-btn' + (oshiLogFilter === ofName ? ' oshi-log-filter-active' : '') + '" onclick="MP.setOshiLogFilter(\\'' + esc(ofName).replace(/'/g, "\\\\'") + '\\')">' + esc(shortName) + '（' + ofCount + '）</button>';
            }
          }
          h += '</div>';

          /* フィルタ適用 */
          var filteredOshi = oshiEntries;
          if (oshiLogFilter !== "all") {
            filteredOshi = [];
            for (var fxi = 0; fxi < oshiEntries.length; fxi++) {
              var fxActors = oshiEntries[fxi].actors || [];
              for (var fai = 0; fai < fxActors.length; fai++) {
                if (fxActors[fai].actor === oshiLogFilter) { filteredOshi.push(oshiEntries[fxi]); break; }
              }
            }
          }

          if (filteredOshi.length === 0) {
            h += '<div class="oshi-log-no-entries">推し俳優が出演する観劇記録がありません</div>';
          } else {
            for (var fei = 0; fei < filteredOshi.length; fei++) {
              var fe = filteredOshi[fei];
              var fdp = dateParts(fe.date);

              h += '<div class="oshi-log-entry">';
              h += '<div class="oshi-log-entry-header">';
              h += '<div class="oshi-log-date">';
              h += '<div class="oshi-log-date-m">' + fdp.month + '月</div>';
              h += '<div class="oshi-log-date-d">' + fdp.day + '</div>';
              h += '</div>';
              h += '<div class="oshi-log-info">';
              if (fe.performance_title) {
                h += '<div class="oshi-log-venue">' + esc(fe.performance_title) + '</div>';
              }
              h += '<div class="oshi-log-perf">' + esc(fe.venue_name || venueName(fe.venue_id)) + '</div>';
              if (fe.play_titles && fe.play_titles.length > 0) {
                var fePlayLinks = fe.play_titles.map(function(pt) {
                  var eid = findEnmokuId(pt);
                  return eid ? '<a href="/kabuki/navi/enmoku/' + esc(eid) + '">' + esc(pt) + '</a>' : esc(pt);
                });
                h += '<div class="oshi-log-plays">🎭 ' + fePlayLinks.join(' / ') + '</div>';
              }
              h += '</div>';
              h += '</div>';

              /* 推し俳優の出演役 */
              var feActors = fe.actors || [];
              var oshiRoles = [];
              for (var frai = 0; frai < feActors.length; frai++) {
                var fra = feActors[frai];
                var isFavActor = favList.indexOf(fra.actor) >= 0;
                if (oshiLogFilter !== "all") isFavActor = (fra.actor === oshiLogFilter);
                if (isFavActor) {
                  oshiRoles.push({ actor: fra.actor, role: fra.role || "", play: fra.play || "" });
                }
              }
              if (oshiRoles.length > 0) {
                for (var ori = 0; ori < oshiRoles.length; ori++) {
                  h += '<div class="oshi-log-role">';
                  h += '<span class="oshi-log-role-label">★ ' + esc(oshiRoles[ori].actor) + '</span>';
                  if (oshiRoles[ori].role) {
                    h += '<span>' + esc(oshiRoles[ori].role) + '</span>';
                  }
                  if (oshiRoles[ori].play) {
                    h += '<span style="color:var(--kl-text3);font-size:11px;">（' + esc(oshiRoles[ori].play) + '）</span>';
                  }
                  h += '</div>';
                }
              }

              /* メモ / 感想 */
              if (fe.memo) {
                h += '<div class="oshi-log-memo">💬 ' + esc(fe.memo) + '</div>';
              }

              h += '</div>';
            }
          }
          h += '</div>';
        }

        app.innerHTML = h;

        /* 人気俳優グリッド描画 */
        renderPopularActors(favList);

        /* 名鑑データロード → 登録済みリッチ化（屋号タブは展開後に遅延ロード） */
        loadActorMeikan(function(meikan) {
          /* 登録済みカードのリッチ化 */
          var regArea = document.getElementById('oshi-registered-area');
          if (regArea && favList.length > 0) {
            var ph = '';
            for (var ri = 0; ri < favList.length; ri++) {
              var name = favList[ri];
              var info = findMeikanInfo(meikan, name);
              ph += '<div class="fav-actor-card fav-actor-registered">';
              if (info && info.yago) {
                var yShort = info.yago.length > 3 ? info.yago.substring(0,3) : info.yago;
                ph += '<div class="fav-actor-yago-badge" title="' + esc(info.yago) + '">' + esc(yShort) + '</div>';
              } else {
                ph += '<div class="fav-actor-icon">🎭</div>';
              }
              ph += '<div class="fav-actor-info">';
              ph += '<div class="fav-actor-name">★ ' + esc(name) + '</div>';
              if (info) {
                var sub = [];
                if (info.generation) sub.push(info.generation);
                if (info.yago) sub.push(info.yago);
                if (sub.length) ph += '<div class="fav-actor-sub">' + esc(sub.join(' / ')) + '</div>';
              }
              ph += '</div>';
              ph += '<button class="fav-actor-remove" onclick="MP.removeFavOshi(\\'' + esc(name).replace(/'/g, "\\\\'") + '\\')">解除</button>';
              ph += '</div>';
            }
            regArea.innerHTML = ph;
          }
          /* 屋号タブ: 展開後（yago-section が表示中）のみ描画 */
          var yagoSec = document.getElementById('yago-section');
          if (yagoSec && yagoSec.style.display !== 'none') {
            renderYagoTabs(meikan);
            renderYagoActors(meikan, favYagoFilter);
          }
          /* ランキングの屋号タグ */
          var rankingArea = document.getElementById('actor-ranking-area');
          if (rankingArea) {
            var rows = rankingArea.querySelectorAll('.tl-actor-rank-row');
            for (var rr = 0; rr < rows.length; rr++) {
              var actorName = rows[rr].getAttribute('data-actor');
              if (!actorName) continue;
              var aInfo = findMeikanInfo(meikan, actorName);
              var yagoEl = rows[rr].querySelector('.tl-actor-yago');
              if (yagoEl && aInfo && aInfo.yago) yagoEl.textContent = aInfo.yago;
            }
          }
        });

        /* ニュース読込 */
        if (favList.length > 0) {
          loadOshiNewsForTab(favList);
        }
      }

      /* 推しタブ用ニュース読込 */
      function loadOshiNewsForTab(favList) {
        var container = document.getElementById('oshi-tab-news');
        if (!container) return;

        function doRender(articles) {
          var matched = [];
          for (var i = 0; i < articles.length; i++) {
            var a = articles[i];
            if (!a.title) continue;
            for (var j = 0; j < favList.length; j++) {
              var hit = matchActorInTitle(a.title, favList[j]);
              if (hit) { matched.push({ article: a, actor: favList[j], highlight: hit }); break; }
            }
          }
          if (matched.length === 0) {
            container.innerHTML = '<div class="fav-news-empty">推し俳優に関連するニュースは見つかりませんでした</div>';
            return;
          }
          var nh = '';
          var top = matched.slice(0, 15);
          for (var k = 0; k < top.length; k++) {
            var m = top[k];
            var pubDate = m.article.pubTs ? formatNewsDate(m.article.pubTs) : '';
            var t = esc(m.article.title);
            var ae = esc(m.highlight);
            t = t.replace(new RegExp(ae, 'g'), '<strong class="oshi-highlight">' + ae + '</strong>');
            nh += '<a href="' + esc(m.article.link) + '" target="_blank" rel="noopener" class="oshi-news-card">';
            nh += '<div class="oshi-news-title">' + t + '</div>';
            nh += '<div class="oshi-news-meta">';
            if (m.article.source) nh += '<span>' + esc(m.article.source) + '</span>';
            if (pubDate) nh += '<span>' + pubDate + '</span>';
            nh += '</div></a>';
          }
          if (matched.length > 15) {
            nh += '<div style="text-align:right;margin-top:0.3rem;"><a href="/kabuki/live/news" class="oshi-news-more">すべてのニュースを見る →</a></div>';
          }
          container.innerHTML = nh;
        }

        if (newsCache) { doRender(newsCache); return; }
        fetch('/api/news').then(function(r){ return r.json(); }).then(function(data){
          newsCache = (data && data.articles) || [];
          doRender(newsCache);
        }).catch(function(){
          container.innerHTML = '<div class="fav-news-empty">ニュースの取得に失敗しました</div>';
        });
      }

      /* 過去ニュース検索 */
      function searchPastNews(actorName, btnEl) {
        var results = document.getElementById('past-news-results');
        if (!results) return;

        /* ボタンのアクティブ状態切替 */
        var allBtns = document.querySelectorAll('#news-search-actors .oshi-log-filter-btn');
        for (var bi = 0; bi < allBtns.length; bi++) {
          allBtns[bi].classList.remove('oshi-log-filter-active');
        }
        if (btnEl) btnEl.classList.add('oshi-log-filter-active');

        results.style.display = '';
        results.innerHTML = '<div class="mp-empty" style="padding:12px;font-size:13px;">🔍 「' + esc(actorName) + '」のニュースを検索中…</div>';

        fetch('/api/news-search?actor=' + encodeURIComponent(actorName) + '&months=6')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var articles = (data && data.articles) || [];
            if (articles.length === 0) {
              results.innerHTML = '<div class="mp-empty" style="padding:12px;font-size:13px;">「' + esc(actorName) + '」に関する過去6か月のニュースは見つかりませんでした</div>';
              return;
            }
            var rh = '<div style="font-size:12px;color:var(--kl-text3);margin-bottom:8px;">「' + esc(actorName) + '」の過去6か月のニュース（' + articles.length + '件）</div>';
            for (var ni = 0; ni < articles.length; ni++) {
              var na = articles[ni];
              var pubDate = na.pubTs ? formatNewsDate(na.pubTs) : '';
              var nTitle = esc(na.title);
              var actorEsc = esc(actorName);
              var nameParts = actorName.split(/\\s+/);
              for (var np = 0; np < nameParts.length; np++) {
                var pe = esc(nameParts[np]);
                if (pe.length > 0) {
                  nTitle = nTitle.replace(new RegExp(pe, 'g'), '<strong class="oshi-highlight">' + pe + '</strong>');
                }
              }
              rh += '<a href="' + esc(na.link) + '" target="_blank" rel="noopener" class="oshi-news-card">';
              rh += '<div class="oshi-news-title">' + nTitle + '</div>';
              rh += '<div class="oshi-news-meta">';
              if (na.source) rh += '<span>' + esc(na.source) + '</span>';
              if (pubDate) rh += '<span>' + pubDate + '</span>';
              rh += '</div></a>';
            }
            results.innerHTML = rh;
          })
          .catch(function() {
            results.innerHTML = '<div class="mp-empty" style="padding:12px;font-size:13px;">ニュースの検索に失敗しました</div>';
          });
      }

      /* =====================================================
         推しプロフィール リッチ化
      ===================================================== */
      function findMeikanInfo(meikan, name) {
        if (!meikan) return null;
        for (var j = 0; j < meikan.length; j++) {
          var nk = meikan[j].name_kanji.replace(/\\s+/g, "");
          if (nk === name || nk === name.replace(/\\s+/g, "")) return meikan[j];
        }
        return null;
      }

      function enrichOshiProfiles() {
        var area = document.getElementById("oshi-profiles-area");
        var rankingArea = document.getElementById("actor-ranking-area");
        if (!area && !rankingArea) return;

        loadActorMeikan(function(meikan) {
          if (!meikan || meikan.length === 0) return;

          /* バナーのプロフィールカード */
          if (area) {
            var favList = loadFavorites();
            var ph = '';
            for (var i = 0; i < favList.length; i++) {
              var name = favList[i];
              var info = findMeikanInfo(meikan, name);
              ph += '<div class="oshi-profile-card">';
              if (info && info.yago) {
                var yagoShort = info.yago.length > 3 ? info.yago.substring(0, 3) : info.yago;
                ph += '<div class="oshi-profile-yago-icon" title="' + esc(info.yago) + '">' + esc(yagoShort) + '</div>';
              } else {
                ph += '<div class="oshi-profile-yago-icon oshi-profile-yago-empty">🎭</div>';
              }
              ph += '<div class="oshi-profile-name">' + esc(name) + '</div>';
              ph += '</div>';
            }
            area.innerHTML = ph;
          }

          /* ランキングの屋号タグ */
          if (rankingArea) {
            var rows = rankingArea.querySelectorAll('.tl-actor-rank-row');
            for (var r = 0; r < rows.length; r++) {
              var actorName = rows[r].getAttribute('data-actor');
              if (!actorName) continue;
              var info = findMeikanInfo(meikan, actorName);
              var yagoEl = rows[r].querySelector('.tl-actor-yago');
              if (yagoEl && info && info.yago) {
                yagoEl.textContent = info.yago;
              }
            }
          }
        });
      }

      /* =====================================================
         推しニュース マッチング
      ===================================================== */
      /* 俳優名の短縮パターンを生成（例: "市川團十郎白猿" → ["市川團十郎白猿","市川團十郎","團十郎白猿","團十郎"]） */
      function actorNamePatterns(name) {
        var pats = [name];
        /* 姓を除いた名前部分でもマッチ (2文字姓: 市川/尾上/中村/坂東 etc.) */
        if (name.length > 3) {
          for (var skip = 2; skip <= 3 && skip < name.length - 1; skip++) {
            var rest = name.substring(skip);
            if (rest.length >= 2 && pats.indexOf(rest) < 0) pats.push(rest);
          }
        }
        /* 末尾を1〜2文字削って短い名前でもマッチ（例: 團十郎白猿 → 團十郎） */
        var base = pats.slice();
        for (var i = 0; i < base.length; i++) {
          for (var trim = 1; trim <= 2; trim++) {
            var shorter = base[i].substring(0, base[i].length - trim);
            if (shorter.length >= 3 && pats.indexOf(shorter) < 0) pats.push(shorter);
          }
        }
        return pats;
      }

      /* 記事タイトルが推し俳優名にマッチするか判定。マッチした表示用名を返す */
      function matchActorInTitle(title, favName) {
        var pats = actorNamePatterns(favName);
        for (var i = 0; i < pats.length; i++) {
          if (title.indexOf(pats[i]) >= 0) return pats[i];
        }
        return null;
      }

      /* =====================================================
         週間アクティビティグラフ
      ===================================================== */
      function renderWeeklyGraph(log) {
        var days = ['日','月','火','水','木','金','土'];
        var todayD = new Date();
        var maxVal = 1;
        var weekTotal = 0;
        var dayData = [];
        var cats = ['views','clips','quiz','keiko','theater'];
        for (var wi = 6; wi >= 0; wi--) {
          var dd = new Date(todayD);
          dd.setDate(dd.getDate() - wi);
          var key = dd.getFullYear() + '-' + String(dd.getMonth()+1).padStart(2,'0') + '-' + String(dd.getDate()).padStart(2,'0');
          var dl = (log.daily_log && log.daily_log[key]) ? log.daily_log[key] : null;
          var vals = {};
          var total = 0;
          for (var ci = 0; ci < cats.length; ci++) {
            var v = dl ? (dl[cats[ci]] || 0) : 0;
            vals[cats[ci]] = v;
            total += v;
          }
          if (total > maxVal) maxVal = total;
          weekTotal += total;
          dayData.push({ day: days[dd.getDay()], date: String(dd.getMonth()+1) + '/' + dd.getDate(), vals: vals, total: total, isToday: wi === 0 });
        }

        var h = '<div class="kl-section-card">';
        h += '<div class="kl-weekly-header">';
        h += '<div class="kl-weekly-title">📊 今週の学習</div>';
        h += '<div class="kl-weekly-total">合計 <b>' + weekTotal + '</b> アクション</div>';
        h += '</div>';
        h += '<div class="kl-weekly-bars">';
        for (var bi = 0; bi < dayData.length; bi++) {
          var d = dayData[bi];
          h += '<div class="kl-weekly-col">';
          /* 数字 */
          h += '<div class="kl-weekly-num">' + (d.total > 0 ? d.total : '') + '</div>';
          /* スタック棒グラフ */
          h += '<div class="kl-weekly-bar-stack" style="height:50px;">';
          for (var si = 0; si < cats.length; si++) {
            var sv = d.vals[cats[si]];
            if (sv > 0) {
              var segH = Math.max(3, Math.round((sv / maxVal) * 46));
              h += '<div class="kl-weekly-seg kl-weekly-seg-' + cats[si] + '" style="height:' + segH + 'px;" title="' + catLabel(cats[si]) + ': ' + sv + '"></div>';
            }
          }
          if (d.total === 0) {
            h += '<div style="width:100%;height:2px;border-radius:2px;background:var(--kl-border);"></div>';
          }
          h += '</div>';
          /* 曜日 */
          h += '<div class="kl-weekly-day' + (d.isToday ? ' kl-weekly-day-today' : '') + '">' + d.day + '</div>';
          h += '</div>';
        }
        h += '</div>';

        /* 凡例 */
        h += '<div class="kl-weekly-legend">';
        h += '<div class="kl-weekly-leg"><div class="kl-weekly-dot" style="background:var(--kl-red);opacity:0.7;"></div>閲覧</div>';
        h += '<div class="kl-weekly-leg"><div class="kl-weekly-dot" style="background:var(--kl-blue);opacity:0.7;"></div>理解</div>';
        h += '<div class="kl-weekly-leg"><div class="kl-weekly-dot" style="background:var(--kl-gold);opacity:0.8;"></div>クイズ</div>';
        h += '<div class="kl-weekly-leg"><div class="kl-weekly-dot" style="background:var(--kl-green);opacity:0.7;"></div>稽古</div>';
        h += '<div class="kl-weekly-leg"><div class="kl-weekly-dot" style="background:var(--kl-purple);opacity:0.7;"></div>観劇</div>';
        h += '</div>';
        h += '</div>';
        return h;
      }
      function catLabel(c) {
        if (c === 'views') return '閲覧';
        if (c === 'clips') return '理解';
        if (c === 'quiz') return 'クイズ';
        if (c === 'keiko') return '稽古';
        if (c === 'theater') return '観劇';
        return c;
      }

      /* =====================================================
         月次アクティビティカレンダー
      ===================================================== */
      function renderActivityCalendar(tlog, log) {
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth();
        var today = now.getDate();
        var DOW_LABELS = ['日','月','火','水','木','金','土'];

        /* 劇場・映像・学習の日付マップ */
        var theaterDays = {}, mediaDays = {}, learnDays = {};
        for (var i = 0; i < tlog.entries.length; i++) {
          var e = tlog.entries[i];
          if (!e.date) continue;
          var d = new Date(e.date + 'T00:00:00');
          if (d.getFullYear() !== year || d.getMonth() !== month) continue;
          var day = d.getDate();
          if ((e.viewing_type || 'theater') === 'theater') theaterDays[day] = true;
          else mediaDays[day] = true;
        }
        /* daily_log からの学習アクティビティ */
        for (var di = 1; di <= 31; di++) {
          var key = year + '-' + String(month+1).padStart(2,'0') + '-' + String(di).padStart(2,'0');
          var dl = log.daily_log && log.daily_log[key];
          if (dl && (dl.views || dl.clips || dl.quiz || dl.keiko)) learnDays[di] = true;
        }

        var firstDow = new Date(year, month, 1).getDay();
        var lastDay  = new Date(year, month + 1, 0).getDate();
        var monthName = (month + 1) + '月';
        var theaterCount = Object.keys(theaterDays).length;
        var mediaCount   = Object.keys(mediaDays).length;

        var h = '<div class="kl-section-card">';
        h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">';
        h += '<div style="font-size:13px;font-weight:600;color:var(--kl-text);letter-spacing:0.04em;">📅 ' + year + '年' + monthName + 'のアクティビティ</div>';
        var badges = '';
        if (theaterCount > 0) badges += '<span style="font-size:11px;color:var(--kl-red);font-weight:600;margin-left:6px;">🏛️' + theaterCount + '</span>';
        if (mediaCount  > 0) badges += '<span style="font-size:11px;color:var(--kl-blue-text);font-weight:600;margin-left:6px;">📺' + mediaCount + '</span>';
        if (badges) h += '<div>' + badges + '</div>';
        h += '</div>';

        /* 曜日ヘッダー */
        h += '<div class="kl-month-cal">';
        for (var dh = 0; dh < 7; dh++) {
          h += '<div class="kl-cal-header-cell">' + DOW_LABELS[dh] + '</div>';
        }
        /* 先頭の空白 */
        for (var pad = 0; pad < firstDow; pad++) {
          h += '<div class="kl-cal-cell kl-cal-empty"></div>';
        }
        /* 日付セル */
        for (var day = 1; day <= lastDay; day++) {
          var isToday    = (day === today);
          var isTheater  = !!theaterDays[day];
          var isMedia    = !!mediaDays[day];
          var isLearn    = !!learnDays[day];
          var cls = 'kl-cal-cell';
          if (isTheater)     cls += ' kl-cal-theater';
          else if (isMedia)  cls += ' kl-cal-media';
          else if (isLearn)  cls += ' kl-cal-activity';
          if (isToday) cls += ' kl-cal-today';
          h += '<div class="' + cls + '">' + day + '</div>';
        }
        h += '</div>'; /* kl-month-cal */

        /* 凡例 */
        h += '<div class="kl-cal-legend">';
        h += '<div class="kl-cal-leg"><div class="kl-cal-dot" style="background:var(--kl-red-soft);border:1px solid var(--kl-red);"></div>劇場</div>';
        h += '<div class="kl-cal-leg"><div class="kl-cal-dot" style="background:var(--kl-blue-bg);border:1px solid var(--kl-blue-text);"></div>映像</div>';
        h += '<div class="kl-cal-leg"><div class="kl-cal-dot" style="background:var(--kl-accent-soft);"></div>学習</div>';
        h += '<div class="kl-cal-leg"><div class="kl-cal-dot" style="background:var(--kl-gold-soft);border:1px solid var(--kl-gold-light);"></div>今日</div>';
        h += '</div>';

        h += '</div>'; /* kl-section-card */
        return h;
      }

      /* =====================================================
         実績バッジ表示
      ===================================================== */
      function renderBadges(log) {
        var earned = log.badges || [];
        var h = '<div class="kl-badges">';
        for (var bi = 0; bi < BADGE_DEFS.length; bi++) {
          var b = BADGE_DEFS[bi];
          var isEarned = earned.indexOf(b.id) >= 0;
          h += '<div class="kl-badge-item' + (isEarned ? ' kl-badge-item-earned' : '') + '" title="' + esc(b.desc) + '">';
          h += '<span class="kl-badge-icon' + (isEarned ? '' : ' kl-badge-locked') + '">' + b.icon + '</span>';
          h += '<span>' + esc(b.name) + '</span>';
          h += '</div>';
        }
        h += '</div>';
        return h;
      }

      /* =====================================================
         学び直しレコメンド
      ===================================================== */
      function renderRecommend(log) {
        var items = [];
        /* 3日以上前に見たが保存していない演目 */
        var threeDaysAgo = Math.floor(Date.now()/1000) - 3 * 86400;
        var clippedSet = {};
        for (var ci = 0; ci < log.clips.enmoku.length; ci++) {
          clippedSet[log.clips.enmoku[ci].id || log.clips.enmoku[ci]] = true;
        }
        var seenOld = {};
        for (var ri = 0; ri < log.recent.length; ri++) {
          var r = log.recent[ri];
          if (r.type === 'enmoku' && r.ts < threeDaysAgo && !clippedSet[r.id] && !seenOld[r.id]) {
            seenOld[r.id] = true;
            items.push({ icon: '📋', text: r.title || r.id, reason: '3日前に閲覧・まだ未チェック', link: '/kabuki/navi/enmoku/' + encodeURIComponent(r.id) });
          }
          if (items.length >= 3) break;
        }
        /* 間違えたクイズの関連 */
        var qs = loadQuizState();
        if (qs.wrong_ids && qs.wrong_ids.length > 0) {
          var wrongSlice = qs.wrong_ids.slice(-3);
          for (var wi = 0; wi < wrongSlice.length; wi++) {
            items.push({ icon: '❓', text: '間違えたクイズ #' + wrongSlice[wi], reason: '復習して正解率アップ！', link: '/kabuki/dojo/quiz' });
          }
        }
        if (items.length === 0) return '';
        var h = '<div class="kl-recommend">';
        h += '<div class="kl-section-header">🔄 学び直しレコメンド</div>';
        for (var ii = 0; ii < Math.min(5, items.length); ii++) {
          var it = items[ii];
          h += '<a href="' + it.link + '" class="kl-reco-item" onclick="return nav(this)">';
          h += '<span class="kl-reco-icon">' + it.icon + '</span>';
          h += '<div><div>' + esc(it.text) + '</div>';
          h += '<div class="kl-reco-reason">' + esc(it.reason) + '</div></div>';
          h += '</a>';
        }
        h += '</div>';
        return h;
      }

      /* =====================================================
         ひとくち歌舞伎（非同期読込）
      ===================================================== */
      function loadHitokuchi() {
        var area = document.getElementById('hitokuchi-area');
        var textEl = document.getElementById('hitokuchi-text');
        var subEl = document.getElementById('hitokuchi-sub');
        if (!area || !textEl) return;

        /* キャッシュ（当日中は同じ内容） */
        var cacheKey = 'hitokuchi_cache';
        var today = todayStr();
        try {
          var cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');
          if (cached.date === today && cached.text) {
            textEl.textContent = cached.text;
            if (subEl) subEl.textContent = cached.sub || '';
            if (cached.link) area.onclick = function(){ window.location.href = cached.link; };
            return;
          }
        } catch(e){}

        /* glossaryとquizzesから豆知識を生成 */
        Promise.allSettled([
          fetch('/api/glossary').then(function(r){ return r.json(); }),
          fetch('/api/quiz').then(function(r){ return r.json(); })
        ]).then(function(results) {
          var pool = [];
          /* 用語 */
          if (results[0].status === 'fulfilled') {
            var glossary = results[0].value;
            var terms = glossary.terms || glossary;
            if (Array.isArray(terms)) {
              for (var gi = 0; gi < terms.length; gi++) {
                var t = terms[gi];
                if (t.term && t.description) {
                  pool.push({
                    text: '「' + t.term + '」とは？ ── ' + (t.description.length > 60 ? t.description.substring(0,60) + '…' : t.description),
                    sub: '用語いろは > ' + (t.category || ''),
                    link: '/kabuki/navi/glossary/term/' + encodeURIComponent(t.term)
                  });
                }
              }
            }
          }
          /* クイズ */
          if (results[1].status === 'fulfilled') {
            var quizzes = results[1].value;
            if (Array.isArray(quizzes)) {
              for (var qi = 0; qi < quizzes.length; qi++) {
                var q = quizzes[qi];
                if (q.question) {
                  pool.push({
                    text: q.question,
                    sub: 'クイズに挑戦 →',
                    link: '/kabuki/dojo/quiz'
                  });
                }
              }
            }
          }
          if (pool.length === 0) {
            textEl.textContent = '歌舞伎の世界を探索しよう！';
            return;
          }
          /* 日付ベースのランダム選択（当日中は固定） */
          var seed = 0;
          for (var si = 0; si < today.length; si++) seed += today.charCodeAt(si);
          var idx = seed % pool.length;
          var chosen = pool[idx];
          textEl.textContent = chosen.text;
          if (subEl) subEl.textContent = chosen.sub;
          if (chosen.link) area.onclick = function(){ window.location.href = chosen.link; };
          /* キャッシュ保存 */
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ date: today, text: chosen.text, sub: chosen.sub, link: chosen.link }));
          } catch(e){}
        });
      }

      var newsCache = null;
      function loadOshiNews() {
        var favList = loadFavorites();
        var section = document.getElementById("oshi-news-section");
        if (!section) return;
        if (favList.length === 0) {
          section.style.display = "none";
          return;
        }
        function doRender(articles) {
          var matched = [];
          for (var i = 0; i < articles.length; i++) {
            var a = articles[i];
            if (!a.title) continue;
            for (var j = 0; j < favList.length; j++) {
              var hit = matchActorInTitle(a.title, favList[j]);
              if (hit) {
                matched.push({ article: a, actor: favList[j], highlight: hit });
                break;
              }
            }
          }
          if (matched.length === 0) { section.style.display = "none"; return; }
          var top = matched.slice(0, 3);
          var nh = '<div class="mp-section-title">📰 推しニュース <span style="font-size:12px;font-weight:400;color:var(--kl-text3);">直近' + top.length + '件</span></div>';
          for (var k = 0; k < top.length; k++) {
            var m = top[k];
            var pubDate = m.article.pubTs ? formatNewsDate(m.article.pubTs) : "";
            var title = esc(m.article.title);
            var actorEsc = esc(m.highlight);
            title = title.replace(new RegExp(actorEsc, "g"), '<strong class="oshi-highlight">' + actorEsc + '</strong>');
            nh += '<a href="' + esc(m.article.link) + '" target="_blank" rel="noopener" class="oshi-news-card">';
            nh += '<div class="oshi-news-title">' + title + '</div>';
            nh += '<div class="oshi-news-meta">';
            if (m.article.source) nh += '<span>' + esc(m.article.source) + '</span>';
            if (pubDate) nh += '<span>' + pubDate + '</span>';
            nh += '</div>';
            nh += '</a>';
          }
          if (matched.length > 3) {
            nh += '<div style="text-align:right;margin-top:6px;"><button class="mp-btn" style="font-size:12px;padding:6px 14px;" onclick="MP.switchTab(\\'oshi\\')">推しタブでもっと見る →</button></div>';
          }
          section.innerHTML = nh;
          section.style.display = "";
        }
        if (newsCache) { doRender(newsCache); return; }
        fetch("/api/news").then(function(r){ return r.json(); }).then(function(data){
          newsCache = (data && data.articles) || [];
          doRender(newsCache);
        }).catch(function(){ section.style.display = "none"; });
      }
      function formatNewsDate(ts) {
        var d = new Date(ts);
        return (d.getMonth() + 1) + "/" + d.getDate();
      }

      /* 推し俳優管理画面用ニュース検索 */
      function searchOshiNews() {
        var favList = loadFavorites();
        var resultsEl = document.getElementById("fav-news-results");
        var btnEl = document.getElementById("fav-news-btn");
        if (!resultsEl) return;
        if (favList.length === 0) {
          resultsEl.innerHTML = '<div class="mp-empty" style="padding:0.5rem;">推し俳優を登録してからニュースを検索してください</div>';
          resultsEl.style.display = "";
          return;
        }
        if (btnEl) { btnEl.textContent = "📰 検索中…"; btnEl.disabled = true; }
        resultsEl.style.display = "";
        resultsEl.innerHTML = '<div class="mp-empty" style="padding:0.5rem;">ニュースを検索中…</div>';

        function doRender(articles) {
          if (btnEl) { btnEl.textContent = "📰 推し俳優のニュースを検索"; btnEl.disabled = false; }
          var matched = [];
          for (var i = 0; i < articles.length; i++) {
            var a = articles[i];
            if (!a.title) continue;
            for (var j = 0; j < favList.length; j++) {
              var hit = matchActorInTitle(a.title, favList[j]);
              if (hit) {
                matched.push({ article: a, actor: favList[j], highlight: hit });
                break;
              }
            }
          }
          if (matched.length === 0) {
            resultsEl.innerHTML = '<div class="fav-news-empty">推し俳優に関連するニュースは見つかりませんでした</div>';
            return;
          }
          var nh = '<div class="fav-news-header">📰 推しニュース（' + matched.length + '件）</div>';
          for (var k = 0; k < matched.length; k++) {
            var m = matched[k];
            var pubDate = m.article.pubTs ? formatNewsDate(m.article.pubTs) : "";
            var title = esc(m.article.title);
            var actorEsc = esc(m.highlight);
            title = title.replace(new RegExp(actorEsc, "g"), '<strong class="oshi-highlight">' + actorEsc + '</strong>');
            nh += '<a href="' + esc(m.article.link) + '" target="_blank" rel="noopener" class="oshi-news-card">';
            nh += '<div class="oshi-news-title">' + title + '</div>';
            nh += '<div class="oshi-news-meta">';
            if (m.article.source) nh += '<span>' + esc(m.article.source) + '</span>';
            if (pubDate) nh += '<span>' + pubDate + '</span>';
            nh += '</div>';
            nh += '</a>';
          }
          resultsEl.innerHTML = nh;
        }

        if (newsCache) { doRender(newsCache); return; }
        fetch("/api/news").then(function(r){ return r.json(); }).then(function(data){
          newsCache = (data && data.articles) || [];
          doRender(newsCache);
        }).catch(function(){
          if (btnEl) { btnEl.textContent = "📰 推し俳優のニュースを検索"; btnEl.disabled = false; }
          resultsEl.innerHTML = '<div class="fav-news-empty">ニュースの取得に失敗しました</div>';
        });
      }

      /* ホーム画面用ニュース検索 */
      function searchOshiNewsHome() {
        var favList = loadFavorites();
        var resultsEl = document.getElementById("oshi-news-home");
        var btnEl = document.querySelector(".oshi-news-btn");
        if (!resultsEl) return;
        if (favList.length === 0) return;
        if (btnEl) { btnEl.textContent = "📰 検索中…"; btnEl.disabled = true; }
        resultsEl.style.display = "";
        resultsEl.innerHTML = '<div class="mp-empty" style="padding:0.5rem;">ニュースを検索中…</div>';

        function doRender(articles) {
          if (btnEl) { btnEl.textContent = "📰 推しニュースを検索"; btnEl.disabled = false; }
          var matched = [];
          for (var i = 0; i < articles.length; i++) {
            var a = articles[i];
            if (!a.title) continue;
            for (var j = 0; j < favList.length; j++) {
              var hit = matchActorInTitle(a.title, favList[j]);
              if (hit) {
                matched.push({ article: a, actor: favList[j], highlight: hit });
                break;
              }
            }
          }
          if (matched.length === 0) {
            resultsEl.innerHTML = '<div class="fav-news-empty">推し俳優に関連するニュースは見つかりませんでした</div>';
            return;
          }
          var nh = '<div class="fav-news-header">📰 推しニュース（' + matched.length + '件）</div>';
          var top = matched.slice(0, 10);
          for (var k = 0; k < top.length; k++) {
            var m = top[k];
            var pubDate = m.article.pubTs ? formatNewsDate(m.article.pubTs) : "";
            var title = esc(m.article.title);
            var actorEsc = esc(m.highlight);
            title = title.replace(new RegExp(actorEsc, "g"), '<strong class="oshi-highlight">' + actorEsc + '</strong>');
            nh += '<a href="' + esc(m.article.link) + '" target="_blank" rel="noopener" class="oshi-news-card">';
            nh += '<div class="oshi-news-title">' + title + '</div>';
            nh += '<div class="oshi-news-meta">';
            if (m.article.source) nh += '<span>' + esc(m.article.source) + '</span>';
            if (pubDate) nh += '<span>' + pubDate + '</span>';
            nh += '</div>';
            nh += '</a>';
          }
          if (matched.length > 10) {
            nh += '<div style="text-align:right;margin-top:0.3rem;"><a href="/kabuki/live/news" class="oshi-news-more">すべてのニュースを見る →</a></div>';
          }
          resultsEl.innerHTML = nh;
        }

        if (newsCache) { doRender(newsCache); return; }
        fetch("/api/news").then(function(r){ return r.json(); }).then(function(data){
          newsCache = (data && data.articles) || [];
          doRender(newsCache);
        }).catch(function(){
          if (btnEl) { btnEl.textContent = "📰 推しニュースを検索"; btnEl.disabled = false; }
          resultsEl.innerHTML = '<div class="fav-news-empty">ニュースの取得に失敗しました</div>';
        });
      }

      /* =====================================================
         入力フォーム HTML
      ===================================================== */
      function renderForm() {
        var h = '<div class="tl-form">';
        var formTitle = editingEntryId ? '記録を編集' : '🎭 観劇を記録';
        h += '<div class="tl-form-title"><span>' + formTitle + '</span><button class="tl-form-close" onclick="MP.closeForm()">✕</button></div>';

        /* Step 0: 視聴方法 */
        h += '<div class="tl-step">';
        h += '<div class="tl-step-label">視聴方法';
        if (formState.viewing_type) h += '<span class="tl-step-check">✓</span>';
        h += '</div>';
        h += '<div class="tl-chips">';
        for (var mi = 0; mi < MEDIA_TYPES.length; mi++) {
          var mcls = formState.viewing_type === MEDIA_TYPES[mi].id ? " tl-chip-active" : "";
          h += '<button class="tl-chip' + mcls + '" onclick="MP.setViewingType(\\'' + MEDIA_TYPES[mi].id + '\\')">' + MEDIA_TYPES[mi].icon + ' ' + MEDIA_TYPES[mi].label + '</button>';
        }
        h += '</div>';
        h += '</div>';

        /* メディア視聴用フォーム */
        if (formState.viewing_type && formState.viewing_type !== "theater") {
          return h + renderMediaForm();
        }

        /* === 劇場フォーム（既存） === */
        if (!formState.viewing_type) {
          h += '</div>';
          return h;
        }

        /* Step 1: 日付 */
        h += '<div class="tl-step">';
        h += '<div class="tl-step-label"><span class="tl-step-num">1</span>日付';
        if (formState.date) h += '<span class="tl-step-check">✓</span>';
        h += '</div>';
        h += '<input type="date" class="tl-date-input" id="tl-f-date" value="' + (formState.date || todayStr()) + '">';
        h += '</div>';

        /* Step 2: 会場 */
        h += '<div class="tl-step">';
        h += '<div class="tl-step-label"><span class="tl-step-num">2</span>会場';
        if (formState.venue_id) h += '<span class="tl-step-check">✓</span>';
        h += '</div>';

        /* 最近使った会場を上に */
        var recentVenues = getRecentVenues();
        if (recentVenues.length > 0) {
          h += '<div class="tl-chip-group-label">最近行った会場</div>';
          h += '<div class="tl-chips">';
          for (var rv = 0; rv < recentVenues.length; rv++) {
            var rvc = formState.venue_id === recentVenues[rv].id ? " tl-chip-active" : "";
            h += '<button class="tl-chip' + rvc + '" onclick="MP.setVenue(\\'' + recentVenues[rv].id + '\\',\\'' + esc(recentVenues[rv].name) + '\\')">' + esc(recentVenues[rv].name) + '</button>';
          }
          h += '</div>';
        }

        /* 大歌舞伎 */
        h += '<div class="tl-chip-group-label">大歌舞伎</div>';
        h += '<div class="tl-chips">';
        for (var vi = 0; vi < VENUES.length; vi++) {
          if (VENUES[vi].group !== "大歌舞伎") continue;
          var cls = formState.venue_id === VENUES[vi].id ? " tl-chip-active" : "";
          h += '<button class="tl-chip' + cls + '" onclick="MP.setVenue(\\'' + VENUES[vi].id + '\\',\\'' + esc(VENUES[vi].name) + '\\')">' + esc(VENUES[vi].name) + '</button>';
        }
        h += '</div>';

        /* 地歌舞伎 */
        h += '<div class="tl-chip-group-label">地歌舞伎</div>';
        h += '<div class="tl-chips">';
        for (var vi = 0; vi < VENUES.length; vi++) {
          if (VENUES[vi].group !== "地歌舞伎") continue;
          var cls = formState.venue_id === VENUES[vi].id ? " tl-chip-active" : "";
          h += '<button class="tl-chip' + cls + '" onclick="MP.setVenue(\\'' + VENUES[vi].id + '\\',\\'' + esc(VENUES[vi].name) + '\\')">' + esc(VENUES[vi].name) + '</button>';
        }
        h += '</div>';

        /* その他 */
        h += '<div class="tl-venue-custom">';
        h += '<input type="text" class="tl-venue-custom-input" id="tl-f-venue-custom" placeholder="その他の会場名">';
        h += '<button class="tl-venue-custom-btn" onclick="MP.setCustomVenue()">決定</button>';
        h += '</div>';
        h += '</div>';

        /* Step 3: 公演 (会場選択後に表示) */
        if (formState.venue_id) {
          h += '<div class="tl-step">';
          h += '<div class="tl-step-label"><span class="tl-step-num">3</span>公演（任意）';
          if (formState.performance_title) h += '<span class="tl-step-check">✓</span>';
          h += '</div>';
          h += '<div id="tl-f-perf-area"><div class="tl-perf-loading">公演候補を検索中…</div></div>';
          h += '</div>';
        }

        /* Step 4: 演目 (公演選択後に表示) */
        if (formState.venue_id && formState.performance_title) {
          h += '<div class="tl-step">';
          h += '<div class="tl-step-label"><span class="tl-step-num">5</span>演目（任意・複数OK）';
          if (formState.play_titles.length > 0) h += '<span class="tl-step-check">✓</span>';
          h += '</div>';

          /* 公演データに演目候補があれば、チェックボックスで表示 */
          var candidatePlays = getPlayCandidates();
          if (candidatePlays.length > 0) {
            h += '<div class="tl-play-candidates">';
            for (var ci = 0; ci < candidatePlays.length; ci++) {
              var cp = candidatePlays[ci];
              if (cp.program) {
                h += '<div class="tl-play-program-label">' + esc(cp.program) + '</div>';
              }
              for (var cj = 0; cj < cp.plays.length; cj++) {
                var playItem = cp.plays[cj];
                var playTitle = (typeof playItem === "string") ? playItem : playItem.title;
                var playScenes = (typeof playItem === "object" && playItem.scenes) ? playItem.scenes : "";
                var playCast = (typeof playItem === "object" && playItem.cast) ? playItem.cast : [];
                var checked = formState.play_titles.indexOf(playTitle) >= 0;
                var chkCls = checked ? " tl-play-check-active" : "";
                h += '<label class="tl-play-check' + chkCls + '">';
                h += '<span class="tl-play-check-box">' + (checked ? "✓" : "") + '</span>';
                h += '<div class="tl-play-check-content">';
                h += '<span class="tl-play-check-label">' + esc(playTitle) + (playScenes ? ' <span style="font-size:0.78rem;color:var(--kl-text3);">（' + esc(playScenes) + '）</span>' : '') + '</span>';
                if (playCast.length > 0) {
                  var actorNames = [];
                  for (var ak = 0; ak < Math.min(playCast.length, 5); ak++) actorNames.push(playCast[ak].actor);
                  var actorStr = actorNames.join('　');
                  if (playCast.length > 5) actorStr += ' 他';
                  h += '<span class="tl-play-check-actors">' + esc(actorStr) + '</span>';
                }
                h += '</div>';
                h += '<input type="checkbox" style="display:none;" ' + (checked ? "checked" : "") + ' onchange="MP.togglePlay(\\'' + esc(playTitle).replace(/'/g,"\\\\'") + '\\')">';
                h += '</label>';
              }
            }
            h += '</div>';
          }

          h += '<div class="tl-play-tags" id="tl-f-play-tags">';
          /* 候補にない手入力分のみタグ表示 */
          var candidateFlat = flattenCandidatePlays(candidatePlays);
          for (var pi = 0; pi < formState.play_titles.length; pi++) {
            if (candidateFlat.indexOf(formState.play_titles[pi]) >= 0) continue;
            h += '<span class="tl-play-tag">' + esc(formState.play_titles[pi]) + ' <button class="tl-play-tag-remove" onclick="MP.removePlay(' + pi + ')">✕</button></span>';
          }
          h += '</div>';
          h += '<div style="display:flex;gap:0.3rem;margin-top:0.3rem;">';
          h += '<input type="text" class="tl-play-input" id="tl-f-play-input" placeholder="演目名を手入力で追加" style="flex:1;">';
          h += '<button class="tl-venue-custom-btn" onclick="MP.addPlay()">追加</button>';
          h += '</div>';
          if (candidatePlays.length === 0) {
            h += '<div class="tl-play-hint">カンマ（,）区切りで複数入力も可</div>';
          }
          h += '</div>';
        }

        /* Step 5: 座席種（任意） */
        if (formState.venue_id) {
          h += '<div class="tl-step">';
          h += '<div class="tl-step-label"><span class="tl-step-num">5</span>座席種（任意）';
          if (formState.seat_type) h += '<span class="tl-step-check">✓</span>';
          h += '</div>';
          h += '<div class="tl-chips">';
          for (var si = 0; si < SEAT_TYPES.length; si++) {
            var scls = formState.seat_type === SEAT_TYPES[si].id ? " tl-chip-active" : "";
            h += '<button class="tl-chip' + scls + '" onclick="MP.setSeat(\\'' + SEAT_TYPES[si].id + '\\')">' + SEAT_TYPES[si].label + '</button>';
          }
          h += '</div>';
          h += '</div>';
        }

        /* Step 6: メモ */
        if (formState.venue_id) {
          h += '<div class="tl-step">';
          h += '<div class="tl-step-label"><span class="tl-step-num">6</span>ひとこと（任意）</div>';
          h += '<textarea class="tl-memo-input" id="tl-f-memo" placeholder="感想、気づき、メモ…">' + esc(formState.memo) + '</textarea>';
          h += '</div>';

          /* Step 7: 写真 */
          h += '<div class="tl-step">';
          h += '<div class="tl-step-label">写真（任意）</div>';
          h += '<input type="file" id="tl-f-image-file" accept="image/jpeg,image/png,image/webp" style="display:none;" onchange="MP.uploadImage(this)">';
          h += '<button class="tl-chip" onclick="document.getElementById(\\'tl-f-image-file\\').click()" style="margin-bottom:8px;">📷 写真を追加</button>';
          h += '<span class="tl-upload-status" id="tl-upload-status"></span>';
          if (formState.image_url) {
            h += '<div class="tl-image-preview" id="tl-image-preview">';
            h += '<img src="' + esc(formState.image_url) + '" alt="プレビュー">';
            h += '<button class="tl-image-remove" onclick="MP.removeImage()">✕</button>';
            h += '</div>';
          } else {
            h += '<div class="tl-image-preview" id="tl-image-preview"></div>';
          }
          h += '</div>';
        }

        /* 保存ボタン */
        var canSave = formState.date && formState.venue_id;
        h += '<div class="tl-save-row">';
        var saveBtnLabel = editingEntryId ? '保存する' : '🎭 記録する';
        h += '<button class="tl-save-btn" onclick="MP.saveEntry()"' + (canSave ? '' : ' disabled') + '>' + saveBtnLabel + '</button>';
        h += '</div>';

        h += '</div>';
        return h;
      }

      /* ── メディア視聴用フォーム ── */
      function renderMediaForm() {
        var vt = formState.viewing_type;
        var h = '';

        /* Step 1: 日付 */
        h += '<div class="tl-step">';
        h += '<div class="tl-step-label"><span class="tl-step-num">1</span>日付';
        if (formState.date) h += '<span class="tl-step-check">✓</span>';
        h += '</div>';
        h += '<input type="date" class="tl-date-input" id="tl-f-date" value="' + (formState.date || todayStr()) + '">';
        h += '</div>';

        /* Step 2: 作品/番組名 */
        h += '<div class="tl-step">';
        h += '<div class="tl-step-label"><span class="tl-step-num">2</span>作品・番組名';
        if (formState.media_title) h += '<span class="tl-step-check">✓</span>';
        h += '</div>';
        var mtPlaceholder = vt === "dvd" ? "例: 歌舞伎名作撰 勧進帳" : vt === "tv" ? "例: NHK 古典芸能への招待" : vt === "youtube" ? "例: 歌舞伎ましょう" : vt === "streaming" ? "例: 歌舞伎オンデマンド" : "作品名を入力";
        h += '<input type="text" class="tl-text-input" id="tl-f-media-title" placeholder="' + mtPlaceholder + '" value="' + esc(formState.media_title) + '">';
        h += '</div>';

        /* Step 3: 演目（複数追加可能） */
        h += '<div class="tl-step">';
        h += '<div class="tl-step-label"><span class="tl-step-num">3</span>演目（任意・複数OK）</div>';
        if (formState.media_plays.length > 0) {
          h += '<div class="tl-selected-tags">';
          for (var pi = 0; pi < formState.media_plays.length; pi++) {
            h += '<span class="tl-tag">' + esc(formState.media_plays[pi]) + ' <button class="tl-tag-remove" onclick="MP.removeMediaPlay(' + pi + ')">✕</button></span>';
          }
          h += '</div>';
        }
        h += '<div class="tl-inline-add">';
        h += '<input type="text" class="tl-text-input" id="tl-f-media-play" placeholder="演目名を入力">';
        h += '<button class="tl-add-btn" onclick="MP.addMediaPlay()">追加</button>';
        h += '</div>';
        h += '</div>';

        /* Step 4: 出演俳優（任意） */
        h += '<div class="tl-step">';
        h += '<div class="tl-step-label"><span class="tl-step-num">4</span>出演俳優（任意）</div>';
        h += '<input type="text" class="tl-text-input" id="tl-f-media-actors" placeholder="例: 市川團十郎, 尾上菊五郎" value="' + esc(formState.media_actors_text) + '">';
        h += '<div class="tl-hint">カンマ区切りで複数入力できます</div>';
        h += '</div>';

        /* Step 5: メモ */
        h += '<div class="tl-step">';
        h += '<div class="tl-step-label"><span class="tl-step-num">5</span>ひとこと（任意）</div>';
        h += '<textarea class="tl-memo-input" id="tl-f-memo" placeholder="感想、気づき、メモ…">' + esc(formState.memo) + '</textarea>';
        h += '</div>';

        /* Step 6: 写真 */
        h += '<div class="tl-step">';
        h += '<div class="tl-step-label">写真（任意）</div>';
        h += '<input type="file" id="tl-f-image-file" accept="image/jpeg,image/png,image/webp" style="display:none;" onchange="MP.uploadImage(this)">';
        h += '<button class="tl-chip" onclick="document.getElementById(\\'tl-f-image-file\\').click()" style="margin-bottom:8px;">📷 写真を追加</button>';
        h += '<span class="tl-upload-status" id="tl-upload-status"></span>';
        if (formState.image_url) {
          h += '<div class="tl-image-preview" id="tl-image-preview">';
          h += '<img src="' + esc(formState.image_url) + '" alt="プレビュー">';
          h += '<button class="tl-image-remove" onclick="MP.removeImage()">✕</button>';
          h += '</div>';
        } else {
          h += '<div class="tl-image-preview" id="tl-image-preview"></div>';
        }
        h += '</div>';

        /* 保存ボタン */
        var canSave = formState.date && formState.media_title;
        h += '<div class="tl-save-row">';
        var saveBtnLabel = editingEntryId ? '保存する' : mediaIcon(vt) + ' 記録する';
        h += '<button class="tl-save-btn" onclick="MP.saveMediaEntry()"' + (canSave ? '' : ' disabled') + '>' + saveBtnLabel + '</button>';
        h += '</div>';

        h += '</div>'; /* tl-form */
        return h;
      }

      /* =====================================================
         フォーム操作
      ===================================================== */
      function bindFormEvents() {
        if (!formOpen) return;

        /* メディアフォーム用バインド */
        if (formState.viewing_type && formState.viewing_type !== "theater") {
          var mDateEl = document.getElementById("tl-f-date");
          if (mDateEl) {
            mDateEl.addEventListener("change", function() { formState.date = mDateEl.value; });
          }
          var mTitleEl = document.getElementById("tl-f-media-title");
          if (mTitleEl) {
            mTitleEl.addEventListener("input", function() { formState.media_title = mTitleEl.value.trim(); });
          }
          var mActorsEl = document.getElementById("tl-f-media-actors");
          if (mActorsEl) {
            mActorsEl.addEventListener("input", function() { formState.media_actors_text = mActorsEl.value.trim(); });
          }
          var mPlayInput = document.getElementById("tl-f-media-play");
          if (mPlayInput) {
            mPlayInput.addEventListener("keydown", function(e) {
              if (e.key === "Enter") { e.preventDefault(); MP.addMediaPlay(); }
            });
          }
          return;
        }

        var dateEl = document.getElementById("tl-f-date");
        if (dateEl) {
          dateEl.addEventListener("change", function() {
            formState.date = dateEl.value;
            /* 公演候補を再取得 */
            loadPerfCandidates();
          });
        }

        var playInput = document.getElementById("tl-f-play-input");
        if (playInput) {
          playInput.addEventListener("keydown", function(e) {
            if (e.key === "Enter") { e.preventDefault(); MP.addPlay(); }
          });
        }

        /* 公演候補ロード */
        loadPerfCandidates();
      }

      function loadPerfCandidates() {
        var area = document.getElementById("tl-f-perf-area");
        if (!area) return;
        if (!formState.venue_id || !formState.date) {
          perfCandidates = [];
          area.innerHTML = '<div class="tl-perf-none">日付と会場を選ぶと候補が出ます</div>';
          return;
        }
        area.innerHTML = '<div class="tl-perf-loading">公演候補を検索中…</div>';
        fetchPerformances(function(allPerfs) {
          var matched = matchPerformances(allPerfs, formState.date, formState.venue_name);
          perfCandidates = matched;
          if (matched.length === 0) {
            area.innerHTML = '<div class="tl-perf-none">候補なし（手入力で追加できます）</div>'
              + '<div class="tl-venue-custom" style="margin-top:0.3rem;">'
              + '<input type="text" class="tl-venue-custom-input" id="tl-f-perf-custom" placeholder="公演名を入力">'
              + '<button class="tl-venue-custom-btn" onclick="MP.setCustomPerf()">決定</button>'
              + '</div>';
            return;
          }
          var ph = '<div class="tl-perf-cards">';
          for (var i = 0; i < matched.length; i++) {
            var p = matched[i];
            var active = formState.performance_title === p.title ? " tl-perf-card-active" : "";
            var hasPlays = p.programs && p.programs.length > 0;
            ph += '<div class="tl-perf-card' + active + '" onclick="MP.setPerf(\\'' + esc(p.title).replace(/'/g,"\\\\'") + '\\')">';
            ph += '<div class="tl-perf-card-title">' + esc(p.title) + '</div>';
            if (p.period_text) ph += '<div class="tl-perf-card-period">' + esc(p.period_text) + '</div>';
            if (p.status) ph += '<div class="tl-perf-card-status">' + esc(p.status) + '</div>';
            if (hasPlays) {
              var playCount = 0;
              for (var k = 0; k < p.programs.length; k++) playCount += p.programs[k].plays.length;
              ph += '<div class="tl-perf-card-plays">📜 演目 ' + playCount + '本</div>';
            }
            ph += '</div>';
          }
          ph += '</div>';
          ph += '<div class="tl-venue-custom" style="margin-top:0.3rem;">';
          ph += '<input type="text" class="tl-venue-custom-input" id="tl-f-perf-custom" placeholder="別の公演名を入力">';
          ph += '<button class="tl-venue-custom-btn" onclick="MP.setCustomPerf()">決定</button>';
          ph += '</div>';
          if (formState.performance_title) {
            ph += '<button class="mp-btn mp-btn-danger" style="margin-top:0.3rem;font-size:0.72rem;" onclick="MP.clearPerf()">公演をクリア</button>';
          }
          area.innerHTML = ph;
        });
      }

      /* 選択中の公演の演目候補を返す */
      function getPlayCandidates() {
        if (!formState.performance_title) return [];
        for (var i = 0; i < perfCandidates.length; i++) {
          if (perfCandidates[i].title === formState.performance_title && perfCandidates[i].programs) {
            return perfCandidates[i].programs;
          }
        }
        return [];
      }
      /* plays は {title,cast}[] 形式。タイトル文字列の配列を返す */
      function flattenCandidatePlays(candidates) {
        var flat = [];
        for (var i = 0; i < candidates.length; i++) {
          for (var j = 0; j < candidates[i].plays.length; j++) {
            var p = candidates[i].plays[j];
            flat.push(typeof p === "string" ? p : p.title);
          }
        }
        return flat;
      }
      /* 選択中の演目に出演している俳優名リストを返す */
      function getSelectedActors() {
        var actors = [];
        var seen = {};
        var candidatePlays = getPlayCandidates();
        for (var i = 0; i < candidatePlays.length; i++) {
          var plays = candidatePlays[i].plays || [];
          for (var j = 0; j < plays.length; j++) {
            var p = plays[j];
            if (typeof p === "string") continue;
            var title = p.title;
            if (formState.play_titles.indexOf(title) < 0) continue;
            var cast = p.cast || [];
            for (var k = 0; k < cast.length; k++) {
              if (!seen[cast[k].actor]) {
                seen[cast[k].actor] = true;
                actors.push(cast[k].actor);
              }
            }
          }
        }
        return actors;
      }

      function getRecentVenues() {
        var tlog = loadTlog();
        var seen = {};
        var result = [];
        for (var i = 0; i < tlog.entries.length; i++) {
          var e = tlog.entries[i];
          var vid = e.venue_id;
          if (!vid || seen[vid]) continue;
          seen[vid] = true;
          result.push({ id: vid, name: e.venue_name || venueName(vid) });
          if (result.length >= 3) break;
        }
        return result;
      }

      /* =====================================================
         最近見た一覧
      ===================================================== */
      function renderRecent() {
        var log = loadLog();
        var all = log.recent;
        var h = '<div class="mp-header"><h2>🕐 最近見た</h2>';
        h += '<div class="mp-summary">全' + all.length + '件</div></div>';
        h += '<div class="mp-actions" style="margin-bottom:1rem;">';
        h += '<button class="mp-btn" onclick="MP.goSub(null)">← 戻る</button>';
        if (all.length > 0) h += '<button class="mp-btn mp-btn-danger" onclick="MP.clearRecent()">🗑 履歴をクリア</button>';
        h += '</div>';
        if (all.length === 0) {
          h += '<div class="mp-empty">まだ履歴がないよ🙂</div>';
        } else {
          for (var i = 0; i < all.length; i++) {
            var r = all[i];
            h += '<a href="' + itemLink(r) + '" class="mp-item">';
            h += '<span class="mp-item-icon">' + typeIcon(r.type) + '</span>';
            h += '<div class="mp-item-body"><div class="mp-item-title">' + esc(r.title || "(不明)") + '</div>';
            h += '<div class="mp-item-sub">' + typeName(r.type) + '</div></div>';
            h += '<span class="mp-item-time">' + relTime(r.ts) + '</span>';
            h += '</a>';
          }
        }
        app.innerHTML = h;
      }

      /* =====================================================
         クリップ
      ===================================================== */
      function renderClips() {
        var log = loadLog();
        var h = '<div class="mp-header"><h2>⭐ クリップ</h2></div>';
        h += '<div class="mp-actions" style="margin-bottom:1rem;">';
        h += '<button class="mp-btn" onclick="MP.goSub(null)">← 戻る</button>';
        h += '</div>';
        h += '<div class="mp-tabs">';
        h += '<button class="mp-tab' + (clipTab==="enmoku" ? " mp-tab-active" : "") + '" onclick="MP.goClip(\\'enmoku\\')">📜 演目（' + log.clips.enmoku.length + '）</button>';
        h += '<button class="mp-tab' + (clipTab==="person" ? " mp-tab-active" : "") + '" onclick="MP.goClip(\\'person\\')">🎭 人物（' + log.clips.person.length + '）</button>';
        h += '<button class="mp-tab' + (clipTab==="term" ? " mp-tab-active" : "") + '" onclick="MP.goClip(\\'term\\')">📖 用語（' + log.clips.term.length + '）</button>';
        h += '</div>';
        var items = [];
        if (clipTab === "enmoku") {
          items = log.clips.enmoku.map(function(id) {
            return { id: id, title: id, link: "/kabuki/navi/enmoku/" + encodeURIComponent(id), type: "enmoku" };
          });
        } else if (clipTab === "person") {
          items = log.clips.person.map(function(p) {
            var pid = typeof p === "string" ? p : p.id;
            var parent = typeof p === "object" ? p.parent : "";
            var title = (typeof p === "object" && p.title) ? p.title : pid;
            var link = parent ? "/kabuki/navi/enmoku/" + encodeURIComponent(parent) + "#cast-" + encodeURIComponent(pid) : "#";
            return { id: pid, title: title, link: link, type: "person" };
          });
        } else {
          items = log.clips.term.map(function(id) {
            return { id: id, title: id, link: "/kabuki/navi/glossary/term/" + encodeURIComponent(id), type: "term" };
          });
        }
        if (items.length === 0) {
          h += '<div class="mp-empty">' + typeName(clipTab) + 'のクリップはまだないよ🙂</div>';
        } else {
          for (var i = 0; i < items.length; i++) {
            var it = items[i];
            h += '<div class="mp-item">';
            h += '<span class="mp-item-icon">' + typeIcon(it.type) + '</span>';
            h += '<a href="' + it.link + '" style="flex:1; min-width:0; text-decoration:none; color:var(--text-primary);">';
            h += '<div class="mp-item-title">' + esc(it.title) + '</div></a>';
            h += '<button class="mp-btn mp-btn-danger" style="padding:0.3rem 0.6rem; font-size:0.7rem;" onclick="MP.removeClip(\\'' + clipTab + '\\',\\'' + esc(it.id) + '\\')">解除</button>';
            h += '</div>';
          }
        }
        app.innerHTML = h;
      }

      /* =====================================================
         復習
      ===================================================== */
      function renderReview() {
        var quizState = loadQuizState();
        var wc = (quizState.wrong_ids || []).length;
        var h = '<div class="mp-header"><h2>🧩 クイズ復習</h2></div>';
        h += '<div class="mp-actions" style="margin-bottom:1rem;">';
        h += '<button class="mp-btn" onclick="MP.goSub(null)">← 戻る</button>';
        h += '</div>';
        if (quizState.answered_total === 0) {
          h += '<div class="mp-empty">まだクイズに挑戦していないよ🙂<br>まずはクイズに挑戦してみよう！</div>';
          h += '<div class="mp-actions"><a href="/kabuki/dojo/quiz" class="mp-btn mp-btn-primary">クイズに挑戦</a></div>';
        } else {
          h += '<div style="padding:0.8rem 1rem; background:var(--bg-subtle); border-radius:10px; border:1px solid var(--border-medium); margin-bottom:1rem;">';
          h += '<div style="font-size:0.88rem; color:var(--text-primary); margin-bottom:0.5rem;">📊 成績</div>';
          h += '<div style="font-size:1.1rem; color:var(--gold); font-weight:bold;">' + quizState.correct_total + ' / ' + quizState.answered_total + ' 問正解</div>';
          var title = calcTitle(quizState.correct_total, 100);
          h += '<div style="font-size:0.82rem; color:var(--kl-text3); margin-top:0.3rem;">称号：' + title + '</div>';
          if (wc > 0) {
            h += '<div style="font-size:0.88rem; color:var(--accent-1); margin-top:0.5rem;">間違えた問題：' + wc + '問</div>';
          }
          h += '</div>';
          h += '<div class="mp-actions">';
          if (wc > 0) h += '<a href="/kabuki/dojo/quiz" class="mp-btn mp-btn-primary">復習する（' + wc + '問）</a>';
          h += '<a href="/kabuki/dojo/quiz" class="mp-btn">クイズを続ける</a>';
          h += '</div>';
        }
        app.innerHTML = h;
      }

      /* =====================================================
         推し俳優管理
      ===================================================== */
      var perfActorCache = null;
      function loadPerfActors(cb) {
        if (perfActorCache) { cb(perfActorCache); return; }
        fetchPerformances(function(perfs) {
          var seen = {};
          var list = [];
          for (var i = 0; i < perfs.length; i++) {
            var progs = perfs[i].programs || [];
            for (var j = 0; j < progs.length; j++) {
              var plays = progs[j].plays || [];
              for (var k = 0; k < plays.length; k++) {
                var cast = (typeof plays[k] === "object" ? plays[k].cast : null) || [];
                for (var c = 0; c < cast.length; c++) {
                  var name = cast[c].actor;
                  if (name && !seen[name]) { seen[name] = true; list.push(name); }
                }
              }
            }
          }
          list.sort(function(a, b) { return a.localeCompare(b, "ja"); });
          perfActorCache = list;
          cb(list);
        });
      }

      /* 俳優名鑑キャッシュ */
      var actorMeikanCache = null;
      function loadActorMeikan(cb) {
        if (actorMeikanCache) return cb(actorMeikanCache);
        fetch("/api/actors").then(function(r){ return r.json(); }).then(function(d){
          actorMeikanCache = d;
          cb(d);
        }).catch(function(){ cb([]); });
      }

      var favYagoFilter = '';  /* 屋号フィルター状態 */

      /* ── 人気俳優リスト（初期キュレーション） ── */
      var POPULAR_ACTORS = JSON.parse('[' +
        '"\\u5341\\u4e09\\u4ee3\\u76ee\\u5e02\\u5ddd\\u5718\\u5341\\u90ce",' +
        '"\\u7247\\u5ca1\\u4ec1\\u5de6\\u885b\\u9580",' +
        '"\\u5742\\u6771\\u7389\\u4e09\\u90ce",' +
        '"\\u4e2d\\u6751\\u52d8\\u4e5d\\u90ce",' +
        '"\\u4e2d\\u6751\\u4e03\\u4e4b\\u52a9",' +
        '"\\u5c3e\\u4e0a\\u83ca\\u4e4b\\u52a9",' +
        '"\\u677e\\u672c\\u5e78\\u56db\\u90ce",' +
        '"\\u677e\\u672c\\u767d\\u9e1a",' +
        '"\\u4e2d\\u6751\\u829d\\u7feb",' +
        '"\\u5c3e\\u4e0a\\u677e\\u4e5f",' +
        '"\\u5c3e\\u4e0a\\u83ca\\u4e94\\u90ce",' +
        '"\\u7247\\u5ca1\\u611b\\u4e4b\\u52a9",' +
        '"\\u4e2d\\u6751\\u6885\\u7389",' +
        '"\\u4e2d\\u6751\\u9d08\\u6cbb\\u90ce",' +
        '"\\u5e02\\u5ddd\\u67d3\\u4e94\\u90ce",' +
        '"\\u5c3e\\u4e0a\\u53f3\\u8fd1",' +
        '"\\u4e2d\\u6751\\u96bc\\u4eba",' +
        '"\\u5742\\u6771\\u5df3\\u4e4b\\u52a9",' +
        '"\\u4e2d\\u6751\\u6a4b\\u4e4b\\u52a9",' +
        '"\\u5e02\\u5ddd\\u4e2d\\u8eca",' +
        '"\\u5c3e\\u4e0a\\u677e\\u7dd1"' +
      ']');

      /* 人気俳優グリッド描画 */
      function renderPopularActors(favList, containerId) {
        var el = document.getElementById(containerId || 'popular-actors-grid');
        if (!el) return;
        var buildHTML = function(meikan) {
          var ph = '';
          for (var i = 0; i < POPULAR_ACTORS.length; i++) {
            var name = POPULAR_ACTORS[i];
            var isFav = favList.indexOf(name) >= 0;
            var info = null;
            if (meikan) {
              for (var mi = 0; mi < meikan.length; mi++) {
                var nk = (meikan[mi].name_kanji || '').replace(/\\s+/g, '');
                if (nk === name) { info = meikan[mi]; break; }
              }
            }
            ph += '<div class="fav-actor-card' + (isFav ? ' fav-actor-selected' : '') +
              '" onclick="MP.toggleFavPopular(\\'' + esc(name).replace(/'/g, "\\\\'") + '\\')">';
            if (info && info.yago) {
              var yS = info.yago.length > 3 ? info.yago.substring(0, 3) : info.yago;
              ph += '<div class="fav-actor-yago-badge" title="' + esc(info.yago) + '">' + esc(yS) + '<\/div>';
            } else {
              ph += '<div class="fav-actor-icon">\uD83C\uDFAD<\/div>';
            }
            ph += '<div class="fav-actor-info">';
            ph += '<div class="fav-actor-name">' + (isFav ? '\u2605 ' : '') + esc(name) + '<\/div>';
            if (info) {
              var sub = [];
              if (info.generation) sub.push(info.generation);
              if (sub.length) ph += '<div class="fav-actor-sub">' + esc(sub.join(' / ')) + '<\/div>';
            }
            ph += '<\/div>';
            ph += '<span class="fav-actor-badge' + (isFav ? '' : ' fav-actor-badge-add') + '">' + (isFav ? '\u767b\u9332\u6e08' : '\uff0b\u8ffd\u52a0') + '<\/span>';
            ph += '<\/div>';
          }
          el.innerHTML = ph;
        };
        /* 名鑑データがあればリッチ表示、なければ即表示→非同期リッチ化 */
        if (actorMeikanCache) {
          buildHTML(actorMeikanCache);
        } else {
          buildHTML(null);
          loadActorMeikan(function(meikan) { buildHTML(meikan); });
        }
      }

      /* 全俳優表示に切り替え */
      function toggleAllActors() {
        var popSec = document.getElementById('popular-actors-section');
        var fullSec = document.getElementById('full-search-section');
        var yagoSec = document.getElementById('yago-section');
        if (popSec) popSec.style.display = 'none';
        if (fullSec) fullSec.style.display = '';
        if (yagoSec) yagoSec.style.display = '';
        /* 屋号タブ + 俳優リストを初期ロード */
        loadActorMeikan(function(meikan) {
          renderYagoTabs(meikan);
          renderYagoActors(meikan, favYagoFilter);
        });
        var inp = document.getElementById('fav-search');
        if (inp) inp.focus();
      }

      /* 人気俳優のトグル（推しタブ・モーダル共通） */
      function toggleFavPopular(name) {
        toggleFavorite(name);
        var newFav = loadFavorites();
        renderPopularActors(newFav);
        /* 登録済み一覧を更新 */
        var regArea = document.getElementById('oshi-registered-area');
        if (regArea) {
          loadActorMeikan(function(meikan) {
            var ph = '';
            if (newFav.length === 0) {
              ph = '<div class="mp-empty" style="padding:1rem;">\u307e\u3060\u63a8\u3057\u4ff3\u512a\u304c\u767b\u9332\u3055\u308c\u3066\u3044\u307e\u305b\u3093<br>\u4e0b\u306e\u691c\u7d22\u304b\u3089\u8ffd\u52a0\u3057\u307e\u3057\u3087\u3046<\/div>';
            } else {
              for (var ri = 0; ri < newFav.length; ri++) {
                var rName = newFav[ri];
                var info = findMeikanInfo(meikan, rName);
                ph += '<div class="fav-actor-card fav-actor-registered">';
                if (info && info.yago) {
                  var yS = info.yago.length > 3 ? info.yago.substring(0,3) : info.yago;
                  ph += '<div class="fav-actor-yago-badge" title="' + esc(info.yago) + '">' + esc(yS) + '<\/div>';
                } else {
                  ph += '<div class="fav-actor-icon">\uD83C\uDFAD<\/div>';
                }
                ph += '<div class="fav-actor-info"><div class="fav-actor-name">\u2605 ' + esc(rName) + '<\/div><\/div>';
                ph += '<button class="fav-actor-remove" onclick="MP.removeFavOshi(\\'' + esc(rName).replace(/'/g, "\\\\'") + '\\')">\u89e3\u9664<\/button>';
                ph += '<\/div>';
              }
            }
            regArea.innerHTML = ph;
            var countEl = document.getElementById('fav-count');
            if (countEl) countEl.textContent = newFav.length;
          });
        }
        /* モーダル内の登録済み一覧も更新 */
        var favRegEl = document.getElementById('fav-registered');
        if (favRegEl) {
          loadActorMeikan(function(meikan) { renderFavRegistered(newFav, meikan); });
          var countEl = document.getElementById('fav-count');
          if (countEl) countEl.textContent = newFav.length;
        }
      }

      /* モーダル版 推し俳優管理 */
      function openFavModal() {
        /* 既にモーダルがあれば削除 */
        closeFavModal();

        var favList = loadFavorites();
        var h = '<div class="fav-modal-overlay" id="fav-modal-overlay" onclick="MP.closeFavModal(event)">';
        h += '<div class="fav-modal" onclick="event.stopPropagation()">';

        /* ヘッダー */
        h += '<div class="fav-modal-header">';
        h += '<h2 class="fav-modal-title">⭐ 推し俳優を管理</h2>';
        h += '<button class="fav-modal-close" onclick="MP.closeFavModal()">✕</button>';
        h += '</div>';

        h += '<div class="fav-modal-body">';

        /* 登録済み一覧 */
        h += '<div class="mp-section">';
        h += '<div class="mp-section-title">★ 登録済み（<span id="fav-count">' + favList.length + '</span>人）</div>';
        h += '<div id="fav-registered"></div>';
        h += '</div>';

        /* 人気俳優から選ぶ（デフォルト） */
        h += '<div class="mp-section" id="popular-actors-section">';
        h += '<div class="mp-section-title">\u2728 \u4eba\u6c17\u4ff3\u512a\u304b\u3089\u9078\u3076<\/div>';
        h += '<div id="popular-actors-grid" class="fav-search-results"><\/div>';
        h += '<button class="btn-all-actors" onclick="MP.toggleAllActors()">\uD83D\uDD0D \u5168\u4ff3\u512a\u304b\u3089\u63a2\u3059 \u2192<\/button>';
        h += '<\/div>';

        /* 全俳優検索（展開後） */
        h += '<div class="mp-section" id="full-search-section" style="display:none">';
        h += '<div class="mp-section-title">\uD83D\uDD0D \u4ff3\u512a\u3092\u691c\u7d22\u3057\u3066\u8ffd\u52a0<\/div>';
        h += '<input type="text" class="fav-search-input" id="fav-search" placeholder="\u540d\u524d\u30fb\u5c4b\u53f7\u3067\u691c\u7d22" oninput="MP.filterActors()">';
        h += '<div id="fav-search-results" class="fav-search-results"><\/div>';
        h += '<\/div>';

        h += '<div class="mp-section" id="yago-section" style="display:none">';
        h += '<div class="mp-section-title">\uD83C\uDFE0 \u5c4b\u53f7\u304b\u3089\u9078\u3076<\/div>';
        h += '<div id="yago-tabs" class="yago-tabs"><\/div>';
        h += '<div id="yago-actor-list" class="yago-actor-list"><\/div>';
        h += '<\/div>';

        h += '</div>'; /* fav-modal-body */
        h += '</div>'; /* fav-modal */
        h += '</div>'; /* fav-modal-overlay */

        document.body.insertAdjacentHTML('beforeend', h);
        document.body.style.overflow = 'hidden';

        /* 人気俳優グリッド & 登録済みリッチ化 */
        renderPopularActors(favList);
        loadActorMeikan(function(meikan) {
          renderFavRegistered(favList, meikan);
        });
      }

      function closeFavModal(e) {
        if (e && e.target && e.target.id !== 'fav-modal-overlay') return;
        var overlay = document.getElementById('fav-modal-overlay');
        if (overlay) overlay.remove();
        document.body.style.overflow = '';
        render();
      }

      /* 旧 renderFavorites 互換 – 推しタブへ遷移 */
      function renderFavorites() {
        currentView = 'oshi';
        subView = null;
        render();
      }

      /* 屋号タブ描画 */
      function renderYagoTabs(meikan) {
        var tabsEl = document.getElementById('yago-tabs');
        if (!tabsEl || !meikan) return;
        /* 屋号ごとの人数を集計 */
        var yagoMap = {};
        for (var i = 0; i < meikan.length; i++) {
          var y = meikan[i].yago || '（屋号なし）';
          yagoMap[y] = (yagoMap[y] || 0) + 1;
        }
        /* 人数の多い順にソート */
        var yagoKeys = Object.keys(yagoMap);
        yagoKeys.sort(function(a, b) { return yagoMap[b] - yagoMap[a]; });

        var th = '<button class="yago-tab' + (favYagoFilter === '' ? ' yago-tab-active' : '') + '" onclick="MP.selectYago(\\'\\')">すべて <span class="yago-tab-count">' + meikan.length + '</span></button>';
        for (var k = 0; k < yagoKeys.length; k++) {
          var yName = yagoKeys[k];
          var isActive = favYagoFilter === yName;
          th += '<button class="yago-tab' + (isActive ? ' yago-tab-active' : '') + '" onclick="MP.selectYago(\\'' + esc(yName).replace(/'/g, "\\\\'") + '\\')">' + esc(yName) + ' <span class="yago-tab-count">' + yagoMap[yName] + '</span></button>';
        }
        tabsEl.innerHTML = th;
      }

      /* 屋号別俳優リスト描画 */
      function renderYagoActors(meikan, yago) {
        var listEl = document.getElementById('yago-actor-list');
        if (!listEl || !meikan) return;
        var favList = loadFavorites();
        var filtered = [];
        for (var i = 0; i < meikan.length; i++) {
          var aYago = meikan[i].yago || '（屋号なし）';
          if (yago === '' || aYago === yago) filtered.push(meikan[i]);
        }
        /* 名前順にソート */
        filtered.sort(function(a, b) { return (a.name_kana || '').localeCompare(b.name_kana || ''); });

        var ph = '';
        for (var j = 0; j < filtered.length; j++) {
          var a = filtered[j];
          var nk = a.name_kanji.replace(/\s+/g, '');
          var isFav = favList.indexOf(nk) >= 0;
          ph += '<div class="fav-actor-card' + (isFav ? ' fav-actor-selected' : '') + '" onclick="MP.toggleFavMeikan(\\'' + esc(nk).replace(/'/g, "\\\\'") + '\\')">';
          if (a.yago) {
            var yS = a.yago.length > 3 ? a.yago.substring(0, 3) : a.yago;
            ph += '<div class="fav-actor-yago-badge" title="' + esc(a.yago) + '">' + esc(yS) + '</div>';
          } else {
            ph += '<div class="fav-actor-icon">🎭</div>';
          }
          ph += '<div class="fav-actor-info">';
          ph += '<div class="fav-actor-name">' + (isFav ? '★ ' : '') + esc(a.name_kanji) + '</div>';
          var sub = [];
          if (a.generation) sub.push(a.generation);
          if (a.yago) sub.push(a.yago);
          if (sub.length) ph += '<div class="fav-actor-sub">' + esc(sub.join(' / ')) + '</div>';
          ph += '</div>';
          if (isFav) {
            ph += '<span class="fav-actor-badge">登録済</span>';
          } else {
            ph += '<span class="fav-actor-badge fav-actor-badge-add">＋追加</span>';
          }
          ph += '</div>';
        }
        if (filtered.length === 0) {
          ph = '<div class="mp-empty" style="padding:0.5rem;">該当する俳優が見つかりません</div>';
        }
        listEl.innerHTML = ph;
      }

      /* 屋号タブ選択 */
      function selectYago(yago) {
        favYagoFilter = yago;
        loadActorMeikan(function(meikan) {
          renderYagoTabs(meikan);
          renderYagoActors(meikan, yago);
        });
      }

      function renderFavRegistered(favList, meikan) {
        var el = document.getElementById("fav-registered");
        if (!el) return;
        if (favList.length === 0) {
          el.innerHTML = '<div class="mp-empty" style="padding:0.8rem;">まだ推し俳優が登録されていません</div>';
          return;
        }
        var ph = '';
        for (var i = 0; i < favList.length; i++) {
          var name = favList[i];
          /* 名鑑からマッチを探す */
          var info = null;
          if (meikan) {
            for (var j = 0; j < meikan.length; j++) {
              var nk = meikan[j].name_kanji.replace(/\s+/g, "");
              if (nk === name || nk === name.replace(/\s+/g, "")) { info = meikan[j]; break; }
            }
          }
          ph += '<div class="fav-actor-card fav-actor-registered">';
          if (info && info.yago) {
            var yShort = info.yago.length > 3 ? info.yago.substring(0, 3) : info.yago;
            ph += '<div class="fav-actor-yago-badge" title="' + esc(info.yago) + '">' + esc(yShort) + '</div>';
          } else {
            ph += '<div class="fav-actor-icon">🎭</div>';
          }
          ph += '<div class="fav-actor-info">';
          ph += '<div class="fav-actor-name">★ ' + esc(name) + '</div>';
          if (info) {
            var sub = [];
            if (info.generation) sub.push(info.generation);
            if (info.yago) sub.push(info.yago);
            if (sub.length) ph += '<div class="fav-actor-sub">' + esc(sub.join(' / ')) + '</div>';
          }
          ph += '</div>';
          ph += '<button class="fav-actor-remove" onclick="MP.removeFav(\\'' + esc(name).replace(/'/g, "\\\\'") + '\\')">解除</button>';
          ph += '</div>';
        }
        el.innerHTML = ph;
      }

      function filterActors() {
        var input = document.getElementById("fav-search");
        var container = document.getElementById("fav-search-results");
        if (!input || !container) return;
        var q = input.value.trim();
        if (q.length === 0) { container.innerHTML = ''; return; }

        loadActorMeikan(function(meikan) {
          if (!meikan || meikan.length === 0) { container.innerHTML = '<div class="mp-empty">データ取得中…</div>'; return; }
          var qLower = q.toLowerCase();
          var favList = loadFavorites();
          var matches = [];
          for (var i = 0; i < meikan.length; i++) {
            var a = meikan[i];
            var nk = a.name_kanji.replace(/\s+/g, "");
            var nameMatch = nk.indexOf(q) >= 0 || a.name_kana.indexOf(q) >= 0 || a.name_kana.replace(/\s+/g, "").indexOf(q) >= 0;
            var yMatch = a.yago && a.yago.indexOf(q) >= 0;
            if (nameMatch || yMatch) matches.push(a);
            if (matches.length >= 30) break;
          }
          if (matches.length === 0) {
            container.innerHTML = '<div class="mp-empty" style="padding:0.5rem;font-size:0.82rem;">「' + esc(q) + '」に一致する俳優が見つかりません</div>';
            return;
          }
          var ph = '';
          for (var j = 0; j < matches.length; j++) {
            var a = matches[j];
            var nk = a.name_kanji.replace(/\s+/g, "");
            var isFav = favList.indexOf(nk) >= 0;
            ph += '<div class="fav-actor-card' + (isFav ? ' fav-actor-selected' : '') + '" onclick="MP.toggleFavMeikan(\\'' + esc(nk).replace(/'/g, "\\\\'") + '\\')">';
            if (a.yago) {
              var yS2 = a.yago.length > 3 ? a.yago.substring(0, 3) : a.yago;
              ph += '<div class="fav-actor-yago-badge" title="' + esc(a.yago) + '">' + esc(yS2) + '</div>';
            } else {
              ph += '<div class="fav-actor-icon">🎭</div>';
            }
            ph += '<div class="fav-actor-info">';
            ph += '<div class="fav-actor-name">' + (isFav ? '★ ' : '') + esc(a.name_kanji) + '</div>';
            var sub = [];
            if (a.generation) sub.push(a.generation);
            if (a.yago) sub.push(a.yago);
            if (sub.length) ph += '<div class="fav-actor-sub">' + esc(sub.join(' / ')) + '</div>';
            ph += '</div>';
            if (isFav) {
              ph += '<span class="fav-actor-badge">登録済</span>';
            } else {
              ph += '<span class="fav-actor-badge fav-actor-badge-add">＋追加</span>';
            }
            ph += '</div>';
          }
          container.innerHTML = ph;
        });
      }

      /* =====================================================
         クリップ解除 / 履歴クリア
      ===================================================== */
      function removeClip(type, id) {
        if (!confirm("クリップを解除しますか？")) return;
        var log = loadLog();
        if (type === "enmoku") {
          log.clips.enmoku = log.clips.enmoku.filter(function(x){ return x !== id; });
        } else if (type === "person") {
          log.clips.person = log.clips.person.filter(function(x){ return (typeof x === "string" ? x : x.id) !== id; });
        } else if (type === "term") {
          log.clips.term = log.clips.term.filter(function(x){ return x !== id; });
        }
        saveLog(log);
        render();
      }
      function clearRecent() {
        if (!confirm("閲覧履歴をすべてクリアしますか？")) return;
        var log = loadLog();
        log.recent = [];
        saveLog(log);
        render();
      }

      /* =====================================================
         グローバルAPI
      ===================================================== */
      window.MP = {
        logout: function() {
          if (!confirm('ログアウトしますか？')) return;
          fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
            .then(function() {
              authState.loggedIn = false;
              authState.user = null;
              authState.serverData = null;
              render();
            });
        },
        switchTab: function(tab) { currentView = tab; subView = null; formOpen = false; render(); window.scrollTo(0,0); },
        go: function(view) { subView = view; formOpen = false; render(); window.scrollTo(0,0); },
        goSub: function(view) { subView = view; render(); window.scrollTo(0,0); },
        goClip: function(tab) { clipTab = tab; subView = "clips"; render(); window.scrollTo(0,0); },
        setLogFilter: function(f) { logFilter = f; render(); },
        setOshiLogFilter: function(f) { oshiLogFilter = f; render(); },
        searchPastNews: function(actor, btn) { searchPastNews(actor, btn); },
        toggleDetail: function(id, btn) {
          var el = document.getElementById('detail-' + id);
          if (!el) return;
          var isOpen = el.classList.contains('tl-entry-expanded');
          el.classList.toggle('tl-entry-expanded');
          if (btn) btn.innerHTML = isOpen ? '▼ 詳細' : '▲ 閉じる';
        },
        toggleMenu: function(id) {
          /* 全メニューを閉じてからトグル */
          var allMenus = document.querySelectorAll('.tl-entry-dropdown');
          for (var mi = 0; mi < allMenus.length; mi++) {
            if (allMenus[mi].id !== 'menu-' + id) allMenus[mi].classList.remove('tl-dropdown-open');
          }
          var menu = document.getElementById('menu-' + id);
          if (menu) menu.classList.toggle('tl-dropdown-open');
        },
        exportData: function() {
          var data = {
            _export_version: 1,
            _exported_at: new Date().toISOString(),
            theater_log_v1: loadTlog(),
            favorite_actors_v1: loadFavorites(),
            keranosuke_log_v1: loadLog(),
            keranosuke_quiz_state: loadQuizState()
          };
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'kabuki_log_backup_' + todayStr() + '.json';
          a.click();
          URL.revokeObjectURL(url);
        },
        importData: function() {
          document.getElementById('kl-import-file').click();
        },
        doImport: function(event) {
          var file = event.target.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function(e) {
            try {
              var data = JSON.parse(e.target.result);
              if (!data._export_version) { alert('無効なファイルです'); return; }
              if (!confirm('データをインポートしますか？既存データとマージされます。')) return;
              /* マージ: theater_log */
              if (data.theater_log_v1 && data.theater_log_v1.entries) {
                var tlog = loadTlog();
                var existIds = {};
                for (var i = 0; i < tlog.entries.length; i++) existIds[tlog.entries[i].id] = true;
                for (var j = 0; j < data.theater_log_v1.entries.length; j++) {
                  var en = data.theater_log_v1.entries[j];
                  if (!existIds[en.id]) tlog.entries.push(en);
                }
                tlog.entries.sort(function(a, b) { return (b.created_at || 0) - (a.created_at || 0); });
                saveTlog(tlog);
              }
              /* マージ: favorites */
              if (data.favorite_actors_v1) {
                var fav = loadFavorites();
                for (var k = 0; k < data.favorite_actors_v1.length; k++) {
                  if (fav.indexOf(data.favorite_actors_v1[k]) < 0) fav.push(data.favorite_actors_v1[k]);
                }
                saveFavorites(fav);
              }
              /* マージ: log */
              if (data.keranosuke_log_v1) {
                try { localStorage.setItem('keranosuke_log_v1', JSON.stringify(data.keranosuke_log_v1)); } catch(ex){}
              }
              if (data.keranosuke_quiz_state) {
                try { localStorage.setItem('keranosuke_quiz_state', JSON.stringify(data.keranosuke_quiz_state)); } catch(ex){}
              }
              alert('インポートが完了しました');
              render();
            } catch(err) {
              alert('ファイルの読み込みに失敗しました: ' + err.message);
            }
          };
          reader.readAsText(file);
          event.target.value = '';
        },
        removeFavOshi: function(name) {
          if (!confirm(name + ' の推し登録を解除しますか？')) return;
          if (isFavorite(name)) toggleFavorite(name);
          render();
        },
        removeClip: removeClip,
        clearRecent: clearRecent,
        toggleFav: function(name) { toggleFavorite(name); render(); },
        addFav: function(name) { if (name && !isFavorite(name)) { toggleFavorite(name); } render(); },
        removeFav: function(name) { if (name && isFavorite(name)) { toggleFavorite(name); } render(); },
        toggleFavMeikan: function(name) {
          toggleFavorite(name);
          var newFav = loadFavorites();
          /* 検索結果を再描画 */
          filterActors();
          /* 登録済み＋屋号リストも再描画 */
          loadActorMeikan(function(meikan) {
            renderFavRegistered(newFav, meikan);
            renderYagoActors(meikan, favYagoFilter);
            var countEl = document.getElementById('fav-count');
            if (countEl) countEl.textContent = newFav.length;
          });
        },
        filterActors: filterActors,
        toggleAllActors: toggleAllActors,
        toggleFavPopular: function(name) { toggleFavPopular(name); },
        selectYago: selectYago,
        searchOshiNews: searchOshiNews,
        searchOshiNewsHome: searchOshiNewsHome,
        openFavModal: openFavModal,
        closeFavModal: function(e) { closeFavModal(e); },

        /* フォーム */
        openForm: function() { resetForm(); formOpen = true; render(); },
        closeForm: function() { formOpen = false; editingEntryId = null; render(); },
        uploadImage: function(fileInput) {
          var file = fileInput.files && fileInput.files[0];
          if (!file) return;
          var statusEl = document.getElementById('tl-upload-status');
          if (statusEl) { statusEl.textContent = 'アップロード中…'; statusEl.style.color = 'var(--kl-text3)'; }
          var fd = new FormData();
          fd.append('file', file);
          fd.append('user_id', 'reco_' + (Date.now().toString(36)));
          fetch('/api/user/images', { method: 'POST', body: fd })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data.url) {
                formState.image_url = data.url;
                if (statusEl) { statusEl.textContent = ''; }
                var prev = document.getElementById('tl-image-preview');
                if (prev) {
                  prev.innerHTML = '<img src="' + data.url + '" alt="プレビュー"><button class="tl-image-remove" onclick="MP.removeImage()">✕</button>';
                }
              } else {
                if (statusEl) { statusEl.textContent = 'エラー: ' + (data.error || '失敗'); statusEl.style.color = 'var(--kl-red)'; }
              }
              fileInput.value = '';
            })
            .catch(function(err) {
              if (statusEl) { statusEl.textContent = '通信エラー'; statusEl.style.color = 'var(--kl-red)'; }
              fileInput.value = '';
            });
        },
        removeImage: function() {
          formState.image_url = "";
          var prev = document.getElementById('tl-image-preview');
          if (prev) prev.innerHTML = '';
        },
        openLightbox: function(url) {
          var lb = document.createElement('div');
          lb.className = 'tl-image-lightbox';
          lb.innerHTML = '<img src="' + url + '" alt="拡大">';
          lb.addEventListener('click', function() { lb.remove(); });
          document.body.appendChild(lb);
        },
        setViewingType: function(type) {
          var prevType = formState.viewing_type;
          formState.viewing_type = type;
          /* タイプ切替時に不要フィールドをリセット */
          if (type === "theater") {
            formState.media_title = "";
            formState.media_plays = [];
            formState.media_actors_text = "";
          } else if (prevType === "theater" || !prevType) {
            formState.venue_id = null;
            formState.venue_name = null;
            formState.seat_type = null;
            formState.performance_title = null;
            formState.play_titles = [];
          }
          render();
        },
        addMediaPlay: function() {
          var el = document.getElementById("tl-f-media-play");
          var val = el ? el.value.trim() : "";
          if (!val) return;
          var parts = val.split(/[,、，]/).map(function(s){ return s.trim(); }).filter(Boolean);
          for (var i = 0; i < parts.length; i++) {
            if (formState.media_plays.indexOf(parts[i]) < 0) formState.media_plays.push(parts[i]);
          }
          el.value = "";
          render();
        },
        removeMediaPlay: function(idx) {
          formState.media_plays.splice(idx, 1);
          render();
        },
        saveMediaEntry: function() {
          /* メディア視聴記録を保存 */
          var titleEl = document.getElementById("tl-f-media-title");
          if (titleEl) formState.media_title = titleEl.value.trim();
          var actorsEl = document.getElementById("tl-f-media-actors");
          if (actorsEl) formState.media_actors_text = actorsEl.value.trim();
          var memoEl = document.getElementById("tl-f-memo");
          if (memoEl) formState.memo = memoEl.value.trim();

          if (!formState.date || !formState.media_title) return;

          var entryData = {
            viewing_type: formState.viewing_type,
            date: formState.date,
            media_title: formState.media_title,
            play_titles: formState.media_plays.slice(),
            actors_text: formState.media_actors_text,
            memo: formState.memo || "",
            image_url: formState.image_url || ""
          };
          if (editingEntryId) {
            updateEntry(editingEntryId, entryData);
          } else {
            addEntry(entryData);
          }
          formOpen = false;
          editingEntryId = null;
          render();
          window.scrollTo(0, 0);
        },

        setVenue: function(id, name) {
          formState.venue_id = id;
          formState.venue_name = name;
          formState.performance_title = null;
          render();
        },
        setCustomVenue: function() {
          var el = document.getElementById("tl-f-venue-custom");
          var val = el ? el.value.trim() : "";
          if (!val) return;
          formState.venue_id = "custom_" + val;
          formState.venue_name = val;
          formState.performance_title = null;
          render();
        },
        setSeat: function(id) {
          formState.seat_type = id;
          render();
        },
        setPerf: function(title) {
          formState.performance_title = title;
          /* 公演選択で演目候補が変わるので全体再描画 */
          render();
        },
        setCustomPerf: function() {
          var el = document.getElementById("tl-f-perf-custom");
          var val = el ? el.value.trim() : "";
          if (!val) return;
          formState.performance_title = val;
          render();
        },
        clearPerf: function() {
          formState.performance_title = null;
          render();
        },
        togglePlay: function(title) {
          var idx = formState.play_titles.indexOf(title);
          if (idx >= 0) {
            formState.play_titles.splice(idx, 1);
          } else {
            formState.play_titles.push(title);
          }
          render();
        },

        addPlay: function() {
          var el = document.getElementById("tl-f-play-input");
          var val = el ? el.value.trim() : "";
          if (!val) return;
          /* カンマ区切り対応 */
          var parts = val.split(/[,、，]/).map(function(s){ return s.trim(); }).filter(Boolean);
          for (var i = 0; i < parts.length; i++) {
            if (formState.play_titles.indexOf(parts[i]) < 0) {
              formState.play_titles.push(parts[i]);
            }
          }
          el.value = "";
          /* タグだけ再描画 */
          var tagsEl = document.getElementById("tl-f-play-tags");
          if (tagsEl) {
            var th = "";
            for (var j = 0; j < formState.play_titles.length; j++) {
              th += '<span class="tl-play-tag">' + esc(formState.play_titles[j]) + ' <button class="tl-play-tag-remove" onclick="MP.removePlay(' + j + ')">✕</button></span>';
            }
            tagsEl.innerHTML = th;
          }
        },
        removePlay: function(idx) {
          formState.play_titles.splice(idx, 1);
          render();
        },

        saveEntry: function() {
          if (!formState.date || !formState.venue_id) return;
          /* メモを読み取り */
          var memoEl = document.getElementById("tl-f-memo");
          if (memoEl) formState.memo = memoEl.value.trim();

          /* 選択した演目に出演する俳優情報を収集 */
          var actors = [];
          var playSceneMap = {};
          var candidatePlays = getPlayCandidates();
          for (var ci = 0; ci < candidatePlays.length; ci++) {
            var plays = candidatePlays[ci].plays || [];
            for (var cj = 0; cj < plays.length; cj++) {
              var p = plays[cj];
              if (typeof p === "string") continue;
              if (formState.play_titles.indexOf(p.title) < 0) continue;
              if (p.scenes) playSceneMap[p.title] = p.scenes;
              var cast = p.cast || [];
              for (var ck = 0; ck < cast.length; ck++) {
                actors.push({ actor: cast[ck].actor, role: cast[ck].role, play: p.title });
              }
            }
          }

          var entryData = {
            viewing_type: "theater",
            date: formState.date,
            venue_id: formState.venue_id,
            venue_name: formState.venue_name,
            seat_type: formState.seat_type || "NA",
            performance_title: formState.performance_title || "",
            play_titles: formState.play_titles.slice(),
            play_scenes: playSceneMap,
            actors: actors,
            memo: formState.memo || "",
            image_url: formState.image_url || ""
          };
          if (editingEntryId) {
            updateEntry(editingEntryId, entryData);
          } else {
            addEntry(entryData);
          }
          formOpen = false;
          editingEntryId = null;
          render();
          window.scrollTo(0, 0);
        },
        editEntry: function(id) {
          var tlog = loadTlog();
          var entry = null;
          for (var i = 0; i < tlog.entries.length; i++) {
            if (tlog.entries[i].id === id) { entry = tlog.entries[i]; break; }
          }
          if (!entry) return;
          editingEntryId = id;
          var isMedia = (entry.viewing_type || "theater") !== "theater";
          formState = {
            viewing_type: entry.viewing_type || "theater",
            date: entry.date || todayStr(),
            venue_id: entry.venue_id || null,
            venue_name: entry.venue_name || null,
            seat_type: entry.seat_type || null,
            performance_title: entry.performance_title || null,
            play_titles: (entry.play_titles || []).slice(),
            memo: entry.memo || "",
            image_url: entry.image_url || "",
            media_title: entry.media_title || "",
            media_plays: (entry.media_plays || entry.play_titles || []).slice(),
            media_actors_text: entry.actors_text || ""
          };
          formOpen = true;
          currentView = "log";
          render();
          var formEl = document.querySelector('.tl-form');
          if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
        },
        deleteEntry: function(id) {
          if (!confirm("この記録を削除しますか？")) return;
          removeEntry(id);
          render();
        }
      };

      /* =====================================================
         初期表示
      ===================================================== */
      /* 演目カタログを事前読込（リンク表示用） */
      fetchEnmokuCatalog(function() { render(); });
      render();

      /* 認証状態チェック（非同期、完了後に再描画） */
      checkAuth(function() { render(); });

      /* ドロップダウンメニューの外側クリックで閉じる */
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.tl-entry-more-menu')) {
          var allMenus = document.querySelectorAll('.tl-entry-dropdown');
          for (var mi = 0; mi < allMenus.length; mi++) allMenus[mi].classList.remove('tl-dropdown-open');
        }
      });
    })();
    </script>
  `;

  return pageShell({
    title: "KABUKI RECO",
    subtitle: "歌舞伎帖",
    bodyHTML,
    activeNav: "reco",
    googleClientId,
    headExtra: `<style>
      /* ── RECO固有のCSS変数（内部コンポーネント用） ── */
      body::before { display: none; }
    </style>`
  });
}
