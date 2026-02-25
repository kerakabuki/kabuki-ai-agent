// src/group_enmoku_select_page.js
// =========================================================
// 演目選定サポート — /groups/:groupId/enmoku-select
// フィルタリング型 → 配役決めサポート
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupEnmokuSelectPageHTML(group, googleClientId) {
  if (!group) {
    return pageShell({
      title: "団体が見つかりません",
      bodyHTML: `<div class="empty-state">指定された団体は登録されていません。</div>`,
      brand: "jikabuki",
      activeNav: "base",
    });
  }

  const g = group;
  const name = escHTML(g.name || "");
  const gid = escHTML(g.group_id || "");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span><a href="/jikabuki/gate/${gid}">${name}</a><span>&rsaquo;</span>演目選定サポート
    </div>

    <div id="es-plans-wrap"></div>
    <div id="es-main-wrap"><div class="loading">読み込み中...</div></div>

    <script>
    (function(){
      var GID = "${gid}";
      var candidates = [];
      var filtered = [];
      var savedPlans = [];
      var canSave = false;
      var editingPlanId = null;
      var lastFocusedRoleIdx = null;
      var participatingActors = {}; // { actorName: boolean }
      var draggingActor = null;
      var tappedActor = null;
      var customRoles = []; // 手動追加した役名
      var customActors = []; // 手動追加したメンバー { name }

      function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

      var GENRE_LABEL = { jidaimono:"時代物", sewamono:"世話物", shosagoto:"所作事・舞踊", other:"その他" };

      // ── 初期化 ──
      function init() {
        Promise.all([
          fetch("/api/groups/" + GID + "/enmoku-select/candidates").then(function(r){ return r.json(); }).catch(function(){ return { candidates: [] }; }),
          fetch("/api/groups/" + GID + "/casting/plans").then(function(r){ return r.json(); }).catch(function(){ return { plans: [] }; }),
          fetch("/api/auth/me").then(function(r){ return r.json(); }).catch(function(){ return {}; })
        ]).then(function(results) {
          candidates = results[0].candidates || [];
          savedPlans = results[1].plans || [];
          var me = results[2];
          if (me && me.loggedIn && me.user) {
            var u = me.user;
            if (u.isMaster || u.isEditor) { canSave = true; }
            else if (u.groups) {
              var membership = u.groups.find(function(g){ return g.group_id === GID || g.groupId === GID; });
              if (membership) canSave = true;
            }
          }
          renderFilterView();
          renderPlansSection();
        });
      }

      // ─────────────────────────────────────────
      //  フィルタービュー
      // ─────────────────────────────────────────

      function renderFilterView() {
        var h = '<div class="es-filter-panel">'
          + '<div class="es-filter-header">'
          + '<span class="es-filter-title">絞り込み条件</span>'
          + '<span class="es-filter-hint">条件を変えると即座に更新されます</span>'
          + '</div>'
          + '<div class="es-filter-rows">'
          + filterGroup("参加できる役者数", radioGroup("actor_max", [
              { value:"5",   label:"5人以下" },
              { value:"10",  label:"10人以下" },
              { value:"15",  label:"15人以下" },
              { value:"any", label:"制限なし", checked:true }
            ]))
          + filterGroup("子役の参加", radioGroup("kodomo", [
              { value:"no",  label:"参加できない", checked:true },
              { value:"yes", label:"参加できる" }
            ]))
          + filterGroup("上演時間の上限", radioGroup("duration_max", [
              { value:"30",  label:"30分以内" },
              { value:"60",  label:"60分以内" },
              { value:"90",  label:"90分以内" },
              { value:"any", label:"制限なし", checked:true }
            ]))
          + filterGroup("ジャンル", radioGroup("genre", [
              { value:"any",       label:"すべて", checked:true },
              { value:"jidaimono", label:"時代物" },
              { value:"sewamono",  label:"世話物" },
              { value:"shosagoto", label:"所作事" }
            ]))
          + '</div></div>'
          + '<div class="es-results-bar">'
          + '<span class="es-results-count" id="es-results-count"></span>'
          + '<div class="es-sort-group">'
          + '<span class="es-sort-label">並び替え：</span>'
          + radioGroup("sort", [
              { value:"past",  label:"実績順",   checked:true },
              { value:"cast",  label:"役者数順" },
              { value:"title", label:"演目名順" }
            ])
          + '</div></div>'
          + '<div id="es-results-list"></div>';

        document.getElementById("es-main-wrap").innerHTML = h;
        document.querySelectorAll('#es-main-wrap input[type="radio"]').forEach(function(el) {
          el.addEventListener("change", filterAndRender);
        });
        filterAndRender();
      }

      function getFilterState() {
        function val(name) {
          var el = document.querySelector('#es-main-wrap input[name="' + name + '"]:checked');
          return el ? el.value : null;
        }
        return {
          actor_max: val("actor_max") || "any",
          kodomo: val("kodomo") || "no",
          duration_max: val("duration_max") || "any",
          genre: val("genre") || "any",
          sort: val("sort") || "past"
        };
      }

      function filterAndRender() {
        var f = getFilterState();
        filtered = filterCandidates(candidates, f);
        renderResultsList(filtered);
      }

      function filterCandidates(cands, f) {
        return cands.filter(function(c) {
          if (f.kodomo === "no" && c.has_kodomo) return false;
          if (f.actor_max !== "any" && c.known_cast_size != null && c.known_cast_size > +f.actor_max) return false;
          if (f.duration_max !== "any" && c.known_duration_min != null && c.known_duration_min > +f.duration_max) return false;
          if (f.genre !== "any") {
            var g = c.catalog_genre || c.known_genre;
            if (g && g !== f.genre) return false;
          }
          return true;
        }).sort(function(a, b) {
          if (f.sort === "cast") {
            if (a.known_cast_size == null && b.known_cast_size == null) return 0;
            if (a.known_cast_size == null) return 1;
            if (b.known_cast_size == null) return -1;
            return a.known_cast_size - b.known_cast_size;
          }
          if (f.sort === "title") return (a.title || "").localeCompare(b.title || "", "ja");
          if (b.past_count !== a.past_count) return b.past_count - a.past_count;
          if (a.known_cast_size != null && b.known_cast_size != null) return a.known_cast_size - b.known_cast_size;
          return 0;
        });
      }

      function renderResultsList(list) {
        var countEl = document.getElementById("es-results-count");
        if (countEl) countEl.textContent = list.length + "件の演目";
        var wrap = document.getElementById("es-results-list");
        if (!wrap) return;
        if (!list.length) {
          wrap.innerHTML = '<div class="empty-state es-empty-filter">条件に合う演目が見つかりませんでした。条件を変えてみてください。</div>';
          return;
        }
        var h = '<div class="es-candidates">';
        list.forEach(function(c, idx) { h += renderCandidateCard(c, idx); });
        h += '</div>';
        wrap.innerHTML = h;
      }

      // ─────────────────────────────────────────
      //  候補カード
      // ─────────────────────────────────────────

      function renderCandidateCard(c, idx) {
        var h = '<div class="es-candidate-card">'
          + '<div class="es-card-body">'
          + '<div class="es-card-header-row">'
          + '<div class="es-card-title-block">'
          + '<span class="es-card-title">' + esc(c.title) + '</span>'
          + (c.full_title && c.full_title !== c.title ? '<div class="es-card-full-title">' + esc(c.full_title) + '</div>' : '')
          + '</div>'
          + '<div class="es-card-meta-badges">'
          + (c.past_count > 0 ? '<span class="es-badge es-badge-past">実績 ' + c.past_count + '回</span>' : '<span class="es-badge es-badge-new">初演</span>')
          + (c.naviId ? '<a href="/kabuki/navi/enmoku/' + esc(c.naviId) + '" target="_blank" class="es-badge es-badge-navi">NAVI →</a>' : '')
          + '</div></div>';

        if (c.past_records && c.past_records.length) {
          h += '<div class="es-card-past-records"><span class="es-card-past-label">過去公演：</span>'
            + c.past_records.map(function(r){
                return '<span class="es-card-past-item">' + esc(String(r.year||"")) + (r.date_display ? " " + esc(r.date_display) : "") + '</span>';
              }).join("") + '</div>';
        }

        var displayGenre = c.catalog_genre || c.known_genre;
        var infoBadgeHtml = "";
        var hasRefBadge = false;
        if (c.known_cast_size != null) {
          if (c.cast_source === "catalog") {
            hasRefBadge = true;
            infoBadgeHtml += '<span class="es-badge es-badge-info es-badge-info-ref" title="演目の標準的な役数です">'
              + esc("役 " + c.known_cast_size + "人") + '<span class="es-badge-ref-mark">（参考）</span></span>';
          } else {
            infoBadgeHtml += '<span class="es-badge es-badge-info">' + esc("役 " + c.known_cast_size + "人") + '</span>';
          }
        }
        if (c.known_duration_min != null) {
          if (c.duration_source === "catalog") {
            hasRefBadge = true;
            infoBadgeHtml += '<span class="es-badge es-badge-info es-badge-info-ref" title="演目の一般的な目安です">'
              + esc("約 " + c.known_duration_min + "分") + '<span class="es-badge-ref-mark">（参考）</span></span>';
          } else {
            infoBadgeHtml += '<span class="es-badge es-badge-info">' + esc("約 " + c.known_duration_min + "分") + '</span>';
          }
        }
        if (c.has_kodomo) {
          infoBadgeHtml += '<span class="es-badge es-badge-kodomo">子役あり</span>';
        }
        if (displayGenre) {
          infoBadgeHtml += '<span class="es-badge es-badge-info">' + esc(GENRE_LABEL[displayGenre] || displayGenre) + '</span>';
        }
        if (infoBadgeHtml) {
          h += '<div class="es-card-info-badges">' + infoBadgeHtml + '</div>';
        }
        if (hasRefBadge) {
          h += '<div class="es-ref-note">※（参考）は演目の一般的な目安です。</div>';
        }

        if (c.cast_names && c.cast_names.length) {
          h += '<div class="es-card-cast">'
            + '<span class="es-card-cast-label">登場人物</span>'
            + '<span class="es-card-cast-names">' + c.cast_names.map(function(n){ return esc(n); }).join('・') + '</span>'
            + '</div>';
        }

        h += '</div>'
          + '<div class="es-card-actions">'
          + '<button class="btn btn-primary btn-sm" onclick="ES.openCasting(' + idx + ')">配役を組む →</button>'
          + '</div></div>';
        return h;
      }

      // ─────────────────────────────────────────
      //  配役ビュー
      // ─────────────────────────────────────────

      var castingCtx = null;

      function openCasting(idx) {
        var c = filtered[idx];
        if (!c) return;
        participatingActors = {};
        draggingActor = null;
        tappedActor = null;
        customRoles = [];
        customActors = [];
        document.getElementById("es-main-wrap").innerHTML = '<div class="loading">配役データを読み込み中...</div>';

        fetch("/api/groups/" + GID + "/casting/context/" + encodeURIComponent(c.id))
          .then(function(r){ return r.json(); })
          .then(function(data) {
            if (data.error) { alert("エラー: " + data.error); renderFilterView(); return; }
            castingCtx = data;
            castingCtx._candidate = c;
            renderCastingView();
          })
          .catch(function(e) { alert("読み込みに失敗しました: " + e.message); renderFilterView(); });
      }

      function renderCastingView() {
        var ctx = castingCtx;
        if (!ctx) return;
        var c = ctx._candidate || {};
        var prefill = ctx._prefill || [];
        var prefillNote = ctx._note || "";
        var roles = ctx.roles || [];
        var saveLabel = editingPlanId ? '配役案を更新' : '配役案を保存';

        // ── ヘッダー ──
        var h = '<div class="es-casting-wrap">'
          + '<button class="es-back-btn" onclick="ES.backToFilter()">← 候補一覧に戻る</button>'
          + '<div class="es-casting-header">'
          + '<h3 class="es-casting-title">' + esc(ctx.title) + ' の配役を組む'
          + (editingPlanId ? ' <span class="es-editing-badge">編集中</span>' : '') + '</h3>'
          + (ctx.full_title && ctx.full_title !== ctx.title ? '<div class="es-casting-subtitle">' + esc(ctx.full_title) + '</div>' : '')
          + (c.naviId ? '<a href="/kabuki/navi/enmoku/' + esc(c.naviId) + '" target="_blank" class="es-casting-navi-link">NAVIで演目詳細を確認 →</a>' : '')
          + '</div>';

        // ── 過去の配役（折りたたみ） ──
        if (ctx.past_casts && ctx.past_casts.length) {
          h += '<details class="es-past-details">'
            + '<summary class="es-past-summary">過去の配役（' + ctx.past_casts.length + '回）</summary>';
          ctx.past_casts.forEach(function(pc) {
            h += '<div class="es-past-block">'
              + '<div class="es-past-year">' + esc(String(pc.year || "")) + '年' + (pc.date_display ? ' ' + esc(pc.date_display) : '') + '</div>'
              + '<div class="es-past-assignments">';
            (pc.assignments || []).forEach(function(a) {
              h += '<span class="es-past-chip"><span class="es-past-role">' + esc(a.role) + '</span> ' + esc(a.actor) + '</span>';
            });
            h += '</div></div>';
          });
          h += '</details>';
        }

        // ── メンバー欄 ──
        h += '<div class="es-members-section">'
          + '<div class="es-section-label-row">'
          + '<div class="es-section-label">メンバー</div>'
          + '<span class="es-member-hint">クリックして役者プールに追加</span>'
          + '</div>'
          + '<div id="es-member-chips"></div>'
          + '<div class="es-add-member-row">'
          + '<input type="text" id="es-new-actor-input" class="es-new-actor-input" placeholder="メンバーを追加..."'
          + ' onkeydown="ES.onNewActorKeydown(event)">'
          + '<button class="es-add-actor-btn" onclick="ES.addCustomActor()">＋ 追加</button>'
          + '</div>'
          + '</div>';

        // ── 役者プール ──
        h += '<div class="es-pool-section">'
          + '<div class="es-section-label-row">'
          + '<div class="es-section-label">役者プール</div>'
          + '<span class="es-pool-section-hint">ドラッグして役名欄へ配置（スマホはタップ→役名欄タップ）</span>'
          + '</div>'
          + '<div class="es-pool-chips" id="es-pool-chips"></div>'
          + '<div class="es-pool-empty-hint" id="es-pool-empty-hint">← メンバーをクリックして追加してください</div>'
          + '</div>';

        // ── 配役エリア ──
        h += '<div class="es-assign-section">'
          + '<div class="es-section-label-row">'
          + '<div class="es-section-label">配役案</div>'
          + '<div class="es-completion-display" id="es-fill-count">0 / ' + roles.length + ' 役</div>'
          + '</div>'
          + '<div class="es-bar-track"><div class="es-bar-fill" id="es-bar-fill" style="width:0%"></div></div>'
          + '<div id="es-dup-warning" class="es-dup-warning" style="display:none">'
          + '⚠ <span id="es-dup-names"></span> が複数の役に割り当てられています</div>';

        h += '<div class="es-assign-table" id="es-assign-table"></div>';

        h += '<div class="es-add-role-row">'
          + '<input type="text" id="es-new-role-input" class="es-new-role-input" placeholder="役名を追加..."'
          + ' onkeydown="ES.onNewRoleKeydown(event)">'
          + '<button class="es-add-role-btn" onclick="ES.addCustomRole()">＋ 追加</button>'
          + '</div>';

        h += '<div class="es-assign-note-group">'
          + '<label class="es-label">メモ（任意）</label>'
          + '<textarea id="es-cast-note" class="es-textarea" rows="3" placeholder="配役の理由や備考など">' + esc(prefillNote) + '</textarea>'
          + '</div>';

        if (canSave) {
          h += '<div class="es-form-actions">'
            + '<button class="btn btn-primary es-save-cast-btn" onclick="ES.saveCasting()">' + saveLabel + '</button>'
            + '<button class="btn btn-secondary" onclick="ES.backToFilter()">← 戻る</button>'
            + '</div>';
        } else {
          h += '<div class="es-auth-notice">配役案の保存はグループメンバーのログインが必要です。</div>'
            + '<div class="es-form-actions"><button class="btn btn-secondary" onclick="ES.backToFilter()">← 戻る</button></div>';
        }

        h += '</div></div>';
        document.getElementById("es-main-wrap").innerHTML = h;
        renderAssignTable(null);
        updateMemberChips();

        // 編集/コピー時：プリフィル（参加メンバーON + ドロップゾーン復元）
        if (prefill.length) {
          prefill.forEach(function(pf) { if (pf.actor) participatingActors[pf.actor] = true; });
          var savedValues = {};
          prefill.forEach(function(pf) { if (pf.actor && pf.role) savedValues[pf.role] = pf.actor; });
          renderAssignTable(savedValues);
          updateMemberChips();
          updatePoolChips();
        }
      }

      function fillActor(roleIdx, el) {
        var actor = el.getAttribute("data-actor") || "";
        if (actor) addToPool(actor);
        setAssignment(roleIdx, actor);
      }

      // ─────────────────────────────────────────
      //  役名テーブルの描画・役名追加
      // ─────────────────────────────────────────

      function renderAssignTable(savedValues) {
        var tableEl = document.getElementById("es-assign-table");
        if (!tableEl || !castingCtx) return;
        var baseRoles = castingCtx.roles || [];
        var allRoles = baseRoles.concat(customRoles);
        var h = "";
        allRoles.forEach(function(role, ri) {
          var isCustom = ri >= baseRoles.length;
          var ci = isCustom ? ri - baseRoles.length : -1;
          var history = [];
          if (!isCustom) {
            (castingCtx.past_casts || []).forEach(function(pc) {
              (pc.assignments || []).forEach(function(a) {
                if (a.role === role && a.actor) {
                  var existing = history.find(function(x){ return x.actor === a.actor; });
                  if (existing) existing.years.push(pc.year);
                  else history.push({ actor: a.actor, years: [pc.year] });
                }
              });
            });
          }
          h += '<div class="es-assign-row' + (isCustom ? ' es-custom-role' : '') + '">'
            + '<div class="es-assign-role">' + esc(role)
            + (isCustom ? '<button class="es-role-remove-btn" onclick="ES.removeCustomRole(' + ci + ')">×</button>' : '')
            + '</div>'
            + '<div class="es-drop-zone" id="es-drop-' + ri + '"'
            + ' ondragover="ES.onDragOver(event)"'
            + ' ondragleave="ES.onDragLeave(event)"'
            + ' ondrop="ES.onDrop(event,' + ri + ')"'
            + ' onclick="ES.onDropZoneClick(' + ri + ')">'
            + '<div class="es-drop-filled" id="es-filled-' + ri + '" style="display:none">'
            + '<span class="es-drop-actor-name" id="es-drop-actor-' + ri + '"></span>'
            + '<button class="es-drop-clear-btn" onclick="ES.clearAssignment(' + ri + ',event)">×</button>'
            + '</div>'
            + '<span class="es-drop-placeholder" id="es-placeholder-' + ri + '">ここにドロップ</span>'
            + '</div>';
          if (history.length) {
            h += '<div class="es-assign-history">'
              + '<span class="es-history-label">過去：</span>'
              + history.map(function(x) {
                  return '<span class="es-history-chip" onclick="ES.fillActor(' + ri + ',this)" data-actor="' + esc(x.actor) + '">'
                    + esc(x.actor) + '<small>(' + x.years.join(",") + ')</small></span>';
                }).join("")
              + '</div>';
          }
          h += '<input type="hidden" class="es-assign-input" id="es-actor-' + ri + '" value="">'
            + '</div>';
        });
        if (!allRoles.length) {
          h = '<div class="es-assign-empty">役名が登録されていません。下の入力欄から追加してください。</div>';
        }
        tableEl.innerHTML = h;
        // 保存済みの配役を復元
        if (savedValues) {
          allRoles.forEach(function(role, ri) {
            var actor = savedValues[role];
            if (actor) {
              var inp = document.getElementById("es-actor-" + ri);
              if (inp) inp.value = actor;
              updateDropZoneUI(ri, actor);
            }
          });
          updatePoolChips();
        }
        updateFillUI();
      }

      function addCustomRole() {
        var input = document.getElementById("es-new-role-input");
        if (!input) return;
        var name = input.value.trim();
        if (!name) return;
        var allRoles = (castingCtx ? castingCtx.roles || [] : []).concat(customRoles);
        if (allRoles.indexOf(name) >= 0) { alert(name + " はすでにあります"); return; }
        var saved = {};
        allRoles.forEach(function(role, ri) {
          var inp = document.getElementById("es-actor-" + ri);
          if (inp && inp.value.trim()) saved[role] = inp.value.trim();
        });
        customRoles.push(name);
        input.value = "";
        renderAssignTable(saved);
      }

      function removeCustomRole(ci) {
        var baseRoles = castingCtx ? castingCtx.roles || [] : [];
        var allRoles = baseRoles.concat(customRoles);
        var saved = {};
        allRoles.forEach(function(role, ri) {
          var inp = document.getElementById("es-actor-" + ri);
          if (inp && inp.value.trim()) saved[role] = inp.value.trim();
        });
        customRoles.splice(ci, 1);
        renderAssignTable(saved);
      }

      function onNewRoleKeydown(event) {
        if (event.key === 'Enter') addCustomRole();
      }

      // ─────────────────────────────────────────
      //  メンバー手動追加
      // ─────────────────────────────────────────

      function addCustomActor() {
        var input = document.getElementById("es-new-actor-input");
        if (!input) return;
        var name = input.value.trim();
        if (!name) return;
        var pool = castingCtx ? castingCtx.actor_pool || [] : [];
        var exists = pool.some(function(a){ return a.name === name; })
                  || customActors.some(function(a){ return a.name === name; });
        if (exists) { alert(name + " はすでにいます"); return; }
        customActors.push({ name: name, last_year: null });
        input.value = "";
        updateMemberChips();
      }

      function removeCustomActor(event, name) {
        event.stopPropagation();
        customActors = customActors.filter(function(a){ return a.name !== name; });
        if (participatingActors[name]) {
          delete participatingActors[name];
          var allRoles = (castingCtx ? castingCtx.roles || [] : []).concat(customRoles);
          allRoles.forEach(function(_, ri) {
            var inp = document.getElementById("es-actor-" + ri);
            if (inp && inp.value.trim() === name) { inp.value = ""; updateDropZoneUI(ri, ""); }
          });
          if (tappedActor === name) tappedActor = null;
          updatePoolChips();
          updateFillUI();
        }
        updateMemberChips();
      }

      function onNewActorKeydown(event) {
        if (event.key === 'Enter') addCustomActor();
      }

      // ─────────────────────────────────────────
      //  完成度・重複チェック
      // ─────────────────────────────────────────

      function updateFillUI() {
        var roles = castingCtx ? (castingCtx.roles || []).concat(customRoles) : [];
        var total = roles.length;
        if (!total) return;
        var filled = 0;
        var actorValues = [];
        roles.forEach(function(_, ri) {
          var input = document.getElementById("es-actor-" + ri);
          var val = input ? input.value.trim() : "";
          if (val) filled++;
          actorValues.push(val);
        });
        var countEl = document.getElementById("es-fill-count");
        if (countEl) countEl.textContent = filled + " / " + total + " 役入力済み";
        var barEl = document.getElementById("es-bar-fill");
        if (barEl) barEl.style.width = Math.round(filled / total * 100) + "%";
        // 重複チェック
        var seen = {}, dups = [];
        actorValues.forEach(function(v) {
          if (!v) return;
          if (seen[v]) { if (dups.indexOf(v) === -1) dups.push(v); }
          else seen[v] = true;
        });
        var dupWarn = document.getElementById("es-dup-warning");
        if (dupWarn) {
          if (dups.length) {
            var dn = document.getElementById("es-dup-names");
            if (dn) dn.textContent = dups.join("、");
            dupWarn.style.display = "";
          } else {
            dupWarn.style.display = "none";
          }
        }
      }

      // ─────────────────────────────────────────
      //  配役 DnD & 参加メンバー管理
      // ─────────────────────────────────────────

      function getCurrentAssignedActors() {
        var result = {};
        var roles = castingCtx ? (castingCtx.roles || []) : [];
        roles.forEach(function(_, ri) {
          var inp = document.getElementById("es-actor-" + ri);
          var val = inp ? inp.value.trim() : "";
          if (val) result[val] = (result[val] || 0) + 1;
        });
        return result;
      }

      function updateDropZoneUI(ri, name) {
        var zone = document.getElementById("es-drop-" + ri);
        var filled = document.getElementById("es-filled-" + ri);
        var placeholder = document.getElementById("es-placeholder-" + ri);
        var actorEl = document.getElementById("es-drop-actor-" + ri);
        if (!zone) return;
        if (name) {
          zone.classList.add("filled");
          if (filled) filled.style.display = "";
          if (placeholder) placeholder.style.display = "none";
          if (actorEl) actorEl.textContent = name;
        } else {
          zone.classList.remove("filled");
          if (filled) filled.style.display = "none";
          if (placeholder) placeholder.style.display = "";
        }
      }

      function setAssignment(ri, name) {
        var inp = document.getElementById("es-actor-" + ri);
        if (inp) inp.value = name;
        updateDropZoneUI(ri, name);
        updatePoolChips();
        updateFillUI();
      }

      function clearAssignment(ri, event) {
        if (event) event.stopPropagation();
        setAssignment(ri, "");
      }

      function updateMemberChips() {
        var chipsEl = document.getElementById("es-member-chips");
        if (!chipsEl || !castingCtx) return;
        var curYear = new Date().getFullYear();
        var threshold = curYear - 5; // threshold年以前は折りたたむ
        var pool = castingCtx.actor_pool || [];
        var recentActors = pool.filter(function(a) { return a.last_year && a.last_year > threshold; });
        var oldActors    = pool.filter(function(a) { return !a.last_year || a.last_year <= threshold; });

        function chipHTML(a, isCustom) {
          var inPool = !!participatingActors[a.name];
          var s = '<span class="es-member-chip' + (inPool ? ' in-pool' : '') + '"'
            + ' data-actor-name="' + esc(a.name) + '"'
            + ' onclick="ES.addToPool(this.dataset.actorName)">'
            + esc(a.name)
            + (a.last_year ? '<span class="es-member-year">' + String(a.last_year).slice(-2) + '</span>' : '')
            + (inPool ? '<span class="es-member-check">✓</span>' : '');
          if (isCustom) {
            s += '<button class="es-member-remove" data-remove-name="' + esc(a.name) + '"'
              + ' onclick="ES.removeCustomActor(event,this.dataset.removeName)">×</button>';
          }
          s += '</span>';
          return s;
        }

        var h = "";
        recentActors.forEach(function(a) { h += chipHTML(a, false); });
        customActors.forEach(function(a)  { h += chipHTML(a, true);  });

        if (oldActors.length) {
          h += '<details class="es-member-old-details">'
            + '<summary class="es-member-old-summary">' + threshold + '年以前（' + oldActors.length + '人）</summary>'
            + '<div class="es-member-old-chips">';
          oldActors.forEach(function(a) { h += chipHTML(a, false); });
          h += '</div></details>';
        }

        if (!pool.length && !customActors.length) {
          h = '<span class="es-pool-empty">過去の公演記録がありません</span>';
        }
        chipsEl.innerHTML = h;
      }

      function updatePoolChips() {
        var chipsEl = document.getElementById("es-pool-chips");
        var emptyHint = document.getElementById("es-pool-empty-hint");
        if (!chipsEl) return;
        var assigned = getCurrentAssignedActors();
        var names = Object.keys(participatingActors).filter(function(n) { return participatingActors[n]; });
        var h = "";
        names.forEach(function(name) {
          var isAssigned = !!assigned[name];
          var isTapped = tappedActor === name;
          var poolEntry = castingCtx ? (castingCtx.actor_pool || []).find(function(a){ return a.name === name; }) : null;
          var cls = "es-pool-chip" + (isAssigned ? " assigned" : "") + (isTapped ? " tapped" : "");
          h += '<span class="' + cls + '"'
            + ' data-actor-name="' + esc(name) + '"'
            + ' draggable="true"'
            + ' ondragstart="ES.onDragStart(event,this)"'
            + ' ondragend="ES.onDragEnd(event)"'
            + ' onclick="ES.onPoolChipTap(this)">'
            + esc(name);
          if (poolEntry && poolEntry.last_year) h += '<span class="es-pool-year">' + String(poolEntry.last_year).slice(-2) + '</span>';
          h += '<button class="es-pool-remove" data-remove-name="' + esc(name) + '" onclick="ES.removeFromPool(event,this.dataset.removeName)">×</button>';
          h += '</span>';
        });
        if (emptyHint) emptyHint.style.display = names.length ? "none" : "";
        chipsEl.innerHTML = h;
      }

      function addToPool(name) {
        if (participatingActors[name]) return;
        participatingActors[name] = true;
        updateMemberChips();
        updatePoolChips();
      }

      function removeFromPool(event, name) {
        event.stopPropagation();
        delete participatingActors[name];
        var roles = castingCtx ? (castingCtx.roles || []) : [];
        roles.forEach(function(_, ri) {
          var inp = document.getElementById("es-actor-" + ri);
          if (inp && inp.value.trim() === name) {
            inp.value = "";
            updateDropZoneUI(ri, "");
          }
        });
        if (tappedActor === name) tappedActor = null;
        updateMemberChips();
        updatePoolChips();
        updateFillUI();
      }

      function onPoolChipTap(el) {
        var name = el.dataset.actorName;
        if (!participatingActors[name]) return;
        tappedActor = (tappedActor === name) ? null : name;
        updatePoolChips();
      }

      // ── HTML5 ドラッグ&ドロップ ──
      function onDragStart(event, el) {
        if (!participatingActors[el.dataset.actorName]) { event.preventDefault(); return; }
        draggingActor = el.dataset.actorName;
        event.dataTransfer.setData("text/plain", draggingActor);
        event.dataTransfer.effectAllowed = "copy";
        el.classList.add("dragging");
      }
      function onDragEnd() {
        draggingActor = null;
        document.querySelectorAll(".es-pool-chip.dragging").forEach(function(c){ c.classList.remove("dragging"); });
      }
      function onDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        event.currentTarget.classList.add("drag-over");
      }
      function onDragLeave(event) {
        event.currentTarget.classList.remove("drag-over");
      }
      function onDrop(event, ri) {
        event.preventDefault();
        event.currentTarget.classList.remove("drag-over");
        var name = event.dataTransfer.getData("text/plain") || draggingActor;
        draggingActor = null;
        if (!name) return;
        setAssignment(ri, name);
        tappedActor = null;
        updatePoolChips();
      }

      // ── タップ選択 → ドロップゾーンタップで配役（モバイル） ──
      function onDropZoneClick(ri) {
        if (!tappedActor) return;
        setAssignment(ri, tappedActor);
        tappedActor = null;
        updatePoolChips();
      }

      // ─────────────────────────────────────────
      //  プランの編集 / コピー
      // ─────────────────────────────────────────

      function openCastingForPlan(plan, isEdit) {
        editingPlanId = isEdit ? plan.id : null;
        participatingActors = {};
        draggingActor = null;
        tappedActor = null;
        customRoles = [];
        customActors = [];
        document.getElementById("es-main-wrap").innerHTML = '<div class="loading">配役データを読み込み中...</div>';
        fetch("/api/groups/" + GID + "/casting/context/" + encodeURIComponent(plan.enmoku_id))
          .then(function(r){ return r.json(); })
          .then(function(data) {
            if (data.error) { alert("エラー: " + data.error); return; }
            castingCtx = data;
            // filtered に同じ演目があればリンク等を取得
            castingCtx._candidate = filtered.find(function(c){ return c.id === plan.enmoku_id; }) || { naviId: null };
            castingCtx._prefill = plan.assignments || [];
            castingCtx._note = plan.note || "";
            renderCastingView();
          })
          .catch(function(e) { alert("読み込みに失敗しました: " + e.message); });
      }

      function editPlan(planId) {
        var plan = savedPlans.find(function(p){ return p.id === planId; });
        if (!plan) return;
        openCastingForPlan(plan, true);
      }

      function clonePlan(planId) {
        var plan = savedPlans.find(function(p){ return p.id === planId; });
        if (!plan) return;
        openCastingForPlan(plan, false);
      }

      function saveCasting() {
        if (!castingCtx) return;
        var roles = (castingCtx.roles || []).concat(customRoles);
        var assignments = [];
        roles.forEach(function(role, ri) {
          var input = document.getElementById("es-actor-" + ri);
          var actor = input ? input.value.trim() : "";
          assignments.push({ role: role, actor: actor });
        });
        var note = (document.getElementById("es-cast-note") || {}).value || "";
        var btn = document.querySelector(".es-save-cast-btn");
        if (btn) { btn.disabled = true; btn.textContent = "保存中..."; }

        var planToDelete = editingPlanId;
        var toastMsg = planToDelete ? "配役案を更新しました" : "配役案を保存しました";

        fetch("/api/groups/" + GID + "/casting/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enmoku_id: castingCtx.enmoku_id,
            enmoku_title: castingCtx.title,
            assignments: assignments,
            note: note.trim()
          })
        }).then(function(r){ return r.json(); })
          .then(function(data) {
            if (data.ok) {
              castingCtx = null;
              editingPlanId = null;
              var afterSave = function() {
                reloadPlans(function() {
                  renderFilterView();
                  showToast(toastMsg);
                });
              };
              if (planToDelete) {
                fetch("/api/groups/" + GID + "/casting/plans/" + encodeURIComponent(planToDelete), { method: "DELETE" })
                  .then(afterSave).catch(afterSave);
              } else {
                afterSave();
              }
            } else {
              alert("保存に失敗しました: " + (data.error || ""));
              if (btn) { btn.disabled = false; btn.textContent = planToDelete ? "配役案を更新" : "配役案を保存"; }
            }
          })
          .catch(function(e) {
            alert("保存に失敗しました: " + e.message);
            if (btn) { btn.disabled = false; btn.textContent = planToDelete ? "配役案を更新" : "配役案を保存"; }
          });
      }

      // ─────────────────────────────────────────
      //  保存済み配役プラン
      // ─────────────────────────────────────────

      function renderPlansSection() {
        var wrap = document.getElementById("es-plans-wrap");
        if (!wrap) return;
        if (!savedPlans.length) { wrap.innerHTML = ""; return; }

        var h = '<div class="es-plans-section">'
          + '<div class="es-plans-header">'
          + '<h4 class="es-plans-title">保存済みの配役案 <span class="es-plans-count">' + savedPlans.length + '件</span></h4>'
          + '</div><div class="es-plans-list">';

        savedPlans.forEach(function(plan) {
          var d = plan.created_at ? new Date(plan.created_at) : null;
          var dateStr = d ? (d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate()) : "";
          var pid = esc(plan.id);

          h += '<div class="es-plan-item">'
            + '<div class="es-plan-header">'
            + '<span class="es-plan-enmoku">' + esc(plan.enmoku_title) + '</span>'
            + '<span class="es-plan-date">' + esc(dateStr) + '</span>'
            + '<div class="es-plan-actions">'
            + (canSave ? '<button class="es-plan-edit-btn" onclick="ES.editPlan(\\x27' + pid + '\\x27)">編集</button>' : '')
            + (canSave ? '<button class="es-plan-clone-btn" onclick="ES.clonePlan(\\x27' + pid + '\\x27)">コピー</button>' : '')
            + (canSave ? '<button class="es-plan-del-btn" onclick="ES.deletePlan(\\x27' + pid + '\\x27)">削除</button>' : '')
            + '</div>'
            + '</div>';

          var filled = (plan.assignments || []).filter(function(a) { return a.actor; });
          if (filled.length) {
            h += '<div class="es-plan-assignments">';
            filled.forEach(function(a) {
              h += '<span class="es-plan-chip"><span class="es-plan-role">' + esc(a.role) + '</span> ' + esc(a.actor) + '</span>';
            });
            h += '</div>';
          }
          if (plan.note) {
            h += '<div class="es-plan-note">' + esc(plan.note) + '</div>';
          }
          if (canSave) {
            h += '<div class="es-plan-footer">'
              + '<button class="es-plan-reflect-btn" onclick="ES.reflectToPerfGoal(\\x27' + pid + '\\x27)">公演目標に反映</button>'
              + '</div>';
          }
          h += '</div>';
        });

        h += '</div></div>';
        wrap.innerHTML = h;
      }

      function reloadPlans(cb) {
        fetch("/api/groups/" + GID + "/casting/plans")
          .then(function(r){ return r.json(); })
          .then(function(data) {
            savedPlans = data.plans || [];
            renderPlansSection();
            if (cb) cb();
          });
      }

      function deletePlan(planId) {
        if (!confirm("この配役案を削除しますか？")) return;
        fetch("/api/groups/" + GID + "/casting/plans/" + encodeURIComponent(planId), { method: "DELETE" })
          .then(function(r){ return r.json(); })
          .then(function(data) {
            if (data.ok) reloadPlans(function(){ showToast("削除しました"); });
            else alert("削除に失敗しました: " + (data.error || ""));
          })
          .catch(function(e) { alert("削除に失敗しました: " + e.message); });
      }

      function reflectToPerfGoal(planId) {
        var plan = savedPlans.find(function(p){ return p.id === planId; });
        if (!plan) return;
        if (!confirm(plan.enmoku_title + " の配役を公演目標に反映しますか？\\n（BASEのスケジュールページの公演目標に追加・上書きされます）")) return;

        fetch("/api/groups/" + GID + "/schedule")
          .then(function(r){ return r.json(); })
          .then(function(data) {
            var goal = data.performance_goal;
            if (!goal) {
              alert("公演目標が設定されていません。先にBASEのスケジュールから公演目標を設定してください。");
              return Promise.reject("no_goal");
            }
            if (!goal.plays) goal.plays = [];
            var newCast = (plan.assignments || [])
              .filter(function(a){ return a.actor; })
              .map(function(a){ return { role: a.role, actor: a.actor }; });
            var playName = plan.enmoku_title;
            var idx = -1;
            goal.plays.forEach(function(p, i){ if (p.name === playName) idx = i; });
            if (idx >= 0) {
              goal.plays[idx].cast = newCast;
            } else {
              goal.plays.push({ name: playName, cast: newCast });
            }
            return fetch("/api/groups/" + GID + "/schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ performance_goal: goal })
            });
          })
          .then(function(r){ if (r && r.json) return r.json(); })
          .then(function(data) {
            if (data) {
              if (data.ok) showToast("公演目標に反映しました");
              else alert("反映に失敗しました: " + (data.error || ""));
            }
          })
          .catch(function(e){ if (e !== "no_goal") alert("エラーが発生しました: " + e.message); });
      }

      // ─────────────────────────────────────────
      //  ユーティリティ
      // ─────────────────────────────────────────

      function showToast(msg, isError) {
        var wrap = document.getElementById("es-plans-wrap");
        if (!wrap) return;
        var toast = document.createElement("div");
        toast.className = isError ? "es-toast es-toast-error" : "es-toast es-toast-ok";
        toast.textContent = msg;
        wrap.insertBefore(toast, wrap.firstChild);
        setTimeout(function(){ if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
      }

      function filterGroup(label, inner) {
        return '<div class="es-filter-group"><div class="es-filter-label">' + label + '</div>' + inner + '</div>';
      }
      function radioGroup(name, opts) {
        return '<div class="es-radio-group">' + opts.map(function(o){
          return '<label class="es-radio"><input type="radio" name="' + name + '" value="' + o.value + '"' + (o.checked ? " checked" : "") + '> ' + o.label + '</label>';
        }).join("") + '</div>';
      }

      // ── 公開インターフェース ──
      window.ES = {
        openCasting:      openCasting,
        backToFilter:     function() {
          editingPlanId = null; participatingActors = {};
          draggingActor = null; tappedActor = null; customRoles = []; customActors = [];
          renderFilterView();
        },
        fillActor:        fillActor,
        setAssignment:    setAssignment,
        clearAssignment:  clearAssignment,
        addToPool:        addToPool,
        removeFromPool:   removeFromPool,
        onPoolChipTap:    onPoolChipTap,
        addCustomRole:    addCustomRole,
        removeCustomRole: removeCustomRole,
        onNewRoleKeydown: onNewRoleKeydown,
        addCustomActor:   addCustomActor,
        removeCustomActor: removeCustomActor,
        onNewActorKeydown: onNewActorKeydown,
        onDragStart:      onDragStart,
        onDragEnd:        onDragEnd,
        onDragOver:       onDragOver,
        onDragLeave:      onDragLeave,
        onDrop:           onDrop,
        onDropZoneClick:  onDropZoneClick,
        saveCasting:      saveCasting,
        deletePlan:       deletePlan,
        editPlan:         editPlan,
        clonePlan:        clonePlan,
        reflectToPerfGoal: reflectToPerfGoal,
      };

      init();
    })();
    </script>
  `;

  return pageShell({
    title: `演目選定サポート - ${g.name}`,
    subtitle: "公演演目の選定と配役",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    googleClientId: googleClientId || "",
    headExtra: `<style>
      /* ── フィルターパネル ── */
      .es-filter-panel {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
        margin-bottom: 12px; overflow: hidden;
      }
      .es-filter-header {
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        padding: 12px 18px; background: var(--bg-subtle);
        border-bottom: 1px solid var(--border-light);
      }
      .es-filter-title { font-family: 'Noto Serif JP', serif; font-size: 14px; font-weight: 600; color: var(--text-primary); }
      .es-filter-hint  { font-size: 11px; color: var(--text-tertiary); }
      .es-filter-rows  { display: flex; flex-wrap: wrap; padding: 14px 18px; column-gap: 32px; row-gap: 12px; }
      .es-filter-group { flex: 1; min-width: 180px; }
      .es-filter-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.5px; margin-bottom: 6px; }

      .es-results-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 10px 4px; margin-bottom: 10px; }
      .es-results-count { font-size: 13px; font-weight: 700; color: var(--text-primary); }
      .es-sort-group { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .es-sort-label { font-size: 11px; color: var(--text-tertiary); white-space: nowrap; }

      .es-radio-group { display: flex; flex-wrap: wrap; gap: 5px; }
      .es-radio {
        display: flex; align-items: center; gap: 5px; font-size: 12px; cursor: pointer;
        padding: 4px 10px; border: 1px solid var(--border-light);
        border-radius: 20px; background: var(--bg-page); transition: all 0.15s;
      }
      .es-radio:has(input:checked) { border-color: var(--gold); background: var(--gold-soft, #fdf8ef); color: var(--gold-dark); }
      .es-radio input { accent-color: var(--gold-dark); }

      /* ── 候補カード ── */
      .es-candidates { display: flex; flex-direction: column; gap: 8px; }
      .es-empty-filter { padding: 32px 16px; text-align: center; font-size: 13px; color: var(--text-tertiary); }
      .es-candidate-card {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm);
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .es-candidate-card:hover { border-color: var(--gold-light); box-shadow: var(--shadow-md); }
      .es-card-body { padding: 12px 14px; }
      .es-card-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
      .es-card-title-block { flex: 1; min-width: 0; }
      .es-card-title { display: block; font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 700; color: var(--text-primary); letter-spacing: 0.05em; }
      .es-card-full-title { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
      .es-card-meta-badges { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
      .es-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 10px; white-space: nowrap; }
      .es-badge-past { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
      .es-badge-new  { background: var(--bg-subtle); color: var(--text-tertiary); border: 1px solid var(--border-light); }
      .es-badge-navi { background: var(--gold-dark); color: #fff; text-decoration: none; transition: opacity 0.15s; }
      .es-badge-navi:hover { opacity: 0.8; text-decoration: none; }
      .es-badge-info { background: #f3f0ff; color: #5e35b1; border: 1px solid #d1c4e9; font-weight: 500; }
      .es-badge-info-ref { opacity: 0.65; font-style: italic; }
      .es-badge-ref-mark { font-size: 10px; margin-left: 2px; }
      .es-badge-kodomo { background: #fff8e1; color: #e65100; border: 1px solid #ffcc80; font-weight: 600; }
      .es-ref-note { font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px; padding: 3px 6px; background: var(--bg-subtle); border-radius: 4px; border-left: 2px solid var(--border-light); }
      .es-card-cast { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; line-height: 1.6; display: flex; gap: 6px; align-items: baseline; flex-wrap: wrap; }
      .es-card-cast-label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); white-space: nowrap; flex-shrink: 0; }
      .es-card-cast-names { color: var(--text-secondary); }
      .es-card-info-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
      .es-card-past-records { font-size: 12px; color: var(--text-tertiary); display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-bottom: 6px; }
      .es-card-past-label { font-weight: 600; }
      .es-card-past-item { background: var(--bg-subtle); padding: 1px 8px; border-radius: 4px; border: 1px solid var(--border-light); }
      .es-card-actions { padding: 8px 14px; background: var(--bg-subtle); border-top: 1px solid var(--border-light); }

      /* ── 配役ビュー ── */
      .es-casting-wrap {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
        padding: 20px; margin-bottom: 1.5rem;
      }
      .es-back-btn {
        font-size: 13px; padding: 6px 14px; border: 1px solid var(--border-light);
        border-radius: 20px; cursor: pointer; background: var(--bg-page);
        color: var(--text-secondary); font-family: inherit; transition: all 0.15s; margin-bottom: 16px;
      }
      .es-back-btn:hover { border-color: var(--gold); color: var(--gold-dark); }
      .es-casting-header { margin-bottom: 20px; }
      .es-casting-title { font-family: 'Noto Serif JP', serif; font-size: 18px; font-weight: 700; margin: 0 0 4px; color: var(--text-primary); }
      .es-casting-subtitle { font-size: 12px; color: var(--text-tertiary); margin-bottom: 6px; }
      .es-casting-navi-link {
        display: inline-block; font-size: 12px; color: var(--gold-dark); font-weight: 600;
        text-decoration: none; padding: 3px 10px; border: 1px solid var(--gold-light);
        border-radius: 12px; transition: all 0.15s;
      }
      .es-casting-navi-link:hover { background: var(--gold-dark); color: #fff; text-decoration: none; }

      .es-section-label {
        font-size: 12px; font-weight: 700; color: var(--text-secondary);
        letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 6px;
        border-bottom: 1px solid var(--border-light);
      }

      /* 過去の配役 */
      .es-past-section { margin-bottom: 20px; }
      .es-past-block { margin-bottom: 10px; padding: 10px 12px; background: var(--bg-subtle); border-radius: var(--radius-sm); border: 1px solid var(--border-light); }
      .es-past-year { font-size: 12px; font-weight: 700; color: var(--gold-dark); margin-bottom: 6px; }
      .es-past-assignments { display: flex; flex-wrap: wrap; gap: 4px; }
      .es-past-chip {
        font-size: 11px; padding: 2px 8px; border-radius: 4px;
        background: var(--bg-page); border: 1px solid var(--border-light); white-space: nowrap;
      }
      .es-past-role { font-weight: 700; color: var(--text-tertiary); margin-right: 2px; }

      /* 配役フォーム */
      .es-assign-section { margin-bottom: 20px; }
      .es-assign-table { display: flex; flex-direction: column; gap: 8px; }
      .es-assign-row {
        padding: 10px 12px; background: var(--bg-subtle);
        border-radius: var(--radius-sm); border: 1px solid var(--border-light);
      }
      .es-assign-role { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
      .es-assign-history { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
      .es-history-chip {
        font-size: 11px; padding: 2px 8px; border-radius: 10px; cursor: pointer;
        background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9;
        transition: all 0.15s;
      }
      .es-history-chip:hover { background: #1565c0; color: #fff; }
      .es-history-chip small { font-size: 10px; opacity: 0.7; margin-left: 2px; }
      .es-assign-input {
        width: 100%; padding: 7px 10px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 13px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary); box-sizing: border-box;
      }
      .es-assign-input:focus { border-color: var(--gold); outline: none; box-shadow: 0 0 0 3px rgba(197,162,85,0.1); }
      .es-assign-empty { font-size: 13px; color: var(--text-tertiary); padding: 12px 0; }
      .es-assign-note-group { margin-top: 16px; }

      .es-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.5px; }
      .es-textarea {
        width: 100%; padding: 10px 12px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary); resize: vertical;
        box-sizing: border-box; line-height: 1.6;
      }
      .es-textarea:focus { border-color: var(--gold); outline: none; box-shadow: 0 0 0 3px rgba(197,162,85,0.1); }
      .es-form-actions { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
      .es-auth-notice { font-size: 13px; color: var(--text-tertiary); padding: 12px 16px; background: var(--bg-subtle); border-radius: var(--radius-sm); margin: 16px 0; }

      /* ── 保存済み配役プラン ── */
      .es-plans-section {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow: hidden;
        margin-bottom: 1.5rem;
      }
      .es-plans-header { padding: 14px 18px; background: var(--bg-subtle); border-bottom: 1px solid var(--border-light); }
      .es-plans-title {
        font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 600; margin: 0;
        display: flex; align-items: center; gap: 8px;
      }
      .es-plans-count { font-size: 12px; font-weight: 400; color: var(--text-tertiary); background: var(--bg-page); padding: 2px 8px; border-radius: 10px; }
      .es-plans-list { display: flex; flex-direction: column; }
      .es-plan-item { padding: 14px 18px; border-bottom: 1px solid var(--border-light); }
      .es-plan-item:last-child { border-bottom: none; }
      .es-plan-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
      .es-plan-enmoku { font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 700; }
      .es-plan-date { font-size: 11px; color: var(--text-tertiary); }
      .es-plan-del-btn {
        margin-left: auto; font-size: 12px; padding: 3px 10px;
        border: 1px solid var(--border-light); border-radius: 4px;
        cursor: pointer; background: var(--bg-page); color: var(--text-secondary);
        font-family: inherit; transition: all 0.15s;
      }
      .es-plan-del-btn:hover { border-color: var(--accent-1, #c0392b); color: var(--accent-1, #c0392b); }
      .es-plan-assignments { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
      .es-plan-chip {
        font-size: 11px; padding: 2px 8px; border-radius: 4px;
        background: var(--bg-subtle); border: 1px solid var(--border-light); white-space: nowrap;
      }
      .es-plan-role { font-weight: 700; color: var(--text-tertiary); margin-right: 2px; }
      .es-plan-note { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

      /* ── トースト ── */
      .es-toast {
        padding: 12px 16px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600;
        margin-bottom: 10px; animation: es-fade-in 0.2s ease;
      }
      .es-toast-ok    { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
      .es-toast-error { background: #fde8e8; color: #c0392b; border: 1px solid #f5a3a3; }
      @keyframes es-fade-in { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
      .btn-sm { font-size: 12px; padding: 6px 14px; }

      /* ── 完成度バー ── */
      .es-section-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
      .es-completion-display { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
      .es-bar-track { height: 4px; background: var(--border-light); border-radius: 2px; margin-bottom: 10px; overflow: hidden; }
      .es-bar-fill { height: 100%; background: var(--gold, #c5a255); border-radius: 2px; transition: width 0.25s ease; }

      /* ── 重複警告 ── */
      .es-dup-warning {
        font-size: 12px; color: #c0392b; background: #fde8e8;
        border: 1px solid #f5a3a3; border-radius: var(--radius-sm);
        padding: 6px 10px; margin-bottom: 10px;
      }

      /* ── 役者プールパネル ── */
      .es-pool-details { margin-bottom: 12px; }
      .es-pool-summary {
        font-size: 12px; font-weight: 600; color: var(--text-secondary);
        cursor: pointer; padding: 7px 12px;
        background: var(--bg-subtle); border: 1px solid var(--border-light);
        border-radius: var(--radius-sm); display: flex; align-items: center;
        gap: 8px; list-style: none; user-select: none;
      }
      .es-pool-summary::-webkit-details-marker { display: none; }
      .es-pool-details[open] > .es-pool-summary {
        border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      }
      .es-pool-hint { font-size: 11px; color: var(--text-tertiary); font-weight: 400; margin-left: auto; }
      .es-pool-list {
        display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 10px;
        background: var(--bg-subtle); border: 1px solid var(--border-light);
        border-top: none; border-radius: 0 0 var(--radius-sm) var(--radius-sm);
      }
      .es-pool-chip {
        font-size: 11px; padding: 3px 9px; border-radius: 10px; cursor: pointer;
        background: var(--bg-page); border: 1px solid var(--border-light);
        display: inline-flex; align-items: center; gap: 4px;
        transition: border-color 0.12s, background 0.12s; white-space: nowrap;
      }
      .es-pool-chip:hover { border-color: var(--gold); background: var(--gold-soft, #fdf8ef); }
      .es-pool-chip small { font-size: 10px; color: var(--text-tertiary); }

      /* ── 過去の配役 折りたたみ ── */
      .es-past-details { margin-bottom: 16px; }
      .es-past-summary {
        font-size: 12px; font-weight: 700; color: var(--text-secondary);
        cursor: pointer; padding: 8px 14px; background: var(--bg-subtle);
        border: 1px solid var(--border-light); border-radius: var(--radius-sm);
        list-style: none; user-select: none; display: flex; align-items: center;
      }
      .es-past-summary::-webkit-details-marker { display: none; }
      .es-past-details[open] > .es-past-summary { border-radius: var(--radius-sm) var(--radius-sm) 0 0; }
      .es-past-details > .es-past-block {
        border: 1px solid var(--border-light); border-top: none; padding: 8px 14px;
      }
      .es-past-details > .es-past-block:last-child { border-radius: 0 0 var(--radius-sm) var(--radius-sm); }

      /* ── メンバー欄 ── */
      .es-members-section {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 10px;
      }
      .es-member-hint { font-size: 11px; color: var(--text-tertiary); }
      .es-member-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; min-height: 32px; }
      .es-member-chip {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
        user-select: none; transition: all 0.15s; white-space: nowrap; cursor: pointer;
        background: var(--bg-subtle); color: var(--text-secondary);
        border: 1.5px solid var(--border-medium);
      }
      .es-member-chip:hover {
        border-color: var(--gold); color: var(--gold-dark); background: var(--gold-soft, #fdf8ef);
      }
      .es-member-chip.in-pool {
        background: var(--gold-soft, #fdf8ef); color: var(--gold-dark);
        border-color: var(--gold-light); cursor: default; opacity: 0.7;
      }
      .es-member-year { font-size: 10px; color: var(--text-tertiary); font-weight: 400; }
      .es-member-check { font-size: 11px; color: var(--gold-dark); font-weight: 700; }

      /* ── 役者プール欄 ── */
      .es-pool-section {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 16px;
      }
      .es-pool-section-hint { font-size: 11px; color: var(--text-tertiary); }
      .es-pool-chips { display: flex; flex-wrap: wrap; gap: 6px; min-height: 32px; }
      .es-pool-chip {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
        user-select: none; transition: all 0.15s; white-space: nowrap; cursor: grab;
        background: var(--gold-soft, #fdf8ef); color: var(--gold-dark);
        border: 1.5px solid var(--gold);
      }
      .es-pool-chip:active { cursor: grabbing; }
      .es-pool-chip.assigned { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; }
      .es-pool-chip.tapped {
        background: #e3f2fd; color: #1565c0; border-color: #90caf9;
        box-shadow: 0 0 0 3px rgba(21,101,192,0.15);
      }
      .es-pool-chip.dragging { opacity: 0.4; }
      .es-pool-year { font-size: 10px; color: var(--text-tertiary); font-weight: 400; }
      .es-pool-remove {
        background: none; border: none; padding: 0; margin-left: 2px;
        cursor: pointer; font-size: 13px; color: var(--gold-dark); opacity: 0.55;
        line-height: 1; transition: opacity 0.1s; flex-shrink: 0;
      }
      .es-pool-remove:hover { opacity: 1; }
      .es-pool-empty-hint { font-size: 12px; color: var(--text-tertiary); padding: 4px 0; }
      .es-pool-empty { font-size: 12px; color: var(--text-tertiary); padding: 4px 0; }

      /* ── ドロップゾーン ── */
      .es-assign-row {
        display: grid;
        grid-template-columns: 130px 1fr;
        grid-template-rows: auto auto;
        column-gap: 10px; row-gap: 4px;
        align-items: start;
      }
      .es-assign-role { padding-top: 9px; grid-row: 1; grid-column: 1; }
      .es-drop-zone {
        grid-row: 1; grid-column: 2;
        min-height: 36px; border: 2px dashed var(--border-medium);
        border-radius: var(--radius-sm); padding: 6px 10px;
        display: flex; align-items: center; cursor: pointer;
        transition: border-color 0.15s, background 0.15s; background: var(--bg-page);
      }
      .es-drop-zone.drag-over {
        border-color: var(--gold); background: var(--gold-soft, #fdf8ef); border-style: solid;
      }
      .es-drop-zone.filled { border-color: var(--gold-light); border-style: solid; background: var(--gold-soft, #fdf8ef); }
      .es-drop-placeholder { font-size: 12px; color: var(--text-tertiary); user-select: none; }
      .es-drop-filled { display: flex; align-items: center; width: 100%; gap: 6px; }
      .es-drop-actor-name { font-size: 13px; font-weight: 700; color: var(--text-primary); flex: 1; }
      .es-drop-clear-btn {
        background: none; border: none; cursor: pointer; font-size: 15px;
        color: var(--text-tertiary); padding: 2px 4px; line-height: 1;
        border-radius: 50%; transition: all 0.1s; flex-shrink: 0;
      }
      .es-drop-clear-btn:hover { background: rgba(192,57,43,0.1); color: #c0392b; }
      .es-assign-history {
        grid-row: 2; grid-column: 2;
        display: flex; flex-wrap: wrap; gap: 4px; align-items: center;
      }
      .es-history-label { font-size: 10px; color: var(--text-tertiary); font-weight: 600; flex-shrink: 0; }
      @media (max-width: 500px) {
        .es-assign-row { grid-template-columns: 1fr; }
        .es-assign-role { padding-top: 0; grid-column: 1; }
        .es-drop-zone { grid-column: 1; }
        .es-assign-history { grid-column: 1; }
      }

      /* ── 編集中バッジ ── */
      .es-editing-badge {
        font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 10px;
        background: #fff8e1; color: #e65100; border: 1px solid #ffcc80;
        vertical-align: middle; margin-left: 6px;
      }

      /* ── プランアクションボタン ── */
      .es-plan-actions { display: flex; gap: 4px; margin-left: auto; flex-wrap: wrap; align-items: center; }
      .es-plan-edit-btn, .es-plan-clone-btn {
        font-size: 12px; padding: 3px 10px;
        border: 1px solid var(--border-light); border-radius: 4px;
        cursor: pointer; background: var(--bg-page); color: var(--text-secondary);
        font-family: inherit; transition: all 0.15s;
      }
      .es-plan-edit-btn:hover  { border-color: var(--gold); color: var(--gold-dark); }
      .es-plan-clone-btn:hover { border-color: var(--border-medium); color: var(--text-primary); }
      .es-plan-footer { padding: 8px 0 2px; border-top: 1px solid var(--border-light); margin-top: 8px; }
      .es-plan-reflect-btn {
        font-size: 12px; padding: 5px 14px;
        border: 1px solid #7e57c2; border-radius: 4px;
        cursor: pointer; background: #f3f0ff; color: #5e35b1;
        font-family: inherit; font-weight: 600; transition: all 0.15s;
      }
      .es-plan-reflect-btn:hover { background: #5e35b1; color: #fff; }

      /* ── メンバー追加行・旧メンバー折りたたみ ── */
      .es-add-member-row {
        display: flex; gap: 6px; align-items: center;
        margin-top: 8px; padding-top: 8px;
        border-top: 1px dashed var(--border-light);
      }
      .es-new-actor-input {
        flex: 1; padding: 6px 10px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 13px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary);
      }
      .es-new-actor-input:focus { border-color: var(--gold); outline: none; }
      .es-add-actor-btn {
        padding: 6px 14px; font-size: 12px; font-weight: 600;
        border: 1px solid var(--border-medium); border-radius: var(--radius-sm);
        background: var(--bg-subtle); color: var(--text-secondary);
        cursor: pointer; font-family: inherit; white-space: nowrap; transition: all 0.15s;
      }
      .es-add-actor-btn:hover { border-color: var(--gold); color: var(--gold-dark); background: var(--gold-soft, #fdf8ef); }
      .es-member-remove {
        background: none; border: none; padding: 0; margin-left: 2px;
        cursor: pointer; font-size: 12px; color: var(--text-tertiary); opacity: 0.6;
        line-height: 1; transition: opacity 0.1s; flex-shrink: 0;
      }
      .es-member-remove:hover { opacity: 1; color: #c0392b; }
      .es-member-old-details { margin-top: 8px; }
      .es-member-old-summary {
        font-size: 11px; color: var(--text-tertiary); cursor: pointer;
        list-style: none; user-select: none; display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 8px; border: 1px solid var(--border-light);
        border-radius: 10px; background: var(--bg-subtle); transition: all 0.12s;
      }
      .es-member-old-summary::-webkit-details-marker { display: none; }
      .es-member-old-summary::before { content: "▶"; font-size: 9px; }
      .es-member-old-details[open] > .es-member-old-summary::before { content: "▼"; }
      .es-member-old-summary:hover { border-color: var(--border-medium); color: var(--text-secondary); }
      .es-member-old-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 0 2px; }

      /* ── 役名追加行 ── */
      .es-add-role-row {
        display: flex; gap: 6px; align-items: center;
        margin-top: 8px; padding-top: 8px;
        border-top: 1px dashed var(--border-light);
      }
      .es-new-role-input {
        flex: 1; padding: 6px 10px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 13px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary);
      }
      .es-new-role-input:focus { border-color: var(--gold); outline: none; }
      .es-add-role-btn {
        padding: 6px 14px; font-size: 12px; font-weight: 600;
        border: 1px solid var(--gold); border-radius: var(--radius-sm);
        background: var(--gold-soft, #fdf8ef); color: var(--gold-dark);
        cursor: pointer; font-family: inherit; white-space: nowrap; transition: all 0.15s;
      }
      .es-add-role-btn:hover { background: var(--gold-dark); color: #fff; }

      /* ── 手動追加役の削除ボタン ── */
      .es-custom-role .es-assign-role { display: flex; align-items: center; gap: 6px; }
      .es-role-remove-btn {
        background: none; border: none; padding: 0; cursor: pointer;
        font-size: 13px; color: var(--text-tertiary); line-height: 1;
        transition: color 0.1s; flex-shrink: 0;
      }
      .es-role-remove-btn:hover { color: #c0392b; }
    </style>`
  });
}
