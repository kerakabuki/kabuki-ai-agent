// 個別の白浪五人男を来場記念カードとして配布。集合NFTの特典画像は含めない。
export const GIFT_PATH = '/kerakabuki/reception/2026/cards/shiranami-v1';
export const GIFT_OBJECT_PREFIX = 'reception/2026/shiranami-v1';
export const receptionGifts = [
  { id: 'benten', name: '弁天小僧 菊之助', reading: 'べんてんこぞう きくのすけ' },
  { id: 'rihei', name: '忠信 利平', reading: 'ただのぶ りへい' },
  { id: 'akahoshi', name: '赤星 十三郎', reading: 'あかぼし じゅうざぶろう' },
  { id: 'nango', name: '南郷 力丸', reading: 'なんごう りきまる' },
  { id: 'daemon', name: '日本 駄右衛門', reading: 'にっぽん だえもん' },
];

export function giftFilename(gift) {
  return '令和八年_気良歌舞伎_ご来場記念_' + gift.name.replaceAll(' ', '') + '.png';
}

// 既存のSVG記念カードを拡張した組版テンプレート。絵柄を切り抜かず、記念表記を枠外に添える。
export function shiranamiCardSVG(sourceDataURL) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="724" height="1244" viewBox="0 0 724 1244">
  <rect width="724" height="1244" fill="#f6f2e9"/>
  <image x="0" y="0" width="724" height="1024" xlink:href="${sourceDataURL}"/>
  <rect y="1024" width="241" height="7" fill="#232c32"/><rect x="241" y="1024" width="242" height="7" fill="#963e3a"/><rect x="483" y="1024" width="241" height="7" fill="#60775e"/>
  <g text-anchor="middle" font-family="'BIZ UDGothic','Yu Gothic',sans-serif" fill="#262c34">
    <text x="362" y="1079" font-size="27">令和八年 気良歌舞伎</text>
    <text x="362" y="1135" font-size="43" font-weight="bold" letter-spacing="4">ご来場記念</text>
    <text x="362" y="1179" font-size="21">2026年9月26日</text>
    <text x="362" y="1215" font-size="15" fill="#626872" letter-spacing="1">KERAKABUKI · kabukiplus.com</text>
  </g></svg>`;
}
