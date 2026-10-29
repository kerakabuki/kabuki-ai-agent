import { getSession, loadGroupMembers, requireGroupRole } from "./auth.js";

export const ACCOUNTING_PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
  "Vary": "Cookie",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};

// 会計ではmasterにも対象団体への所属を要求する。既存の役割判定はその後に適用する。
export async function requireAccountingAccess(request, env, gid, minRole = "manager") {
  const session = await getSession(request, env);
  if (!session || !session.userId) return { ok: false, status: 401, error: "ログインが必要です。" };
  const members = await loadGroupMembers(env, gid);
  if (!Array.isArray(members) || !members.some(m => m && m.userId === session.userId && ["member", "manager"].includes(m.role))) {
    return { ok: false, status: 403, error: "この団体のメンバーではありません。" };
  }
  return requireGroupRole(request, env, gid, minRole);
}

export function accountingResponse(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(ACCOUNTING_PRIVATE_HEADERS)) headers.set(name, value);
  // 会計画面と原本は同一オリジンの既存セッションで利用する。
  headers.delete("Access-Control-Allow-Origin");
  headers.delete("Access-Control-Allow-Credentials");
  return new Response(response.body, { status: response.status, headers });
}

export function accountingJSON(data, status = 200) {
  return accountingResponse(new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json; charset=utf-8" },
  }));
}

export function accountingWriteAllowed(request) {
  const origin = request.headers.get("Origin");
  return (!origin || origin === new URL(request.url).origin) && request.headers.get("Sec-Fetch-Site") !== "cross-site";
}

// 過去のスキャン画像・証憑アップロードの命名も含む。外した証憑も公開へ戻さない。
export function isAccountingEvidenceFilename(filename) {
  return /^(receipt|evidence)-/i.test(filename);
}

// 既存の相対URLと公式サイト絶対URLを受け付け、所属団体の保護済み原本に限定する。
export function normalizeAccountingEvidenceURL(value, gid) {
  if (typeof value !== "string" || !value) return "";
  try {
    const url = new URL(value, "https://kabukiplus.com");
    if (!["https://kabukiplus.com", "https://www.kabukiplus.com"].includes(url.origin) || url.username || url.password) return "";
    const path = url.pathname.replace(/^\/en\//, "/");
    const match = path.match(/^\/api\/groups\/([a-zA-Z0-9_-]+)\/images\/((?:receipt|evidence)-[a-zA-Z0-9_.-]+)$/i);
    return match && match[1] === gid ? path : "";
  } catch { return ""; }
}

export function validAccountingEvidenceReferences(expenses, gid) {
  return Array.isArray(expenses) && expenses.every(entry => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    if (entry.receipt_url && !normalizeAccountingEvidenceURL(entry.receipt_url, gid)) return false;
    if (entry.receipt_urls !== undefined && (!Array.isArray(entry.receipt_urls) || !entry.receipt_urls.every(url => normalizeAccountingEvidenceURL(url, gid)))) return false;
    return true;
  });
}
