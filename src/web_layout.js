// src/web_layout.js
// =========================================================
// 共通レイアウト — 歌舞伎デザインのページシェル
// =========================================================

/**
 * 歌舞伎風ページの共通シェル
 * @param {Object} opts
 * @param {string} opts.title - ページタイトル（<title>タグ＋ヘッダー見出し）
 * @param {string} [opts.subtitle] - ヘッダーのサブテキスト
 * @param {string} opts.bodyHTML - メインコンテンツHTML
 * @param {string} [opts.headExtra] - <head>内に追加するHTML（script/style等）
 * @param {string} [opts.activeNav] - ナビゲーションのアクティブ項目キー
 * @param {boolean} [opts.hideNav] - true ならグロナビを非表示
 * @returns {string} 完全なHTML文字列
 */
export function pageShell({ title, subtitle, bodyHTML, headExtra = "", activeNav = "", hideNav = false, brand = "kabuki", googleClientId = "", ogDesc = "", ogImage = "" }) {
  const navItems = brand === "jikabuki" ? jikabukiNav : kabukiNav;
  function navLink(n) {
    const active = n.key === activeNav;
    const cls = active ? "nav-item nav-active" : "nav-item";
    return `<a href="${n.href}" class="${cls}">${n.icon} ${n.label}</a>`;
  }
  const hubLinks = navItems.map(navLink).join("\n        ");

  const brandIcon = brand === "jikabuki" ? "🏯" : "🎭";
  const brandName = brand === "jikabuki" ? "JIKABUKI PLUS+" : "KABUKI PLUS+";
  const brandTagline = brand === "jikabuki"
    ? "演じる人の、デジタル楽屋。"
    : "歌舞伎を、もっと面白く。";

  const brandToggleHTML = `
    <div class="nav-brand-toggle" aria-label="プラットフォーム切替">
      <a href="/?brand=kabuki" class="nav-toggle-btn ${brand === "kabuki" ? "active" : ""}">KABUKI</a>
      <a href="/?brand=jikabuki" class="nav-toggle-btn ${brand === "jikabuki" ? "active" : ""}">JIKABUKI</a>
    </div>`;
  const loginModalHTML = `
<div id="nlm-backdrop" class="nlm-backdrop" style="display:none" onclick="if(event.target===this)closeLoginModal()">
  <div class="nlm-box" role="dialog" aria-modal="true" aria-label="\u30ed\u30b0\u30a4\u30f3">
    <button class="nlm-close" onclick="closeLoginModal()" aria-label="\u9589\u3058\u308b">\u00d7<\/button>
    <p class="nlm-title">\u30ed\u30b0\u30a4\u30f3<\/p>
    <p class="nlm-desc">\u5e55\u304c\u964d\u308a\u305f\u3089\u3001\u3053\u3053\u306b\u4e00\u7b46\u3002<br>\u30ed\u30b0\u30a4\u30f3\u3067\u8a18\u9332\u304c\u6b8b\u308a\u307e\u3059\u3002<\/p>
    <a href="#" class="nlm-btn-line" onclick="window.location.href='/auth/line?from='+encodeURIComponent(location.pathname+location.search);return false;">LINE \u3067\u30ed\u30b0\u30a4\u30f3<\/a>
    <div id="nlm-google-btn" style="min-height:40px"><\/div>
    <p id="nlm-google-status" class="nlm-status"><\/p>
  <\/div>
<\/div>`;

  const navHTML = hideNav ? "" : `
<nav class="global-nav" id="global-nav">
  <div class="nav-top-bar">
    ${brandToggleHTML}
    <div class="nav-auth" id="nav-auth-btn">
      <button type="button" class="nav-login-btn" onclick="openLoginModal()" title="\u30ed\u30b0\u30a4\u30f3">\u30ed\u30b0\u30a4\u30f3<\/button>
    </div>
  </div>
</nav>
<div class="line-cta-bar" id="line-cta-bar">
  <span class="line-cta-text">💬 LINE で「けらのすけ」と話す</span>
  <a href="/auth/line" class="line-cta-btn">友達追加 →</a>
  <button class="line-cta-close" onclick="dismissLineCta()" aria-label="閉じる">&times;</button>
</div>
${loginModalHTML}
<script>
window.__GOOGLE_CLIENT_ID = ${JSON.stringify(googleClientId)};
function openLoginModal(){
  var m=document.getElementById("nlm-backdrop");
  if(!m)return;
  m.style.display="flex";
  document.body.style.overflow="hidden";
  /* Googleボタンを初期化（未初期化の場合） */
  if(window.__nlmGoogleReady&&!window.__nlmGoogleRendered){
    window.__nlmRenderGoogle();
  }
}
function closeLoginModal(){
  var m=document.getElementById("nlm-backdrop");
  if(m)m.style.display="none";
  document.body.style.overflow="";
}
document.addEventListener("keydown",function(e){if(e.key==="Escape")closeLoginModal();});
window.__nlmGoogleRendered=false;
window.__nlmRenderGoogle=function(){
  var c=document.getElementById("nlm-google-btn");
  if(!c||!window.__GOOGLE_CLIENT_ID)return;
  try{
    google.accounts.id.initialize({client_id:window.__GOOGLE_CLIENT_ID,callback:window.__nlmHandleGoogle});
    google.accounts.id.renderButton(c,{type:"standard",theme:"outline",size:"large",text:"signin_with",locale:"ja",width:284});
    window.__nlmGoogleRendered=true;
  }catch(e){}
};
window.__nlmHandleGoogle=function(response){
  var st=document.getElementById("nlm-google-status");
  if(st)st.textContent="\u30ed\u30b0\u30a4\u30f3\u4e2d\u2026";
  fetch("/api/auth/google",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({credential:response.credential})})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d&&d.ok){window.location.reload();}
      else{if(st)st.textContent="\u30ed\u30b0\u30a4\u30f3\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002";}
    })
    .catch(function(){if(st)st.textContent="\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f\u3002";});
};
(function(){
  /* Google GSI スクリプト読み込み */
  if(window.__GOOGLE_CLIENT_ID){
    var s=document.createElement("script");
    s.src="https://accounts.google.com/gsi/client";
    s.async=true;s.defer=true;
    s.onload=function(){window.__nlmGoogleReady=true;};
    document.head.appendChild(s);
  }
  /* 認証状態チェック → ログイン済みならアバター＋ドロップダウン表示 */
  fetch("/api/auth/me",{credentials:"same-origin"})
    .then(function(r){return r.json();})
    .then(function(d){
      var el=document.getElementById("nav-auth-btn");
      if(!el)return;
      if(d&&d.loggedIn){
        var lcb=document.getElementById('line-cta-bar');
        if(lcb)lcb.style.display='none';
        var u=d.user||{};
        var pic=u.pictureUrl?"<img src='"+u.pictureUrl.replace(/'/g,"&#39;")+"' class='nav-user-pic' alt=''>":"";
        var name=u.displayName||u.email||"";
        var badge=u.provider==="line"?"LINE":"Google";
        el.innerHTML=
          '<div class="nav-user-bar">'+
            pic+
            (name?"<span class='nav-user-name'>"+name.replace(/</g,"&lt;")+"<\/span>":"")+
            "<span class='nav-user-badge'>"+badge+"<\/span>"+
            '<button class="nav-login-btn" onclick="navLogout()">\u30ed\u30b0\u30a2\u30a6\u30c8<\/button>'+
          '<\/div>';
      }
    }).catch(function(){});
})();
function navLogout(){
  if(!confirm("\u30ed\u30b0\u30a2\u30a6\u30c8\u3057\u307e\u3059\u304b\uff1f"))return;
  fetch("/api/auth/logout",{method:"POST",credentials:"same-origin"})
    .then(function(){window.location.reload();})
    .catch(function(){window.location.reload();});
}
function dismissLineCta(){
  try{sessionStorage.setItem('line-cta-dismissed','1');}catch(e){}
  var b=document.getElementById('line-cta-bar');
  if(b)b.style.display='none';
}
(function(){
  try{if(sessionStorage.getItem('line-cta-dismissed')){var b=document.getElementById('line-cta-bar');if(b)b.style.display='none';}}catch(e){}
})();
<\/script>`;

  // ── ボトムタブバー（トップページ含む全ページで表示） ──
  const tabBarHTML = `
<div class="pwa-tab-bar" id="pwa-tab-bar">
  ${navItems.map(n => {
    const active = n.key === activeNav;
    const cls = active ? "pwa-tab-active" : "";
    return `<a href="${n.href}" class="${cls}"><span class="pwa-tab-icon">${n.icon}</span>${n.label}</a>`;
  }).join("\n  ")}
</div>`;

  const metaDesc = ogDesc || (brand === "jikabuki"
    ? "地歌舞伎の演者・運営者のためのデジタル楽屋。台本管理・稽古支援・団体運営をサポート。"
    : "歌舞伎をもっと面白く。演目ガイド・公演情報・観劇記録・クイズで歌舞伎の世界を楽しもう。");
  const metaImage = ogImage || "https://kabukiplus.com/assets/ogp.png";
  const fullTitle = `${escHTML(title)} | ${brandName}`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${fullTitle}</title>
<meta name="description" content="${escHTML(metaDesc)}">
<meta property="og:title" content="${fullTitle}">
<meta property="og:description" content="${escHTML(metaDesc)}">
<meta property="og:image" content="${metaImage}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${brandName}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${fullTitle}">
<meta name="twitter:description" content="${escHTML(metaDesc)}">
<meta name="twitter:image" content="${metaImage}">
<link rel="icon" href="/assets/favicon.ico" sizes="any">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#A8873A">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
${headExtra}
<style>
${BASE_CSS}
</style>
</head>
<body class="has-tab-bar">
<div class="pwa-splash" id="pwa-splash">
  <div class="pwa-splash-inner">
    <div class="pwa-splash-icon">${brandIcon}</div>
    <div class="pwa-splash-brand">${brandName}</div>
  </div>
</div>

<header>
  <div class="header-inner">
    <div class="header-brand">${brandIcon} ${brandName}</div>
    <h1>${escHTML(title)}</h1>
    ${subtitle ? `<p class="header-sub">${escHTML(subtitle)}</p>` : ""}
    <div class="deco-line"><span class="diamond"></span></div>
  </div>
</header>
${navHTML}

<main>
${bodyHTML}
</main>

<section class="layout-support" aria-label="応援">
  <p class="support-onelink"><a href="/project">このプロジェクトを応援する →</a></p>
</section>

<footer>
  <p>${brandName} &mdash; ${brandTagline}</p>
  <p style="margin-top:4px;font-size:0.72rem;"><a href="/project" style="color:inherit;text-decoration:none;">地歌舞伎&times;AI プロジェクト</a>｜Produced by <a href="/jikabuki/gate/kera">KERAKABUKI（気良歌舞伎）</a></p>
  <p style="margin-top:4px;"><a href="/">トップへ戻る</a>｜<a href="${brand === 'jikabuki' ? '/jikabuki/help' : '/kabuki/help'}">ヘルプ</a></p>
</footer>

<div class="pwa-install-banner" id="pwa-install-banner">
  <span class="pwa-install-banner-icon">🎭</span>
  <div class="pwa-install-banner-text" id="pwa-install-banner-text">
    <strong>ホーム画面に追加</strong><br>アプリのように使えます
  </div>
  <button class="pwa-install-banner-btn" id="pwa-install-btn">追加</button>
  <button class="pwa-install-banner-close" id="pwa-install-close">&times;</button>
</div>
${tabBarHTML}

<script>
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(){});
}
/* スタンドアロンモード検出 + スプラッシュ */
(function(){
  var s=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(s){
    document.body.classList.add('standalone-mode');
    var sp=document.getElementById('pwa-splash');
    if(sp){
      function hide(){sp.classList.add('pwa-splash-hide');setTimeout(function(){sp.remove();},300);}
      if(document.readyState==='complete'||document.readyState==='interactive'){setTimeout(hide,100);}
      else{window.addEventListener('DOMContentLoaded',function(){setTimeout(hide,100);});}
    }
  } else {
    var sp=document.getElementById('pwa-splash');
    if(sp)sp.remove();
  }
})();
/* PWA インストール導線 */
(function(){
  var banner=document.getElementById('pwa-install-banner');
  if(!banner)return;
  var isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(isStandalone){banner.remove();return;}
  try{
    var dismissed=localStorage.getItem('pwa_install_dismissed');
    if(dismissed&&(Date.now()-parseInt(dismissed,10))<7*86400000){banner.remove();return;}
  }catch(e){}
  try{
    var v=parseInt(localStorage.getItem('pwa_visit_count')||'0',10)+1;
    localStorage.setItem('pwa_visit_count',String(v));
    if(v<2){banner.remove();return;}
  }catch(e){}
  var deferredPrompt=null;
  function showBanner(){setTimeout(function(){banner.classList.add('pwa-banner-show');},500);}
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();deferredPrompt=e;showBanner();
  });
  var isIOS=/iP(hone|od|ad)/.test(navigator.userAgent)&&!window.MSStream;
  if(isIOS){
    var t=document.getElementById('pwa-install-banner-text');
    if(t)t.innerHTML='<strong>ホーム画面に追加</strong><br>共有ボタン <span style="font-size:16px">⎋</span> →「ホーム画面に追加」';
    var b=document.getElementById('pwa-install-btn');
    if(b)b.style.display='none';
    setTimeout(showBanner,1500);
  }
  var btn=document.getElementById('pwa-install-btn');
  if(btn)btn.addEventListener('click',function(){
    if(deferredPrompt){
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function(){deferredPrompt=null;banner.classList.remove('pwa-banner-show');});
    }
  });
  var cls=document.getElementById('pwa-install-close');
  if(cls)cls.addEventListener('click',function(){
    try{localStorage.setItem('pwa_install_dismissed',String(Date.now()));}catch(e){}
    banner.classList.remove('pwa-banner-show');
  });
})();
</script>
</body>
</html>`;
}

// ─── ナビゲーション定義 ───
// KABUKI PLUS+（歌舞伎ファン・初心者向け）
const kabukiNav = [
  { key: "home", href: "/",       icon: "🏠", label: "トップ" },
  { key: "navi", href: "/kabuki/navi",   icon: "🧭", label: "NAVI" },
  { key: "live", href: "/kabuki/live",   icon: "📡", label: "LIVE" },
  { key: "reco", href: "/kabuki/reco",   icon: "📝", label: "RECO" },
  { key: "dojo", href: "/kabuki/dojo",   icon: "🥋", label: "DOJO" },
];

// JIKABUKI PLUS+（地歌舞伎の演者・運営者向け）
const jikabukiNav = [
  { key: "home", href: "/",                        icon: "🏠", label: "トップ" },
  { key: "gate", href: "/jikabuki/gate",             icon: "🏯", label: "GATE" },
  { key: "info", href: "/jikabuki/info",           icon: "📡", label: "INFO" },
  { key: "base", href: "/jikabuki/base",           icon: "🔧", label: "BASE" },
  { key: "labo", href: "/jikabuki/labo",           icon: "🧪", label: "LABO" },
];

// ─── HTML エスケープ ───
export function escHTML(s) {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── 共通 CSS（デザインガイド v1.0 準拠） ───
const BASE_CSS = `
  :root {
    --bg-page: #FAF7F2;
    --bg-card: rgba(255,255,255,0.90);
    --bg-subtle: #F3EDE4;
    --bg-accent-soft: #FFF8ED;

    --text-primary: #3D3127;
    --text-secondary: #7A6F63;
    --text-tertiary: #A89E93;
    --text-on-accent: #FFFFFF;

    --gold: #C5A255;
    --gold-light: #E8D5A3;
    --gold-soft: #F5EDD8;
    --gold-dark: #A8873A;
    --gold-deep: #8B7230;

    --accent-1: #D4614B;
    --accent-1-soft: #FCEAE6;
    --accent-2: #6B8FAD;
    --accent-2-soft: #E6EFF6;
    --accent-3: #6B9E78;
    --accent-3-soft: #E8F3EB;
    --accent-4: #B8860B;
    --accent-4-soft: #FDF4DC;

    --border-light: #EDE7DD;
    --border-medium: #DDD5C8;
    --shadow-sm: 0 1px 3px rgba(61,49,39,0.06);
    --shadow-md: 0 4px 12px rgba(61,49,39,0.08);
    --shadow-lg: 0 8px 24px rgba(61,49,39,0.10);

    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;

    /* 旧変数の互換エイリアス（既存ページとの後方互換） */
    --kuro: var(--text-primary);
    --aka: var(--accent-1);
    --moegi: var(--accent-3);
    --kin: var(--gold);
    --shiro: var(--text-primary);
    --fuji: #B088C8;
    --asagi: var(--accent-2);
    --surface: var(--bg-subtle);
    --surface-alt: var(--bg-card);
    --border: var(--border-light);
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Noto Sans JP', sans-serif;
    font-size: 1rem;
    line-height: 1.7;
    background: var(--bg-page);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  /* 紗綾形テクスチャ */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23A8873A' stroke-width='1.2'%3E%3Cpath d='M0 20 L20 20 L20 0'/%3E%3Cpath d='M20 20 L20 40 L40 40'/%3E%3Cpath d='M40 40 L40 20 L60 20'/%3E%3Cpath d='M60 20 L60 0'/%3E%3Cpath d='M40 40 L40 60 L20 60'/%3E%3Cpath d='M20 60 L20 80'/%3E%3Cpath d='M60 20 L60 40 L80 40'/%3E%3Cpath d='M0 60 L20 60'/%3E%3Cpath d='M60 40 L60 60 L80 60'/%3E%3Cpath d='M40 60 L60 60 L60 80'/%3E%3Cpath d='M0 40 L20 40'/%3E%3Cpath d='M40 0 L40 20'/%3E%3Cpath d='M80 0 L80 20'/%3E%3Cpath d='M80 60 L80 80'/%3E%3Cpath d='M40 80 L40 60'/%3E%3Cpath d='M0 0 L0 20'/%3E%3Cpath d='M0 60 L0 80'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 80px 80px;
  }
  body > * { position: relative; z-index: 1; }

  a { color: var(--gold-dark); text-decoration: none; }
  a:hover { color: var(--gold); text-decoration: underline; }

  /* ── ヘッダー ── */
  header {
    text-align: center;
    padding: 28px 20px 0;
    background: var(--bg-page);
  }
  .header-inner { max-width: 960px; margin: 0 auto; }
  .header-brand {
    font-size: 11px;
    letter-spacing: 4px;
    color: var(--gold);
  }
  header h1 {
    font-family: 'Noto Serif JP', serif;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 5px;
    color: var(--text-primary);
  }
  .header-sub {
    margin-top: 2px;
    font-size: 12px;
    color: var(--text-tertiary);
    letter-spacing: 1px;
  }
  /* デコライン */
  .deco-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin: 12px auto 0;
    max-width: 200px;
  }
  .deco-line::before, .deco-line::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold-light), transparent);
  }
  .deco-line .diamond {
    width: 5px; height: 5px;
    background: var(--gold);
    transform: rotate(45deg);
  }

  /* ── グローバルナビ ── */
  .global-nav {
    border-top: 1px solid var(--border-light);
    background: rgba(255,255,255,0.5);
  }
  .nav-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 960px;
    margin: 0 auto;
    padding: 4px 8px;
    border-bottom: 1px solid var(--border-light);
  }
  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    max-width: 960px;
    margin: 0 auto;
    padding: 0 8px;
    gap: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .nav-inner::-webkit-scrollbar { display: none; }
  .nav-links {
    display: flex;
    flex-wrap: nowrap;
    flex: 1;
  }
  .nav-brand-toggle {
    display: flex;
    flex-shrink: 0;
    gap: 4px;
  }
  .nav-auth {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
  .nav-user-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .nav-user-pic {
    width: 22px; height: 22px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid var(--border-light);
  }
  .nav-user-name {
    font-size: 11px;
    color: var(--text-secondary);
    white-space: nowrap;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nav-user-badge {
    font-size: 9px;
    font-weight: 600;
    color: #06C755;
    background: #e8faf0;
    border: 1px solid #b3e6c8;
    border-radius: 4px;
    padding: 1px 5px;
    letter-spacing: 0.3px;
    flex-shrink: 0;
  }
  .nav-login-btn {
    font-size: 11px;
    font-weight: 500;
    color: var(--gold-dark);
    background: none;
    cursor: pointer;
    padding: 4px 10px;
    border: 1px solid var(--gold-soft, #e8d5a0);
    border-radius: 20px;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s;
    font-family: inherit;
  }
  .nav-login-btn:hover {
    background: var(--gold-soft, #e8d5a0);
  }
  /* ── ログインモーダル ── */
  .nlm-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .nlm-box {
    background: var(--bg-card, #fff);
    border-radius: 16px;
    padding: 32px 28px 28px;
    width: 100%; max-width: 340px;
    position: relative;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    display: flex; flex-direction: column; gap: 14px;
    text-align: center;
  }
  .nlm-close {
    position: absolute; top: 12px; right: 14px;
    background: none; border: none; cursor: pointer;
    font-size: 20px; color: var(--text-tertiary);
    line-height: 1; padding: 4px;
  }
  .nlm-close:hover { color: var(--text-primary); }
  .nlm-title {
    font-family: 'Noto Serif JP', serif;
    font-size: 18px; font-weight: 700;
    color: var(--gold-dark); margin: 0;
  }
  .nlm-desc {
    font-size: 13px; color: var(--text-secondary);
    margin: 0; line-height: 1.7;
  }
  .nlm-btn-line {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 20px; border-radius: 8px;
    background: #06C755; color: #fff;
    font-size: 14px; font-weight: 600;
    text-decoration: none; border: none;
    transition: opacity 0.2s;
  }
  .nlm-btn-line:hover { opacity: 0.85; color: #fff; text-decoration: none; }
  #nlm-google-btn { display: flex; justify-content: center; width: 100%; }
  .nlm-status { font-size: 12px; color: var(--text-tertiary); margin: 0; min-height: 16px; }
  .nav-toggle-btn {
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-tertiary);
    text-decoration: none;
    border-radius: var(--radius-sm);
    transition: color 0.15s, background 0.15s;
  }
  .nav-toggle-btn:hover {
    color: var(--text-secondary);
    background: var(--bg-subtle);
    text-decoration: none;
  }
  .nav-toggle-btn.active {
    color: var(--gold-dark);
    background: var(--gold-soft);
  }
  .nav-item {
    flex-shrink: 0;
    padding: 10px 14px;
    font-size: 12px;
    color: var(--text-tertiary);
    text-decoration: none;
    white-space: nowrap;
    transition: color 0.2s;
    position: relative;
  }
  .nav-item:hover { color: var(--text-secondary); text-decoration: none; }
  .nav-active {
    color: var(--gold-dark) !important;
    font-weight: 500;
  }
  .nav-active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 14px; right: 14px;
    height: 2px;
    background: var(--gold);
    border-radius: 2px 2px 0 0;
  }

  /* ── メイン ── */
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 16px;
    flex: 1;
    width: 100%;
  }

  /* ── セクション見出し ── */
  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Noto Serif JP', serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 1px;
    margin: 0 0 14px;
  }
  .section-title::before {
    content: '';
    width: 3px;
    height: 18px;
    background: var(--gold);
    border-radius: 2px;
    flex-shrink: 0;
  }

  /* ── カードグリッド ── */
  .card-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  /* ── カード共通 ── */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    padding: 1.3rem;
    transition: transform 0.15s, box-shadow 0.15s;
    position: relative;
    overflow: hidden;
    text-decoration: none;
    color: var(--text-primary);
    display: block;
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(4px);
  }
  .card::before { display: none; }
  .card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    text-decoration: none;
  }
  .card h3 {
    font-family: 'Noto Serif JP', serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.3rem;
    letter-spacing: 1px;
  }
  .card .card-desc {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.6;
  }
  /* 左ボーダーアクセント */
  .card-accent-1 { border-left: 3px solid var(--accent-1); }
  .card-accent-2 { border-left: 3px solid var(--accent-2); }
  .card-accent-3 { border-left: 3px solid var(--accent-3); }
  .card-accent-4 { border-left: 3px solid var(--accent-4); }
  .card-accent-gold { border-left: 3px solid var(--gold); }

  /* ── 絵文字アイコン ── */
  .card-emoji {
    font-size: 1.8rem;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-subtle);
    border-radius: var(--radius-sm);
  }

  /* ── ローディング ── */
  .loading {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-tertiary);
    font-size: 0.9rem;
  }
  .loading::before {
    content: "";
    display: block;
    width: 32px; height: 32px;
    margin: 0 auto 0.8rem;
    border: 3px solid var(--border-light);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── 空状態 ── */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-tertiary);
    font-size: 0.9rem;
  }

  /* ── ボタン ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1.2rem;
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    font-family: inherit;
    letter-spacing: 0.08em;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    color: inherit;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--gold), var(--gold-dark));
    color: var(--text-on-accent);
    font-family: 'Noto Serif JP', serif;
    font-weight: 600;
    letter-spacing: 2px;
    box-shadow: var(--shadow-md);
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
    text-decoration: none;
    color: var(--text-on-accent);
  }
  .btn-secondary {
    background: none;
    border: 1px solid var(--border-medium);
    color: var(--text-secondary);
  }
  .btn-secondary:hover {
    border-color: var(--gold);
    color: var(--gold-dark);
    background: var(--gold-soft);
    text-decoration: none;
  }
  .btn-ghost {
    background: none;
    border: 1px dashed var(--border-medium);
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
  }
  .btn-ghost:hover {
    border-color: var(--gold);
    border-style: solid;
    color: var(--gold-dark);
    background: var(--gold-soft);
  }

  /* ── バッジ ── */
  .badge {
    display: inline-block;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--accent-1);
    color: #fff;
    letter-spacing: 0.05em;
  }

  /* ── パンくず ── */
  .breadcrumb {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-bottom: 1rem;
  }
  .breadcrumb a { color: var(--gold-dark); opacity: 0.8; }
  .breadcrumb a:hover { opacity: 1; }
  .breadcrumb span { margin: 0 0.3rem; color: var(--text-tertiary); }

  /* ── タブ ── */
  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border-light);
    margin-bottom: 1rem;
    overflow-x: auto;
  }
  .tab-item {
    flex-shrink: 0;
    padding: 0.6rem 1rem;
    font-size: 13px;
    color: var(--text-tertiary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    background: none;
    border-top: none;
    border-left: none;
    border-right: none;
    font-family: inherit;
  }
  .tab-item:hover { color: var(--text-secondary); }
  .tab-active {
    color: var(--gold-dark);
    border-bottom-color: var(--gold);
  }

  /* ── リスト ── */
  .list-item {
    display: block;
    padding: 0.8rem 1rem;
    background: var(--bg-card);
    border-radius: var(--radius-sm);
    margin-bottom: 0.5rem;
    border: 1px solid var(--border-light);
    transition: all 0.2s;
    text-decoration: none;
    color: var(--text-primary);
    box-shadow: var(--shadow-sm);
  }
  .list-item:hover {
    border-color: var(--gold);
    text-decoration: none;
    transform: translateX(3px);
    box-shadow: var(--shadow-md);
  }
  .list-item-title {
    font-family: 'Noto Serif JP', serif;
    font-weight: 600;
    font-size: 0.95rem;
  }
  .list-item-sub {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 0.15rem;
  }

  /* ── 検索バー ── */
  .search-bar {
    margin-bottom: 1rem;
  }
  .search-bar input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--border-medium);
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-family: inherit;
    background: var(--bg-card);
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s;
  }
  .search-bar input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
  }

  /* ── フッター ── */
  footer {
    text-align: center;
    padding: 1rem;
    font-size: 0.8rem;
    color: var(--text-tertiary);
    border-top: 1px solid var(--border-light);
    flex-shrink: 0;
    background: var(--bg-subtle);
  }
  footer a { color: var(--gold-dark); text-decoration: none; }
  footer a:hover { text-decoration: underline; }

  /* ── スタンドアロンPWAモード ── */
  @media (display-mode: standalone) {
    header { padding-top: calc(12px + env(safe-area-inset-top, 0px)); }
    .line-cta-bar { display: none !important; }
    .nav-brand-toggle { display: none; }
    .header-brand { font-size: 10px; }
  }
  body.standalone-mode header { padding-top: calc(12px + env(safe-area-inset-top, 0px)); }
  body.standalone-mode .line-cta-bar { display: none !important; }
  body.standalone-mode .nav-brand-toggle { display: none; }
  body.standalone-mode .header-brand { font-size: 10px; }

  /* ── スプラッシュ画面（スタンドアロン時のみ） ── */
  .pwa-splash {
    position: fixed; inset: 0; z-index: 10000;
    background: var(--bg-page);
    display: none; align-items: center; justify-content: center;
    transition: opacity 0.3s ease;
  }
  .pwa-splash.pwa-splash-hide { opacity: 0; pointer-events: none; }
  .pwa-splash-inner { text-align: center; }
  .pwa-splash-icon { font-size: 3rem; animation: pulse 1.5s ease infinite; }
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  .pwa-splash-brand {
    margin-top: 12px; font-size: 11px; letter-spacing: 4px;
    color: var(--gold); font-family: 'Noto Serif JP', serif;
  }
  @media (display-mode: standalone) {
    .pwa-splash { display: flex; }
  }

  /* ── ページ遷移 ── */
  @view-transition { navigation: auto; }
  ::view-transition-old(root) { animation: vtFadeOut 0.2s ease both; }
  ::view-transition-new(root) { animation: vtFadeIn 0.25s ease both; }
  @keyframes vtFadeOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes vtFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  main { animation: pageIn 0.3s ease both; }
  @keyframes pageIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── アニメーション ── */
  @keyframes fadeUp {
    from { opacity:0; transform: translateY(12px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.35s ease both; }
  .fade-up-d1 { animation: fadeUp 0.35s ease 0.05s both; }
  .fade-up-d2 { animation: fadeUp 0.35s ease 0.1s both; }
  .fade-up-d3 { animation: fadeUp 0.35s ease 0.15s both; }
  .fade-up-d4 { animation: fadeUp 0.35s ease 0.2s both; }
  .fade-up-d5 { animation: fadeUp 0.35s ease 0.25s both; }
  .fade-up-d6 { animation: fadeUp 0.35s ease 0.3s both; }
  .fade-up-d7 { animation: fadeUp 0.35s ease 0.35s both; }

  /* ── 応援セクション（全ページ共通フッター上・1行リンク） ── */
  .layout-support {
    max-width: 960px;
    margin: 0 auto;
    padding: 20px 16px;
    border-top: 1px solid var(--border-light);
    text-align: center;
  }
  .support-onelink {
    margin: 0;
    font-size: 14px;
  }
  .support-onelink a {
    color: var(--gold);
    text-decoration: none;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
  .support-onelink a:hover {
    text-decoration: underline;
  }

  /* ── レスポンシブ ── */
  @media (max-width: 600px) {
    header h1 { font-size: 18px; letter-spacing: 3px; }
    .nav-item { font-size: 11px; padding: 8px 10px; }
    .nav-toggle-btn { padding: 5px 8px; font-size: 10px; }
    main { padding: 16px 12px; }
    .card-grid { grid-template-columns: 1fr; }
    .layout-support { padding: 16px 12px; }
    .nav-user-name { display: none; }
    .line-cta-text { font-size: 11px; }
    .line-cta-btn { font-size: 11px; padding: 3px 10px; }
  }

  /* ── LINE 友達追加バー ── */
  .line-cta-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 7px 16px;
    background: #06C755;
    color: white;
    font-size: 13px;
  }
  .line-cta-text {
    flex: 1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .line-cta-btn {
    flex-shrink: 0;
    background: white;
    color: #06C755;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    transition: opacity 0.15s;
  }
  .line-cta-btn:hover { opacity: 0.88; text-decoration: none; color: #06C755; }
  .line-cta-close {
    flex-shrink: 0;
    background: none;
    border: none;
    color: rgba(255,255,255,0.75);
    cursor: pointer;
    font-size: 17px;
    padding: 2px 4px;
    line-height: 1;
    transition: color 0.15s;
  }
  .line-cta-close:hover { color: white; }

  /* ── ボトムタブバー ── */
  .pwa-tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    background: rgba(250,247,242,0.96);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid var(--border-light);
    box-shadow: 0 -2px 8px rgba(61,49,39,0.06);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .pwa-tab-bar a {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px 6px;
    color: var(--text-tertiary);
    text-decoration: none;
    font-size: 10px;
    font-family: inherit;
    letter-spacing: 0.5px;
    transition: color 0.15s;
    position: relative;
  }
  .pwa-tab-bar a:hover { color: var(--text-secondary); text-decoration: none; }
  .pwa-tab-icon { font-size: 20px; line-height: 1; }
  .pwa-tab-bar .pwa-tab-active {
    color: var(--gold-dark);
    font-weight: 600;
  }
  .pwa-tab-bar .pwa-tab-active .pwa-tab-icon {
    transform: scale(1.1);
  }
  .pwa-tab-bar .pwa-tab-active::after {
    content: '';
    position: absolute;
    top: 0;
    left: 25%;
    right: 25%;
    height: 2px;
    background: var(--gold);
    border-radius: 0 0 2px 2px;
  }
  /* ── インストールバナー ── */
  .pwa-install-banner {
    position: fixed;
    bottom: calc(56px + env(safe-area-inset-bottom, 0px));
    left: 0; right: 0; z-index: 999;
    background: linear-gradient(135deg, var(--gold-dark), var(--gold));
    color: white;
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px;
    box-shadow: 0 -4px 16px rgba(61,49,39,0.15);
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }
  .pwa-install-banner.pwa-banner-show { transform: translateY(0); }
  .pwa-install-banner-icon { font-size: 24px; flex-shrink: 0; }
  .pwa-install-banner-text { flex: 1; font-size: 13px; line-height: 1.5; }
  .pwa-install-banner-text strong { font-weight: 600; }
  .pwa-install-banner-btn {
    flex-shrink: 0; background: white; color: var(--gold-dark);
    border: none; border-radius: 20px; padding: 8px 16px;
    font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
  }
  .pwa-install-banner-close {
    flex-shrink: 0; background: none; border: none;
    color: rgba(255,255,255,0.7); font-size: 18px; cursor: pointer; padding: 4px;
  }
  body:not(.has-tab-bar) .pwa-install-banner {
    bottom: env(safe-area-inset-bottom, 0px);
  }

  /* タブバー分のコンテンツ余白 */
  body.has-tab-bar main { padding-bottom: 80px; }
  body.has-tab-bar footer { padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)); }
  body.has-tab-bar .layout-support { padding-bottom: 0; }
`;
