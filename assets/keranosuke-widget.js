/* keranosuke-widget v4.0 - Card UI + Cloudflare R2 hosted */
(function(){
  "use strict";

  var WORKER_WEB_URL = "https://kabukiplus.com/web";
  var AVATAR_URL = "https://kabukiplus.com/assets/keranosukelogo.png";

  if (document.getElementById("keranosuke-fab-wrap")) return;

  /* ---- Font (inject if not already present) ---- */
  if (!document.getElementById("keranosuke-font-link")) {
    var fontLink = document.createElement("link");
    fontLink.id = "keranosuke-font-link";
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700;900&family=Noto+Serif+JP:wght@600;700&display=swap";
    document.head.appendChild(fontLink);
  }

  /* ---- Session ---- */
  var KEY = "keranosuke_session_id";
  var sid;
  try {
    sid = localStorage.getItem(KEY);
    if (!sid) {
      sid = "jimdoweb_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(KEY, sid);
    }
  } catch(e) {
    sid = "jimdoweb_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  var LAST_MODE_KEY = "keranosuke_last_mode";
  var currentMode = null;

  /* ---- Video map ---- */
  var VIDEO_MAP = {
    hamamamatsuya: { url: "https://youtu.be/aLqekhOWpvs", title: "\u6d5c\u677e\u5c4b\uff082020\u5e74\uff09" },
    inasegawa:      { url: "https://youtu.be/I5QncXeoIm0", title: "\u7a32\u702c\u5ddd\u52e2\u63c3\u3044\uff082020\u5e74\uff09" },
    fuuinkiri:      { url: "https://youtu.be/z7ztOFG3C_Q", title: "\u5c01\u5370\u5207\uff082025\u5e74 \u6e05\u6d41\u5ea7\uff09" },
    sogataimen:     { url: "https://youtu.be/kIPC0XPA7Yo", title: "\u5bff\u66fd\u6211\u5bfe\u9762\uff082025\u5e74\uff09" },
    kirare:         { url: "https://youtu.be/y_DLyjhdsqs", title: "\u5207\u3089\u308c\u4e0e\u4e09\uff082023\u5e74\uff09" },
    chushingura07: { url: "https://youtu.be/WcndUbfkLmY", title: "\u5fe0\u81e3\u8535 \u4e03\u6bb5\u76ee\uff082024\u5e74\uff09" },
    chushingura09: { url: "https://youtu.be/eHGZaYzObZ8", title: "\u5fe0\u81e3\u8535 \u4e5d\u6bb5\u76ee\uff082023\u5e74\uff09" },
    chushingura03: { url: "https://youtu.be/ko7QYxHhzq0", title: "\u5fe0\u81e3\u8535 \u4e09\u6bb5\u76ee\uff082021\u5e74\uff09" },
    chushingura05: { url: "https://youtu.be/lgijEPxzyEM", title: "\u5fe0\u81e3\u8535 \u4e94\u6bb5\u76ee\uff082021\u5e74\uff09" },
    chushingura06: { url: "https://youtu.be/lOV2eV94ok4", title: "\u5fe0\u81e3\u8535 \u516d\u6bb5\u76ee\uff082021\u5e74\uff09" },
    taikoukijudanme: { url: "https://youtu.be/SaXBlptsPQg", title: "\u7d75\u672c\u592a\u529f\u8a18 \u5341\u6bb5\u76ee\uff082024\u5e74\uff09" },
    kumagaijinya:  { url: "https://youtu.be/QUJr8_5dMKU", title: "\u718a\u8c37\u9663\u5c4b\uff08\u97f3\u58f0\u88dc\u6b63\u7248\uff09" },
    sushiya:       { url: "https://youtu.be/ONkH5uc3klA", title: "\u7fa9\u7d4c\u5343\u672c\u685c \u3059\u3057\u5c4b\uff082022\u5e74\uff09" },
    iseondo:       { url: "https://youtu.be/ggPLUSdBsZ0", title: "\u4f0a\u52e2\u97f3\u982d\u604b\u5bdd\u5203\uff082019\u5e74\uff09" },
    sendaihagi:    { url: "https://youtu.be/XvsXURp1UR8", title: "\u4f3d\u7f85\u5148\u4ee3\u8429 \u5fa1\u6bbf\u30fb\u5e8a\u4e0b\uff082017\u5e74\uff09" },
    terakoya:      { url: "https://youtu.be/JuPBhVYniNI", title: "\u83c5\u539f\u4f1d\u6388\u624b\u7fd2\u9451 \u5bfa\u5b50\u5c4b\uff082016\u5e74\uff09" },
    moritsuna:     { url: "https://youtu.be/_UYjJkNjhAE", title: "\u76db\u7db1\u9663\u5c4b\uff082013\u5e74\uff09" }
  };

  /* ---- Menu items ---- */
  /* 送信番号は worker の normalizeModeSelection と一致: 1=kera, 2=performance, 3=general, 4=recommend, 5=quiz, 6=news */
  var MENU_ITEMS = [
    { icon: "\ud83d\udcac", label: "\u6c17\u826f\u6b4c\u821e\u4f0e\u30ca\u30d3", desc: "\u6c17\u826f\u6b4c\u821e\u4f0e\u306e\u3053\u3068\u306f\u4f55\u3067\u3082\u805e\u3044\u3066\u306d\uff01", mode: "kera", color: "#252028", border: "rgba(224,184,74,.25)", send: "1" },
    { icon: "\ud83d\udcd6", label: "\u6f14\u76ee\u30fb\u4eba\u7269\u30ac\u30a4\u30c9", desc: "20\u6f14\u76ee\u306e\u3042\u3089\u3059\u3058\u30fb\u307f\u3069\u3053\u308d\u30fb\u4eba\u7269", mode: "performance", color: "#252028", border: "rgba(224,184,74,.25)", send: "2" },
    { icon: "\ud83c\udf1f", label: "\u304a\u3059\u3059\u3081\u6f14\u76ee", desc: "\u521d\u5fc3\u8005\u5411\u3051\u30fb\u30b8\u30e3\u30f3\u30eb\u5225\u306e\u304a\u3059\u3059\u3081", mode: "recommend", color: "#252028", border: "rgba(224,184,74,.25)", send: "4" },
    { icon: "\ud83d\udcdd", label: "\u6b4c\u821e\u4f0e\u7528\u8a9e\u3044\u308d\u306f", desc: "126\u306e\u7528\u8a9e\u3092\u30ab\u30c6\u30b4\u30ea\u5225\u306b\u89e3\u8aac", mode: "general", color: "#252028", border: "rgba(224,184,74,.25)", send: "3" },
    { icon: "\ud83c\udfaf", label: "\u6b4c\u821e\u4f0e\u30af\u30a4\u30ba", desc: "\u4e09\u629e\u30af\u30a4\u30ba\u3067\u697d\u3057\u304f\u5b66\u307c\u3046", mode: "quiz", color: "#252028", border: "rgba(224,184,74,.25)", send: "5" },
    { icon: "\ud83d\udcf0", label: "\u6b4c\u821e\u4f0e\u30cb\u30e5\u30fc\u30b9", desc: "\u6700\u65b0\u30cb\u30e5\u30fc\u30b9\u3092\u30c1\u30a7\u30c3\u30af", mode: "news", color: "#252028", border: "rgba(224,184,74,.25)", send: "6" }
  ];

  /* ---- Talk Category Order (LINE flex_talk.js TALK_CAT_ORDER と同一) ---- */
  var TALK_CAT_ORDER = [
    { key: "\u6c17\u826f\u6b4c\u821e\u4f0e",           icon: "\ud83d\ude42" },
    { key: "\u5730\u6b4c\u821e\u4f0e\u30fb\u5730\u829d\u5c45", icon: "\ud83d\udc79" },
    { key: "\u516c\u6f14\u306e\u57fa\u672c",           icon: "\ud83d\udcc5" },
    { key: "\u89b3\u5287\u30ac\u30a4\u30c9",           icon: "\ud83c\udfad" },
    { key: "\u4f1a\u5834\u30fb\u30a2\u30af\u30bb\u30b9", icon: "\ud83c\udfe0" },
    { key: "\u53c2\u52a0\u30fb\u30dc\u30e9\u30f3\u30c6\u30a3\u30a2", icon: "\ud83d\ude4b" },
    { key: "\u660e\u5b9d\u30fb\u5468\u8fba\u60c5\u5831", icon: "\ud83c\udf7d\ufe0f" }
  ];

  /**
   * items[].category でグルーピング → TALK_CAT_ORDER 順にソート
   * category がない場合はフラット表示にフォールバック
   */
  function groupByCategory(items) {
    var catMap = {};
    var orderSeen = [];
    var noCat = [];

    for (var i = 0; i < items.length; i++) {
      var cat = items[i].category || "";
      if (!cat) { noCat.push(items[i]); continue; }
      if (!(cat in catMap)) { catMap[cat] = []; orderSeen.push(cat); }
      catMap[cat].push(items[i]);
    }

    /* category を持つアイテムが少なければフォールバック */
    if (orderSeen.length < 2) return null;

    /* TALK_CAT_ORDER 順に並べる */
    var result = [];
    for (var c = 0; c < TALK_CAT_ORDER.length; c++) {
      var k = TALK_CAT_ORDER[c].key;
      if (catMap[k]) {
        result.push({ icon: TALK_CAT_ORDER[c].icon, title: k, items: catMap[k] });
        delete catMap[k];
      }
    }
    /* ORDER未定義のカテゴリ */
    for (var j = 0; j < orderSeen.length; j++) {
      if (catMap[orderSeen[j]]) {
        result.push({ icon: "\ud83d\udcc1", title: orderSeen[j], items: catMap[orderSeen[j]] });
      }
    }
    /* カテゴリなし */
    if (noCat.length > 0) {
      result.push({ icon: "\u2753", title: "\u305d\u306e\u4ed6", items: noCat });
    }
    return result;
  }

  /* =========================================================
     Styles
  ========================================================= */
  var style = document.createElement("style");
  style.textContent = [
    /* 歌舞伎風・モダン：金・赤・黒（定式幕） */
    ":root{--kera-gold:#e0b84a;--kera-gold-dim:#a88b36;--kera-red:#c43838;--kera-bg:#141218;--kera-surface:#1a1618;--kera-bubble-left:#252028;--kera-bubble-right:linear-gradient(135deg,#c43838 0%,#8b2525 100%);--kera-text:#efe8df;--kera-text-inv:#fff;--kera-dim:#8a8290;--kera-border:rgba(224,184,74,.15);--kera-shadow:0 24px 64px rgba(0,0,0,.45);--kera-radius:16px;--kera-glow:rgba(224,184,74,.2);}",
    "#keranosuke-fab-wrap{position:fixed !important;right:20px !important;bottom:20px !important;z-index:2147483647 !important;font-family:'Noto Sans JP',system-ui,sans-serif !important;display:flex !important;flex-direction:column !important;align-items:flex-end !important;justify-content:flex-end !important;gap:12px !important;}",
    "#keranosuke-fab{display:inline-flex !important;align-items:center !important;gap:10px !important;padding:10px 18px 10px 10px !important;border:0 !important;border-radius:999px !important;background:linear-gradient(135deg,#e0b84a 0%,#a88b36 100%) !important;color:#1a1618 !important;cursor:pointer !important;box-shadow:0 8px 32px rgba(224,184,74,.35) !important;font-weight:900 !important;font-size:14px !important;font-family:inherit !important;transition:transform .2s ease,box-shadow .2s ease !important;}",
    "#keranosuke-fab img{width:36px !important;height:36px !important;border-radius:50% !important;object-fit:cover !important;border:2px solid rgba(255,255,255,.6) !important;}",
    "#keranosuke-fab:hover{transform:scale(1.06) !important;box-shadow:0 12px 40px rgba(224,184,74,.45) !important;}",
    "#keranosuke-panel{width:400px !important;max-width:calc(100vw - 32px) !important;height:calc(100vh - 100px) !important;max-height:calc(100vh - 100px) !important;border-radius:var(--kera-radius) !important;overflow:hidden !important;border:1px solid rgba(224,184,74,.12) !important;background:var(--kera-surface) !important;box-shadow:var(--kera-shadow) !important;display:flex !important;flex-direction:column !important;transform:translateY(16px) !important;opacity:0 !important;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .25s ease !important;pointer-events:none !important;}",
    "#keranosuke-panel[data-open='0']{display:none !important;}",
    "#keranosuke-panel[data-open='1']{display:flex !important;transform:translateY(0) !important;opacity:1 !important;pointer-events:auto !important;}",
    "#keranosuke-head{flex:0 0 auto !important;display:flex !important;align-items:center !important;padding:14px 16px !important;background:linear-gradient(135deg,#1a1618 0%,#2a2028 50%,#1e181c 100%) !important;color:var(--kera-text-inv) !important;gap:12px !important;border-bottom:1px solid var(--kera-border) !important;}",
    ".kera-avatar-head{width:40px !important;height:40px !important;border-radius:50% !important;background:var(--kera-bubble-left) !important;display:flex !important;align-items:center !important;justify-content:center !important;flex-shrink:0 !important;overflow:hidden !important;border:2px solid rgba(224,184,74,.3) !important;}.kera-avatar-head img{width:100% !important;height:100% !important;object-fit:cover !important;}",
    "#keranosuke-head-info{flex:1 !important;}",
    "#keranosuke-title{font-weight:900 !important;font-size:15px !important;line-height:1.3 !important;color:var(--kera-gold) !important;font-family:'Noto Serif JP',serif !important;letter-spacing:.04em !important;}",
    "#keranosuke-sub{font-size:11px !important;color:var(--kera-dim) !important;font-weight:400 !important;}",
    "#keranosuke-close{border:0 !important;background:rgba(224,184,74,.15) !important;color:var(--kera-gold) !important;cursor:pointer !important;font-size:18px !important;line-height:1 !important;padding:6px 10px !important;border-radius:10px !important;transition:background .15s,color .15s !important;}",
    "#keranosuke-close:hover{background:rgba(224,184,74,.28) !important;}",
    "#keranosuke-log{flex:1 1 auto !important;min-height:0 !important;overflow:auto !important;padding:14px !important;background:var(--kera-bg) !important;-webkit-overflow-scrolling:touch !important;}",
    ".ks-row{display:flex !important;gap:8px !important;margin:10px 0 !important;align-items:flex-end !important;animation:kera-msg-in .35s ease both !important;}",
    "@keyframes kera-msg-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}",
    ".ks-row.ks-left{justify-content:flex-start !important;}.ks-row.ks-right{justify-content:flex-end !important;}",
    ".ks-avatar{width:32px !important;height:32px !important;border-radius:50% !important;background:var(--kera-bubble-left) !important;display:flex !important;align-items:center !important;justify-content:center !important;flex-shrink:0 !important;box-shadow:0 2px 12px rgba(0,0,0,.25) !important;overflow:hidden !important;border:1px solid rgba(224,184,74,.2) !important;}.ks-avatar img{width:100% !important;height:100% !important;object-fit:cover !important;}",
    ".ks-right .ks-avatar{display:none !important;}",
    ".ks-bubble{max-width:82% !important;padding:12px 16px !important;border-radius:18px !important;line-height:1.7 !important;font-size:13.5px !important;white-space:pre-wrap !important;overflow-wrap:anywhere !important;word-break:break-word !important;box-shadow:0 4px 16px rgba(0,0,0,.2) !important;}",
    ".ks-left .ks-bubble{background:var(--kera-bubble-left) !important;color:var(--kera-text) !important;border-bottom-left-radius:6px !important;border:1px solid rgba(224,184,74,.08) !important;}",
    ".ks-right .ks-bubble{background:linear-gradient(135deg,#c43838 0%,#8b2525 100%) !important;color:var(--kera-text-inv) !important;border-bottom-right-radius:6px !important;}",
    ".ks-hr{border:0 !important;border-top:1.5px dashed rgba(224,184,74,.25) !important;margin:12px 0 !important;width:100% !important;}",
    ".ks-score{display:block !important;background:rgba(224,184,74,.12) !important;color:var(--kera-gold) !important;font-weight:900 !important;padding:10px 14px !important;border-radius:12px !important;text-align:center !important;margin-top:6px !important;font-size:14px !important;border:1px solid rgba(224,184,74,.25) !important;}",

    ".ks-card{max-width:88% !important;background:var(--kera-bubble-left) !important;border-radius:14px !important;padding:16px 18px !important;box-shadow:0 4px 20px rgba(0,0,0,.2) !important;overflow:hidden !important;border:1px solid rgba(224,184,74,.1) !important;}",
    ".ks-card-title{font-weight:900 !important;font-size:15px !important;line-height:1.4 !important;color:var(--kera-text) !important;}",
    ".ks-card-subtitle{font-size:11px !important;color:var(--kera-dim) !important;margin-top:4px !important;line-height:1.3 !important;}",
    ".ks-card-sep{border:0 !important;border-top:1px solid rgba(224,184,74,.15) !important;margin:10px 0 !important;}",
    ".ks-card-body{font-size:13px !important;line-height:1.75 !important;color:var(--kera-text) !important;white-space:pre-wrap !important;overflow-wrap:anywhere !important;word-break:break-word !important;}",

    ".ks-typing{display:inline-flex !important;gap:5px !important;padding:14px 18px !important;align-items:center !important;}",
    ".ks-typing-dot{width:8px !important;height:8px !important;border-radius:50% !important;background:var(--kera-gold) !important;animation:kera-typing .9s ease-in-out infinite !important;}",
    ".ks-typing-dot:nth-child(2){animation-delay:.15s !important;}.ks-typing-dot:nth-child(3){animation-delay:.3s !important;}",
    "@keyframes kera-typing{0%,60%,100%{opacity:.35;transform:scale(.85)}30%{opacity:1;transform:scale(1.1)}}",
    ".ks-menu-grid{display:flex !important;flex-direction:column !important;gap:8px !important;margin:6px 0 !important;}",
    ".ks-menu-card{display:flex !important;align-items:center !important;gap:12px !important;padding:12px 14px !important;border-radius:12px !important;cursor:pointer !important;border:1px solid rgba(224,184,74,.12) !important;transition:all .2s ease !important;background:var(--kera-bubble-left) !important;}",
    ".ks-menu-card:hover{transform:translateX(4px) !important;box-shadow:0 6px 24px rgba(0,0,0,.25) !important;border-color:rgba(224,184,74,.35) !important;}",
    ".ks-menu-icon{width:40px !important;height:40px !important;border-radius:12px !important;display:flex !important;align-items:center !important;justify-content:center !important;font-size:20px !important;flex-shrink:0 !important;background:rgba(224,184,74,.1) !important;}",
    ".ks-menu-text{flex:1 !important;min-width:0 !important;}",
    ".ks-menu-label{font-size:13px !important;font-weight:700 !important;color:var(--kera-text) !important;line-height:1.3 !important;}",
    ".ks-menu-desc{font-size:11px !important;color:var(--kera-dim) !important;line-height:1.3 !important;margin-top:2px !important;}",
    ".ks-menu-arrow{color:var(--kera-gold-dim) !important;font-size:14px !important;flex-shrink:0 !important;}",
    ".ks-video-card{display:flex !important;align-items:center !important;gap:10px !important;padding:10px 12px !important;margin:6px 0 !important;background:rgba(224,184,74,.08) !important;border:1px solid rgba(224,184,74,.25) !important;border-radius:12px !important;cursor:pointer !important;text-decoration:none !important;transition:all .2s ease !important;color:var(--kera-text) !important;}",
    ".ks-video-card:hover{background:rgba(224,184,74,.14) !important;transform:translateY(-2px) !important;box-shadow:0 6px 20px rgba(0,0,0,.2) !important;}",
    ".ks-video-icon{font-size:22px !important;flex-shrink:0 !important;}.ks-video-info{flex:1 !important;min-width:0 !important;}",
    ".ks-video-title{font-size:12px !important;font-weight:700 !important;line-height:1.3 !important;}.ks-video-sub{font-size:10px !important;color:var(--kera-dim) !important;}",
    "#ks-chips{display:flex !important;gap:8px !important;padding:10px 12px 0 !important;flex-wrap:wrap !important;}",
    "#ks-chips:empty{padding:0 !important;}",
    ".ks-chip{border:1px solid rgba(224,184,74,.25) !important;background:var(--kera-bubble-left) !important;color:var(--kera-text) !important;border-radius:999px !important;padding:8px 14px !important;font-size:12px !important;cursor:pointer !important;user-select:none !important;transition:all .15s ease !important;}",

    ".ks-accordion{display:flex !important;flex-direction:column !important;gap:6px !important;max-width:90% !important;}",
    ".ks-acc-group{border-radius:12px !important;overflow:hidden !important;border:1px solid rgba(224,184,74,.15) !important;background:var(--kera-bubble-left) !important;}",
    ".ks-acc-header{display:flex !important;align-items:center !important;gap:8px !important;padding:11px 12px !important;cursor:pointer !important;background:rgba(0,0,0,.15) !important;border:0 !important;width:100% !important;font-family:inherit !important;font-size:13px !important;font-weight:700 !important;color:var(--kera-text) !important;transition:background .15s !important;user-select:none !important;}",
    ".ks-acc-header:hover{background:rgba(224,184,74,.08) !important;}",
    ".ks-acc-icon{font-size:16px !important;flex-shrink:0 !important;}",
    ".ks-acc-title{flex:1 !important;text-align:left !important;}",
    ".ks-acc-count{font-size:10px !important;color:var(--kera-dim) !important;flex-shrink:0 !important;background:rgba(224,184,74,.15) !important;padding:2px 8px !important;border-radius:8px !important;}",
    ".ks-acc-arrow{font-size:11px !important;color:var(--kera-gold-dim) !important;flex-shrink:0 !important;transition:transform .2s ease !important;}",
    ".ks-acc-group[data-open='1'] .ks-acc-arrow{transform:rotate(90deg) !important;}",
    ".ks-acc-group[data-open='1'] .ks-acc-header{background:rgba(224,184,74,.12) !important;}",
    ".ks-acc-body{display:none !important;flex-direction:column !important;gap:3px !important;padding:6px 8px 8px !important;background:var(--kera-bubble-left) !important;}",
    ".ks-acc-group[data-open='1'] .ks-acc-body{display:flex !important;}",
    ".ks-acc-btn{display:flex !important;align-items:center !important;gap:8px !important;padding:8px 12px !important;border-radius:10px !important;cursor:pointer !important;font-size:12.5px !important;font-weight:600 !important;color:var(--kera-text) !important;background:rgba(0,0,0,.2) !important;border:1px solid rgba(224,184,74,.1) !important;transition:all .15s ease !important;line-height:1.4 !important;}",
    ".ks-acc-btn:hover{background:rgba(224,184,74,.12) !important;border-color:rgba(224,184,74,.3) !important;transform:translateX(3px) !important;}",
    ".ks-chip:hover{transform:translateY(-1px) !important;box-shadow:0 4px 14px rgba(0,0,0,.2) !important;}",
    ".ks-chip.primary{border-color:rgba(224,184,74,.5) !important;background:rgba(224,184,74,.15) !important;color:var(--kera-gold) !important;}",
    ".ks-chip.danger{border-color:rgba(196,56,56,.45) !important;background:rgba(196,56,56,.12) !important;}",
    "#keranosuke-inputbar{flex:0 0 auto !important;display:flex !important;flex-direction:column !important;gap:10px !important;padding:0 14px 12px !important;border-top:1px solid var(--kera-border) !important;background:var(--kera-surface) !important;}",
    "#ks-inputrow{display:flex !important;gap:10px !important;align-items:center !important;}",
    "#keranosuke-input{flex:1 !important;padding:12px 16px !important;border:1.5px solid rgba(224,184,74,.2) !important;border-radius:999px !important;background:var(--kera-bubble-left) !important;color:var(--kera-text) !important;font-size:13.5px !important;font-family:inherit !important;outline:none !important;transition:all .2s !important;}",
    "#keranosuke-input::placeholder{color:var(--kera-dim) !important;}",
    "#keranosuke-input:focus{border-color:rgba(224,184,74,.5) !important;box-shadow:0 0 0 3px var(--kera-glow) !important;}",
    "#keranosuke-send{padding:12px 20px !important;border:0 !important;border-radius:999px !important;background:linear-gradient(135deg,#e0b84a 0%,#a88b36 100%) !important;color:#1a1618 !important;cursor:pointer !important;font-weight:900 !important;font-family:inherit !important;font-size:13px !important;transition:all .2s !important;box-shadow:0 4px 16px rgba(224,184,74,.3) !important;}",
    "#keranosuke-send:hover{box-shadow:0 6px 24px rgba(224,184,74,.4) !important;}",
    "#keranosuke-panel,#keranosuke-panel *{opacity:1 !important;text-shadow:none !important;}",
    "@media (max-width:520px){#keranosuke-fab-wrap{right:12px !important;bottom:12px !important;}#keranosuke-panel[data-open='1']{width:100vw !important;max-width:100vw !important;height:100dvh !important;max-height:100dvh !important;border-radius:0 !important;}#keranosuke-inputbar{padding-bottom:max(12px,env(safe-area-inset-bottom)) !important;}}"
  ].join("\n");
  document.head.appendChild(style);

  /* =========================================================
     DOM Build
  ========================================================= */
  var wrap = document.createElement("div");
  wrap.id = "keranosuke-fab-wrap";
  var panelDiv = document.createElement("div");
  panelDiv.id = "keranosuke-panel";
  panelDiv.setAttribute("role", "dialog");
  panelDiv.setAttribute("aria-label", "\u3051\u3089\u306e\u3059\u3051\u30c1\u30e3\u30c3\u30c8");
  panelDiv.setAttribute("data-open", "0");
  var headDiv = document.createElement("div");
  headDiv.id = "keranosuke-head";
  var avatarHead = document.createElement("div");
  avatarHead.className = "kera-avatar-head";
  var avatarHeadImg = document.createElement("img");
  avatarHeadImg.src = AVATAR_URL;
  avatarHeadImg.alt = "\u3051\u3089\u306e\u3059\u3051";
  avatarHead.appendChild(avatarHeadImg);
  headDiv.appendChild(avatarHead);
  var headInfo = document.createElement("div");
  headInfo.id = "keranosuke-head-info";
  var titleEl = document.createElement("div");
  titleEl.id = "keranosuke-title";
  titleEl.textContent = "\u3051\u3089\u306e\u3059\u3051";
  headInfo.appendChild(titleEl);
  var subEl = document.createElement("div");
  subEl.id = "keranosuke-sub";
  subEl.textContent = "\u4e16\u754c\u521d\uff01\uff1f\u5730\u6b4c\u821e\u4f0e\u767a\u30fb\u6b4c\u821e\u4f0eAI\u30a8\u30fc\u30b8\u30a7\u30f3\u30c8";
  headInfo.appendChild(subEl);
  headDiv.appendChild(headInfo);
  var closeButton = document.createElement("button");
  closeButton.id = "keranosuke-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "\u9589\u3058\u308b");
  closeButton.textContent = "\u2715";
  headDiv.appendChild(closeButton);
  panelDiv.appendChild(headDiv);
  var logDiv = document.createElement("div");
  logDiv.id = "keranosuke-log";
  panelDiv.appendChild(logDiv);
  var inputbar = document.createElement("div");
  inputbar.id = "keranosuke-inputbar";
  var chipsDiv = document.createElement("div");
  chipsDiv.id = "ks-chips";
  chipsDiv.setAttribute("aria-label", "\u64cd\u4f5c\u30dc\u30bf\u30f3");
  inputbar.appendChild(chipsDiv);
  var inputRow = document.createElement("div");
  inputRow.id = "ks-inputrow";
  var inputEl = document.createElement("input");
  inputEl.id = "keranosuke-input";
  inputEl.type = "text";
  inputEl.placeholder = "\u805e\u304d\u305f\u3044\u3053\u3068\u3092\u5165\u529b\u3057\u3066\u306d";
  inputRow.appendChild(inputEl);
  var sendBtn = document.createElement("button");
  sendBtn.id = "keranosuke-send";
  sendBtn.type = "button";
  sendBtn.textContent = "\u9001\u4fe1";
  inputRow.appendChild(sendBtn);
  inputbar.appendChild(inputRow);
  panelDiv.appendChild(inputbar);
  wrap.appendChild(panelDiv);
  var fabBtn = document.createElement("button");
  fabBtn.id = "keranosuke-fab";
  fabBtn.type = "button";
  fabBtn.setAttribute("aria-controls", "keranosuke-panel");
  fabBtn.setAttribute("aria-expanded", "false");
  var fabImg = document.createElement("img");
  fabImg.src = AVATAR_URL;
  fabImg.alt = "\u3051\u3089\u306e\u3059\u3051";
  fabBtn.appendChild(fabImg);
  fabBtn.appendChild(document.createTextNode("\u3051\u3089\u306e\u3059\u3051\u306b\u805e\u304f"));
  wrap.appendChild(fabBtn);
  document.body.appendChild(wrap);

  var fab = fabBtn;
  var panel = panelDiv;
  var closeBtn = closeButton;
  var log = logDiv;
  var input = inputEl;
  var sendButton = sendBtn;
  var chips = chipsDiv;

  /* =========================================================
     Core Helpers
  ========================================================= */
  function scrollToBottom() {
    requestAnimationFrame(function() {
      log.scrollTop = log.scrollHeight;
      requestAnimationFrame(function() { log.scrollTop = log.scrollHeight; });
    });
  }

  function makeAvatar(cls) {
    var av = document.createElement("div");
    av.className = cls || "ks-avatar";
    var img = document.createElement("img");
    img.src = AVATAR_URL;
    img.alt = "\u3051\u3089\u306e\u3059\u3051";
    av.appendChild(img);
    return av;
  }

  function addBubble(side, content, opts) {
    opts = opts || {};
    var row = document.createElement("div");
    row.className = "ks-row " + (side === "right" ? "ks-right" : "ks-left");
    if (side === "left") row.appendChild(makeAvatar("ks-avatar"));
    var bubble = document.createElement("div");
    bubble.className = "ks-bubble";
    if (opts.isHTML) bubble.innerHTML = content;
    else bubble.textContent = content;
    row.appendChild(bubble);
    log.appendChild(row);
    scrollToBottom();
    return bubble;
  }

  function addTyping() {
    var row = document.createElement("div");
    row.className = "ks-row ks-left";
    row.id = "kera-typing-row";
    row.appendChild(makeAvatar("ks-avatar"));
    var bubble = document.createElement("div");
    bubble.className = "ks-bubble ks-typing";
    for (var i = 0; i < 3; i++) {
      var dot = document.createElement("div");
      dot.className = "ks-typing-dot";
      bubble.appendChild(dot);
    }
    row.appendChild(bubble);
    log.appendChild(row);
    scrollToBottom();
  }
  function removeTyping() {
    var el = document.getElementById("kera-typing-row");
    if (el) el.parentNode.removeChild(el);
  }

  /* =========================================================
     Menu Cards
  ========================================================= */
  function addMenuCards() {
    var row = document.createElement("div");
    row.className = "ks-row ks-left";
    row.appendChild(makeAvatar("ks-avatar"));
    var bubble = document.createElement("div");
    bubble.className = "ks-bubble";
    bubble.style.cssText = "padding:8px 10px !important; max-width:90% !important;";
    var greeting = document.createElement("div");
    greeting.style.cssText = "font-size:13px;margin-bottom:8px;line-height:1.6;";
    greeting.textContent = "\u3084\u3042\uff01\u3051\u3089\u306e\u3059\u3051\u3060\u3088\ud83d\ude42\n\u6c17\u306b\u306a\u308b\u30e1\u30cb\u30e5\u30fc\u3092\u30bf\u30c3\u30d7\u3057\u3066\u306d\uff01";
    bubble.appendChild(greeting);
    var grid = document.createElement("div");
    grid.className = "ks-menu-grid";
    MENU_ITEMS.forEach(function(item) {
      var card = document.createElement("div");
      card.className = "ks-menu-card";
      card.style.borderColor = item.border;
      var iconDiv = document.createElement("div");
      iconDiv.className = "ks-menu-icon";
      iconDiv.style.background = item.color;
      iconDiv.textContent = item.icon;
      card.appendChild(iconDiv);
      var textDiv = document.createElement("div");
      textDiv.className = "ks-menu-text";
      var labelDiv = document.createElement("div");
      labelDiv.className = "ks-menu-label";
      labelDiv.textContent = item.label;
      textDiv.appendChild(labelDiv);
      var descDiv = document.createElement("div");
      descDiv.className = "ks-menu-desc";
      descDiv.textContent = item.desc;
      textDiv.appendChild(descDiv);
      card.appendChild(textDiv);
      var arrow = document.createElement("div");
      arrow.className = "ks-menu-arrow";
      arrow.textContent = "\u203a";
      card.appendChild(arrow);
      card.addEventListener("click", function() { selectMode(item.mode); });
      grid.appendChild(card);
    });
    bubble.appendChild(grid);
    row.appendChild(bubble);
    log.appendChild(row);
    scrollToBottom();
  }

  /* =========================================================
     Video Cards
  ========================================================= */
  function addVideoCards(text) {
    var urlRegex = /https?:\/\/youtu\.be\/[a-zA-Z0-9_-]+/g;
    var urls = text.match(urlRegex) || [];
    var foundVideos = [];
    var keys = Object.keys(VIDEO_MAP);
    for (var k = 0; k < keys.length; k++) {
      var vid = VIDEO_MAP[keys[k]];
      if (text.indexOf(vid.url) !== -1) foundVideos.push(vid);
    }
    for (var u = 0; u < urls.length; u++) {
      var exists = false;
      for (var f = 0; f < foundVideos.length; f++) {
        if (foundVideos[f].url === urls[u]) { exists = true; break; }
      }
      if (!exists) foundVideos.push({ url: urls[u], title: "\u516c\u6f14\u52d5\u753b" });
    }
    if (foundVideos.length === 0) return;
    var row = document.createElement("div");
    row.className = "ks-row ks-left";
    row.style.cssText = "margin-left:36px !important;";
    var container = document.createElement("div");
    container.style.cssText = "display:flex;flex-direction:column;gap:4px;max-width:82%;";
    var max = Math.min(foundVideos.length, 3);
    for (var v = 0; v < max; v++) {
      var vd = foundVideos[v];
      var card = document.createElement("a");
      card.className = "ks-video-card";
      card.href = vd.url;
      card.target = "_blank";
      card.rel = "noopener";
      var iconSpan = document.createElement("div");
      iconSpan.className = "ks-video-icon";
      iconSpan.textContent = "\u25b6\ufe0f";
      card.appendChild(iconSpan);
      var info = document.createElement("div");
      info.className = "ks-video-info";
      var vTitle = document.createElement("div");
      vTitle.className = "ks-video-title";
      vTitle.textContent = vd.title;
      info.appendChild(vTitle);
      var vSub = document.createElement("div");
      vSub.className = "ks-video-sub";
      vSub.textContent = "\u6c17\u826f\u6b4c\u821e\u4f0e YouTube";
      info.appendChild(vSub);
      card.appendChild(info);
      container.appendChild(card);
    }
    row.appendChild(container);
    log.appendChild(row);
    scrollToBottom();
  }

  /* =========================================================
     Chips & Mode
  ========================================================= */
  function makeChip(label, sendText, cls) {
    var b = document.createElement("div");
    b.className = "ks-chip" + (cls ? " " + cls : "");
    b.textContent = label;
    b.addEventListener("click", function() {
      if (sendText === "__MENU__") goMenu(true);
      else {
        addBubble("right", label);
        askWorker(sendText, { silentUser: true });
      }
    });
    return b;
  }

  function renderChips() {
    chips.innerHTML = "";
    if (currentMode === "quiz") {
      chips.appendChild(makeChip("\u6b21\u3078", "7", "primary"));
      chips.appendChild(makeChip("\u5fa9\u7fd2", "8", ""));
      chips.appendChild(makeChip("\u6700\u521d\u304b\u3089", "9", "danger"));
      chips.appendChild(makeChip("\u30e1\u30cb\u30e5\u30fc", "__MENU__", ""));
    } else {
      chips.appendChild(makeChip("\u30e1\u30cb\u30e5\u30fc", "__MENU__", "primary"));
    }
  }

  function setMode(mode) {
    currentMode = mode || null;
    try {
      if (currentMode) localStorage.setItem(LAST_MODE_KEY, currentMode);
      else localStorage.removeItem(LAST_MODE_KEY);
    } catch(e) {}
    input.placeholder = (currentMode === "quiz") ? "\u30dc\u30bf\u30f3\u304b\u3089\u9078\u3093\u3067\u306d\ud83d\udc46" : "\u805e\u304d\u305f\u3044\u3053\u3068\u3092\u5165\u529b\u3057\u3066\u306d";
    renderChips();
  }

  /* =========================================================
     Text Processing
  ========================================================= */
  function stripFooter(text) {
    if (!text) return text;
    var SEP = "\u2501\u2501\u2501";
    if (currentMode === "quiz") {
      var lastIdx = text.lastIndexOf(SEP);
      if (lastIdx === -1) return text;
      var firstIdx = text.indexOf(SEP);
      if (firstIdx === lastIdx) {
        var afterSep = text.substring(lastIdx);
        if (afterSep.indexOf("\ud83d\udcca") !== -1) return text;
        return text.substring(0, lastIdx).replace(/\s+$/, "");
      }
      return text.substring(0, lastIdx).replace(/\s+$/, "");
    }
    var idx = text.indexOf(SEP);
    if (idx !== -1) return text.substring(0, idx).replace(/\s+$/, "");
    return text;
  }

  function parseQuizChoices(text) {
    if (!text) return null;
    var m = text.match(/([\s\S]*?)\n\s*1[)\uff09]\s*(.+)\n\s*2[)\uff09]\s*(.+)\n\s*3[)\uff09]\s*(.+)/);
    if (!m) return null;
    return { question: m[1].replace(/\s+$/, ""), choices: [m[2].trim(), m[3].trim(), m[4].trim()] };
  }

  function addQuizChoiceButtons(choices) {
    var row = document.createElement("div");
    row.className = "ks-row ks-left";
    row.style.cssText = "margin-left:36px !important;";
    var container = document.createElement("div");
    container.style.cssText = "display:flex;flex-direction:column;gap:5px;max-width:88%;width:100%;";
    var btnBorder = "rgba(224,184,74,.3)";
    var btnBg = "#252028";
    var nums = ["\u2460", "\u2461", "\u2462"];
    for (var i = 0; i < choices.length; i++) {
      (function(idx) {
        var btn = document.createElement("div");
        btn.style.cssText = "display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;cursor:pointer;border:1.5px solid " + btnBorder + ";background:" + btnBg + ";color:#efe8df;transition:all .2s ease;";
        var num = document.createElement("span");
        num.style.cssText = "font-size:16px;font-weight:900;flex-shrink:0;color:#e0b84a;";
        num.textContent = nums[idx];
        btn.appendChild(num);
        var label = document.createElement("span");
        label.style.cssText = "font-size:13px;font-weight:700;line-height:1.4;color:#efe8df;";
        label.textContent = choices[idx];
        btn.appendChild(label);
        btn.addEventListener("mouseenter", function() { btn.style.transform = "translateX(3px)"; btn.style.boxShadow = "0 4px 14px rgba(0,0,0,.08)"; });
        btn.addEventListener("mouseleave", function() { btn.style.transform = ""; btn.style.boxShadow = ""; });
        btn.addEventListener("click", function() { askWorker(String(idx + 1)); });
        container.appendChild(btn);
      })(i);
    }
    row.appendChild(container);
    log.appendChild(row);
    scrollToBottom();
  }

  function looksLikeMenuReply(reply) {
    var r = reply || "";
    var hasPrompt = r.indexOf("\u306a\u306b\u3092\u77e5\u308a\u305f\u3044") !== -1 || r.indexOf("\u4f55\u3092\u77e5\u308a\u305f\u3044") !== -1 || r.indexOf("\u6570\u5b57\u3067\u9001\u3063\u3066\u306d") !== -1 || r.indexOf("\u6570\u5b57\uff081") !== -1 || r.indexOf("\u6570\u5b57(1") !== -1;
    var hasList = r.indexOf("1)") !== -1 || r.indexOf("1\uff09") !== -1 || r.indexOf("2)") !== -1 || r.indexOf("2\uff09") !== -1;
    return hasPrompt && hasList;
  }

  /* =========================================================
     Navigation
  ========================================================= */
  function selectMode(mode) {
    var item = null;
    for (var i = 0; i < MENU_ITEMS.length; i++) {
      if (MENU_ITEMS[i].mode === mode) { item = MENU_ITEMS[i]; break; }
    }
    addBubble("right", item ? item.label : mode);
    setMode(mode);
    askWorker(item ? item.send : "0", { silentUser: true, modeSelectOrigin: true });
  }

  function goMenu(silentUser) {
    setMode(null);
    if (!silentUser) addBubble("right", "\u30e1\u30cb\u30e5\u30fc");
    addMenuCards();
    askWorker("0", { silentUser: true, swallowReply: true });
  }

  /* =========================================================
     ★ Web UI Renderer (buttons / nav_buttons / detail / card)
  ========================================================= */
  function renderWebUI(ui) {
    if (!ui) return;
    if (ui.type === "menu") { addMenuCards(); return; }

    /* ★ Card UI（LINE Flex風カード） */
    if (ui.type === "card") {
      var crow = document.createElement("div");
      crow.className = "ks-row ks-left";
      crow.appendChild(makeAvatar("ks-avatar"));
      var card = document.createElement("div");
      card.className = "ks-card";
      if (ui.title) {
        var ct = document.createElement("div");
        ct.className = "ks-card-title";
        ct.textContent = ui.title;
        card.appendChild(ct);
      }
      if (ui.subtitle) {
        var cs = document.createElement("div");
        cs.className = "ks-card-subtitle";
        cs.textContent = ui.subtitle;
        card.appendChild(cs);
      }
      var sep = document.createElement("hr");
      sep.className = "ks-card-sep";
      card.appendChild(sep);
      if (ui.body) {
        var cb = document.createElement("div");
        cb.className = "ks-card-body";
        cb.textContent = ui.body;
        card.appendChild(cb);
      }
      crow.appendChild(card);
      log.appendChild(crow);

      /* カード下のナビボタン */
      var hasNav = (ui.items && ui.items.length > 0) || (ui.footer && ui.footer.length > 0);
      if (hasNav) {
        var nrow = document.createElement("div");
        nrow.className = "ks-row ks-left";
        nrow.style.cssText = "margin-left:36px !important;";
        var nc = document.createElement("div");
        nc.style.cssText = "display:flex;flex-direction:column;gap:4px;max-width:88%;";
        if (ui.items) {
          for (var ni = 0; ni < ui.items.length; ni++) {
            nc.appendChild(createActionButton(ui.items[ni], "nav"));
          }
        }
        if (ui.footer && ui.footer.length > 0) {
          var fr = document.createElement("div");
          fr.style.cssText = "display:flex;gap:4px;margin-top:4px;";
          for (var fi = 0; fi < ui.footer.length; fi++) {
            var fb = createActionButton(ui.footer[fi], "footer");
            fb.style.flex = "1";
            fr.appendChild(fb);
          }
          nc.appendChild(fr);
        }
        nrow.appendChild(nc);
        log.appendChild(nrow);
      }
      scrollToBottom();
      return;
    }

    /* buttons / nav_buttons */
    if (ui.type === "buttons" || ui.type === "nav_buttons") {
      var items = ui.items || [];

      /* ★ category フィールドがあればアコーディオン表示 */
      var cats = groupByCategory(items);
      if (cats) {
        renderNaviAccordion(cats, ui.footer);
        return;
      }

      var row = document.createElement("div");
      row.className = "ks-row ks-left";
      row.style.cssText = "margin-left:36px !important;";
      var container = document.createElement("div");
      container.style.cssText = "display:flex;flex-direction:column;gap:4px;max-width:88%;";
      var items = ui.items || [];
      for (var i = 0; i < items.length; i++) {
        container.appendChild(createActionButton(items[i], ui.type === "buttons" ? "action" : "nav"));
      }
      if (ui.footer && ui.footer.length > 0) {
        var footerRow = document.createElement("div");
        footerRow.style.cssText = "display:flex;gap:4px;margin-top:4px;";
        for (var f = 0; f < ui.footer.length; f++) {
          var fbtn = createActionButton(ui.footer[f], "footer");
          fbtn.style.flex = "1";
          footerRow.appendChild(fbtn);
        }
        container.appendChild(footerRow);
      }
      row.appendChild(container);
      log.appendChild(row);
      scrollToBottom();
    }

    /* detail (video + footer) */
    if (ui.type === "detail") {
      if (ui.videos && ui.videos.length > 0) {
        var vrow = document.createElement("div");
        vrow.className = "ks-row ks-left";
        vrow.style.cssText = "margin-left:36px !important;";
        var vc = document.createElement("div");
        vc.style.cssText = "display:flex;flex-direction:column;gap:4px;max-width:82%;";
        for (var v = 0; v < ui.videos.length; v++) {
          var vid = ui.videos[v];
          var vcard = document.createElement("a");
          vcard.className = "ks-video-card";
          vcard.href = vid.url;
          vcard.target = "_blank";
          vcard.rel = "noopener";
          var vi = document.createElement("div");
          vi.className = "ks-video-icon";
          vi.textContent = "\u25b6\ufe0f";
          vcard.appendChild(vi);
          var vinf = document.createElement("div");
          vinf.className = "ks-video-info";
          var vt = document.createElement("div");
          vt.className = "ks-video-title";
          vt.textContent = vid.title;
          vinf.appendChild(vt);
          var vs = document.createElement("div");
          vs.className = "ks-video-sub";
          vs.textContent = "\u6c17\u826f\u6b4c\u821e\u4f0e YouTube";
          vinf.appendChild(vs);
          vcard.appendChild(vinf);
          vc.appendChild(vcard);
        }
        vrow.appendChild(vc);
        log.appendChild(vrow);
      }
      if (ui.footer && ui.footer.length > 0) {
        var frow = document.createElement("div");
        frow.className = "ks-row ks-left";
        frow.style.cssText = "margin-left:36px !important;";
        var fc = document.createElement("div");
        fc.style.cssText = "display:flex;gap:4px;max-width:88%;";
        for (var ff = 0; ff < ui.footer.length; ff++) {
          var ffb = createActionButton(ui.footer[ff], "footer");
          ffb.style.flex = "1";
          fc.appendChild(ffb);
        }
        frow.appendChild(fc);
        log.appendChild(frow);
      }
      scrollToBottom();
    }
  }

  /* =========================================================
     ★ Navi Accordion Renderer
  ========================================================= */
  function renderNaviAccordion(cats, footer) {
    var row = document.createElement("div");
    row.className = "ks-row ks-left";
    row.appendChild(makeAvatar("ks-avatar"));
    var acc = document.createElement("div");
    acc.className = "ks-accordion";

    /* 説明テキスト */
    var intro = document.createElement("div");
    intro.style.cssText = "font-size:12px;color:#8a8290;margin-bottom:2px;padding:0 2px;";
    intro.textContent = "\u30ab\u30c6\u30b4\u30ea\u3092\u30bf\u30c3\u30d7\u3057\u3066\u958b\u3044\u3066\u306d\ud83d\udc47";
    acc.appendChild(intro);

    for (var c = 0; c < cats.length; c++) {
      (function(cat, idx) {
        var group = document.createElement("div");
        group.className = "ks-acc-group";
        group.setAttribute("data-open", idx === 0 ? "1" : "0");

        var header = document.createElement("button");
        header.className = "ks-acc-header";
        header.type = "button";
        var icon = document.createElement("span");
        icon.className = "ks-acc-icon";
        icon.textContent = cat.icon;
        header.appendChild(icon);
        var title = document.createElement("span");
        title.className = "ks-acc-title";
        title.textContent = cat.title;
        header.appendChild(title);
        var count = document.createElement("span");
        count.className = "ks-acc-count";
        count.textContent = cat.items.length;
        header.appendChild(count);
        var arrow = document.createElement("span");
        arrow.className = "ks-acc-arrow";
        arrow.textContent = "\u25b6";
        header.appendChild(arrow);
        group.appendChild(header);

        var body = document.createElement("div");
        body.className = "ks-acc-body";
        for (var i = 0; i < cat.items.length; i++) {
          (function(item) {
            var btn = document.createElement("div");
            btn.className = "ks-acc-btn";
            btn.textContent = item.label;
            btn.addEventListener("click", function() {
              var action = item.action || "";
              if (action.indexOf("postback:") === 0) askWorker(action);
              else if (action === "__MENU__") goMenu(true);
              else askWorker(action);
            });
            body.appendChild(btn);
          })(cat.items[i]);
        }
        group.appendChild(body);

        header.addEventListener("click", function() {
          var isOpen = group.getAttribute("data-open") === "1";
          /* 他を閉じて自分を開く（排他アコーディオン） */
          var siblings = acc.querySelectorAll(".ks-acc-group");
          for (var s = 0; s < siblings.length; s++) {
            siblings[s].setAttribute("data-open", "0");
          }
          if (!isOpen) group.setAttribute("data-open", "1");
          scrollToBottom();
        });

        acc.appendChild(group);
      })(cats[c], c);
    }

    /* フッター（メニューボタン等） */
    if (footer && footer.length > 0) {
      var fr = document.createElement("div");
      fr.style.cssText = "display:flex;gap:4px;margin-top:4px;";
      for (var f = 0; f < footer.length; f++) {
        var fb = createActionButton(footer[f], "footer");
        fb.style.flex = "1";
        fr.appendChild(fb);
      }
      acc.appendChild(fr);
    }

    row.appendChild(acc);
    log.appendChild(row);
    scrollToBottom();
  }

  function createActionButton(item, btnStyle) {
    var btn = document.createElement("div");
    btn.textContent = item.label;
    btn.style.cssText = btnStyle === "action"
      ? "padding:8px 12px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700;background:#252028;border:1px solid rgba(224,184,74,.25);color:#efe8df;transition:all .15s ease;text-align:center;line-height:1.4;"
      : btnStyle === "nav"
      ? "padding:6px 10px;border-radius:8px;cursor:pointer;font-size:12px;background:rgba(224,184,74,.12);border:1px solid rgba(224,184,74,.35);color:#e0b84a;font-weight:700;transition:all .15s ease;text-align:center;"
      : "padding:6px 2px;border-radius:8px;cursor:pointer;font-size:11px;background:#252028;border:1px solid rgba(224,184,74,.2);color:#8a8290;text-align:center;transition:all .12s ease;white-space:nowrap;";
    btn.addEventListener("mouseenter", function() { btn.style.transform = "translateY(-1px)"; btn.style.boxShadow = "0 3px 10px rgba(0,0,0,.08)"; });
    btn.addEventListener("mouseleave", function() { btn.style.transform = ""; btn.style.boxShadow = ""; });
    btn.addEventListener("click", function() {
      var action = item.action || "";
      if (action.indexOf("postback:") === 0) askWorker(action);
      else if (action === "__MENU__") goMenu(true);
      else askWorker(action);
    });
    return btn;
  }

  /* =========================================================
     Worker API
  ========================================================= */
  function askWorker(text, opts) {
    opts = opts || {};
    if (!opts.silentUser) {
      if (text.indexOf("postback:") !== 0) addBubble("right", text);
    }
    addTyping();
    fetch(WORKER_WEB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, session_id: sid })
    }).then(function(res) {
      return res.text().then(function(raw) { return { ok: res.ok, status: res.status, raw: raw }; });
    }).then(function(result) {
      var data = null;
      try { data = JSON.parse(result.raw); } catch(e) {}
      removeTyping();
      if (!result.ok) { addBubble("left", "HTTP " + result.status + "\n" + result.raw.slice(0, 240)); return; }
      if (!data || typeof data.reply !== "string") { addBubble("left", "\u8fd4\u7b54\u5f62\u5f0f\u304c\u60f3\u5b9a\u5916\u3060\u3088\ud83d\ude4f\n" + result.raw.slice(0, 240)); return; }
      if (data.mode) setMode(data.mode);
      if (opts.swallowReply) return;
      var reply = data.reply;

      /* UI付き応答 */
      if (data.ui) {
        if (data.ui.type === "menu") { addMenuCards(); return; }
        if (reply) {
          var d2 = stripFooter(reply);
          if (data.isHTML) {
            if (d2) addBubble("left", d2, { isHTML: true });
          } else {
            var c2 = d2.replace(/https?:\/\/youtu\.be\/[a-zA-Z0-9_-]+/g, "").replace(/\s+$/, "").replace(/^\s+/, "");
            if (c2) addBubble("left", c2);
          }
        }
        renderWebUI(data.ui);
        return;
      }

      /* メニュー風テキスト */
      if (looksLikeMenuReply(reply)) { addMenuCards(); return; }

      var displayReply = stripFooter(reply);
      var htmlReply = displayReply
        .replace(/[-\u2501\u2015]{3,}/g, '<hr class="ks-hr">')
        .replace(/(\ud83d\udcca.+)/g, '<div class="ks-score">$1<\/div>')
        .replace(/\n/g, '<br>');

      if (currentMode === "quiz") {
        var qp = parseQuizChoices(displayReply);
        if (qp) {
          if (qp.question) addBubble("left", qp.question);
          addQuizChoiceButtons(qp.choices);
          return;
        }
      }
      var clean = htmlReply.replace(/https?:\/\/youtu\.be\/[a-zA-Z0-9_-]+/g, "");
      if (clean) addBubble("left", clean, { isHTML: true });
      addVideoCards(reply);
    }).catch(function(e) {
      removeTyping();
      addBubble("left", "\u901a\u4fe1\u30a8\u30e9\u30fc\u3060\u3088\ud83d\ude4f\n" + String(e || ""));
    });
  }

  /* =========================================================
     Init & Events
  ========================================================= */
  var initialized = false;
  function showWelcome() {
    if (initialized) return;
    initialized = true;
    setMode(null);
    addMenuCards();
    renderChips();
    /* サーバー側の mode をリセット（前回がクイズ等だと「1」が回答扱いになるため） */
    askWorker("0", { silentUser: true, swallowReply: true });
  }

  function handleSend() {
    var text = input.value.replace(/^\s+|\s+$/g, "");
    if (!text) return;
    input.value = "";
    if (text === "\u30e1\u30cb\u30e5\u30fc" || text.toLowerCase() === "menu" || text === "0") { goMenu(false); return; }
    if (!currentMode) {
      var num = parseInt(text, 10);
      if (num >= 1 && num <= MENU_ITEMS.length) { selectMode(MENU_ITEMS[num - 1].mode); return; }
      setMode("kera");
      askWorker("1", { silentUser: true, swallowReply: true });
      askWorker(text);
      return;
    }
    askWorker(text);
  }

  function openPanel() {
    panel.setAttribute("data-open", "1");
    fab.setAttribute("aria-expanded", "true");
    setTimeout(function() {
      scrollToBottom();
      if (!window.matchMedia("(max-width:520px)").matches) input.focus();
    }, 80);
    showWelcome();
  }
  function closePanel() {
    panel.setAttribute("data-open", "0");
    fab.setAttribute("aria-expanded", "false");
  }

  var MOBILE_MAX = 520;
  function isMobileNow() { return window.matchMedia("(max-width:" + MOBILE_MAX + "px)").matches; }

  if (!isMobileNow()) { setTimeout(openPanel, 0); setTimeout(openPanel, 200); } else { closePanel(); }

  window.matchMedia("(max-width:" + MOBILE_MAX + "px)").addEventListener("change", function(e) {
    if (e.matches) closePanel(); else openPanel();
  });
  fab.addEventListener("click", function() { panel.getAttribute("data-open") === "1" ? closePanel() : openPanel(); });
  closeBtn.addEventListener("click", closePanel);
  window.addEventListener("keydown", function(e) { if (e.key === "Escape" && panel.getAttribute("data-open") === "1") closePanel(); });
  sendButton.addEventListener("click", handleSend);
  input.addEventListener("keydown", function(e) { if (e.key === "Enter") handleSend(); });

})();