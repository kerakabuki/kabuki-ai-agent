// src/auth.js
// =========================================================
// 認証: LINE Login + Google Sign-In + セッション管理
// アカウントリンク: 同一メールアドレスならデータ共有
// =========================================================
//
// ── Permission Matrix ──────────────────────────────────────
//
// Role        Scope    Capabilities
// ----------  -------  -------------------------------------------
// master      global   All operations. Bypasses all group checks.
//                      Group creation approval, editor management,
//                      author migration, data backfill.
// editor      global   Enmoku (play guide) content: create & edit.
//                      NOT group-scoped — an editor can edit any
//                      enmoku regardless of group membership.
// manager     group    Group operations: approve/reject members,
//                      change roles, update group profile, manage
//                      scripts (upload/delete/edit metadata).
// member      group    Read group content (notes, scripts, training).
//                      Upload scripts. Post notes.
//
// Account linking: email-based. Same email = same canonical userId.
// Audit log written to KV account_link_log:{userId} on every link event.
// ────────────────────────────────────────────────────────────

const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
const SESSION_COOKIE = "kl_session";

// ─── アカウントリンク: メールベースの userId 解決 ───
// 同じメールアドレスなら同じ userId を返す
async function resolveUserId(env, email, providerUserId, providerName) {
  if (!email) return providerUserId;

  const emailKey = `email_link:${email.toLowerCase()}`;
  try {
    const existing = await env.CHAT_HISTORY.get(emailKey);
    if (existing) {
      const link = JSON.parse(existing);
      if (!link.providers.includes(providerUserId)) {
        link.providers.push(providerUserId);
        link.updated_at = new Date().toISOString();
        await env.CHAT_HISTORY.put(emailKey, JSON.stringify(link));

        await writeAccountLinkLog(env, link.canonicalUserId, {
          event: "link_added",
          newProvider: providerUserId,
          providerName: providerName || "unknown",
          email: email.toLowerCase(),
          allProviders: link.providers,
        });
      }
      return link.canonicalUserId;
    } else {
      const link = {
        canonicalUserId: providerUserId,
        email: email.toLowerCase(),
        providers: [providerUserId],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await env.CHAT_HISTORY.put(emailKey, JSON.stringify(link));

      await writeAccountLinkLog(env, providerUserId, {
        event: "account_created",
        providerName: providerName || "unknown",
        email: email.toLowerCase(),
      });
      return providerUserId;
    }
  } catch (e) {
    console.error("resolveUserId error:", e);
    return providerUserId;
  }
}

async function writeAccountLinkLog(env, userId, entry) {
  try {
    const logKey = `account_link_log:${userId}`;
    const raw = await env.CHAT_HISTORY.get(logKey);
    const logs = raw ? JSON.parse(raw) : [];
    logs.push({ ...entry, timestamp: new Date().toISOString() });
    if (logs.length > 50) logs.splice(0, logs.length - 50);
    await env.CHAT_HISTORY.put(logKey, JSON.stringify(logs));
  } catch (e) {
    console.error("writeAccountLinkLog error:", e);
  }
}

// ─── LINE Login: 認可リダイレクト ───
function lineLoginRedirect(env, request) {
  const channelId = env.LINE_LOGIN_CHANNEL_ID;
  if (!channelId) {
    return new Response("LINE Login not configured", { status: 500 });
  }
  const url = new URL(request.url);
  const callbackUrl = `${url.origin}/auth/line/callback`;
  const state = crypto.randomUUID();

  // ログイン前のページに戻るための returnTo を保存
  const fromRaw = url.searchParams.get("from") || "/";
  let returnTo = "/";
  try {
    const decoded = decodeURIComponent(fromRaw);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) returnTo = decoded;
  } catch (_) {}

  const authUrl = new URL(LINE_AUTH_URL);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", channelId);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", "profile openid email");

  const headers = new Headers({ Location: authUrl.toString() });
  headers.append(
    "Set-Cookie",
    `kl_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  headers.append(
    "Set-Cookie",
    `kl_oauth_from=${encodeURIComponent(returnTo)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  return new Response(null, { status: 302, headers });
}

// ─── LINE Login: コールバック処理 ───
async function lineLoginCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  // state 検証
  const cookies = parseCookies(request);
  const expectedState = cookies["kl_oauth_state"];
  if (!expectedState || expectedState !== state) {
    return new Response("Invalid state", { status: 403 });
  }

  const channelId = env.LINE_LOGIN_CHANNEL_ID;
  const channelSecret = env.LINE_LOGIN_CHANNEL_SECRET;
  if (!channelId || !channelSecret) {
    return new Response("LINE Login not configured", { status: 500 });
  }

  const callbackUrl = `${url.origin}/auth/line/callback`;

  // code → access_token + id_token
  const tokenRes = await fetch(LINE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      client_id: channelId,
      client_secret: channelSecret,
    }),
  });
  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("LINE token exchange failed:", errText);
    return new Response("LINE login failed", { status: 500 });
  }
  const tokenData = await tokenRes.json();

  // id_token からメールアドレスを取得
  let lineEmail = "";
  if (tokenData.id_token) {
    try {
      const idPayload = decodeJwtPayload(tokenData.id_token);
      lineEmail = idPayload.email || "";
    } catch (e) {
      console.error("LINE id_token decode error:", e);
    }
  }

  // access_token → profile
  const profileRes = await fetch(LINE_PROFILE_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileRes.ok) {
    return new Response("Failed to get LINE profile", { status: 500 });
  }
  const profile = await profileRes.json();

  // アカウントリンク: メールで userId を解決
  const providerUserId = `line_${profile.userId}`;
  const canonicalUserId = await resolveUserId(env, lineEmail, providerUserId, "line");

  // セッション作成
  const userInfo = {
    userId: canonicalUserId,
    provider: "line",
    displayName: profile.displayName || "",
    pictureUrl: profile.pictureUrl || "",
    email: lineEmail,
  };

  const sessionToken = await createSession(env, userInfo);

  // ログイン前のページに戻る（kl_oauth_from クッキーがあればそこへ、なければトップ）
  let returnTo = "/";
  try {
    const fromCookie = cookies["kl_oauth_from"];
    if (fromCookie) {
      const decoded = decodeURIComponent(fromCookie);
      if (decoded.startsWith("/") && !decoded.startsWith("//")) returnTo = decoded;
    }
  } catch (_) {}

  const resHeaders = new Headers({ Location: returnTo });
  resHeaders.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`
  );
  // oauth 用の一時 Cookie をすべて消す
  resHeaders.append(
    "Set-Cookie",
    `kl_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
  resHeaders.append(
    "Set-Cookie",
    `kl_oauth_from=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
  return new Response(null, { status: 302, headers: resHeaders });
}

// ─── Google Sign-In: JWT 検証 ───
function decodeJwtPayload(jwt) {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  // base64url → base64 → decode
  let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function verifyGoogleToken(request, env) {
  try {
    const body = await request.json();
    const credential = body.credential;
    if (!credential) {
      return jsonResponse({ error: "Missing credential" }, 400);
    }

    // JWT ペイロードをデコード
    let payload;
    try {
      payload = decodeJwtPayload(credential);
    } catch (e) {
      console.error("JWT decode error:", e);
      return jsonResponse({ error: "Invalid token format" }, 401);
    }

    // 発行者チェック
    const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
    if (!validIssuers.includes(payload.iss)) {
      return jsonResponse({ error: "Invalid token issuer" }, 401);
    }

    // aud がクライアント ID と一致するか検証（clientId 未設定は拒否）
    const clientId = env.GOOGLE_CLIENT_ID;
    if (!clientId || payload.aud !== clientId) {
      console.error("Audience mismatch or GOOGLE_CLIENT_ID not configured");
      return jsonResponse({ error: "Token audience mismatch" }, 401);
    }

    // 有効期限チェック（exp フィールドがない場合も拒否）
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return jsonResponse({ error: "Token expired" }, 401);
    }

    // アカウントリンク: メールで userId を解決
    const providerUserId = `google_${payload.sub}`;
    const googleEmail = payload.email || "";
    const canonicalUserId = await resolveUserId(env, googleEmail, providerUserId, "google");

    // セッション作成
    const userInfo = {
      userId: canonicalUserId,
      provider: "google",
      displayName: payload.name || payload.email || "",
      pictureUrl: payload.picture || "",
      email: googleEmail,
    };

    const sessionToken = await createSession(env, userInfo);

    const headers = new Headers({
      "Content-Type": "application/json",
    });
    headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`
    );

    return new Response(
      JSON.stringify({ ok: true, user: { displayName: userInfo.displayName, pictureUrl: userInfo.pictureUrl, provider: "google" } }),
      { status: 200, headers }
    );
  } catch (e) {
    console.error("Google verify error:", e);
    return jsonResponse({ error: "Verification failed: " + String(e.message || e) }, 500);
  }
}

// ─── セッション管理 ───
async function createSession(env, userInfo) {
  const token = crypto.randomUUID();
  const session = {
    ...userInfo,
    createdAt: new Date().toISOString(),
  };
  await env.CHAT_HISTORY.put(`session:${token}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL,
  });
  return token;
}

async function getSession(request, env) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  try {
    const raw = await env.CHAT_HISTORY.get(`session:${token}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function destroySession(request, env) {
  const cookies = parseCookies(request);
  const token = cookies[SESSION_COOKIE];
  if (token) {
    await env.CHAT_HISTORY.delete(`session:${token}`);
  }
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

// ─── マスター権限 ───
const MASTER_KV_KEY = "master_users";

async function loadMasterUsers(env) {
  try {
    const raw = await env.CHAT_HISTORY.get(MASTER_KV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function checkIsMaster(env, userId) {
  const masters = await loadMasterUsers(env);
  return masters.includes(userId);
}

// ─── 団体メンバーシップ管理 ───
const ROLE_HIERARCHY = { manager: 2, member: 1 };

async function loadGroupMembers(env, groupId) {
  try {
    const raw = await env.CHAT_HISTORY.get(`group_members:${groupId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveGroupMembers(env, groupId, members) {
  await env.CHAT_HISTORY.put(`group_members:${groupId}`, JSON.stringify(members));
}

async function getGroupRole(env, userId, groupId) {
  const members = await loadGroupMembers(env, groupId);
  const member = members.find(m => m.userId === userId);
  return member ? member.role : null;
}

async function requireGroupRole(request, env, groupId, minRole) {
  const session = await getSession(request, env);
  if (!session) return { ok: false, status: 401, error: "ログインが必要です" };

  const master = await checkIsMaster(env, session.userId);
  if (master) return { ok: true, session, role: "master" };

  const role = await getGroupRole(env, session.userId, groupId);
  if (!role) return { ok: false, status: 403, error: "この団体のメンバーではありません" };

  const minLevel = ROLE_HIERARCHY[minRole] || 0;
  const userLevel = ROLE_HIERARCHY[role] || 0;
  if (userLevel < minLevel) return { ok: false, status: 403, error: "権限が不足しています" };

  return { ok: true, session, role };
}

// 団体参加申請
async function requestGroupJoin(request, env, groupId) {
  const session = await getSession(request, env);
  if (!session) return jsonResponse({ error: "ログインが必要です" }, 401);

  const members = await loadGroupMembers(env, groupId);
  if (members.some(m => m.userId === session.userId)) {
    return jsonResponse({ ok: true, status: "already_member" });
  }

  const reqKey = `group_join_request:${groupId}:${session.userId}`;
  const existing = await env.CHAT_HISTORY.get(reqKey);
  if (existing) return jsonResponse({ ok: true, status: "already_requested" });

  await env.CHAT_HISTORY.put(reqKey, JSON.stringify({
    userId: session.userId,
    displayName: session.displayName || "",
    email: session.email || "",
    provider: session.provider || "",
    pictureUrl: session.pictureUrl || "",
    groupId,
    requestedAt: new Date().toISOString(),
  }), { expirationTtl: 60 * 60 * 24 * 365 });

  return jsonResponse({
    ok: true,
    status: "requested",
    displayName: session.displayName || "",
    email: session.email || "",
  });
}

// 団体参加申請一覧
async function listGroupJoinRequests(env, groupId) {
  const list = await env.CHAT_HISTORY.list({ prefix: `group_join_request:${groupId}:` });
  const requests = [];
  for (const key of list.keys) {
    const raw = await env.CHAT_HISTORY.get(key.name);
    if (raw) requests.push(JSON.parse(raw));
  }
  return requests;
}

// 団体メンバー承認
async function approveGroupMember(env, groupId, userId, displayName, pictureUrl) {
  const members = await loadGroupMembers(env, groupId);
  if (!members.some(m => m.userId === userId)) {
    members.push({
      userId,
      displayName: displayName || "",
      pictureUrl: pictureUrl || "",
      role: "member",
      joinedAt: new Date().toISOString(),
    });
    await saveGroupMembers(env, groupId, members);
  }
  await env.CHAT_HISTORY.delete(`group_join_request:${groupId}:${userId}`);
  return members;
}

// 団体メンバー役割変更
async function changeGroupMemberRole(env, groupId, userId, newRole) {
  if (!ROLE_HIERARCHY[newRole]) return null;
  const members = await loadGroupMembers(env, groupId);
  const member = members.find(m => m.userId === userId);
  if (!member) return null;
  member.role = newRole;
  await saveGroupMembers(env, groupId, members);
  return members;
}

// 団体メンバー除名
async function removeGroupMember(env, groupId, userId) {
  const members = await loadGroupMembers(env, groupId);
  const filtered = members.filter(m => m.userId !== userId);
  await saveGroupMembers(env, groupId, filtered);
  return filtered;
}

// ユーザーの所属団体一覧を取得
async function getUserGroups(env, userId) {
  const list = await env.CHAT_HISTORY.list({ prefix: "group_members:" });
  const groups = [];
  for (const key of list.keys) {
    const gid = key.name.replace("group_members:", "");
    const raw = await env.CHAT_HISTORY.get(key.name);
    if (!raw) continue;
    const members = JSON.parse(raw);
    const me = members.find(m => m.userId === userId);
    if (me) groups.push({ groupId: gid, role: me.role });
  }
  return groups;
}

// ─── エディター権限管理 ───
const EDITORS_KV_KEY = "approved_editors";

async function loadApprovedEditors(env) {
  try {
    const raw = await env.CHAT_HISTORY.get(EDITORS_KV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveApprovedEditors(env, editors) {
  await env.CHAT_HISTORY.put(EDITORS_KV_KEY, JSON.stringify(editors));
}

async function isEditor(request, env) {
  const session = await getSession(request, env);
  if (!session || !session.userId) return false;
  const editors = await loadApprovedEditors(env);
  return editors.some(e => e.userId === session.userId);
}

async function requireEditor(request, env) {
  const session = await getSession(request, env);
  if (!session) return { ok: false, status: 401, error: "ログインが必要です" };
  const master = await checkIsMaster(env, session.userId);
  if (master) return { ok: true, session };
  const editors = await loadApprovedEditors(env);
  const approved = editors.some(e => e.userId === session.userId);
  if (!approved) return { ok: false, status: 403, error: "編集権限がありません" };
  return { ok: true, session };
}

// 編集権限の申請
async function requestEditorAccess(request, env) {
  const session = await getSession(request, env);
  if (!session) return jsonResponse({ error: "ログインが必要です" }, 401);

  const reqKey = `editor_request:${session.userId}`;
  const existing = await env.CHAT_HISTORY.get(reqKey);
  if (existing) return jsonResponse({ ok: true, status: "already_requested" });

  const editors = await loadApprovedEditors(env);
  if (editors.some(e => e.userId === session.userId)) {
    return jsonResponse({ ok: true, status: "already_approved" });
  }

  await env.CHAT_HISTORY.put(reqKey, JSON.stringify({
    userId: session.userId,
    displayName: session.displayName || "",
    email: session.email || "",
    provider: session.provider || "",
    requestedAt: new Date().toISOString(),
  }), { expirationTtl: 60 * 60 * 24 * 365 });

  return jsonResponse({
    ok: true,
    status: "requested",
    displayName: session.displayName || "",
    email: session.email || "",
  });
}

// 管理用: 申請一覧
async function listEditorRequests(request, env) {
  const list = await env.CHAT_HISTORY.list({ prefix: "editor_request:" });
  const requests = [];
  for (const key of list.keys) {
    const raw = await env.CHAT_HISTORY.get(key.name);
    if (raw) requests.push(JSON.parse(raw));
  }
  const editors = await loadApprovedEditors(env);
  return jsonResponse({ requests, editors });
}

// 管理用: 承認
async function approveEditor(request, env) {
  const body = await request.json();
  const { userId, displayName } = body;
  if (!userId) return jsonResponse({ error: "userId is required" }, 400);

  const editors = await loadApprovedEditors(env);
  if (!editors.some(e => e.userId === userId)) {
    editors.push({
      userId,
      displayName: displayName || "",
      approvedAt: new Date().toISOString(),
    });
    await saveApprovedEditors(env, editors);
  }

  await env.CHAT_HISTORY.delete(`editor_request:${userId}`);
  return jsonResponse({ ok: true, editors });
}

// 管理用: 権限取消
async function revokeEditor(request, env) {
  const body = await request.json();
  const { userId } = body;
  if (!userId) return jsonResponse({ error: "userId is required" }, 400);

  const editors = await loadApprovedEditors(env);
  const filtered = editors.filter(e => e.userId !== userId);
  await saveApprovedEditors(env, filtered);
  return jsonResponse({ ok: true, editors: filtered });
}

// ─── /api/auth/me: セッション情報返却 ───
async function authMe(request, env) {
  const session = await getSession(request, env);
  if (!session) {
    return jsonResponse({ loggedIn: false });
  }

  // リンク済みプロバイダー情報を取得
  let linkedProviders = [];
  if (session.email) {
    try {
      const emailKey = `email_link:${session.email.toLowerCase()}`;
      const raw = await env.CHAT_HISTORY.get(emailKey);
      if (raw) {
        const link = JSON.parse(raw);
        linkedProviders = link.providers || [];
      }
    } catch (_) { /* ignore */ }
  }

  // マスター判定
  const masterFlag = await checkIsMaster(env, session.userId);

  // エディター権限チェック（マスターは自動エディター）
  const editors = await loadApprovedEditors(env);
  const editorApproved = masterFlag || editors.some(e => e.userId === session.userId);

  // 申請中かチェック
  let editorRequested = false;
  if (!editorApproved) {
    const reqRaw = await env.CHAT_HISTORY.get(`editor_request:${session.userId}`);
    editorRequested = !!reqRaw;
  }

  // 所属団体リスト
  const groups = await getUserGroups(env, session.userId);

  return jsonResponse({
    loggedIn: true,
    user: {
      userId: session.userId,
      displayName: session.displayName,
      pictureUrl: session.pictureUrl,
      provider: session.provider,
      email: session.email || "",
      linkedProviders,
      isMaster: masterFlag,
      isEditor: editorApproved,
      editorRequested,
      groups,
    },
  });
}

// ─── データ移行: localStorage → KV ───
async function migrateUserData(request, env) {
  const session = await getSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in" }, 401);

  const body = await request.json();
  const userId = session.userId;
  const kvKey = `userdata:${userId}`;

  // 既存のサーバーデータを読む
  let existing = null;
  try {
    const raw = await env.CHAT_HISTORY.get(kvKey);
    if (raw) existing = JSON.parse(raw);
  } catch {}

  // マージロジック
  const merged = mergeData(existing, body);
  merged.updated_at = new Date().toISOString();

  await env.CHAT_HISTORY.put(kvKey, JSON.stringify(merged));
  return jsonResponse({ ok: true, message: "Data migrated" });
}

function mergeData(server, local) {
  if (!server) {
    return {
      theater_log: local.theater_log_v1 || { v: 1, entries: [] },
      learning_log: local.keranosuke_log_v1 || null,
      favorite_actors: local.favorite_actors_v1 || [],
      quiz_state: local.keranosuke_quiz_state || null,
    };
  }

  // theater_log: エントリを ID で重複排除してマージ
  const sEntries = (server.theater_log && server.theater_log.entries) || [];
  const lEntries = (local.theater_log_v1 && local.theater_log_v1.entries) || [];
  const idSet = new Set(sEntries.map((e) => e.id));
  for (const e of lEntries) {
    if (!idSet.has(e.id)) sEntries.push(e);
  }
  sEntries.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

  // favorite_actors: 和集合
  const sFav = server.favorite_actors || [];
  const lFav = local.favorite_actors_v1 || [];
  const favSet = new Set([...sFav, ...lFav]);

  // learning_log: local が新しければ置き換え
  let learningLog = server.learning_log;
  if (local.keranosuke_log_v1) {
    const sTs = (server.learning_log && server.learning_log.updated_at) || 0;
    const lTs = local.keranosuke_log_v1.updated_at || 0;
    if (lTs >= sTs) learningLog = local.keranosuke_log_v1;
  }

  // quiz_state: answered_total が多い方を採用
  let quiz = server.quiz_state;
  if (local.keranosuke_quiz_state) {
    const sTotal = (quiz && quiz.answered_total) || 0;
    const lTotal = local.keranosuke_quiz_state.answered_total || 0;
    if (lTotal > sTotal) quiz = local.keranosuke_quiz_state;
  }

  return {
    theater_log: { v: 1, entries: sEntries },
    learning_log: learningLog,
    favorite_actors: [...favSet],
    quiz_state: quiz,
  };
}

// ─── ユーザーデータ CRUD ───
async function getUserData(request, env) {
  const session = await getSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in" }, 401);

  const kvKey = `userdata:${session.userId}`;
  try {
    const raw = await env.CHAT_HISTORY.get(kvKey);
    if (!raw) {
      return jsonResponse({
        theater_log: { v: 1, entries: [] },
        learning_log: null,
        favorite_actors: [],
        quiz_state: null,
        updated_at: null,
      });
    }
    return jsonResponse(JSON.parse(raw));
  } catch (e) {
    return jsonResponse({ error: "Failed to read data" }, 500);
  }
}

async function putUserData(request, env) {
  const session = await getSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in" }, 401);

  const kvKey = `userdata:${session.userId}`;
  const body = await request.json();
  body.updated_at = new Date().toISOString();

  const MAX_THEATER_LOG = 500;
  if (body.theater_log?.entries && body.theater_log.entries.length > MAX_THEATER_LOG) {
    body.theater_log.entries = body.theater_log.entries.slice(-MAX_THEATER_LOG);
  }

  await env.CHAT_HISTORY.put(kvKey, JSON.stringify(body));
  return jsonResponse({ ok: true });
}

// ─── ヘルパー ───
function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key.trim()] = rest.join("=").trim();
  }
  return cookies;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── グループ削除時のクリーンアップ ───
// 関連するKVキーとR2オブジェクトを一括削除
async function cleanupGroup(env, groupId) {
  const errors = [];

  const directKeys = [
    `group:${groupId}`,
    `group_members:${groupId}`,
    `group_notes:${groupId}`,
    `group_scripts:${groupId}`,
  ];
  for (const key of directKeys) {
    try { await env.CHAT_HISTORY.delete(key); } catch (e) {
      errors.push(`KV delete ${key}: ${e.message}`);
    }
  }

  try {
    const joinReqs = await env.CHAT_HISTORY.list({ prefix: `group_join_request:${groupId}:` });
    for (const key of joinReqs.keys) {
      await env.CHAT_HISTORY.delete(key.name);
    }
  } catch (e) {
    errors.push(`KV list/delete join_requests: ${e.message}`);
  }

  try {
    const r2List = await env.CONTENT_BUCKET.list({ prefix: `scripts/${groupId}/` });
    for (const obj of r2List.objects) {
      await env.CONTENT_BUCKET.delete(obj.key);
    }
  } catch (e) {
    errors.push(`R2 cleanup scripts/${groupId}/: ${e.message}`);
  }

  return { ok: errors.length === 0, errors };
}

export {
  lineLoginRedirect,
  lineLoginCallback,
  verifyGoogleToken,
  getSession,
  destroySession,
  authMe,
  migrateUserData,
  getUserData,
  putUserData,
  requireEditor,
  requestEditorAccess,
  listEditorRequests,
  approveEditor,
  revokeEditor,
  checkIsMaster,
  requireGroupRole,
  loadGroupMembers,
  saveGroupMembers,
  requestGroupJoin,
  listGroupJoinRequests,
  approveGroupMember,
  changeGroupMemberRole,
  removeGroupMember,
  cleanupGroup,
};
