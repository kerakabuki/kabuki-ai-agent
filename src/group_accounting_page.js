// src/group_accounting_page.js
// =========================================================
// 収支管理ページ — /groups/:groupId/accounting
// レシートスキャン（AI OCR）・収支一覧・CSV/PDFエクスポート
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupAccountingPageHTML(group) {
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
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span><a href="/jikabuki/gate/${gid}">${name}</a><span>&rsaquo;</span>収支管理
    </div>

    <div id="ga-app">
      <div class="loading">読み込み中...</div>
    </div>

    <script>
    (function(){
      var GID = "${gid}";
      var expenses = [];
      var expenseCategories = ["衣装・かつら","小道具・大道具","会場費","交通費","食費・飲料","通信・印刷","その他"];
      var incomeCategories = ["補助金・助成金","公演収入","会費","寄付・協賛金","物販収入","その他収入"];
      var currentFY = 0;       // 年度（数値）
      var fyStartMonth = 4;    // 年度開始月（デフォルト4月）
      var filterCat = "all";
      var viewType = "all"; // "all" | "expense" | "income"
      var carryForward = {};  // FY → 金額  e.g. {"2025": 500000}
      var categoryMapping = {}; // 帳簿科目→決算科目  e.g. {"衣装・かつら":"衣装費"}
      var showLedger = false; // 残高推移テーブル表示フラグ
      var _batchResults = [];
      var _batchEditIdx = null;

      var DEFAULT_EXP_CATS = ["衣装・かつら","小道具・大道具","会場費","交通費","食費・飲料","通信・印刷","その他"];
      var DEFAULT_INC_CATS = ["補助金・助成金","公演収入","会費","寄付・協賛金","物販収入","その他収入"];

      // 「その他」系を末尾に、ユーザー追加カテゴリをデフォルトより前に
      function isOtherCat(c) { return c === "その他" || c === "その他収入" || c === "その他支出"; }
      function sortCats(cats) {
        var defaults = viewType === "income" ? DEFAULT_INC_CATS : DEFAULT_EXP_CATS;
        var allDefaults = DEFAULT_EXP_CATS.concat(DEFAULT_INC_CATS);
        var userAdded = [];
        var defaultCats = [];
        var others = [];
        cats.forEach(function(c) {
          if (isOtherCat(c)) { others.push(c); }
          else if (allDefaults.indexOf(c) >= 0) { defaultCats.push(c); }
          else { userAdded.push(c); }
        });
        return userAdded.concat(defaultCats).concat(others);
      }

      function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

      function formatYen(n) {
        return "¥" + (n||0).toLocaleString("ja-JP");
      }

      function today() {
        var d = new Date();
        return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
      }

      function pad2(n) { return String(n).padStart(2,"0"); }

      // 日付文字列 → 年度を返す
      function dateToFY(dateStr) {
        var parts = (dateStr||"").split("-");
        var y = parseInt(parts[0]) || 0;
        var m = parseInt(parts[1]) || 1;
        return m >= fyStartMonth ? y : y - 1;
      }

      // 年度の開始・終了日
      function fyStart(fy) { return fy + "-" + pad2(fyStartMonth) + "-01"; }
      function fyEnd(fy) {
        // 開始月の前月末日
        var endM = fyStartMonth - 1;
        var endY = fy + 1;
        if (endM < 1) { endM = 12; endY = fy; }
        // 月末日を計算
        var lastDay = new Date(endY, endM, 0).getDate();
        return endY + "-" + pad2(endM) + "-" + pad2(lastDay);
      }

      // エントリが指定年度に属するか
      function isInFY(dateStr, fy) {
        return dateStr >= fyStart(fy) && dateStr <= fyEnd(fy);
      }

      function initFY() {
        var d = new Date();
        var m = d.getMonth() + 1;
        currentFY = m >= fyStartMonth ? d.getFullYear() : d.getFullYear() - 1;
      }

      function prevFY() { currentFY--; render(); }
      function nextFY() { currentFY++; render(); }

      function toWareki(y) {
        if (y >= 2019) return "令和" + (y - 2018 === 1 ? "元" : (y - 2018)) + "年";
        if (y >= 1989) return "平成" + (y - 1988 === 1 ? "元" : (y - 1988)) + "年";
        return y + "年";
      }
      function fyLabel(fy) {
        var sm = fyStartMonth;
        var emVal = sm - 1; if (emVal < 1) emVal = 12;
        var period = sm + "月〜" + (sm === 1 ? "" : "翌") + emVal + "月";
        if (sm === 1) period = "1月〜12月";
        if (sm === 4) period = "";
        var label = fy + "年度（" + toWareki(fy) + "度）";
        if (period) label += " " + period;
        return label;
      }

      // 年度内のエントリをフィルタ
      function filteredExpenses() {
        var list = expenses.filter(function(e) {
          return isInFY(e.date||"", currentFY);
        });
        if (viewType !== "all") {
          list = list.filter(function(e) { return (e.type || "expense") === viewType; });
        }
        if (filterCat !== "all") {
          list = list.filter(function(e) { return e.category === filterCat; });
        }
        list.sort(function(a,b) { return (b.date||"").localeCompare(a.date||""); });
        return list;
      }

      function loadData() {
        fetch("/api/groups/" + encodeURIComponent(GID) + "/expenses", { credentials: "same-origin" })
          .then(function(r){
            if (!r.ok) {
              return r.json().then(function(d){
                showToast("⚠️ " + (d.error || "読み込みエラー (HTTP " + r.status + ")"));
                throw new Error(d.error || r.status);
              });
            }
            return r.json();
          })
          .then(function(data){
            if (data.error) {
              showToast("⚠️ " + data.error);
              expenses = [];
              render();
              return;
            }
            expenses = data.expenses || [];
            // receipt_url → receipt_urls 正規化
            expenses.forEach(function(e){
              if (!e.receipt_urls) {
                e.receipt_urls = e.receipt_url ? [e.receipt_url] : [];
              }
            });
            if (data.fyStartMonth) { fyStartMonth = data.fyStartMonth; initFY(); }
            if (data.carryForward && typeof data.carryForward === "object") carryForward = data.carryForward;
            if (data.categoryMapping && typeof data.categoryMapping === "object") categoryMapping = data.categoryMapping;
            if (data.expenseCategories && data.expenseCategories.length) expenseCategories = data.expenseCategories;
            if (data.incomeCategories && data.incomeCategories.length) incomeCategories = data.incomeCategories;
            // 後方互換: 旧 categories フィールド
            if (!data.expenseCategories && data.categories && data.categories.length) expenseCategories = data.categories;
            // 当年度にデータがなければ、データがある最新年度へ自動ジャンプ
            if (expenses.length > 0) {
              var hasCurrentFY = expenses.some(function(e){ return isInFY(e.date||"", currentFY); });
              if (!hasCurrentFY) {
                var latestDate = expenses.reduce(function(max, e){ var d = e.date||""; return d > max ? d : max; }, "");
                if (latestDate) currentFY = dateToFY(latestDate);
              }
            }
            render();
          })
          .catch(function(e){
            console.error("Load error:", e);
            expenses = [];
            render();
            showToast("⚠️ データの読み込みに失敗しました");
          });
      }

      function render() {
        var app = document.getElementById("ga-app");
        var filtered = filteredExpenses();

        // 年度内の全エントリ
        var monthAll = expenses.filter(function(e){ return isInFY(e.date||"", currentFY); });
        var monthIncome = 0, monthExpense = 0;
        var catTotals = {};
        monthAll.forEach(function(e){
          var isIncome = (e.type === "income");
          if (isIncome) { monthIncome += (e.amount||0); } else { monthExpense += (e.amount||0); }
          var cat = e.category || "その他";
          catTotals[cat] = (catTotals[cat]||0) + (e.amount||0);
        });
        var cfAmount = carryForward[String(currentFY)] || 0;
        var balance = cfAmount + monthIncome - monthExpense;

        // フィルタ後の合計
        var filteredTotal = 0;
        filtered.forEach(function(e){ filteredTotal += (e.amount||0); });

        // 表示中のカテゴリ一覧
        var visibleCats = {};
        var catSource = viewType === "income" ? incomeCategories : viewType === "expense" ? expenseCategories : expenseCategories.concat(incomeCategories);
        monthAll.forEach(function(e){
          if (viewType !== "all" && (e.type||"expense") !== viewType) return;
          var cat = e.category || "その他";
          visibleCats[cat] = true;
        });

        var html = "";

        // 年度ナビ
        html += '<div class="ga-month-nav">'
          + '<button class="ga-month-btn" onclick="GA.prevFY()">◀</button>'
          + '<span class="ga-month-label">' + esc(fyLabel(currentFY)) + '</span>'
          + '<button class="ga-month-btn" onclick="GA.nextFY()">▶</button>'
          + '<button class="ga-fy-setting-btn" onclick="GA.showFYSetting()" title="決算月の設定">⚙</button>'
          + '<button class="ga-fy-setting-btn" onclick="GA.showCategoryMapping()" title="決算科目の設定">📋</button>'
          + '</div>';

        // 繰越金エリア
        html += '<div class="ga-carry-forward">'
          + '<div class="ga-cf-display" id="ga-cf-display">'
          + '<span class="ga-cf-label">前年度繰越:</span> '
          + '<span class="ga-cf-amount">' + formatYen(cfAmount) + '</span> '
          + '<button class="ga-cf-edit-btn" onclick="GA.editCarryForward()" title="繰越金を編集">✏</button>'
          + '</div>'
          + '<div class="ga-cf-form" id="ga-cf-form" style="display:none">'
          + '<input type="number" id="ga-cf-input" value="' + cfAmount + '" placeholder="0" min="0">'
          + '<button class="btn btn-primary ga-cf-save-btn" onclick="GA.saveCarryForward()">保存</button>'
          + '<button class="btn btn-secondary ga-cf-cancel-btn" onclick="GA.cancelCarryForward()">取消</button>'
          + '</div>'
          + '</div>';

        // サマリーカード（収入・支出・差引）
        html += '<div class="ga-summary">'
          + '<div class="ga-summary-row">'
          + '<div class="ga-summary-item ga-income-box"><div class="ga-summary-label">収入</div><div class="ga-summary-val ga-income-val">' + formatYen(monthIncome) + '</div></div>'
          + '<div class="ga-summary-item ga-expense-box"><div class="ga-summary-label">支出</div><div class="ga-summary-val ga-expense-val">' + formatYen(monthExpense) + '</div></div>'
          + '<div class="ga-summary-item ga-balance-box"><div class="ga-summary-label">残高</div><div class="ga-summary-val' + (balance >= 0 ? ' ga-income-val' : ' ga-expense-val') + '">' + (balance >= 0 ? '+' : '') + formatYen(balance) + '</div></div>'
          + '</div>';
        var catKeys = sortCats(Object.keys(catTotals));
        if (catKeys.length) {
          html += '<div class="ga-summary-cats">';
          catKeys.forEach(function(c){
            html += '<span class="ga-summary-cat">' + esc(c) + ' ' + formatYen(catTotals[c]) + '</span>';
          });
          html += '</div>';
        }
        html += '</div>';

        // 残高推移ボタン + テーブル
        html += '<div class="ga-ledger-toggle">'
          + '<button class="btn btn-secondary ga-ledger-btn" onclick="GA.toggleLedger()">'
          + (showLedger ? '✕ 残高推移を閉じる' : '📊 残高推移')
          + '</button></div>';

        if (showLedger) {
          var ledgerAll = expenses.filter(function(e){ return isInFY(e.date||"", currentFY); });
          ledgerAll.sort(function(a,b){ return (a.date||"").localeCompare(b.date||""); });
          var running = cfAmount;
          html += '<div class="ga-ledger">'
            + '<table class="ga-ledger-table">'
            + '<thead><tr><th>日付</th><th>摘要</th><th class="ga-ledger-right">入金</th><th class="ga-ledger-right">出金</th><th class="ga-ledger-right">残高</th></tr></thead>'
            + '<tbody>';
          // 期首行
          html += '<tr class="ga-ledger-cf"><td>（期首）</td><td>前年度繰越</td><td></td><td></td><td class="ga-ledger-right ga-ledger-bal">' + formatYen(running) + '</td></tr>';
          ledgerAll.forEach(function(e){
            var isIncome = (e.type === "income");
            var amt = e.amount || 0;
            running += isIncome ? amt : -amt;
            var shortDate = (function(d){ var p = d.split("-"); return p.length >= 3 ? parseInt(p[1]) + "/" + parseInt(p[2]) : d; })(e.date||"");
            html += '<tr>'
              + '<td>' + esc(shortDate) + '</td>'
              + '<td>' + esc(e.vendor || e.memo || e.category || "") + '</td>'
              + '<td class="ga-ledger-right ga-income-val">' + (isIncome ? formatYen(amt) : '') + '</td>'
              + '<td class="ga-ledger-right ga-expense-val">' + (isIncome ? '' : formatYen(amt)) + '</td>'
              + '<td class="ga-ledger-right ga-ledger-bal">' + formatYen(running) + '</td>'
              + '</tr>';
          });
          // 期末行
          html += '<tr class="ga-ledger-end"><td>（期末）</td><td>期末残高</td><td></td><td></td><td class="ga-ledger-right ga-ledger-bal">' + formatYen(running) + '</td></tr>';
          html += '</tbody></table></div>';
        }

        // 収支タブ
        html += '<div class="ga-type-tabs">'
          + '<button class="ga-type-tab' + (viewType==="all"?" ga-type-tab-active":"") + '" onclick="GA.setView(\\'all\\')">すべて</button>'
          + '<button class="ga-type-tab ga-tab-expense' + (viewType==="expense"?" ga-type-tab-active":"") + '" onclick="GA.setView(\\'expense\\')">支出</button>'
          + '<button class="ga-type-tab ga-tab-income' + (viewType==="income"?" ga-type-tab-active":"") + '" onclick="GA.setView(\\'income\\')">収入</button>'
          + '</div>';

        // メインCTA
        html += '<div class="ga-cta">'
          + '<button class="btn btn-primary ga-scan-btn" onclick="GA.startScan()">📷 写真で読み取り</button>'
          + '<button class="btn btn-secondary" onclick="GA.showAddForm(\\'expense\\')">✏️ 支出を追加</button>'
          + '<button class="btn btn-secondary ga-income-btn" onclick="GA.showAddForm(\\'income\\')">💰 収入を追加</button>'
          + '</div>';

        // フォームエリア
        html += '<div id="ga-form-area"></div>';

        // カテゴリフィルタ
        var activeCats = Object.keys(visibleCats);
        if (activeCats.length) {
          html += '<div class="ga-filters">';
          html += '<button class="ga-filter' + (filterCat === "all" ? " ga-filter-active" : "") + '" onclick="GA.setFilter(\\'all\\')">すべて</button>';
          sortCats(activeCats).forEach(function(c){
            html += '<button class="ga-filter' + (filterCat === c ? " ga-filter-active" : "") + '" onclick="GA.setFilter(\\'' + esc(c) + '\\')">' + esc(c) + '</button>';
          });
          html += '</div>';
        }

        // 経費カード一覧
        if (!filtered.length) {
          html += '<div class="empty-state">この月のデータはありません。</div>';
        } else {
          html += '<div class="ga-count">' + filtered.length + '件'
            + (filterCat !== "all" ? '（' + esc(filterCat) + '）' : '')
            + ' — 合計 ' + formatYen(filteredTotal) + '</div>';
          filtered.forEach(function(e){
            var idx = expenses.indexOf(e);
            var isIncome = (e.type === "income");
            html += '<div class="ga-card' + (isIncome ? ' ga-card-income' : '') + '">'
              + '<div class="ga-card-header">'
              + '<div class="ga-card-left">'
              + '<span class="ga-card-date">' + esc((function(d){ var p=d.split("-"); return p.length>=3 ? parseInt(p[1])+"/"+parseInt(p[2]) : d; })(e.date||"")) + '</span>'
              + '<span class="ga-card-vendor">' + esc(e.vendor||"（不明）") + '</span>'
              + (isIncome ? '<span class="ga-card-type-badge ga-badge-income">収入</span>' : '')
              + '</div>'
              + '<span class="ga-card-amount' + (isIncome ? ' ga-income-val' : '') + '">' + (isIncome ? '+' : '') + formatYen(e.amount) + '</span>'
              + '</div>'
              + '<div class="ga-card-meta">'
              + '<span class="ga-card-cat">' + esc(e.category||"") + '</span>';
            if (e.memo) html += '<span class="ga-card-memo">' + esc(e.memo) + '</span>';
            html += '</div>';
            if (e.items && e.items.length) {
              html += '<div class="ga-card-items">';
              e.items.forEach(function(item){
                html += '<span class="ga-card-item">' + esc(item.name||"") + ' ¥' + (item.price||0) + (item.quantity > 1 ? '×' + item.quantity : '') + '</span>';
              });
              html += '</div>';
            }
            var cardUrls = e.receipt_urls || (e.receipt_url ? [e.receipt_url] : []);
            if (cardUrls.length) {
              html += '<div class="ga-card-receipts">';
              cardUrls.forEach(function(url) {
                html += '<img src="' + esc(url) + '" class="ga-card-receipt-thumb" onclick="window.open(\\'' + esc(url) + '\\')">';
              });
              html += '</div>';
            }
            html += '<div class="ga-card-actions">'
              + '<button class="gr-btn-edit" onclick="GA.editExpense(' + idx + ')">編集</button>'
              + '<button class="gr-btn-del" onclick="GA.delExpense(' + idx + ')">削除</button>'
              + '</div></div>';
          });
        }

        // 未分類チェック
        var uncatCount = monthAll.filter(function(e){ return !e.category; }).length;
        if (uncatCount) {
          html += '<div class="ga-uncat-warn" onclick="GA.showUncategorized()">'
            + '⚠ カテゴリ未設定が <strong>' + uncatCount + '件</strong> あります（タップして修正）'
            + '</div>';
        }

        // エクスポートボタン
        html += '<div class="ga-export">'
          + '<button class="btn btn-secondary" onclick="GA.exportCSV()">📄 CSV出力</button>'
          + '<button class="btn btn-secondary" onclick="GA.exportPDF()">📊 PDF決算書</button>'
          + '</div>';

        app.innerHTML = html;
      }

      // ── Step1: 領収書/振込明細を撮影 → 支払フォーム作成 ──
      var _pendingPhotos = []; // File の配列（領収書/振込明細のみ）

      function startScan() {
        _pendingPhotos = [];
        capturePhoto();
      }

      function startBatchScan() {
        _pendingPhotos = [];
        capturePhoto();
      }

      function capturePhoto() {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment";
        input.onchange = function() {
          var file = input.files && input.files[0];
          if (!file) {
            if (_pendingPhotos.length) showPhotoPreview();
            else cancelPhotos();
            return;
          }
          _pendingPhotos.push(file);
          showPhotoPreview();
        };
        input.click();
      }

      function showPhotoPreview() {
        var area = document.getElementById("ga-form-area");
        if (!area) { render(); area = document.getElementById("ga-form-area"); }
        var count = _pendingPhotos.length;
        var thumbs = '';
        _pendingPhotos.forEach(function(f, i) {
          var url = URL.createObjectURL(f);
          thumbs += '<div class="ga-preview-thumb-wrap">'
            + '<img src="' + url + '" class="ga-preview-thumb">'
            + '<button type="button" class="gaf-receipt-del" onclick="GA.removePreviewPhoto(' + i + ')">✕</button>'
            + '</div>';
        });
        area.innerHTML = '<div class="ga-photo-preview">'
          + '<h3 class="gr-form-title">🧾 領収書・振込明細（' + count + '枚）</h3>'
          + '<div class="ga-preview-thumbs">' + thumbs + '</div>'
          + '<div class="ga-preview-actions">'
          + '<button class="btn btn-secondary ga-preview-add-btn" onclick="GA.capturePhoto()">📷 もう1枚追加</button>'
          + '<button class="btn btn-primary ga-preview-start-btn" onclick="GA.submitPhotos()">🔍 読み取り開始</button>'
          + '</div>'
          + '<button class="btn btn-secondary" onclick="GA.cancelPhotos()" style="margin-top:8px;font-size:13px">キャンセル</button>'
          + '</div>';
        area.scrollIntoView({ behavior: "smooth" });
      }

      function removePreviewPhoto(idx) {
        _pendingPhotos.splice(idx, 1);
        if (_pendingPhotos.length === 0) {
          var area = document.getElementById("ga-form-area");
          if (area) area.innerHTML = "";
          return;
        }
        showPhotoPreview();
      }

      function cancelPhotos() {
        _pendingPhotos = [];
        var area = document.getElementById("ga-form-area");
        if (area) area.innerHTML = "";
      }

      // 領収書/振込明細をOCRして支払フォーム作成
      function submitPhotos() {
        var area = document.getElementById("ga-form-area");
        var count = _pendingPhotos.length;
        area.innerHTML = '<div class="ga-scanning"><div class="ga-spinner"></div><span>領収書を読み取り中…</span></div>';

        var fd = new FormData();
        _pendingPhotos.forEach(function(f) {
          fd.append("file", f);
          fd.append("docType", "receipt");
        });
        _pendingPhotos = [];

        var abortCtrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
        var abortTimer = abortCtrl ? setTimeout(function(){ abortCtrl.abort(); }, 60000) : null;
        var fetchOpts = { method: "POST", credentials: "same-origin", body: fd };
        if (abortCtrl) fetchOpts.signal = abortCtrl.signal;

        fetch("/api/groups/" + encodeURIComponent(GID) + "/expenses/scan", fetchOpts)
        .then(function(r){
          if (abortTimer) clearTimeout(abortTimer);
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        })
        .then(function(data){
          if (data.error) { showToast("エラー: " + data.error); area.innerHTML = ""; return; }
          var docs = data.documents || [data.ocr || {}];
          var receiptUrls = data.receipt_urls || (data.receipt_url ? [data.receipt_url] : []);
          var allEntries = [];
          docs.forEach(function(doc) {
            allEntries.push({
              type: "expense",
              date: doc.date || today(),
              vendor: doc.vendor || "",
              amount: doc.total || 0,
              category: "",
              memo: "",
              items: doc.items || [],
              receipt_urls: receiptUrls,
            });
            if (doc.fee && doc.fee.amount) {
              allEntries.push({
                type: "expense",
                date: doc.date || today(),
                vendor: doc.fee.vendor || "",
                amount: doc.fee.amount,
                category: "",
                memo: "振込手数料",
                items: [{ name: "振込手数料", price: doc.fee.amount, quantity: 1 }],
                receipt_urls: receiptUrls,
              });
            }
          });
          if (allEntries.length === 0) {
            showToast("読み取れませんでした");
            area.innerHTML = "";
          } else if (allEntries.length === 1) {
            showForm(allEntries[0], null);
            showToast("読み取り完了！内訳が必要なら請求書を追加できます");
          } else {
            _batchResults = allEntries;
            showBatchResults();
            showToast("読み取り完了！" + allEntries.length + "件に分離しました");
          }
        })
        .catch(function(err){
          showToast("エラー: " + (err.message || String(err)));
          area.innerHTML = '<div style="padding:16px;color:#c33;font-size:13px">エラー: ' + (err.message || String(err)) + '</div>';
        });
      }

      function showBatchResults() {
        var area = document.getElementById("ga-form-area");
        var okCount = _batchResults.filter(function(r){ return !r._error && !r._saved && !r._skipped; }).length;
        var savedCount = _batchResults.filter(function(r){ return r._saved; }).length;
        var errCount = _batchResults.filter(function(r){ return !!r._error; }).length;

        var html = '<div class="ga-batch">'
          + '<h3 class="gr-form-title">読み取り結果</h3>'
          + '<div class="ga-batch-summary">' + _batchResults.length + '件中 ' + (okCount + savedCount) + '件成功'
          + (errCount ? '、' + errCount + '件エラー' : '')
          + (savedCount ? '（' + savedCount + '件保存済み）' : '') + '</div>';

        _batchResults.forEach(function(r, i) {
          if (r._saved || r._skipped) return;
          html += '<div class="ga-batch-card' + (r._error ? ' ga-batch-err' : '') + '">'
            + '<div class="ga-batch-card-top">';
          if (r.receipt_urls && r.receipt_urls[0]) {
            html += '<img class="ga-batch-thumb" src="' + esc(r.receipt_urls[0]) + '">';
          }
          html += '<div class="ga-batch-card-info">'
            + '<div class="ga-batch-vendor">' + esc(r.vendor || r._fileName || "不明") + '</div>'
            + '<div class="ga-batch-date">' + esc(r.date || "") + '</div>'
            + (r._error ? '<div class="ga-batch-err-msg">' + esc(r._error) + '</div>' : '')
            + '</div>'
            + '<div class="ga-batch-amount">' + (r._error ? '—' : formatYen(r.amount)) + '</div>'
            + '</div>'
            + '<div class="ga-batch-card-actions">'
            + '<button class="btn btn-primary" onclick="GA.editBatchItem(' + i + ')" style="font-size:12px;padding:5px 12px">確認・編集</button>'
            + '<button class="gr-btn-del" onclick="GA.skipBatchItem(' + i + ')">除外</button>'
            + '</div></div>';
        });

        var remaining = _batchResults.filter(function(r){ return !r._saved && !r._skipped && !r._error; });
        if (remaining.length) {
          html += '<div class="ga-batch-footer">'
            + '<button class="btn btn-primary" onclick="GA.saveAllBatch()">すべて保存 (' + remaining.length + '件)</button>'
            + '<button class="btn btn-secondary" onclick="GA.cancelBatch()">キャンセル</button>'
            + '</div>';
        } else {
          html += '<div class="ga-batch-footer">'
            + '<button class="btn btn-secondary" onclick="GA.cancelBatch()">閉じる</button>'
            + '</div>';
        }
        html += '</div>';

        area.innerHTML = html;
        area.scrollIntoView({ behavior: "smooth" });
      }

      function editBatchItem(i) {
        _batchEditIdx = i;
        var r = _batchResults[i];
        showForm({
          type: r.type || "expense",
          date: r.date,
          vendor: r.vendor,
          amount: r.amount,
          category: r.category,
          memo: r.memo,
          items: r.items,
          receipt_urls: r.receipt_urls || []
        }, null);
      }

      function skipBatchItem(i) {
        _batchResults[i]._skipped = true;
        showBatchResults();
        showToast("除外しました");
      }

      function saveAllBatch() {
        var count = 0;
        _batchResults.forEach(function(r) {
          if (r._saved || r._skipped || r._error) return;
          var entry = {
            id: "exp_" + Date.now() + "_" + Math.random().toString(36).slice(2,6),
            type: r.type || "expense",
            date: r.date || today(),
            vendor: r.vendor || "",
            amount: r.amount || 0,
            category: r.category || "",
            memo: r.memo || "",
            items: r.items || [],
            receipt_urls: r.receipt_urls || [],
            created_at: new Date().toISOString(),
            status: "confirmed"
          };
          expenses.push(entry);
          r._saved = true;
          count++;
        });
        if (count) {
          // 最後に保存したエントリの年度に自動切替
          var lastEntry = expenses[expenses.length - 1];
          if (lastEntry) {
            var batchFY = dateToFY(lastEntry.date);
            if (batchFY !== currentFY) currentFY = batchFY;
          }
          saveToServer(count + "件を保存しました");
          render();
          showBatchResults();
        }
      }

      function cancelBatch() {
        _batchResults = [];
        _batchEditIdx = null;
        var area = document.getElementById("ga-form-area");
        if (area) area.innerHTML = "";
      }

      // 証憑画像の追加（OCR付きで再読み取り → フォーム更新）
      // 証憑画像を追加（OCRなし、画像保存のみ）
      function addEvidence() {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment";
        input.onchange = function() {
          if (!input.files || !input.files.length) return;
          uploadEvidence(input.files[0]);
        };
        input.click();
      }

      function uploadEvidence(file) {
        var section = document.getElementById("gaf-receipt-section");
        if (section) {
          section.innerHTML = '<div class="ga-scanning" style="padding:8px 0"><div class="ga-spinner"></div><span>保存中…</span></div>';
        }
        var fd = new FormData();
        fd.append("file", file);
        fetch("/api/groups/" + encodeURIComponent(GID) + "/expenses/upload", {
          method: "POST", credentials: "same-origin", body: fd
        })
        .then(function(r){ return r.json(); })
        .then(function(data) {
          var urlsEl = document.getElementById("gaf-receipt-urls");
          var urls = [];
          try { urls = JSON.parse(urlsEl.value); } catch(e) {}
          if (data.receipt_url) urls.push(data.receipt_url);
          urlsEl.value = JSON.stringify(urls);
          renderReceiptThumbs();
          showToast("証憑画像を追加しました");
        })
        .catch(function() {
          renderReceiptThumbs();
          showToast("画像の保存に失敗しました");
        });
      }

      function renderReceiptThumbs() {
        var urlsEl = document.getElementById("gaf-receipt-urls");
        if (!urlsEl) return;
        var urls = [];
        try { urls = JSON.parse(urlsEl.value); } catch(e) {}
        var section = document.getElementById("gaf-receipt-section");
        if (!section) return;
        var html = '';
        if (urls.length) {
          html += '<div class="gaf-receipt-thumbs">';
          urls.forEach(function(url, i) {
            html += '<div class="gaf-receipt-thumb-wrap">'
              + '<img src="' + esc(url) + '" class="gaf-receipt-thumb">'
              + '<button type="button" class="gaf-receipt-del" onclick="GA.removeReceipt(' + i + ')">✕</button>'
              + '</div>';
          });
          html += '</div>';
        }
        html += '<button type="button" class="btn btn-secondary ga-add-evidence-btn" onclick="GA.addEvidence()">📷 証憑を追加</button>';
        section.innerHTML = html;
      }

      function removeReceipt(idx) {
        var urlsEl = document.getElementById("gaf-receipt-urls");
        if (!urlsEl) return;
        var urls = [];
        try { urls = JSON.parse(urlsEl.value); } catch(e) {}
        urls.splice(idx, 1);
        urlsEl.value = JSON.stringify(urls);
        renderReceiptThumbs();
      }

      // フォーム
      function showForm(entry, idx) {
        var isEdit = idx !== null && idx !== undefined;
        entry = entry || { type: "expense", date: today(), vendor: "", amount: 0, category: "", memo: "", items: [], receipt_url: "" };
        var entryType = entry.type || "expense";
        var area = document.getElementById("ga-form-area");
        if (!area) { render(); area = document.getElementById("ga-form-area"); }

        var cats = sortCats(entryType === "income" ? incomeCategories : expenseCategories);
        var catOptions = '<option value="">選択してください</option>';
        cats.forEach(function(c){
          var sel = c === entry.category ? " selected" : "";
          catOptions += '<option value="' + esc(c) + '"' + sel + '>' + esc(c) + '</option>';
        });

        var itemsHtml = '';
        var items = entry.items || [];
        if (!items.length) items = [{ name: "", price: 0, quantity: 1 }];
        items.forEach(function(item, i){
          itemsHtml += '<div class="gaf-item-row" data-idx="' + i + '">'
            + '<input type="text" class="gaf-item-name" value="' + esc(item.name||"") + '" placeholder="品名">'
            + '<input type="number" class="gaf-item-price" value="' + (item.price||0) + '" placeholder="金額">'
            + '<input type="number" class="gaf-item-qty" value="' + (item.quantity||1) + '" placeholder="数" min="1" style="width:50px">'
            + '<button type="button" class="gaf-item-del" onclick="GA.removeItemRow(this)">✕</button>'
            + '</div>';
        });

        var receiptUrls = entry.receipt_urls || (entry.receipt_url ? [entry.receipt_url] : []);
        var receiptPreview = '<input type="hidden" id="gaf-receipt-urls" value="' + esc(JSON.stringify(receiptUrls)) + '">'
          + '<div id="gaf-receipt-section">';
        if (receiptUrls.length) {
          receiptPreview += '<div class="gaf-receipt-thumbs">';
          receiptUrls.forEach(function(url, i) {
            receiptPreview += '<div class="gaf-receipt-thumb-wrap">'
              + '<img src="' + esc(url) + '" class="gaf-receipt-thumb">'
              + '<button type="button" class="gaf-receipt-del" onclick="GA.removeReceipt(' + i + ')">✕</button>'
              + '</div>';
          });
          receiptPreview += '</div>';
        }
        receiptPreview += '<button type="button" class="btn btn-secondary ga-add-evidence-btn" onclick="GA.addEvidence()">📷 証憑を追加</button>'
          + '</div>';

        var isIncome = entryType === "income";
        var formTitle = isEdit ? (isIncome ? '収入を編集' : '支出を編集') : (isIncome ? '収入を追加' : '支出を追加');
        var vendorLabel = isIncome ? '支払元' : '支払先';
        var vendorPlaceholder = isIncome ? '例: 〇〇市文化振興課' : '例: 株式会社〇〇';
        var memoPlaceholder = isIncome ? '例: 令和7年度地域文化活動補助金' : '例: 公演用の資材';

        area.innerHTML = '<div class="gr-form' + (isIncome ? ' ga-form-income' : '') + '">'
          + '<h3 class="gr-form-title">' + formTitle + '</h3>'
          + '<input type="hidden" id="gaf-type" value="' + entryType + '">'
          + '<div class="ga-form-type-toggle">'
          + '<button type="button" class="ga-toggle-btn' + (!isIncome ? ' ga-toggle-active' : '') + '" onclick="GA.switchFormType(\\'expense\\',' + (isEdit?idx:"null") + ')">支出</button>'
          + '<button type="button" class="ga-toggle-btn ga-toggle-income' + (isIncome ? ' ga-toggle-active' : '') + '" onclick="GA.switchFormType(\\'income\\',' + (isEdit?idx:"null") + ')">収入</button>'
          + '</div>'
          + '<div class="gr-form-row"><label>日付</label><input type="date" id="gaf-date" value="' + esc(entry.date||today()) + '"></div>'
          + '<div class="gr-form-row"><label>' + vendorLabel + '</label><input type="text" id="gaf-vendor" value="' + esc(entry.vendor||"") + '" placeholder="' + vendorPlaceholder + '"></div>'
          + '<div class="gr-form-row"><label>金額</label><input type="number" id="gaf-amount" value="' + (entry.amount||0) + '" placeholder="0" min="0"></div>'
          + '<div class="gr-form-row"><label>カテゴリ</label><select id="gaf-category">' + catOptions + '</select>'
          + '<div class="gaf-custom-cat" style="margin-top:6px"><input type="text" id="gaf-custom-cat" placeholder="新しいカテゴリを追加"><button type="button" class="btn btn-secondary" onclick="GA.addCategory()" style="font-size:12px;padding:4px 10px;margin-left:4px">追加</button></div></div>'
          + '<div class="gr-form-row"><label>メモ</label><input type="text" id="gaf-memo" value="' + esc(entry.memo||"") + '" placeholder="' + memoPlaceholder + '"></div>'
          + '<div class="gr-form-row"><label>明細</label><div id="gaf-items">' + itemsHtml + '</div>'
          + '<button type="button" class="btn btn-secondary" onclick="GA.addItemRow()" style="font-size:12px;padding:4px 10px;margin-top:4px">+ 行を追加</button></div>'
          + '<div class="gr-form-row"><label>証憑画像</label>' + receiptPreview + '</div>'
          + '<div class="gr-form-actions">'
          + '<button class="btn btn-primary" onclick="GA.saveForm(' + (isEdit ? idx : "null") + ')">保存</button>'
          + '<button class="btn btn-secondary" onclick="GA.cancelForm()">キャンセル</button>'
          + '</div></div>';
        area.scrollIntoView({ behavior: "smooth" });
      }

      function collectItems() {
        var rows = document.querySelectorAll(".gaf-item-row");
        var items = [];
        for (var i = 0; i < rows.length; i++) {
          var name = rows[i].querySelector(".gaf-item-name").value.trim();
          var price = parseInt(rows[i].querySelector(".gaf-item-price").value) || 0;
          var qty = parseInt(rows[i].querySelector(".gaf-item-qty").value) || 1;
          if (name || price) items.push({ name: name, price: price, quantity: qty });
        }
        return items;
      }

      function saveForm(idx) {
        var amount = parseInt(document.getElementById("gaf-amount").value) || 0;
        var entryType = document.getElementById("gaf-type") ? document.getElementById("gaf-type").value : "expense";
        var receiptUrlsEl = document.getElementById("gaf-receipt-urls");
        var receiptUrls = [];
        if (receiptUrlsEl) { try { receiptUrls = JSON.parse(receiptUrlsEl.value); } catch(e){} }
        var entry = {
          id: (idx !== null && expenses[idx]) ? expenses[idx].id : "exp_" + Date.now() + "_" + Math.random().toString(36).slice(2,6),
          type: entryType,
          date: document.getElementById("gaf-date").value,
          vendor: document.getElementById("gaf-vendor").value.trim(),
          amount: amount,
          category: document.getElementById("gaf-category").value,
          memo: document.getElementById("gaf-memo").value.trim(),
          items: collectItems(),
          receipt_urls: receiptUrls,
          created_by: (idx !== null && expenses[idx]) ? expenses[idx].created_by : "",
          created_at: (idx !== null && expenses[idx]) ? expenses[idx].created_at : new Date().toISOString(),
          status: "confirmed"
        };
        if (!entry.date) { alert("日付を入力してください。"); return; }
        if (!amount) { alert("金額を入力してください。"); return; }

        if (idx !== null && idx !== undefined && idx >= 0) {
          expenses[idx] = entry;
        } else {
          expenses.push(entry);
        }

        // 保存したエントリの年度が表示中と違う場合、自動切替
        var entryFY = dateToFY(entry.date);
        if (entryFY !== currentFY) {
          currentFY = entryFY;
        }

        // バッチ編集フロー
        if (_batchEditIdx !== null) {
          _batchResults[_batchEditIdx]._saved = true;
          _batchEditIdx = null;
          var unsaved = _batchResults.filter(function(r){ return !r._saved && !r._skipped && !r._error; });
          var batchMsg = unsaved.length ? "保存しました（残り" + unsaved.length + "件）" : "すべて保存しました";
          saveToServer(batchMsg);
          render();
          if (unsaved.length) showBatchResults();
          return;
        }

        saveToServer((entryType === "income" ? "収入" : "支出") + "を保存しました");
        render();
      }

      function delExpense(idx) {
        if (!confirm("この経費を削除しますか？")) return;
        expenses.splice(idx, 1);
        saveToServer("削除しました");
        render();
      }

      function saveToServer(successMsg) {
        var payload = JSON.stringify({ expenses: expenses, expenseCategories: expenseCategories, incomeCategories: incomeCategories, fyStartMonth: fyStartMonth, carryForward: carryForward, categoryMapping: categoryMapping });
        console.log("[saveToServer] sending", expenses.length, "items, payload size:", payload.length);
        fetch("/api/groups/" + encodeURIComponent(GID) + "/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: payload
        })
        .then(function(r){
          console.log("[saveToServer] response status:", r.status);
          if (!r.ok) return r.json().then(function(d){ throw new Error("HTTP " + r.status + ": " + (d.error || "保存に失敗しました")); });
          if (successMsg) showToast(successMsg);
        })
        .catch(function(e){
          console.error("[saveToServer] error:", e);
          showToast("❌ 保存失敗: " + (e.message || String(e)));
          loadData();
        });
      }

      function showToast(msg) {
        var existing = document.querySelector('.ga-toast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.className = 'ga-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function() { toast.classList.add('ga-toast-hide'); }, 1800);
        setTimeout(function() { toast.remove(); }, 2200);
      }

      function showFYSetting() {
        var area = document.getElementById("ga-form-area");
        if (!area) { render(); area = document.getElementById("ga-form-area"); }
        var opts = '';
        for (var m = 1; m <= 12; m++) {
          opts += '<option value="' + m + '"' + (m === fyStartMonth ? ' selected' : '') + '>' + m + '月</option>';
        }
        area.innerHTML = '<div class="gr-form">'
          + '<h3 class="gr-form-title">年度設定</h3>'
          + '<div class="gr-form-row"><label>年度の開始月</label>'
          + '<select id="ga-fy-start-select">' + opts + '</select>'
          + '<div style="font-size:12px;color:var(--text-tertiary);margin-top:4px">例: 4月 → 4月〜翌3月が1年度</div>'
          + '</div>'
          + '<div class="gr-form-actions">'
          + '<button class="btn btn-primary" onclick="GA.saveFYSetting()">保存</button>'
          + '<button class="btn btn-secondary" onclick="GA.cancelForm()">キャンセル</button>'
          + '</div></div>';
        area.scrollIntoView({ behavior: "smooth" });
      }

      function saveFYSetting() {
        var sel = document.getElementById("ga-fy-start-select");
        if (!sel) return;
        var newMonth = parseInt(sel.value);
        if (newMonth >= 1 && newMonth <= 12 && newMonth !== fyStartMonth) {
          fyStartMonth = newMonth;
          initFY();
          saveToServer("年度開始月を" + fyStartMonth + "月に変更しました");
        }
        var area = document.getElementById("ga-form-area");
        if (area) area.innerHTML = "";
        render();
      }

      function showUncategorized() {
        var area = document.getElementById("ga-form-area");
        if (!area) { render(); area = document.getElementById("ga-form-area"); }
        var uncatItems = [];
        expenses.forEach(function(e, idx){
          if (!e.category && isInFY(e.date||"", currentFY)) {
            uncatItems.push({ idx: idx, entry: e });
          }
        });
        if (!uncatItems.length) { showToast("未分類の明細はありません"); return; }

        var allCats = expenseCategories.concat(incomeCategories);
        var bulkOpts = '<option value="">— 選択 —</option>';
        sortCats(expenseCategories).forEach(function(c){
          bulkOpts += '<option value="' + esc(c) + '">' + esc(c) + '</option>';
        });
        sortCats(incomeCategories).forEach(function(c){
          if (expenseCategories.indexOf(c) < 0) bulkOpts += '<option value="' + esc(c) + '">' + esc(c) + '</option>';
        });

        var html = '<div class="gr-form">'
          + '<h3 class="gr-form-title">カテゴリ未設定の明細（' + uncatItems.length + '件）</h3>'
          + '<div class="ga-uncat-bulk">'
          + '<label>まとめて設定:</label>'
          + '<select id="ga-uncat-bulk-sel">' + bulkOpts + '</select>'
          + '<button class="btn btn-secondary" onclick="GA.applyBulkCategory()" style="font-size:12px;padding:5px 12px">適用</button>'
          + '</div>';

        uncatItems.forEach(function(item) {
          var e = item.entry;
          var isIncome = (e.type === "income");
          var cats = isIncome ? incomeCategories : expenseCategories;
          var opts = '<option value="">— カテゴリを選択 —</option>';
          sortCats(cats).forEach(function(c){
            opts += '<option value="' + esc(c) + '">' + esc(c) + '</option>';
          });
          var shortDate = (function(d){ var p = d.split("-"); return p.length >= 3 ? parseInt(p[1]) + "/" + parseInt(p[2]) : d; })(e.date||"");
          var memoText = e.memo ? ' — ' + esc(e.memo) : '';
          var itemsText = '';
          if (e.items && e.items.length) {
            var names = e.items.map(function(it){ return it.name || ""; }).filter(function(n){ return n; });
            if (names.length) itemsText = ' (' + esc(names.join(", ")) + ')';
          }
          html += '<div class="ga-uncat-card">'
            + '<div class="ga-uncat-top">'
            + '<span class="ga-uncat-date">' + esc(shortDate) + '</span>'
            + '<span class="ga-uncat-vendor">' + esc(e.vendor || "（不明）") + '</span>'
            + '<span class="ga-uncat-amount' + (isIncome ? ' ga-income-val' : '') + '">' + formatYen(e.amount) + '</span>'
            + '</div>'
            + (memoText || itemsText ? '<div class="ga-uncat-detail">' + memoText.replace(/^ — /, '') + itemsText + '</div>' : '')
            + '<select class="ga-uncat-select" data-idx="' + item.idx + '">' + opts + '</select>'
            + '</div>';
        });

        html += '<div class="gr-form-actions">'
          + '<button class="btn btn-primary" onclick="GA.saveUncategorized()">保存</button>'
          + '<button class="btn btn-secondary" onclick="GA.cancelForm()">キャンセル</button>'
          + '</div></div>';
        area.innerHTML = html;
        area.scrollIntoView({ behavior: "smooth" });
      }

      function applyBulkCategory() {
        var bulkSel = document.getElementById("ga-uncat-bulk-sel");
        if (!bulkSel || !bulkSel.value) { showToast("カテゴリを選択してください"); return; }
        var val = bulkSel.value;
        var selects = document.querySelectorAll(".ga-uncat-select");
        for (var i = 0; i < selects.length; i++) {
          if (!selects[i].value) {
            // 選択肢に含まれている場合のみ設定
            for (var j = 0; j < selects[i].options.length; j++) {
              if (selects[i].options[j].value === val) { selects[i].value = val; break; }
            }
          }
        }
      }

      function saveUncategorized() {
        var selects = document.querySelectorAll(".ga-uncat-select");
        var changed = 0;
        for (var i = 0; i < selects.length; i++) {
          var val = selects[i].value;
          if (val) {
            var idx = parseInt(selects[i].getAttribute("data-idx"));
            if (expenses[idx]) { expenses[idx].category = val; changed++; }
          }
        }
        if (changed) {
          saveToServer(changed + "件のカテゴリを設定しました");
          var area = document.getElementById("ga-form-area");
          if (area) area.innerHTML = "";
          render();
        } else {
          showToast("カテゴリが選択されていません");
        }
      }

      function showCategoryMapping() {
        var area = document.getElementById("ga-form-area");
        if (!area) { render(); area = document.getElementById("ga-form-area"); }
        // 当年度のexpenses内にあるカテゴリを収集
        var fyExpenses = expenses.filter(function(e){ return isInFY(e.date||"", currentFY); });
        var usedExpCats = [], usedIncCats = [];
        var seen = {};
        fyExpenses.forEach(function(e){
          var cat = e.category || "";
          if (!cat || seen[cat]) return;
          seen[cat] = true;
          if ((e.type||"expense") === "income") usedIncCats.push(cat);
          else usedExpCats.push(cat);
        });
        usedExpCats = sortCats(usedExpCats);
        usedIncCats = sortCats(usedIncCats);

        var html = '<div class="gr-form">'
          + '<h3 class="gr-form-title">決算科目の設定</h3>'
          + '<p style="font-size:12px;color:var(--text-tertiary);margin:0 0 12px">帳簿で使用中の科目 → 決算書での科目名<br>空欄の場合は帳簿科目がそのまま使われます</p>';

        if (usedExpCats.length) {
          html += '<div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:8px 0 4px">【支出】</div>';
          usedExpCats.forEach(function(c){
            var mapped = categoryMapping[c] || "";
            html += '<div class="ga-catmap-row">'
              + '<span class="ga-catmap-label">' + esc(c) + '</span>'
              + '<span class="ga-catmap-arrow">→</span>'
              + '<input type="text" class="ga-catmap-input" data-cat="' + esc(c) + '" value="' + esc(mapped) + '" placeholder="（そのまま）">'
              + '</div>';
          });
        }
        if (usedIncCats.length) {
          html += '<div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin:12px 0 4px">【収入】</div>';
          usedIncCats.forEach(function(c){
            var mapped = categoryMapping[c] || "";
            html += '<div class="ga-catmap-row">'
              + '<span class="ga-catmap-label">' + esc(c) + '</span>'
              + '<span class="ga-catmap-arrow">→</span>'
              + '<input type="text" class="ga-catmap-input" data-cat="' + esc(c) + '" value="' + esc(mapped) + '" placeholder="（そのまま）">'
              + '</div>';
          });
        }
        if (!usedExpCats.length && !usedIncCats.length) {
          html += '<p style="color:var(--text-tertiary);font-size:13px">この年度にはまだ収支データがありません</p>';
        }

        html += '<div class="gr-form-actions">'
          + '<button class="btn btn-primary" onclick="GA.saveCategoryMapping()">保存</button>'
          + '<button class="btn btn-secondary" onclick="GA.cancelForm()">キャンセル</button>'
          + '</div></div>';
        area.innerHTML = html;
        area.scrollIntoView({ behavior: "smooth" });
      }

      function saveCategoryMapping() {
        var inputs = document.querySelectorAll(".ga-catmap-input");
        var newMapping = {};
        // 既存マッピングを維持（他年度の科目マッピングも保持）
        for (var k in categoryMapping) {
          if (categoryMapping.hasOwnProperty(k)) newMapping[k] = categoryMapping[k];
        }
        for (var i = 0; i < inputs.length; i++) {
          var cat = inputs[i].getAttribute("data-cat");
          var val = inputs[i].value.trim();
          if (val) { newMapping[cat] = val; }
          else { delete newMapping[cat]; }
        }
        categoryMapping = newMapping;
        saveToServer("決算科目の設定を保存しました");
        var area = document.getElementById("ga-form-area");
        if (area) area.innerHTML = "";
        render();
      }

      function exportCSV() {
        var url = "/api/groups/" + encodeURIComponent(GID) + "/expenses/export?format=csv&fy=" + currentFY;
        window.open(url, "_blank");
      }

      function exportPDF() {
        generatePDF();
      }

      function generatePDF() {
        // HTML → PDF via doc.html() でブラウザフォントを利用
        var monthAll = expenses.filter(function(e){ return isInFY(e.date||"", currentFY); });
        monthAll.sort(function(a,b){ return (a.date||"").localeCompare(b.date||""); });

        var totalIncome = 0, totalExpense = 0;
        var incomeCatTotals = {}, expenseCatTotals = {};
        monthAll.forEach(function(e){
          var isIncome = (e.type === "income");
          var rawCat = e.category || "その他";
          var cat = categoryMapping[rawCat] || rawCat; // 決算科目に変換（合算される）
          if (isIncome) {
            totalIncome += (e.amount||0);
            incomeCatTotals[cat] = (incomeCatTotals[cat]||0) + (e.amount||0);
          } else {
            totalExpense += (e.amount||0);
            expenseCatTotals[cat] = (expenseCatTotals[cat]||0) + (e.amount||0);
          }
        });
        var pdfCfAmount = carryForward[String(currentFY)] || 0;
        var balance = pdfCfAmount + totalIncome - totalExpense;

        var thStyle = 'padding:4px 8px;border:1px solid #ddd';
        var tdStyle = 'padding:4px 8px;border:1px solid #ddd';
        var tdRight = 'text-align:right;padding:4px 8px;border:1px solid #ddd';

        var pdfHtml = '<div style="font-family:sans-serif;padding:20px;font-size:12px;color:#333;max-width:550px">';
        pdfHtml += '<h2 style="text-align:center;font-size:18px;margin-bottom:4px">収支決算書</h2>';
        pdfHtml += '<p style="text-align:center;font-size:13px;color:#666;margin-top:0">' + esc("${name}") + ' — ' + esc(fyLabel(currentFY)) + '</p>';
        pdfHtml += '<hr style="border:none;border-top:1px solid #ccc;margin:12px 0">';

        // 収支サマリー
        pdfHtml += '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">';
        if (pdfCfAmount) {
          pdfHtml += '<tr><td style="' + tdStyle + '">前年度繰越金</td><td style="' + tdRight + ';font-weight:bold">¥' + pdfCfAmount.toLocaleString() + '</td></tr>';
        }
        pdfHtml += '<tr><td style="' + tdStyle + '">収入合計</td><td style="' + tdRight + ';color:#2e7d32;font-weight:bold">¥' + totalIncome.toLocaleString() + '</td></tr>';
        pdfHtml += '<tr><td style="' + tdStyle + '">支出合計</td><td style="' + tdRight + ';color:#c62828;font-weight:bold">¥' + totalExpense.toLocaleString() + '</td></tr>';
        pdfHtml += '<tr style="background:#f5f5f5"><td style="' + tdStyle + ';font-weight:bold">期末残高</td><td style="' + tdRight + ';font-weight:bold">' + (balance >= 0 ? '' : '-') + '¥' + Math.abs(balance).toLocaleString() + '</td></tr>';
        pdfHtml += '</table>';

        // 収入カテゴリ別
        var incKeys = Object.keys(incomeCatTotals);
        if (incKeys.length) {
          pdfHtml += '<h3 style="font-size:14px;margin-bottom:8px">収入（カテゴリ別）</h3>';
          pdfHtml += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
          pdfHtml += '<tr style="background:#e8f5e9"><th style="text-align:left;' + thStyle + '">カテゴリ</th><th style="text-align:right;' + thStyle + '">金額</th></tr>';
          incKeys.sort(function(a,b){ return incomeCatTotals[b]-incomeCatTotals[a]; }).forEach(function(c){
            pdfHtml += '<tr><td style="' + tdStyle + '">' + esc(c) + '</td><td style="' + tdRight + '">¥' + incomeCatTotals[c].toLocaleString() + '</td></tr>';
          });
          pdfHtml += '<tr style="font-weight:bold"><td style="' + tdStyle + '">小計</td><td style="' + tdRight + '">¥' + totalIncome.toLocaleString() + '</td></tr>';
          pdfHtml += '</table>';
        }

        // 支出カテゴリ別
        var expKeys = Object.keys(expenseCatTotals);
        if (expKeys.length) {
          pdfHtml += '<h3 style="font-size:14px;margin:16px 0 8px">支出（カテゴリ別）</h3>';
          pdfHtml += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
          pdfHtml += '<tr style="background:#ffebee"><th style="text-align:left;' + thStyle + '">カテゴリ</th><th style="text-align:right;' + thStyle + '">金額</th></tr>';
          expKeys.sort(function(a,b){ return expenseCatTotals[b]-expenseCatTotals[a]; }).forEach(function(c){
            pdfHtml += '<tr><td style="' + tdStyle + '">' + esc(c) + '</td><td style="' + tdRight + '">¥' + expenseCatTotals[c].toLocaleString() + '</td></tr>';
          });
          pdfHtml += '<tr style="font-weight:bold"><td style="' + tdStyle + '">小計</td><td style="' + tdRight + '">¥' + totalExpense.toLocaleString() + '</td></tr>';
          pdfHtml += '</table>';
        }

        // 明細一覧
        pdfHtml += '<h3 style="font-size:14px;margin:16px 0 8px">明細一覧</h3>';
        pdfHtml += '<table style="width:100%;border-collapse:collapse;font-size:11px">';
        pdfHtml += '<tr style="background:#f5f5f5"><th style="padding:3px 6px;border:1px solid #ddd">区分</th><th style="padding:3px 6px;border:1px solid #ddd">日付</th><th style="padding:3px 6px;border:1px solid #ddd">相手先</th><th style="padding:3px 6px;border:1px solid #ddd">カテゴリ</th><th style="text-align:right;padding:3px 6px;border:1px solid #ddd">金額</th><th style="padding:3px 6px;border:1px solid #ddd">メモ</th></tr>';
        monthAll.forEach(function(e){
          var isInc = (e.type === "income");
          pdfHtml += '<tr>'
            + '<td style="padding:3px 6px;border:1px solid #ddd;color:' + (isInc ? '#2e7d32' : '#c62828') + '">' + (isInc ? '収入' : '支出') + '</td>'
            + '<td style="padding:3px 6px;border:1px solid #ddd;white-space:nowrap">' + esc(e.date||"") + '</td>'
            + '<td style="padding:3px 6px;border:1px solid #ddd">' + esc(e.vendor||"") + '</td>'
            + '<td style="padding:3px 6px;border:1px solid #ddd">' + esc(categoryMapping[e.category] || e.category || "") + '</td>'
            + '<td style="text-align:right;padding:3px 6px;border:1px solid #ddd;white-space:nowrap">¥' + (e.amount||0).toLocaleString() + '</td>'
            + '<td style="padding:3px 6px;border:1px solid #ddd">' + esc(e.memo||"") + '</td>'
            + '</tr>';
        });
        pdfHtml += '</table>';
        pdfHtml += '<p style="text-align:right;font-size:10px;color:#999;margin-top:16px">出力日: ' + today() + '</p>';
        pdfHtml += '</div>';

        // 印刷用ウィンドウで PDF 出力（ブラウザネイティブ — 日本語フォント確実）
        var printWin = window.open("", "_blank");
        if (!printWin) { showToast("ポップアップがブロックされました。許可してください。"); return; }
        printWin.document.write('<!DOCTYPE html><html><head><meta charset="utf-8">'
          + '<title>収支決算書 ' + currentFY + '</title>'
          + '<style>'
          + '@media print { @page { size: A4; margin: 15mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }'
          + 'body { font-family: "Hiragino Kaku Gothic ProN","Hiragino Sans",sans-serif; margin: 20px; color: #333; }'
          + '.no-print { text-align: center; padding: 12px; margin-bottom: 16px; }'
          + '.no-print button { font-size: 15px; padding: 8px 24px; margin: 0 8px; cursor: pointer; border-radius: 6px; border: 1px solid #ccc; background: #f5f5f5; }'
          + '.no-print button.primary { background: #1a73e8; color: #fff; border: none; }'
          + '@media print { .no-print { display: none; } }'
          + '</style></head><body>'
          + '<div class="no-print">'
          + '<button class="primary" onclick="window.print()">🖨 印刷 / PDF保存</button>'
          + '<button onclick="window.close()">閉じる</button>'
          + '</div>'
          + pdfHtml
          + '</body></html>');
        printWin.document.close();
      }

      function addItemRow() {
        var container = document.getElementById("gaf-items");
        if (!container) return;
        var idx = container.children.length;
        var row = document.createElement("div");
        row.className = "gaf-item-row";
        row.setAttribute("data-idx", idx);
        row.innerHTML = '<input type="text" class="gaf-item-name" value="" placeholder="品名">'
          + '<input type="number" class="gaf-item-price" value="0" placeholder="金額">'
          + '<input type="number" class="gaf-item-qty" value="1" placeholder="数" min="1" style="width:50px">'
          + '<button type="button" class="gaf-item-del" onclick="GA.removeItemRow(this)">✕</button>';
        container.appendChild(row);
      }

      function removeItemRow(btn) {
        var row = btn.parentElement;
        if (row) row.remove();
      }

      function addCategory() {
        var input = document.getElementById("gaf-custom-cat");
        if (!input) return;
        var val = input.value.trim();
        if (!val) return;
        var typeEl = document.getElementById("gaf-type");
        var isIncome = typeEl && typeEl.value === "income";
        var cats = isIncome ? incomeCategories : expenseCategories;
        if (cats.indexOf(val) >= 0) { showToast("既に存在するカテゴリです"); return; }
        cats.push(val);
        input.value = "";
        // セレクトに追加
        var sel = document.getElementById("gaf-category");
        if (sel) {
          var opt = document.createElement("option");
          opt.value = val;
          opt.textContent = val;
          opt.selected = true;
          sel.appendChild(opt);
        }
        showToast("カテゴリ「" + val + "」を追加しました");
      }

      initFY();

      function editCarryForward() {
        var d = document.getElementById("ga-cf-display");
        var f = document.getElementById("ga-cf-form");
        if (d) d.style.display = "none";
        if (f) f.style.display = "flex";
        var input = document.getElementById("ga-cf-input");
        if (input) input.focus();
      }

      function saveCarryForward() {
        var input = document.getElementById("ga-cf-input");
        var val = parseInt(input ? input.value : 0) || 0;
        carryForward[String(currentFY)] = val;
        saveToServer("繰越金を保存しました");
        render();
      }

      function cancelCarryForward() {
        var d = document.getElementById("ga-cf-display");
        var f = document.getElementById("ga-cf-form");
        if (d) d.style.display = "";
        if (f) f.style.display = "none";
      }

      function toggleLedger() {
        showLedger = !showLedger;
        render();
      }

      function switchFormType(newType, idx) {
        // フォームの現在値を保持してタイプ切替
        var dateEl = document.getElementById("gaf-date");
        var vendorEl = document.getElementById("gaf-vendor");
        var amountEl = document.getElementById("gaf-amount");
        var memoEl = document.getElementById("gaf-memo");
        var receiptUrlsEl = document.getElementById("gaf-receipt-urls");
        var receiptUrls = [];
        if (receiptUrlsEl) { try { receiptUrls = JSON.parse(receiptUrlsEl.value); } catch(e){} }
        var entry = {
          type: newType,
          date: dateEl ? dateEl.value : today(),
          vendor: vendorEl ? vendorEl.value : "",
          amount: amountEl ? parseInt(amountEl.value)||0 : 0,
          category: "",
          memo: memoEl ? memoEl.value : "",
          items: collectItems(),
          receipt_urls: receiptUrls,
        };
        showForm(entry, idx);
      }

      window.GA = {
        prevFY: prevFY,
        nextFY: nextFY,
        showFYSetting: showFYSetting,
        saveFYSetting: saveFYSetting,
        showUncategorized: showUncategorized,
        applyBulkCategory: applyBulkCategory,
        saveUncategorized: saveUncategorized,
        showCategoryMapping: showCategoryMapping,
        saveCategoryMapping: saveCategoryMapping,
        editCarryForward: editCarryForward,
        saveCarryForward: saveCarryForward,
        cancelCarryForward: cancelCarryForward,
        toggleLedger: toggleLedger,
        setView: function(v){ viewType = v; filterCat = "all"; render(); },
        setFilter: function(f){ filterCat = f; render(); },
        startScan: startScan,
        startBatchScan: startBatchScan,
        capturePhoto: capturePhoto,
        submitPhotos: submitPhotos,
        removePreviewPhoto: removePreviewPhoto,
        cancelPhotos: cancelPhotos,
        showAddForm: function(type){ showForm({ type: type||"expense" }, null); },
        editExpense: function(idx){ showForm(expenses[idx], idx); },
        delExpense: delExpense,
        saveForm: saveForm,
        cancelForm: function(){
          var area = document.getElementById("ga-form-area");
          if (area) area.innerHTML = "";
          if (_batchEditIdx !== null) {
            _batchEditIdx = null;
            showBatchResults();
          }
        },
        switchFormType: switchFormType,
        addItemRow: addItemRow,
        removeItemRow: removeItemRow,
        addCategory: addCategory,
        addEvidence: addEvidence,
        removeReceipt: removeReceipt,
        editBatchItem: editBatchItem,
        skipBatchItem: skipBatchItem,
        saveAllBatch: saveAllBatch,
        cancelBatch: cancelBatch,
        exportCSV: exportCSV,
        exportPDF: exportPDF
      };

      console.log("[GA] v3.1 loaded, GID:", GID);
      loadData();
    })();
    </script>
  `;

  return pageShell({
    title: `収支管理 - ${g.name}`,
    subtitle: "レシートスキャン・収支帳簿・決算書出力",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    headExtra: `<style>
      /* ── 月ナビ ── */
      .ga-month-nav {
        display: flex; align-items: center; justify-content: center;
        gap: 16px; margin-bottom: 1rem;
      }
      .ga-month-btn {
        font-size: 16px; background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: 50%; width: 36px; height: 36px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: var(--text-secondary); font-family: inherit; transition: all 0.15s;
      }
      .ga-month-btn:hover { border-color: var(--gold); color: var(--gold-dark); }
      .ga-fy-setting-btn {
        font-size: 14px; background: none; border: none; cursor: pointer;
        color: var(--text-tertiary); padding: 4px; margin-left: 2px; transition: color 0.15s;
      }
      .ga-fy-setting-btn:hover { color: var(--gold-dark); }
      /* ── 決算科目マッピング ── */
      .ga-catmap-row {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 0; border-bottom: 1px solid var(--border-light);
      }
      .ga-catmap-label {
        flex: 0 0 auto; min-width: 120px; font-size: 13px;
        color: var(--text-primary); white-space: nowrap;
      }
      .ga-catmap-arrow { color: var(--text-tertiary); font-size: 14px; flex-shrink: 0; }
      .ga-catmap-input {
        flex: 1; padding: 6px 8px; border: 1px solid var(--border-light);
        border-radius: 6px; font-size: 13px; background: var(--bg-card);
        color: var(--text-primary);
      }
      .ga-catmap-input:focus { border-color: var(--gold); outline: none; }
      @media (max-width: 480px) {
        .ga-catmap-label { min-width: 90px; font-size: 12px; }
        .ga-catmap-input { font-size: 12px; padding: 5px 6px; }
      }
      .ga-month-label {
        font-family: 'Noto Serif JP', serif; font-size: 18px; font-weight: 600;
        color: var(--text-primary);
      }

      /* ── サマリーカード ── */
      .ga-summary {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); padding: 16px; margin-bottom: 1rem;
        box-shadow: var(--shadow-sm);
      }
      .ga-summary-row {
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px;
      }
      .ga-summary-item { text-align: center; padding: 8px 4px; border-radius: var(--radius-sm); }
      .ga-income-box { background: #e8f5e9; }
      .ga-expense-box { background: #ffebee; }
      .ga-balance-box { background: var(--gold-soft); }
      .ga-summary-label { font-size: 11px; color: var(--text-tertiary); margin-bottom: 2px; }
      .ga-summary-val { font-size: 16px; font-weight: 700; }
      .ga-income-val { color: #2e7d32; }
      .ga-expense-val { color: #c62828; }
      .ga-summary-cats { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
      .ga-summary-cat {
        font-size: 12px; padding: 3px 10px; background: var(--gold-soft);
        color: var(--gold-dark); border-radius: 12px;
      }

      /* ── 収支タブ ── */
      .ga-type-tabs {
        display: flex; gap: 0; margin-bottom: 1rem;
        border: 1px solid var(--border-light); border-radius: var(--radius-md); overflow: hidden;
      }
      .ga-type-tab {
        flex: 1; padding: 10px; text-align: center; cursor: pointer;
        font-size: 14px; font-family: inherit; font-weight: 500;
        background: var(--bg-card); color: var(--text-secondary);
        border: none; border-right: 1px solid var(--border-light);
        transition: all 0.15s;
      }
      .ga-type-tab:last-child { border-right: none; }
      .ga-type-tab:hover { background: var(--gold-soft); }
      .ga-type-tab-active { background: var(--gold-soft); color: var(--gold-dark); font-weight: 700; }
      .ga-tab-income.ga-type-tab-active { background: #e8f5e9; color: #2e7d32; }
      .ga-tab-expense.ga-type-tab-active { background: #ffebee; color: #c62828; }

      /* ── CTA ── */
      .ga-cta { display: flex; gap: 10px; margin-bottom: 1rem; flex-wrap: wrap; }
      .ga-scan-btn { font-size: 15px !important; padding: 12px 20px !important; }
      .ga-income-btn { background: #e8f5e9 !important; color: #2e7d32 !important; border-color: #a5d6a7 !important; }

      /* ── フィルタ ── */
      .ga-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1rem; }
      .ga-filter {
        font-size: 12px; padding: 5px 12px; border: 1px solid var(--border-light);
        border-radius: 20px; cursor: pointer; background: var(--bg-card);
        color: var(--text-secondary); font-family: inherit; transition: all 0.15s;
      }
      .ga-filter:hover { border-color: var(--gold); color: var(--gold-dark); }
      .ga-filter-active { background: var(--gold-soft); border-color: var(--gold); color: var(--gold-dark); font-weight: 600; }

      /* ── 経費カード ── */
      .ga-count { font-size: 13px; color: var(--text-tertiary); margin-bottom: 10px; }
      .ga-card {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); padding: 14px;
        margin-bottom: 8px; box-shadow: var(--shadow-sm);
      }
      .ga-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
      .ga-card-left { display: flex; align-items: center; gap: 8px; }
      .ga-card-date { font-size: 13px; color: var(--text-tertiary); font-weight: 600; }
      .ga-card-vendor { font-size: 15px; font-weight: 600; color: var(--text-primary); }
      .ga-card-amount { font-size: 17px; font-weight: 700; color: var(--gold-dark); white-space: nowrap; }
      .ga-card-meta { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
      .ga-card-cat {
        font-size: 11px; padding: 2px 8px; background: var(--gold-soft);
        color: var(--gold-dark); border-radius: 4px;
      }
      .ga-card-memo { font-size: 12px; color: var(--text-secondary); }
      .ga-card-items { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
      .ga-card-item {
        font-size: 11px; padding: 2px 6px; background: var(--bg-page);
        border: 1px solid var(--border-light); border-radius: 3px; color: var(--text-secondary);
      }
      .ga-card-income { border-left: 3px solid #4caf50; }
      .ga-card-type-badge {
        font-size: 10px; padding: 1px 6px; border-radius: 3px; font-weight: 600;
      }
      .ga-badge-income { background: #e8f5e9; color: #2e7d32; }
      .ga-card-receipts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .ga-card-receipt-thumb {
        width: 48px; height: 48px; object-fit: cover; border-radius: 4px;
        border: 1px solid var(--border-light); cursor: pointer;
      }
      .ga-card-actions { display: flex; gap: 6px; margin-top: 8px; }

      /* ── エクスポート ── */
      /* ── 未分類警告 ── */
      .ga-uncat-warn {
        background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px;
        padding: 10px 14px; margin-top: 1rem; font-size: 13px; color: #8d6e00;
        cursor: pointer; text-align: center; transition: background 0.15s;
      }
      .ga-uncat-warn:hover { background: #fff3c4; }
      .ga-uncat-bulk {
        display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
        padding: 10px 12px; background: #f5f5f0; border-radius: 8px; flex-wrap: wrap;
      }
      .ga-uncat-bulk label { font-size: 13px; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }
      .ga-uncat-bulk select {
        flex: 1; min-width: 120px; padding: 6px 8px; border: 1px solid var(--border-light);
        border-radius: 6px; font-size: 13px; background: var(--bg-card); color: var(--text-primary);
      }
      .ga-uncat-card {
        padding: 10px 12px; margin-bottom: 8px; border: 1px solid var(--border-light);
        border-radius: 8px; background: var(--bg-card);
      }
      .ga-uncat-top {
        display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
      }
      .ga-uncat-date { font-size: 12px; color: var(--text-tertiary); white-space: nowrap; }
      .ga-uncat-vendor { font-size: 14px; font-weight: 500; color: var(--text-primary); }
      .ga-uncat-amount { font-size: 14px; font-weight: 600; white-space: nowrap; margin-left: auto; }
      .ga-uncat-detail { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
      .ga-uncat-select {
        width: 100%; padding: 7px 8px; border: 1px solid var(--border-light);
        border-radius: 6px; font-size: 13px; background: var(--bg-page); color: var(--text-primary);
      }
      .ga-uncat-select:focus { border-color: var(--gold); outline: none; }
      .ga-export { display: flex; gap: 10px; margin-top: 1.5rem; padding-top: 1rem; padding-bottom: 5rem; border-top: 1px solid var(--border-light); }

      /* ── スキャン中 ── */
      .ga-scanning {
        display: flex; align-items: center; gap: 12px; padding: 20px;
        background: var(--bg-card); border: 2px solid var(--gold-light);
        border-radius: var(--radius-md); margin-bottom: 1rem; justify-content: center;
      }
      .ga-spinner {
        width: 24px; height: 24px; border: 3px solid var(--border-light);
        border-top-color: var(--gold); border-radius: 50%;
        animation: gaSpin 0.8s linear infinite;
      }
      @keyframes gaSpin { to { transform: rotate(360deg); } }

      /* ── 写真プレビュー ── */
      .ga-photo-preview {
        background: var(--bg-card); border: 2px solid var(--gold-light);
        border-radius: var(--radius-md); padding: 16px; margin-bottom: 1rem;
      }
      .ga-preview-thumbs {
        display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0;
      }
      .ga-preview-thumb-wrap {
        position: relative; width: 100px; height: 100px;
      }
      .ga-preview-thumb {
        width: 100%; height: 100%; object-fit: cover;
        border-radius: 8px; border: 1px solid var(--border-light);
      }
      .ga-preview-actions {
        display: flex; gap: 10px; margin-top: 12px;
      }
      .ga-preview-add-btn { flex: 1; }
      .ga-preview-start-btn { flex: 1; }

      /* ── フォーム追加 ── */
      .gr-form select {
        width: 100%; padding: 10px 12px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary);
      }
      .gr-form select:focus { border-color: var(--gold); outline: none; }
      .ga-form-income { border-color: #a5d6a7; }
      .ga-form-type-toggle {
        display: flex; gap: 0; margin-bottom: 16px;
        border: 1px solid var(--border-light); border-radius: var(--radius-sm); overflow: hidden;
      }
      .ga-toggle-btn {
        flex: 1; padding: 8px; text-align: center; cursor: pointer;
        font-size: 13px; font-family: inherit; background: var(--bg-page);
        color: var(--text-secondary); border: none; transition: all 0.15s;
      }
      .ga-toggle-active { background: var(--gold-soft); color: var(--gold-dark); font-weight: 700; }
      .ga-toggle-income.ga-toggle-active { background: #e8f5e9; color: #2e7d32; }
      .gaf-custom-cat { display: flex; align-items: center; }
      .gaf-custom-cat input { flex: 1; }
      .gaf-item-row {
        display: flex; gap: 6px; align-items: center; margin-bottom: 6px;
      }
      .gaf-item-name { flex: 2; }
      .gaf-item-price { flex: 1; }
      .gaf-item-del {
        background: none; border: 1px solid var(--border-light); border-radius: 50%;
        width: 24px; height: 24px; font-size: 12px; cursor: pointer;
        color: var(--text-tertiary); display: flex; align-items: center; justify-content: center;
      }
      .gaf-item-del:hover { border-color: var(--accent-1); color: var(--accent-1); }

      /* ── 証憑画像（複数対応） ── */
      .gaf-receipt-thumbs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
      .gaf-receipt-thumb-wrap { position: relative; }
      .gaf-receipt-thumb {
        width: 80px; height: 80px; object-fit: cover; border-radius: 6px;
        border: 1px solid var(--border-light); cursor: pointer;
      }
      .gaf-receipt-del {
        position: absolute; top: -6px; right: -6px;
        width: 20px; height: 20px; border-radius: 50%;
        background: #c62828; color: #fff; border: none;
        font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;
        line-height: 1;
      }
      .ga-add-evidence-btn { font-size: 12px !important; padding: 6px 12px !important; }

      /* ── バッチスキャン ── */
      .ga-progress-bar {
        height: 6px; background: var(--border-light); border-radius: 3px;
        margin-top: 8px; overflow: hidden;
      }
      .ga-progress-fill {
        height: 100%; background: var(--gold); border-radius: 3px; transition: width 0.3s;
      }
      .ga-batch {
        background: var(--bg-card); border: 2px solid var(--gold-light);
        border-radius: var(--radius-md); padding: 20px; margin-bottom: 1.5rem;
      }
      .ga-batch-summary { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
      .ga-batch-card {
        border: 1px solid var(--border-light); border-radius: var(--radius-sm);
        padding: 12px; margin-bottom: 8px; background: var(--bg-page);
      }
      .ga-batch-err { border-color: #ef9a9a; background: #fff5f5; }
      .ga-batch-card-top { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
      .ga-batch-thumb {
        width: 56px; height: 56px; object-fit: cover; border-radius: 6px;
        border: 1px solid var(--border-light); flex-shrink: 0;
      }
      .ga-batch-card-info { flex: 1; min-width: 0; }
      .ga-batch-vendor { font-size: 14px; font-weight: 600; color: var(--text-primary); }
      .ga-batch-date { font-size: 12px; color: var(--text-tertiary); }
      .ga-batch-err-msg { font-size: 12px; color: #c62828; }
      .ga-batch-amount { font-size: 16px; font-weight: 700; color: var(--gold-dark); white-space: nowrap; }
      .ga-batch-card-actions { display: flex; gap: 8px; }
      .ga-batch-footer { display: flex; gap: 10px; margin-top: 12px; }
      .ga-batch-btn { background: #e3f2fd !important; color: #1565c0 !important; border-color: #90caf9 !important; }

      /* ── ボタン再利用 ── */
      .gr-btn-edit, .gr-btn-del {
        font-size: 11px; padding: 4px 10px; border: 1px solid var(--border-light);
        border-radius: 4px; cursor: pointer; background: var(--bg-card); color: var(--text-secondary);
        font-family: inherit; transition: all 0.15s;
      }
      .gr-btn-edit:hover { border-color: var(--gold); color: var(--gold-dark); }
      .gr-btn-del:hover { border-color: var(--accent-1); color: var(--accent-1); }
      .gr-form {
        background: var(--bg-card); border: 2px solid var(--gold-light);
        border-radius: var(--radius-md); padding: 20px; margin-bottom: 1.5rem; box-shadow: var(--shadow-md);
      }
      .gr-form-title { font-family: 'Noto Serif JP', serif; font-size: 16px; font-weight: 600; margin-bottom: 16px; }
      .gr-form-row { margin-bottom: 12px; }
      .gr-form-row label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
      .gr-form-row input[type="text"], .gr-form-row input[type="number"], .gr-form-row input[type="date"], .gr-form-row textarea {
        width: 100%; padding: 10px 12px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary); box-sizing: border-box;
      }
      .gr-form-row input:focus, .gr-form-row textarea:focus { border-color: var(--gold); outline: none; }
      .gr-form-actions { display: flex; gap: 10px; margin-top: 16px; }

      /* ── トースト ── */
      .ga-toast {
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: #333; color: #fff; padding: 10px 24px; border-radius: 8px;
        font-size: 14px; font-family: inherit; z-index: 9999;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        animation: gaToastIn 0.25s ease-out;
      }
      .ga-toast-hide { opacity: 0; transition: opacity 0.3s; }
      @keyframes gaToastIn { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

      /* ── 繰越金エリア ── */
      .ga-carry-forward {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); padding: 10px 16px; margin-bottom: 10px;
      }
      .ga-cf-display { display: flex; align-items: center; gap: 6px; }
      .ga-cf-label { font-size: 13px; color: var(--text-secondary); }
      .ga-cf-amount { font-size: 15px; font-weight: 700; color: var(--text-primary); }
      .ga-cf-edit-btn {
        background: none; border: none; cursor: pointer; font-size: 14px;
        color: var(--text-tertiary); padding: 2px 4px; transition: color 0.15s;
      }
      .ga-cf-edit-btn:hover { color: var(--gold-dark); }
      .ga-cf-form {
        display: flex; align-items: center; gap: 8px;
      }
      .ga-cf-form input {
        width: 160px; padding: 6px 10px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: var(--bg-page); color: var(--text-primary);
      }
      .ga-cf-save-btn { font-size: 12px !important; padding: 6px 14px !important; }
      .ga-cf-cancel-btn { font-size: 12px !important; padding: 6px 10px !important; }

      /* ── 残高推移テーブル ── */
      .ga-ledger-toggle { margin-bottom: 10px; }
      .ga-ledger-btn { font-size: 13px !important; }
      .ga-ledger {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); padding: 12px; margin-bottom: 1rem;
        overflow-x: auto;
      }
      .ga-ledger-table {
        width: 100%; border-collapse: collapse; font-size: 13px;
      }
      .ga-ledger-table th {
        text-align: left; padding: 6px 8px; border-bottom: 2px solid var(--border-medium);
        font-size: 11px; font-weight: 600; color: var(--text-tertiary);
        white-space: nowrap;
      }
      .ga-ledger-table td {
        padding: 6px 8px; border-bottom: 1px solid var(--border-light);
        white-space: nowrap;
      }
      .ga-ledger-right { text-align: right; }
      .ga-ledger-bal { font-weight: 600; color: var(--text-primary); }
      .ga-ledger-cf td { background: #f5f5f5; font-weight: 600; color: var(--text-secondary); }
      .ga-ledger-end td { background: var(--gold-soft); font-weight: 700; }

      /* ── モバイル対応 ── */
      @media (max-width: 480px) {
        .gr-form { padding: 14px; }
        .gr-form-row input, .gr-form-row select { font-size: 16px; }
        .ga-card { padding: 12px; }
        .ga-cta { flex-direction: column; }
        .ga-month-label { font-size: 16px; }
        .gaf-item-row { flex-wrap: wrap; }
        .gaf-item-name { flex: 1 1 100%; }
        .ga-batch { padding: 14px; }
        .ga-batch-card-top { flex-wrap: wrap; }
        .gaf-receipt-thumb { width: 64px; height: 64px; }
        .ga-ledger-table { font-size: 12px; }
        .ga-ledger-table th, .ga-ledger-table td { padding: 5px 6px; }
        .ga-cf-form { flex-wrap: wrap; }
        .ga-cf-form input { width: 120px; }
      }
    </style>`
  });
}
