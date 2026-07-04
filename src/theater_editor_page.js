// src/theater_editor_page.js
// =========================================================
// 芝居小屋管理エディタ — /jikabuki/base/theaters
// 芝居小屋の一覧・新規登録・編集・削除
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function theaterEditorPageHTML() {
  const breadcrumb = `<a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span><span>芝居小屋管理</span>`;

  const bodyHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb">${breadcrumb}</nav>

    <section class="te-welcome fade-up">
      <div class="te-welcome-main">
        <div>
          <h2 class="te-title">芝居小屋管理</h2>
          <p class="te-subtitle">登録されている芝居小屋の一覧・編集</p>
        </div>
        <div class="te-welcome-actions">
          <a href="/jikabuki/base" class="te-back-btn">&larr; BASE</a>
          <button type="button" class="btn btn-primary te-add-btn" onclick="TheaterEditor.showForm()">+ 新規登録</button>
        </div>
      </div>
    </section>

    <div id="te-auth-error" class="te-error" style="display:none">
      <p>このページを操作する権限がありません。</p>
      <a href="/jikabuki/base">BASEへ戻る</a>
    </div>

    <div id="te-loading" class="loading">読み込み中…</div>

    <!-- 検索 -->
    <div id="te-search-bar" class="te-search-bar" style="display:none">
      <input type="text" id="te-search" class="te-search-input" placeholder="芝居小屋名・所在地で検索…" oninput="TheaterEditor.filter()">
      <span class="te-search-count" id="te-search-count"></span>
    </div>

    <!-- 一覧 -->
    <div id="te-list" class="te-list" style="display:none"></div>

    <!-- 編集フォーム -->
    <div id="te-form-overlay" class="te-form-overlay" style="display:none" onclick="if(event.target===this)TheaterEditor.hideForm()">
      <div class="te-form-modal">
        <div class="te-form-header">
          <h3 class="te-form-title" id="te-form-title">新規登録</h3>
          <button type="button" class="te-close-btn" onclick="TheaterEditor.hideForm()">&times;</button>
        </div>
        <form id="te-form" onsubmit="return TheaterEditor.save(event)">
          <div class="te-form-body">
            <div class="te-form-grid">
              <div class="te-field">
                <label>芝居小屋名 <span class="te-required">*</span></label>
                <input type="text" id="te-f-name" placeholder="例: 気良座" required>
              </div>
              <div class="te-field">
                <label>ふりがな <span class="te-required">*</span></label>
                <input type="text" id="te-f-name_kana" placeholder="例: けらざ" required oninput="TheaterEditor.onKanaInput()">
              </div>
            </div>
            <div class="te-field">
              <label>ID <span class="te-required">*</span></label>
              <div class="te-id-row">
                <input type="text" id="te-f-id" placeholder="ふりがなから自動生成" pattern="[a-zA-Z0-9_-]+" required oninput="TheaterEditor.onIdManualEdit()">
                <span class="te-id-auto-badge" id="te-id-auto-badge" style="display:none">自動生成</span>
              </div>
              <span class="te-field-hint">半角英数・アンダースコア・ハイフンのみ（ふりがな入力で自動生成）</span>
            </div>
            <div class="te-field">
              <label>所在地</label>
              <input type="text" id="te-f-location" placeholder="例: 岐阜県郡上市明宝気良（気良八幡神社境内）">
            </div>
            <div class="te-field">
              <label>写真</label>
              <div class="te-upload-row">
                <input type="file" id="te-f-photo-file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none" onchange="TheaterEditor.uploadPhoto(this)">
                <button type="button" class="te-upload-btn" onclick="document.getElementById('te-f-photo-file').click()">📷 ファイルを選択</button>
                <span class="te-upload-status" id="te-photo-upload-status"></span>
              </div>
              <input type="hidden" id="te-f-photo_url">
              <div id="te-photo-preview" class="te-photo-preview"></div>
            </div>
            <div class="te-field">
              <label>説明文</label>
              <textarea id="te-f-description" rows="4" placeholder="芝居小屋の紹介文"></textarea>
            </div>
            <div class="te-form-grid">
              <div class="te-field">
                <label>収容人数</label>
                <input type="number" id="te-f-capacity" placeholder="例: 200" min="0">
              </div>
              <div class="te-field">
                <label>文化財指定</label>
                <input type="text" id="te-f-cultural_property" placeholder="例: 国登録有形文化財">
              </div>
            </div>
            <div class="te-section-divider">
              <label class="te-section-label">舞台設備</label>
              <div class="te-check-row">
                <label class="te-check-label"><input type="checkbox" id="te-f-has_hanamichi"> 花道</label>
                <label class="te-check-label"><input type="checkbox" id="te-f-has_mawari_butai"> 回り舞台</label>
                <label class="te-check-label"><input type="checkbox" id="te-f-has_suppon"> すっぽん</label>
              </div>
            </div>
            <div class="te-section-divider">
              <label class="te-section-label">施設情報</label>
              <div class="te-check-row">
                <label class="te-check-label"><input type="checkbox" id="te-f-visitable"> 見学可</label>
              </div>
              <div class="te-form-grid">
                <div class="te-field te-facility-field">
                  <label><input type="checkbox" id="te-f-has_toilet"> トイレ</label>
                  <input type="text" id="te-f-toilet_note" placeholder="例: 仮設トイレあり / 境内に公衆トイレ">
                </div>
                <div class="te-field te-facility-field">
                  <label><input type="checkbox" id="te-f-has_parking"> 駐車場</label>
                  <input type="text" id="te-f-parking_note" placeholder="例: 約30台 / 臨時駐車場あり">
                </div>
              </div>
              <div class="te-field">
                <label>アクセス情報</label>
                <textarea id="te-f-access_info" rows="2" placeholder="例: 東海北陸自動車道 郡上八幡ICから車で約30分"></textarea>
              </div>
              <div class="te-field">
                <label>位置情報（地図）</label>
                <div class="te-map-search-row">
                  <input type="text" id="te-map-search" class="te-map-search-input" placeholder="住所・施設名で検索…" onkeydown="if(event.key==='Enter'){event.preventDefault();TheaterEditor.searchMap()}">
                  <button type="button" class="te-map-search-btn" onclick="TheaterEditor.searchMap()">検索</button>
                </div>
                <div id="te-map-results" class="te-map-results" style="display:none"></div>
                <div id="te-map" class="te-map-container"></div>
                <div class="te-coords-row">
                  <span class="te-coords-label">緯度:</span>
                  <input type="number" id="te-f-latitude" step="any" class="te-coords-input" placeholder="--">
                  <span class="te-coords-label">経度:</span>
                  <input type="number" id="te-f-longitude" step="any" class="te-coords-input" placeholder="--">
                  <button type="button" class="te-coords-clear" onclick="TheaterEditor.clearCoords()" title="座標をクリア">&times;</button>
                </div>
              </div>
            </div>
            <div class="te-field">
              <label>関連GATEグループ</label>
              <div class="te-group-add-row">
                <select id="te-f-group-select" class="te-select te-group-select">
                  <option value="">選択してください</option>
                </select>
                <button type="button" class="te-group-add-btn" onclick="TheaterEditor.addGroup()">追加</button>
              </div>
              <div id="te-related-groups" class="te-related-groups"></div>
            </div>
          </div>
          <div class="te-form-footer">
            <span id="te-form-status" class="te-form-status"></span>
            <button type="button" class="te-cancel-btn" onclick="TheaterEditor.hideForm()">キャンセル</button>
            <button type="submit" class="btn btn-primary te-save-btn">保存</button>
          </div>
        </form>
      </div>
    </div>

    <script>
    (function() {
      var theaters = [];
      var editingId = null;

      function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

      function checkAuth() {
        fetch('/api/auth/me', { credentials: 'same-origin' })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (!d.loggedIn) { showError(); return; }
            if (!d.user.isEditor && !d.user.isMaster) { showError(); return; }
            loadTheaters();
            loadGroups();
          })
          .catch(function() { showError(); });
      }

      function showError() {
        document.getElementById('te-loading').style.display = 'none';
        document.getElementById('te-auth-error').style.display = '';
      }

      function loadTheaters() {
        fetch('/api/theaters')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            theaters = (data.theaters || []).sort(function(a, b) {
              return (a.name || '').localeCompare(b.name || '', 'ja');
            });
            document.getElementById('te-loading').style.display = 'none';
            document.getElementById('te-search-bar').style.display = '';
            renderList();
          })
          .catch(function() { showError(); });
      }

      function renderList() {
        var listEl = document.getElementById('te-list');
        listEl.style.display = '';
        var q = (document.getElementById('te-search').value || '').toLowerCase();
        var filtered = theaters.filter(function(t) {
          if (!q) return true;
          return (t.name || '').toLowerCase().indexOf(q) !== -1
            || (t.name_kana || '').toLowerCase().indexOf(q) !== -1
            || (t.location || '').toLowerCase().indexOf(q) !== -1
            || (t.group_name || '').toLowerCase().indexOf(q) !== -1;
        });
        document.getElementById('te-search-count').textContent = filtered.length + ' / ' + theaters.length + ' 件';

        if (!filtered.length) {
          listEl.innerHTML = '<div class="te-empty">芝居小屋が登録されていません</div>';
          return;
        }
        listEl.innerHTML = filtered.map(function(t) {
          var badges = [];
          if (t.has_hanamichi) badges.push('花道');
          if (t.has_mawari_butai) badges.push('回り舞台');
          if (t.has_suppon) badges.push('すっぽん');
          if (t.visitable) badges.push('見学可');
          if (t.has_toilet) badges.push('トイレ');
          if (t.has_parking) badges.push('駐車場');
          if (t.cultural_property) badges.push(esc(t.cultural_property));
          if (t.capacity) badges.push('収容 ' + t.capacity + ' 名');
          return '<div class="te-card">'
            + (t.photo_url ? '<div class="te-card-photo"><img src="' + esc(t.photo_url) + '" alt="' + esc(t.name) + '" loading="lazy"></div>' : '')
            + '<div class="te-card-body">'
            + '<div class="te-card-name">' + esc(t.name) + (t.name_kana ? '<span class="te-card-kana">（' + esc(t.name_kana) + '）</span>' : '') + '</div>'
            + (t.location ? '<div class="te-card-loc">' + esc(t.location) + '</div>' : '')
            + (badges.length ? '<div class="te-card-badges">' + badges.map(function(b) { return '<span class="te-badge">' + b + '</span>'; }).join('') + '</div>' : '')
            + (t.group_name ? '<div class="te-card-group">🏯 ' + esc(t.group_name) + '</div>' : '')
            + '</div>'
            + '<div class="te-card-actions">'
            + '<button class="te-edit-btn" onclick="TheaterEditor.edit(\\'' + esc(t.id) + '\\')" title="編集">✏️</button>'
            + '<button class="te-delete-btn" onclick="TheaterEditor.remove(\\'' + esc(t.id) + '\\')" title="削除">🗑️</button>'
            + '</div>'
            + '</div>';
        }).join('');
      }

      var idAutoMode = true;

      function kanaToRomaji(kana) {
        var map = {
          'あ':'a','い':'i','う':'u','え':'e','お':'o',
          'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
          'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
          'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
          'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
          'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
          'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
          'や':'ya','ゆ':'yu','よ':'yo',
          'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
          'わ':'wa','ゐ':'wi','ゑ':'we','を':'wo','ん':'n',
          'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
          'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
          'だ':'da','ぢ':'di','づ':'du','で':'de','ど':'do',
          'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
          'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
          'きゃ':'kya','きゅ':'kyu','きょ':'kyo',
          'しゃ':'sha','しゅ':'shu','しょ':'sho',
          'ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
          'にゃ':'nya','にゅ':'nyu','にょ':'nyo',
          'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
          'みゃ':'mya','みゅ':'myu','みょ':'myo',
          'りゃ':'rya','りゅ':'ryu','りょ':'ryo',
          'ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
          'じゃ':'ja','じゅ':'ju','じょ':'jo',
          'びゃ':'bya','びゅ':'byu','びょ':'byo',
          'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
          'ー':'','っ':'xtu','　':'_',' ':'_'
        };
        var result = '';
        var i = 0;
        while (i < kana.length) {
          if (i + 1 < kana.length && map[kana[i] + kana[i+1]]) {
            result += map[kana[i] + kana[i+1]];
            i += 2;
          } else if (map[kana[i]]) {
            if (kana[i] === 'っ' && i + 1 < kana.length) {
              var next2 = (i + 2 < kana.length && map[kana[i+1] + kana[i+2]]) ? map[kana[i+1] + kana[i+2]] : map[kana[i+1]];
              if (next2) { result += next2[0]; i++; continue; }
            }
            result += map[kana[i]];
            i++;
          } else {
            result += kana[i];
            i++;
          }
        }
        return result.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      }

      function onKanaInput() {
        if (!idAutoMode) return;
        var kana = (document.getElementById('te-f-name_kana').value || '').trim();
        var idInput = document.getElementById('te-f-id');
        if (kana) {
          idInput.value = kanaToRomaji(kana);
          document.getElementById('te-id-auto-badge').style.display = '';
        } else {
          idInput.value = '';
          document.getElementById('te-id-auto-badge').style.display = 'none';
        }
      }

      function showForm(theater) {
        editingId = theater ? theater.id : null;
        idAutoMode = !theater;
        document.getElementById('te-form-title').textContent = theater ? '芝居小屋を編集' : '新規登録';
        var idInput = document.getElementById('te-f-id');
        idInput.value = theater ? theater.id : '';
        idInput.readOnly = !!theater;
        document.getElementById('te-id-auto-badge').style.display = 'none';
        document.getElementById('te-f-name').value = theater ? (theater.name || '') : '';
        document.getElementById('te-f-name_kana').value = theater ? (theater.name_kana || '') : '';
        document.getElementById('te-f-location').value = theater ? (theater.location || '') : '';
        document.getElementById('te-f-photo_url').value = theater ? (theater.photo_url || '') : '';
        document.getElementById('te-f-description').value = theater ? (theater.description || '') : '';
        document.getElementById('te-f-capacity').value = theater && theater.capacity ? theater.capacity : '';
        document.getElementById('te-f-cultural_property').value = theater ? (theater.cultural_property || '') : '';
        document.getElementById('te-f-has_hanamichi').checked = theater ? !!theater.has_hanamichi : false;
        document.getElementById('te-f-has_mawari_butai').checked = theater ? !!theater.has_mawari_butai : false;
        document.getElementById('te-f-has_suppon').checked = theater ? !!theater.has_suppon : false;
        document.getElementById('te-f-visitable').checked = theater ? !!theater.visitable : false;
        document.getElementById('te-f-has_toilet').checked = theater ? !!theater.has_toilet : false;
        document.getElementById('te-f-toilet_note').value = theater ? (theater.toilet_note || '') : '';
        document.getElementById('te-f-has_parking').checked = theater ? !!theater.has_parking : false;
        document.getElementById('te-f-parking_note').value = theater ? (theater.parking_note || '') : '';
        document.getElementById('te-f-access_info').value = theater ? (theater.access_info || '') : '';
        document.getElementById('te-f-latitude').value = theater && theater.latitude ? theater.latitude : '';
        document.getElementById('te-f-longitude').value = theater && theater.longitude ? theater.longitude : '';
        if (theater && theater.related_groups && theater.related_groups.length) {
          relatedGroups = theater.related_groups.map(function(r) { return { group_id: r.group_id, group_name: r.group_name || r.group_id }; });
        } else if (theater && theater.gate_group_id) {
          relatedGroups = [{ group_id: theater.gate_group_id, group_name: theater.group_name || theater.gate_group_id }];
        } else {
          relatedGroups = [];
        }
        renderRelatedGroups();
        var groupSel = document.getElementById('te-f-group-select');
        if (groupSel) groupSel.value = '';
        document.getElementById('te-form-status').textContent = '';
        document.getElementById('te-form-status').className = 'te-form-status';
        document.getElementById('te-photo-upload-status').textContent = '';
        var fileInput = document.getElementById('te-f-photo-file');
        if (fileInput) fileInput.value = '';
        previewPhoto();
        document.getElementById('te-form-overlay').style.display = '';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('te-modal-open');
        var loc = document.getElementById('te-f-location').value || '';
        document.getElementById('te-map-search').value = loc;
        setTimeout(function() { initMap(); }, 100);
      }

      function hideForm() {
        document.getElementById('te-form-overlay').style.display = 'none';
        document.body.style.overflow = '';
        document.body.classList.remove('te-modal-open');
        editingId = null;
      }

      function edit(id) {
        var t = theaters.find(function(x) { return x.id === id; });
        if (t) showForm(t);
      }

      function save(e) {
        e.preventDefault();
        var statusEl = document.getElementById('te-form-status');
        statusEl.textContent = '保存中…';
        statusEl.className = 'te-form-status saving';

        var cap = document.getElementById('te-f-capacity').value;
        var lat = document.getElementById('te-f-latitude').value;
        var lng = document.getElementById('te-f-longitude').value;
        var theater = {
          id: document.getElementById('te-f-id').value.trim(),
          name: document.getElementById('te-f-name').value.trim(),
          name_kana: document.getElementById('te-f-name_kana').value.trim(),
          location: document.getElementById('te-f-location').value.trim(),
          photo_url: document.getElementById('te-f-photo_url').value.trim(),
          description: document.getElementById('te-f-description').value.trim(),
          capacity: cap ? parseInt(cap) : undefined,
          cultural_property: document.getElementById('te-f-cultural_property').value.trim() || undefined,
          has_hanamichi: document.getElementById('te-f-has_hanamichi').checked,
          has_mawari_butai: document.getElementById('te-f-has_mawari_butai').checked,
          has_suppon: document.getElementById('te-f-has_suppon').checked,
          visitable: document.getElementById('te-f-visitable').checked,
          has_toilet: document.getElementById('te-f-has_toilet').checked,
          toilet_note: document.getElementById('te-f-toilet_note').value.trim() || undefined,
          has_parking: document.getElementById('te-f-has_parking').checked,
          parking_note: document.getElementById('te-f-parking_note').value.trim() || undefined,
          access_info: document.getElementById('te-f-access_info').value.trim() || undefined,
          latitude: lat ? parseFloat(lat) : undefined,
          longitude: lng ? parseFloat(lng) : undefined,
          related_groups: relatedGroups.length ? relatedGroups : undefined,
          gate_group_id: relatedGroups.length ? relatedGroups[0].group_id : undefined,
          group_name: relatedGroups.length ? relatedGroups.map(function(r) { return r.group_name; }).join('、') : undefined,
        };

        fetch('/api/theaters', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theater: theater }),
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) {
            statusEl.textContent = '保存しました';
            statusEl.className = 'te-form-status saved';
            setTimeout(function() { hideForm(); loadTheaters(); }, 600);
          } else {
            statusEl.textContent = 'エラー: ' + (data.error || '保存に失敗');
            statusEl.className = 'te-form-status error';
          }
        })
        .catch(function(err) {
          statusEl.textContent = '通信エラー: ' + err;
          statusEl.className = 'te-form-status error';
        });
        return false;
      }

      function remove(id) {
        var t = theaters.find(function(x) { return x.id === id; });
        if (!t) return;
        if (!confirm('「' + t.name + '」を削除しますか？\\nこの操作は取り消せません。')) return;

        fetch('/api/theaters/' + encodeURIComponent(id), {
          method: 'DELETE',
          credentials: 'same-origin',
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.ok) loadTheaters();
          else alert('削除に失敗しました: ' + (data.error || ''));
        })
        .catch(function(err) { alert('通信エラー: ' + err); });
      }

      function uploadPhoto(fileInput) {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        var statusEl = document.getElementById('te-photo-upload-status');
        if (statusEl) { statusEl.textContent = 'アップロード中…'; statusEl.className = 'te-upload-status uploading'; }

        var formData = new FormData();
        formData.append('file', file);
        fetch('/api/theaters/images', {
          method: 'POST',
          credentials: 'same-origin',
          body: formData,
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.url) {
            document.getElementById('te-f-photo_url').value = data.url;
            previewPhoto();
            if (statusEl) { statusEl.textContent = 'アップロード完了'; statusEl.className = 'te-upload-status ok'; setTimeout(function() { statusEl.textContent = ''; statusEl.className = 'te-upload-status'; }, 3000); }
          } else {
            if (statusEl) { statusEl.textContent = 'エラー: ' + (data.error || '失敗'); statusEl.className = 'te-upload-status err'; }
          }
          fileInput.value = '';
        })
        .catch(function(err) {
          if (statusEl) { statusEl.textContent = '通信エラー: ' + err; statusEl.className = 'te-upload-status err'; }
          fileInput.value = '';
        });
      }

      var groupsCache = [];

      function loadGroups() {
        fetch('/api/groups')
          .then(function(r) { return r.json(); })
          .then(function(data) {
            groupsCache = data || [];
            populateGroupSelect();
          })
          .catch(function() {});
      }

      function populateGroupSelect() {
        var sel = document.getElementById('te-f-group-select');
        if (!sel) return;
        sel.innerHTML = '<option value="">選択してください</option>';
        groupsCache.forEach(function(g) {
          var opt = document.createElement('option');
          opt.value = g.group_id;
          opt.textContent = g.name + '（' + g.group_id + '）';
          sel.appendChild(opt);
        });
      }

      var relatedGroups = [];

      function addGroup() {
        var sel = document.getElementById('te-f-group-select');
        if (!sel || !sel.value) return;
        var gid = sel.value;
        if (relatedGroups.some(function(r) { return r.group_id === gid; })) return;
        var g = groupsCache.find(function(x) { return x.group_id === gid; });
        relatedGroups.push({ group_id: gid, group_name: g ? g.name : gid });
        sel.value = '';
        renderRelatedGroups();
      }

      function removeGroup(gid) {
        relatedGroups = relatedGroups.filter(function(r) { return r.group_id !== gid; });
        renderRelatedGroups();
      }

      function renderRelatedGroups() {
        var el = document.getElementById('te-related-groups');
        if (!el) return;
        if (!relatedGroups.length) { el.innerHTML = ''; return; }
        el.innerHTML = relatedGroups.map(function(r) {
          return '<div class="te-related-tag">'
            + '<span>' + esc(r.group_name) + '<span class="te-related-id">(' + esc(r.group_id) + ')</span></span>'
            + '<button type="button" class="te-related-remove" onclick="TheaterEditor.removeGroup(\\'' + esc(r.group_id) + '\\')">&times;</button>'
            + '</div>';
        }).join('');
      }

      var teMap = null;
      var teMarker = null;

      function initMap() {
        var mapEl = document.getElementById('te-map');
        if (!mapEl) return;
        if (teMap) { teMap.remove(); teMap = null; teMarker = null; }

        var latVal = parseFloat(document.getElementById('te-f-latitude').value);
        var lngVal = parseFloat(document.getElementById('te-f-longitude').value);
        var hasCoords = !isNaN(latVal) && !isNaN(lngVal);

        var center = hasCoords ? [latVal, lngVal] : [36.5, 137.0];
        var zoom = hasCoords ? 15 : 5;

        teMap = L.map('te-map', { scrollWheelZoom: true }).setView(center, zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(teMap);

        if (hasCoords) {
          teMarker = L.marker(center).addTo(teMap);
        }

        teMap.on('click', function(e) {
          setMapCoords(e.latlng.lat, e.latlng.lng);
        });

        teMap.invalidateSize();
      }

      function setMapCoords(lat, lng) {
        document.getElementById('te-f-latitude').value = Math.round(lat * 1000000) / 1000000;
        document.getElementById('te-f-longitude').value = Math.round(lng * 1000000) / 1000000;
        if (!teMap) return;
        if (teMarker) {
          teMarker.setLatLng([lat, lng]);
        } else {
          teMarker = L.marker([lat, lng]).addTo(teMap);
        }
        teMap.setView([lat, lng], Math.max(teMap.getZoom(), 14));
      }

      function clearCoords() {
        document.getElementById('te-f-latitude').value = '';
        document.getElementById('te-f-longitude').value = '';
        if (teMarker && teMap) { teMap.removeLayer(teMarker); teMarker = null; }
      }

      function buildSearchQueries(q) {
        var queries = [q];
        var stripped = q.replace(/[\(（].*?[\)）]/g, '').trim();
        if (stripped !== q) queries.push(stripped);
        var noNum = stripped.replace(/[0-9０-９]+[-ー－の]*[0-9０-９]*/g, '').replace(/\s+/g, '').trim();
        if (noNum && noNum !== stripped) queries.push(noNum);
        var seen = {};
        return queries.filter(function(v) { if (seen[v]) return false; seen[v] = true; return v.length > 0; });
      }

      function nominatimFetch(q) {
        return fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q) + '&limit=5&countrycodes=jp&accept-language=ja', {
          headers: { 'User-Agent': 'KabukiPlus-TheaterEditor/1.0' }
        }).then(function(r) { return r.json(); });
      }

      function searchMap() {
        var q = (document.getElementById('te-map-search').value || '').trim();
        if (!q) return;
        var btn = document.querySelector('.te-map-search-btn');
        var resultsEl = document.getElementById('te-map-results');
        if (btn) btn.textContent = '検索中…';
        if (resultsEl) { resultsEl.style.display = 'none'; resultsEl.innerHTML = ''; }

        var queries = buildSearchQueries(q);
        var idx = 0;

        function tryNext() {
          if (idx >= queries.length) {
            if (btn) btn.textContent = '検索';
            if (resultsEl) { resultsEl.innerHTML = '<div class="te-map-no-result">検索結果が見つかりませんでした</div>'; resultsEl.style.display = ''; }
            return;
          }
          nominatimFetch(queries[idx])
            .then(function(results) {
              if (results && results.length > 0) {
                if (btn) btn.textContent = '検索';
                showSearchResults(results);
              } else {
                idx++;
                setTimeout(tryNext, 300);
              }
            })
            .catch(function() {
              if (btn) btn.textContent = '検索';
              if (resultsEl) { resultsEl.innerHTML = '<div class="te-map-no-result">検索に失敗しました</div>'; resultsEl.style.display = ''; }
            });
        }
        tryNext();
      }

      function showSearchResults(results) {
        var resultsEl = document.getElementById('te-map-results');
        if (results.length === 1) {
          selectSearchResult(results[0]);
          return;
        }
        if (resultsEl) {
          resultsEl.innerHTML = results.map(function(r, i) {
            return '<button type="button" class="te-map-result-item" onclick="TheaterEditor.pickResult(' + i + ')">' + esc(r.display_name) + '</button>';
          }).join('');
          resultsEl.style.display = '';
        }
        window.__teSearchResults = results;
      }

      function selectSearchResult(r) {
        var resultsEl = document.getElementById('te-map-results');
        if (resultsEl) { resultsEl.style.display = 'none'; resultsEl.innerHTML = ''; }
        setMapCoords(parseFloat(r.lat), parseFloat(r.lon));
      }

      function pickResult(idx) {
        var results = window.__teSearchResults;
        if (results && results[idx]) selectSearchResult(results[idx]);
      }

      function previewPhoto() {
        var url = (document.getElementById('te-f-photo_url').value || '').trim();
        var prev = document.getElementById('te-photo-preview');
        if (url) {
          prev.innerHTML = '<img src="' + esc(url) + '" alt="プレビュー">';
        } else {
          prev.innerHTML = '';
        }
      }

      function filter() { renderList(); }

      checkAuth();

      window.TheaterEditor = {
        showForm: function() { showForm(null); },
        hideForm: hideForm,
        edit: edit,
        save: save,
        remove: remove,
        filter: filter,
        uploadPhoto: uploadPhoto,
        previewPhoto: previewPhoto,
        searchMap: searchMap,
        clearCoords: clearCoords,
        pickResult: pickResult,
        addGroup: addGroup,
        removeGroup: removeGroup,
        onKanaInput: onKanaInput,
        onIdManualEdit: function() { idAutoMode = false; document.getElementById('te-id-auto-badge').style.display = 'none'; },
      };
    })();
    </script>
  `;

  return pageShell({
    title: "芝居小屋管理",
    subtitle: "BASE管理",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    ogDesc: "芝居小屋の登録・編集・削除",
    headExtra: `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""><\/script>
    <style>
      .te-welcome {
        padding: 20px 0 18px;
        border-bottom: 1px solid var(--border-light);
        margin-bottom: 24px;
      }
      .te-welcome-main {
        display: flex; align-items: center; justify-content: space-between;
        gap: 16px; flex-wrap: wrap;
      }
      .te-welcome-actions {
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      }
      .te-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 20px; font-weight: 700; margin: 0;
        color: var(--text-primary);
      }
      .te-subtitle {
        font-size: 13px; color: var(--text-secondary); margin: 4px 0 0;
      }
      .te-back-btn {
        font-size: 13px; color: var(--gold-dark); text-decoration: none;
        padding: 6px 14px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); transition: all 0.15s; white-space: nowrap;
      }
      .te-back-btn:hover {
        border-color: var(--gold); background: var(--gold-soft); text-decoration: none;
      }
      .te-add-btn {
        white-space: nowrap;
      }
      .te-error {
        text-align: center; padding: 40px 20px;
        color: var(--accent-1); font-size: 15px;
      }
      .te-error a { color: var(--gold-dark); }

      /* 検索 */
      .te-search-bar {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 16px;
      }
      .te-search-input {
        flex: 1; padding: 9px 14px;
        border: 1px solid var(--border-medium); border-radius: var(--radius-sm);
        font-size: 14px; font-family: inherit;
        background: #fff; color: var(--text-primary); outline: none;
        transition: border-color 0.2s;
      }
      .te-search-input:focus {
        border-color: var(--gold); box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
      }
      .te-search-count {
        font-size: 12px; color: var(--text-tertiary); white-space: nowrap;
      }

      /* 一覧 */
      .te-list { display: flex; flex-direction: column; gap: 12px; }
      .te-empty {
        text-align: center; padding: 40px 20px;
        font-size: 14px; color: var(--text-tertiary);
      }
      .te-card {
        display: flex; gap: 16px; align-items: flex-start;
        padding: 16px; background: var(--bg-card);
        border: 1px solid var(--border-light); border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm); transition: border-color 0.2s;
      }
      .te-card:hover { border-color: var(--gold-light); }
      .te-card-photo {
        flex-shrink: 0; width: 120px; height: 80px;
        border-radius: var(--radius-sm); overflow: hidden;
        background: var(--bg-subtle);
      }
      .te-card-photo img {
        width: 100%; height: 100%; object-fit: cover; display: block;
      }
      .te-card-body { flex: 1; min-width: 0; }
      .te-card-name {
        font-family: 'Noto Serif JP', serif;
        font-size: 15px; font-weight: 700; color: var(--text-primary);
        margin-bottom: 2px;
      }
      .te-card-loc {
        font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;
      }
      .te-card-badges {
        display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px;
      }
      .te-badge {
        display: inline-block; font-size: 11px; font-weight: 600;
        padding: 2px 8px; border-radius: 8px;
        background: var(--bg-subtle); color: var(--gold-dark);
        border: 1px solid var(--border-light);
      }
      .te-card-kana {
        font-size: 12px; font-weight: 400; color: var(--text-tertiary);
        margin-left: 4px;
      }
      .te-card-group {
        font-size: 11px; color: var(--text-tertiary);
      }
      .te-card-actions {
        display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;
      }
      .te-edit-btn, .te-delete-btn {
        background: none; border: 1px solid var(--border-light);
        border-radius: var(--radius-sm); width: 34px; height: 34px;
        font-size: 14px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.15s;
      }
      .te-edit-btn:hover {
        border-color: var(--gold); background: var(--gold-soft);
      }
      .te-delete-btn:hover {
        border-color: var(--accent-1); background: rgba(220,53,69,0.06);
      }

      /* モーダル */
      body.te-modal-open footer { z-index: 0 !important; }
      .te-form-overlay {
        position: fixed; inset: 0; z-index: 1000;
        background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
      }
      .te-form-modal {
        background: var(--bg-card); border-radius: var(--radius-md);
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        width: 100%; max-width: 640px; max-height: 90vh;
        display: flex; flex-direction: column; overflow: hidden;
      }
      .te-form-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px; border-bottom: 1px solid var(--border-light);
      }
      .te-form-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px; font-weight: 700; margin: 0;
        color: var(--text-primary);
      }
      .te-close-btn {
        background: none; border: none; font-size: 22px;
        color: var(--text-tertiary); cursor: pointer;
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; transition: all 0.15s;
      }
      .te-close-btn:hover {
        background: var(--bg-subtle); color: var(--text-primary);
      }
      #te-form {
        display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;
      }
      .te-form-body {
        padding: 20px; overflow-y: auto; flex: 1; min-height: 0;
      }
      .te-form-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px;
      }
      .te-field { margin-bottom: 14px; }
      .te-field label {
        display: block; font-size: 12px; font-weight: 600;
        color: var(--text-secondary); margin-bottom: 4px;
      }
      .te-required { color: var(--accent-1); }
      .te-group-add-row {
        display: flex; gap: 8px; margin-bottom: 8px;
      }
      .te-group-select { flex: 1; }
      .te-group-add-btn {
        padding: 7px 14px; font-size: 13px; font-family: inherit;
        background: var(--bg-subtle); border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); color: var(--text-secondary);
        cursor: pointer; transition: all 0.15s; white-space: nowrap;
      }
      .te-group-add-btn:hover {
        border-color: var(--gold); background: var(--gold-soft); color: var(--gold-dark);
      }
      .te-related-groups {
        display: flex; flex-wrap: wrap; gap: 6px;
      }
      .te-related-tag {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 10px; font-size: 13px;
        background: var(--bg-subtle); border: 1px solid var(--border-light);
        border-radius: 16px; color: var(--text-primary);
      }
      .te-related-id {
        font-size: 11px; color: var(--text-tertiary); margin-left: 2px;
      }
      .te-related-remove {
        background: none; border: none; font-size: 14px; line-height: 1;
        color: var(--text-tertiary); cursor: pointer; padding: 0;
        transition: color 0.15s;
      }
      .te-related-remove:hover { color: var(--accent-1); }
      .te-select {
        width: 100%; padding: 9px 12px;
        border: 1px solid var(--border-medium); border-radius: var(--radius-sm);
        font-size: 14px; font-family: inherit;
        background: #fff; color: var(--text-primary); outline: none;
        transition: border-color 0.2s; cursor: pointer;
      }
      .te-select:focus {
        border-color: var(--gold); box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
      }
      .te-field input, .te-field textarea {
        width: 100%; padding: 9px 12px;
        border: 1px solid var(--border-medium); border-radius: var(--radius-sm);
        font-size: 14px; font-family: inherit;
        background: #fff; color: var(--text-primary); outline: none;
        transition: border-color 0.2s;
      }
      .te-field input:focus, .te-field textarea:focus {
        border-color: var(--gold); box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
      }
      .te-field input[readonly] {
        background: var(--bg-subtle); color: var(--text-tertiary);
      }
      .te-field-hint {
        font-size: 11px; color: var(--text-tertiary); margin-top: 2px; display: block;
      }
      .te-id-row {
        display: flex; align-items: center; gap: 8px;
      }
      .te-id-row input { flex: 1; }
      .te-id-auto-badge {
        font-size: 10px; font-weight: 600; color: var(--accent-3);
        background: rgba(46,125,50,0.08); border: 1px solid rgba(46,125,50,0.2);
        padding: 2px 8px; border-radius: 8px; white-space: nowrap;
      }
      .te-check-row {
        display: flex; gap: 1.5rem; margin-bottom: 14px; flex-wrap: wrap;
      }
      .te-check-label {
        display: flex; align-items: center; gap: 6px;
        font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer;
      }
      .te-check-label input[type="checkbox"] {
        accent-color: var(--gold-dark); width: 16px; height: 16px; cursor: pointer;
      }
      .te-section-divider {
        border-top: 1px solid var(--border-light);
        padding-top: 14px; margin-top: 4px; margin-bottom: 14px;
      }
      .te-section-label {
        display: block; font-size: 13px; font-weight: 700;
        color: var(--gold-dark); margin-bottom: 10px;
      }
      .te-facility-field label {
        display: flex !important; align-items: center; gap: 6px; cursor: pointer;
      }
      .te-facility-field label input[type="checkbox"] {
        accent-color: var(--gold-dark); width: 16px; height: 16px; cursor: pointer;
      }
      /* 地図 */
      .te-map-container {
        height: 250px; border-radius: var(--radius-sm);
        border: 1px solid var(--border-medium); margin-bottom: 8px;
        z-index: 0;
      }
      .te-map-search-row {
        display: flex; gap: 8px; margin-bottom: 8px;
      }
      .te-map-search-input {
        flex: 1; padding: 7px 12px;
        border: 1px solid var(--border-medium); border-radius: var(--radius-sm);
        font-size: 13px; font-family: inherit;
        background: #fff; color: var(--text-primary); outline: none;
      }
      .te-map-search-input:focus {
        border-color: var(--gold); box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
      }
      .te-map-search-btn {
        padding: 7px 14px; font-size: 13px; font-family: inherit;
        background: var(--bg-subtle); border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); color: var(--text-secondary);
        cursor: pointer; transition: all 0.15s; white-space: nowrap;
      }
      .te-map-search-btn:hover {
        border-color: var(--gold); background: var(--gold-soft); color: var(--gold-dark);
      }
      .te-map-results {
        max-height: 140px; overflow-y: auto;
        border: 1px solid var(--border-medium); border-radius: var(--radius-sm);
        margin-bottom: 8px; background: #fff;
      }
      .te-map-result-item {
        display: block; width: 100%; text-align: left;
        padding: 8px 12px; border: none; border-bottom: 1px solid var(--border-light);
        background: none; font-size: 12px; font-family: inherit;
        color: var(--text-primary); cursor: pointer; transition: background 0.1s;
      }
      .te-map-result-item:last-child { border-bottom: none; }
      .te-map-result-item:hover { background: var(--gold-soft); }
      .te-map-no-result {
        padding: 8px 12px; font-size: 12px; color: var(--text-tertiary);
      }
      .te-coords-row {
        display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      }
      .te-coords-label {
        font-size: 12px; font-weight: 600; color: var(--text-secondary);
      }
      .te-coords-input {
        width: 110px; padding: 5px 8px;
        border: 1px solid var(--border-light); border-radius: var(--radius-sm);
        font-size: 12px; font-family: inherit;
        background: #fff; color: var(--text-primary); outline: none;
      }
      .te-coords-input:focus {
        border-color: var(--gold);
      }
      .te-coords-clear {
        background: none; border: 1px solid var(--border-light);
        border-radius: var(--radius-sm); width: 26px; height: 26px;
        font-size: 14px; color: var(--text-tertiary); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.15s;
      }
      .te-coords-clear:hover {
        border-color: var(--accent-1); color: var(--accent-1); background: rgba(220,53,69,0.06);
      }

      .te-upload-row {
        display: flex; align-items: center; gap: 10px; margin-bottom: 4px;
      }
      .te-upload-btn {
        padding: 7px 16px; font-size: 13px; font-family: inherit;
        background: var(--bg-subtle); border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); color: var(--text-secondary);
        cursor: pointer; transition: all 0.15s; white-space: nowrap;
      }
      .te-upload-btn:hover {
        border-color: var(--gold); background: var(--gold-soft); color: var(--gold-dark);
      }
      .te-upload-status { font-size: 12px; }
      .te-upload-status.uploading { color: var(--text-tertiary); }
      .te-upload-status.ok { color: var(--accent-3); font-weight: 600; }
      .te-upload-status.err { color: var(--accent-1); }
      .te-photo-preview {
        margin-top: 6px;
      }
      .te-photo-preview img {
        max-width: 100%; max-height: 140px;
        border-radius: 6px; border: 1px solid var(--border-light);
        display: block;
      }

      /* フッター */
      .te-form-footer {
        display: flex; align-items: center; justify-content: flex-end; gap: 12px;
        padding: 14px 20px; border-top: 1px solid var(--border-light);
        background: var(--bg-subtle);
      }
      .te-form-status { font-size: 13px; margin-right: auto; }
      .te-form-status.saving { color: var(--text-tertiary); }
      .te-form-status.saved { color: var(--accent-3); font-weight: 600; }
      .te-form-status.error { color: var(--accent-1); }
      .te-cancel-btn {
        padding: 8px 18px; font-size: 13px; font-family: inherit;
        background: none; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); color: var(--text-secondary);
        cursor: pointer; transition: all 0.15s;
      }
      .te-cancel-btn:hover { border-color: var(--gold); background: var(--gold-soft); }
      .te-save-btn { min-width: 80px; justify-content: center; }

      @media (max-width: 600px) {
        .te-form-grid { grid-template-columns: 1fr; }
        .te-card { flex-direction: column; }
        .te-card-photo { width: 100%; height: 160px; }
        .te-card-actions { flex-direction: row; }
      }
    </style>`
  });
}
