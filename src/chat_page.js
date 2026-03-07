// src/chat_page.js
// =========================================================
// けらのすけに聞く — Web AIチャットページ /kabuki/chat
// LINE Bot と同じ keraAIv2 パイプラインをWebで提供
// =========================================================
import { pageShell } from "./web_layout.js";

export function chatPageHTML({ googleClientId = "" } = {}) {
  const bodyHTML = `
    <div id="chat-container" class="chat-container">
      <div id="chat-messages" class="chat-messages">
        <!-- messages inserted here -->
      </div>

      <div id="chat-suggestions" class="chat-suggestions fade-up">
        <p class="chat-suggest-label">こんなことを聞いてみよう</p>
        <div class="chat-suggest-chips">
          <button class="chat-chip" data-q="忠臣蔵ってどんな話？">忠臣蔵ってどんな話？</button>
          <button class="chat-chip" data-q="初心者におすすめの演目は？">初心者におすすめの演目は？</button>
          <button class="chat-chip" data-q="花道ってなに？">花道ってなに？</button>
          <button class="chat-chip" data-q="今月の公演情報">今月の公演情報</button>
        </div>
      </div>
    </div>

    <div class="chat-input-area" id="chat-input-area">
      <form id="chat-form" class="chat-form" autocomplete="off">
        <div class="chat-input-row">
          <textarea id="chat-input" class="chat-input" rows="1" maxlength="500"
            placeholder="歌舞伎について何でも聞いてね" enterkeyhint="send"></textarea>
          <button type="submit" id="chat-send" class="chat-send-btn" disabled aria-label="送信">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </form>
      <div class="chat-toolbar">
        <button id="chat-reset" class="chat-toolbar-btn" title="話題を変える">🔄 話題を変える</button>
      </div>
    </div>
  `;

  return pageShell({
    title: "けらのすけに聞く",
    subtitle: "AIチャット",
    bodyHTML,
    hideNav: true,
    googleClientId,
    ogDesc: "歌舞伎AIアシスタント「けらのすけ」に何でも聞いてみよう。演目・用語・公演情報をわかりやすく回答します。",
    ogImage: "https://kabukiplus.com/assets/ogp/ogp_navi.png",
    headExtra: `<style>
      /* ── チャットコンテナ ── */
      .chat-container {
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 340px);
      }

      /* ── メッセージエリア ── */
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* ── 吹き出し共通 ── */
      .chat-bubble {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.75;
        word-break: break-word;
        animation: fadeUp 0.25s ease both;
      }

      /* ── ユーザーの吹き出し ── */
      .chat-bubble-user {
        align-self: flex-end;
        background: linear-gradient(135deg, var(--gold), var(--gold-dark));
        color: #fff;
        border-bottom-right-radius: 4px;
      }

      /* ── AIの吹き出しラッパー ── */
      .chat-ai-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        align-self: flex-start;
        max-width: 90%;
        animation: fadeUp 0.25s ease both;
      }
      .chat-ai-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid var(--gold-light);
        flex-shrink: 0;
        object-fit: cover;
        margin-top: 2px;
      }
      .chat-bubble-ai {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        box-shadow: var(--shadow-sm);
        padding: 12px 16px;
        font-size: 14px;
        line-height: 1.75;
        word-break: break-word;
        flex: 1;
        min-width: 0;
      }
      .chat-bubble-ai .chat-ai-name {
        font-size: 11px;
        font-weight: 600;
        color: var(--gold-dark);
        margin-bottom: 4px;
        letter-spacing: 0.5px;
      }

      /* ── ウェルカム ── */
      .chat-welcome {
        text-align: center;
        padding: 20px 16px;
      }
      .chat-welcome-icon {
        margin-bottom: 8px;
      }
      .chat-welcome-icon img {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        border: 3px solid var(--gold-light);
        object-fit: cover;
      }
      .chat-welcome-title {
        font-family: 'Noto Serif JP', serif;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 6px;
      }
      .chat-welcome-desc {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.7;
      }

      /* ── タイピングインジケーター ── */
      .chat-typing-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        align-self: flex-start;
        animation: fadeUp 0.25s ease both;
      }
      .chat-typing {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 12px 16px;
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        box-shadow: var(--shadow-sm);
      }
      .chat-typing-dot {
        width: 8px;
        height: 8px;
        background: var(--gold);
        border-radius: 50%;
        animation: typingBounce 1.2s ease infinite;
      }
      .chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typingBounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30% { transform: translateY(-6px); opacity: 1; }
      }

      /* ── サジェストチップス ── */
      .chat-suggestions {
        text-align: center;
        padding: 12px 0;
      }
      .chat-suggest-label {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-bottom: 10px;
      }
      .chat-suggest-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
      }
      .chat-chip {
        background: var(--bg-card);
        border: 1px solid var(--border-medium);
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 13px;
        color: var(--gold-dark);
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .chat-chip:hover {
        background: var(--gold-soft);
        border-color: var(--gold);
        transform: translateY(-1px);
      }

      /* ── 入力エリア ── */
      .chat-input-area {
        position: sticky;
        bottom: calc(56px + env(safe-area-inset-bottom, 0px));
        background: var(--bg-page);
        border-top: 1px solid var(--border-light);
        padding: 10px 0 6px;
        z-index: 10;
      }
      .chat-form {
        margin: 0;
      }
      .chat-input-row {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }
      .chat-input {
        flex: 1;
        resize: none;
        border: 1px solid var(--border-medium);
        border-radius: 20px;
        padding: 10px 16px;
        font-size: 14px;
        font-family: inherit;
        line-height: 1.5;
        background: var(--bg-card);
        color: var(--text-primary);
        outline: none;
        max-height: 120px;
        overflow-y: auto;
        transition: border-color 0.2s;
      }
      .chat-input:focus {
        border-color: var(--gold);
        box-shadow: 0 0 0 3px rgba(197,162,85,0.1);
      }
      .chat-send-btn {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--gold), var(--gold-dark));
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.15s, transform 0.15s;
      }
      .chat-send-btn:disabled {
        opacity: 0.4;
        cursor: default;
      }
      .chat-send-btn:not(:disabled):hover {
        transform: scale(1.05);
      }

      /* ── ツールバー ── */
      .chat-toolbar {
        display: flex;
        justify-content: center;
        padding-top: 4px;
      }
      .chat-toolbar-btn {
        background: none;
        border: none;
        font-size: 12px;
        color: var(--text-tertiary);
        cursor: pointer;
        font-family: inherit;
        padding: 4px 12px;
        border-radius: 12px;
        transition: color 0.15s, background 0.15s;
      }
      .chat-toolbar-btn:hover {
        color: var(--gold-dark);
        background: var(--gold-soft);
      }

      /* ── エラーメッセージ ── */
      .chat-error {
        font-size: 12px;
        color: var(--accent-1);
        text-align: center;
        padding: 8px;
      }
    </style>
    <script>
    document.addEventListener('DOMContentLoaded', function(){
      // ── セッションID管理 ──
      function getSessionId() {
        var sid = localStorage.getItem('kabuki_chat_session_id');
        if (sid) return sid;
        sid = 'web_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('kabuki_chat_session_id', sid);
        return sid;
      }
      var sessionId = getSessionId();

      // ── DOM参照 ──
      var messagesEl = document.getElementById('chat-messages');
      var suggestionsEl = document.getElementById('chat-suggestions');
      var formEl = document.getElementById('chat-form');
      var inputEl = document.getElementById('chat-input');
      var sendBtn = document.getElementById('chat-send');
      var resetBtn = document.getElementById('chat-reset');
      var sending = false;
      var AVATAR_URL = 'https://kabukiplus.com/assets/keranosukelogo.png';

      // ── ウェルカムメッセージ ──
      function showWelcome() {
        var w = document.createElement('div');
        w.className = 'chat-welcome fade-up';
        w.innerHTML = '<div class="chat-welcome-icon"><img src="' + AVATAR_URL + '" alt="けらのすけ" width="72" height="72"></div>'
          + '<div class="chat-welcome-title">けらのすけだよ！</div>'
          + '<div class="chat-welcome-desc">歌舞伎のことなら何でも聞いてね。<br>演目のあらすじ、用語の意味、公演情報など<br>わかる範囲でお答えするよ。</div>';
        messagesEl.appendChild(w);
        suggestionsEl.style.display = '';
      }

      // ── 吹き出し追加 ──
      function addUserBubble(text) {
        var d = document.createElement('div');
        d.className = 'chat-bubble chat-bubble-user';
        d.textContent = text;
        messagesEl.appendChild(d);
        scrollToBottom();
      }
      function addAIBubble(text) {
        var row = document.createElement('div');
        row.className = 'chat-ai-row';
        row.innerHTML = '<img src="' + AVATAR_URL + '" alt="" class="chat-ai-avatar" width="36" height="36">'
          + '<div class="chat-bubble-ai"><div class="chat-ai-name">けらのすけ</div><div class="chat-ai-text"></div></div>';
        row.querySelector('.chat-ai-text').textContent = text;
        messagesEl.appendChild(row);
        scrollToBottom();
      }

      // ── タイピングインジケーター ──
      function showTyping() {
        var row = document.createElement('div');
        row.className = 'chat-typing-row';
        row.id = 'chat-typing';
        row.innerHTML = '<img src="' + AVATAR_URL + '" alt="" class="chat-ai-avatar" width="36" height="36">'
          + '<div class="chat-typing"><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div></div>';
        messagesEl.appendChild(row);
        scrollToBottom();
      }
      function hideTyping() {
        var t = document.getElementById('chat-typing');
        if (t) t.remove();
      }

      // ── エラー表示 ──
      function showError(msg) {
        var d = document.createElement('div');
        d.className = 'chat-error';
        d.textContent = msg;
        messagesEl.appendChild(d);
        scrollToBottom();
      }

      // ── スクロール ──
      function scrollToBottom() {
        setTimeout(function(){ messagesEl.scrollTop = messagesEl.scrollHeight; }, 50);
      }

      // ── 履歴復元 ──
      function loadHistory() {
        fetch('/api/chat/history?sessionId=' + encodeURIComponent(sessionId))
          .then(function(r){ return r.json(); })
          .then(function(data){
            if (data.history && data.history.length > 0) {
              suggestionsEl.style.display = 'none';
              for (var i = 0; i < data.history.length; i++) {
                var m = data.history[i];
                if (m.role === 'user') addUserBubble(m.content);
                else if (m.role === 'assistant') addAIBubble(m.content);
              }
            } else {
              showWelcome();
            }
          })
          .catch(function(){
            showWelcome();
          });
      }

      // ── メッセージ送信 ──
      function sendMessage(text) {
        if (sending || !text.trim()) return;
        sending = true;
        sendBtn.disabled = true;
        inputEl.value = '';
        inputEl.style.height = 'auto';
        suggestionsEl.style.display = 'none';

        // ウェルカム表示を消す
        var w = messagesEl.querySelector('.chat-welcome');
        if (w) w.remove();

        addUserBubble(text.trim());
        showTyping();

        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim(), sessionId: sessionId })
        })
        .then(function(r){ return r.json(); })
        .then(function(data){
          hideTyping();
          if (data.reply) {
            addAIBubble(data.reply);
          } else if (data.error) {
            showError(data.error);
          } else {
            showError('回答を取得できませんでした。もう一度お試しください。');
          }
        })
        .catch(function(){
          hideTyping();
          showError('通信エラーが発生しました。もう一度お試しください。');
        })
        .finally(function(){
          sending = false;
          updateSendBtn();
          inputEl.focus();
        });
      }

      // ── リセット ──
      function resetChat() {
        if (sending) return;
        fetch('/api/chat/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionId })
        }).catch(function(){});
        messagesEl.innerHTML = '';
        showWelcome();
      }

      // ── 入力制御 ──
      function updateSendBtn() {
        sendBtn.disabled = sending || !inputEl.value.trim();
      }

      // textarea 自動リサイズ
      inputEl.addEventListener('input', function(){
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        updateSendBtn();
      });

      // Enter で送信 (Shift+Enter は改行)
      inputEl.addEventListener('keydown', function(e){
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (!sendBtn.disabled) sendMessage(inputEl.value);
        }
      });

      // フォームsubmit
      formEl.addEventListener('submit', function(e){
        e.preventDefault();
        if (!sendBtn.disabled) sendMessage(inputEl.value);
      });

      // サジェストチップ
      var chips = document.querySelectorAll('.chat-chip');
      for (var i = 0; i < chips.length; i++) {
        chips[i].addEventListener('click', function(){
          sendMessage(this.getAttribute('data-q'));
        });
      }

      // リセットボタン
      resetBtn.addEventListener('click', resetChat);

      // ── 初期化 ──
      loadHistory();
    });
    <\/script>`
  });
}
