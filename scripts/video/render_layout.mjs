// 超訳！歌舞伎ナビ v6 画面レイアウト → PNG レンダラ
// 画面設計の正本: docs/youtube/moritsuna-design-spec-v6.json
//
// 使い方:
//   node scripts/video/render_layout.mjs --config studio/episodes/moritsuna06.json [--blocks 1,2] [--force]
//
// エピソード定義JSONの blocks[].layout.states[] を1枚ずつ 1920x1080 のPNGに焼き、
// {出力}/work/layout/block{id}_s{n}.png に置く。build_sonezaki_video.mjs はこれを
// スライド（fit:'cover'）として読み込む。
//
// 焼くもの : 背景（青海波＋中央の白抜き）／ヘッダー／けらのすけ立ち姿／
//            見出し・人物紹介・用語カード・舞台写真・人物関係図
// 焼かないもの: ナレーション字幕（ASSで出す。ffmpeg側の Sub スタイル担当）
//
// photoLayer（動く写真の下地）を持つ state は、その矩形を透明の穴にしたRGBA PNGを出し、
// 解決済みの photoLayer をサイドカー block{id}_s{n}.json に書く。写真そのものと動きは
// ビルド側（ffmpeg）が穴の下に敷く。dim/shade は穴の中に半透明で焼き込む。
//
// フォントはローカルにインストール済みのものを使う（BIZ UDGothic / TA_engeifude）。
// アニメーションは持たない。画面の切り替わりは state を分けてビルド側のクロスフェードで処理する。

import { mkdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makePaths, resolveAsset } from '../../studio/paths.mjs';

// ---- 引数 ------------------------------------------------------------------
function argVal(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}
const CONFIG_PATH = argVal('--config') || 'studio/episodes/moritsuna06.json';
const ONLY = (() => {
  const v = argVal('--blocks');
  return v ? v.split(',') : null;
})();
const FORCE = process.argv.includes('--force');

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const P = makePaths(config.episode.epDir);
const WORK = config.episode.workName ? join(P.OUT, config.episode.workName) : P.WORK;
export const LAYOUT_DIR = join(WORK, 'layout');
const asset = (p) => resolveAsset(p, P);

// ---- 画面定数（design_spec v6 の grid / palette） ---------------------------
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const LEFT_MARGIN = 128;       // 左マージン

// レイアウト共通設定（エピソードJSONの layout セクションで上書きできる）
const L = {
  series: '超訳！歌舞伎ナビ',
  title: '',
  background: 'common:v6レイアウト/青海波背景.jpg',
  kera: 'common:v6レイアウト/けらのすけ立ち姿.png',
  ...(config.layout ?? {}),
};
const EP_NO = config.episode.number ?? null;
// けらのすけの口パク（layout.keraLive = 口の形の素材フォルダ）。指定時は立ち姿をPNGに焼かず、
// 表示される矩形だけをサイドカーに書く（ビルド側がナレーション音量に合わせた口の形を重ねる）
const KERA_LIVE = L.keraLive ? asset(L.keraLive) : null;
const KERA_LIVE_CLOSED = KERA_LIVE ? `${KERA_LIVE}/closed.png` : null;

// ---- ユーティリティ --------------------------------------------------------
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 「嘘」のような1語だけを朱にする
function markEmphasis(text, emphasis) {
  const t = esc(text);
  if (!emphasis) return t;
  const e = esc(emphasis);
  const i = t.indexOf(e);
  if (i < 0) return t;
  return t.slice(0, i) + `<span class="k">${e}</span>` + t.slice(i + e.length);
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
const dataUrlCache = new Map();
// 日本語パス・file:// のアクセス制限を避けるため、画像はdataURLで埋め込む
function dataUrl(absPath) {
  if (dataUrlCache.has(absPath)) return dataUrlCache.get(absPath);
  const mime = MIME[extname(absPath).toLowerCase()] ?? 'image/png';
  const url = `data:${mime};base64,${readFileSync(absPath).toString('base64')}`;
  dataUrlCache.set(absPath, url);
  return url;
}
function mtime(p) {
  try { return statSync(p).mtimeMs; } catch { return 0; }
}

// ---- CSS（v6プレビューHTMLから抽出・アニメーション関連は落とした） ----------
const CSS = `
:root{
  --sumi:#17202A;      /* 本文の墨 */
  --sumi2:#2E3E4C;     /* 役柄説明 */
  --ai:#16273A;        /* 字幕帯・濃紺 */
  --shu:#A3232F;       /* 朱（強調は1画面1か所） */
  --hai:#5A6B78;       /* ふりがな・補助 */
  --keisen:#C3D2D9;    /* 用語カードの罫 */
  --line:#7C8D99;      /* 関係図の線 */
  --fS:'BIZ UDGothic','BIZ UDPGothic','Yu Gothic',sans-serif;
  --fB:'TA_engeifude','Yu Mincho',serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${CANVAS_W}px;height:${CANVAS_H}px;background:transparent;font-family:var(--fS);
  -webkit-font-smoothing:antialiased;overflow:hidden}
.stage{position:relative;width:${CANVAS_W}px;height:${CANVAS_H}px;overflow:hidden}

/* ---------- 背景 ---------- */
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.keraLane{position:absolute;left:1440px;top:0;width:480px;height:${CANVAS_H}px;
  background:linear-gradient(to right, rgba(166,195,208,0) 0%, rgba(166,195,208,.34) 46%, rgba(166,195,208,.56) 100%)}
.veil{position:absolute;inset:0;background:
  radial-gradient(112% 86% at 40% 44%, rgba(255,255,255,.74) 0%, rgba(255,255,255,.48) 33%, rgba(255,255,255,.12) 63%, rgba(255,255,255,0) 80%)}
.floor{position:absolute;left:0;bottom:0;width:${CANVAS_W}px;height:300px;
  background:linear-gradient(to bottom, rgba(22,39,58,0) 0%, rgba(22,39,58,.05) 100%)}
.el{position:absolute}

/* ---------- ヘッダー（全state共通） ---------- */
#hdr{left:${LEFT_MARGIN}px;top:44px;width:1000px;height:132px}
#hdr .bar{position:absolute;left:0;top:4px;width:6px;height:124px;background:var(--shu)}
#hdr .ser{position:absolute;left:30px;top:6px;white-space:nowrap;font-size:30px;font-weight:700;letter-spacing:.14em;color:var(--hai)}
#hdr .main{position:absolute;left:28px;top:36px;display:flex;align-items:center;gap:34px;white-space:nowrap}
#hdr .ttl{font-family:var(--fB);font-size:76px;line-height:1.1;color:var(--sumi);letter-spacing:.04em;
  -webkit-text-stroke:1.6px var(--sumi)}
#hdr .ep{flex:0 0 50px;width:50px;height:50px;border:3px solid var(--shu);border-radius:50%;
  display:flex;align-items:center;justify-content:center;font-size:27px;font-weight:700;color:var(--shu);line-height:1}

/* ---------- けらのすけ ---------- */
#kera{left:1570px;top:66px;width:292px;height:764px}
#kera img{width:100%;height:100%;object-fit:contain;display:block}
#keraSh{left:1606px;top:818px;width:220px;height:28px;
  background:radial-gradient(50% 50% at 50% 50%, rgba(32,56,74,.22) 0%, rgba(32,56,74,0) 72%)}

/* ---------- 見出し（朱の縦罫つき） ---------- */
.heading{display:flex;align-items:stretch}
.heading .rule{width:6px;background:var(--shu);flex:0 0 6px}
.heading .body{margin-left:46px}
.heading .lead{font-size:80px;font-weight:700;line-height:1.25;color:var(--sumi2);letter-spacing:.02em;white-space:nowrap}
.heading .ln{font-weight:700;line-height:1.25;color:var(--sumi);letter-spacing:.02em;white-space:nowrap}
.heading .k{color:var(--shu);-webkit-text-stroke-color:currentColor}

/* ---------- 用語カード ---------- */
.termCard{background:rgba(255,255,255,.90);border:2px solid var(--keisen);border-radius:14px;
  display:flex;flex-direction:column;align-items:center;justify-content:center}
.termCard .rb{font-size:26px;color:var(--hai);letter-spacing:.22em;line-height:1;margin-bottom:14px}
.termCard .tm{font-size:96px;font-weight:700;color:var(--sumi);line-height:1;letter-spacing:.06em}

/* ---------- 人物紹介（ふりがな→名前→朱の下線→役柄） ---------- */
.person .head{display:inline-block}
.person .rb{display:block;font-size:26px;color:var(--hai);letter-spacing:.22em;line-height:1;margin-bottom:8px}
.person .nm{display:block;font-size:88px;font-weight:700;color:var(--sumi);line-height:1.2;letter-spacing:.04em;white-space:nowrap}
.person .rl{display:block;height:5px;background:var(--shu);margin-top:12px}
.person .ro{font-size:46px;font-weight:700;color:var(--sumi2);letter-spacing:.02em;line-height:1.2;
  margin-top:19px;white-space:nowrap;text-shadow:0 0 16px #fff,0 0 8px #fff,0 0 3px #fff}

/* 名前チップ型（通常解説の小さい階層） */
.personChip{height:190px}
.personChip .bar{position:absolute;left:0;top:0;width:5px;height:182px;background:var(--shu)}
.personChip .rb{position:absolute;left:28px;top:0;font-size:25px;color:var(--hai);letter-spacing:.14em;white-space:nowrap}
.personChip .nm{position:absolute;left:26px;top:28px;font-size:76px;font-weight:700;color:var(--sumi);line-height:1.2;letter-spacing:.03em;white-space:nowrap}
.personChip .ro{position:absolute;left:28px;top:132px;font-size:40px;font-weight:400;color:var(--sumi2);letter-spacing:.02em;white-space:nowrap}

/* ---------- 舞台写真 ---------- */
.photo{border:8px solid #fff;border-radius:3px;box-shadow:0 12px 34px rgba(24,44,62,.24);overflow:hidden}
.photo img{width:100%;height:100%;object-fit:cover;display:block}

/* ---------- 人物関係図 ---------- */
.node{background:rgba(255,255,255,.93);border:2px solid var(--ai);border-radius:12px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  box-shadow:0 3px 12px rgba(30,50,70,.09)}
.node .rb{font-size:26px;color:var(--hai);letter-spacing:.12em;line-height:1.1;margin-bottom:6px}
.node .nm{font-size:66px;font-weight:700;color:var(--sumi);line-height:1.05;letter-spacing:.03em}
.link{background:var(--line)}
.node.accent{border:4px solid var(--shu)}
.nodeSub{transform:translateX(-50%);color:var(--hai);line-height:1.2;letter-spacing:.06em;white-space:nowrap}
.chip{width:112px;height:46px;background:#fff;border:2px solid var(--line);border-radius:23px;
  display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:700;color:#3B4A57;letter-spacing:.08em}

/* ---------- 写真レイヤーの穴 ---------- */
.backdrop{position:absolute;inset:0}
.dim{position:absolute}
.shade{position:absolute}

/* ---------- 写真の上に載せる見出し（tone:light） ---------- */
.heading.light .body{text-shadow:0 2px 18px rgba(0,0,0,.55)}
.heading.light .lead{color:rgba(255,255,255,.85)}
.heading.light .ln{color:#fff}
.heading.light .k{color:#E0474C}

/* ---------- 人物紹介・縦書き筆文字型（写真の上） ---------- */
.personV .row{display:flex;align-items:flex-start}
.personV .vnm{font-family:var(--fB);writing-mode:vertical-rl;line-height:1;letter-spacing:.04em;white-space:nowrap;
  text-shadow:0 4px 26px rgba(0,0,0,.75),0 0 8px rgba(0,0,0,.55)}
.personV .vrb{writing-mode:vertical-rl;font-size:30px;color:#fff;letter-spacing:.18em;line-height:1;margin-left:12px;margin-top:10px;
  white-space:nowrap;text-shadow:0 2px 10px rgba(0,0,0,.8)}
.personV .vro{font-size:40px;font-weight:700;color:#fff;letter-spacing:.02em;line-height:1.25;margin-top:22px;white-space:nowrap;
  text-shadow:0 2px 14px rgba(0,0,0,.8),0 0 4px rgba(0,0,0,.6)}

/* ---------- けらのすけ（大・右帯の中で上半身） ---------- */
#keraL{left:1440px;top:0;width:480px;height:${CANVAS_H}px;overflow:hidden}
#keraL img{position:absolute;left:-33px;top:26px;width:546px;height:1452px;object-fit:contain;display:block}

/* ---------- 呼びかけ（縦組み・筆文字） ---------- */
.call{font-family:var(--fB);line-height:1;color:var(--shu);writing-mode:vertical-rl;letter-spacing:.06em;
  -webkit-text-stroke:2.2px var(--shu)}
`;

// ---- 要素のHTML組み立て ----------------------------------------------------

// 見出し: { lead?, lines:[...], emphasis?, x?, y?, size?, tone?:'light' }
// tone:'light' は写真の上に載せる白文字（縦罫の朱はそのまま）
function headingHTML(h) {
  const x = h.x ?? LEFT_MARGIN;
  const y = h.y ?? 292;
  const lines = h.lines ?? [];
  // 行数が増えたら1行の字を小さくして幅の破綻を避ける
  const size = h.size ?? (lines.length >= 3 ? 88 : lines.length === 2 ? 104 : 124);
  // font: "brush" で本文を筆文字（TA_engeifude）にする。タイトルや次回予告の題名向け
  // font: "kaisho" は毛筆楷書（CPコーパス毛筆楷書体）。芝居文字の TA_engeifude はひらがなの崩しが強く
  // 「の」などが読めないので、ひらがなを含むタイトルはこちらを使う。細いので文字色の縁取りで太らせ、字間を詰める
  // font: "gothic" は源ノ角ゴシック Black（Noto Sans JP Black）。毛筆楷書も「イマイチ」とされ、書体比較でこれに決まった（2026-09-19）
  const light = h.tone === 'light';
  const face = h.font === 'brush' ? ';font-family:var(--fB);font-weight:400;letter-spacing:.06em'
    : h.font === 'kaisho' ? `;font-family:'CP CORPUS Mohitu Kaisho',var(--fB);font-weight:400;letter-spacing:-.02em;`
      + `-webkit-text-stroke:${Math.max(1.5, size / 36).toFixed(1)}px ${light ? '#fff' : 'var(--sumi)'}`
    : h.font === 'gothic' ? ";font-family:'Noto Sans JP Black','Noto Sans JP',var(--fS);font-weight:900;letter-spacing:.02em"
    : '';
  const body = [
    h.lead ? `<div class="lead">${esc(h.lead)}</div>` : '',
    ...lines.map(t => `<div class="ln" style="font-size:${size}px${face}">${markEmphasis(t, h.emphasis)}</div>`),
  ].join('');
  const tone = h.tone === 'light' ? ' light' : '';
  return `<div class="el heading${tone}" style="left:${x}px;top:${y}px"><i class="rule"></i><div class="body">${body}</div></div>`;
}

// 用語カード: { ruby, text, x?, y?, w?, h? }
function termCardHTML(c) {
  const x = c.x ?? 150, y = c.y ?? 286, w = c.w ?? 430, h = c.h ?? 190;
  return `<div class="el termCard" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">`
    + (c.ruby ? `<span class="rb">${esc(c.ruby)}</span>` : '')
    + `<span class="tm">${esc(c.text)}</span></div>`;
}

// 人物紹介: { ruby, name, role, position:'left'|'right', variant?:'chip'|'vertical', x?, y? }
function personHTML(p) {
  const right = p.position === 'right';
  if (p.variant === 'vertical') {
    // 写真の上に置く縦書き筆文字の役名（曽我対面の「弟 五郎／兄 十郎」の見せ方）。
    // ふりがなは役名の右に小さく縦書き、役柄は役名の下に横書き
    const x = p.x ?? 150, y = p.y ?? 200;
    const size = p.size ?? 140;
    const color = p.color ?? '#fff';
    return `<div class="el personV" style="left:${x}px;top:${y}px">`
      + `<div class="row"><span class="vnm" style="font-size:${size}px;color:${esc(color)}">${esc(p.name)}</span>`
      + (p.ruby ? `<span class="vrb">${esc(p.ruby)}</span>` : '')
      + `</div>`
      + (p.role ? `<div class="vro">${esc(p.role)}</div>` : '')
      + `</div>`;
  }
  if (p.variant === 'chip') {
    const x = p.x ?? (right ? 878 : 180), y = p.y ?? 300, w = p.w ?? 800;
    return `<div class="el personChip" style="left:${x}px;top:${y}px;width:${w}px">`
      + `<i class="bar"></i>`
      + (p.ruby ? `<span class="rb">${esc(p.ruby)}</span>` : '')
      + `<span class="nm">${esc(p.name)}</span>`
      + (p.role ? `<span class="ro">${esc(p.role)}</span>` : '')
      + `</div>`;
  }
  const x = p.x ?? (right ? 878 : 154);
  const y = p.y ?? (right ? 376 : 556);
  return `<div class="el person" style="left:${x}px;top:${y}px">`
    + `<span class="head">`
    + (p.ruby ? `<span class="rb">${esc(p.ruby)}</span>` : '')
    + `<span class="nm">${esc(p.name)}</span>`
    + `<i class="rl"></i>`
    + `</span>`
    + (p.role ? `<div class="ro">${esc(p.role)}</div>` : '')
    + `</div>`;
}

// 舞台写真: { img, position:'right'|'left', x?, y?, w?, h?, crop? }
function photoHTML(ph) {
  const left = ph.position === 'left';
  // 中央右は横位置（4:3）、中央左は縦位置（3:4）が既定
  const x = ph.x ?? (left ? 170 : 660);
  const y = ph.y ?? (left ? 196 : 176);
  const w = ph.w ?? (left ? 468 : 800);
  const h = ph.h ?? (left ? 624 : 600);
  const pos = ph.crop ?? 'center';
  return `<div class="el photo" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">`
    + `<img src="${dataUrl(asset(ph.img))}" style="object-position:${esc(pos)}" alt=""></div>`;
}

// 人物関係図:
//   nodes: [{ id, name, ruby?, x, y, w?, h?, sub?, accent? }]
//     sub    : 箱の直下に添える小さな補足（例「鎌倉方」）
//     accent : 枠を朱で太く（その段階で新しく出た人物を目立たせる）
//   links: [{ from, to, label? }]                                   … 横並びは水平線・縦並びは垂直線
//          [{ type:'family', parent, children:[...], label?, drop? }] … 親から子へ枝分かれする家系図の線
//   nameSize / rubySize / subSize で既定の文字サイズを変えられる。箱が狭いときは収まるまで自動で縮める
//   （全ノードで同じ大きさに揃える）。
function relationsHTML(r) {
  const NW = 360, NH = 136, LINE = 3;
  const PAD = 18;                       // 箱の内側の左右余白（枠線込みの目安）
  const NAME = r.nameSize ?? 66, RUBY = r.rubySize ?? 26, SUB = r.subSize ?? 28;
  const SUB_GAP = 10;                   // 箱の下辺から補足文字まで
  const byId = new Map();
  let html = '';

  const nodes = (r.nodes ?? []).map(n => ({ ...n, w: n.w ?? r.nodeW ?? NW, h: n.h ?? r.nodeH ?? NH }));
  for (const n of nodes) byId.set(n.id ?? n.name, n);

  // 名前・ふりがなが箱に収まる文字サイズ（全角1字≒1em＋字間）。全ノードの最小に揃える
  let nameSize = NAME, rubySize = RUBY;
  for (const n of nodes) {
    const inner = n.w - PAD * 2 - (n.accent ? 4 : 0);
    const nameLen = [...(n.name ?? '')].length || 1;
    const rubyLen = [...(n.ruby ?? '')].length;
    nameSize = Math.min(nameSize, Math.floor(inner / (nameLen * 1.03)));
    if (rubyLen) rubySize = Math.min(rubySize, Math.floor(inner / (rubyLen * 1.12)));
    // 高さ: ふりがな行＋間＋名前行が箱の内側に収まること
    const innerH = n.h - 12 - (n.accent ? 4 : 0);
    const rubyH = rubyLen ? rubySize * 1.1 + 6 : 0;
    nameSize = Math.min(nameSize, Math.floor((innerH - rubyH) / 1.05));
  }
  const nameStyle = nameSize !== 66 ? ` style="font-size:${nameSize}px"` : '';
  const rubyStyle = rubySize !== 26 ? ` style="font-size:${rubySize}px"` : '';

  // ラベルchip（線の上に中心を合わせる）。2文字までは従来の112px幅、3文字以上は字数に合わせて広げる
  const chipHTML = (cx, cy, label) => {
    const len = [...String(label)].length;
    const w = len <= 2 ? 112 : Math.ceil(len * 30 * 1.08 + 40);
    const width = len <= 2 ? '' : `;width:${w}px`;
    return `<div class="el chip" style="left:${Math.round(cx - w / 2)}px;top:${Math.round(cy - 23)}px${width}">${esc(label)}</div>`;
  };

  // 補足文字の分だけ、親から下ろす線の始点を下げる
  const bottomOf = (n) => n.y + n.h + (n.sub ? SUB_GAP + Math.ceil(SUB * 1.2) + 6 : 0);

  // 家系図の線は箱の下に敷く（ラベルchipは箱の後で最前面に置く）
  let familyChips = '';
  for (const l of (r.links ?? [])) {
    if (l.type !== 'family') continue;
    const par = byId.get(l.parent);
    const kids = (l.children ?? []).map(id => byId.get(id)).filter(Boolean);
    if (!par || !kids.length) continue;
    const px = Math.round(par.x + par.w / 2);
    const top = bottomOf(par);
    const barY = Math.min(...kids.map(k => k.y)) - (l.drop ?? 40);
    const xs = kids.map(k => Math.round(k.x + k.w / 2));
    const vline = (x, y1, y2) => y2 > y1
      ? `<i class="el link" style="left:${Math.round(x - LINE / 2)}px;top:${y1}px;width:${LINE}px;height:${y2 - y1}px"></i>` : '';
    // 親の下辺 → 枝の高さ
    html += vline(px, top, barY + LINE);
    // 枝（親の位置と子の位置をすべて含む幅）
    const bx1 = Math.min(px, ...xs), bx2 = Math.max(px, ...xs);
    if (bx2 > bx1) {
      html += `<i class="el link" style="left:${Math.round(bx1 - LINE / 2)}px;top:${barY}px;width:${bx2 - bx1 + LINE}px;height:${LINE}px"></i>`;
    }
    // 枝 → 各子の上辺
    kids.forEach((k, i) => { html += vline(xs[i], barY, k.y); });
    if (l.label) {
      const cy = (top + barY) / 2;
      familyChips += chipHTML(px, cy, l.label);
    }
  }

  for (const n of nodes) {
    html += `<div class="el node${n.accent ? ' accent' : ''}" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px">`
      + (n.ruby ? `<span class="rb"${rubyStyle}>${esc(n.ruby)}</span>` : '')
      + `<span class="nm"${nameStyle}>${esc(n.name)}</span></div>`;
    if (n.sub) {
      html += `<div class="el nodeSub" style="left:${Math.round(n.x + n.w / 2)}px;top:${n.y + n.h + SUB_GAP}px;font-size:${SUB}px">${esc(n.sub)}</div>`;
    }
  }
  for (const l of (r.links ?? [])) {
    if (l.type === 'family') continue;
    const a = byId.get(l.from), b = byId.get(l.to);
    if (!a || !b) continue;
    const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    let lx, ly, lw, lh;
    if (Math.abs(bc.x - ac.x) >= Math.abs(bc.y - ac.y)) {
      // 横に並ぶ → 箱の右端と左端をつなぐ水平線
      const x1 = Math.min(a.x + a.w, b.x + b.w), x2 = Math.max(a.x, b.x);
      lx = x1; lw = Math.max(0, x2 - x1); lh = LINE; ly = Math.round(ac.y - LINE / 2);
    } else {
      // 縦に並ぶ → 箱の下端と上端をつなぐ垂直線
      const y1 = Math.min(a.y + a.h, b.y + b.h), y2 = Math.max(a.y, b.y);
      ly = y1; lh = Math.max(0, y2 - y1); lw = LINE; lx = Math.round(ac.x - LINE / 2);
    }
    html += `<i class="el link" style="left:${lx}px;top:${ly}px;width:${lw}px;height:${lh}px"></i>`;
    if (l.label) {
      const cx = lx + lw / 2, cy = ly + lh / 2;
      html += chipHTML(cx, cy, l.label);
    }
  }
  return html + familyChips;
}

// 呼びかけ（縦組み筆文字）: { text, x, y, size? }
function callHTML(c) {
  const size = c.size ?? 108;
  return `<div class="el call" style="left:${c.x ?? 706}px;top:${c.y ?? 376}px;font-size:${size}px">${esc(c.text)}</div>`;
}

// 写真レイヤーの既定値を埋め、画像を絶対パスに解決する（サイドカーにもこの形で書く）
const MOVES = ['zoomIn', 'zoomOut', 'panLeft', 'panRight', 'none'];
export function resolvePhotoLayer(pl) {
  if (!pl) return null;
  const r = {
    x: 0, y: 0, w: 1440, h: 1080,
    move: 'zoomIn', amount: 0.08, fit: 'cover', dim: 0, shade: 'none',
    ...pl,
    focus: { x: 0.5, y: 0.4, ...(pl.focus ?? {}) },
    img: asset(pl.img),
  };
  if (!MOVES.includes(r.move)) throw new Error(`photoLayer.move が不正です: ${r.move}`);
  if (!['cover', 'blurpad'].includes(r.fit)) throw new Error(`photoLayer.fit が不正です: ${r.fit}`);
  if (!existsSync(r.img)) throw new Error(`photoLayer.img が見つかりません: ${r.img}`);
  return r;
}

// 背景（青海波・veil・floor・けらのすけ帯）。写真レイヤーの矩形は evenodd の clip-path で透明に抜く
function backdropHTML(pl) {
  const layers = `<div class="bg" style="background-image:url(${dataUrl(asset(L.background))})"></div>`
    + `<div class="keraLane"></div><div class="veil"></div><div class="floor"></div>`;
  if (!pl) return `<div class="backdrop">${layers}</div>`;
  // 全画面の写真なら背景は描かない
  if (pl.x <= 0 && pl.y <= 0 && pl.x + pl.w >= CANVAS_W && pl.y + pl.h >= CANVAS_H) return '';
  const { x, y, w, h } = pl;
  const clip = `polygon(evenodd,0 0,${CANVAS_W}px 0,${CANVAS_W}px ${CANVAS_H}px,0 ${CANVAS_H}px,0 0,`
    + `${x}px ${y}px,${x + w}px ${y}px,${x + w}px ${y + h}px,${x}px ${y + h}px,${x}px ${y}px)`;
  return `<div class="backdrop" style="clip-path:${clip}">${layers}</div>`;
}

// 穴の中に焼く暗幕（dim）と片側グラデ（shade）
function photoVeilHTML(pl) {
  if (!pl) return '';
  const box = `left:${pl.x}px;top:${pl.y}px;width:${pl.w}px;height:${pl.h}px`;
  let html = '';
  if (pl.dim > 0) html += `<div class="dim" style="${box};background:rgba(0,0,0,${pl.dim})"></div>`;
  const strength = pl.shadeStrength ?? 0.62;
  const dir = { left: 'to right', right: 'to left', bottom: 'to top' }[pl.shade];
  if (dir) {
    html += `<div class="shade" style="${box};background:linear-gradient(${dir},`
      + `rgba(0,0,0,${strength}) 0%,rgba(0,0,0,${(strength * 0.45).toFixed(3)}) 35%,rgba(0,0,0,0) 65%)"></div>`;
  }
  return html;
}

// ヘッダー（全state共通で常時表示）
function headerHTML() {
  return `<div class="el" id="hdr">`
    + `<i class="bar"></i>`
    + `<span class="ser">${esc(L.series)}</span>`
    + `<span class="main"><span class="ttl">${esc(L.title)}</span>`
    + (EP_NO != null ? `<span class="ep">${esc(EP_NO)}</span>` : '')
    + `</span></div>`;
}

// けらのすけ: true=立ち姿（既定）/ false=出さない / 'large'=右帯の中で上半身を大きく
// keraLive のときは closed.png を見えない状態で置き、CSSで決まる表示矩形だけを測る（足元の影は焼く）
function keraHTML(mode) {
  if (mode === false) return '';
  const img = KERA_LIVE
    ? `<img src="${dataUrl(KERA_LIVE_CLOSED)}" style="visibility:hidden" alt="">`
    : `<img src="${dataUrl(asset(L.kera))}" alt="">`;
  if (mode === 'large') return `<div class="el" id="keraL">${img}</div>`;
  return `<i class="el" id="keraSh"></i><div class="el" id="kera">${img}</div>`;
}

// 1 state 分の完全なHTML（pl は resolvePhotoLayer 済みの写真レイヤー）
function stateHTML(state, pl) {
  const parts = [
    backdropHTML(pl),
    photoVeilHTML(pl),
    keraHTML(state.kera ?? true),
    state.header === false ? '' : headerHTML(),
  ];
  if (state.photo) parts.push(photoHTML(state.photo));
  if (state.relations) parts.push(relationsHTML(state.relations));
  if (state.heading) parts.push(headingHTML(state.heading));
  if (state.termCard) parts.push(termCardHTML(state.termCard));
  if (state.person) parts.push(personHTML(state.person));
  if (state.call) parts.push(callHTML(state.call));

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><style>${CSS}</style></head>`
    + `<body><div class="stage">${parts.join('')}</div></body></html>`;
}

// ---- レンダリング対象の洗い出し --------------------------------------------
// 戻り値: [{ blockId, index, file, state }]
export function collectStates(cfg) {
  const out = [];
  for (const b of cfg.blocks ?? []) {
    if (!b.layout?.states?.length) continue;
    b.layout.states.forEach((state, i) => {
      out.push({ blockId: b.id, index: i, file: `block${b.id}_s${i + 1}.png`,
        sidecar: `block${b.id}_s${i + 1}.json`, state });
    });
  }
  return out;
}

// けらのすけ画像の実際の表示矩形（object-fit:contain・中央寄せの実寸）。出さない state は null。
// kera:"large" は右帯の枠で切られるので、その枠を clip として添える（画面下へのはみ出しは矩形のまま）
async function measureKera(page) {
  return page.evaluate(() => {
    const img = document.querySelector('#kera img, #keraL img');
    if (!img || !img.naturalWidth) return null;
    const r = img.getBoundingClientRect();
    const s = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    const out = { x: r.left + (r.width - w) / 2, y: r.top + (r.height - h) / 2, w, h };
    if (img.parentElement.id === 'keraL') {
      const c = img.parentElement.getBoundingClientRect();
      out.clip = { x: c.left, y: c.top, w: c.width, h: c.height };
    }
    return out;
  });
}

// ---- メイン ---------------------------------------------------------------
async function main() {
  const targets = collectStates(config).filter(t => !ONLY || ONLY.includes(t.blockId));
  if (!targets.length) {
    console.log('layout を持つブロックがありません。');
    return;
  }
  mkdirSync(LAYOUT_DIR, { recursive: true });

  // 再ビルドを速くするため、設定JSON・共通素材・このスクリプトより新しいPNGは飛ばす
  const selfPath = fileURLToPath(import.meta.url);
  const baseStamp = Math.max(mtime(CONFIG_PATH), mtime(selfPath),
    mtime(asset(L.background)), mtime(asset(L.kera)), KERA_LIVE ? mtime(KERA_LIVE_CLOSED) : 0);
  if (KERA_LIVE && !existsSync(KERA_LIVE_CLOSED)) throw new Error(`口パク素材がありません: ${KERA_LIVE_CLOSED}`);

  const todo = targets.filter(t => {
    if (FORCE) return true;
    const dst = join(LAYOUT_DIR, t.file);
    if (!existsSync(dst) || !existsSync(join(LAYOUT_DIR, t.sidecar))) return true;
    let stamp = baseStamp;
    if (t.state.photo) stamp = Math.max(stamp, mtime(asset(t.state.photo.img)));
    if (t.state.photoLayer) stamp = Math.max(stamp, mtime(asset(t.state.photoLayer.img)));
    return mtime(dst) <= stamp;
  });

  console.log(`--- レイアウト描画: ${todo.length}/${targets.length} 枚（出力: ${LAYOUT_DIR}）`);
  if (!todo.length) return;

  const { default: puppeteer } = await import('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: CANVAS_W, height: CANVAS_H, deviceScaleFactor: 1 });
    for (const t of todo) {
      const pl = resolvePhotoLayer(t.state.photoLayer);
      await page.setContent(stateHTML(t.state, pl), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      // 写真レイヤーの穴を残すため背景は透明で撮る（穴の無い state は背景が全面を覆うので従来と同じ見た目）
      const buf = await page.screenshot({
        type: 'png', omitBackground: true, clip: { x: 0, y: 0, width: CANVAS_W, height: CANVAS_H },
      });
      writeFileSync(join(LAYOUT_DIR, t.file), buf);
      // ビルド側が写真を敷くための情報。穴の無い state も null を書いて古い情報を残さない
      const side = { photoLayer: pl };
      if (KERA_LIVE) side.kera = await measureKera(page);
      writeFileSync(join(LAYOUT_DIR, t.sidecar), JSON.stringify(side, null, 2) + '\n', 'utf8');
      console.log(`  ${t.file}`);
    }
  } finally {
    await browser.close();
  }
  console.log('=== 完了 ===');
}

// 直接起動されたときだけ実行（build 側からは LAYOUT_DIR だけ使いたいので）
if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  main().catch(e => { console.error(e); process.exit(1); });
}
