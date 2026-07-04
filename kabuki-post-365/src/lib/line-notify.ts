import type { Env } from '../types';

/**
 * 管理者のLINEにプッシュ通知を送る。
 * LINE_CHANNEL_ACCESS_TOKEN / LINE_ADMIN_USER_ID が未設定の場合は何もしない
 * （通知が止まっても投稿処理自体は継続させるため、エラーはログのみ）。
 */
export async function notifyAdmin(env: Env, text: string): Promise<boolean> {
  const token = env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = env.LINE_ADMIN_USER_ID;
  if (!token || !to) {
    console.log('[line-notify] LINE_CHANNEL_ACCESS_TOKEN / LINE_ADMIN_USER_ID 未設定のため通知スキップ');
    return false;
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text: text.slice(0, 4900) }],
      }),
    });
    if (!res.ok) {
      console.error(`[line-notify] Push failed: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[line-notify] Error:', (e as Error).message);
    return false;
  }
}
