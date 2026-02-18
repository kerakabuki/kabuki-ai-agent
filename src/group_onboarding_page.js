// src/group_onboarding_page.js
// =========================================================
// 団体オンボーディング ウィザード — /jikabuki/onboarding
// チャット形式で質問に答えるだけで公式サイト＋ボットが完成
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupOnboardingPageHTML() {
  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki">JIKABUKI PLUS+</a><span>&rsaquo;</span>新規団体登録
    </div>

    <section class="ob-hero fade-up">
      <div class="ob-hero-icon">🤖</div>
      <h2 class="ob-hero-title">けらのすけが案内します</h2>
      <p class="ob-hero-desc">
        いくつかの質問に答えるだけで、<br>
        あなたの団体の公式サイトとチャットボットが自動生成されます。
      </p>
    </section>

    <div id="ob-chat" class="ob-chat fade-up-d1">
      <div id="ob-messages" class="ob-messages"></div>
      <div id="ob-input-area" class="ob-input-area">
        <input type="text" id="ob-input" class="ob-input" placeholder="ここに入力..." onkeydown="if(event.key==='Enter')OB.send()">
        <button class="ob-send-btn" onclick="OB.send()">送信</button>
      </div>
    </div>

    <div id="ob-result" style="display:none;" class="ob-result fade-up"></div>

    <script>
    (function(){
      var steps = [
        { key: "name", question: "こんにちは！けらのすけです。\\nまず、団体名を教えてください。", placeholder: "例: 気良歌舞伎" },
        { key: "name_kana", question: "ありがとう！\\n団体名のフリガナ（読み方）をひらがなで教えてください。\\nURLの生成にも使わせていただきます。", placeholder: "例: けらかぶき" },
        { key: "tagline", question: "素敵な名前ですね！\\n団体のキャッチフレーズを一言で教えてください。", placeholder: "例: 素人歌舞伎の真髄がここにある" },
        { key: "description", question: "ありがとう！\\n団体の紹介文を教えてください。歴史や特徴など、自由に。", placeholder: "団体の歴史や特徴..." },
        { key: "venue_name", question: "いいですね！\\n公演会場の名前を教えてください。", placeholder: "例: 気良座" },
        { key: "venue_address", question: "会場の住所は？", placeholder: "例: 岐阜県郡上市明宝気良" },
        { key: "contact_instagram", question: "InstagramのURLがあれば教えてください。なければ「なし」で。", placeholder: "https://www.instagram.com/..." },
        { key: "faq1_q", question: "よくある質問を1つ登録しましょう。\\n質問を入力してください。", placeholder: "例: チケットはどうやって買えますか？" },
        { key: "faq1_a", question: "その質問に対する回答は？", placeholder: "回答を入力..." },
      ];

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
        if (currentStep >= steps.length) {
          finalize();
          return;
        }
        var step = steps[currentStep];
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
        data[steps[currentStep].key] = val;
        currentStep++;
        showStep();
      }

      function finalize() {
        addMessage("ありがとうございます！\\n公式サイトを生成しています...", "bot");
        document.getElementById("ob-input-area").style.display = "none";

        var kanaToRomaji = function(s) {
          var map = {
            "あ":"a","い":"i","う":"u","え":"e","お":"o",
            "か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko",
            "さ":"sa","し":"shi","す":"su","せ":"se","そ":"so",
            "た":"ta","ち":"chi","つ":"tsu","て":"te","と":"to",
            "な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no",
            "は":"ha","ひ":"hi","ふ":"fu","へ":"he","ほ":"ho",
            "ま":"ma","み":"mi","む":"mu","め":"me","も":"mo",
            "や":"ya","ゆ":"yu","よ":"yo",
            "ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro",
            "わ":"wa","を":"wo","ん":"n",
            "が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go",
            "ざ":"za","じ":"ji","ず":"zu","ぜ":"ze","ぞ":"zo",
            "だ":"da","ぢ":"di","づ":"du","で":"de","ど":"do",
            "ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo",
            "ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po",
            "きゃ":"kya","きゅ":"kyu","きょ":"kyo",
            "しゃ":"sha","しゅ":"shu","しょ":"sho",
            "ちゃ":"cha","ちゅ":"chu","ちょ":"cho",
            "にゃ":"nya","にゅ":"nyu","にょ":"nyo",
            "ひゃ":"hya","ひゅ":"hyu","ひょ":"hyo",
            "みゃ":"mya","みゅ":"myu","みょ":"myo",
            "りゃ":"rya","りゅ":"ryu","りょ":"ryo",
            "ぎゃ":"gya","ぎゅ":"gyu","ぎょ":"gyo",
            "じゃ":"ja","じゅ":"ju","じょ":"jo",
            "びゃ":"bya","びゅ":"byu","びょ":"byo",
            "ぴゃ":"pya","ぴゅ":"pyu","ぴょ":"pyo",
            "ー":"","っ":"xtu"
          };
          var result = "";
          for (var i = 0; i < s.length; i++) {
            var two = s.substring(i, i+2);
            if (map[two]) { result += map[two]; i++; }
            else if (map[s[i]]) { result += map[s[i]]; }
            else if (/[a-z0-9]/.test(s[i])) { result += s[i]; }
          }
          if (result.indexOf("xtu") >= 0) {
            result = result.replace(/xtu(.)/g, function(m, c){ return c + c; });
          }
          return result;
        };

        var groupId = data.name_kana
          ? kanaToRomaji(data.name_kana.toLowerCase()).replace(/[^a-z0-9]/g, "").slice(0, 20)
          : (data.name || "group").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
        if (!groupId) groupId = "g" + Date.now().toString(36);

        var group = {
          group_id: groupId,
          name: data.name || "",
          name_kana: data.name_kana || "",
          tagline: data.tagline || "",
          description: data.description || "",
          venue: {
            name: data.venue_name || "",
            address: data.venue_address || ""
          },
          contact: {},
          faq: [],
          performances: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (data.contact_instagram && data.contact_instagram !== "なし") {
          group.contact.instagram = data.contact_instagram;
        }
        if (data.faq1_q && data.faq1_a) {
          group.faq.push({ q: data.faq1_q, a: data.faq1_a });
        }

        fetch("/api/groups/" + groupId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(group)
        })
        .then(function(r){ return r.json(); })
        .then(function(result){
          if (result.ok) {
            setTimeout(function(){
              addMessage("公式サイトが完成しました！🎉", "bot");
              var resultDiv = document.getElementById("ob-result");
              resultDiv.style.display = "";
              resultDiv.innerHTML = '<div class="ob-result-card">'
                + '<div class="ob-result-title">🎉 ' + esc(data.name) + ' の公式サイトが完成！</div>'
                + '<p class="ob-result-desc">以下のURLでアクセスできます。</p>'
                + '<a href="/groups/' + groupId + '" class="btn btn-primary" style="margin-top:12px;">公式サイトを見る &rarr;</a>'
                + '<div class="ob-result-links">'
                + '<a href="/groups/' + groupId + '/records">公演記録を追加する</a>'
                + '<a href="/groups/' + groupId + '/notes">稽古メモを作成する</a>'
                + '<a href="/groups/' + groupId + '/training">稽古モードを試す</a>'
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

      window.OB = { send: send };
      showStep();
    })();
    </script>
  `;

  return pageShell({
    title: "新規団体登録",
    subtitle: "質問に答えるだけで公式サイト完成",
    bodyHTML,
    activeNav: "jikabuki",
    brand: "jikabuki",
    headExtra: `<style>
      .ob-hero {
        text-align: center; padding: 1.5rem 1rem 2rem;
        border-bottom: 1px solid var(--border-light); margin-bottom: 1.5rem;
      }
      .ob-hero-icon { font-size: 40px; margin-bottom: 8px; }
      .ob-hero-title {
        font-family: 'Noto Serif JP', serif; font-size: 1.2rem;
        font-weight: 700; letter-spacing: 0.1em; margin-bottom: 8px;
      }
      .ob-hero-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.8; }

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
    </style>`
  });
}
