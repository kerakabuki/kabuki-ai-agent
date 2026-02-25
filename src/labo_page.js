// src/labo_page.js
// =========================================================
// LABO — 演目エディタ
// 演目ガイドの新規作成・編集を行うページ（LABOハブから遷移）
// =========================================================
import { pageShell } from "./web_layout.js";

export function laboEnmokuPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>›</span><a href="/jikabuki/labo">LABO</a><span>›</span><span>演目エディタ</span>
    </div>

    <section class="labo-intro fade-up">
      <h2 class="labo-title">演目エディタ</h2>
      <p class="labo-desc">
        演目ガイドの新規作成・編集ができます。
      </p>
    </section>

    <!-- モード選択 -->
    <section class="labo-section fade-up" id="labo-mode">
      <div class="labo-mode-grid">
        <button class="labo-mode-btn" id="btn-new" onclick="LaboEditor.switchMode('new')">
          <span class="labo-mode-icon">✏️</span>
          <span class="labo-mode-label">新規作成</span>
        </button>
        <button class="labo-mode-btn" id="btn-edit" onclick="LaboEditor.switchMode('edit')">
          <span class="labo-mode-icon">📝</span>
          <span class="labo-mode-label">既存を編集</span>
        </button>
        <button class="labo-mode-btn" id="btn-missed" onclick="LaboEditor.switchMode('missed')">
          <span class="labo-mode-icon">🎯</span>
          <span class="labo-mode-label">未整備候補</span>
        </button>
      </div>
    </section>

    <!-- 既存演目選択 -->
    <section class="labo-section fade-up" id="labo-select" style="display:none">
      <div class="labo-select-header">
        <h3 class="labo-section-title">編集する演目を選択</h3>
        <input type="text" id="labo-search" class="labo-input" placeholder="演目名で検索…" oninput="LaboEditor.filterList()">
      </div>
      <div id="labo-catalog-list" class="labo-catalog-list"></div>
    </section>

    <!-- 未整備候補 -->
    <section class="labo-section fade-up" id="labo-missed" style="display:none">
      <h3 class="labo-section-title">🎯 来月の未整備候補</h3>
      <p class="labo-hint">NAVIにガイドがなく、スケジュールに登場する演目です。ここから新規作成できます。</p>
      <div id="labo-missed-list" class="labo-catalog-list"></div>
    </section>

    <!-- エディタ本体 -->
    <section class="labo-section fade-up" id="labo-editor" style="display:none">
      <div class="labo-editor-header">
        <h3 class="labo-section-title" id="editor-title">新規演目ガイド</h3>
        <div class="labo-editor-actions">
          <button class="labo-btn labo-btn-secondary" onclick="LaboEditor.preview()">プレビュー</button>
          <button class="labo-btn labo-btn-primary" onclick="LaboEditor.save()">💾 保存</button>
        </div>
      </div>

      <div id="labo-save-status" class="labo-save-status" style="display:none"></div>

      <!-- 編集権限なしの場合 -->
      <div class="labo-editor-request" id="labo-editor-request" style="display:none">
        <div class="labo-request-inner">
          <span class="labo-request-icon">🔒</span>
          <div class="labo-request-text">
            <strong>編集には承認が必要です</strong>
            <span id="labo-request-status">管理者に編集権限を申請してください。</span>
          </div>
          <button class="labo-btn labo-btn-secondary" id="labo-request-btn" onclick="LaboEditor.requestAccess()">編集権限を申請</button>
        </div>
      </div>

      <!-- 執筆者 -->
      <div class="labo-author-bar" id="labo-author-bar">
        <span class="labo-author-icon" id="labo-author-icon">👤</span>
        <span class="labo-author-info">
          <span class="labo-author-label">執筆者</span>
          <span class="labo-author-name" id="labo-author-name">未ログイン</span>
        </span>
        <input type="text" id="f-author-nickname" class="labo-input labo-author-nickname" placeholder="ニックネーム（表示名）" style="display:none">
        <button class="labo-btn-small" id="labo-login-btn" onclick="openLoginModal()" style="display:none">ログインして記録</button>
      </div>

      <!-- ID -->
      <div class="labo-field">
        <label class="labo-label">演目ID <span class="labo-required">*</span></label>
        <input type="text" id="f-id" class="labo-input" placeholder="例: kanjincho（半角英数、ファイル名になります）">
        <span class="labo-hint">R2上の {ID}.json として保存されます。既存IDを指定すると上書きします。</span>
      </div>

      <!-- タイトル -->
      <div class="labo-field-row">
        <div class="labo-field">
          <label class="labo-label">タイトル（正式名） <span class="labo-required">*</span></label>
          <input type="text" id="f-title" class="labo-input" placeholder="例: 仮名手本忠臣蔵七段目　祇園一力茶屋">
        </div>
        <div class="labo-field">
          <label class="labo-label">短縮タイトル</label>
          <input type="text" id="f-title-short" class="labo-input" placeholder="例: 祇園一力茶屋（省略可）">
        </div>
      </div>

      <!-- カタログ用 -->
      <div class="labo-field-row">
        <div class="labo-field">
          <label class="labo-label">グループ</label>
          <input type="text" id="f-group" class="labo-input" placeholder="例: 仮名手本忠臣蔵（シリーズでまとめる場合）">
        </div>
        <div class="labo-field">
          <label class="labo-label">ソートキー</label>
          <input type="text" id="f-sort-key" class="labo-input" placeholder="例: かなでほんちゅうしんぐら">
        </div>
      </div>

      <!-- あらすじ -->
      <div class="labo-field">
        <label class="labo-label">📖 あらすじ</label>
        <textarea id="f-synopsis" class="labo-textarea" rows="8" placeholder="物語のあらすじを入力…"></textarea>
      </div>

      <!-- みどころ -->
      <div class="labo-field">
        <label class="labo-label">🌟 みどころ</label>
        <textarea id="f-highlights" class="labo-textarea" rows="6" placeholder="この演目のみどころを入力…"></textarea>
      </div>

      <!-- 作品情報 -->
      <div class="labo-field">
        <label class="labo-label">📝 作品情報</label>
        <div class="labo-info-fields" id="f-info-fields"></div>
        <button class="labo-btn-small" onclick="LaboEditor.addInfoRow()">＋ 項目を追加</button>
      </div>

      <!-- 登場人物 -->
      <div class="labo-field">
        <label class="labo-label">🎭 登場人物</label>
        <div id="f-cast-fields" class="labo-cast-fields"></div>
        <button class="labo-btn-small" onclick="LaboEditor.addCastRow()">＋ 人物を追加</button>
      </div>

      <!-- 保存ボタン（下部） -->
      <div class="labo-editor-footer">
        <button class="labo-btn labo-btn-secondary" id="btn-preview-bottom" onclick="LaboEditor.preview()">プレビュー</button>
        <button class="labo-btn labo-btn-primary" id="btn-save-bottom" onclick="LaboEditor.save()">💾 保存</button>
      </div>
    </section>

    <!-- プレビューモーダル -->
    <div id="labo-preview-overlay" class="labo-preview-overlay" style="display:none" onclick="if(event.target===this)LaboEditor.closePreview()">
      <div class="labo-preview-panel">
        <div class="labo-preview-header">
          <span>プレビュー</span>
          <button class="labo-preview-close" onclick="LaboEditor.closePreview()">✕</button>
        </div>
        <div id="labo-preview-body" class="labo-preview-body"></div>
      </div>
    </div>

    <script>
    (function() {
      var catalogData = [];
      var currentMode = '';
      var currentUser = null;

      var INFO_TEMPLATE = [
        { key: '原作',     placeholder: '例: 仮名手本忠臣蔵' },
        { key: '作者',     placeholder: '例: 竹田出雲／三好松洛／並木千柳' },
        { key: '初演',     placeholder: '例: 1748年（寛延元年）8月 大坂・竹本座' },
        { key: '種別',     placeholder: '時代物 / 世話物 / 舞踊 / 新歌舞伎 など' },
        { key: '上演時間', placeholder: '例: 約90分（目安）' },
        { key: '別名・通称', placeholder: '例: 祇園一力茶屋' },
      ];

      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

      function switchMode(mode) {
        currentMode = mode;
        document.querySelectorAll('.labo-mode-btn').forEach(function(b) { b.classList.remove('active'); });
        document.getElementById('labo-select').style.display = 'none';
        document.getElementById('labo-missed').style.display = 'none';
        document.getElementById('labo-editor').style.display = 'none';

        if (mode === 'new') {
          document.getElementById('btn-new').classList.add('active');
          document.getElementById('labo-editor').style.display = '';
          document.getElementById('editor-title').textContent = '新規演目ガイド';
          clearForm();
          document.getElementById('f-id').removeAttribute('readonly');
          updateEditorUI();
        } else if (mode === 'edit') {
          document.getElementById('btn-edit').classList.add('active');
          document.getElementById('labo-select').style.display = '';
          loadCatalog();
        } else if (mode === 'missed') {
          document.getElementById('btn-missed').classList.add('active');
          document.getElementById('labo-missed').style.display = '';
          loadMissed();
        }
      }

      function clearForm() {
        ['f-id','f-title','f-title-short','f-group','f-sort-key'].forEach(function(id) {
          document.getElementById(id).value = '';
        });
        document.getElementById('f-synopsis').value = '';
        document.getElementById('f-highlights').value = '';
        // info: テンプレートに戻す
        var infoEl = document.getElementById('f-info-fields');
        infoEl.innerHTML = buildInfoTemplate(null);
        // cast: 空にする
        document.getElementById('f-cast-fields').innerHTML = '';
        // authors: リセット
        window._existingAuthors = [];
        var historyEl = document.querySelector('.labo-author-history');
        if (historyEl) historyEl.remove();
        hideSaveStatus();
      }

      function infoRow(key, val, opts) {
        opts = opts || {};
        var ph = opts.placeholder || '内容を入力';
        var isTemplate = opts.isTemplate;
        var keyInput = isTemplate
          ? '<span class="labo-info-key-fixed">' + esc(key) + '<\\/span><input type="hidden" class="labo-info-key" value="' + esc(key) + '">'
          : '<input type="text" class="labo-input labo-info-key" placeholder="項目名" value="' + esc(key) + '">';
        var delBtn = isTemplate
          ? ''
          : '<button class="labo-row-del" onclick="this.parentNode.remove()" title="削除">✕<\\/button>';
        return '<div class="labo-info-row' + (isTemplate ? ' is-template' : '') + '">'
          + keyInput
          + '<input type="text" class="labo-input labo-info-val" placeholder="' + esc(ph) + '" value="' + esc(val) + '">'
          + delBtn
          + '<\\/div>';
      }

      function buildInfoTemplate(existing) {
        var rows = [];
        var used = {};
        INFO_TEMPLATE.forEach(function(t) {
          var val = (existing && existing[t.key]) || '';
          rows.push(infoRow(t.key, val, { placeholder: t.placeholder, isTemplate: true }));
          used[t.key] = true;
        });
        if (existing) {
          Object.keys(existing).forEach(function(k) {
            if (!used[k]) rows.push(infoRow(k, existing[k], {}));
          });
        }
        return rows.join('');
      }

      function castRow(id, name, desc) {
        return '<div class="labo-cast-row">'
          + '<div class="labo-cast-top">'
          + '<input type="text" class="labo-input labo-cast-id" placeholder="ID（例: benkei）" value="' + esc(id) + '">'
          + '<input type="text" class="labo-input labo-cast-name" placeholder="名前（例: 武蔵坊弁慶）" value="' + esc(name) + '">'
          + '<button class="labo-row-del" onclick="this.closest(\\'.labo-cast-row\\').remove()" title="削除">✕<\\/button>'
          + '<\\/div>'
          + '<textarea class="labo-textarea labo-cast-desc" rows="3" placeholder="人物の説明…">' + esc(desc) + '<\\/textarea>'
          + '<\\/div>';
      }

      function addInfoRow() {
        var el = document.getElementById('f-info-fields');
        el.insertAdjacentHTML('beforeend', infoRow('',''));
      }

      function addCastRow() {
        var el = document.getElementById('f-cast-fields');
        el.insertAdjacentHTML('beforeend', castRow('','',''));
      }

      /* ── カタログ読み込み ── */
      function loadCatalog() {
        var listEl = document.getElementById('labo-catalog-list');
        listEl.innerHTML = '<div class="loading">読み込み中…<\\/div>';
        fetch('/api/enmoku/titles')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            catalogData = data || [];
            renderCatalogList(catalogData);
          })
          .catch(function() {
            listEl.innerHTML = '<div class="empty-state">カタログの読み込みに失敗しました。<\\/div>';
          });
      }

      function renderCatalogList(list) {
        var el = document.getElementById('labo-catalog-list');
        if (!list.length) { el.innerHTML = '<div class="empty-state">演目がありません。<\\/div>'; return; }
        el.innerHTML = list.map(function(e) {
          return '<div class="labo-catalog-item" onclick="LaboEditor.loadEnmoku(\\'' + esc(e.id) + '\\')">'
            + '<span class="labo-catalog-title">' + esc(e.short || e.id) + '<\\/span>'
            + (e.full && e.full !== e.short ? '<span class="labo-catalog-full">' + esc(e.full) + '<\\/span>' : '')
            + '<span class="labo-catalog-id">' + esc(e.id) + '<\\/span>'
            + '<\\/div>';
        }).join('');
      }

      function filterList() {
        var q = (document.getElementById('labo-search').value || '').trim().toLowerCase();
        if (!q) { renderCatalogList(catalogData); return; }
        var filtered = catalogData.filter(function(e) {
          return (e.short||'').toLowerCase().indexOf(q) >= 0
            || (e.full||'').toLowerCase().indexOf(q) >= 0
            || (e.id||'').toLowerCase().indexOf(q) >= 0;
        });
        renderCatalogList(filtered);
      }

      /* ── 未整備候補読み込み ── */
      function loadMissed() {
        var el = document.getElementById('labo-missed-list');
        el.innerHTML = '<div class="loading">読み込み中…<\\/div>';
        fetch('/api/missed')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var items = (data && data.missed) || [];
            if (!items.length) {
              el.innerHTML = '<div class="empty-state">未整備候補はありません。<\\/div>';
              return;
            }
            el.innerHTML = items.map(function(m) {
              var titles = (m.rawTitles || []).join('、');
              return '<div class="labo-catalog-item labo-missed-item" onclick="LaboEditor.newFromMissed(\\'' + esc(titles.split('、')[0]) + '\\')">'
                + '<span class="labo-catalog-title">' + esc(titles) + '<\\/span>'
                + '<span class="labo-catalog-full">' + esc((m.theaters||[]).join('・')) + ' ／ 登場' + m.count + '回<\\/span>'
                + '<span class="labo-missed-badge">ガイド未整備<\\/span>'
                + '<\\/div>';
            }).join('');
          })
          .catch(function() {
            el.innerHTML = '<div class="empty-state">読み込みに失敗しました。<\\/div>';
          });
      }

      function newFromMissed(title) {
        switchMode('new');
        document.getElementById('f-title').value = title;
        var id = title.replace(/[\\s\\u3000]/g,'').toLowerCase();
        document.getElementById('f-id').value = '';
        document.getElementById('f-id').focus();
      }

      /* ── 既存演目ロード ── */
      function loadEnmoku(id) {
        showSaveStatus('読み込み中…', 'info');
        fetch('/api/enmoku/' + encodeURIComponent(id))
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.error) { showSaveStatus('演目が見つかりません: ' + id, 'error'); return; }
            fillForm(id, data);
            document.getElementById('labo-select').style.display = 'none';
            document.getElementById('labo-editor').style.display = '';
            document.getElementById('editor-title').textContent = '編集: ' + (data.title || id);
            document.getElementById('f-id').setAttribute('readonly', 'readonly');
            hideSaveStatus();
            updateEditorUI();
          })
          .catch(function(e) { showSaveStatus('読み込みエラー: ' + e, 'error'); });
      }

      function fillForm(id, data) {
        document.getElementById('f-id').value = id;
        document.getElementById('f-title').value = data.title || '';
        document.getElementById('f-title-short').value = data.title_short || '';
        document.getElementById('f-group').value = data._catalog_group || '';
        document.getElementById('f-sort-key').value = data._catalog_sort_key || '';

        // 既存の執筆者情報を保持
        if (data.authors && data.authors.length) {
          window._existingAuthors = data.authors;
          var bar = document.getElementById('labo-author-bar');
          if (bar) {
            var history = '<div class="labo-author-history">';
            history += '<span class="labo-author-history-label">執筆履歴:</span>';
            data.authors.forEach(function(a) {
              var d = a.updatedAt ? new Date(a.updatedAt) : null;
              var ds = d ? (d.getMonth()+1) + '/' + d.getDate() : '';
              history += '<span class="labo-author-chip">' + esc(a.displayName || '匿名') + (ds ? ' <small>' + ds + '<\\/small>' : '') + '<\\/span>';
            });
            history += '<\\/div>';
            var existing = bar.querySelector('.labo-author-history');
            if (existing) existing.remove();
            bar.insertAdjacentHTML('beforeend', history);
          }
          // 自分の既存ニックネームをニックネーム欄に反映
          if (currentUser) {
            var myEntry = data.authors.find(function(a) { return a.userId === currentUser.userId; });
            var nickEl = document.getElementById('f-author-nickname');
            if (myEntry && nickEl) nickEl.value = myEntry.displayName || currentUser.displayName || '';
          }
        } else {
          window._existingAuthors = [];
        }
        document.getElementById('f-synopsis').value = data.synopsis || (data.sections && data.sections.synopsis) || '';
        document.getElementById('f-highlights').value = data.highlights || (data.sections && data.sections.highlights) || '';

        // info
        var infoEl = document.getElementById('f-info-fields');
        var infoData = data.info || (data.sections && data.sections.info) || {};
        if (typeof infoData === 'string') {
          var parsed = {};
          infoData.split('\\n').forEach(function(line) {
            var m = line.replace(/^[-・]\s*/, '').match(/^(.+?)[：:](.+)$/);
            if (m) parsed[m[1].trim()] = m[2].trim();
          });
          if (Object.keys(parsed).length > 0) {
            infoEl.innerHTML = buildInfoTemplate(parsed);
          } else {
            infoEl.innerHTML = buildInfoTemplate(null);
            infoEl.insertAdjacentHTML('beforeend', infoRow('作品情報', infoData, {}));
          }
        } else if (typeof infoData === 'object') {
          infoEl.innerHTML = buildInfoTemplate(Object.keys(infoData).length ? infoData : null);
        }

        // cast
        var castEl = document.getElementById('f-cast-fields');
        var castData = data.cast || (data.sections && data.sections.cast) || [];
        castEl.innerHTML = castData.map(function(c) {
          return castRow(c.id || '', c.name || '', c.desc || '');
        }).join('');
      }

      /* ── フォーム → JSON ── */
      function buildJSON() {
        var id = (document.getElementById('f-id').value || '').trim();
        var title = (document.getElementById('f-title').value || '').trim();
        if (!id) { showSaveStatus('演目IDを入力してください', 'error'); return null; }
        if (!title) { showSaveStatus('タイトルを入力してください', 'error'); return null; }

        var titleShort = (document.getElementById('f-title-short').value || '').trim();
        var group = (document.getElementById('f-group').value || '').trim();
        var sortKey = (document.getElementById('f-sort-key').value || '').trim();

        var obj = { title: title };
        if (titleShort && titleShort !== title) obj.title_short = titleShort;

        var syn = (document.getElementById('f-synopsis').value || '').trim();
        if (syn) obj.synopsis = syn;

        var hl = (document.getElementById('f-highlights').value || '').trim();
        if (hl) obj.highlights = hl;

        // info
        var infoRows = document.querySelectorAll('#f-info-fields .labo-info-row');
        var info = {};
        var hasInfo = false;
        infoRows.forEach(function(row) {
          var k = row.querySelector('.labo-info-key').value.trim();
          var v = row.querySelector('.labo-info-val').value.trim();
          if (k && v) { info[k] = v; hasInfo = true; }
        });
        if (hasInfo) obj.info = info;

        // cast
        var castRows = document.querySelectorAll('#f-cast-fields .labo-cast-row');
        var cast = [];
        castRows.forEach(function(row) {
          var cid = row.querySelector('.labo-cast-id').value.trim();
          var cname = row.querySelector('.labo-cast-name').value.trim();
          var cdesc = row.querySelector('.labo-cast-desc').value.trim();
          if (cname) {
            cast.push({ id: cid || cname.replace(/[\\s（()）]/g,'').toLowerCase(), name: cname, desc: cdesc });
          }
        });
        if (cast.length) obj.cast = cast;

        // catalog metadata
        obj._catalog_group = group || null;
        obj._catalog_sort_key = sortKey || null;

        // 執筆者情報（既存の authors を引き継ぎ）
        obj.authors = (window._existingAuthors || []).slice();
        if (currentUser) {
          var nickname = (document.getElementById('f-author-nickname').value || '').trim();
          var authorName = nickname || currentUser.displayName || '';
          var now = new Date().toISOString();
          var existingAuthor = obj.authors.find(function(a) { return a.userId === currentUser.userId; });
          if (existingAuthor) {
            existingAuthor.updatedAt = now;
            existingAuthor.displayName = authorName;
          } else {
            obj.authors.push({
              userId: currentUser.userId,
              displayName: authorName,
              provider: currentUser.provider || '',
              addedAt: now,
              updatedAt: now
            });
          }
        }

        return { id: id, data: obj };
      }

      /* ── 保存 ── */
      function save() {
        if (!isEditorUser) {
          showSaveStatus('編集権限がありません。申請してください。', 'error');
          return;
        }
        var result = buildJSON();
        if (!result) return;

        showSaveStatus('保存中…', 'info');
        fetch('/api/enmoku/' + encodeURIComponent(result.id), {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.data)
        })
        .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
        .then(function(res) {
          if (res.ok) {
            showSaveStatus('✅ 保存しました（' + result.id + '.json）', 'success');
            document.getElementById('f-id').setAttribute('readonly', 'readonly');
          } else {
            var msg = res.data.error || 'unknown';
            if (msg.indexOf('権限') >= 0) msg = '🔒 ' + msg;
            showSaveStatus('❌ ' + msg, 'error');
          }
        })
        .catch(function(e) { showSaveStatus('❌ 通信エラー: ' + e, 'error'); });
      }

      /* ── プレビュー ── */
      function preview() {
        var result = buildJSON();
        if (!result) return;
        var d = result.data;
        var h = '<div class="preview-content">';
        h += '<h2>' + esc(d.title) + '<\\/h2>';
        if (d.title_short && d.title_short !== d.title) h += '<p class="preview-sub">' + esc(d.title_short) + '<\\/p>';

        if (d.synopsis) {
          h += '<h3>📖 あらすじ<\\/h3>';
          h += '<p>' + esc(d.synopsis).replace(/\\n/g, '<br>') + '<\\/p>';
        }
        if (d.highlights) {
          h += '<h3>🌟 みどころ<\\/h3>';
          h += '<p>' + esc(d.highlights).replace(/\\n/g, '<br>') + '<\\/p>';
        }
        if (d.info) {
          h += '<h3>📝 作品情報<\\/h3>';
          if (typeof d.info === 'object') {
            h += '<table class="preview-info">';
            Object.keys(d.info).forEach(function(k) {
              h += '<tr><th>' + esc(k) + '<\\/th><td>' + esc(d.info[k]) + '<\\/td><\\/tr>';
            });
            h += '<\\/table>';
          } else {
            h += '<p>' + esc(d.info) + '<\\/p>';
          }
        }
        if (d.cast && d.cast.length) {
          h += '<h3>🎭 登場人物（' + d.cast.length + '人）<\\/h3>';
          d.cast.forEach(function(c) {
            h += '<div class="preview-cast">';
            h += '<strong>' + esc(c.name) + '<\\/strong>';
            if (c.desc) h += '<p>' + esc(c.desc).replace(/\\n/g, '<br>') + '<\\/p>';
            h += '<\\/div>';
          });
        }
        if (d.authors && d.authors.length) {
          h += '<div class="preview-authors">';
          h += '<span class="preview-authors-label">✍️ 執筆:<\\/span> ';
          h += d.authors.map(function(a) { return esc(a.displayName || '匿名'); }).join('、');
          h += '<\\/div>';
        }
        h += '<\\/div>';

        document.getElementById('labo-preview-body').innerHTML = h;
        document.getElementById('labo-preview-overlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      function closePreview() {
        document.getElementById('labo-preview-overlay').style.display = 'none';
        document.body.style.overflow = '';
      }

      /* ── ステータス（固定トースト + インライン） ── */
      var _toastTimer = null;
      function showSaveStatus(msg, type) {
        var el = document.getElementById('labo-save-status');
        el.style.display = '';
        el.className = 'labo-save-status labo-status-' + type;
        el.textContent = msg;

        var toast = document.getElementById('labo-toast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'labo-toast';
          document.body.appendChild(toast);
        }
        toast.className = 'labo-toast labo-toast-' + type;
        toast.textContent = msg;
        toast.style.display = '';
        toast.style.opacity = '1';
        if (_toastTimer) clearTimeout(_toastTimer);
        if (type === 'success' || type === 'error') {
          _toastTimer = setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { toast.style.display = 'none'; }, 300);
          }, 3000);
        }
      }
      function hideSaveStatus() {
        document.getElementById('labo-save-status').style.display = 'none';
        var toast = document.getElementById('labo-toast');
        if (toast) toast.style.display = 'none';
      }

      /* ── 認証チェック → 執筆者表示 + 権限制御 ── */
      var isEditorUser = false;

      function updateEditorUI() {
        var saveBtns = document.querySelectorAll('.labo-btn-primary');
        var requestBar = document.getElementById('labo-editor-request');
        if (isEditorUser) {
          saveBtns.forEach(function(b) { b.style.display = ''; });
          if (requestBar) requestBar.style.display = 'none';
        } else {
          saveBtns.forEach(function(b) { b.style.display = 'none'; });
          if (requestBar) requestBar.style.display = '';
        }
      }

      function requestAccess() {
        fetch('/api/editor/request', { method: 'POST', credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            var el = document.getElementById('labo-request-status');
            if (data.ok) {
              if (data.status === 'already_approved') {
                isEditorUser = true;
                updateEditorUI();
                if (el) el.textContent = '承認済みです！';
              } else {
                if (el) el.textContent = '申請しました。承認をお待ちください。';
              }
              var btn = document.getElementById('labo-request-btn');
              if (btn) btn.style.display = 'none';
            }
          })
          .catch(function() {});
      }

      function checkAuth() {
        fetch('/api/auth/me', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.loggedIn && data.user) {
              currentUser = data.user;
              isEditorUser = !!data.user.isEditor;
              var nameEl = document.getElementById('labo-author-name');
              var iconEl = document.getElementById('labo-author-icon');
              var loginBtn = document.getElementById('labo-login-btn');
              if (nameEl) nameEl.textContent = currentUser.displayName || currentUser.email || 'ログイン済み';
              if (iconEl && currentUser.pictureUrl) {
                iconEl.innerHTML = '<img src="' + esc(currentUser.pictureUrl) + '" class="labo-author-avatar">';
              }
              if (loginBtn) loginBtn.style.display = 'none';
              var nicknameEl = document.getElementById('f-author-nickname');
              if (nicknameEl) {
                nicknameEl.style.display = '';
                nicknameEl.value = currentUser.displayName || '';
              }
              updateEditorUI();
              if (!isEditorUser && data.user.editorRequested) {
                var statusEl = document.getElementById('labo-request-status');
                if (statusEl) statusEl.textContent = '申請中です。承認をお待ちください。';
                var reqBtn = document.getElementById('labo-request-btn');
                if (reqBtn) reqBtn.style.display = 'none';
              }
            } else {
              var loginBtn2 = document.getElementById('labo-login-btn');
              if (loginBtn2) loginBtn2.style.display = '';
              updateEditorUI();
            }
          })
          .catch(function() {});
      }
      checkAuth();

      // 初期表示: テンプレート行を描画
      document.getElementById('f-info-fields').innerHTML = buildInfoTemplate(null);

      window.LaboEditor = {
        switchMode: switchMode,
        filterList: filterList,
        loadEnmoku: loadEnmoku,
        newFromMissed: newFromMissed,
        addInfoRow: addInfoRow,
        addCastRow: addCastRow,
        save: save,
        preview: preview,
        closePreview: closePreview,
        requestAccess: requestAccess
      };

      // 下部ボタン用フォールバック（onclick が効かない環境対策）
      var btnSaveBottom = document.getElementById('btn-save-bottom');
      if (btnSaveBottom) btnSaveBottom.addEventListener('click', function(e) { e.preventDefault(); save(); });
      var btnPreviewBottom = document.getElementById('btn-preview-bottom');
      if (btnPreviewBottom) btnPreviewBottom.addEventListener('click', function(e) { e.preventDefault(); preview(); });
    })();
    </script>
  `;

  return pageShell({
    title: "LABO - 演目エディタ",
    subtitle: "演目ガイドの新規作成・編集",
    bodyHTML,
    activeNav: "labo",
    brand: "jikabuki",
    googleClientId,
    headExtra: `<style>
      .labo-intro {
        text-align: center;
        padding: 24px 16px 20px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 20px;
      }
      .labo-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 8px;
      }
      .labo-desc {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.8;
      }
      .labo-section { margin-bottom: 24px; }
      .labo-section-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 12px;
      }

      /* モード選択 */
      .labo-mode-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .labo-mode-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 16px 8px;
        background: var(--bg-card);
        border: 2px solid var(--border-light);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
      }
      .labo-mode-btn:hover {
        border-color: var(--gold);
        background: var(--gold-soft, #fdf8ec);
      }
      .labo-mode-btn.active {
        border-color: var(--gold);
        background: var(--gold-soft, #fdf8ec);
        box-shadow: 0 0 0 1px var(--gold);
      }
      .labo-mode-icon { font-size: 24px; }
      .labo-mode-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }

      /* カタログリスト */
      .labo-select-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .labo-select-header .labo-section-title { margin: 0; white-space: nowrap; }
      .labo-select-header .labo-input { flex: 1; }
      .labo-catalog-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 400px;
        overflow-y: auto;
      }
      .labo-catalog-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s;
      }
      .labo-catalog-item:hover {
        border-color: var(--gold);
        background: var(--gold-soft, #fdf8ec);
      }
      .labo-catalog-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--text-primary);
      }
      .labo-catalog-full {
        font-size: 12px;
        color: var(--text-tertiary);
        flex: 1;
      }
      .labo-catalog-id {
        font-size: 11px;
        color: var(--text-tertiary);
        background: var(--bg-subtle);
        padding: 2px 8px;
        border-radius: 4px;
        font-family: monospace;
      }
      .labo-missed-badge {
        font-size: 10px;
        font-weight: 600;
        color: var(--accent-1, #c0392b);
        background: rgba(192,57,43,.08);
        padding: 2px 8px;
        border-radius: 10px;
        white-space: nowrap;
      }

      /* 権限申請バー */
      .labo-editor-request {
        margin-bottom: 16px;
      }
      .labo-request-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        background: #fef3cd;
        border: 1px solid #f0d78c;
        border-radius: 10px;
        flex-wrap: wrap;
      }
      .labo-request-icon { font-size: 22px; flex-shrink: 0; }
      .labo-request-text {
        flex: 1; min-width: 200px;
        display: flex; flex-direction: column; gap: 2px;
      }
      .labo-request-text strong { font-size: 14px; color: #856404; }
      .labo-request-text span { font-size: 12px; color: #856404; }

      /* 執筆者バー */
      .labo-author-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .labo-author-icon {
        font-size: 20px;
        flex-shrink: 0;
      }
      .labo-author-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        object-fit: cover;
        vertical-align: middle;
      }
      .labo-author-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;
        min-width: 0;
      }
      .labo-author-label {
        font-size: 10px;
        color: var(--text-tertiary);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .labo-author-nickname {
        max-width: 180px;
        padding: 6px 10px;
        font-size: 13px;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        background: white;
      }
      .labo-author-nickname:focus {
        border-color: var(--gold);
        outline: none;
        box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
      }
      .labo-author-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .labo-author-history {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
        padding-top: 8px;
        border-top: 1px dashed var(--border-light);
      }
      .labo-author-history-label {
        font-size: 11px;
        color: var(--text-tertiary);
        white-space: nowrap;
      }
      .labo-author-chip {
        font-size: 12px;
        color: var(--gold-dark);
        background: var(--gold-soft, #fdf8ec);
        border: 1px solid var(--gold-light, #e8d5a0);
        border-radius: 20px;
        padding: 2px 10px;
        white-space: nowrap;
      }
      .labo-author-chip small {
        color: var(--text-tertiary);
        font-size: 10px;
        margin-left: 2px;
      }

      /* エディタ */
      .labo-editor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .labo-editor-actions { display: flex; gap: 8px; }
      .labo-editor-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--border-light);
        position: relative;
        z-index: 10;
      }
      .labo-field { margin-bottom: 16px; }
      .labo-field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .labo-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }
      .labo-required { color: var(--accent-1, #c0392b); }
      .labo-input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 12px;
        font-size: 14px;
        font-family: inherit;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        background: var(--bg-card);
        color: var(--text-primary);
        transition: border-color 0.15s;
      }
      .labo-input:focus { outline: none; border-color: var(--gold); }
      .labo-input[readonly] { background: var(--bg-subtle); color: var(--text-tertiary); }
      .labo-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        font-size: 14px;
        font-family: inherit;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        background: var(--bg-card);
        color: var(--text-primary);
        resize: vertical;
        line-height: 1.7;
        transition: border-color 0.15s;
      }
      .labo-textarea:focus { outline: none; border-color: var(--gold); }
      .labo-hint {
        font-size: 11px;
        color: var(--text-tertiary);
        margin-top: 4px;
        line-height: 1.5;
      }

      /* info行 */
      .labo-info-row {
        display: flex;
        gap: 8px;
        margin-bottom: 6px;
        align-items: center;
      }
      .labo-info-key { width: 30%; flex-shrink: 0; }
      .labo-info-key-fixed {
        width: 30%; flex-shrink: 0;
        font-size: .95rem; font-weight: 600;
        color: #c0392b; padding: 8px 4px;
        white-space: nowrap;
      }
      .labo-info-row.is-template { background: rgba(192,57,43,.04); border-radius: 6px; padding: 2px 4px; }
      .labo-info-val { flex: 1; }
      .labo-row-del {
        background: none;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
        font-size: 14px;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.15s;
        flex-shrink: 0;
      }
      .labo-row-del:hover { color: var(--accent-1); background: rgba(192,57,43,.08); }

      /* cast行 */
      .labo-cast-row {
        background: var(--bg-subtle);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        padding: 10px;
        margin-bottom: 8px;
      }
      .labo-cast-top {
        display: flex;
        gap: 8px;
        margin-bottom: 6px;
        align-items: center;
      }
      .labo-cast-id { width: 30%; }
      .labo-cast-name { flex: 1; }
      .labo-cast-desc { font-size: 13px; }

      /* ボタン */
      .labo-btn {
        padding: 8px 20px;
        font-size: 14px;
        font-weight: 600;
        font-family: inherit;
        border: none;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s;
      }
      .labo-btn-primary {
        background: var(--gold);
        color: #fff;
      }
      .labo-btn-primary:hover { background: var(--gold-dark); }
      .labo-btn-secondary {
        background: var(--bg-subtle);
        color: var(--text-secondary);
        border: 1px solid var(--border-light);
      }
      .labo-btn-secondary:hover {
        background: var(--gold-soft, #fdf8ec);
        border-color: var(--gold);
        color: var(--gold-dark);
      }
      .labo-btn-small {
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
        margin-top: 4px;
      }
      .labo-btn-small:hover {
        border-color: var(--gold);
        color: var(--gold-dark);
      }

      /* ステータス */
      .labo-save-status {
        padding: 10px 14px;
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .labo-status-info { background: #e8f4fd; color: #1a6fb5; }
      .labo-status-success { background: #e8f8e8; color: #1a7a2a; }
      .labo-status-error { background: #fde8e8; color: #b51a1a; }

      /* 固定トースト通知 */
      .labo-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 9000;
        transition: opacity 0.3s;
        pointer-events: none;
      }
      .labo-toast-info { background: #1a6fb5; color: #fff; }
      .labo-toast-success { background: #1a7a2a; color: #fff; }
      .labo-toast-error { background: #b51a1a; color: #fff; }

      /* プレビュー */
      .labo-preview-overlay {
        position: fixed;
        inset: 0;
        z-index: 2000;
        background: rgba(0,0,0,.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .labo-preview-panel {
        background: var(--bg-page);
        width: 90%;
        max-width: 600px;
        max-height: 85vh;
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .labo-preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px;
        border-bottom: 1px solid var(--border-light);
        font-weight: 700;
        font-size: 15px;
      }
      .labo-preview-close {
        background: none;
        border: none;
        font-size: 18px;
        color: var(--text-tertiary);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
      }
      .labo-preview-close:hover { background: var(--bg-subtle); }
      .labo-preview-body {
        overflow-y: auto;
        padding: 20px;
        -webkit-overflow-scrolling: touch;
      }
      .preview-content h2 {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px;
        margin: 0 0 8px;
      }
      .preview-content h3 {
        font-size: 15px;
        margin: 20px 0 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--border-light);
      }
      .preview-content p {
        font-size: 14px;
        line-height: 1.8;
        margin: 0 0 8px;
      }
      .preview-sub { color: var(--text-tertiary); font-size: 13px; }
      .preview-info {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .preview-info th {
        text-align: left;
        padding: 6px 12px 6px 0;
        color: var(--text-secondary);
        white-space: nowrap;
        vertical-align: top;
        width: 30%;
      }
      .preview-info td {
        padding: 6px 0;
        color: var(--text-primary);
      }
      .preview-cast {
        background: var(--bg-subtle);
        border-radius: var(--radius-sm);
        padding: 10px 14px;
        margin-bottom: 8px;
      }
      .preview-cast strong { font-size: 14px; }
      .preview-cast p { font-size: 13px; margin: 4px 0 0; }
      .preview-authors {
        margin-top: 20px;
        padding-top: 12px;
        border-top: 1px solid var(--border-light);
        font-size: 13px;
        color: var(--text-secondary);
      }
      .preview-authors-label {
        font-weight: 600;
        color: var(--text-tertiary);
      }

      @media (max-width: 600px) {
        .labo-mode-grid { grid-template-columns: 1fr; }
        .labo-field-row { grid-template-columns: 1fr; }
        .labo-select-header { flex-direction: column; align-items: stretch; }
        .labo-info-row { flex-direction: column; gap: 4px; }
        .labo-info-key { width: 100%; }
        .labo-info-key-fixed { width: 100%; }
        .labo-cast-top { flex-direction: column; }
        .labo-cast-id { width: 100%; }
      }
    </style>`
  });
}
