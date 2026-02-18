// src/auth.js
// =========================================================
// 認証: LINE Login + Google Sign-In + セッション管理
// アカウントリンク: 同一メールアドレスならデータ共有
// =========================================================

const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days
const SESSION_COOKIE = "kl_session";

// ─── アカウントリンク: メールベースの userId 解決 ───
// 同じメールアドレスなら同じ userId を返す
async function resolveUserId(env, email, providerUserId) {
  if (!email) return providerUserId;

  const emailKey = `email_link:${email.toLowerCase()}`;
  try {
    const existing = await env.CHAT_HISTORY.get(emailKey);
    if (existing) {
      // 既にこのメールで登録済み → 既存の canonical userId を使う
      const link = JSON.parse(existing);
      // プロバイダー情報を追記（重複排除）
      if (!link.providers.includes(providerUserId)) {
        link.providers.push(providerUserId);
        link.updated_at = new Date().toISOString();
        await env.CHAT_HISTORY.put(emailKey, JSON.stringify(link));
      }
      return link.canonicalUserId;
    } else {
      // 新規 → このプロバイダーの userId をcanonicalとして登録
      const link = {
        canonicalUserId: providerUserId,
        email: email.toLowerCase(),
        providers: [providerUserId],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await env.CHAT_HISTORY.put(emailKey, JSON.stringify(link));
      return providerUserId;
    }
  } catch (e) {
    console.error("resolveUserId error:", e);
    return providerUserId;
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
  const canonicalUserId = await resolveUserId(env, lineEmail, providerUserId);

  // セッション作成
  const userInfo = {
    userId: canonicalUserId,
    provider: "line",
    displayName: profile.displayName || "",
    pictureUrl: profile.pictureUrl || "",
    email: lineEmail,
  };

  const sessionToken = await createSession(env, userInfo);

  // /mypage にリダイレクト（セッション Cookie 付き）
  const resHeaders = new Headers({ Location: "/mypage" });
  resHeaders.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`
  );
  // oauth state Cookie を消す
  resHeaders.append(
    "Set-Cookie",
    `kl_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
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
      return jsonResponse({ error: "Invalid issuer: " + payload.iss }, 401);
    }

    // aud がクライアント ID と一致するか検証
    const clientId = env.GOOGLE_CLIENT_ID;
    if (clientId && payload.aud !== clientId) {
      console.error("Audience mismatch:", payload.aud, "vs", clientId);
      return jsonResponse({ error: "Token audience mismatch" }, 401);
    }

    // 有効期限チェック
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return jsonResponse({ error: "Token expired" }, 401);
    }

    // アカウントリンク: メールで userId を解決
    const providerUserId = `google_${payload.sub}`;
    const googleEmail = payload.email || "";
    const canonicalUserId = await resolveUserId(env, googleEmail, providerUserId);

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

  return jsonResponse({
    loggedIn: true,
    user: {
      displayName: session.displayName,
      pictureUrl: session.pictureUrl,
      provider: session.provider,
      email: session.email || "",
      linkedProviders,
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
};
