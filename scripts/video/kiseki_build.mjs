// 気良歌舞伎「復活からの軌跡」投影用映像・5分版（1920×1080 / 30fps）
// 第三幕の直前に暗転で流す。頭と尻は黒。オペレータの操作はGO一回だけ
// プロジェクタ2台で左右に分けて投影する。左960=黒地にテロップ／右960=写真
// 写真は perspective で毎フレーム小数ピクセルに補間して動かし、テロップは別レイヤーで滑り込ませる
// 使い方: node _scratch/kiseki5_build.mjs <出力mp4> [--keep] [--only=N,M] [--no-audio]
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
const argv = process.argv.slice(3);
const ONLY = (argv.find(a => a.startsWith('--only=')) || '').split('=')[1];
const NO_AUDIO = argv.includes('--no-audio');
const KEEP = argv.includes('--keep');
const OP = (argv.find(a => a.startsWith('--op=')) || '').split('=')[1] || '';   // 頭に足すオープニングmp4
const LIST = argv.includes('--list');   // 一覧を出すだけ（作業フォルダに触らない）
const WORK = 'D:/気良歌舞伎/台本/曽根崎心中/output/軌跡/work/body';
if (!KEEP && !LIST) rmSync(WORK, { recursive: true, force: true });   // --list は進行中のビルドを壊さない
if (!LIST) mkdirSync(WORK, { recursive: true });

const W = 1920, H = 1080, FPS = 30;
const XF = 0.8;              // カット間の重なり（秒）
const PW = 960, PH = 1080;   // 右側パネル（写真）の寸法＝プロジェクタ1台ぶん
const SAFE_R = 872;          // 文字はここより右に出さない（左パネルの内側）
const P365 = 'D:/気良歌舞伎/記録写真/365投稿候補_20260714/写真';
const MUK = 'D:/気良歌舞伎/記録写真/歴史資料/明宝むかし写真/むかし写真';
const NIWAKA = `${MUK}/昭和25年歌舞伎`;
const KAG = 'D:/気良歌舞伎/記録写真/歴史資料/昭和15年_加賀見山';
const Y = 'D:/気良歌舞伎/記録写真';
const K24 = `${Y}/2024/祭礼公演_白浪＋太功記＋忠臣蔵`;

// beat: {black} / {card:[行...], sub, hold, small} / {img, lead, caption:[行...], hold, mono, move, focus, bloom}
const BEATS = [
  { black: 1.2 },

  // ── 章一　村の芝居 ─────────────────────────────
  { card: ['気良座'], sub: '旧・奥明方小学校　講堂', hold: 4.6 },
  { img: `${MUK}/奥明方小学校　講堂.BMP`, caption: ['講堂には、', 'いつも人が集まった'], mono: true, move: 'zoomIn', focus: { x: .5, y: .45 }, hold: 4.6 },
  { img: `${MUK}/奥明方小学校　講堂2.BMP`, caption: ['村じゅうが、ここへ来た'], mono: true, move: 'zoomOut', focus: { x: .5, y: .5 }, hold: 4.2 },
  { img: `${KAG}/IMG_20160407_0008.jpg`, lead: '昭和十五年', caption: ['気良聯合青年歌舞伎', '加賀見山　五段目'], move: 'panLeft', focus: { x: .55, y: .45 }, hold: 5.2 },
  { img: `${KAG}/IMG_20160407_0001.jpg`, caption: ['写真は一枚も残っていない'], move: 'zoomIn', focus: { x: .5, y: .5 }, hold: 5.0 },
  { img: `${KAG}/IMG_20160407_0003.jpg`, caption: ['舞台を観た人が、', '記憶だけで描いた'], move: 'zoomIn', focus: { x: .45, y: .45 }, hold: 5.0 },
  { img: `${NIWAKA}/西気良白山神社祭礼　昭和25年　俄.png`, lead: '昭和二十五年', caption: ['西気良白山神社祭礼　俄'], move: 'zoomOut', focus: { x: .5, y: .45 }, hold: 4.8 },
  { img: `${NIWAKA}/西気良白山神社祭礼　俄6.png`, caption: ['村の若い衆が、役者だった'], move: 'panRight', focus: { x: .5, y: .45 }, hold: 4.6 },
  { img: `${NIWAKA}/西気良白山神社祭礼　俄5.png`, caption: ['年に一度、秋祭りの日に'], move: 'zoomIn', focus: { x: .5, y: .5 }, hold: 4.4 },
  { card: ['やがて、', '芝居は途絶えた。'], hold: 4.6 },

  // ── 章二　復活 ────────────────────────────────
  { card: ['平成十七年', '気良歌舞伎、復活。'], hold: 5.4 },

  // ── 章三　積み重ね（1演目に1枚） ───────────────
  { img: `${Y}/2006/曽我対面/2006_曽我対面_035.jpg`, lead: '平成十八年', caption: ['寿曽我対面'], move: 'zoomIn', focus: { x: .5, y: .42 }, bloom: true, hold: 4.2 },
  { img: `${Y}/2006/舞台裏/忠臣蔵七段目/2006_舞台裏_忠臣蔵七段目_007.jpg`, caption: ['仮名手本忠臣蔵 七段目', '「祇園一力茶屋」'], move: 'zoomOut', focus: { x: .5, y: .42 }, hold: 4.2 },
  { img: `${Y}/2007/忠臣蔵五段目/2007_忠臣蔵五段目_004.jpg`, lead: '平成十九年', caption: ['仮名手本忠臣蔵 五段目'], move: 'panRight', focus: { x: .5, y: .45 }, hold: 4.1 },
  { img: `${Y}/2007/忠臣蔵六段目/2007_忠臣蔵六段目_070.jpg`, caption: ['仮名手本忠臣蔵 六段目'], move: 'zoomIn', focus: { x: .5, y: .45 }, hold: 4.1 },
  { img: `${Y}/2007/安達ヶ原三段目/2007_安達ヶ原三段目_015.jpg`, caption: ['奥州安達原「袖萩祭文」'], move: 'zoomOut', focus: { x: .5, y: .45 }, hold: 4.1 },
  { img: `${Y}/2008/祭礼公演_すし屋＋野崎村/演目_すし屋/2008_祭礼公演_すし屋＋野崎村_演目_すし屋_011.jpg`, lead: '平成二十年', caption: ['義経千本桜「すし屋」'], move: 'zoomIn', focus: { x: .5, y: .45 }, hold: 4.0 },
  { img: `${Y}/2008/祭礼公演_すし屋＋野崎村/演目_野崎村/2008_祭礼公演_すし屋＋野崎村_演目_野崎村_018.jpg`, caption: ['新版歌祭文「野崎村」'], move: 'panLeft', focus: { x: .5, y: .45 }, hold: 4.0 },
  { img: `${Y}/2009/明宝公演_伊勢音頭＋太功記/演目_伊勢音頭/2009_明宝公演_伊勢音頭＋太功記_演目_伊勢音頭_032.jpg`, lead: '平成二十一年', caption: ['伊勢音頭恋寝刃'], move: 'zoomOut', focus: { x: .5, y: .45 }, hold: 4.0 },
  { img: `${Y}/2009/明宝公演_伊勢音頭＋太功記/演目_太功記十段目/2009_明宝公演_伊勢音頭＋太功記_演目_太功記十段目_064.jpg`, caption: ['絵本太功記「尼崎閑居」'], move: 'zoomIn', focus: { x: .5, y: .42 }, hold: 4.0 },
  { img: `${Y}/2010/山田浩二/演目_熊谷陣屋/2010_山田浩二_演目_熊谷陣屋_019.jpg`, lead: '平成二十二年', caption: ['一谷嫩軍記「熊谷陣屋」'], move: 'zoomIn', focus: { x: .5, y: .4 }, hold: 3.9 },
  { img: `${Y}/2010/祭礼公演_熊谷陣屋＋白浪/演目_白浪五人男/IMG_20160924_0025.jpg`, caption: ['白浪五人男「稲瀬川」'], move: 'panRight', focus: { x: .5, y: .42 }, hold: 3.9 },
  { img: `${Y}/2011/祭礼公演_封印切＋安達原/演目_封印切/Image31.jpg`, lead: '平成二十三年', caption: ['恋飛脚大和往来「封印切」'], move: 'zoomOut', focus: { x: .5, y: .45 }, hold: 3.9 },
  { img: `${Y}/2011/祭礼公演_封印切＋安達原/演目_安達ヶ原三段目/IMG_20160924_0021.jpg`, caption: ['奥州安達原「袖萩祭文」'], move: 'zoomIn', focus: { x: .5, y: .45 }, hold: 3.9 },
  { img: `${Y}/2012/祭礼公演_曽我対面＋切られ与三/演目_曽我対面/2012_祭礼公演_曽我対面＋切られ与三_演目_曽我対面_002.jpg`, lead: '平成二十四年', caption: ['寿曽我対面'], move: 'panLeft', focus: { x: .5, y: .45 }, hold: 3.8 },
  { img: `${Y}/2012/祭礼公演_曽我対面＋切られ与三/演目_切られ与三/2012_祭礼公演_曽我対面＋切られ与三_演目_切られ与三_079.jpg`, caption: ['与話情浮名横櫛', '「切られ与三」'], move: 'zoomIn', focus: { x: .5, y: .45 }, hold: 3.8 },
  { img: `${Y}/2013/祭礼公演_盛綱陣屋/2013_祭礼公演_盛綱陣屋_305.jpg`, lead: '平成二十五年', caption: ['近江源氏先陣館「盛綱陣屋」'], move: 'zoomOut', focus: { x: .5, y: .42 }, hold: 4.0 },
  { img: `${Y}/2014/祭礼公演_子ども白浪＋忠臣蔵七段目＋太功記/撮影者不明/演目_白浪五人男/2014_撮影者不明_演目_白浪五人男_015.jpg`, lead: '平成二十六年', caption: ['子ども歌舞伎「白浪五人男」'], move: 'zoomIn', focus: { x: .5, y: .42 }, hold: 3.7 },
  { img: `${Y}/2014/祭礼公演_子ども白浪＋忠臣蔵七段目＋太功記/猪島敏昭/演目_祇園一力/2014祇園一力茶屋 (38).jpg`, caption: ['仮名手本忠臣蔵 七段目'], move: 'zoomIn', focus: { x: .5, y: .4 }, hold: 3.7 },
  { img: `${Y}/2014/祭礼公演_子ども白浪＋忠臣蔵七段目＋太功記/撮影者不明/演目_太功記十段目/2014_撮影者不明_演目_太功記十段目_037.jpg`, caption: ['絵本太功記「尼崎閑居」'], move: 'zoomOut', focus: { x: .5, y: .42 }, hold: 3.7 },
  { img: `${Y}/2015/祭礼公演_子ども白浪＋箱根霊験記/演目_白浪五人男/IMGP1464.JPG`, lead: '平成二十七年', caption: ['子ども歌舞伎「白浪五人男」'], move: 'panRight', focus: { x: .5, y: .42 }, hold: 3.6 },
  { img: `${Y}/2015/祭礼公演_子ども白浪＋箱根霊験記/猪島敏昭/演目_箱根霊験記_滝壺/2015_猪島敏昭_演目_箱根霊験記_滝壺_113.jpg`, caption: ['箱根霊験記「瀧場」'], move: 'zoomIn', focus: { x: .5, y: .45 }, hold: 3.6 },
  { img: `${Y}/2016/祭礼公演_寺子屋/111_2831.jpg`, lead: '平成二十八年', caption: ['菅原伝授手習鑑「寺子屋」'], move: 'zoomOut', focus: { x: .5, y: .42 }, hold: 3.8 },
  { img: `${Y}/2017/祭礼公演_先代萩/猪島敏昭/Fuji/2017_祭礼公演_先代萩_猪島敏昭_075.jpg`, lead: '平成二十九年', caption: ['伽羅先代萩'], move: 'zoomIn', focus: { x: .5, y: .42 }, hold: 3.8 },
  { img: `${Y}/2018/祭礼公演_子ども白浪＋熊谷陣屋/奥村文乃/演目_白浪五人男/2018_奥村文乃_演目_白浪五人男_016.jpg`, lead: '平成三十年', caption: ['子ども歌舞伎「白浪五人男」'], move: 'panLeft', focus: { x: .5, y: .42 }, hold: 3.6 },
  { img: `${Y}/2018/祭礼公演_子ども白浪＋熊谷陣屋/奥村文乃/演目_熊谷陣屋/2018_奥村文乃_演目_熊谷陣屋_013.jpg`, caption: ['一谷嫩軍記「熊谷陣屋」'], move: 'zoomIn', focus: { x: .5, y: .42 }, hold: 3.6 },
  { img: `${Y}/2019/祭礼公演_伊勢音頭＋太功記/2019.9.21気良歌舞伎/③伊勢音頭恋寝刃/③伊勢音頭恋寝刃 (19).JPG`, lead: '令和元年', caption: ['伊勢音頭恋寝刃'], move: 'zoomOut', focus: { x: .5, y: .42 }, hold: 3.6 },
  { img: `${Y}/2019/祭礼公演_伊勢音頭＋太功記/2019.9.21気良歌舞伎/⑤絵本太功記十段目/⑤絵本太功記十段目 (136).JPG`, caption: ['絵本太功記「尼崎閑居」'], move: 'zoomIn', focus: { x: .5, y: .4 }, hold: 3.8 },

  // ── 章四　客席のない年 ────────────────────────
  { card: ['令和二年', '客席のない、秋。'], hold: 5.4 },
  { img: `${Y}/2020/おうちで歌舞伎_白浪五人男/650A0397.jpg`, caption: ['「撮影中の為、締め切り」'], move: 'zoomIn', focus: { x: .5, y: .5 }, hold: 4.4 },
  { img: `${Y}/2020/おうちで歌舞伎_白浪五人男/650A3874a.jpg`, caption: ['カメラが、客席にかわった'], move: 'panRight', focus: { x: .5, y: .5 }, hold: 4.8 },
  { img: `${Y}/2020/おうちで歌舞伎_白浪五人男/650A1648.jpg`, lead: '令和二年', caption: ['弁天娘女男白浪「浜松屋」'], move: 'zoomIn', focus: { x: .5, y: .42 }, hold: 4.6 },
  { img: `${Y}/2020/おうちで歌舞伎_白浪五人男/650A3206.jpg`, caption: ['無観客のまま、撮りきった'], move: 'zoomOut', focus: { x: .5, y: .42 }, hold: 4.6 },
  { img: `${Y}/2020/おうちで歌舞伎_その他/S__16703510.jpg`, caption: ['舞台は、茶の間に届いた'], move: 'panLeft', focus: { x: .5, y: .5 }, hold: 4.8 },
  { img: `${Y}/2020/おうちで歌舞伎_その他/S__16703542.jpg`, caption: ['おうちで歌舞伎'], move: 'zoomIn', focus: { x: .5, y: .5 }, hold: 4.6 },
  { card: ['令和三年', '通し狂言', '仮名手本忠臣蔵'], sub: '四夜連続の映像配信', hold: 5.6 },
  { img: `${Y}/2021/映像配信_忠臣蔵通し上演/2021_映像配信_忠臣蔵通し上演_091.jpg`, caption: ['カメラの前に、並んで立つ'], move: 'zoomIn', focus: { x: .5, y: .4 }, hold: 4.6 },
  { img: `${Y}/2021/映像配信_忠臣蔵通し上演/2021_映像配信_忠臣蔵通し上演_066.jpg`, caption: ['三段目、五・六段目、', '七段目、九段目'], move: 'zoomOut', focus: { x: .5, y: .38 }, hold: 4.6 },
  { img: `${Y}/2021/映像配信_忠臣蔵通し上演/2021_映像配信_忠臣蔵通し上演_142.jpg`, caption: ['四夜連続で配信した'], move: 'panRight', focus: { x: .5, y: .45 }, hold: 4.7 },
  { img: `${Y}/2021/映像配信_忠臣蔵通し上演/2021_映像配信_忠臣蔵通し上演_199.jpg`, caption: ['幕は開かない。', 'それでも、芝居は続いた'], move: 'zoomIn', focus: { x: .5, y: .45 }, hold: 5.0 },

  // ── 章五　気良座、こけら落とし ────────────────
  { card: ['令和六年', '気良座、', 'こけら落とし。'], sub: '復活から二十年', hold: 5.8 },
  { img: `${Y}/2024/気良座建設記録/2024_気良座建設記録_005.jpg`, caption: ['芝居小屋を、自分たちの手で'], move: 'zoomOut', focus: { x: .5, y: .5 }, hold: 4.6 },
  { img: `${Y}/2024/気良座建設記録/2024_気良座建設記録_001.jpg`, caption: ['本番の数日前まで、', '槌の音がしていた'], move: 'panRight', focus: { x: .5, y: .5 }, hold: 4.6 },
  { img: `${Y}/2024/気良座建設記録/2024_気良座建設記録_002.jpg`, caption: ['新調した提灯に、灯が入る'], move: 'zoomIn', focus: { x: .5, y: .5 }, hold: 4.6 },
  { img: `${Y}/2024/気良座建設記録/2024_気良座建設記録_006.jpg`, caption: ['この小屋を', '「気良座」と名づけた'], move: 'zoomOut', focus: { x: .5, y: .5 }, hold: 4.8 },
  { img: `${K24}/09_群衆_集合/2024_群衆_集合_001_地歌舞伎公演の受付風景.jpg`, caption: ['開演の五時間前から、', '人が来た'], move: 'panLeft', focus: { x: .5, y: .5 }, hold: 4.6 },
  { img: `${K24}/09_群衆_集合/2024_群衆_集合_002_夜の賑わい.jpg`, caption: ['芳名帳には、東京、名古屋、', '新潟、金沢——'], move: 'zoomIn', focus: { x: .5, y: .5 }, hold: 4.8 },
  { img: `${K24}/01_舞台全景/2024_舞台全景_005_傘を持つ役者たちの舞台.jpg`, lead: '令和六年', caption: ['幕開けは、二十年前と同じ', '『白浪五人男』'], move: 'zoomIn', focus: { x: .5, y: .42 }, hold: 4.8 },
  { img: `${K24}/02_見得/2024_見得_009_傘を持つ役者の見得.jpg`, caption: ['主役は、小学生の五人'], move: 'zoomIn', focus: { x: .5, y: .4 }, hold: 4.6 },
  { img: `${K24}/01_舞台全景/2024_舞台全景_010_地歌舞伎上演.jpg`, caption: ['客席から見た、', '二十年目の稲瀬川'], move: 'zoomOut', focus: { x: .42, y: .4 }, hold: 4.6 },
  { img: `${K24}/02_見得/2024_見得_035_槍を構える見得.jpg`, lead: '二幕目', caption: ['絵本太功記「尼崎閑居」'], move: 'zoomIn', focus: { x: .5, y: .4 }, hold: 4.6 },
  { img: `${P365}/030_2024_祇園一力茶屋_舞踊.jpg`, lead: '三幕目', caption: ['仮名手本忠臣蔵 七段目', '「祇園一力茶屋」'], move: 'zoomOut', focus: { x: .5, y: .4 }, hold: 4.6 },

  // ── 章六　いま ────────────────────────────────
  { card: ['令和七年', '五代目座長襲名披露'], hold: 5.4 },
  { img: `${Y}/2025/祭礼公演_曽我対面＋封印切＋白浪/寿曽我対面/01_舞台全景/2025_舞台全景_006_地歌舞伎の舞台.jpg`, caption: ['寿曽我対面'], move: 'zoomIn', focus: { x: .5, y: .45 }, hold: 4.5 },
  { img: `${Y}/2025/祭礼公演_曽我対面＋封印切＋白浪/封印切/01_原本/2025_封印切_0047.jpg`, caption: ['恋飛脚大和往来「封印切」'], move: 'zoomOut', focus: { x: .5, y: .42 }, hold: 4.5 },
  { img: `${Y}/2025/祭礼公演_曽我対面＋封印切＋白浪/白浪五人男/01_原本/2025_白浪五人男_0041.jpg`, caption: ['弁天娘女男白浪', '「稲瀬川勢揃い」'], move: 'zoomIn', focus: { x: .5, y: .45 }, hold: 4.7 },
  { img: `${Y}/2025/ぎふ清流座公演_封印切/01_舞台全景/2025_舞台全景_012_地歌舞伎の演技.jpg`, caption: ['気良を出て、ぎふ清流座へ'], move: 'panRight', focus: { x: .5, y: .45 }, hold: 4.5 },

  // ── 章七　締め ────────────────────────────────
  { card: ['令和八年', '曽根崎心中'], sub: '気良歌舞伎　初演', hold: 6.0 },
  { img: `${Y}/2025/祭礼公演_曽我対面＋封印切＋白浪/白浪五人男/01_原本/2025_白浪五人男_0043.jpg`, lead: '昨年', caption: ['稲瀬川に、五本の花が咲いた'], move: 'zoomIn', focus: { x: .5, y: .45 }, hold: 5.0 },
  { card: ['徳兵衛は、', '昨年の弁天小僧。', 'お初は、', '赤星十三郎。'], small: true, hold: 5.8 },
  { card: ['歌舞伎 × ＡＩ'], sub: '新世代による、新しい地歌舞伎', hold: 5.8 },
  { card: ['このあと　第三場', '天神の森'], hold: 6.6 },

  { black: 1.4 },
];

// --list: カット番号と中身の一覧を出して終わる（写真の差し替え相談用）
if (LIST) {
  let t = 0;
  BEATS.forEach((b, i) => {
    const d = b.black ?? b.hold;
    const at = `${String(Math.floor(t / 60))}:${String(Math.round(t % 60)).padStart(2, '0')}`;
    const what = b.black ? '（黒）'
      : b.card ? `札「${b.card.join('／')}」${b.sub ? ` ＋ ${b.sub}` : ''}`
        : `${b.lead ? `［${b.lead}］` : ''}${b.caption.join('')}  ←  ${b.img.replace('D:/気良歌舞伎/記録写真/', '')}`;
    console.log(`${String(i).padStart(2, '0')}  ${at}  ${d.toFixed(1)}s  ${what}`);
    t += d;
  });
  console.log(`\n合計 ${t.toFixed(1)}秒（オープニングを除く）／${BEATS.length - 2}カット`);
  process.exit(0);
}

const FONT = "'Noto Serif JP','Yu Mincho',serif";
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
const ENC = ['-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-r', String(FPS)];

// sharp も puppeteer も BMP を読めないので、先に PNG に起こす
const toReadable = (p) => {
  if (!/\.bmp$/i.test(p)) return p;
  const out = join(WORK, 'src_' + p.split('/').pop().replace(/\.[^.]+$/, '') + '.png');
  if (!existsSync(out)) ff(['-i', p, out]);
  return out;
};

// 写真は先に 1920×1080 に焼いておく（動きは ffmpeg 側で付ける）
async function bakePhoto(b, i) {
  const out = join(WORK, `ph${String(i).padStart(2, '0')}.png`);
  if (existsSync(out)) return out;
  const src = toReadable(b.img);
  if (!existsSync(src)) throw new Error(`写真が見つかりません: ${b.img}`);
  // 右パネル（960×1080）に合わせる。横位置の写真は高さいっぱいを使い、横を fx で切る
  const fx = b.focus?.x ?? 0.5, fy = b.focus?.y ?? 0.45;
  let img = sharp(src).rotate();
  const meta = await img.metadata();
  // rotate() 後の向きで測る（EXIFの回転があると metadata の幅高さは回す前の値）
  const sw = meta.orientation >= 5 ? meta.height : meta.width;
  const sh = meta.orientation >= 5 ? meta.width : meta.height;
  const scale = Math.max(PW / sw, PH / sh);
  const rw = Math.max(PW, Math.round(sw * scale)), rh = Math.max(PH, Math.round(sh * scale));
  const left = Math.round(Math.min(Math.max((rw - PW) * fx, 0), rw - PW));
  const top = Math.round(Math.min(Math.max((rh - PH) * fy, 0), rh - PH));
  img = img.resize(rw, rh, { kernel: 'lanczos3' }).extract({ left, top, width: PW, height: PH });
  if (b.mono) img = img.grayscale();
  await img.png().toFile(out);
  return out;
}

// ---- レイヤーPNG（透明） -----------------------------------------------------
const shell = (body, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;background:transparent;overflow:hidden}
.stage{position:relative;width:${W}px;height:${H}px}
${extra}
</style></head><body><div class="stage">${body}</div></body></html>`;

const CAP_CSS = `
.cap{position:absolute;left:88px;top:0;width:784px;height:${H}px;display:flex;flex-direction:column;
     justify-content:center;align-items:flex-start;color:#fff;font-family:${FONT}}
.cap .lead{font-size:40px;letter-spacing:.2em;opacity:.85;text-indent:.2em}
.cap .rule{width:96px;height:2px;background:rgba(255,255,255,.45);margin:26px 0 24px}
.cap .body{font-size:56px;font-weight:600;letter-spacing:.06em;line-height:1.4}
`;
// 札も左パネル。右パネルは真っ黒のまま（片側だけ文字が立つ）
const CARD_CSS = `
.card{position:absolute;left:88px;top:0;width:784px;height:${H}px;display:flex;flex-direction:column;
      align-items:flex-start;justify-content:center;color:#fff;font-family:${FONT}}
.card .ln{font-size:72px;font-weight:600;letter-spacing:.16em;line-height:1.56;text-indent:.16em}
.card .sm{font-size:60px;letter-spacing:.12em;line-height:1.7;text-indent:.12em}
.card .rule{width:110px;height:2px;background:rgba(255,255,255,.5);margin:30px 0 26px}
.card .sub{font-size:34px;letter-spacing:.22em;opacity:.82;text-indent:.22em}
`;
const VIG_CSS = `.vig{position:absolute;left:${PW}px;top:0;width:${PW}px;height:${H}px;background:radial-gradient(125% 92% at 50% 44%, rgba(0,0,0,0) 46%, rgba(0,0,0,.58) 100%)}`;

const browser = await puppeteer.launch({ headless: true, args: ['--font-render-hinting=none', '--force-color-profile=srgb'] });
const pg = await browser.newPage();
await pg.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
const shot = async (html, file, check) => {
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  let right = 0;
  if (check) {
    right = await pg.evaluate(() => {
      const r = document.createRange();
      let m = 0;
      for (const el of document.querySelectorAll('.ln,.sm,.sub,.lead,.body')) {
        r.selectNodeContents(el);
        for (const b of r.getClientRects()) m = Math.max(m, b.right);
      }
      return Math.ceil(m);
    });
  }
  writeFileSync(file, await pg.screenshot({ type: 'png', omitBackground: true }));
  return right;
};

const VIG = join(WORK, 'vig.png');
await shot(shell('<div class="vig"></div>', VIG_CSS), VIG, false);

const layers = [];
const over = [];
for (const [i, b] of BEATS.entries()) {
  const n = String(i).padStart(2, '0');
  if (b.black) { layers.push(null); continue; }
  let right;
  if (b.card) {
    const cls = b.small ? 'sm' : 'ln';
    const body = `<div class="card">${b.card.map(l => `<div class="${cls}">${l}</div>`).join('')}`
      + (b.sub ? `<div class="rule"></div><div class="sub">${b.sub}</div>` : '') + '</div>';
    const f = join(WORK, `cd${n}.png`);
    right = await shot(shell(body, CARD_CSS), f, true);
    layers.push({ kind: 'card', png: f });
  } else {
    const body = `<div class="cap">`
      + (b.lead ? `<div class="lead">${b.lead}</div><div class="rule"></div>` : '')
      + b.caption.map(l => `<div class="body">${l}</div>`).join('') + '</div>';
    const f = join(WORK, `cp${n}.png`);
    right = await shot(shell(body, CAP_CSS), f, true);
    layers.push({ kind: 'photo', png: f, photo: await bakePhoto(b, i) });
  }
  if (right > SAFE_R) over.push(`${i}(${right}px)`);
  process.stdout.write('.');
}
await browser.close();
console.log('\nレイヤー書き出し完了');
if (over.length) console.log(`!! 文字が ${SAFE_R}px を越えたカット: ${over.join(' ')}`);
else console.log(`文字はすべて左 ${SAFE_R}px 以内`);

// ---- 1カットずつ動画にする ---------------------------------------------------
// 動き: perspective で「写す範囲の四隅」を毎フレーム小数ピクセルで指定して補間する（zoompan だと整数丸めで揺れる）
function motionFilter(move, focus, frames) {
  const A = 0.09;
  const fx = focus?.x ?? 0.5, fy = focus?.y ?? 0.45;
  const P = `min(on/${Math.max(1, frames - 1)},1)`;
  let Z = null, left = null;
  switch (move) {
    case 'zoomIn': Z = `(1+${A}*${P})`; break;
    case 'zoomOut': Z = `(1+${A}-${A}*${P})`; break;
    case 'panRight': Z = `(1+${A})`; left = `clip((W-W/${Z})*(${fx}-0.5+${P}),0,W-W/${Z})`; break;
    case 'panLeft': Z = `(1+${A})`; left = `clip((W-W/${Z})*(${fx}+0.5-${P}),0,W-W/${Z})`; break;
    default: return '';
  }
  const L = left ?? `(W-W/${Z})*${fx}`;
  const T = `(H-H/${Z})*${fy}`;
  return `perspective=x0='${L}':y0='${T}':x1='${L}+W/${Z}':y1='${T}':x2='${L}':y2='${T}+H/${Z}':x3='${L}+W/${Z}':y3='${T}+H/${Z}'`
    + `:interpolation=cubic:eval=frame,`;
}

const segs = [];
BEATS.forEach((b, i) => {
  const n = String(i).padStart(2, '0');
  const dur = +((b.black ?? b.hold) + XF).toFixed(3);
  const out = join(WORK, `seg${n}.mp4`);
  segs.push({ file: out, dur });
  // --only=N,M は「そのカットだけ作り直す」。それ以外は既にあれば飛ばす（--keep と併用する）
  const force = ONLY ? ONLY.split(',').includes(String(i)) : false;
  if (!force && existsSync(out) && (KEEP || ONLY)) return;
  const L = layers[i];

  if (!L) {                       // 黒
    ff(['-f', 'lavfi', '-i', `color=c=black:s=${W}x${H}:r=${FPS}:d=${dur}`, ...ENC, out]);
  } else if (L.kind === 'card') { // 札: 黒地に文字を淡く浮かせ、最後は先に文字を消して黒に戻す
    const up = 20, inD = 0.9, outSt = (dur - XF - 0.7).toFixed(2);
    const fg = `[1:v]format=rgba,fade=t=in:st=0.15:d=${inD}:alpha=1,fade=t=out:st=${outSt}:d=0.7:alpha=1[t];`
      + `[0:v][t]overlay=x=0:y='if(lt(t,${(0.15 + inD).toFixed(2)}),${up}-${up}*min(1,max(0,(t-0.15)/${inD})),0)':format=auto[v]`;
    ff(['-f', 'lavfi', '-i', `color=c=black:s=${W}x${H}:r=${FPS}:d=${dur}`, '-loop', '1', '-t', String(dur), '-i', L.png,
      '-filter_complex', fg, '-map', '[v]', ...ENC, out]);
  } else {                        // 写真: 右パネルで動かす → 影 → 左パネルにテロップを滑り込ませる
    const frames = Math.round(dur * FPS);
    const bloom = b.bloom ? `hue=s='min(1,max(0,(t-0.25)/2.0))',` : '';
    const slide = 44, st = 0.6, sd = 1.1;
    const fg = `[1:v]setsar=1,format=yuv444p,${motionFilter(b.move, b.focus, frames)}${bloom}format=yuv420p,fps=${FPS}[ph];`
      + `[0:v][ph]overlay=${PW}:0[bg];`
      + `[bg][2:v]overlay=0:0:format=auto[bv];`
      // テロップは重なりに入る前に消す（前後のテロップが二重に見えないように）
      + `[3:v]format=rgba,fade=t=in:st=${st}:d=${(sd * 0.7).toFixed(2)}:alpha=1`
      + `,fade=t=out:st=${(dur - XF - 0.4).toFixed(2)}:d=0.55:alpha=1[cap];`
      + `[bv][cap]overlay=x='if(lt(t,${st}),-${slide},if(lt(t,${(st + sd).toFixed(2)}),-${slide}+${slide}*(t-${st})/${sd},0))':y=0:format=auto,format=yuv420p[v]`;
    ff(['-f', 'lavfi', '-i', `color=c=black:s=${W}x${H}:r=${FPS}:d=${dur}`,
      '-loop', '1', '-t', String(dur), '-i', L.photo,
      '-loop', '1', '-t', String(dur), '-i', VIG,
      '-loop', '1', '-t', String(dur), '-i', L.png,
      '-filter_complex', fg, '-map', '[v]', ...ENC, out]);
  }
  process.stdout.write(`${i} `);
});
console.log('\nカット書き出し完了');

// ---- xfade でつなぐ（入力が多いと重いので小分けにする） ----------------------
function xfadeList(items, out) {
  if (items.length === 1) return items[0];
  const inputs = items.flatMap(s => ['-i', s.file]);
  let fg = '', cur = '0:v', offset = 0;
  for (let i = 1; i < items.length; i++) {
    offset += items[i - 1].dur - XF;
    fg += `[${cur}][${i}:v]xfade=transition=fade:duration=${XF}:offset=${offset.toFixed(3)}[x${i}];`;
    cur = `x${i}`;
  }
  ff([...inputs, '-filter_complex', fg.replace(/;$/, ''), '-map', `[${cur}]`, ...ENC, out]);
  return { file: out, dur: +(items.reduce((a, s) => a + s.dur, 0) - XF * (items.length - 1)).toFixed(3) };
}

const GROUP = 12;
const groups = [];
for (let i = 0; i < segs.length; i += GROUP) {
  groups.push(xfadeList(segs.slice(i, i + GROUP), join(WORK, `grp${groups.length}.mp4`)));
  process.stdout.write(`g${groups.length} `);
}
let silent = xfadeList(groups, join(WORK, 'silent.mp4'));
console.log(`\n本編 ${silent.dur.toFixed(1)}秒 / ${BEATS.length - 2}カット`);

// ---- オープニングを頭に足す（ハードカットなので concat でつなぐ）-------------
const durOf = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
let OPEND = 0;
if (OP) {
  if (!existsSync(OP)) throw new Error(`オープニングが見つかりません: ${OP}`);
  OPEND = durOf(OP);
  const list = join(WORK, 'cat.txt');
  writeFileSync(list, [OP, silent.file].map(p => `file '${p}'`).join('\n'), 'utf8');
  const full = join(WORK, 'full.mp4');
  ff(['-f', 'concat', '-safe', '0', '-i', list, ...ENC, full]);
  silent = { file: full, dur: +(OPEND + silent.dur).toFixed(3) };
  console.log(`オープニング ${OPEND.toFixed(2)}秒 ＋ 本編 → 全体 ${silent.dur.toFixed(1)}秒`);
}

// ---- 音楽 -------------------------------------------------------------------
// OP=Neu Kabuki（OpenTracks）→ 平安ノ宵 → 悠久の時へ → 平安ノ宵の再現（甘茶）
if (NO_AUDIO) {
  ff(['-i', silent.file, '-c', 'copy', OUT]);
} else {
  const BGM = 'D:/気良歌舞伎/台本/曽根崎心中/output/軌跡/BGM';
  const NAVI = 'D:/気良歌舞伎/youtubeチャンネル用/超訳！歌舞伎ナビ/歌舞伎ナビ共通素材/BGM';
  const T0 = `${NAVI}/Neu_Kabuki.mp3`;
  const T1 = `${BGM}/平安ノ宵_甘茶.mp3`, T2 = `${BGM}/悠久の時へ_甘茶.mp3`;
  const d1 = durOf(T1), d2 = durOf(T2);
  const total = silent.dur, XA = 7, endFade = 9;
  const S1 = OP ? Math.max(0, OPEND - 2.0) : 0;     // OPの終わりに重ねて平安ノ宵へ
  // 2曲目に入る位置: 最後まで音が続くように後ろから決める（1曲目が尽きない範囲で）
  const need = total - d1 - d2 + XA + 2;
  const S2 = +Math.min(S1 + d1 - XA, Math.max(need, S1 + 50)).toFixed(2);
  const S3 = +(S2 + d2 - XA).toFixed(2);
  if (S3 + d1 < total) console.log(`!! 音楽が ${(total - S3 - d1).toFixed(1)}秒 足りない`);
  const seg = (idx, from, to, fin, fout, foutD) =>
    `[${idx}:a]atrim=0:${(to - from + 1).toFixed(2)},asetpts=N/SR/TB`
    + (from > 0 ? `,adelay=${Math.round(from * 1000)}:all=1` : '')
    + `,afade=t=in:st=${from.toFixed(2)}:d=${fin}`
    + `,afade=t=out:st=${fout.toFixed(2)}:d=${foutD}[a${idx}];`;
  let fg = '';
  const mix = [];
  if (OP) { fg += seg(1, 0, OPEND + 1, 0.3, OPEND - 1.4, 3.4); mix.push('[a1]'); }
  fg += seg(2, S1, S2 + XA, OP ? XA : 5, S2, XA); mix.push('[a2]');
  fg += seg(3, S2, S3 + XA, XA, S3, XA); mix.push('[a3]');
  fg += seg(4, S3, total + 1, XA, total - endFade - 1.2, endFade); mix.push('[a4]');
  fg += `${mix.join('')}amix=inputs=${mix.length}:normalize=0,volume=0.5,atrim=0:${total.toFixed(2)}[a]`;
  ff(['-i', silent.file, '-i', T0, '-i', T1, '-i', T2, '-i', T1, '-filter_complex', fg,
    '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k', OUT]);
  console.log(`BGM: ${OP ? 'Neu Kabuki →' : ''}平安ノ宵(${S1}秒) → 悠久の時へ(${S2}秒) → 平安ノ宵(${S3}秒)`);
}
console.log(`書き出し ${OUT}（約${silent.dur.toFixed(1)}秒・${BEATS.length - 2}カット＋OP）`);
