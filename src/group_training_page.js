// src/group_training_page.js
// =========================================================
// 稽古モード【実践版】— /groups/:groupId/training
// 団体固有の稽古素材に対応した実践的な稽古モード
// =========================================================
import { pageShell, escHTML } from "./web_layout.js";

export function groupTrainingPageHTML(group) {
  if (!group) {
    return pageShell({
      title: "団体が見つかりません",
      bodyHTML: `<div class="empty-state">指定された団体は登録されていません。</div>`,
      brand: "jikabuki",
      activeNav: "jikabuki",
    });
  }

  const g = group;
  const name = escHTML(g.name || "");
  const gid = escHTML(g.group_id || "");

  const bodyHTML = `
    <div class="breadcrumb">
      <a href="/">トップ</a><span>&rsaquo;</span><a href="/jikabuki">JIKABUKI PLUS+</a><span>&rsaquo;</span><a href="/groups/${gid}">${name}</a><span>&rsaquo;</span>稽古モード
    </div>

    <section class="gt-hero fade-up">
      <div class="gt-hero-icon">🎤</div>
      <h2 class="gt-hero-title">稽古モード【実践版】</h2>
      <p class="gt-hero-desc">
        自分の役の台詞を集中的に練習。<br>
        台本・動画と連動した実践的な稽古ができます。
      </p>
    </section>

    <section class="gt-section fade-up-d1">
      <h2 class="section-title">稽古メニュー</h2>
      <div class="gt-menu">
        <a href="/groups/${gid}/scripts" class="gt-menu-card">
          <div class="gt-menu-icon">📖</div>
          <div class="gt-menu-body">
            <h3>台本で稽古</h3>
            <p>デジタル台本を開き、自分の役をハイライト表示して練習</p>
          </div>
          <span class="gt-menu-arrow">&rarr;</span>
        </a>
        <a href="/kabuki/dojo/training/serifu" class="gt-menu-card">
          <div class="gt-menu-icon">🗣️</div>
          <div class="gt-menu-body">
            <h3>台詞稽古チャレンジ</h3>
            <p>名台詞をカラオケ感覚で体験（体験版）</p>
          </div>
          <span class="gt-menu-arrow">&rarr;</span>
        </a>
        <a href="/kabuki/dojo/training/kakegoe" class="gt-menu-card">
          <div class="gt-menu-icon">📢</div>
          <div class="gt-menu-body">
            <h3>大向う道場</h3>
            <p>掛け声タイミングを音ゲー風に練習（体験版）</p>
          </div>
          <span class="gt-menu-arrow">&rarr;</span>
        </a>
        <a href="/groups/${gid}/notes" class="gt-menu-card">
          <div class="gt-menu-icon">📝</div>
          <div class="gt-menu-body">
            <h3>稽古メモ</h3>
            <p>気づきの記録＋参考動画リンク</p>
          </div>
          <span class="gt-menu-arrow">&rarr;</span>
        </a>
      </div>
    </section>

    <section class="gt-section fade-up-d2">
      <h2 class="section-title">参考動画</h2>
      <p class="gt-ref-desc">過去の公演動画やお手本動画を参考に稽古できます。</p>
      <div class="gt-ref-list" id="gt-ref-videos">
        <div class="loading">読み込み中...</div>
      </div>
    </section>

    <script>
    (function(){
      var GID = "${gid}";
      fetch("/api/groups/" + GID + "/notes")
        .then(function(r){ return r.json(); })
        .then(function(data){
          var notes = data.notes || [];
          var videos = notes.filter(function(n){ return n.video_url; });
          var el = document.getElementById("gt-ref-videos");
          if (!videos.length) {
            el.innerHTML = '<div class="empty-state">参考動画はまだ登録されていません。<br>稽古メモに動画URLを登録すると、ここに表示されます。</div>';
            return;
          }
          el.innerHTML = videos.slice(0,6).map(function(n){
            var m = (n.video_url||"").match(/(?:youtube\\.com\\/watch\\?v=|youtu\\.be\\/)([\\w-]+)/);
            if (m) {
              return '<div class="gt-ref-card">'
                + '<div class="gt-ref-thumb"><iframe src="https://www.youtube.com/embed/' + m[1] + '" frameborder="0" allowfullscreen></iframe></div>'
                + '<div class="gt-ref-tags">' + (n.tags||[]).map(function(t){ return '<span class="gn-card-tag">' + t.replace(/</g,"&lt;") + '</span>'; }).join("") + '</div>'
                + '</div>';
            }
            return '<a href="' + (n.video_url||"").replace(/"/g,"&quot;") + '" target="_blank" class="gt-ref-link">🔗 ' + (n.tags||[]).join(", ") + '</a>';
          }).join("");
        })
        .catch(function(){ document.getElementById("gt-ref-videos").innerHTML = '<div class="empty-state">読み込みに失敗しました。</div>'; });
    })();
    </script>

    <div class="gt-footer fade-up-d3">
      <a href="/groups/${gid}" class="btn btn-secondary">&larr; ${name} トップに戻る</a>
    </div>
  `;

  return pageShell({
    title: `稽古モード - ${g.name}`,
    subtitle: "自分の役の台詞稽古・台本/動画連動",
    bodyHTML,
    activeNav: "jikabuki",
    brand: "jikabuki",
    headExtra: `<style>
      .gt-hero {
        text-align: center; padding: 2rem 1rem;
        border-bottom: 1px solid var(--border-light); margin-bottom: 2rem;
      }
      .gt-hero-icon { font-size: 40px; margin-bottom: 8px; }
      .gt-hero-title {
        font-family: 'Noto Serif JP', serif; font-size: 1.3rem;
        font-weight: 700; color: var(--accent-1); letter-spacing: 0.1em; margin-bottom: 8px;
      }
      .gt-hero-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.8; }
      .gt-section { margin-bottom: 2rem; }
      .gt-menu { display: flex; flex-direction: column; gap: 10px; }
      .gt-menu-card {
        display: flex; align-items: center; gap: 14px; padding: 16px 18px;
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); text-decoration: none; color: var(--text-primary);
        transition: all 0.15s; box-shadow: var(--shadow-sm);
      }
      .gt-menu-card:hover { border-color: var(--gold); box-shadow: var(--shadow-md); text-decoration: none; }
      .gt-menu-icon {
        width: 40px; height: 40px; border-radius: 8px; display: flex;
        align-items: center; justify-content: center; font-size: 20px;
        flex-shrink: 0; background: var(--bg-subtle);
      }
      .gt-menu-body { flex: 1; min-width: 0; }
      .gt-menu-body h3 { font-family: 'Noto Serif JP', serif; font-size: 15px; font-weight: 600; margin-bottom: 2px; }
      .gt-menu-body p { font-size: 12px; color: var(--text-secondary); }
      .gt-menu-arrow { color: var(--text-tertiary); font-size: 16px; margin-left: auto; flex-shrink: 0; }
      .gt-ref-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 1rem; }
      .gt-ref-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 12px; }
      .gt-ref-card {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm);
      }
      .gt-ref-thumb { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; }
      .gt-ref-thumb iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
      .gt-ref-tags { padding: 8px 10px; display: flex; flex-wrap: wrap; gap: 4px; }
      .gn-card-tag { font-size: 10px; padding: 2px 8px; background: var(--gold-soft); color: var(--gold-dark); border-radius: 4px; }
      .gt-ref-link { display: block; padding: 12px; font-size: 13px; color: var(--gold-dark); text-decoration: none; }
      .gt-footer { text-align: center; padding-top: 1rem; border-top: 1px solid var(--border-light); margin-top: 1rem; }
    </style>`
  });
}
