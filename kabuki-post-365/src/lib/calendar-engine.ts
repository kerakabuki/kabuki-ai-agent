import { DAY_THEMES, getSeason, CTA_DISTRIBUTION, FEATURES } from '../types';

// Special days
const SPECIAL_DAYS: Record<string, string> = {
  '01-01': '元旦',
  '02-20': '歌舞伎の日',
  '03-03': 'ひな祭り',
  '05-05': 'こどもの日',
  '07-07': '七夕',
  '11-03': '文化の日',
  '12-31': '大晦日',
};

export async function generateCalendar(db: D1Database, startDate: string): Promise<number> {
  const start = new Date(startDate + 'T00:00:00Z');

  // Load base URL for CTA links
  const baseUrlRow = await db.prepare(
    `SELECT value FROM settings WHERE key = 'kabuki_navi_base_url'`,
  ).first<{ value: string }>();
  const baseUrl = baseUrlRow?.value || 'https://kabukiplus.com';

  // Load available images
  const { results: images } = await db.prepare(
    'SELECT id, filename, season_tag, scene_type, character_id, usage_count FROM images ORDER BY usage_count ASC'
  ).all();

  // Load unused quizzes
  const { results: quizzes } = await db.prepare(
    'SELECT id FROM quiz_posts WHERE post_id IS NULL ORDER BY id ASC'
  ).all();

  // Track image usage for reuse interval
  const imageLastUsed: Map<number, number> = new Map();
  let quizIndex = 0;
  let featureIndex = 0;
  let sundayCount = 0;
  const posts: Array<Record<string, unknown>> = [];

  for (let day = 0; day < 365; day++) {
    const date = new Date(start.getTime() + day * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getUTCDay();
    const month = date.getUTCMonth() + 1;
    const monthDay = `${String(month).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    let theme = DAY_THEMES[dayOfWeek];
    const season = getSeason(month);
    const specialDay = SPECIAL_DAYS[monthDay] || null;
    let ctaType = CTA_DISTRIBUTION[dayOfWeek];

    // Every other Sunday → feature introduction (隔週日曜)
    let featureInfo: string | null = null;
    let featureOgpImage: string | null = null;
    if (dayOfWeek === 0) {
      sundayCount++;
      if (sundayCount % 4 === 0) {
        theme = '機能紹介';
        ctaType = 'F';
        const feature = FEATURES[featureIndex % FEATURES.length];
        featureInfo = JSON.stringify({
          name: feature.name, brand: feature.brand, path: feature.path,
          description: feature.description, highlights: feature.highlights,
          ogpImage: feature.ogpImage, imageAlt: feature.imageAlt, story: feature.story,
        });
        featureOgpImage = feature.ogpImage;
        featureIndex++;
      }
    }

    // Select image
    let selectedImageId: number | null = null;
    let selectedCharacterId: number | null = null;

    if (featureOgpImage && (images as Array<Record<string, unknown>>).length > 0) {
      // Feature posts: match by ogpImage filename
      const featureImg = (images as Array<Record<string, unknown>>).find(
        (img) => (img.filename as string) === featureOgpImage
      );
      if (featureImg) {
        selectedImageId = featureImg.id as number;
        selectedCharacterId = featureImg.character_id as number | null;
      }
    }

    if (!selectedImageId && (images as Array<Record<string, unknown>>).length > 0) {
      // Generic selection: season match or 通年, and 30-day reuse interval
      const candidates = (images as Array<Record<string, unknown>>).filter((img) => {
        const imgId = img.id as number;
        const lastUsedDay = imageLastUsed.get(imgId);
        if (lastUsedDay !== undefined && day - lastUsedDay < 30) return false;
        const tag = img.season_tag as string;
        return tag === season || tag === '通年' || !tag;
      });

      if (candidates.length > 0) {
        candidates.sort((a, b) => (a.usage_count as number) - (b.usage_count as number));
        const chosen = candidates[0];
        selectedImageId = chosen.id as number;
        selectedCharacterId = chosen.character_id as number | null;
        imageLastUsed.set(selectedImageId, day);
        (chosen as Record<string, unknown>).usage_count = (chosen.usage_count as number) + 1;
      }
    }

    // Build CTA URL: feature posts get feature-specific path, others get base URL
    let ctaUrl: string | null = null;
    if (ctaType === 'F' && theme === '機能紹介') {
      const feature = FEATURES[(featureIndex - 1 + FEATURES.length) % FEATURES.length];
      ctaUrl = `${baseUrl}${feature.path}`;
    } else if (ctaType !== 'N' && ctaType !== 'D') {
      ctaUrl = baseUrl;
    }

    posts.push({
      post_date: dateStr,
      day_of_week: dayOfWeek,
      theme,
      image_id: selectedImageId,
      character_id: selectedCharacterId,
      special_day: theme === '機能紹介' ? featureInfo : specialDay,
      cta_type: ctaType,
      cta_url: ctaUrl,
      status: 'draft',
    });
  }

  // Assign quizzes to Friday posts
  const fridayPosts = posts.filter(p => p.day_of_week === 5);
  for (const fp of fridayPosts) {
    if (quizIndex < (quizzes as unknown[]).length) {
      const quiz = quizzes[quizIndex] as Record<string, unknown>;
      // Link quiz to post after insert (we'll update post_id after batch insert)
      fp._quiz_id = quiz.id;
      quizIndex++;
    }
  }

  // Batch insert posts (groups of 50)
  const batchSize = 50;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const stmts = batch.map((p) =>
      db.prepare(
        `INSERT OR REPLACE INTO posts (post_date, day_of_week, theme, image_id, character_id, special_day, cta_type, cta_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(p.post_date, p.day_of_week, p.theme, p.image_id, p.character_id, p.special_day, p.cta_type, p.cta_url, p.status)
    );
    await db.batch(stmts);
  }

  // Update image usage counts
  if ((images as Array<Record<string, unknown>>).length > 0) {
    const usageStmts = (images as Array<Record<string, unknown>>)
      .filter(img => (img.usage_count as number) > 0)
      .map(img =>
        db.prepare('UPDATE images SET usage_count = ? WHERE id = ?').bind(img.usage_count, img.id)
      );
    for (let i = 0; i < usageStmts.length; i += batchSize) {
      await db.batch(usageStmts.slice(i, i + batchSize));
    }
  }

  // Link quizzes to their posts
  for (const fp of fridayPosts) {
    if (fp._quiz_id) {
      const insertedPost = await db.prepare('SELECT id FROM posts WHERE post_date = ?').bind(fp.post_date).first<{ id: number }>();
      if (insertedPost) {
        await db.prepare('UPDATE quiz_posts SET post_id = ? WHERE id = ?').bind(insertedPost.id, fp._quiz_id).run();
      }
    }
  }

  return posts.length;
}
