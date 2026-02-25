// src/group_onboarding_page.js
// =========================================================
// 団体オンボーディング ウィザード — /jikabuki/onboarding
// チャット形式で質問に答えるだけで公式サイト＋ボットが完成
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupOnboardingPageHTML() {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki/base">BASE</a><span>&rsaquo;</span>新規団体登録
    </div>

    <section class="ob-hero fade-up">
      <div class="ob-hero-icon"><img src="https://kabukiplus.com/assets/keranosukelogo.png" alt="けらのすけ"></div>
      <h2 class="ob-hero-title">けらのすけが案内します</h2>
      <p class="ob-hero-desc">
        いくつかの質問に答えて申請するだけで、<br>
        <strong>GATE</strong>（団体公式サイト）が作成され、<br>
        <strong>BASE</strong>（稽古スケジュール管理・過去公演データベース・台本共有など）が使えるようになります。
      </p>
    </section>

    <div id="ob-group-select" class="ob-group-select fade-up-d1" style="display:none;"></div>

    <div id="ob-chat" class="ob-chat fade-up-d1" style="display:none;">
      <div id="ob-messages" class="ob-messages"></div>
      <div id="ob-input-area" class="ob-input-area">
        <input type="text" id="ob-input" class="ob-input" placeholder="ここに入力..." onkeydown="if(event.key==='Enter')OB.send()">
        <button class="ob-send-btn" onclick="OB.send()">送信</button>
        <button class="ob-skip-btn" id="ob-skip-btn" style="display:none;" onclick="OB.skip()">スキップ</button>
      </div>
    </div>

    <div id="ob-result" style="display:none;" class="ob-result fade-up"></div>

    <script>
    (function(){
      var currentUser = null;
      var allGroups = [];

      var steps = [
        { key: "manager_name", question: "こんにちは！けらのすけです。\\nまず、管理者（あなた）のお名前を教えてください。", placeholder: "例: 山田太郎" },
        { key: "contact_email", question: "連絡先のメールアドレスを教えてください。\\n承認のご連絡に使わせていただきます。", placeholder: "例: yamada@example.com" },
        { key: "name", question: "ありがとうございます！\\nでは、登録する団体名を教えてください。", placeholder: "例: 気良歌舞伎" },
        { key: "name_kana", question: "団体名のふりがな（読み方）をひらがなで教えてください。\\nURLの生成にも使わせていただきます。", placeholder: "例: けらかぶき" },
        { key: "prefecture", question: "団体のある都道府県を教えてください。", placeholder: "例: 岐阜県" },
        { key: "tagline", question: "素敵な名前ですね！\\n団体のキャッチフレーズを一言で教えてください。\\n（後でBASEから設定できます）", placeholder: "例: 素人歌舞伎の真髄がここにある", skippable: true },
        { key: "description", question: "団体の紹介文を教えてください。歴史や特徴など、自由に。\\n（後でBASEから設定できます）", placeholder: "団体の歴史や特徴...", skippable: true },
        { key: "venue_name", question: "公演会場の名前を教えてください。\\n（後でBASEから設定できます）", placeholder: "例: 気良座", skippable: true },
        { key: "venue_address", question: "会場の住所は？\\n（後でBASEから設定できます）", placeholder: "例: 岐阜県郡上市明宝気良", skippable: true },
        { key: "faq_about", question: "【よくある質問①】\\n「この団体はどんな団体ですか？」への回答を教えてください。\\n歴史・特徴・メンバー構成など何でも。\\n（後でBASEから設定できます）", placeholder: "例: 昭和〇年から続く地域の素人歌舞伎です。地元の農家や会社員が...", skippable: true },
        { key: "faq_ticket", question: "【よくある質問②】\\n「チケットは必要ですか？料金・予約方法は？」への回答を教えてください。\\n（後でBASEから設定できます）", placeholder: "例: 入場無料です。予約不要でどなたでもご覧いただけます。", skippable: true },
        { key: "faq_facility", question: "【よくある質問③】\\n「会場にトイレや駐車場はありますか？」への回答を教えてください。\\n（後でBASEから設定できます）", placeholder: "例: トイレあります。駐車場は〇台分ご用意しています。", skippable: true },
        { key: "faq_access", question: "【よくある質問④】\\n「会場へのアクセス方法を教えてください」への回答を教えてください。\\n（後でBASEから設定できます）", placeholder: "例: 車の場合は○○ICから約30分。公共交通は...", skippable: true },
      ];

      var activeSteps = steps;
      var currentStep = 0;
      var data = {};

      function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

      function addMessage(text, type) {
        var msgs = document.getElementById("ob-messages");
        var div = document.createElement("div");
        div.className = "ob-msg ob-msg-" + type;
        div.innerHTML = text.replace(/\\n/g, "<br>");
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
      }

      function showStep() {
        if (currentStep >= activeSteps.length) {
          finalize();
          return;
        }
        var step = activeSteps[currentStep];
        var skipBtn = document.getElementById("ob-skip-btn");
        if (skipBtn) skipBtn.style.display = step.skippable ? "" : "none";
        setTimeout(function(){
          addMessage(step.question, "bot");
          var inp = document.getElementById("ob-input");
          inp.placeholder = step.placeholder || "";
          inp.focus();
        }, 400);
      }

      function send() {
        var inp = document.getElementById("ob-input");
        var val = inp.value.trim();
        if (!val) return;
        inp.value = "";
        addMessage(val, "user");
        data[activeSteps[currentStep].key] = val;
        currentStep++;
        showStep();
      }

      function skip() {
        addMessage("（スキップ）", "user");
        data[activeSteps[currentStep].key] = "";
        currentStep++;
        showStep();
      }

      // ---- 団体選択UI ----

      var AREA_ORDER = ["北海道","東北","関東","中部","近畿","中国","四国","九州・沖縄","その他"];
      var PREF_TO_AREA = {
        "北海道":"北海道",
        "青森県":"東北","岩手県":"東北","宮城県":"東北","秋田県":"東北","山形県":"東北","福島県":"東北",
        "茨城県":"関東","栃木県":"関東","群馬県":"関東","埼玉県":"関東","千葉県":"関東","東京都":"関東","神奈川県":"関東",
        "新潟県":"中部","富山県":"中部","石川県":"中部","福井県":"中部","山梨県":"中部","長野県":"中部","岐阜県":"中部","静岡県":"中部","愛知県":"中部",
        "三重県":"近畿","滋賀県":"近畿","京都府":"近畿","大阪府":"近畿","兵庫県":"近畿","奈良県":"近畿","和歌山県":"近畿",
        "鳥取県":"中国","島根県":"中国","岡山県":"中国","広島県":"中国","山口県":"中国",
        "徳島県":"四国","香川県":"四国","愛媛県":"四国","高知県":"四国",
        "福岡県":"九州・沖縄","佐賀県":"九州・沖縄","長崎県":"九州・沖縄","熊本県":"九州・沖縄","大分県":"九州・沖縄","宮崎県":"九州・沖縄","鹿児島県":"九州・沖縄","沖縄県":"九州・沖縄"
      };

      function renderGroupSelect(groups) {
        var sel = document.getElementById("ob-group-select");
        if (!sel) return;

        var areaMap = {};
        groups.forEach(function(g) {
          var area = PREF_TO_AREA[g.prefecture] || "その他";
          if (!areaMap[area]) areaMap[area] = [];
          areaMap[area].push(g);
        });

        var html = '<div class="ob-sel-title">あなたの団体は一覧にありますか？</div>';
        html += '<p class="ob-sel-desc">地歌舞伎団体一覧に掲載中の団体はそのまま選択できます。</p>';

        AREA_ORDER.forEach(function(area) {
          var list = areaMap[area];
          if (!list || list.length === 0) return;
          html += '<div class="ob-area-label">' + esc(area) + '</div>';
          html += '<div class="ob-sel-list">';
          list.forEach(function(g) {
            if (g.gate_id) {
              html += '<div class="ob-group-card ob-group-done" data-gate="' + esc(g.gate_id) + '" data-name="' + esc(g.name) + '">'
                + '<div class="ob-group-card-inner">'
                + '<span class="ob-group-name">' + esc(g.name) + '</span>'
                + (g.prefecture ? '<span class="ob-group-pref">' + esc(g.prefecture) + '</span>' : '')
                + '</div>'
                + '<span class="ob-group-badge">✓ GATE作成済み</span>'
                + '</div>';
            } else {
              html += '<div class="ob-group-card ob-group-new" data-name="' + esc(g.name) + '" data-pref="' + esc(g.prefecture||"") + '" data-venue="' + esc(g.venue||"") + '">'
                + '<div class="ob-group-card-inner">'
                + '<span class="ob-group-name">' + esc(g.name) + '</span>'
                + (g.prefecture ? '<span class="ob-group-pref">' + esc(g.prefecture) + '</span>' : '')
                + '</div>'
                + '<span class="ob-group-arrow">→</span>'
                + '</div>';
            }
          });
          html += '</div>';
        });

        html += '<button class="ob-sel-new-btn" onclick="OB.startNew()">一覧にない／新規で登録する</button>';
        sel.innerHTML = html;
        sel.style.display = "";

        sel.querySelectorAll('.ob-group-done').forEach(function(el) {
          el.addEventListener('click', function() {
            showDoneMessage(el.getAttribute('data-gate'), el.getAttribute('data-name'));
          });
        });
        sel.querySelectorAll('.ob-group-new').forEach(function(el) {
          el.addEventListener('click', function() {
            startFromExisting(
              el.getAttribute('data-name'),
              el.getAttribute('data-pref'),
              el.getAttribute('data-venue')
            );
          });
        });
      }

      function showDoneMessage(gateId, name) {
        var sel = document.getElementById("ob-group-select");
        if (sel) sel.style.display = "none";
        var chat = document.getElementById("ob-chat");
        if (chat) chat.style.display = "";
        document.getElementById("ob-input-area").style.display = "none";
        addMessage(
          '「' + esc(name) + '」のGATEページはすでに作成されています。\\n' +
          '内容の編集はBASEから行えます。',
          "bot"
        );
        var resultDiv = document.getElementById("ob-result");
        resultDiv.style.display = "";
        resultDiv.innerHTML = '<div class="ob-result-card">'
          + '<div class="ob-result-title">✓ ' + esc(name) + ' のGATEは作成済みです</div>'
          + '<p class="ob-result-desc">団体情報・SNS・公演情報の編集・更新はBASEから行えます。</p>'
          + '<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px; justify-content:center;">'
          + '<a href="/jikabuki/base?group=' + esc(gateId) + '" class="btn btn-primary">BASEへ →</a>'
          + '<a href="/?brand=jikabuki" class="btn" style="border:1px solid #ddd5c8; background:#fff; color:#7a6f63;">トップに戻る</a>'
          + '</div></div>';
        resultDiv.scrollIntoView({ behavior: "smooth" });
      }

      function startFromExisting(name, pref, venue) {
        data.name = name;
        data.prefecture = pref || "";
        data.venue_name = venue || "";
        var skipKeys = { name: true, prefecture: true, venue_name: true };
        activeSteps = steps.filter(function(s) { return !skipKeys[s.key]; });
        if (activeSteps.length > 0 && activeSteps[0].key === "manager_name") {
          activeSteps = activeSteps.slice();
          activeSteps[0] = Object.assign({}, activeSteps[0], {
            question: '「' + name + '」での登録ですね。\\nまず、管理者（あなた）のお名前を教えてください。'
          });
        }
        currentStep = 0;
        var sel = document.getElementById("ob-group-select");
        if (sel) sel.style.display = "none";
        var chat = document.getElementById("ob-chat");
        if (chat) chat.style.display = "";
        showStep();
      }

      function startNew() {
        activeSteps = steps;
        currentStep = 0;
        var sel = document.getElementById("ob-group-select");
        if (sel) sel.style.display = "none";
        var chat = document.getElementById("ob-chat");
        if (chat) chat.style.display = "";
        showStep();
      }

      // ---- 申請送信 ----

      function finalize() {
        addMessage("ありがとうございます！\\n登録申請を送信しています...", "bot");
        document.getElementById("ob-input-area").style.display = "none";

        var groupData = {
          name: data.name || "",
          name_kana: data.name_kana || "",
          prefecture: data.prefecture || "",
          tagline: data.tagline || "",
          description: data.description || "",
          venue: {
            name: data.venue_name || "",
            address: data.venue_address || ""
          },
          contact: {},
          faq: [],
          performances: []
        };

        var faqMap = [
          { key: "faq_about",    category: "{団体名}について", q: "{団体名}はどんな団体ですか？" },
          { key: "faq_ticket",   category: "観劇の基本",       q: "チケットは必要ですか？料金・予約方法は？" },
          { key: "faq_facility", category: "会場・設備",       q: "会場にトイレや駐車場はありますか？" },
          { key: "faq_access",   category: "アクセス・駐車場", q: "会場へのアクセス方法を教えてください。" },
        ];
        faqMap.forEach(function(f) {
          var a = data[f.key];
          if (a && a !== "後で") {
            groupData.faq.push({ key: f.key, category: f.category, q: f.q, a: a });
          }
        });

        var requestBody = {
          managerName: data.manager_name || "",
          contactEmail: data.contact_email || "",
          groupData: groupData
        };

        fetch("/api/groups/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(requestBody)
        })
        .then(function(r){ return r.json(); })
        .then(function(result){
          if (result.ok) {
            setTimeout(function(){
              addMessage("申請を受け付けました！\\n管理者の承認をお待ちください。", "bot");
              var resultDiv = document.getElementById("ob-result");
              resultDiv.style.display = "";
              resultDiv.innerHTML = '<div class="ob-result-card">'
                + '<div class="ob-result-title">📩 ' + esc(data.name) + ' の登録申請を送信しました</div>'
                + '<p class="ob-result-desc">管理者が内容を確認し、承認いたします。<br>承認後、団体ページが公開されます。</p>'
                + '<div class="ob-result-summary">'
                + '<div class="ob-summary-row"><span class="ob-summary-label">管理者</span><span>' + esc(data.manager_name) + '</span></div>'
                + '<div class="ob-summary-row"><span class="ob-summary-label">連絡先</span><span>' + esc(data.contact_email) + '</span></div>'
                + '<div class="ob-summary-row"><span class="ob-summary-label">団体名</span><span>' + esc(data.name) + '</span></div>'
                + '<div class="ob-summary-row"><span class="ob-summary-label">都道府県</span><span>' + esc(data.prefecture) + '</span></div>'
                + '</div>'
                + '<div style="margin-top:16px; padding:14px 16px; background:#f5f0e8; border-radius:10px; font-size:13px; color:#7a6f63; line-height:1.7;">'
                + '💡 <strong>SNS・公演情報・詳細設定は承認後にBASEから編集できます。</strong><br>'
                + 'よくある質問の追加・修正もBASEのGATE編集から行えます。'
                + '</div>'
                + '<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">'
                + '<a href="/jikabuki/base" class="btn btn-primary">BASEへ →</a>'
                + '<a href="/?brand=jikabuki" class="btn" style="border:1px solid #ddd5c8; background:#fff; color:#7a6f63;">トップに戻る</a>'
                + '</div>'
                + '</div>';
              resultDiv.scrollIntoView({ behavior: "smooth" });
            }, 800);
          } else {
            addMessage("エラーが発生しました: " + (result.error || "不明"), "bot");
          }
        })
        .catch(function(e){
          addMessage("エラーが発生しました: " + e, "bot");
        });
      }

      // ---- 初期化 ----

      fetch('/api/auth/me', { credentials: 'same-origin' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.loggedIn && d.user) {
            currentUser = d.user;
            return fetch('/api/jikabuki/groups', { credentials: 'same-origin' })
              .then(function(r) { return r.json(); })
              .then(function(gd) {
                allGroups = gd.groups || [];
                if (allGroups.length > 0) {
                  renderGroupSelect(allGroups);
                } else {
                  startNew();
                }
              });
          } else {
            var chat = document.getElementById('ob-chat');
            if (chat) chat.style.display = "";
            var msgs = document.getElementById('ob-messages');
            msgs.innerHTML = '<div class="ob-msg ob-msg-bot">'
              + '団体登録にはログインが必要です。<br>'
              + '<button class="ob-send-btn" style="margin-top:8px" onclick="openLoginModal()">ログインする<\\/button>'
              + '<\\/div>';
            document.getElementById('ob-input-area').style.display = 'none';
          }
        })
        .catch(function() { startNew(); });

      window.OB = { send: send, skip: skip, startNew: startNew };
    })();
    </script>
  `;

  return pageShell({
    title: "新規団体登録",
    subtitle: "質問に答えるだけで公式サイト完成",
    bodyHTML,
    activeNav: "base",
    brand: "jikabuki",
    headExtra: `<style>
      .ob-hero {
        text-align: center; padding: 1.5rem 1rem 2rem;
        border-bottom: 1px solid var(--border-light); margin-bottom: 1.5rem;
      }
      .ob-hero-icon { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; margin: 0 auto 12px; border: 2px solid var(--border-light); box-shadow: var(--shadow-sm); }
      .ob-hero-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .ob-hero-title {
        font-family: 'Noto Serif JP', serif; font-size: 1.2rem;
        font-weight: 700; letter-spacing: 0.1em; margin-bottom: 8px;
      }
      .ob-hero-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.8; }

      /* 団体選択UI */
      .ob-group-select {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); padding: 24px; margin-bottom: 1.5rem;
        box-shadow: var(--shadow-md);
      }
      .ob-sel-title {
        font-family: 'Noto Serif JP', serif; font-size: 1rem;
        font-weight: 700; margin-bottom: 6px; color: var(--text-primary);
      }
      .ob-sel-desc {
        font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;
      }
      .ob-area-label {
        font-size: 11px; font-weight: 700; color: var(--text-secondary);
        letter-spacing: 0.08em; text-transform: uppercase;
        padding: 10px 0 4px; border-bottom: 1px solid var(--border-light);
        margin-bottom: 6px;
      }
      .ob-sel-list {
        display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;
      }
      .ob-group-card {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 16px; border: 1px solid var(--border-light);
        border-radius: var(--radius-sm); cursor: pointer;
        transition: all 0.15s; background: var(--bg-page);
      }
      .ob-group-card-inner {
        display: flex; align-items: center; gap: 10px; flex: 1;
      }
      .ob-group-name {
        font-size: 14px; font-weight: 600; color: var(--text-primary);
      }
      .ob-group-pref {
        font-size: 12px; color: var(--text-secondary);
        background: var(--bg-subtle); padding: 2px 8px;
        border-radius: 20px; white-space: nowrap;
      }
      .ob-group-new:hover {
        border-color: var(--gold); background: var(--gold-soft);
      }
      .ob-group-arrow {
        font-size: 14px; color: var(--gold-dark); font-weight: 600;
      }
      .ob-group-done {
        opacity: 0.75; cursor: default;
        background: var(--bg-subtle);
      }
      .ob-group-done:hover {
        border-color: #b5c9a3; background: #f0f5ec;
        opacity: 1;
      }
      .ob-group-badge {
        font-size: 11px; font-weight: 600; color: #5a8a4a;
        background: #e8f5e2; padding: 3px 10px;
        border-radius: 20px; white-space: nowrap;
      }
      .ob-sel-new-btn {
        width: 100%; padding: 12px; border: 2px dashed var(--border-medium);
        border-radius: var(--radius-sm); background: transparent;
        color: var(--text-secondary); font-size: 14px; font-family: inherit;
        cursor: pointer; transition: all 0.15s;
      }
      .ob-sel-new-btn:hover {
        border-color: var(--gold); color: var(--gold-dark);
        background: var(--gold-soft);
      }

      /* チャットUI */
      .ob-chat {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-md);
        max-height: 500px; display: flex; flex-direction: column;
      }
      .ob-messages {
        flex: 1; overflow-y: auto; padding: 16px; min-height: 200px;
        display: flex; flex-direction: column; gap: 10px;
      }
      .ob-msg {
        max-width: 80%; padding: 10px 14px; border-radius: 12px;
        font-size: 14px; line-height: 1.7;
      }
      .ob-msg-bot {
        align-self: flex-start;
        background: var(--bg-subtle); color: var(--text-primary);
        border-bottom-left-radius: 4px;
      }
      .ob-msg-user {
        align-self: flex-end;
        background: var(--gold); color: white;
        border-bottom-right-radius: 4px;
      }
      .ob-input-area {
        display: flex; gap: 8px; padding: 12px 16px;
        border-top: 1px solid var(--border-light);
        background: var(--bg-page);
      }
      .ob-input {
        flex: 1; padding: 10px 14px; border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm); font-size: 14px; font-family: inherit;
        background: white; color: var(--text-primary); outline: none;
      }
      .ob-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(197,162,85,0.1); }
      .ob-send-btn {
        padding: 10px 18px; background: var(--gold); color: white;
        border: none; border-radius: var(--radius-sm); font-size: 14px;
        font-family: inherit; font-weight: 600; cursor: pointer;
        transition: background 0.15s;
      }
      .ob-send-btn:hover { background: var(--gold-dark); }
      .ob-skip-btn {
        padding: 10px 14px; background: transparent; color: var(--text-secondary);
        border: 1px solid var(--border-medium); border-radius: var(--radius-sm);
        font-size: 13px; font-family: inherit; cursor: pointer;
        transition: all 0.15s; white-space: nowrap;
      }
      .ob-skip-btn:hover { border-color: var(--gold); color: var(--gold-dark); background: var(--gold-soft); }

      .ob-result { margin-top: 1.5rem; }
      .ob-result-card {
        background: var(--bg-card); border: 2px solid var(--gold-light);
        border-radius: var(--radius-md); padding: 24px; text-align: center;
        box-shadow: var(--shadow-md);
      }
      .ob-result-title {
        font-family: 'Noto Serif JP', serif; font-size: 18px;
        font-weight: 700; margin-bottom: 8px;
      }
      .ob-result-desc { font-size: 14px; color: var(--text-secondary); }
      .ob-result-links {
        display: flex; flex-direction: column; gap: 8px;
        margin-top: 16px; padding-top: 16px;
        border-top: 1px solid var(--border-light);
      }
      .ob-result-links a {
        font-size: 13px; color: var(--gold-dark); padding: 8px;
        border: 1px solid var(--border-light); border-radius: var(--radius-sm);
        text-decoration: none; transition: all 0.15s;
      }
      .ob-result-links a:hover { border-color: var(--gold); background: var(--gold-soft); text-decoration: none; }

      .ob-result-summary {
        margin-top: 16px; padding: 12px 16px;
        background: var(--bg-subtle); border-radius: var(--radius-sm);
        text-align: left;
      }
      .ob-summary-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 0; font-size: 13px; border-bottom: 1px solid var(--border-light);
      }
      .ob-summary-row:last-child { border-bottom: none; }
      .ob-summary-label {
        font-weight: 600; color: var(--text-secondary); min-width: 80px;
      }
    </style>`
  });
}
