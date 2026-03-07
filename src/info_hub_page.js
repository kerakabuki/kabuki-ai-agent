// src/info_hub_page.js
// =========================================================
// INFO ハブ — 地歌舞伎・地芝居の入口
// 構成：Hero / A:お気に入り次回公演 / B:全国団体 / C:説明 / D:掲載申請
// =========================================================
import { pageShell } from "./web_layout.js";

export function infoHubPageHTML({} = {}) {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><span>INFO</span>
    </div>

    <!-- Hero -->
    <section class="info-hero fade-up">
      <p class="info-hero-lead">全国の団体を探す／お気に入りで追う</p>
    </section>

    <!-- NEWSブリーフ帯 -->
    <div class="brief-strip fade-up" id="brief-strip">
      <div class="brief-header">
        <span class="brief-label">📰 最新の地歌舞伎情報</span>
        <div class="brief-meta-right">
          <span class="brief-new-badge" id="brief-new-count" style="display:none"></span>
          <span class="brief-updated" id="brief-updated"></span>
          <button class="brief-reload-btn" id="brief-reload-btn" title="更新する">↻</button>
          <a href="/jikabuki/info/news" class="brief-all-link">一覧 →</a>
        </div>
      </div>
      <div id="brief-list"><span class="brief-loading">読み込み中…</span></div>
    </div>

    <!-- A: お気に入り団体の次回公演 -->
    <section class="info-card fade-up" id="card-a">
      <div class="info-card-header">
        <span class="info-card-icon">⭐</span>
        <div>
          <div class="info-card-title">お気に入り団体の次回公演</div>
          <div class="info-card-count">最大6件</div>
        </div>
      </div>
      <div id="fav-perf-list">
        <!-- JS で描画 -->
        <div class="info-fav-empty">
          <p>☆ でお気に入り登録すると、次回公演がここに表示されます</p>
          <a href="/jikabuki/info/groups" class="info-cta-link">団体一覧から登録する →</a>
        </div>
      </div>
      <div id="fav-news-items"></div>
      <div id="fav-list" class="info-fav-list info-fav-list-footer">
        <!-- お気に入りタグ一覧（JS で描画） -->
      </div>
      <a href="/jikabuki/info/groups" class="info-card-link" style="margin-top:0.5rem;display:inline-block;">☆ お気に入り団体を登録・変更する →</a>
    </section>

    <!-- B: 全国の地歌舞伎・地芝居団体 -->
    <section class="info-card fade-up" id="info-groups-card">
      <div class="info-card-header">
        <span class="info-card-icon">🏯</span>
        <div>
          <div class="info-card-title">全国の地歌舞伎・地芝居団体</div>
          <div class="info-card-count" id="groups-count">読み込み中…</div>
        </div>
      </div>
      <div id="pick-group"></div>
      <a href="/jikabuki/info/groups" class="info-card-link">団体一覧を見る →</a>
    </section>

    <!-- B2: 全国の芝居小屋 -->
    <section class="info-card fade-up" id="info-theaters-card">
      <div class="info-card-header">
        <span class="info-card-icon">🏛️</span>
        <div>
          <div class="info-card-title">全国の芝居小屋</div>
          <div class="info-card-count" id="theaters-count">読み込み中…</div>
        </div>
      </div>
      <div id="pick-theater"></div>
      <a href="/jikabuki/info/theaters" class="info-card-link">芝居小屋一覧を見る →</a>
    </section>

    <!-- C: 地歌舞伎・地芝居とは？ -->
    <section class="info-card fade-up" id="info-about">
      <div class="info-card-header">
        <span class="info-card-icon">📘</span>
        <div>
          <div class="info-card-title">地歌舞伎・地芝居とは？</div>
        </div>
      </div>
      <p class="info-about-lead">地域に根ざして受け継がれてきた芝居文化の総称です。</p>
      <details class="info-about-details">
        <summary>もう少し詳しく</summary>
        <div class="info-about-body">
          <p>
            地芝居（じしばい）は、地元の人々が演じる芝居の総称です。
            歌舞伎だけでなく、文楽や能狂言、獅子芝居なども含まれます。
            その中でも歌舞伎を演じる団体を「地歌舞伎」と呼ぶことが多く、
            岐阜県などでは特にこの言い方が広まっています。
          </p>
          <p style="margin-top:0.6rem;">
            <strong>地歌舞伎の面白さ</strong><br>
            振付・化粧・衣裳・道具・舞台づくりまで、地域の仲間でまるごと作りあげるところにあります。
            観客も大向こう（かけ声）やおひねりで積極的に参加し、会場全体が一体になります。
          </p>
          <p style="margin-top:0.6rem;">
            <strong>大歌舞伎との違い</strong><br>
            大歌舞伎は専門の役者・劇場を中心に発展してきたのに対して、地歌舞伎は地域の人々が担い手です。
            プロではないからこその温かさと一体感が、地歌舞伎ならではの魅力です。
          </p>
          <p style="margin-top:0.6rem;color:var(--text-muted);font-size:0.88rem;">
            INFOではまず、全国の団体名一覧から「近くにどんな団体があるか」を探せる入口を用意しています。
          </p>
        </div>
      </details>
    </section>

    <!-- D: 団体の方へ（掲載申請）常設 -->
    <section class="info-card info-notice fade-up">
      <p class="info-notice-title">団体の方へ</p>
      <p class="info-notice-text">
        公式サイト・SNS・次回公演情報の掲載を希望される団体の方はご連絡ください。
      </p>
      <a href="/jikabuki/base/onboarding" class="info-notice-btn">
        団体登録を申請する →
      </a>
    </section>

    <script>
    (function() {
      /* ── ユーティリティ ── */
      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

      /* 日付パーサー：和暦／西暦／ISO どれも対応 */
      function parseJpDate(str) {
        if (!str) return null;
        var m;
        m = str.match(/令和\\s*(\\d+)\\s*年\\s*(\\d+)\\s*月\\s*(\\d+)\\s*日/);
        if (m) return new Date(2018 + parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/平成\\s*(\\d+)\\s*年\\s*(\\d+)\\s*月\\s*(\\d+)\\s*日/);
        if (m) return new Date(1988 + parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/昭和\\s*(\\d+)\\s*年\\s*(\\d+)\\s*月\\s*(\\d+)\\s*日/);
        if (m) return new Date(1925 + parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/(\\d{4})\\s*年\\s*(\\d+)\\s*月\\s*(\\d+)\\s*日/);
        if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        m = str.match(/(\\d{4})-(\\d{1,2})-(\\d{1,2})/);
        if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        return null;
      }

      function countdown(dateStr) {
        var target = parseJpDate(dateStr);
        if (!target) return null;
        var now = new Date(); now.setHours(0,0,0,0);
        var diff = Math.ceil((target - now) / 86400000);
        if (diff > 0)  return { label: '公演まであと ' + diff + ' 日', cls: 'badge-upcoming' };
        if (diff === 0) return { label: '本日開演！', cls: 'badge-today' };
        return { label: '公演終了（次回準備中）', cls: 'badge-ended' };
      }

      /* ── グループID マッピング（GATE参加団体のみ） ── */
      var GROUP_ID_MAP = {
        '気良歌舞伎保存会': 'kera',
        '気良歌舞伎':       'kera',
      };

      /* ── A: お気に入り団体の次回公演 ── */
      var favs = [];
      try { favs = JSON.parse(localStorage.getItem('jikabuki_fav_groups') || '[]'); } catch(e) {}

      var perfList = document.getElementById('fav-perf-list');

      /* お気に入りタグ一覧 */
      var favListEl = document.getElementById('fav-list');
      if (favs.length > 0 && favListEl) {
        var shown = favs.slice(0, 10);
        favListEl.innerHTML = shown.map(function(name) {
          return '<a href="/jikabuki/info/groups?q=' + encodeURIComponent(name) + '" class="info-fav-item">★ ' + esc(name) + '</a>';
        }).join('');
        if (favs.length > 10) {
          favListEl.innerHTML += '<a href="/jikabuki/info/groups" class="info-fav-more">…ほか ' + (favs.length - 10) + ' 件</a>';
        }
      }

      if (favs.length === 0) {
        /* 空状態はデフォルトHTML のまま */
      } else {
        /* 最大6件 */
        var targets = favs.slice(0, 6);

        /* GROUP_ID_MAP にある団体のデータを並列取得 */
        var fetchMap = {};
        targets.forEach(function(name) {
          var gid = GROUP_ID_MAP[name];
          if (gid && !fetchMap[gid]) {
            fetchMap[gid] = fetch('/api/groups/' + gid, { credentials: 'same-origin' })
              .then(function(r) { return r.json(); })
              .catch(function() { return null; });
          }
        });

        Promise.all(
          Object.keys(fetchMap).map(function(gid) {
            return fetchMap[gid].then(function(data) { return { gid: gid, data: data }; });
          })
        ).then(function(results) {
          /* gid → group data のマップ */
          var dataByGid = {};
          results.forEach(function(r) { if (r.data) dataByGid[r.gid] = r.data; });

          var rows = targets.map(function(name) {
            var gid = GROUP_ID_MAP[name];
            var gdata = gid ? dataByGid[gid] : null;
            var np = gdata && gdata.next_performance;

            if (np && np.date) {
              /* 状態1：次回公演情報あり */
              var cd = countdown(np.date);
              var badge = cd ? '<span class="perf-badge ' + cd.cls + '">' + esc(cd.label) + '</span>' : '';
              var detailHref = np.url || '/jikabuki/gate/kera/performance';
              return '<a href="' + esc(detailHref) + '" class="perf-card perf-card-active">'
                + '<div class="perf-card-top">'
                +   '<span class="perf-card-name">🎭 ' + esc(name) + '</span>'
                +   badge
                + '</div>'
                + '<div class="perf-card-info">'
                +   '<span class="perf-card-date">📅 ' + esc(np.date) + '</span>'
                +   (np.venue ? '<span class="perf-card-venue">📍 ' + esc(np.venue) + '</span>' : '')
                +   (np.title ? '<span class="perf-card-title-text">🎬 ' + esc(np.title) + '</span>' : '')
                + '</div>'
                + '<span class="perf-card-arrow">詳細 →</span>'
                + '</a>';
            } else {
              /* 状態2：次回公演情報なし */
              return '<div class="perf-card perf-card-unknown">'
                + '<div class="perf-card-top">'
                +   '<span class="perf-card-name">🎭 ' + esc(name) + '</span>'
                +   '<span class="perf-badge badge-unknown">情報募集中</span>'
                + '</div>'
                + '<div class="perf-card-info">'
                +   '<span class="perf-card-na">次回公演情報は未登録です</span>'
                + '</div>'
                + '</div>';
            }
          });

          perfList.innerHTML = rows.join('');
        }).catch(function() {
          var rows = targets.map(function(name) {
            return '<div class="perf-card perf-card-unknown">'
              + '<div class="perf-card-top">'
              +   '<span class="perf-card-name">🎭 ' + esc(name) + '</span>'
              +   '<span class="perf-badge badge-unknown">情報募集中</span>'
              + '</div>'
              + '<div class="perf-card-info"><span class="perf-card-na">次回公演情報は未登録です</span></div>'
              + '</div>';
          });
          perfList.innerHTML = rows.join('');
        });
      }

      /* ── NEWSブリーフ帯 ── */
      var LS_LAST_VISIT = 'info_last_visit';

      function renderBrief(articles, updatedAt) {
        var listEl      = document.getElementById('brief-list');
        var updatedEl   = document.getElementById('brief-updated');
        var newCountEl  = document.getElementById('brief-new-count');
        if (!listEl) return;

        /* 前回閲覧時刻を取得してから更新 */
        var lastVisit = 0;
        try { lastVisit = parseInt(localStorage.getItem(LS_LAST_VISIT) || '0', 10); } catch(e) {}
        try { localStorage.setItem(LS_LAST_VISIT, Date.now().toString()); } catch(e) {}

        /* 新着件数（前回閲覧より新しい記事） */
        var newCount = articles.filter(function(a) { return (a.pubTs || 0) > lastVisit; }).length;
        if (newCountEl) {
          if (newCount > 0 && lastVisit > 0) {
            newCountEl.textContent = '新着 ' + newCount + ' 件';
            newCountEl.style.display = '';
          } else {
            newCountEl.style.display = 'none';
          }
        }

        /* 更新時刻 */
        if (updatedEl && updatedAt) {
          var du = new Date(updatedAt);
          updatedEl.textContent = '更新 ' + ('0'+du.getHours()).slice(-2) + ':' + ('0'+du.getMinutes()).slice(-2);
        }

        /* 最新5件を描画 */
        var top3 = articles.slice(0, 5);
        if (!top3.length) {
          listEl.innerHTML = '<span class="brief-empty">ニュースを取得中…</span>';
          return;
        }
        listEl.innerHTML = top3.map(function(a) {
          var d = a.pubTs ? new Date(a.pubTs) : null;
          var date = d ? d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate() : '';
          var src  = a.source || '';
          return '<a href="' + esc(a.link||'#') + '" target="_blank" rel="noopener" class="brief-item">'
            + '<span class="brief-item-title">' + esc(a.title||'') + '</span>'
            + '<span class="brief-item-sub">' + (date ? esc(date) : '') + (src ? '　' + esc(src) : '') + '</span>'
            + '</a>';
        }).join('');
      }

      /* お気に入り団体ニュース（タイトル直接マッチ） */
      function renderFavNews(articles) {
        var newsEl = document.getElementById('fav-news-items');
        if (!newsEl || !favs.length) return;

        var sortedFavs = favs.slice(0, 10).sort(function(a, b) { return b.length - a.length; });
        var rows = [];
        sortedFavs.forEach(function(name) {
          articles.filter(function(a) {
            return (a.title || '').indexOf(name) !== -1;
          }).slice(0, 2).forEach(function(a) {
            rows.push({ group: name, article: a });
          });
        });
        rows.sort(function(a, b) { return (b.article.pubTs || 0) - (a.article.pubTs || 0); });
        rows = rows.slice(0, 10);

        if (!rows.length) {
          newsEl.innerHTML = '<p class="fav-news-empty">お気に入り団体の直近ニュースは見つかりませんでした</p>';
          return;
        }
        newsEl.innerHTML = rows.map(function(r) {
          var d = r.article.pubTs ? new Date(r.article.pubTs) : null;
          var pub = d ? d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate() : '';
          return '<a href="' + esc(r.article.link||'#') + '" target="_blank" rel="noopener" class="fav-news-row">'
            + '<span class="fav-news-tag">' + esc(r.group) + '</span>'
            + '<span class="fav-news-title">' + esc(r.article.title||'') + '</span>'
            + (pub ? '<span class="fav-news-date">' + pub + '</span>' : '')
            + '</a>';
        }).join('');
      }

      function loadBrief() {
        var listEl = document.getElementById('brief-list');
        if (listEl) listEl.innerHTML = '<span class="brief-loading">読み込み中…</span>';
        fetch('/api/news?feedKey=jikabuki')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var articles = data.articles || [];
            renderBrief(articles, data.updatedAt);
            renderFavNews(articles);
          })
          .catch(function() {
            var el = document.getElementById('brief-list');
            if (el) el.innerHTML = '<span class="brief-empty">取得に失敗しました</span>';
          });
      }

      loadBrief();

      var reloadBtn = document.getElementById('brief-reload-btn');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', function() {
          this.style.opacity = '0.4';
          var btn = this;
          loadBrief();
          setTimeout(function() { btn.style.opacity = ''; }, 800);
        });
      }

      /* ── 日替わりインデックス（日付シード） ── */
      function dailyIndex(len, offset) {
        if (len <= 0) return 0;
        var d = new Date();
        var seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() + (offset || 0);
        return seed % len;
      }

      /* ── B: 団体数 + 今日のご紹介 ── */
      fetch('/api/jikabuki/groups')
        .then(function(r) { return r.json(); })
        .then(function(d) {
          var groups = d.groups || [];
          var el = document.getElementById('groups-count');
          if (el) el.textContent = (d.count || groups.length) + ' 団体';

          if (groups.length === 0) return;
          var pick = groups[dailyIndex(groups.length, 0)];
          var pickEl = document.getElementById('pick-group');
          if (!pickEl) return;

          var sns = '';
          var links = pick.links || {};
          if (links.website)   sns += '<a href="' + esc(links.website)   + '" target="_blank" rel="noopener" class="pick-sns">🌐</a>';
          if (links.youtube)   sns += '<a href="' + esc(links.youtube)   + '" target="_blank" rel="noopener" class="pick-sns">▶️</a>';
          if (links.x)         sns += '<a href="' + esc(links.x)         + '" target="_blank" rel="noopener" class="pick-sns">𝕏</a>';
          if (links.instagram) sns += '<a href="' + esc(links.instagram) + '" target="_blank" rel="noopener" class="pick-sns">📷</a>';
          if (links.facebook)  sns += '<a href="' + esc(links.facebook)  + '" target="_blank" rel="noopener" class="pick-sns">f</a>';

          var gateLink = pick.gate_id
            ? '<a href="/jikabuki/gate/' + esc(pick.gate_id) + '" class="pick-gate">🏮 GATE →</a>'
            : '';

          pickEl.innerHTML = '<div class="pick-section">'
            + '<span class="pick-label">🎲 今日のご紹介</span>'
            + '<a href="/jikabuki/info/groups?q=' + encodeURIComponent(pick.name) + '" class="pick-card">'
            +   '<div class="pick-name">' + esc(pick.name) + '</div>'
            +   '<div class="pick-meta">'
            +     (pick.prefecture ? '<span>📍 ' + esc(pick.prefecture) + '</span>' : '')
            +     (pick.venue ? '<span>🏛 ' + esc(pick.venue) + '</span>' : '')
            +   '</div>'
            + '</a>'
            + (sns || gateLink ? '<div class="pick-links">' + sns + gateLink + '</div>' : '')
            + '</div>';
        })
        .catch(function() {});

      /* ── B2: 芝居小屋数 + 今日のご紹介 ── */
      fetch('/api/jikabuki/theaters')
        .then(function(r) { return r.json(); })
        .then(function(d) {
          var theaters = d.theaters || [];
          var el = document.getElementById('theaters-count');
          if (el) el.textContent = theaters.length + ' 件';

          if (theaters.length === 0) return;
          var pick = theaters[dailyIndex(theaters.length, 7)];
          var pickEl = document.getElementById('pick-theater');
          if (!pickEl) return;

          var badges = [];
          if (pick.cultural_property) badges.push(esc(pick.cultural_property));
          if (pick.has_hanamichi) badges.push('花道');
          if (pick.has_mawari_butai) badges.push('回り舞台');
          if (pick.capacity) badges.push('収容 ' + pick.capacity + ' 名');

          var photo = pick.photo_url
            ? '<div class="pick-photo"><img src="' + esc(pick.photo_url) + '" alt="' + esc(pick.name) + '" loading="lazy"></div>'
            : '';

          var gateLink = pick.gate_group_id
            ? '<a href="/jikabuki/gate/' + esc(pick.gate_group_id) + '" class="pick-gate">🏮 GATE →</a>'
            : '';

          pickEl.innerHTML = '<div class="pick-section">'
            + '<span class="pick-label">🎲 今日のご紹介</span>'
            + '<div class="pick-card pick-card-theater">'
            +   photo
            +   '<div class="pick-card-body">'
            +     '<div class="pick-name">' + esc(pick.name) + '</div>'
            +     (pick.group_name ? '<div class="pick-group">' + esc(pick.group_name) + '</div>' : '')
            +     '<div class="pick-meta">'
            +       (pick.location ? '<span>📍 ' + esc(pick.location) + '</span>' : '')
            +     '</div>'
            +     (badges.length ? '<div class="pick-badges">' + badges.map(function(b) { return '<span class="pick-badge">' + b + '</span>'; }).join('') + '</div>' : '')
            +   '</div>'
            + '</div>'
            + (gateLink ? '<div class="pick-links">' + gateLink + '</div>' : '')
            + '</div>';
        })
        .catch(function() {
          var el = document.getElementById('theaters-count');
          if (el) el.textContent = '';
        });

    })();
    </script>
  `;

  const headExtra = `<style>
/* ── Hero ── */
.info-hero { text-align: center; margin-bottom: 1.5rem; }
.info-hero-title { font-family: var(--ff-serif, 'Noto Serif JP', serif); font-size: clamp(1.2rem,4vw,1.5rem); color: var(--heading, var(--text-primary)); margin: 0 0 0.35rem; font-weight: 700; }
.info-hero-lead { color: var(--text-muted, var(--text-secondary)); font-size: 0.95rem; margin: 0; }

/* ── 共通カード ── */
.info-card {
  background: var(--bg-card); border-radius: var(--radius-md, 12px);
  box-shadow: var(--shadow-sm); padding: 1.2rem 1.4rem;
  margin-bottom: 1rem; display: block;
  border: 1px solid var(--border-light);
}
.info-card-header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.8rem; }
.info-card-icon { font-size: 1.6rem; flex-shrink: 0; line-height: 1; }
.info-card-title { font-weight: 700; font-size: 1.05rem; color: var(--heading, var(--text-primary)); }
.info-card-count { color: var(--text-muted, var(--text-secondary)); font-size: 0.83rem; margin-top: 0.15rem; }
.info-card-link {
  display: inline-block; margin-top: 0.6rem; font-size: 0.9rem;
  color: var(--gold-dark, var(--accent)); text-decoration: none; font-weight: 500;
}
.info-card-link:hover { text-decoration: underline; }

/* ── A: お気に入りタグ一覧（下部・小さめ） ── */
.info-fav-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.info-fav-list-footer {
  margin-top: 0.75rem; padding-top: 0.6rem;
  border-top: 1px solid var(--border-light, #ece7e0);
}
.info-fav-item {
  display: inline-block; padding: 3px 9px; border-radius: 12px;
  background: var(--bg-subtle, #f5f0ea); font-size: 0.78rem;
  color: var(--text-secondary, #7a6f63); text-decoration: none; transition: background 0.2s;
}
.info-fav-item:hover { background: var(--gold-soft, #ede1cf); color: var(--heading); text-decoration: none; }
.info-fav-more { font-size: 0.76rem; color: var(--gold-dark, var(--accent)); text-decoration: none; padding: 3px 6px; }

/* ── A: お気に入り次回公演 ── */
.info-fav-empty { text-align: center; padding: 0.5rem 0 0.2rem; }
.info-fav-empty p { color: var(--text-muted, var(--text-secondary)); font-size: 0.9rem; margin: 0 0 0.6rem; }
.info-cta-link {
  display: inline-block; padding: 6px 16px; border-radius: 20px;
  border: 1px solid var(--gold-dark, var(--accent)); color: var(--gold-dark, var(--accent));
  font-size: 0.85rem; text-decoration: none; transition: background 0.15s;
}
.info-cta-link:hover { background: var(--gold-soft, #f5edd8); text-decoration: none; }

/* 公演カード */
.perf-card {
  display: block; position: relative;
  padding: 0.85rem 1rem; margin-bottom: 0.55rem;
  border-radius: 10px; border: 1px solid var(--border-light, #ece7e0);
  background: var(--bg-subtle, #faf7f2);
  text-decoration: none; color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}
.perf-card-active:hover {
  border-color: var(--gold, #c5a255); box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08));
  transform: translateY(-1px); text-decoration: none;
}
.perf-card-unknown { opacity: 0.7; }

.perf-card-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.4rem; }
.perf-card-name { font-weight: 700; font-size: 0.95rem; color: var(--heading, var(--text-primary)); }
.perf-card-info { display: flex; flex-wrap: wrap; gap: 0.3rem 0.9rem; font-size: 0.82rem; color: var(--text-secondary, #7a6f63); line-height: 1.6; }
.perf-card-date, .perf-card-venue, .perf-card-title-text { white-space: nowrap; }
.perf-card-na { font-size: 0.82rem; color: var(--text-muted, #aaa); }
.perf-card-arrow {
  position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
  font-size: 0.78rem; font-weight: 600; color: var(--gold-dark, #a8873a); opacity: 0.6;
}
.perf-card-active:hover .perf-card-arrow { opacity: 1; }

.perf-badge {
  display: inline-block; font-size: 0.68rem; font-weight: 700;
  padding: 2px 8px; border-radius: 10px; white-space: nowrap; flex-shrink: 0;
}
.badge-upcoming { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
.badge-today    { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; }
.badge-ended    { background: #f3f3f3; color: #777; border: 1px solid #ccc; }
.badge-unknown  { background: var(--bg-subtle, #f5f0ea); color: var(--text-muted, #888); border: 1px solid var(--border-light, #ddd); }

/* ── C: 説明カード ── */
.info-about-lead { margin: 0 0 0.4rem; font-size: 0.92rem; color: var(--text-secondary, #7a6f63); line-height: 1.75; }
.info-about-details summary {
  cursor: pointer; color: var(--gold-dark, #a8873a); font-weight: 600; font-size: 0.88rem;
  list-style: none; display: flex; align-items: center; gap: 0.4rem;
}
.info-about-details summary::-webkit-details-marker { display: none; }
.info-about-details summary::before { content: '▶'; font-size: 0.6rem; transition: transform 0.2s; }
.info-about-details[open] summary::before { transform: rotate(90deg); }
.info-about-body { margin-top: 0.6rem; font-size: 0.88rem; color: var(--text-secondary, #7a6f63); line-height: 1.75; }
.info-about-body p { margin: 0; }

/* ── NEWSブリーフ帯 ── */
.brief-strip {
  background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md, 12px); padding: 0.75rem 1rem;
  margin-bottom: 0.6rem; box-shadow: var(--shadow-sm);
}
.brief-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.5rem; margin-bottom: 0.55rem; flex-wrap: wrap;
}
.brief-label {
  font-size: 0.82rem; font-weight: 700;
  color: var(--gold-dark, #a8873a); letter-spacing: 0.5px; white-space: nowrap;
}
.brief-meta-right {
  display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; flex-wrap: wrap;
}
.brief-new-badge {
  font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 10px;
  background: #fff3cd; color: #856404; border: 1px solid #ffc107;
}
.brief-updated { font-size: 0.72rem; color: var(--text-muted, var(--text-secondary)); }
.brief-reload-btn {
  background: none; border: 1px solid var(--border-light); border-radius: 6px;
  color: var(--text-muted, var(--text-secondary)); cursor: pointer; font-size: 0.85rem;
  padding: 1px 6px; line-height: 1.4; transition: opacity 0.2s, color 0.15s;
}
.brief-reload-btn:hover { color: var(--gold-dark, #a8873a); border-color: var(--gold-dark); }
.brief-all-link {
  font-size: 0.78rem; font-weight: 600; color: var(--gold-dark, #a8873a);
  text-decoration: none; white-space: nowrap;
}
.brief-all-link:hover { text-decoration: underline; }
.brief-loading, .brief-empty { font-size: 0.8rem; color: var(--text-muted, var(--text-secondary)); }
.brief-item {
  display: flex; align-items: baseline; gap: 0.6rem;
  padding: 5px 0; border-top: 1px solid var(--border-light, #ece7e0);
  text-decoration: none; color: inherit;
}
.brief-item:first-child { border-top: none; padding-top: 0; }
.brief-item:hover .brief-item-title { text-decoration: underline; }
.brief-item-title {
  flex: 1; font-size: 0.88rem; color: var(--heading, var(--text-primary));
  line-height: 1.4; min-width: 0;
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
}
.brief-item-sub { flex-shrink: 0; font-size: 0.72rem; color: var(--text-muted, var(--text-secondary)); white-space: nowrap; }

/* ── お気に入り団体ニュース ── */
.fav-news-empty { color: var(--text-muted, var(--text-secondary)); font-size: 0.82rem; margin: 0.5rem 0 0; }
.fav-news-row {
  display: flex; align-items: baseline; gap: 0.5rem;
  padding: 7px 0; border-top: 1px solid var(--border-light, #ece7e0);
  text-decoration: none; color: inherit; font-size: 0.88rem; flex-wrap: wrap;
  margin-top: 0.2rem;
}
.fav-news-row:first-child { border-top: none; }
.fav-news-row:hover .fav-news-title { text-decoration: underline; }
.fav-news-tag {
  flex-shrink: 0; font-size: 0.72rem; font-weight: 600;
  background: var(--bg-subtle, #f0ebe4); color: var(--gold-dark, var(--accent));
  padding: 2px 8px; border-radius: 10px; white-space: nowrap;
}
.fav-news-title { flex: 1; color: var(--heading, var(--text-primary)); line-height: 1.4; min-width: 0; }
.fav-news-date { flex-shrink: 0; font-size: 0.76rem; color: var(--text-muted, var(--text-secondary)); }

/* ── 今日のご紹介 ── */
.pick-section {
  margin: 0.6rem 0 0.2rem;
  padding-top: 0.6rem;
  border-top: 1px dashed var(--border-light, #ece7e0);
}
.pick-label {
  display: inline-block; font-size: 0.72rem; font-weight: 700;
  color: var(--gold-dark, #a8873a); letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}
.pick-card {
  display: block;
  padding: 0.7rem 0.9rem; border-radius: 10px;
  border: 1px solid var(--border-light, #ece7e0);
  background: var(--bg-subtle, #faf7f2);
  text-decoration: none; color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}
a.pick-card:hover {
  border-color: var(--gold, #c5a255);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08));
  transform: translateY(-1px); text-decoration: none;
}
.pick-card-theater {
  display: flex; gap: 0.8rem; align-items: flex-start;
}
.pick-card-body { flex: 1; min-width: 0; }
.pick-photo {
  width: 80px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0;
}
.pick-photo img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.pick-name {
  font-weight: 700; font-size: 0.95rem;
  color: var(--heading, var(--text-primary));
  margin-bottom: 0.2rem;
}
.pick-group {
  font-size: 0.78rem; color: var(--gold-dark, #a8873a);
  font-weight: 600; margin-bottom: 0.2rem;
}
.pick-meta {
  display: flex; flex-wrap: wrap; gap: 0.3rem 0.8rem;
  font-size: 0.8rem; color: var(--text-secondary, #7a6f63);
  line-height: 1.5;
}
.pick-badges {
  display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.35rem;
}
.pick-badge {
  display: inline-block; font-size: 0.65rem; font-weight: 600;
  padding: 1px 7px; border-radius: 10px;
  background: var(--bg-card, #fff); color: var(--gold-dark, #a8873a);
  border: 1px solid var(--border-light, #ece7e0);
}
.pick-links {
  display: flex; align-items: center; gap: 0.5rem;
  margin-top: 0.5rem; flex-wrap: wrap;
}
.pick-sns {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--bg-subtle, #f5f0ea); border: 1px solid var(--border-light, #ece7e0);
  text-decoration: none; font-size: 0.78rem; color: var(--text-secondary, #7a6f63);
  transition: border-color 0.15s, background 0.15s;
}
.pick-sns:hover {
  border-color: var(--gold, #c5a255);
  background: var(--gold-soft, #fdf8ec);
  color: var(--gold-dark, #a8873a);
}
.pick-gate {
  font-size: 0.78rem; font-weight: 600;
  color: var(--gold-dark, #a8873a); text-decoration: none;
  padding: 3px 10px; border-radius: 12px;
  background: var(--gold-soft, #fdf8ec); border: 1px solid var(--gold-light, #e8d5a0);
  transition: background 0.15s;
}
.pick-gate:hover { background: var(--gold-light, #e8d5a0); text-decoration: none; }

/* ── D: 掲載申請 ── */
.info-notice {
  text-align: center;
  background: var(--bg-subtle, #f5f0ea);
  border: 1px dashed var(--border-medium, #d5cec4) !important;
}
.info-notice-title { font-weight: 700; font-size: 0.9rem; color: var(--heading, var(--text-primary)); margin: 0 0 0.3rem; }
.info-notice-text { margin: 0 0 0.75rem; font-size: 0.85rem; color: var(--text-muted, var(--text-secondary)); line-height: 1.65; }
.info-notice-btn {
  display: inline-block; padding: 8px 22px; border-radius: 20px;
  background: var(--gold-dark, #a8873a); color: #fff; text-decoration: none;
  font-size: 0.88rem; font-weight: 600; transition: opacity 0.2s;
}
.info-notice-btn:hover { opacity: 0.85; text-decoration: none; color: #fff; }
</style>`;

  return pageShell({
    title: "INFO",
    subtitle: "たより",
    bodyHTML,
    headExtra,
    activeNav: "info",
    brand: "jikabuki",
    ogDesc: "全国の地歌舞伎・地芝居団体を探す。お気に入り団体の次回公演を追う。地歌舞伎・地芝居の発見と応援の入口。",
    ogImage: "https://kabukiplus.com/assets/ogp/ogp_info.png",
  });
}

// =========================================================
// 芝居小屋一覧ページ — /jikabuki/info/theaters
// =========================================================
export function infoTheatersPageHTML() {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/info">INFO</a><span>›</span><span>芝居小屋</span>
    </div>

    <section class="th-hero fade-up">
      <h2 class="th-hero-title">全国の芝居小屋</h2>
      <p class="th-hero-lead">地歌舞伎・地芝居が上演される芝居小屋・農村舞台の一覧</p>
    </section>

    <div class="th-search-wrap fade-up">
      <input type="search" id="th-search" class="th-search" placeholder="名称・地域で検索…" oninput="filterTheaters(this.value)">
      <span class="th-count" id="th-count"></span>
    </div>

    <div id="th-list" class="th-list">
      <div class="loading">読み込み中…</div>
    </div>

    <script>
    (function() {
      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

      fetch('/api/jikabuki/theaters')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          var theaters = data.theaters || [];
          render(theaters);
        })
        .catch(function() {
          document.getElementById('th-list').innerHTML = '<p class="th-empty">データの取得に失敗しました</p>';
        });

      function render(theaters) {
        var listEl = document.getElementById('th-list');
        var countEl = document.getElementById('th-count');
        if (countEl) countEl.textContent = theaters.length + ' 件';
        if (!theaters.length) {
          listEl.innerHTML = '<p class="th-empty">登録された芝居小屋はまだありません</p>';
          return;
        }
        listEl.innerHTML = theaters.map(function(th) {
          var badges = [];
          if (th.has_hanamichi) badges.push('花道');
          if (th.has_mawari_butai) badges.push('回り舞台');
          if (th.has_suppon) badges.push('すっぽん');
          if (th.visitable) badges.push('見学可');
          if (th.has_toilet) badges.push('トイレ');
          if (th.has_parking) badges.push('駐車場');
          if (th.cultural_property) badges.push(esc(th.cultural_property));
          if (th.capacity) badges.push('収容 ' + th.capacity + ' 名');

          var gateLink = th.gate_group_id ? '/jikabuki/gate/' + esc(th.gate_group_id) : '';

          return '<div class="th-card" data-search="' + esc((th.name + ' ' + th.location + ' ' + th.group_name).toLowerCase()) + '">'
            + (th.photo_url ? '<div class="th-card-photo"><img src="' + esc(th.photo_url) + '" alt="' + esc(th.name) + '" loading="lazy"></div>' : '')
            + '<div class="th-card-body">'
            +   '<div class="th-card-name">' + esc(th.name) + '</div>'
            +   (th.group_name ? '<div class="th-card-group">' + esc(th.group_name) + '</div>' : '')
            +   (th.location ? '<div class="th-card-location">📍 ' + esc(th.location) + '</div>' : '')
            +   (badges.length ? '<div class="th-card-badges">' + badges.map(function(b) { return '<span class="th-badge">' + b + '</span>'; }).join('') + '</div>' : '')
            +   (th.description ? '<p class="th-card-desc">' + esc(th.description).substring(0, 100) + (th.description.length > 100 ? '…' : '') + '</p>' : '')
            +   (gateLink ? '<a href="' + gateLink + '" class="th-card-link">🏮 GATEページ →</a>' : '')
            + '</div>'
            + '</div>';
        }).join('');

        window.__theaters = theaters;
      }

      window.filterTheaters = function(q) {
        q = q.trim().toLowerCase();
        var cards = document.querySelectorAll('.th-card');
        var visible = 0;
        cards.forEach(function(card) {
          var text = card.dataset.search || '';
          var show = !q || text.indexOf(q) !== -1;
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        var countEl = document.getElementById('th-count');
        if (countEl) countEl.textContent = visible + ' 件';
      };
    })();
    </script>
  `;

  return pageShell({
    title: "全国の芝居小屋",
    subtitle: "INFO",
    bodyHTML,
    activeNav: "info",
    brand: "jikabuki",
    ogDesc: "地歌舞伎・地芝居が上演される全国の芝居小屋・農村舞台の一覧。",
    headExtra: `<style>
      .th-hero { text-align: center; margin-bottom: 1.2rem; }
      .th-hero-title { font-family: 'Noto Serif JP', serif; font-size: clamp(1.2rem,4vw,1.5rem); font-weight: 700; color: var(--text-primary); margin: 0 0 0.35rem; }
      .th-hero-lead { color: var(--text-secondary); font-size: 0.92rem; margin: 0; }
      .th-search-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 1.2rem; }
      .th-search {
        flex: 1; max-width: 360px; padding: 8px 12px;
        border: 1px solid var(--border-light); border-radius: 8px;
        font-size: 14px; background: var(--bg-card); color: var(--text-primary);
      }
      .th-search:focus { outline: none; border-color: var(--gold); }
      .th-count { font-size: 12px; color: var(--text-secondary); }
      .th-list { display: grid; gap: 1rem; margin-bottom: 2rem; }
      .th-card {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); overflow: hidden;
        box-shadow: var(--shadow-sm); transition: border-color 0.2s;
      }
      .th-card:hover { border-color: var(--gold-light); }
      .th-card-photo { width: 100%; max-height: 200px; overflow: hidden; }
      .th-card-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .th-card-body { padding: 1rem 1.2rem; }
      .th-card-name { font-family: 'Noto Serif JP', serif; font-size: 1.05rem; font-weight: 700; margin-bottom: 0.2rem; }
      .th-card-group { font-size: 0.8rem; color: var(--gold-dark); font-weight: 600; margin-bottom: 0.3rem; }
      .th-card-location { font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.4rem; }
      .th-card-badges { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem; }
      .th-badge {
        display: inline-block; font-size: 0.68rem; font-weight: 600;
        padding: 2px 8px; border-radius: 10px;
        background: var(--bg-subtle); color: var(--gold-dark); border: 1px solid var(--border-light);
      }
      .th-card-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7; margin: 0 0 0.5rem; }
      .th-card-link { font-size: 0.82rem; color: var(--gold-dark); text-decoration: none; font-weight: 600; }
      .th-card-link:hover { text-decoration: underline; }
      .th-empty { text-align: center; color: var(--text-tertiary); font-size: 0.9rem; padding: 2rem 0; }
      @media (min-width: 640px) {
        .th-list { grid-template-columns: 1fr 1fr; }
      }
    </style>`,
  });
}
