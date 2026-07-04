import { SERIFU_MENU } from "./serifu_page.js";

export function serifuMenuPageHTML({ lang = "ja" } = {}) {
  const title = "台詞稽古メニュー";
  const items = SERIFU_MENU.map(m => `
    <a href="/kabuki/dojo/training/serifu/${m.id}" class="serifu-menu-card">
      ${m.img ? `<img src="${m.img}" alt="${m.title}" class="serifu-menu-img" loading="lazy">` : ""}
      <div class="serifu-menu-info">
        <h3>${m.title}<small>（${m.subtitle}）</small></h3>
        <p class="serifu-quote">「${m.quote}」</p>
        <span class="serifu-difficulty">${m.difficulty}</span>
      </div>
    </a>
  `).join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} | KABUKI PLUS+</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 16px; background: #faf8f5; color: #333; }
    h1 { font-size: 1.3rem; text-align: center; margin: 16px 0; }
    .serifu-menu-list { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
    .serifu-menu-card { display: flex; gap: 12px; background: #fff; border-radius: 12px; padding: 12px; text-decoration: none; color: inherit; box-shadow: 0 1px 4px rgba(0,0,0,.08); transition: transform .15s; align-items: center; }
    .serifu-menu-card:hover { transform: translateY(-2px); box-shadow: 0 3px 8px rgba(0,0,0,.12); }
    .serifu-menu-img { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .serifu-menu-info h3 { margin: 0 0 4px; font-size: 1rem; }
    .serifu-menu-info h3 small { font-weight: normal; color: #888; font-size: .85em; }
    .serifu-quote { margin: 0 0 4px; font-size: .85rem; color: #666; }
    .serifu-difficulty { font-size: .8rem; color: #c0392b; }
    .back-link { display: block; text-align: center; margin: 20px 0; color: #8b4513; }
  </style>
</head>
<body>
  <h1>🎭 ${title}</h1>
  <div class="serifu-menu-list">${items}</div>
  <a href="/kabuki/dojo" class="back-link">← KABUKI DOJOに戻る</a>
</body>
</html>`;
}
