/**
 * 白浪五人男の写真は、実データでは主に「稲瀬川勢揃い」として登録されている。
 * 今後「白浪五人男」「青砥稿花紅彩画」の表記で追加された写真も同じ優先枠に含める。
 */
const PREFERRED_IMAGE_PLAY_MARKERS = [
  '稲瀬川',
  '白浪五人男',
  '青砥稿花紅彩画',
] as const;

/** 優先写真を再利用するまでの最短間隔。10枚を約7割の比率で循環できる14日とする。 */
export const PREFERRED_IMAGE_REUSE_DAYS = 14;

/** D1の画像選定SQLで使う固定条件（外部入力は含まない）。 */
export const PREFERRED_IMAGE_PLAY_SQL = `(
  play_name LIKE '%稲瀬川%'
  OR play_name LIKE '%白浪五人男%'
  OR play_name LIKE '%青砥稿花紅彩画%'
)`;

export function isPreferredImagePlay(playName: unknown): boolean {
  if (typeof playName !== 'string') return false;
  return PREFERRED_IMAGE_PLAY_MARKERS.some((marker) => playName.includes(marker));
}
