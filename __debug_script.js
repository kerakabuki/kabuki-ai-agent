
    (function(){
      var app = document.getElementById("app");

      /* =====================================================
         会場マスター
      ===================================================== */
      var VENUES = [
        { id: "kabukiza",  name: "歌舞伎座",   group: "大歌舞伎" },
        { id: "shinbashi", name: "新橋演舞場", group: "大歌舞伎" },
        { id: "osaka",     name: "大阪松竹座", group: "大歌舞伎" },
        { id: "kyoto",     name: "南座",       group: "大歌舞伎" },
        { id: "nagoya",    name: "御園座",     group: "大歌舞伎" },
        { id: "hakataza",  name: "博多座",     group: "大歌舞伎" },
        { id: "kira",      name: "気良座",     group: "地歌舞伎" }
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
      }
      function addEntry(entry) {
        var tlog = loadTlog();
        entry.id = "tl_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        entry.created_at = Math.floor(Date.now() / 1000);
        tlog.entries.unshift(entry);
        saveTlog(tlog);
        return tlog;
      }
      function removeEntry(id) {
        var tlog = loadTlog();
        tlog.entries = tlog.entries.filter(function(e){ return e.id !== id; });
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
      }
      function toggleFavorite(name) {
        var fav = loadFavorites();
        var idx = fav.indexOf(name);
        if (idx >= 0) fav.splice(idx, 1); else fav.push(name);
        saveFavorites(fav);
        return fav;
      }
      function isFavorite(name) { return loadFavorites().indexOf(name) >= 0; }

      /* =====================================================
         閲覧ログ / クイズ（既存）
      ===================================================== */
      var LOG_KEY = "keranosuke_log_v1";
      function defaultLog() {
        return { v: 1, updated_at: 0, recent: [], clips: { enmoku: [], person: [], term: [] }, practice: { serifu: { last_ts: 0, progress: 0 } } };
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
          return log;
        } catch(e) { return defaultLog(); }
      }
      function saveLog(log) {
        log.updated_at = Math.floor(Date.now() / 1000);
        try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch(e) {}
      }
      function loadQuizState() {
        try {
          var raw = localStorage.getItem("keranosuke_quiz_state");
          if (raw) return JSON.parse(raw);
        } catch(e) {}
        return { answered_total: 0, correct_total: 0, wrong_ids: [] };
      }

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
        var m = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
        if (!m) return null;
        var year = parseInt(m[1],10), month = parseInt(m[2],10), startDay = parseInt(m[3],10);
        var start = new Date(year, month-1, startDay);
        /* 終了日: まず「～3月26日」（月またぎ）を試す → なければ「～26日」（同月） */
        var mCross = text.match(/～\s*(\d{1,2})月(\d{1,2})日/);
        var end;
        if (mCross) {
          /* 月またぎ: ～3月26日 */
          var em = parseInt(mCross[1],10);
          var ed = parseInt(mCross[2],10);
          end = new Date(year, em-1, ed);
        } else {
          var mSame = text.match(/～\s*(\d{1,2})日/);
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
          console.log("[歌舞伎ログ debug]", pp.theater, "codes:", nameChars, "vs", venueChars, "match:", nameMatch, "period:", pp.period_text, "parsed:", pr ? (pr.start + " ~ " + pr.end) : "NULL");
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
        var t = playTitle.replace(/s+/g, "");
        for (var i = 0; i < enmokuCatalogCache.length; i++) {
          var e = enmokuCatalogCache[i];
          var s = (e.short || "").replace(/s+/g, "");
          var f = (e.full || "").replace(/s+/g, "");
          if (s && (s === t || t.indexOf(s) >= 0 || s.indexOf(t) >= 0)) return e.id;
          if (f && (f === t || t.indexOf(f) >= 0 || f.indexOf(t) >= 0)) return e.id;
          if (e.aliases) {
            for (var j = 0; j < e.aliases.length; j++) {
              var a = (e.aliases[j] || "").replace(/s+/g, "");
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
        var parts = roleName.split(/[／・/]/);
        for (var j = 0; j < entry.cast_names.length; j++) {
          var c = entry.cast_names[j];
          var cn = (c.name || "").replace(/s+/g, "").replace(/[（(][^）)]*[）)]/g, "");
          if (!cn || cn.length < 2) continue;
          for (var p = 0; p < parts.length; p++) {
            var r = parts[p].replace(/s+/g, "").replace(/[（(][^）)]*[）)]/g, "");
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
        if (r.type === "enmoku") return "/enmoku/" + encodeURIComponent(r.id);
        if (r.type === "term") return "/glossary/" + encodeURIComponent(r.id);
        if (r.type === "person" && r.parent) return "/enmoku/" + encodeURIComponent(r.parent) + "#cast-" + encodeURIComponent(r.id);
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
        formState = {
          viewing_type: null,     /* null=未選択, "theater"=劇場, その他=メディア視聴 */
          date: todayStr(),
          venue_id: null,
          venue_name: null,
          seat_type: null,
          performance_title: null,
          play_titles: [],
          memo: "",
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
      var clipTab = "enmoku";
      var subView = null;         /* null | "recent" | "clips" | "review" */

      function render() {
        if (subView === "recent") { renderRecent(); renderBottomTabs(); return; }
        if (subView === "clips") { renderClips(); renderBottomTabs(); return; }
        if (subView === "review") { renderReview(); renderBottomTabs(); return; }
        if (currentView === "home") renderHome();
        else if (currentView === "log") renderLogTab();
        else if (currentView === "oshi") renderOshiTab();
        else renderHome();
        renderBottomTabs();
      }

      function renderBottomTabs() {
        var existingTabs = document.getElementById("kl-bottom-tabs");
        if (existingTabs) existingTabs.remove();
        var t = '<div class="kl-bottom-tabs" id="kl-bottom-tabs">';
        t += '<button class="kl-tab-btn' + (currentView === "home" && !subView ? " kl-tab-active" : "") + '" onclick="MP.switchTab(\'home\')">';
        t += '<span class="kl-tab-icon">🏠</span>ホーム</button>';
        t += '<button class="kl-tab-btn' + (currentView === "log" && !subView ? " kl-tab-active" : "") + '" onclick="MP.switchTab(\'log\')">';
        t += '<span class="kl-tab-icon">📝</span>ログ</button>';
        t += '<button class="kl-tab-btn' + (currentView === "oshi" && !subView ? " kl-tab-active" : "") + '" onclick="MP.switchTab(\'oshi\')">';
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
        h += '観劇の記録、推しの追跡、歌舞伎の学びをひとつに。<br>あなただけの歌舞伎ライフを積み上げよう。';
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
          h += '<div class="oshi-banner" onclick="MP.switchTab(\'oshi\')">';
          h += '<div class="oshi-banner-icon">⭐</div>';
          h += '<div class="oshi-banner-body">';
          h += '<div class="oshi-banner-title">推し俳優を登録しよう</div>';
          h += '<div class="oshi-banner-desc">推しタブで俳優を登録すると、ニュースや観劇回数を追跡できます</div>';
          h += '</div>';
          h += '<span class="oshi-banner-arrow">→</span>';
          h += '</div>';
        } else {
          h += '<div class="oshi-section">';
          h += '<div class="oshi-section-header" onclick="MP.switchTab(\'oshi\')">';
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
            h += '<div class="mp-actions"><button class="mp-btn" onclick="MP.switchTab(\'log\')">ログタブで全件を見る →</button></div>';
          }
        } else {
          h += '<div class="mp-empty">まだ記録がありません 🎭<br>上のボタンから記録してみよう！</div>';
        }
        h += '</div>';

        h += '<hr class="tl-divider">';

        /* ── 学習ログ ── */
        var ec = log.clips.enmoku.length;
        var pc = log.clips.person.length;
        var tc = log.clips.term.length;
        var rc = log.recent.length;

        h += '<div class="mp-section">';
        h += '<div class="mp-section-title">📚 学習ログ</div>';

        h += '<div class="learn-grid">';

        h += '<a href="/enmoku" class="learn-card" style="text-decoration:none;color:inherit;">';
        h += '<div class="lc-icon lc-icon-enmoku">📋</div>';
        h += '<div><div class="lc-label">演目ガイド</div>';
        h += '<div class="lc-value">' + (ec + pc) + '<span> 保存</span></div></div></a>';

        h += '<a href="/glossary" class="learn-card" style="text-decoration:none;color:inherit;">';
        h += '<div class="lc-icon lc-icon-glossary">📘</div>';
        h += '<div><div class="lc-label">用語いろは</div>';
        h += '<div class="lc-value">' + tc + '<span> 保存</span></div></div></a>';

        h += '<div class="learn-card" onclick="MP.goSub(\'review\')">';
        h += '<div class="lc-icon lc-icon-quiz">❓</div>';
        h += '<div>';
        h += '<div class="lc-label">クイズ</div>';
        if (quizState.answered_total > 0) {
          var title = calcTitle(quizState.correct_total, 100);
          h += '<div class="lc-badge">' + title + '</div>';
          h += '<div class="lc-value">' + quizState.correct_total + '<span>/' + quizState.answered_total + ' 正解</span></div>';
          /* 次の称号まで */
          var thresholds = [5, 15, 30, 50, 70, 90, 100];
          var nextT = 100;
          for (var nth = 0; nth < thresholds.length; nth++) {
            if (quizState.correct_total < thresholds[nth]) { nextT = thresholds[nth]; break; }
          }
          if (quizState.correct_total < 100) {
            h += '<div style="font-size:10px;color:var(--kl-text3);margin-top:2px;">次まであと' + (nextT - quizState.correct_total) + '問</div>';
          }
        } else {
          h += '<div class="lc-value"><span>未挑戦</span></div>';
        }
        h += '</div></div>';

        h += '<div class="learn-card" onclick="MP.goSub(\'recent\')">';
        h += '<div class="lc-icon lc-icon-recent">👁️</div>';
        h += '<div><div class="lc-label">最近見た</div>';
        h += '<div class="lc-value">' + rc + '<span> 件</span></div></div></div>';

        h += '</div>';

        /* 稽古メニュー */
        h += '<div class="mp-section-title">🥋 稽古メニュー</div>';
        h += '<div class="practice-intro">歌舞伎の掛け声や名台詞を声に出して体験してみよう。聴くだけでは分からない歌舞伎の醍醐味がここにあります。</div>';
        h += '<div class="practice-list">';
        h += '<a href="/training/kakegoe" class="practice-item">';
        h += '<span class="pi-icon">📣</span>';
        h += '<div class="pi-text"><div class="pi-title">大向う道場</div>';
        h += '<div class="pi-desc">リズムに合わせて掛け声を練習</div></div>';
        h += '<span class="pi-arrow">→</span></a>';
        h += '<a href="/training/serifu" class="practice-item">';
        h += '<span class="pi-icon">🎤</span>';
        h += '<div class="pi-text"><div class="pi-title">台詞稽古チャレンジ</div>';
        h += '<div class="pi-desc">名台詞をカラオケ風に練習</div></div>';
        h += '<span class="pi-arrow">→</span></a>';
        h += '</div>';

        /* データ管理 */
        h += '<div class="mp-section-title">💾 データ管理</div>';
        h += '<div style="display:flex;gap:8px;">';
        h += '<button class="mp-btn" onclick="MP.exportData()" style="flex:1;">📤 エクスポート</button>';
        h += '<button class="mp-btn" onclick="MP.importData()" style="flex:1;">📥 インポート</button>';
        h += '</div>';
        h += '<input type="file" id="kl-import-file" accept=".json" style="display:none;" onchange="MP.doImport(event)">';

        h += '</div>';

        app.innerHTML = h;
        bindFormEvents();

        /* 推しプロフィールを名鑑データでリッチ化 */
        enrichOshiProfiles();

        /* 推しニュース非同期読込 */
        loadOshiNews();
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
        h += '<button class="log-filter-btn' + (logFilter === "all" ? " log-filter-active" : "") + '" onclick="MP.setLogFilter(\'all\')">全て <span style="font-size:11px;">(' + tlog.entries.length + ')</span></button>';
        h += '<button class="log-filter-btn' + (logFilter === "theater" ? " log-filter-active" : "") + '" onclick="MP.setLogFilter(\'theater\')">🏛️ 劇場 <span style="font-size:11px;">(' + theaterEntries.length + ')</span></button>';
        h += '<button class="log-filter-btn' + (logFilter === "media" ? " log-filter-active" : "") + '" onclick="MP.setLogFilter(\'media\')">📺 映像 <span style="font-size:11px;">(' + mediaEntries.length + ')</span></button>';
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
              return eid ? '<a href="/enmoku/' + esc(eid) + '" class="tl-entry-play-link">' + esc(pt) + '</a>' : esc(pt);
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
                    h += '<div class="tl-entry-cast-play"><a href="/enmoku/' + esc(gEnmokuId) + '" class="tl-cast-play-link">' + esc(gKey) + '</a></div>';
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
                    pair = '<span class="tl-cast-role">' + esc(role) + '</span> <a href="/enmoku/' + esc(gEnmokuId) + '#cast-' + esc(charId) + '" class="tl-cast-linked">' + esc(gActors[pi].actor) + '</a>';
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
            h += '</div>'; /* tl-entry-detail */

            h += '<button class="tl-entry-toggle" onclick="MP.toggleDetail(\'' + e.id + '\',this)">▼ 詳細</button>';
          }

          /* "..."メニュー */
          h += '<div class="tl-entry-actions">';
          h += '<div class="tl-entry-more-menu">';
          h += '<button class="tl-entry-more-btn" onclick="MP.toggleMenu(\'' + e.id + '\')">⋯</button>';
          h += '<div class="tl-entry-dropdown" id="menu-' + e.id + '">';
          h += '<button class="tl-drop-danger" onclick="MP.deleteEntry(\'' + e.id + '\')">削除</button>';
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
            h += '<button class="fav-actor-remove" onclick="MP.removeFavOshi(\'' + esc(favList[fi]).replace(/'/g, "\\'") + '\')">解除</button>';
            h += '</div>';
          }
        }
        h += '</div>';
        h += '</div>';

        /* ── 俳優を追加 ── */
        h += '<div class="mp-section">';
        h += '<div class="mp-section-title">🔍 俳優を検索して追加</div>';
        h += '<input type="text" class="fav-search-input" id="fav-search" placeholder="名前・屋号で検索" oninput="MP.filterActors()">';
        h += '<div id="fav-search-results" class="fav-search-results"></div>';
        h += '</div>';

        /* ── 屋号から選ぶ ── */
        h += '<div class="mp-section">';
        h += '<div class="mp-section-title">🏠 屋号から選ぶ</div>';
        h += '<div id="yago-tabs" class="yago-tabs"><div class="mp-empty" style="padding:0.5rem;font-size:0.82rem;">読み込み中…</div></div>';
        h += '<div id="yago-actor-list" class="yago-actor-list"></div>';
        h += '</div>';

        /* ── 推しニュース ── */
        if (favList.length > 0) {
          h += '<div class="mp-section">';
          h += '<div class="mp-section-title">📰 推しニュース</div>';
          h += '<div id="oshi-tab-news"><div class="mp-empty" style="padding:0.5rem;">ニュースを読み込み中…</div></div>';
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
            h += '<button class="tl-fav-star' + (isFav ? ' tl-fav-active' : '') + '" onclick="MP.toggleFav(\'' + esc(rName).replace(/'/g, "\\'") + '\')" title="推し登録">' + (isFav ? '★' : '☆') + '</button>';
            h += '<span class="tl-actor-rank-pos">' + (ri + 1) + '</span>';
            h += '<span class="tl-actor-rank-name">' + esc(rName) + '<span class="tl-actor-yago" id="yago-' + ri + '"></span></span>';
            h += '<span class="tl-actor-rank-count">' + rCount + '回</span>';
            h += '</div>';
          }
          h += '</div>';
          h += '</div>';
        }

        app.innerHTML = h;

        /* 名鑑データロード → 登録済みリッチ化 + 屋号タブ + ニュース */
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
              ph += '<button class="fav-actor-remove" onclick="MP.removeFavOshi(\'' + esc(name).replace(/'/g, "\\'") + '\')">解除</button>';
              ph += '</div>';
            }
            regArea.innerHTML = ph;
          }
          /* 屋号タブ */
          renderYagoTabs(meikan);
          renderYagoActors(meikan, favYagoFilter);
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
            nh += '<div style="text-align:right;margin-top:0.3rem;"><a href="/news" class="oshi-news-more">すべてのニュースを見る →</a></div>';
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

      /* =====================================================
         推しプロフィール リッチ化
      ===================================================== */
      function findMeikanInfo(meikan, name) {
        if (!meikan) return null;
        for (var j = 0; j < meikan.length; j++) {
          var nk = meikan[j].name_kanji.replace(/\s+/g, "");
          if (nk === name || nk === name.replace(/\s+/g, "")) return meikan[j];
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
          var top = matched.slice(0, 5);
          var nh = '<div class="mp-section-title">📰 推しニュース</div>';
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
          nh += '<div style="text-align:right;margin-top:0.3rem;"><a href="/news" class="oshi-news-more">すべてのニュースを見る →</a></div>';
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
            nh += '<div style="text-align:right;margin-top:0.3rem;"><a href="/news" class="oshi-news-more">すべてのニュースを見る →</a></div>';
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
        h += '<div class="tl-form-title"><span>🎭 観劇を記録</span><button class="tl-form-close" onclick="MP.closeForm()">✕</button></div>';

        /* Step 0: 視聴方法 */
        h += '<div class="tl-step">';
        h += '<div class="tl-step-label">視聴方法';
        if (formState.viewing_type) h += '<span class="tl-step-check">✓</span>';
        h += '</div>';
        h += '<div class="tl-chips">';
        for (var mi = 0; mi < MEDIA_TYPES.length; mi++) {
          var mcls = formState.viewing_type === MEDIA_TYPES[mi].id ? " tl-chip-active" : "";
          h += '<button class="tl-chip' + mcls + '" onclick="MP.setViewingType(\'' + MEDIA_TYPES[mi].id + '\')">' + MEDIA_TYPES[mi].icon + ' ' + MEDIA_TYPES[mi].label + '</button>';
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
            h += '<button class="tl-chip' + rvc + '" onclick="MP.setVenue(\'' + recentVenues[rv].id + '\',\'' + esc(recentVenues[rv].name) + '\')">' + esc(recentVenues[rv].name) + '</button>';
          }
          h += '</div>';
        }

        /* 大歌舞伎 */
        h += '<div class="tl-chip-group-label">大歌舞伎</div>';
        h += '<div class="tl-chips">';
        for (var vi = 0; vi < VENUES.length; vi++) {
          if (VENUES[vi].group !== "大歌舞伎") continue;
          var cls = formState.venue_id === VENUES[vi].id ? " tl-chip-active" : "";
          h += '<button class="tl-chip' + cls + '" onclick="MP.setVenue(\'' + VENUES[vi].id + '\',\'' + esc(VENUES[vi].name) + '\')">' + esc(VENUES[vi].name) + '</button>';
        }
        h += '</div>';

        /* 地歌舞伎 */
        h += '<div class="tl-chip-group-label">地歌舞伎</div>';
        h += '<div class="tl-chips">';
        for (var vi = 0; vi < VENUES.length; vi++) {
          if (VENUES[vi].group !== "地歌舞伎") continue;
          var cls = formState.venue_id === VENUES[vi].id ? " tl-chip-active" : "";
          h += '<button class="tl-chip' + cls + '" onclick="MP.setVenue(\'' + VENUES[vi].id + '\',\'' + esc(VENUES[vi].name) + '\')">' + esc(VENUES[vi].name) + '</button>';
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
                h += '<span class="tl-play-check-label">' + esc(playTitle) + (playScenes ? ' <span style="font-size:0.78rem;color:#888;">（' + esc(playScenes) + '）</span>' : '') + '</span>';
                if (playCast.length > 0) {
                  var actorNames = [];
                  for (var ak = 0; ak < Math.min(playCast.length, 5); ak++) actorNames.push(playCast[ak].actor);
                  var actorStr = actorNames.join('　');
                  if (playCast.length > 5) actorStr += ' 他';
                  h += '<span class="tl-play-check-actors">' + esc(actorStr) + '</span>';
                }
                h += '</div>';
                h += '<input type="checkbox" style="display:none;" ' + (checked ? "checked" : "") + ' onchange="MP.togglePlay(\'' + esc(playTitle).replace(/'/g,"\\'") + '\')">';
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
            h += '<button class="tl-chip' + scls + '" onclick="MP.setSeat(\'' + SEAT_TYPES[si].id + '\')">' + SEAT_TYPES[si].label + '</button>';
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
        }

        /* 保存ボタン */
        var canSave = formState.date && formState.venue_id;
        h += '<div class="tl-save-row">';
        h += '<button class="tl-save-btn" onclick="MP.saveEntry()"' + (canSave ? '' : ' disabled') + '>🎭 記録する</button>';
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

        /* 保存ボタン */
        var canSave = formState.date && formState.media_title;
        h += '<div class="tl-save-row">';
        h += '<button class="tl-save-btn" onclick="MP.saveMediaEntry()"' + (canSave ? '' : ' disabled') + '>' + mediaIcon(vt) + ' 記録する</button>';
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
          console.log("[歌舞伎ログ] 全公演:", allPerfs.length, "件, 日付:", formState.date, "会場:", formState.venue_name);
          var matched = matchPerformances(allPerfs, formState.date, formState.venue_name);
          console.log("[歌舞伎ログ] マッチ:", matched.length, "件");
          matched.forEach(function(p){ console.log("  →", p.title, "programs:", p.programs ? p.programs.length : 0); });
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
            ph += '<div class="tl-perf-card' + active + '" onclick="MP.setPerf(\'' + esc(p.title).replace(/'/g,"\\'") + '\')">';
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
        h += '<button class="mp-tab' + (clipTab==="enmoku" ? " mp-tab-active" : "") + '" onclick="MP.goClip(\'enmoku\')">📜 演目（' + log.clips.enmoku.length + '）</button>';
        h += '<button class="mp-tab' + (clipTab==="person" ? " mp-tab-active" : "") + '" onclick="MP.goClip(\'person\')">🎭 人物（' + log.clips.person.length + '）</button>';
        h += '<button class="mp-tab' + (clipTab==="term" ? " mp-tab-active" : "") + '" onclick="MP.goClip(\'term\')">📖 用語（' + log.clips.term.length + '）</button>';
        h += '</div>';
        var items = [];
        if (clipTab === "enmoku") {
          items = log.clips.enmoku.map(function(id) {
            return { id: id, title: id, link: "/enmoku/" + encodeURIComponent(id), type: "enmoku" };
          });
        } else if (clipTab === "person") {
          items = log.clips.person.map(function(p) {
            var pid = typeof p === "string" ? p : p.id;
            var parent = typeof p === "object" ? p.parent : "";
            var title = (typeof p === "object" && p.title) ? p.title : pid;
            var link = parent ? "/enmoku/" + encodeURIComponent(parent) + "#cast-" + encodeURIComponent(pid) : "#";
            return { id: pid, title: title, link: link, type: "person" };
          });
        } else {
          items = log.clips.term.map(function(id) {
            return { id: id, title: id, link: "/glossary/" + encodeURIComponent(id), type: "term" };
          });
        }
        if (items.length === 0) {
          h += '<div class="mp-empty">' + typeName(clipTab) + 'のクリップはまだないよ🙂</div>';
        } else {
          for (var i = 0; i < items.length; i++) {
            var it = items[i];
            h += '<div class="mp-item">';
            h += '<span class="mp-item-icon">' + typeIcon(it.type) + '</span>';
            h += '<a href="' + it.link + '" style="flex:1; min-width:0; text-decoration:none; color:var(--shiro);">';
            h += '<div class="mp-item-title">' + esc(it.title) + '</div></a>';
            h += '<button class="mp-btn mp-btn-danger" style="padding:0.3rem 0.6rem; font-size:0.7rem;" onclick="MP.removeClip(\'' + clipTab + '\',\'' + esc(it.id) + '\')">解除</button>';
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
          h += '<div class="mp-actions"><a href="/quiz" class="mp-btn mp-btn-primary">クイズに挑戦</a></div>';
        } else {
          h += '<div style="padding:0.8rem 1rem; background:var(--surface); border-radius:10px; border:1px solid #333; margin-bottom:1rem;">';
          h += '<div style="font-size:0.88rem; color:var(--shiro); margin-bottom:0.5rem;">📊 成績</div>';
          h += '<div style="font-size:1.1rem; color:var(--kin); font-weight:bold;">' + quizState.correct_total + ' / ' + quizState.answered_total + ' 問正解</div>';
          var title = calcTitle(quizState.correct_total, 100);
          h += '<div style="font-size:0.82rem; color:#999; margin-top:0.3rem;">称号：' + title + '</div>';
          if (wc > 0) {
            h += '<div style="font-size:0.88rem; color:var(--aka); margin-top:0.5rem;">間違えた問題：' + wc + '問</div>';
          }
          h += '</div>';
          h += '<div class="mp-actions">';
          if (wc > 0) h += '<a href="/quiz" class="mp-btn mp-btn-primary">復習する（' + wc + '問）</a>';
          h += '<a href="/quiz" class="mp-btn">クイズを続ける</a>';
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

        /* 名前検索 */
        h += '<div class="mp-section">';
        h += '<div class="mp-section-title">🔍 俳優を検索して追加</div>';
        h += '<input type="text" class="fav-search-input" id="fav-search" placeholder="名前・屋号で検索" oninput="MP.filterActors()">';
        h += '<div id="fav-search-results" class="fav-search-results"></div>';
        h += '</div>';

        /* 屋号別 俳優一覧 */
        h += '<div class="mp-section">';
        h += '<div class="mp-section-title">🏠 屋号から選ぶ</div>';
        h += '<div id="yago-tabs" class="yago-tabs"><div class="mp-empty" style="padding:0.5rem;font-size:0.82rem;">読み込み中…</div></div>';
        h += '<div id="yago-actor-list" class="yago-actor-list"></div>';
        h += '</div>';

        h += '</div>'; /* fav-modal-body */
        h += '</div>'; /* fav-modal */
        h += '</div>'; /* fav-modal-overlay */

        document.body.insertAdjacentHTML('beforeend', h);
        document.body.style.overflow = 'hidden';

        /* 名鑑データ読み込み → 登録済み＋屋号一覧を描画 */
        loadActorMeikan(function(meikan) {
          renderFavRegistered(favList, meikan);
          renderYagoTabs(meikan);
          renderYagoActors(meikan, '');
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

        var th = '<button class="yago-tab' + (favYagoFilter === '' ? ' yago-tab-active' : '') + '" onclick="MP.selectYago(\'\')">すべて <span class="yago-tab-count">' + meikan.length + '</span></button>';
        for (var k = 0; k < yagoKeys.length; k++) {
          var yName = yagoKeys[k];
          var isActive = favYagoFilter === yName;
          th += '<button class="yago-tab' + (isActive ? ' yago-tab-active' : '') + '" onclick="MP.selectYago(\'' + esc(yName).replace(/'/g, "\\'") + '\')">' + esc(yName) + ' <span class="yago-tab-count">' + yagoMap[yName] + '</span></button>';
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
          var nk = a.name_kanji.replace(/s+/g, '');
          var isFav = favList.indexOf(nk) >= 0;
          ph += '<div class="fav-actor-card' + (isFav ? ' fav-actor-selected' : '') + '" onclick="MP.toggleFavMeikan(\'' + esc(nk).replace(/'/g, "\\'") + '\')">';
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
              var nk = meikan[j].name_kanji.replace(/s+/g, "");
              if (nk === name || nk === name.replace(/s+/g, "")) { info = meikan[j]; break; }
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
          ph += '<button class="fav-actor-remove" onclick="MP.removeFav(\'' + esc(name).replace(/'/g, "\\'") + '\')">解除</button>';
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
            var nk = a.name_kanji.replace(/s+/g, "");
            var nameMatch = nk.indexOf(q) >= 0 || a.name_kana.indexOf(q) >= 0 || a.name_kana.replace(/s+/g, "").indexOf(q) >= 0;
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
            var nk = a.name_kanji.replace(/s+/g, "");
            var isFav = favList.indexOf(nk) >= 0;
            ph += '<div class="fav-actor-card' + (isFav ? ' fav-actor-selected' : '') + '" onclick="MP.toggleFavMeikan(\'' + esc(nk).replace(/'/g, "\\'") + '\')">';
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
        switchTab: function(tab) { currentView = tab; subView = null; formOpen = false; render(); window.scrollTo(0,0); },
        go: function(view) { subView = view; formOpen = false; render(); window.scrollTo(0,0); },
        goSub: function(view) { subView = view; render(); window.scrollTo(0,0); },
        goClip: function(tab) { clipTab = tab; subView = "clips"; render(); window.scrollTo(0,0); },
        setLogFilter: function(f) { logFilter = f; render(); },
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
        selectYago: selectYago,
        searchOshiNews: searchOshiNews,
        searchOshiNewsHome: searchOshiNewsHome,
        openFavModal: openFavModal,
        closeFavModal: function(e) { closeFavModal(e); },

        /* フォーム */
        openForm: function() { resetForm(); formOpen = true; render(); },
        closeForm: function() { formOpen = false; render(); },
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

          addEntry({
            viewing_type: formState.viewing_type,
            date: formState.date,
            media_title: formState.media_title,
            play_titles: formState.media_plays.slice(),
            actors_text: formState.media_actors_text,
            memo: formState.memo || ""
          });
          formOpen = false;
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

          addEntry({
            viewing_type: "theater",
            date: formState.date,
            venue_id: formState.venue_id,
            venue_name: formState.venue_name,
            seat_type: formState.seat_type || "NA",
            performance_title: formState.performance_title || "",
            play_titles: formState.play_titles.slice(),
            play_scenes: playSceneMap,
            actors: actors,
            memo: formState.memo || ""
          });
          formOpen = false;
          render();
          window.scrollTo(0, 0);
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

      /* ドロップダウンメニューの外側クリックで閉じる */
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.tl-entry-more-menu')) {
          var allMenus = document.querySelectorAll('.tl-entry-dropdown');
          for (var mi = 0; mi < allMenus.length; mi++) allMenus[mi].classList.remove('tl-dropdown-open');
        }
      });
    })();
    
