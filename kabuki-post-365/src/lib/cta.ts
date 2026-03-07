// CTA template engine
// Types: A (details), B (performance info), C (experience), D (quiz teaser), E (custom), F (feature), N (none)

const CTA_TEMPLATES: Record<string, Record<string, string>> = {
  A: {
    instagram: '歌舞伎のこと、もっと知りたくなったらプロフィールのリンクへ🎭',
    x: '歌舞伎のこと、もっと知りたくなったら→ {url} 🎭',
    facebook: '歌舞伎のこと、もっと知りたくなったらプロフィールのリンクへ🎭',
  },
  B: {
    instagram: '今月の公演情報もまとめています→プロフィールのリンクから🎭',
    x: '今月の公演情報もまとめています→ {url} 🎭',
    facebook: '今月の公演情報もまとめています→プロフィールのリンクから🎭',
  },
  C: {
    instagram: '一緒に歌舞伎の世界を楽しみましょう🎭 リンクはプロフィールから',
    x: '一緒に歌舞伎の世界を楽しみましょう🎭 {url}',
    facebook: '一緒に歌舞伎の世界を楽しみましょう🎭 リンクはプロフィールから',
  },
  D: {
    instagram: '',
    x: '',
    facebook: '',
  },
  E: {
    instagram: '',
    x: '',
    facebook: '',
  },
  F: {
    instagram: '気になった方はプロフィールのリンクからどうぞ🎭',
    x: '気になった方はこちらからどうぞ🎭 {url}',
    facebook: '気になった方はプロフィールのリンクからどうぞ🎭',
  },
  N: {
    instagram: '',
    x: '',
    facebook: '',
  },
};

export function buildCtaText(
  ctaType: string,
  settings: Record<string, string>,
  platform?: string
): string {
  const type = ctaType.toUpperCase();
  const templates = CTA_TEMPLATES[type] || CTA_TEMPLATES.A;
  const baseUrl = settings.kabuki_navi_base_url || 'https://kabukiplus.com';

  // Use platform-specific URL when available, fallback to base URL
  const platformUrls: Record<string, string> = {
    instagram: baseUrl, // Instagram doesn't support links in posts
    x: settings.sns_x ? baseUrl : baseUrl,
    facebook: settings.sns_facebook ? baseUrl : baseUrl,
  };

  if (platform) {
    const url = platformUrls[platform] || baseUrl;
    return templates[platform]?.replace('{url}', url) || '';
  }

  // Return all as summary
  return Object.values(templates)
    .filter(Boolean)
    .map(t => t.replace('{url}', baseUrl))
    .join(' / ');
}

export function getCtaTypes(): Array<{ value: string; label: string }> {
  return [
    { value: 'A', label: '詳しく知る' },
    { value: 'B', label: '公演情報' },
    { value: 'C', label: '歌舞伎を楽しむ' },
    { value: 'D', label: 'クイズ予告' },
    { value: 'E', label: 'カスタム' },
    { value: 'F', label: '機能紹介' },
    { value: 'N', label: 'なし' },
  ];
}
