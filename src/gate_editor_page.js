// src/gate_editor_page.js
// =========================================================
// GATE ページエディタ — 団体公開ページの編集フォーム
// BASE側 (/groups/:gid/gate-edit) と LABO側 (/jikabuki/labo/gate/:gid) で共有
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";
import { FAQ_TEMPLATE, FAQ_CATEGORIES } from "./faq_template.js";
import { GATE_THEMES } from "./gate_page.js";

/**
 * @param {string} groupId
 * @param {"base"|"labo"} mode
 */
export function gateEditorPageHTML(groupId, mode) {
  const isLabo = mode === "labo";
  const backHref = isLabo ? "/jikabuki/labo/gate" : "/jikabuki/gate/" + escHTML(groupId);
  const backLabel = isLabo ? "GATEエディタ一覧" : "団体ページ";
  const breadcrumb = isLabo
    ? `<a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/labo">LABO</a><span>&rsaquo;</span><a href="/jikabuki/labo/gate">GATEエディタ</a><span>&rsaquo;</span><span>編集</span>`
    : `<a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span><span>GATEページ編集</span>`;

  const faqTemplateJSON = JSON.stringify(FAQ_TEMPLATE);
  const faqCategoriesJSON = JSON.stringify(FAQ_CATEGORIES);
  const gateThemesJSON = JSON.stringify(
    Object.entries(GATE_THEMES).map(([id, t]) => ({
      id, label: t.label, desc: t.desc, ...t.preview,
    }))
  );

  const bodyHTML = `
    <div class="breadcrumb">${breadcrumb}</div>

    <section class="ge-welcome fade-up">
      <div class="ge-welcome-main">
        <div>
          <h2 class="ge-title">GATEページ編集</h2>
          <p class="ge-subtitle" id="ge-group-label">読み込み中…</p>
        </div>
        <div class="ge-welcome-actions">
          <a href="${escHTML(backHref)}" class="ge-back-btn">&larr; ${escHTML(backLabel)}</a>
          <button type="button" class="btn btn-primary ge-save-btn" id="ge-top-save-btn" onclick="GateEditor.save(event)" style="display:none">保存</button>
        </div>
      </div>
    </section>

    <div id="ge-auth-error" class="ge-error" style="display:none">
      <p>このページを編集する権限がありません。</p>
      <a href="${escHTML(backHref)}">戻る</a>
    </div>

    <div id="ge-loading" class="loading">読み込み中…</div>

    <form id="ge-form" style="display:none" onsubmit="return GateEditor.save(event)">

      <!-- 基本情報 -->
      <section class="ge-section fade-up">
        <h3 class="ge-section-title">基本情報</h3>
        <div class="ge-field">
          <label>団体名</label>
          <input type="text" id="ge-name" placeholder="例: 気良歌舞伎">
        </div>
        <div class="ge-field">
          <label>ふりがな</label>
          <input type="text" id="ge-name_kana" placeholder="例: けらかぶき">
        </div>
        <div class="ge-field">
          <label>キャッチフレーズ</label>
          <input type="text" id="ge-tagline" placeholder="例: 素人歌舞伎の真髄がここにある">
        </div>
        <div class="ge-field">
          <label>都道府県</label>
          <input type="text" id="ge-prefecture" placeholder="例: 岐阜県">
        </div>
        <div class="ge-field">
          <label>紹介文</label>
          <textarea id="ge-description" rows="5" placeholder="団体の紹介文"></textarea>
        </div>
        <div class="ge-field">
          <label>ページテーマ</label>
          <div class="ge-theme-picker" id="ge-theme-picker"></div>
          <input type="hidden" id="ge-theme-id" value="classic">
        </div>
        <div class="ge-field">
          <label>ヒーロー背景画像</label>
          <div class="ge-upload-row">
            <input type="file" id="ge-hero-image-file" accept="image/jpeg,image/png,image/webp,image/gif" class="ge-file-input" onchange="GateEditor.uploadImage('hero', this, 'ge-hero-image', 'ge-hero-preview')">
            <button type="button" class="ge-upload-btn" onclick="document.getElementById('ge-hero-image-file').click()">📷 ファイルを選択</button>
            <span class="ge-upload-status" id="ge-hero-upload-status"></span>
          </div>
          <input type="hidden" id="ge-hero-image">
          <div class="ge-img-preview" id="ge-hero-preview"></div>
        </div>
      </section>

      <!-- 次回公演 -->
      <section class="ge-section fade-up-d1">
        <h3 class="ge-section-title">次回公演</h3>
        <div class="ge-field">
          <label>公演タイトル</label>
          <input type="text" id="ge-np-title" placeholder="例: 令和8年 気良歌舞伎公演">
        </div>
        <div class="ge-field">
          <label>日時</label>
          <input type="text" id="ge-np-date" placeholder="例: 令和8年9月26日（土） 17:00 開演">
        </div>
        <div class="ge-field">
          <label>会場</label>
          <input type="text" id="ge-np-venue" placeholder="例: 気良座">
        </div>
        <div class="ge-field">
          <label>備考</label>
          <textarea id="ge-np-note" rows="2" placeholder="補足情報"></textarea>
        </div>
        <div class="ge-field">
          <label>公演告知画像</label>
          <div class="ge-upload-row">
            <input type="file" id="ge-next-perf-image-file" accept="image/jpeg,image/png,image/webp,image/gif" class="ge-file-input" onchange="GateEditor.uploadImage('next_perf', this, 'ge-next-perf-image', 'ge-next-perf-preview')">
            <button type="button" class="ge-upload-btn" onclick="document.getElementById('ge-next-perf-image-file').click()">📷 ファイルを選択</button>
            <span class="ge-upload-status" id="ge-next-perf-upload-status"></span>
          </div>
          <input type="hidden" id="ge-next-perf-image">
          <div class="ge-img-preview" id="ge-next-perf-preview"></div>
        </div>
      </section>

      <!-- おすすめ動画 -->
      <section class="ge-section fade-up-d2">
        <h3 class="ge-section-title">おすすめ動画</h3>
        <div class="ge-field">
          <label>YouTube URL</label>
          <input type="url" id="ge-featured_video" placeholder="https://www.youtube.com/watch?v=...">
        </div>
      </section>

      <!-- 連絡先 / SNS -->
      <section class="ge-section fade-up-d3">
        <h3 class="ge-section-title">連絡先 / SNS</h3>
        <div class="ge-grid-2">
          <div class="ge-field"><label>公式サイト</label><input type="url" id="ge-c-website" placeholder="https://..."></div>
          <div class="ge-field"><label>YouTube</label><input type="url" id="ge-c-youtube" placeholder="https://youtube.com/..."></div>
          <div class="ge-field"><label>Instagram</label><input type="url" id="ge-c-instagram" placeholder="https://instagram.com/..."></div>
          <div class="ge-field"><label>X (Twitter)</label><input type="url" id="ge-c-x" placeholder="https://x.com/..."></div>
          <div class="ge-field"><label>Facebook</label><input type="url" id="ge-c-facebook" placeholder="https://facebook.com/..."></div>
          <div class="ge-field"><label>TikTok</label><input type="url" id="ge-c-tiktok" placeholder="https://tiktok.com/..."></div>
          <div class="ge-field"><label>メールアドレス</label><input type="email" id="ge-c-email" placeholder="info@example.com"></div>
        </div>
      </section>

      <!-- 略歴 -->
      <section class="ge-section fade-up-d5">
        <h3 class="ge-section-title">略歴</h3>
        <div id="ge-history-list"></div>
        <button type="button" class="ge-add-btn" onclick="GateEditor.addHistory()">+ 略歴を追加</button>
      </section>

      <!-- デフォルトFAQ -->
      <section class="ge-section fade-up-d5">
        <h3 class="ge-section-title">よくある質問 (FAQ)</h3>
        <p class="ge-hint">回答を入力した質問のみGATEページに表示されます。未入力の質問は非表示になります。</p>
        <div id="ge-default-faq"></div>
      </section>

      <!-- カスタムFAQ -->
      <section class="ge-section fade-up-d5">
        <h3 class="ge-section-title">カスタムFAQ（独自の質問）</h3>
        <p class="ge-hint">デフォルト以外に独自の質問を追加できます。</p>
        <div id="ge-custom-faq-list"></div>
        <button type="button" class="ge-add-btn" onclick="GateEditor.addCustomFaq()">+ 質問を追加</button>
      </section>

      <!-- 芝居小屋・会場情報 -->
      <section class="ge-section fade-up-d6">
        <h3 class="ge-section-title">芝居小屋・会場情報</h3>
        <div class="ge-venue-toggle">
          <label class="ge-radio-label"><input type="radio" name="ge-venue-mode" value="theater" id="ge-venue-mode-theater" onchange="GateEditor.switchVenueMode('theater')"> 登録済み芝居小屋を選択</label>
          <label class="ge-radio-label"><input type="radio" name="ge-venue-mode" value="venue" id="ge-venue-mode-venue" onchange="GateEditor.switchVenueMode('venue')"> 会場情報を手入力</label>
          <label class="ge-radio-label"><input type="radio" name="ge-venue-mode" value="none" id="ge-venue-mode-none" onchange="GateEditor.switchVenueMode('none')" checked> 設定しない</label>
        </div>
        <div id="ge-venue-theater-panel" class="ge-venue-panel" style="display:none;">
          <div class="ge-field">
            <label>芝居小屋を選択</label>
            <select id="ge-theater-select" class="ge-select" onchange="GateEditor.onTheaterSelect()">
              <option value="">-- 選択してください --</option>
            </select>
          </div>
          <div id="ge-theater-preview" class="ge-theater-preview"></div>
          <p class="ge-hint">芝居小屋の登録・編集は <a href="/jikabuki/base" target="_blank">BASE</a> の芝居小屋管理ページから行えます。</p>
        </div>
        <div id="ge-venue-manual-panel" class="ge-venue-panel" style="display:none;">
          <div class="ge-field">
            <label>会場名</label>
            <input type="text" id="ge-venue-name" placeholder="例: 郡上市総合文化センター">
          </div>
          <div class="ge-field">
            <label>住所</label>
            <input type="text" id="ge-venue-address" placeholder="例: 岐阜県郡上市八幡町...">
          </div>
        </div>
      </section>

      <!-- 保存 -->
      <div class="ge-save-bar">
        <span id="ge-save-status" class="ge-save-status"></span>
        <button type="submit" class="btn btn-primary ge-save-btn">保存</button>
      </div>
    </form>

    <script>
    (function() {
      var groupId = '${escHTML(groupId)}';
      var mode = '${escHTML(mode)}';
      var originalData = null;
      var FAQ_TPL = ${faqTemplateJSON};
      var FAQ_CATS = ${faqCategoriesJSON};
      var GATE_THEMES_LIST = ${gateThemesJSON};

      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

      function checkAuth() {
        fetch('/api/auth/me', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (!data.loggedIn) { showError(); return; }
            var user = data.user;
            if (mode === 'labo') {
              if (!user.isEditor && !user.isMaster) { showError(); return; }
            } else {
              var g = (user.groups || []).find(function(x) { return x.groupId === groupId; });
              if (!g || (g.role !== 'manager' && !user.isMaster)) { showError(); return; }
            }
            loadGroupData();
          })
          .catch(function() { showError(); });
      }

      function showError() {
        document.getElementById('ge-loading').style.display = 'none';
        document.getElementById('ge-auth-error').style.display = '';
      }

      function loadGroupData() {
        fetch('/api/groups/' + encodeURIComponent(groupId), { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.error) { showError(); return; }
            originalData = data;
            populateForm(data);
            document.getElementById('ge-loading').style.display = 'none';
            document.getElementById('ge-form').style.display = '';
            document.getElementById('ge-group-label').textContent = data.name || groupId;
            var topSaveBtn = document.getElementById('ge-top-save-btn');
            if (topSaveBtn) topSaveBtn.style.display = '';
            buildThemePicker();
            selectTheme(data.theme_id || 'classic');
          })
          .catch(function() { showError(); });
      }

      function populateForm(d) {
        setValue('ge-name', d.name);
        setValue('ge-name_kana', d.name_kana);
        setValue('ge-tagline', d.tagline);
        setValue('ge-prefecture', d.prefecture);
        setValue('ge-description', d.description);
        setValue('ge-featured_video', d.featured_video);
        setValue('ge-hero-image', d.hero_image);
        if (d.hero_image) previewUrl('ge-hero-image', 'ge-hero-preview');

        var np = d.next_performance || {};
        setValue('ge-np-title', np.title);
        setValue('ge-np-date', np.date);
        setValue('ge-np-venue', np.venue);
        setValue('ge-np-note', np.note);
        setValue('ge-next-perf-image', np.image);
        if (np.image) previewUrl('ge-next-perf-image', 'ge-next-perf-preview');

        var c = d.contact || {};
        setValue('ge-c-website', c.website);
        setValue('ge-c-youtube', c.youtube);
        setValue('ge-c-instagram', c.instagram);
        setValue('ge-c-x', c.x);
        setValue('ge-c-facebook', c.facebook);
        setValue('ge-c-tiktok', c.tiktok);
        setValue('ge-c-email', c.email);

        var histList = document.getElementById('ge-history-list');
        histList.innerHTML = '';
        (d.history || []).forEach(function(h) { appendHistoryRow(h.year, h.text); });

        buildDefaultFaqUI(d);

        // 芝居小屋・会場情報
        if (d.theater_id) {
          switchVenueMode('theater');
          document.getElementById('ge-venue-mode-theater').checked = true;
          var sel = document.getElementById('ge-theater-select');
          if (sel) sel.value = d.theater_id;
          onTheaterSelect();
        } else if (d.venue && (d.venue.name || d.venue.address)) {
          switchVenueMode('venue');
          document.getElementById('ge-venue-mode-venue').checked = true;
          setValue('ge-venue-name', d.venue.name);
          setValue('ge-venue-address', d.venue.address);
        } else {
          switchVenueMode('none');
          document.getElementById('ge-venue-mode-none').checked = true;
        }
      }

      function setValue(id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val || '';
      }
      function getValue(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      }

      /* 略歴行 */
      function appendHistoryRow(year, text) {
        var list = document.getElementById('ge-history-list');
        var row = document.createElement('div');
        row.className = 'ge-dynamic-row';
        row.innerHTML = '<div class="ge-dynamic-fields ge-history-fields">'
          + '<input type="text" class="ge-hist-year" value="' + esc(year || '') + '" placeholder="年（例: 2005）" style="width:80px">'
          + '<input type="text" class="ge-hist-text" value="' + esc(text || '') + '" placeholder="出来事（例: 復活公演）">'
          + '</div>'
          + '<button type="button" class="ge-remove-btn" onclick="this.parentElement.remove()" title="削除">&times;</button>';
        list.appendChild(row);
      }

      function replTpl(s, name) {
        return (s || '').replace(/\{団体名\}/g, name || '');
      }

      function buildDefaultFaqUI(d) {
        var groupName = (d.name || groupId);
        var saved = d.faq || [];
        var answerMap = {};
        var customItems = [];

        var defaultKeys = {};
        FAQ_TPL.forEach(function(t) { defaultKeys[t.key] = true; });

        saved.forEach(function(f) {
          if (f.key && defaultKeys[f.key]) {
            answerMap[f.key] = f.a || '';
          } else {
            customItems.push(f);
          }
        });

        var container = document.getElementById('ge-default-faq');
        container.innerHTML = '';

        var catGroups = {};
        FAQ_CATS.forEach(function(c) { catGroups[c] = []; });
        FAQ_TPL.forEach(function(t) {
          var cat = t.category;
          if (!catGroups[cat]) catGroups[cat] = [];
          catGroups[cat].push(t);
        });

        FAQ_CATS.forEach(function(catTpl) {
          var items = catGroups[catTpl];
          if (!items || !items.length) return;
          var catLabel = replTpl(catTpl, groupName);
          var det = document.createElement('details');
          det.className = 'ge-faq-cat-group';
          det.open = true;
          var summary = document.createElement('summary');
          summary.className = 'ge-faq-cat-title';
          summary.textContent = catLabel + '（' + items.length + '問）';
          det.appendChild(summary);

          items.forEach(function(t) {
            var qLabel = replTpl(t.q, groupName);
            var existing = answerMap[t.key] || '';
            var row = document.createElement('div');
            row.className = 'ge-dfaq-row';
            row.setAttribute('data-faq-key', t.key);
            row.innerHTML = '<div class="ge-dfaq-q">' + esc(qLabel) + '</div>'
              + '<textarea class="ge-dfaq-a" rows="2" placeholder="回答を入力…（空欄の場合はGATEページで非表示）">' + esc(existing) + '</textarea>';
            det.appendChild(row);
          });

          container.appendChild(det);
        });

        var customList = document.getElementById('ge-custom-faq-list');
        customList.innerHTML = '';
        customItems.forEach(function(f) {
          appendCustomFaqRow(f.category, f.q, f.a);
        });
      }

      function appendCustomFaqRow(category, q, a) {
        var list = document.getElementById('ge-custom-faq-list');
        var row = document.createElement('div');
        row.className = 'ge-dynamic-row';
        row.innerHTML = '<div class="ge-dynamic-fields">'
          + '<input type="text" class="ge-faq-category" value="' + esc(category || '') + '" placeholder="カテゴリ（例: 観劇の基本）">'
          + '<input type="text" class="ge-faq-q" value="' + esc(q || '') + '" placeholder="質問">'
          + '<textarea class="ge-faq-a" rows="2" placeholder="回答">' + esc(a || '') + '</textarea>'
          + '</div>'
          + '<button type="button" class="ge-remove-btn" onclick="this.parentElement.remove()" title="削除">&times;</button>';
        list.appendChild(row);
      }

      function collectFormData() {
        var histRows = document.querySelectorAll('#ge-history-list .ge-dynamic-row');
        var history = [];
        histRows.forEach(function(row) {
          var y = row.querySelector('.ge-hist-year').value.trim();
          var t = row.querySelector('.ge-hist-text').value.trim();
          if (y || t) history.push({ year: y, text: t });
        });
        history.sort(function(a, b) { return (parseInt(a.year) || 0) - (parseInt(b.year) || 0); });

        var faq = [];
        var dfaqRows = document.querySelectorAll('#ge-default-faq .ge-dfaq-row');
        dfaqRows.forEach(function(row) {
          var key = row.getAttribute('data-faq-key');
          var a = row.querySelector('.ge-dfaq-a').value.trim();
          var tpl = null;
          for (var i = 0; i < FAQ_TPL.length; i++) {
            if (FAQ_TPL[i].key === key) { tpl = FAQ_TPL[i]; break; }
          }
          if (tpl) {
            faq.push({ key: key, category: tpl.category, q: tpl.q, a: a });
          }
        });
        var cfaqRows = document.querySelectorAll('#ge-custom-faq-list .ge-dynamic-row');
        cfaqRows.forEach(function(row) {
          var category = row.querySelector('.ge-faq-category').value.trim();
          var q = row.querySelector('.ge-faq-q').value.trim();
          var a = row.querySelector('.ge-faq-a').value.trim();
          if (q || a) {
            var item = { q: q, a: a };
            if (category) item.category = category;
            faq.push(item);
          }
        });

        var npImage = getValue('ge-next-perf-image');
        var np = {
          title: getValue('ge-np-title'),
          date: getValue('ge-np-date'),
          venue: getValue('ge-np-venue'),
          note: getValue('ge-np-note'),
          image: npImage || undefined,
        };
        var hasNp = np.title || np.date || np.venue || np.note || np.image;

        var contact = {};
        var cFields = ['website','youtube','instagram','x','facebook','tiktok','email'];
        cFields.forEach(function(f) {
          var v = getValue('ge-c-' + f);
          if (v) contact[f] = v;
        });

        var venueMode = 'none';
        if (document.getElementById('ge-venue-mode-theater').checked) venueMode = 'theater';
        else if (document.getElementById('ge-venue-mode-venue').checked) venueMode = 'venue';

        var theater_id = null;
        var venue = null;
        if (venueMode === 'theater') {
          var sel = document.getElementById('ge-theater-select');
          if (sel && sel.value) theater_id = sel.value;
        } else if (venueMode === 'venue') {
          var vn = getValue('ge-venue-name');
          var va = getValue('ge-venue-address');
          if (vn || va) venue = { name: vn, address: va };
        }

        var themeVal = getValue('ge-theme-id');

        return {
          name: getValue('ge-name'),
          name_kana: getValue('ge-name_kana'),
          tagline: getValue('ge-tagline'),
          prefecture: getValue('ge-prefecture'),
          description: getValue('ge-description'),
          theme_id: (themeVal && themeVal !== 'classic') ? themeVal : undefined,
          featured_video: getValue('ge-featured_video'),
          hero_image: getValue('ge-hero-image') || undefined,
          next_performance: hasNp ? np : null,
          contact: contact,
          faq: faq,
          history: history.length ? history : [],
          theater_id: theater_id || undefined,
          venue: venue || undefined,
          theater: undefined,
        };
      }

      function save(e) {
        e.preventDefault();
        var statusEl = document.getElementById('ge-save-status');
        statusEl.textContent = '保存中…';
        statusEl.className = 'ge-save-status saving';

        var body = collectFormData();
        fetch('/api/groups/' + encodeURIComponent(groupId), {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) {
            statusEl.textContent = '保存しました';
            statusEl.className = 'ge-save-status saved';
            setTimeout(function() { statusEl.textContent = ''; statusEl.className = 'ge-save-status'; }, 3000);
          } else {
            statusEl.textContent = 'エラー: ' + (data.error || '保存に失敗しました');
            statusEl.className = 'ge-save-status error';
          }
        })
        .catch(function(err) {
          statusEl.textContent = '通信エラー: ' + err;
          statusEl.className = 'ge-save-status error';
        });
        return false;
      }

      function previewUrl(inputId, previewId) {
        var url = document.getElementById(inputId) ? document.getElementById(inputId).value.trim() : '';
        var prev = document.getElementById(previewId);
        if (!prev) return;
        if (url) {
          prev.innerHTML = '<img src="' + esc(url) + '" alt="プレビュー" style="max-width:100%;max-height:160px;border-radius:6px;margin-top:6px;display:block;">';
        } else {
          prev.innerHTML = '';
        }
      }

      function uploadImage(type, fileInput, urlInputId, previewId) {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        var statusId = type === 'hero' ? 'ge-hero-upload-status'
                     : type === 'theater' ? 'ge-theater-upload-status'
                     : 'ge-next-perf-upload-status';
        var statusEl = document.getElementById(statusId);
        if (statusEl) { statusEl.textContent = 'アップロード中…'; statusEl.className = 'ge-upload-status uploading'; }

        var formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        fetch('/api/groups/' + encodeURIComponent(groupId) + '/images', {
          method: 'POST',
          credentials: 'same-origin',
          body: formData,
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.url) {
            var urlInput = document.getElementById(urlInputId);
            if (urlInput) urlInput.value = data.url;
            previewUrl(urlInputId, previewId);
            if (statusEl) { statusEl.textContent = 'アップロード完了'; statusEl.className = 'ge-upload-status ok'; setTimeout(function() { statusEl.textContent = ''; statusEl.className = 'ge-upload-status'; }, 3000); }
          } else {
            if (statusEl) { statusEl.textContent = 'エラー: ' + (data.error || '失敗'); statusEl.className = 'ge-upload-status err'; }
          }
          fileInput.value = '';
        })
        .catch(function(err) {
          if (statusEl) { statusEl.textContent = '通信エラー: ' + err; statusEl.className = 'ge-upload-status err'; }
          fileInput.value = '';
        });
      }

      // 芝居小屋・会場情報の切り替え
      var theatersCache = [];
      function switchVenueMode(mode) {
        var thPanel = document.getElementById('ge-venue-theater-panel');
        var vnPanel = document.getElementById('ge-venue-manual-panel');
        if (thPanel) thPanel.style.display = mode === 'theater' ? '' : 'none';
        if (vnPanel) vnPanel.style.display = mode === 'venue' ? '' : 'none';
        if (mode === 'theater' && !theatersCache.length) loadTheaters();
      }
      function loadTheaters() {
        fetch('/api/theaters')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            theatersCache = data.theaters || [];
            var sel = document.getElementById('ge-theater-select');
            if (!sel) return;
            sel.innerHTML = '<option value="">-- 選択してください --</option>';
            theatersCache.forEach(function(t) {
              var opt = document.createElement('option');
              opt.value = t.id;
              opt.textContent = t.name + (t.location ? '（' + t.location.split('（')[0] + '）' : '');
              sel.appendChild(opt);
            });
            if (originalData && originalData.theater_id) {
              sel.value = originalData.theater_id;
              onTheaterSelect();
            }
          });
      }
      function onTheaterSelect() {
        var sel = document.getElementById('ge-theater-select');
        var preview = document.getElementById('ge-theater-preview');
        if (!sel || !preview) return;
        var tid = sel.value;
        if (!tid) { preview.innerHTML = ''; return; }
        var t = theatersCache.find(function(x) { return x.id === tid; });
        if (!t) { preview.innerHTML = ''; return; }
        var badges = [];
        if (t.has_hanamichi) badges.push('花道あり');
        if (t.visitable) badges.push('見学可');
        if (t.cultural_property) badges.push(esc(t.cultural_property));
        if (t.capacity) badges.push('収容 ' + t.capacity + ' 名');
        preview.innerHTML = '<div class="ge-th-preview-card">'
          + (t.photo_url ? '<img src="' + esc(t.photo_url) + '" alt="' + esc(t.name) + '" class="ge-th-preview-img">' : '')
          + '<div class="ge-th-preview-name">' + esc(t.name) + '</div>'
          + (t.location ? '<div class="ge-th-preview-loc">' + esc(t.location) + '</div>' : '')
          + (badges.length ? '<div class="ge-th-preview-badges">' + badges.map(function(b) { return '<span class="ge-th-preview-badge">' + b + '</span>'; }).join('') + '</div>' : '')
          + '</div>';
      }

      /* ── テーマピッカー ── */
      function buildThemePicker() {
        var container = document.getElementById('ge-theme-picker');
        if (!container || container.childElementCount > 0) return;
        var html = '';
        GATE_THEMES_LIST.forEach(function(t, i) {
          if (i === 0) html += '<div class="ge-theme-group-label">暖色系</div>';
          if (i === 4) html += '<div class="ge-theme-group-label">ダーク系</div>';
          html += '<button type="button" class="ge-theme-card" data-theme-id="' + esc(t.id) + '">'
            + '<div class="ge-theme-swatch" style="background:' + esc(t.bg) + '">'
            + '<div class="ge-theme-swatch-card" style="background:' + esc(t.card) + ';border-color:' + esc(t.accent) + '55"></div>'
            + '<div class="ge-theme-swatch-bar" style="background:' + esc(t.accent) + '"></div>'
            + '</div>'
            + '<div class="ge-theme-card-label" style="color:' + esc(t.text) + '">' + esc(t.label) + '</div>'
            + '<div class="ge-theme-card-desc">' + esc(t.desc) + '</div>'
            + '</button>';
        });
        container.innerHTML = html;
        container.addEventListener('click', function(e) {
          var btn = e.target.closest('button[data-theme-id]');
          if (btn) selectTheme(btn.getAttribute('data-theme-id'));
        });
      }

      function selectTheme(themeId) {
        var id = themeId || 'classic';
        var input = document.getElementById('ge-theme-id');
        if (input) input.value = id;
        document.querySelectorAll('.ge-theme-card').forEach(function(btn) {
          btn.classList.toggle('ge-theme-card-active', btn.getAttribute('data-theme-id') === id);
        });
      }

      checkAuth();

      window.GateEditor = {
        save: save,
        addCustomFaq: function() { appendCustomFaqRow('', '', ''); },
        addHistory: function() { appendHistoryRow('', ''); },
        uploadImage: uploadImage,
        previewUrl: previewUrl,
        switchVenueMode: switchVenueMode,
        onTheaterSelect: onTheaterSelect,
        selectTheme: selectTheme,
      };
    })();
    </script>
  `;

  return pageShell({
    title: "GATEページ編集",
    subtitle: isLabo ? "LABO管理" : "BASE団体管理",
    bodyHTML,
    activeNav: isLabo ? "labo" : "base",
    brand: "jikabuki",
    ogDesc: "GATEページの編集",
    headExtra: `<style>
      .ge-welcome {
        padding: 20px 0 18px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 24px;
      }
      .ge-welcome-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .ge-welcome-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .ge-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }
      .ge-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 4px 0 0;
      }
      .ge-back-btn {
        font-size: 13px;
        color: var(--gold-dark);
        text-decoration: none;
        padding: 6px 14px;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        transition: all 0.15s;
        white-space: nowrap;
      }
      .ge-back-btn:hover {
        border-color: var(--gold);
        background: var(--gold-soft);
        text-decoration: none;
      }
      .ge-error {
        text-align: center;
        padding: 40px 20px;
        color: var(--accent-1);
        font-size: 15px;
      }
      .ge-error a { color: var(--gold-dark); }

      /* セクション */
      .ge-section {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        padding: 20px;
        margin-bottom: 16px;
      }
      .ge-section-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px;
        font-weight: 700;
        margin: 0 0 16px;
        color: var(--text-primary);
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-light);
      }

      /* フィールド */
      .ge-field {
        margin-bottom: 14px;
      }
      .ge-field label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }
      .ge-field input,
      .ge-field textarea {
        width: 100%;
        padding: 9px 12px;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        font-size: 14px;
        font-family: inherit;
        background: #fff;
        color: var(--text-primary);
        outline: none;
        transition: border-color 0.2s;
      }
      .ge-field input:focus,
      .ge-field textarea:focus {
        border-color: var(--gold);
        box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
      }
      .ge-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 16px;
      }

      /* 動的行 */
      .ge-dynamic-row {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        margin-bottom: 10px;
        padding: 12px;
        background: var(--bg-subtle);
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-light);
      }
      .ge-dynamic-fields {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .ge-dynamic-fields input,
      .ge-dynamic-fields textarea {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-family: inherit;
        background: #fff;
        color: var(--text-primary);
        outline: none;
      }
      .ge-dynamic-fields input:focus,
      .ge-dynamic-fields textarea:focus {
        border-color: var(--gold);
      }
      .ge-hint {
        font-size: 12px;
        color: var(--text-tertiary);
        margin: -8px 0 14px;
        line-height: 1.5;
      }
      .ge-faq-cat-group {
        margin-bottom: 12px;
        border: 1px solid var(--border-light);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }
      .ge-faq-cat-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--gold-dark);
        padding: 10px 14px;
        background: var(--gold-soft, #f5edd8);
        cursor: pointer;
        list-style: none;
        display: flex;
        align-items: center;
        gap: 6px;
        user-select: none;
      }
      .ge-faq-cat-title::-webkit-details-marker { display: none; }
      .ge-faq-cat-title::before {
        content: '▶';
        font-size: 0.55rem;
        transition: transform 0.2s;
      }
      .ge-faq-cat-group[open] > .ge-faq-cat-title::before {
        transform: rotate(90deg);
      }
      .ge-dfaq-row {
        padding: 10px 14px;
        border-top: 1px solid var(--border-light);
      }
      .ge-dfaq-q {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 6px;
      }
      .ge-dfaq-a {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        font-size: 13px;
        font-family: inherit;
        background: #fff;
        color: var(--text-primary);
        outline: none;
        resize: vertical;
      }
      .ge-dfaq-a:focus {
        border-color: var(--gold);
        box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
      }
      .ge-faq-category {
        font-size: 11px !important;
        color: var(--text-tertiary) !important;
        background: var(--bg-subtle, #f9f6f0) !important;
        border-style: dashed !important;
      }
      .ge-faq-category::placeholder { color: var(--text-tertiary); }
      .ge-remove-btn {
        background: none;
        border: 1px solid var(--border-light);
        border-radius: 50%;
        width: 28px; height: 28px;
        font-size: 16px;
        color: var(--text-tertiary);
        cursor: pointer;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        margin-top: 2px;
      }
      .ge-remove-btn:hover {
        color: var(--accent-1);
        border-color: var(--accent-1);
        background: var(--accent-1-soft);
      }
      .ge-add-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 8px 16px;
        font-size: 13px;
        font-family: inherit;
        font-weight: 600;
        color: var(--gold-dark);
        background: none;
        border: 1px dashed var(--border-medium);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s;
      }
      .ge-add-btn:hover {
        border-color: var(--gold);
        border-style: solid;
        background: var(--gold-soft);
      }

      /* 保存バー */
      .ge-save-bar {
        position: sticky;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 16px;
        padding: 16px 20px;
        background: rgba(250,247,242,0.95);
        border-top: 1px solid var(--border-light);
        backdrop-filter: blur(8px);
        margin: 0 -16px;
        z-index: 10;
      }
      .ge-save-btn {
        min-width: 100px;
        justify-content: center;
      }
      .ge-save-status {
        font-size: 13px;
      }
      .ge-save-status.saving { color: var(--text-tertiary); }
      .ge-save-status.saved { color: var(--accent-3); font-weight: 600; }
      .ge-save-status.error { color: var(--accent-1); }

      .ge-check-row { display: flex; gap: 1.5rem; margin-top: 4px; }
      .ge-check-label {
        display: flex; align-items: center; gap: 6px;
        font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer;
      }
      .ge-check-label input[type="checkbox"] { accent-color: var(--gold-dark); width: 16px; height: 16px; cursor: pointer; }

      .ge-upload-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }
      .ge-file-input { display: none; }
      .ge-upload-btn {
        padding: 7px 14px;
        font-size: 13px;
        font-family: inherit;
        font-weight: 600;
        color: var(--gold-dark);
        background: var(--gold-soft, #f5edd8);
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .ge-upload-btn:hover { border-color: var(--gold); background: #ede4c5; }
      .ge-upload-status { font-size: 12px; }
      .ge-upload-status.uploading { color: var(--text-tertiary); }
      .ge-upload-status.ok { color: var(--accent-3); font-weight: 600; }
      .ge-upload-status.err { color: var(--accent-1); }
      .ge-img-preview img { border: 1px solid var(--border-light); }

      /* 芝居小屋・会場 切り替えUI */
      .ge-venue-toggle {
        display: flex; flex-wrap: wrap; gap: 0.6rem 1.2rem;
        margin-bottom: 1rem;
      }
      .ge-radio-label {
        display: flex; align-items: center; gap: 6px;
        font-size: 0.88rem; cursor: pointer; color: var(--text-primary);
      }
      .ge-venue-panel { margin-top: 0.5rem; }
      .ge-select {
        width: 100%; padding: 8px 12px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 0.92rem;
        font-family: inherit; background: var(--bg-card);
        color: var(--text-primary); cursor: pointer;
      }
      .ge-select:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px rgba(197,162,85,0.1); }
      .ge-theater-preview { margin-top: 0.8rem; }
      .ge-th-preview-card {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm);
      }
      .ge-th-preview-img {
        width: 100%; max-height: 180px; object-fit: cover; display: block;
      }
      .ge-th-preview-name {
        padding: 0.8rem 1rem 0.2rem; font-weight: 700; font-size: 0.95rem;
      }
      .ge-th-preview-loc {
        padding: 0 1rem; font-size: 0.82rem; color: var(--text-secondary);
      }
      .ge-th-preview-badges {
        padding: 0.4rem 1rem 0.8rem; display: flex; flex-wrap: wrap; gap: 0.3rem;
      }
      .ge-th-preview-badge {
        display: inline-block; font-size: 0.7rem; font-weight: 600;
        padding: 2px 8px; border-radius: 8px;
        background: var(--bg-subtle); color: var(--gold-dark);
        border: 1px solid var(--border-light);
      }

      /* テーマピッカー */
      .ge-theme-picker {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-top: 6px;
      }
      .ge-theme-group-label {
        grid-column: 1 / -1;
        font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
        color: var(--text-tertiary); text-transform: uppercase;
        padding: 4px 2px 0;
        border-top: 1px solid var(--border-light);
        margin-top: 2px;
      }
      .ge-theme-group-label:first-child { border-top: none; margin-top: 0; padding-top: 0; }
      @media (max-width: 480px) {
        .ge-theme-picker { grid-template-columns: repeat(2, 1fr); }
      }
      .ge-theme-card {
        display: flex; flex-direction: column; align-items: center;
        gap: 5px; padding: 8px 6px;
        border: 2px solid var(--border-light);
        border-radius: var(--radius-md);
        cursor: pointer; background: var(--bg-card);
        font-family: inherit; transition: border-color 0.18s, box-shadow 0.18s;
      }
      .ge-theme-card:hover { border-color: var(--gold-light); }
      .ge-theme-card.ge-theme-card-active {
        border-color: var(--gold);
        box-shadow: 0 0 0 2px rgba(197,162,85,0.3);
      }
      .ge-theme-swatch {
        width: 100%; height: 44px; border-radius: 6px;
        position: relative; overflow: hidden;
        border: 1px solid rgba(0,0,0,0.08);
      }
      .ge-theme-swatch-card {
        position: absolute; top: 7px; left: 50%; transform: translateX(-50%);
        width: 55%; height: 22px; border-radius: 3px; border: 1px solid;
        box-shadow: 0 1px 4px rgba(0,0,0,0.18);
      }
      .ge-theme-swatch-bar {
        position: absolute; bottom: 0; left: 0; right: 0; height: 5px;
      }
      .ge-theme-card-label {
        font-size: 11px; font-weight: 700; text-align: center;
        color: var(--text-primary);
      }
      .ge-theme-card-desc {
        font-size: 10px; color: var(--text-tertiary);
        text-align: center; line-height: 1.3;
      }

      @media (max-width: 600px) {
        .ge-grid-2 { grid-template-columns: 1fr; }
        .ge-save-bar { margin: 0 -12px; padding: 12px; }
      }
    </style>`
  });
}

/**
 * LABO用 GATE団体一覧ページ
 */
export function gateEditorListPageHTML(gateGroups) {
  const cards = gateGroups.map((g, i) => `
    <a href="/jikabuki/labo/gate/${escHTML(g.id)}" class="gel-card fade-up-d${Math.min(i + 1, 7)}">
      <div class="gel-card-icon">🏯</div>
      <div class="gel-card-body">
        <div class="gel-card-name">${escHTML(g.name)}</div>
        <div class="gel-card-id">${escHTML(g.id)}</div>
      </div>
      <div class="gel-card-arrow">&rsaquo;</div>
    </a>
  `).join("");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/labo">LABO</a><span>&rsaquo;</span><span>GATEエディタ</span>
    </div>

    <section class="gel-hero fade-up">
      <h2 class="gel-title">GATEエディタ</h2>
      <p class="gel-subtitle">GATE登録団体のページを編集</p>
    </section>

    <section class="gel-section fade-up">
      <div class="gel-list">
        ${cards}
        ${gateGroups.length === 0 ? '<div class="empty-state">登録団体がありません</div>' : ''}
      </div>
    </section>
  `;

  return pageShell({
    title: "GATEエディタ",
    subtitle: "LABO管理",
    bodyHTML,
    activeNav: "labo",
    brand: "jikabuki",
    ogDesc: "GATE登録団体のページを編集",
    headExtra: `<style>
      .gel-hero {
        padding: 24px 0 20px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 20px;
      }
      .gel-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }
      .gel-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 4px 0 0;
      }
      .gel-section { margin-bottom: 24px; }
      .gel-list {
        display: grid;
        gap: 10px;
      }
      .gel-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 18px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-left: 4px solid var(--gold);
        border-radius: var(--radius-md);
        text-decoration: none;
        color: inherit;
        transition: all 0.18s;
      }
      .gel-card:hover {
        border-color: var(--gold);
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
        text-decoration: none;
      }
      .gel-card-icon {
        font-size: 28px;
        flex-shrink: 0;
      }
      .gel-card-body { flex: 1; }
      .gel-card-name {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
      }
      .gel-card-id {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-top: 2px;
      }
      .gel-card-arrow {
        font-size: 20px;
        color: var(--text-tertiary);
        flex-shrink: 0;
      }
    </style>`
  });
}
