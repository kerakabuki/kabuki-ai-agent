// CSV export with UTF-8 BOM for Excel compatibility

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function generateCsv(posts: Array<Record<string, unknown>>, platform: string): string {
  // UTF-8 BOM
  const bom = '\uFEFF';

  // Column headers based on platform
  let headers: string[];
  if (platform === 'all') {
    headers = [
      '日付', '曜日', 'テーマ', 'キャラクター名', '画像ファイル名',
      'Instagram本文', 'Instagramハッシュタグ',
      'X本文', 'Xハッシュタグ',
      'Facebook本文', 'Facebookハッシュタグ',
      'CTA URL', 'ステータス',
    ];
  } else {
    headers = [
      '日付', '曜日', 'テーマ', 'キャラクター名', '画像ファイル名',
      `${platform}本文`, `${platform}ハッシュタグ`,
      'CTA URL', 'ステータス',
    ];
  }

  const rows: string[] = [headers.map(escapeCsv).join(',')];

  for (const post of posts) {
    let row: string[];
    const dayName = DAY_NAMES[post.day_of_week as number] || '';

    if (platform === 'all') {
      row = [
        escapeCsv(post.post_date),
        escapeCsv(dayName),
        escapeCsv(post.theme),
        escapeCsv(post.character_name),
        escapeCsv(post.image_filename),
        escapeCsv(post.instagram_text),
        escapeCsv(post.instagram_hashtags),
        escapeCsv(post.x_text),
        escapeCsv(post.x_hashtags),
        escapeCsv(post.facebook_text),
        escapeCsv(post.facebook_hashtags),
        escapeCsv(post.cta_url),
        escapeCsv(post.status),
      ];
    } else {
      row = [
        escapeCsv(post.post_date),
        escapeCsv(dayName),
        escapeCsv(post.theme),
        escapeCsv(post.character_name),
        escapeCsv(post.image_filename),
        escapeCsv(post[`${platform}_text`]),
        escapeCsv(post[`${platform}_hashtags`]),
        escapeCsv(post.cta_url),
        escapeCsv(post.status),
      ];
    }

    rows.push(row.join(','));
  }

  return bom + rows.join('\r\n');
}
