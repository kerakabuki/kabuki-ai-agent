// src/base_hub_page.js
// =========================================================
// BASE ダッシュボード — マイページ型団体運営ハブ
// 団体選択 → 公演目標・スケジュール・台本・メンバーを一覧表示
// 未ログイン: 説明＋ログイン誘導
// =========================================================
import { pageShell } from "./web_layout.js";

export function baseHubPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><span>BASE</span>
    </div>

    <!-- ヘッダー + 団体セレクター -->
    <section class="bd-header fade-up">
      <div class="bd-header-top">
        <div class="bd-header-text">
          <h2 class="bd-title">BASE</h2>
          <p class="bd-subtitle">がくや</p>
        </div>
        <div class="bd-user" id="bd-user">
          <span class="bd-user-name">未ログイン</span>
          <button class="bd-btn-login" id="bd-login-btn" onclick="openLoginModal()">ログイン</button>
        </div>
      </div>
      <div class="bd-group-selector" id="bd-group-selector" style="display:none">
        <select id="bd-group-select" onchange="window.__bd.onGroupChange(this.value)"></select>
        <span class="bd-role-badge" id="bd-role-badge"></span>
      </div>
    </section>

    <!-- ログイン前: 説明セクション -->
    <section class="bd-section fade-up" id="bd-intro">
      <div class="bd-intro-card">
        <div class="bd-intro-icon">🔧</div>
        <h3>BASEとは？</h3>
        <p>各地歌舞伎団体の運営をデジタルでサポートするプラットフォームです。<br>
        台本管理・稽古メモ・公演記録・GATEページ編集など、日々の活動に必要なツールがそろっています。</p>
        <div class="bd-intro-features">
          <div class="bd-intro-feat"><span>📖</span>デジタル台本</div>
          <div class="bd-intro-feat"><span>📋</span>公演記録</div>
          <div class="bd-intro-feat"><span>📅</span>稽古スケジュール</div>
          <div class="bd-intro-feat"><span>📝</span>稽古メモ</div>
          <div class="bd-intro-feat"><span>🎤</span>稽古モード</div>
          <div class="bd-intro-feat"><span>🏯</span>GATEページ編集</div>
        </div>
        <p class="bd-intro-note">利用するにはログインして団体に所属してください。</p>
      </div>
    </section>

    <!-- ダッシュボード本体（ログイン後表示） -->
    <div id="bd-dashboard" style="display:none">

      <!-- 公演目標 -->
      <section class="bd-section fade-up" id="bd-goal-section">
        <h3 class="bd-section-title">🎯 公演目標</h3>
        <div id="bd-goal-content" class="bd-loading">読み込み中…</div>
      </section>

      <!-- 師匠の一言 -->
      <section class="bd-section fade-up" id="bd-hitokoto-section" style="display:none">
        <div id="bd-hitokoto-content"></div>
      </section>

      <!-- 稽古スケジュール -->
      <section class="bd-section fade-up-d1" id="bd-schedule-section">
        <div class="bd-section-header">
          <h3 class="bd-section-title">📅 稽古スケジュール</h3>
          <a href="#" class="bd-section-more" id="bd-schedule-more">すべて見る →</a>
        </div>
        <div id="bd-schedule-content" class="bd-loading">読み込み中…</div>
      </section>

      <!-- 最近のメモ -->
      <section class="bd-section fade-up-d1" id="bd-notes-section">
        <div class="bd-section-header">
          <h3 class="bd-section-title">📝 稽古メモ</h3>
          <a href="#" class="bd-section-more" id="bd-notes-more">すべて見る →</a>
        </div>
        <div id="bd-notes-content" class="bd-loading">読み込み中…</div>
      </section>

      <!-- 台本 -->
      <section class="bd-section fade-up-d2" id="bd-scripts-section">
        <div class="bd-section-header">
          <h3 class="bd-section-title">📖 台本</h3>
          <a href="#" class="bd-section-more" id="bd-scripts-more">すべて見る →</a>
        </div>
        <div id="bd-scripts-content" class="bd-loading">読み込み中…</div>
      </section>

      <!-- メンバー -->
      <section class="bd-section fade-up-d2" id="bd-members-section">
        <div class="bd-section-header">
          <h3 class="bd-section-title">👥 メンバー</h3>
          <a href="#" class="bd-section-more" id="bd-members-more" style="display:none">管理 →</a>
        </div>
        <div id="bd-members-content" class="bd-loading">読み込み中…</div>
      </section>

      <!-- クイックリンク -->
      <section class="bd-section fade-up-d3" id="bd-quicklinks-section">
        <h3 class="bd-section-title">メニュー</h3>
        <div id="bd-quicklinks" class="bd-quicklinks-grid"></div>
      </section>

    </div>

    <!-- 共有ツール（常時表示） -->
    <section class="bd-section fade-up-d3" id="bd-shared">
      <h3 class="bd-section-title">共有ツール</h3>
      <div class="bd-shared-grid">
        <a href="/jikabuki/base/scripts" class="bd-shared-card accent-shared">
          <div class="bd-shared-icon">🤝</div>
          <div class="bd-shared-body">
            <div class="bd-shared-title">台本共有ライブラリ</div>
            <div class="bd-shared-desc">団体間で台本を共有し事務局負担を軽減</div>
          </div>
          <div class="bd-shared-arrow">&rsaquo;</div>
        </a>
        <a href="/jikabuki/base/onboarding" class="bd-shared-card accent-new">
          <div class="bd-shared-icon">✨</div>
          <div class="bd-shared-body">
            <div class="bd-shared-title">新規団体を登録</div>
            <div class="bd-shared-desc">BASEに団体を登録して運営ツールを利用開始</div>
          </div>
          <div class="bd-shared-arrow">&rsaquo;</div>
        </a>
      </div>
    </section>

    <script>
    (function() {
      var currentUser = null;
      var groupsInfo = {};
      var selectedGroupId = null;

      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

      function parseLocalDate(d) {
        if (!d) return null;
        var parts = d.split('-');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }

      function dateLabel(d) {
        if (!d) return '';
        var dt = parseLocalDate(d);
        if (!dt || isNaN(dt.getTime())) return d;
        var days = ['日','月','火','水','木','金','土'];
        return (dt.getMonth()+1) + '月' + dt.getDate() + '日(' + days[dt.getDay()] + ')';
      }

      function daysUntil(dateStr) {
        if (!dateStr) return null;
        var target = parseLocalDate(dateStr);
        if (!target) return null;
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
      }

      function typeLabel(type) {
        var map = { '稽古': 'keiko', '本番': 'honban', '衣装合わせ': 'isho', '会議': 'kaigi' };
        return map[type] || 'other';
      }

      function attendIcon(status) {
        if (status === 'ok') return '<span class="bd-att bd-att-ok">○</span>';
        if (status === 'maybe') return '<span class="bd-att bd-att-maybe">△</span>';
        if (status === 'ng') return '<span class="bd-att bd-att-ng">×</span>';
        return '<span class="bd-att bd-att-none">未</span>';
      }

      /* --- 認証チェック → 初期化 --- */
      fetch('/api/auth/me', { credentials: 'same-origin' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!data.loggedIn || !data.user) return;
          currentUser = data.user;
          showLoggedIn();
        })
        .catch(function() {});

      function showLoggedIn() {
        var userArea = document.getElementById('bd-user');
        var loginBtn = document.getElementById('bd-login-btn');
        var avatar = currentUser.pictureUrl
          ? '<img src="' + esc(currentUser.pictureUrl) + '" class="bd-avatar">'
          : '<span class="bd-avatar-ph">👤</span>';
        userArea.innerHTML = avatar + '<span class="bd-user-name">' + esc(currentUser.displayName || currentUser.email || 'ログイン済み') + '</span>';
        if (loginBtn) loginBtn.style.display = 'none';

        var groups = currentUser.groups || [];
        if (groups.length === 0) {
          var intro = document.getElementById('bd-intro');
          if (intro) {
            var noteEl = intro.querySelector('.bd-intro-note');
            if (noteEl) noteEl.innerHTML = 'まだ団体に所属していません。<a href="/jikabuki/base/onboarding">新規団体を登録</a>するか、団体ページから参加を申請してください。';
          }
          return;
        }

        document.getElementById('bd-intro').style.display = 'none';
        document.getElementById('bd-dashboard').style.display = '';
        document.getElementById('bd-group-selector').style.display = 'flex';
        document.getElementById('bd-shared').style.display = 'none';

        var fetches = groups.map(function(g) {
          return fetch('/api/groups/' + encodeURIComponent(g.groupId), { credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(d) { groupsInfo[g.groupId] = { role: g.role, data: d }; })
            .catch(function() { groupsInfo[g.groupId] = { role: g.role, data: { name: g.groupId } }; });
        });

        Promise.all(fetches).then(function() {
          buildGroupSelector(groups);
          var saved = localStorage.getItem('bd_selected_group');
          var initial = (saved && groupsInfo[saved]) ? saved : groups[0].groupId;
          selectGroup(initial);
        });
      }

      function buildGroupSelector(groups) {
        var sel = document.getElementById('bd-group-select');
        sel.innerHTML = groups.map(function(g) {
          var name = (groupsInfo[g.groupId] && groupsInfo[g.groupId].data && groupsInfo[g.groupId].data.name) || g.groupId;
          return '<option value="' + esc(g.groupId) + '">' + esc(name) + '</option>';
        }).join('');
        if (groups.length <= 1) sel.style.pointerEvents = 'none';
      }

      function selectGroup(gid) {
        selectedGroupId = gid;
        localStorage.setItem('bd_selected_group', gid);

        var sel = document.getElementById('bd-group-select');
        sel.value = gid;

        var info = groupsInfo[gid];
        var canManage = (info && info.role === 'manager') || (currentUser && currentUser.isMaster);
        var roleLabel = (currentUser && currentUser.isMaster) ? 'マスター' : (info.role === 'manager' ? 'マネージャー' : 'メンバー');
        var badgeClass = canManage ? 'bd-role-badge bd-role-mgr' : 'bd-role-badge bd-role-mem';
        var badge = document.getElementById('bd-role-badge');
        badge.className = badgeClass;
        badge.textContent = roleLabel;

        updateLinks(gid, canManage);
        loadDashboardData(gid, canManage);
      }

      function updateLinks(gid, canManage) {
        var eg = encodeURIComponent(gid);
        document.getElementById('bd-schedule-more').href = '/groups/' + eg + '/schedule';
        document.getElementById('bd-scripts-more').href = '/groups/' + eg + '/scripts';
        document.getElementById('bd-notes-more').href = '/groups/' + eg + '/notes';

        var membersMore = document.getElementById('bd-members-more');
        if (canManage) {
          membersMore.href = '/groups/' + eg + '/members';
          membersMore.style.display = '';
        } else {
          membersMore.style.display = 'none';
        }

        buildQuickLinks(gid, canManage);
      }

      function buildQuickLinks(gid, canManage) {
        var eg = encodeURIComponent(gid);
        var links = [
          { icon: '📖', label: '台本', href: '/groups/' + eg + '/scripts' },
          { icon: '📋', label: '公演記録', href: '/groups/' + eg + '/records' },
          { icon: '🎭', label: '役者DB', href: '/groups/' + eg + '/actors' },
          { icon: '📅', label: 'スケジュール', href: '/groups/' + eg + '/schedule' },
          { icon: '📝', label: '稽古メモ', href: '/groups/' + eg + '/notes' },
          { icon: '🎤', label: '稽古モード', href: '/groups/' + eg + '/training' },
          { icon: '🎬', label: '演目選定', href: '/groups/' + eg + '/enmoku-select' },
        ];
        if (canManage) {
          links.push({ icon: '💰', label: '収支管理', href: '/groups/' + eg + '/accounting' });
          links.push({ icon: '🏯', label: 'GATE編集', href: '/groups/' + eg + '/gate-edit' });
          links.push({ icon: '👥', label: 'メンバー管理', href: '/groups/' + eg + '/members' });
          links.push({ icon: '🏠', label: '芝居小屋管理', href: '/jikabuki/base/theaters' });
          links.push({ icon: '🗑', label: '団体削除申請', href: '/jikabuki/base/delete-request?group=' + eg });
        }
        var el = document.getElementById('bd-quicklinks');
        el.innerHTML = links.map(function(l) {
          return '<a href="' + l.href + '" class="bd-ql-item"><span class="bd-ql-icon">' + l.icon + '</span><span class="bd-ql-label">' + esc(l.label) + '</span></a>';
        }).join('');
      }

      /* --- ダッシュボードデータ並列取得 --- */
      function loadDashboardData(gid, canManage) {
        var eg = encodeURIComponent(gid);
        document.getElementById('bd-goal-content').innerHTML = '<div class="bd-loading">読み込み中…</div>';
        document.getElementById('bd-schedule-content').innerHTML = '<div class="bd-loading">読み込み中…</div>';
        document.getElementById('bd-scripts-content').innerHTML = '<div class="bd-loading">読み込み中…</div>';
        document.getElementById('bd-members-content').innerHTML = '<div class="bd-loading">読み込み中…</div>';
        document.getElementById('bd-notes-content').innerHTML = '<div class="bd-loading">読み込み中…</div>';

        var opts = { credentials: 'same-origin' };
        Promise.all([
          fetch('/api/groups/' + eg + '/schedule', opts).then(function(r) { return r.json(); }).catch(function() { return {}; }),
          fetch('/api/groups/' + eg + '/scripts', opts).then(function(r) { return r.json(); }).catch(function() { return {}; }),
          fetch('/api/groups/' + eg + '/members', opts).then(function(r) { return r.json(); }).catch(function() { return {}; }),
          fetch('/api/groups/' + eg + '/notes', opts).then(function(r) { return r.json(); }).catch(function() { return { notes: [] }; }),
        ]).then(function(results) {
          renderGoal(results[0].performance_goal, gid);
          renderHitokoto(results[0].shisho_hitokoto, gid, canManage);
          renderSchedule(results[0].schedules || [], gid);
          renderNotes(results[3].notes || [], gid);
          renderScripts(results[1].scripts || [], gid, results[0].performance_goal);
          renderMembers(results[2], canManage, gid);
        });
      }

      /* --- 師匠の一言 --- */
      function renderHitokoto(hitokoto, gid, canManage) {
        var section = document.getElementById('bd-hitokoto-section');
        var el = document.getElementById('bd-hitokoto-content');
        if (!section || !el) return;

        var text = hitokoto && hitokoto.text ? hitokoto.text.trim() : '';
        var updatedAt = hitokoto && hitokoto.updated_at ? hitokoto.updated_at.slice(0, 10) : '';

        if (!text && !canManage) { section.style.display = 'none'; return; }
        section.style.display = '';

        if (!text) {
          el.innerHTML =
            '<div class="bd-hk-empty" onclick="window.__bd.showHitokotoForm()">' +
            '<span class="bd-hk-empty-icon">\uD83C\uDFAD</span>' +
            '<span>\u300C\u5E2B\u5320\u306E\u4E00\u8A00\u300D\u3092\u66F8\u304D\u307E\u3057\u3087\u3046</span>' +
            '</div>';
          return;
        }

        var html = '<div class="bd-hk-card">';
        html += '<div class="bd-hk-deco">\u300C</div>';
        html += '<div class="bd-hk-text">' + esc(text).replace(/\\n/g, '<br>') + '</div>';
        html += '<div class="bd-hk-deco bd-hk-deco-end">\u300D</div>';
        if (updatedAt) {
          html += '<div class="bd-hk-meta">' + updatedAt + '</div>';
        }
        if (canManage) {
          html += '<button class="bd-hk-edit" onclick="window.__bd.showHitokotoForm()">\u7DE8\u96C6</button>';
        }
        html += '</div>';
        el.innerHTML = html;
      }

      function showHitokotoForm() {
        var el = document.getElementById('bd-hitokoto-content');
        if (!el) return;
        var section = document.getElementById('bd-hitokoto-section');
        if (section) section.style.display = '';
        var current = el.querySelector('.bd-hk-text');
        var currentText = current ? current.textContent : '';
        el.innerHTML =
          '<div class="bd-hk-form">' +
          '<h3 class="bd-hk-form-title">\u5E2B\u5320\u306E\u4E00\u8A00</h3>' +
          '<textarea id="bd-hk-input" rows="3" placeholder="\u30E1\u30F3\u30D0\u30FC\u3078\u306E\u4E00\u8A00\u3092\u66F8\u304D\u307E\u3057\u3087\u3046">' + esc(currentText) + '</textarea>' +
          '<div class="bd-hk-form-actions">' +
          '<button class="btn btn-primary btn-sm" onclick="window.__bd.saveHitokoto()">\u4FDD\u5B58</button>' +
          '<button class="btn btn-secondary btn-sm" onclick="window.__bd.cancelHitokoto()">\u30AD\u30E3\u30F3\u30BB\u30EB</button>' +
          '<button class="btn btn-sm bd-hk-clear-btn" onclick="window.__bd.clearHitokoto()">\u30AF\u30EA\u30A2</button>' +
          '</div></div>';
      }

      function saveHitokoto() {
        var input = document.getElementById('bd-hk-input');
        if (!input) return;
        var text = input.value.trim();
        var eg = encodeURIComponent(selectedGroupId);
        var btn = document.querySelector('.bd-hk-form-actions .btn-primary');
        if (btn) { btn.disabled = true; btn.textContent = '\u4FDD\u5B58\u4E2D...'; }
        fetch('/api/groups/' + eg + '/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shisho_hitokoto: { text: text, updated_at: new Date().toISOString() } })
        }).then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.error) { alert('\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ' + data.error); if (btn) { btn.disabled = false; btn.textContent = '\u4FDD\u5B58'; } return; }
            var info = groupsInfo[selectedGroupId];
            var canManage = (info && info.role === 'manager') || (currentUser && currentUser.isMaster);
            renderHitokoto({ text: text, updated_at: new Date().toISOString() }, selectedGroupId, canManage);
          })
          .catch(function() { alert('\u901A\u4FE1\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002'); if (btn) { btn.disabled = false; btn.textContent = '\u4FDD\u5B58'; } });
      }

      function clearHitokoto() {
        if (!confirm('\u5E2B\u5320\u306E\u4E00\u8A00\u3092\u30AF\u30EA\u30A2\u3057\u307E\u3059\u304B\uFF1F')) return;
        var eg = encodeURIComponent(selectedGroupId);
        fetch('/api/groups/' + eg + '/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shisho_hitokoto: null })
        }).then(function(r) { return r.json(); })
          .then(function() {
            var info = groupsInfo[selectedGroupId];
            var canManage = (info && info.role === 'manager') || (currentUser && currentUser.isMaster);
            renderHitokoto(null, selectedGroupId, canManage);
          })
          .catch(function() { alert('\u901A\u4FE1\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002'); });
      }

      /* --- 最近のメモ --- */
      function renderNotes(notes, gid) {
        var el = document.getElementById('bd-notes-content');
        if (!el) return;
        var eg = encodeURIComponent(gid);

        if (!notes || notes.length === 0) {
          el.innerHTML =
            '<a href="/groups/' + eg + '/notes" class="bd-empty-card">' +
            '<span class="bd-empty-icon">\uD83D\uDCDD</span>' +
            '<span>\u7A3D\u53E4\u30E1\u30E2\u3092\u66F8\u304D\u59CB\u3081\u307E\u3057\u3087\u3046</span>' +
            '<span class="bd-empty-arrow">&rsaquo;</span>' +
            '</a>';
          return;
        }

        var sorted = notes.slice().sort(function(a, b) {
          return (b.created_at || '').localeCompare(a.created_at || '');
        });
        var show = sorted.slice(0, 3);

        var html = show.map(function(n) {
          var dateStr = n.created_at ? n.created_at.slice(0, 10) : '';
          var textPreview = (n.text || '').length > 60 ? n.text.slice(0, 60) + '…' : (n.text || '');
          var tagsHTML = '';
          if (n.tags && n.tags.length) {
            tagsHTML = '<div class="bd-note-tags">' +
              n.tags.slice(0, 3).map(function(t) {
                return '<span class="bd-note-tag">' + esc(t) + '</span>';
              }).join('') +
              (n.tags.length > 3 ? '<span class="bd-note-tag">+' + (n.tags.length - 3) + '</span>' : '') +
              '</div>';
          }
          return '<a href="/groups/' + eg + '/notes" class="bd-note-card">' +
            '<div class="bd-note-body">' +
            '<div class="bd-note-text">' + esc(textPreview) + '</div>' +
            tagsHTML +
            '</div>' +
            '<div class="bd-note-date">' + dateStr + '</div>' +
            (n.video_url ? '<span class="bd-note-video">\uD83C\uDFA5</span>' : '') +
            '</a>';
        }).join('');

        if (notes.length > 3) {
          html += '<div class="bd-more-hint">\u4ED6 ' + (notes.length - 3) + ' \u4EF6\u306E\u30E1\u30E2</div>';
        }

        el.innerHTML = html;
      }

      /* --- 公演目標 --- */
      function renderGoal(goal, gid) {
        var el = document.getElementById('bd-goal-content');
        if (!goal || !goal.title) {
          el.innerHTML =
            '<a href="/groups/' + encodeURIComponent(gid) + '/schedule" class="bd-empty-card">' +
            '<span class="bd-empty-icon">🎯</span>' +
            '<span>公演目標を設定しましょう</span>' +
            '<span class="bd-empty-arrow">&rsaquo;</span>' +
            '</a>';
          return;
        }
        var days = daysUntil(goal.date);
        var countdownHTML = '';
        if (days !== null) {
          if (days < 0) {
            countdownHTML = '<div class="bd-countdown bd-countdown-past">終了</div>';
          } else if (days === 0) {
            countdownHTML = '<div class="bd-countdown bd-countdown-today">本日</div>';
          } else {
            countdownHTML = '<div class="bd-countdown">あと <strong>' + days + '</strong> 日</div>';
          }
        }

        var playsHTML = '';
        if (goal.plays && goal.plays.length > 0) {
          playsHTML = '<div class="bd-goal-plays">' +
            goal.plays.map(function(p) {
              var name = typeof p === 'string' ? p : (p.title || p.name || '');
              return '<span class="bd-goal-play-tag">' + esc(name) + '</span>';
            }).join('') +
            '</div>';
        }

        el.innerHTML =
          '<a href="/groups/' + encodeURIComponent(gid) + '/schedule" class="bd-goal-card">' +
          '<div class="bd-goal-main">' +
          '<div class="bd-goal-info">' +
          '<div class="bd-goal-title">' + esc(goal.title) + '</div>' +
          (goal.date ? '<div class="bd-goal-date">' + dateLabel(goal.date) + (goal.venue ? '　' + esc(goal.venue) : '') + '</div>' : '') +
          playsHTML +
          '</div>' +
          countdownHTML +
          '</div>' +
          '</a>';
      }

      /* --- 稽古スケジュール --- */
      function renderSchedule(schedules, gid) {
        var el = document.getElementById('bd-schedule-content');
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

        var upcoming = schedules.filter(function(s) { return s.date >= todayStr; });
        upcoming.sort(function(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
        var show = upcoming.slice(0, 3);

        if (show.length === 0) {
          el.innerHTML = '<div class="bd-empty-state">今後の予定はありません</div>';
          return;
        }

        var uid = currentUser ? currentUser.userId : null;
        el.innerHTML = show.map(function(s) {
          var myStatus = (uid && s.attendance && s.attendance[uid]) ? s.attendance[uid].status : null;
          var typeCls = 'bd-sched-type bd-type-' + typeLabel(s.type || '稽古');
          var highlight = (!myStatus && s.date >= todayStr) ? ' bd-sched-unanswered' : '';
          return '<a href="/groups/' + encodeURIComponent(gid) + '/schedule" class="bd-sched-card' + highlight + '">' +
            '<div class="bd-sched-date">' +
            '<div class="bd-sched-month">' + dateLabel(s.date) + '</div>' +
            (s.time ? '<div class="bd-sched-time">' + esc(s.time) + '〜</div>' : '') +
            '</div>' +
            '<div class="bd-sched-info">' +
            '<div class="bd-sched-title">' + esc(s.title || '稽古') + '</div>' +
            (s.type ? '<span class="' + typeCls + '">' + esc(s.type) + '</span>' : '') +
            (s.location ? '<div class="bd-sched-loc">📍 ' + esc(s.location) + '</div>' : '') +
            '</div>' +
            '<div class="bd-sched-att">' + attendIcon(myStatus) + '</div>' +
            '</a>';
        }).join('');

        if (upcoming.length > 3) {
          el.innerHTML += '<div class="bd-more-hint">他 ' + (upcoming.length - 3) + ' 件の予定</div>';
        }
      }

      /* --- 台本 --- */
      function renderScripts(scripts, gid, goal) {
        var el = document.getElementById('bd-scripts-content');
        if (!scripts || scripts.length === 0) {
          el.innerHTML = '<div class="bd-empty-state">台本はまだありません</div>';
          return;
        }

        var eg = encodeURIComponent(gid);
        var perfTitle = goal && goal.title ? goal.title : '';
        var html = '<div class="bd-scripts-summary">' + scripts.length + ' 件の台本</div>';

        function scriptItemHTML(s, pinned) {
          var updated = s.updated_at || s.uploaded_at || '';
          var dateStr = updated ? updated.slice(0, 10) : '';
          return '<a href="/groups/' + eg + '/scripts" class="bd-script-item' + (pinned ? ' bd-script-pinned' : '') + '">' +
            (pinned ? '<span class="bd-script-pin-badge">次回公演</span>' : '') +
            '<div class="bd-script-info">' +
            '<div class="bd-script-title">' + esc(s.title || s.filename || '無題') + '</div>' +
            (s.play ? '<div class="bd-script-play">' + esc(s.play) + '</div>' : '') +
            '</div>' +
            (dateStr ? '<div class="bd-script-date">' + dateStr + '</div>' : '') +
            '</a>';
        }

        if (perfTitle) {
          var pinned = scripts.filter(function(s) { return s.performance_tag === perfTitle; });
          var others = scripts.filter(function(s) { return s.performance_tag !== perfTitle; });
          var sortedOthers = others.slice().sort(function(a, b) {
            var da = a.updated_at || a.uploaded_at || '';
            var db = b.updated_at || b.uploaded_at || '';
            return da > db ? -1 : da < db ? 1 : 0;
          });

          pinned.forEach(function(s) { html += scriptItemHTML(s, true); });
          sortedOthers.slice(0, Math.max(0, 3 - pinned.length)).forEach(function(s) { html += scriptItemHTML(s, false); });
        } else {
          var sorted = scripts.slice().sort(function(a, b) {
            var da = a.updated_at || a.uploaded_at || '';
            var db = b.updated_at || b.uploaded_at || '';
            return da > db ? -1 : da < db ? 1 : 0;
          });
          sorted.slice(0, 3).forEach(function(s) { html += scriptItemHTML(s, false); });
        }

        el.innerHTML = html;
      }

      /* --- メンバー --- */
      function renderMembers(data, canManage, gid) {
        var el = document.getElementById('bd-members-content');
        var members = (data && data.members) || [];
        var requests = (data && data.requests) || [];
        var eg = encodeURIComponent(gid);

        var html = '<div class="bd-members-bar">';
        html += '<span class="bd-members-count">' + members.length + ' 人</span>';
        if (canManage && requests.length > 0) {
          html += '<a href="/groups/' + eg + '/members" class="bd-members-alert">' +
            '<span class="bd-alert-badge">' + requests.length + '</span>' +
            '件の参加申請' +
            '</a>';
        }
        html += '</div>';

        if (members.length > 0) {
          html += '<div class="bd-members-list">';
          members.forEach(function(m) {
            var isManager = m.role === 'manager';
            var avatarHTML = m.pictureUrl
              ? '<img src="' + esc(m.pictureUrl) + '" class="bd-mem-avatar" alt="">'
              : '<span class="bd-mem-avatar bd-mem-avatar-ph">' + esc((m.displayName || '?').charAt(0)) + '</span>';
            html += '<div class="bd-mem-card' + (isManager ? ' bd-mem-mgr' : '') + '">';
            html += avatarHTML;
            html += '<div class="bd-mem-info">';
            html += '<div class="bd-mem-name">' + esc(m.displayName || m.userId) + '</div>';
            if (isManager) html += '<div class="bd-mem-role">マネージャー</div>';
            html += '</div></div>';
          });
          html += '</div>';
        }

        el.innerHTML = html;
      }

      window.__bd = {
        onGroupChange: function(gid) { selectGroup(gid); },
        showHitokotoForm: showHitokotoForm,
        saveHitokoto: saveHitokoto,
        cancelHitokoto: function() {
          var info = groupsInfo[selectedGroupId];
          var canManage = (info && info.role === 'manager') || (currentUser && currentUser.isMaster);
          loadDashboardData(selectedGroupId, canManage);
        },
        clearHitokoto: clearHitokoto
      };
    })();
    </script>
  `;

  return pageShell({
    title: "BASE",
    subtitle: "がくや",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    googleClientId,
    ogDesc: "地歌舞伎団体の運営をデジタルでサポート。台本管理・稽古メモ・公演記録・GATEページ編集など。",
    ogImage: "https://kabukiplus.com/assets/ogp/ogp_base.png",
    headExtra: `<style>
      /* ── ヘッダー ── */
      .bd-header {
        padding: 24px 20px 16px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 20px;
      }
      .bd-header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .bd-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }
      .bd-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 2px 0 0;
      }
      .bd-user {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .bd-user-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .bd-avatar {
        width: 32px; height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }
      .bd-avatar-ph { font-size: 24px; }
      .bd-btn-login {
        padding: 5px 14px;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        background: var(--bg-subtle);
        color: var(--text-secondary);
        border: 1px solid var(--border-light);
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .bd-btn-login:hover {
        border-color: var(--gold);
        color: var(--gold-dark);
      }

      /* 団体セレクター */
      .bd-group-selector {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid var(--border-light);
      }
      #bd-group-select {
        flex: 1;
        min-width: 0;
        padding: 8px 12px;
        font-size: 15px;
        font-weight: 700;
        font-family: 'Noto Serif JP', serif;
        color: var(--text-primary);
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        appearance: auto;
        cursor: pointer;
      }
      .bd-role-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 3px 12px;
        border-radius: 20px;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .bd-role-mgr {
        background: var(--gold-soft);
        color: var(--gold-dark);
        border: 1px solid var(--gold-light);
      }
      .bd-role-mem {
        background: var(--accent-2-soft);
        color: var(--accent-2);
        border: 1px solid #c4d8e8;
      }

      /* ── セクション共通 ── */
      .bd-section { margin-bottom: 24px; }
      .bd-section-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 12px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .bd-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .bd-section-header .bd-section-title { margin-bottom: 0; }
      .bd-section-more {
        font-size: 13px;
        color: var(--gold-dark);
        text-decoration: none;
        font-weight: 600;
        white-space: nowrap;
      }
      .bd-section-more:hover { text-decoration: underline; }

      .bd-loading {
        text-align: center;
        padding: 20px;
        font-size: 13px;
        color: var(--text-tertiary);
      }
      .bd-empty-state {
        text-align: center;
        padding: 24px 16px;
        font-size: 13px;
        color: var(--text-tertiary);
        background: var(--bg-subtle);
        border-radius: var(--radius-md);
      }

      /* ── 説明カード（未ログイン） ── */
      .bd-intro-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-lg);
        padding: 32px 28px;
        text-align: center;
      }
      .bd-intro-icon { font-size: 48px; margin-bottom: 12px; }
      .bd-intro-card h3 {
        font-family: 'Noto Serif JP', serif;
        font-size: 18px; font-weight: 700;
        margin: 0 0 12px;
        color: var(--text-primary);
      }
      .bd-intro-card p {
        font-size: 14px; color: var(--text-secondary);
        line-height: 1.8; margin: 0 0 16px;
      }
      .bd-intro-features {
        display: flex; flex-wrap: wrap;
        justify-content: center; gap: 10px;
        margin-bottom: 16px;
      }
      .bd-intro-feat {
        display: flex; align-items: center; gap: 6px;
        font-size: 13px; color: var(--text-primary);
        background: var(--bg-subtle);
        padding: 6px 14px; border-radius: 20px;
      }
      .bd-intro-feat span { font-size: 16px; }
      .bd-intro-note { font-size: 13px !important; color: var(--text-tertiary) !important; }

      /* ── 公演目標 ── */
      .bd-goal-card {
        display: block;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 20px;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .bd-goal-card:hover {
        border-color: var(--gold);
        box-shadow: var(--shadow-md);
        text-decoration: none;
      }
      .bd-goal-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .bd-goal-info { flex: 1; min-width: 0; }
      .bd-goal-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 17px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 4px;
      }
      .bd-goal-date {
        font-size: 13px;
        color: var(--text-secondary);
      }
      .bd-goal-plays { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
      .bd-goal-play-tag {
        font-size: 12px;
        padding: 2px 10px;
        background: var(--bg-subtle);
        border-radius: 12px;
        color: var(--text-primary);
      }
      .bd-countdown {
        text-align: center;
        font-size: 14px;
        color: var(--gold-dark);
        font-weight: 700;
        background: var(--gold-soft);
        border-radius: var(--radius-md);
        padding: 10px 16px;
        min-width: 80px;
        flex-shrink: 0;
      }
      .bd-countdown strong { font-size: 28px; display: block; line-height: 1.1; }
      .bd-countdown-past { background: var(--bg-subtle); color: var(--text-tertiary); }
      .bd-countdown-today { background: #fdebd0; color: #e67e22; }

      .bd-empty-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 18px 16px;
        background: var(--bg-subtle);
        border: 1px dashed var(--border-light);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: var(--text-secondary);
        font-size: 14px;
        transition: border-color 0.15s;
      }
      .bd-empty-card:hover { border-color: var(--gold); text-decoration: none; }
      .bd-empty-icon { font-size: 24px; }
      .bd-empty-arrow { margin-left: auto; font-size: 20px; color: var(--text-tertiary); }

      /* ── スケジュール ── */
      .bd-sched-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        margin-bottom: 8px;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .bd-sched-card:hover {
        border-color: var(--gold);
        box-shadow: var(--shadow-sm);
        text-decoration: none;
      }
      .bd-sched-unanswered { border-left: 3px solid var(--gold); }
      .bd-sched-date { flex-shrink: 0; min-width: 90px; }
      .bd-sched-month {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-primary);
      }
      .bd-sched-time {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 2px;
      }
      .bd-sched-info { flex: 1; min-width: 0; }
      .bd-sched-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .bd-sched-loc {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 2px;
      }
      .bd-sched-type {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        padding: 1px 8px;
        border-radius: 10px;
        margin-left: 6px;
        vertical-align: middle;
      }
      .bd-type-keiko { background: #e8f4fd; color: #2980b9; }
      .bd-type-honban { background: #fdebd0; color: #e67e22; }
      .bd-type-isho { background: #f5eef8; color: #8e44ad; }
      .bd-type-kaigi { background: #eafaf1; color: #27ae60; }
      .bd-type-other { background: var(--bg-subtle); color: var(--text-secondary); }
      .bd-sched-att { flex-shrink: 0; text-align: center; }
      .bd-att {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px; height: 28px;
        border-radius: 50%;
        font-size: 14px;
        font-weight: 700;
      }
      .bd-att-ok { background: #eafaf1; color: #27ae60; }
      .bd-att-maybe { background: #fef9e7; color: #f39c12; }
      .bd-att-ng { background: #fdedec; color: #e74c3c; }
      .bd-att-none { background: var(--bg-subtle); color: var(--text-tertiary); font-size: 11px; }
      .bd-more-hint {
        text-align: center;
        font-size: 12px;
        color: var(--text-tertiary);
        padding: 6px 0 2px;
      }

      /* ── 台本 ── */
      .bd-scripts-summary {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 10px;
        font-weight: 600;
      }
      .bd-script-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        margin-bottom: 6px;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.15s;
      }
      .bd-script-item:hover { border-color: var(--gold); text-decoration: none; }
      .bd-script-info { flex: 1; min-width: 0; }
      .bd-script-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .bd-script-play {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 2px;
      }
      .bd-script-date {
        font-size: 12px;
        color: var(--text-tertiary);
        flex-shrink: 0;
      }
      .bd-script-pinned {
        border-color: var(--gold-light);
        background: var(--gold-soft);
        flex-wrap: wrap;
        gap: 6px;
      }
      .bd-script-pin-badge {
        font-size: 11px;
        font-weight: 700;
        color: var(--gold-dark);
        background: var(--gold-light);
        padding: 1px 8px;
        border-radius: 10px;
        white-space: nowrap;
        flex-shrink: 0;
      }

      /* ── メンバー ── */
      .bd-members-bar {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 12px;
      }
      .bd-members-count {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        font-family: 'Noto Serif JP', serif;
      }
      .bd-members-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .bd-mem-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
      }
      .bd-mem-card.bd-mem-mgr {
        border-color: var(--gold-light);
        background: var(--gold-soft);
      }
      .bd-mem-avatar {
        width: 32px; height: 32px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
      }
      .bd-mem-avatar-ph {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--accent-2-soft);
        color: var(--accent-2);
        font-size: 14px;
        font-weight: 700;
      }
      .bd-mem-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
      }
      .bd-mem-role {
        font-size: 11px;
        color: var(--gold-dark);
        font-weight: 600;
      }
      .bd-members-alert {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        color: #e67e22;
        text-decoration: none;
        padding: 4px 12px;
        background: #fef9e7;
        border: 1px solid #fdebd0;
        border-radius: 16px;
        transition: all 0.15s;
      }
      .bd-members-alert:hover {
        background: #fdebd0;
        text-decoration: none;
      }
      .bd-alert-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px; height: 20px;
        border-radius: 10px;
        background: #e67e22;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        padding: 0 4px;
      }

      /* ── クイックリンク ── */
      .bd-quicklinks-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .bd-ql-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 14px 8px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: var(--text-primary);
        font-size: 12px;
        font-weight: 600;
        transition: all 0.15s;
        text-align: center;
      }
      .bd-ql-item:hover {
        border-color: var(--gold);
        background: var(--gold-soft);
        color: var(--gold-dark);
        text-decoration: none;
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }
      .bd-ql-icon { font-size: 22px; }
      .bd-ql-label { line-height: 1.3; }

      /* ── 共有ツール ── */
      .bd-shared-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .bd-shared-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 14px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: inherit;
        transition: all 0.18s;
        border-left: 4px solid transparent;
      }
      .bd-shared-card.accent-shared { border-left-color: var(--accent-3); }
      .bd-shared-card.accent-new { border-left-color: var(--gold); }
      .bd-shared-card:hover {
        border-color: var(--gold);
        border-left-color: var(--gold);
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
        text-decoration: none;
      }
      .bd-shared-icon { font-size: 26px; flex-shrink: 0; }
      .bd-shared-body { flex: 1; min-width: 0; }
      .bd-shared-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
      .bd-shared-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.4; }
      .bd-shared-arrow { font-size: 20px; color: var(--text-tertiary); flex-shrink: 0; }

      /* ── 師匠の一言 ── */
      .bd-hk-card {
        position: relative;
        background: linear-gradient(135deg, #fdfaf3 0%, #f9f0d8 100%);
        border: 1px solid var(--gold-light, #e6c94e);
        border-radius: var(--radius-md);
        padding: 20px 28px;
        text-align: center;
      }
      .bd-hk-deco {
        font-family: 'Noto Serif JP', serif;
        font-size: 28px;
        color: var(--gold-light, #e6c94e);
        line-height: 1;
        user-select: none;
        opacity: 0.6;
      }
      .bd-hk-deco-end { text-align: right; }
      .bd-hk-text {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 2;
        padding: 4px 0;
      }
      .bd-hk-meta {
        font-size: 11px;
        color: var(--text-tertiary);
        margin-top: 8px;
      }
      .bd-hk-edit {
        position: absolute;
        top: 8px; right: 10px;
        font-size: 11px;
        padding: 3px 10px;
        border: 1px solid var(--border-light);
        border-radius: 4px;
        background: rgba(255,255,255,0.7);
        color: var(--text-secondary);
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
      }
      .bd-hk-edit:hover { border-color: var(--gold); color: var(--gold-dark); }
      .bd-hk-empty {
        background: var(--bg-subtle);
        border: 2px dashed var(--border-light);
        border-radius: var(--radius-md);
        padding: 20px;
        text-align: center;
        cursor: pointer;
        color: var(--text-secondary);
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: border-color 0.15s;
      }
      .bd-hk-empty:hover { border-color: var(--gold); }
      .bd-hk-empty-icon { font-size: 24px; }
      .bd-hk-form {
        background: var(--bg-card);
        border: 2px solid var(--gold-light);
        border-radius: var(--radius-md);
        padding: 20px;
      }
      .bd-hk-form-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 12px;
      }
      .bd-hk-form textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        font-size: 14px;
        font-family: inherit;
        background: var(--bg-page);
        color: var(--text-primary);
        resize: vertical;
        box-sizing: border-box;
      }
      .bd-hk-form textarea:focus { border-color: var(--gold); outline: none; }
      .bd-hk-form-actions { display: flex; gap: 8px; margin-top: 12px; }
      .bd-hk-clear-btn {
        margin-left: auto;
        background: none;
        border: 1px solid var(--border-light);
        color: var(--text-tertiary);
        font-family: inherit;
        cursor: pointer;
        border-radius: var(--radius-sm);
        padding: 6px 14px;
        font-size: 13px;
        transition: all 0.15s;
      }
      .bd-hk-clear-btn:hover { border-color: var(--accent-1); color: var(--accent-1); }

      /* ── 最近のメモ ── */
      .bd-note-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        margin-bottom: 6px;
        text-decoration: none;
        color: inherit;
        transition: border-color 0.15s;
      }
      .bd-note-card:hover { border-color: var(--gold); text-decoration: none; }
      .bd-note-body { flex: 1; min-width: 0; }
      .bd-note-text {
        font-size: 13px;
        color: var(--text-primary);
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .bd-note-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
      .bd-note-tag {
        font-size: 10px;
        padding: 1px 8px;
        background: var(--gold-soft, #fdf6e3);
        color: var(--gold-dark, #a0850a);
        border-radius: 10px;
      }
      .bd-note-date {
        font-size: 11px;
        color: var(--text-tertiary);
        flex-shrink: 0;
        white-space: nowrap;
      }
      .bd-note-video {
        font-size: 14px;
        flex-shrink: 0;
      }

      /* ── レスポンシブ ── */
      @media (max-width: 600px) {
        .bd-header-top { flex-direction: column; align-items: flex-start; }
        .bd-shared-grid { grid-template-columns: 1fr; }
        .bd-quicklinks-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .bd-ql-item { padding: 12px 6px; font-size: 11px; }
        .bd-ql-icon { font-size: 20px; }
        .bd-goal-main { flex-direction: column; align-items: stretch; }
        .bd-countdown { text-align: center; }
        .bd-sched-card { gap: 10px; padding: 12px; }
        .bd-sched-date { min-width: 78px; }
        .bd-sched-month { font-size: 12px; }
      }
      @media (max-width: 380px) {
        .bd-quicklinks-grid { grid-template-columns: repeat(2, 1fr); }
        .bd-ql-item { padding: 10px 6px; font-size: 11px; }
        .bd-ql-icon { font-size: 18px; }
      }
    </style>`
  });
}
