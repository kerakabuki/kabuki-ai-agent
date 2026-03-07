export interface XConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export interface PostResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

const X_API_BASE = 'https://api.x.com';
const UPLOAD_BASE = 'https://upload.twitter.com';

export async function postToX(
  config: XConfig,
  imageData: Uint8Array,
  text: string,
): Promise<PostResult> {
  try {
    // Step 1: Upload media via v1.1 media/upload (chunked INIT/APPEND/FINALIZE)
    const mediaResult = await uploadMedia(config, imageData);
    if (!mediaResult.success) return mediaResult;

    // Step 3: Create tweet with media
    const tweetResult = await createTweet(config, text, mediaResult.platformPostId!);
    return tweetResult;
  } catch (e: unknown) {
    return { success: false, error: `X API error: ${(e as Error).message}` };
  }
}

// ── Media Upload (v1.1 chunked) ──

async function uploadMedia(config: XConfig, imageData: Uint8Array): Promise<PostResult> {
  const totalBytes = imageData.byteLength;

  // INIT
  const initParams: Record<string, string> = {
    command: 'INIT',
    total_bytes: String(totalBytes),
    media_type: 'image/jpeg',
    media_category: 'tweet_image',
  };
  const initRes = await oauthRequest(
    config,
    'POST',
    `${UPLOAD_BASE}/1.1/media/upload.json`,
    initParams,
    'form',
  );
  const initData = await initRes.json() as Record<string, unknown>;
  if (!initData.media_id_string) {
    return { success: false, error: `Media INIT failed: ${JSON.stringify(initData)}` };
  }
  const mediaId = initData.media_id_string as string;

  // APPEND (single chunk for images under 5MB; most SNS images are well under)
  const appendUrl = `${UPLOAD_BASE}/1.1/media/upload.json`;
  const boundary = `----boundary${Date.now()}`;
  const appendBody = buildMultipartBody(boundary, mediaId, imageData);
  const appendHeaders = await buildOAuthHeaders(config, 'POST', appendUrl, {});
  appendHeaders['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: appendHeaders,
    body: appendBody,
  });
  if (!appendRes.ok && appendRes.status !== 204) {
    const errText = await appendRes.text();
    return { success: false, error: `Media APPEND failed: ${errText}` };
  }

  // FINALIZE
  const finalParams: Record<string, string> = {
    command: 'FINALIZE',
    media_id: mediaId,
  };
  const finalRes = await oauthRequest(
    config,
    'POST',
    `${UPLOAD_BASE}/1.1/media/upload.json`,
    finalParams,
    'form',
  );
  const finalData = await finalRes.json() as Record<string, unknown>;
  if (finalData.error) {
    return { success: false, error: `Media FINALIZE failed: ${JSON.stringify(finalData)}` };
  }

  return { success: true, platformPostId: mediaId };
}

function buildMultipartBody(
  boundary: string,
  mediaId: string,
  data: Uint8Array,
): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];

  // command field
  parts.push(enc.encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="command"\r\n\r\nAPPEND\r\n`,
  ));
  // media_id field
  parts.push(enc.encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="media_id"\r\n\r\n${mediaId}\r\n`,
  ));
  // segment_index field
  parts.push(enc.encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="segment_index"\r\n\r\n0\r\n`,
  ));
  // media_data field (binary)
  parts.push(enc.encode(
    `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="image.jpg"\r\nContent-Type: application/octet-stream\r\n\r\n`,
  ));
  parts.push(data);
  parts.push(enc.encode(`\r\n--${boundary}--\r\n`));

  // Concatenate
  const totalLen = parts.reduce((s, p) => s + p.byteLength, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.byteLength;
  }
  return result;
}

// ── Tweet Creation (v2) ──

async function createTweet(
  config: XConfig,
  text: string,
  mediaId: string,
): Promise<PostResult> {
  const url = `${X_API_BASE}/2/tweets`;
  const body = JSON.stringify({
    text,
    media: { media_ids: [mediaId] },
  });

  const headers = await buildOAuthHeaders(config, 'POST', url, {});
  headers['Content-Type'] = 'application/json';

  const res = await fetch(url, { method: 'POST', headers, body });
  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    return { success: false, error: `Tweet creation failed [${res.status}]: ${JSON.stringify(data)}` };
  }

  const tweetData = data.data as Record<string, unknown> | undefined;
  return { success: true, platformPostId: tweetData?.id as string };
}

// ── OAuth 1.0a (HMAC-SHA1 via SubtleCrypto) ──

async function oauthRequest(
  config: XConfig,
  method: string,
  url: string,
  params: Record<string, string>,
  bodyType: 'form' | 'json' = 'form',
): Promise<Response> {
  const headers = await buildOAuthHeaders(config, method, url, params);

  let body: string | undefined;
  if (bodyType === 'form' && Object.keys(params).length > 0) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(params).toString();
  }

  return fetch(url, { method, headers, body });
}

async function buildOAuthHeaders(
  config: XConfig,
  method: string,
  url: string,
  extraParams: Record<string, string>,
): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: config.accessToken,
    oauth_version: '1.0',
  };

  // Combine OAuth params + request params for signature base
  const allParams: Record<string, string> = { ...oauthParams, ...extraParams };

  const signature = await createOAuthSignature(
    method,
    url,
    allParams,
    config.apiSecret,
    config.accessSecret,
  );

  oauthParams.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.entries(oauthParams)
    .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
    .join(', ');

  return { Authorization: authHeader };
}

async function createOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string,
): Promise<string> {
  // Parameter string: sort and encode
  const paramStr = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');

  // Signature base string
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramStr)}`;

  // Signing key
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  // HMAC-SHA1 via SubtleCrypto
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(signingKey),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(baseString));

  // Base64 encode
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) =>
    '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function generateNonce(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(36)).join('').slice(0, 32);
}
