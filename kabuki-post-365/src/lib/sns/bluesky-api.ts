export interface BlueskyConfig {
  handle: string;
  appPassword: string;
}

export interface PostResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

interface BlueskySession {
  accessJwt: string;
  did: string;
}

interface Facet {
  index: { byteStart: number; byteEnd: number };
  features: Array<{ $type: string; uri?: string; tag?: string }>;
}

const BSKY_API = 'https://bsky.social/xrpc';
const BSKY_GRAPHEME_LIMIT = 300;

/** Truncate text to fit Bluesky's 300 grapheme limit */
function truncateToGraphemes(text: string, limit: number): string {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
    const segments = [...segmenter.segment(text)];
    if (segments.length <= limit) return text;
    return segments.slice(0, limit - 1).map(s => s.segment).join('') + '…';
  }
  // Fallback: Array.from handles surrogate pairs
  const chars = Array.from(text);
  if (chars.length <= limit) return text;
  return chars.slice(0, limit - 1).join('') + '…';
}

export async function postToBluesky(
  config: BlueskyConfig,
  imageData: Uint8Array | null,
  text: string,
): Promise<PostResult> {
  try {
    // Truncate text to Bluesky's 300 grapheme limit
    text = truncateToGraphemes(text, BSKY_GRAPHEME_LIMIT);

    // Step 1: Authenticate
    const session = await createSession(config);
    if (!session) {
      return { success: false, error: 'Bluesky authentication failed' };
    }

    // Step 2: Upload image as blob (imageDataがnullなら本文のみで投稿)
    let embed: Record<string, unknown> | null = null;
    if (imageData) {
      const blobRef = await uploadBlob(session, imageData, 'image/jpeg');
      if (!blobRef) {
        return { success: false, error: 'Bluesky blob upload failed' };
      }
      embed = {
        $type: 'app.bsky.embed.images',
        images: [
          {
            alt: text.slice(0, 300),
            image: blobRef,
          },
        ],
      };
    }

    // Step 3: Parse facets (URLs and hashtags)
    const facets = parseFacets(text);

    // Step 4: Create record (post)
    const now = new Date().toISOString();
    const record: Record<string, unknown> = {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: now,
    };
    if (embed) {
      record.embed = embed;
    }
    if (facets.length > 0) {
      record.facets = facets;
    }

    const res = await fetch(`${BSKY_API}/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo: session.did,
        collection: 'app.bsky.feed.post',
        record,
      }),
    });

    const data = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      return { success: false, error: `Bluesky post failed [${res.status}]: ${JSON.stringify(data)}` };
    }

    return { success: true, platformPostId: data.uri as string };
  } catch (e: unknown) {
    return { success: false, error: `Bluesky API error: ${(e as Error).message}` };
  }
}

export async function replyToBluesky(
  config: BlueskyConfig,
  parentUri: string,
  text: string,
): Promise<PostResult> {
  try {
    text = truncateToGraphemes(text, BSKY_GRAPHEME_LIMIT);

    const session = await createSession(config);
    if (!session) return { success: false, error: 'Bluesky authentication failed' };

    // Get parent post to obtain cid
    const getRes = await fetch(`${BSKY_API}/com.atproto.repo.getRecord?repo=${encodeURIComponent(session.did)}&collection=app.bsky.feed.post&rkey=${parentUri.split('/').pop()}`, {
      headers: { Authorization: `Bearer ${session.accessJwt}` },
    });
    if (!getRes.ok) {
      return { success: false, error: 'Failed to get parent post for reply' };
    }
    const parentData = await getRes.json() as Record<string, unknown>;
    const parentCid = parentData.cid as string;

    const facets = parseFacets(text);
    const record: Record<string, unknown> = {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: new Date().toISOString(),
      reply: {
        root: { uri: parentUri, cid: parentCid },
        parent: { uri: parentUri, cid: parentCid },
      },
    };
    if (facets.length > 0) record.facets = facets;

    const res = await fetch(`${BSKY_API}/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo: session.did,
        collection: 'app.bsky.feed.post',
        record,
      }),
    });
    const data = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      return { success: false, error: `Bluesky reply failed [${res.status}]: ${JSON.stringify(data)}` };
    }
    return { success: true, platformPostId: data.uri as string };
  } catch (e: unknown) {
    return { success: false, error: `Bluesky reply error: ${(e as Error).message}` };
  }
}

async function createSession(config: BlueskyConfig): Promise<BlueskySession | null> {
  const res = await fetch(`${BSKY_API}/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: config.handle,
      password: config.appPassword,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json() as Record<string, unknown>;
  return {
    accessJwt: data.accessJwt as string,
    did: data.did as string,
  };
}

async function uploadBlob(
  session: BlueskySession,
  data: Uint8Array,
  mimeType: string,
): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${BSKY_API}/com.atproto.repo.uploadBlob`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessJwt}`,
      'Content-Type': mimeType,
    },
    body: data,
  });
  if (!res.ok) return null;
  const result = await res.json() as Record<string, unknown>;
  return (result.blob as Record<string, unknown>) || null;
}

// ── Facets: rich text for URLs and hashtags ──

function parseFacets(text: string): Facet[] {
  const encoder = new TextEncoder();
  const facets: Facet[] = [];

  // URL facets
  const urlRegex = /https?:\/\/[^\s\u3000\u3001\u3002\uff01\uff1f)）」』】\]]+/g;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const beforeBytes = encoder.encode(text.slice(0, match.index)).byteLength;
    const matchBytes = encoder.encode(match[0]).byteLength;
    facets.push({
      index: { byteStart: beforeBytes, byteEnd: beforeBytes + matchBytes },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: match[0] }],
    });
  }

  // Hashtag facets
  const hashRegex = /(?<=^|\s)[#＃]([^\s\u3000#＃]+)/g;
  while ((match = hashRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const tag = match[1];
    const beforeBytes = encoder.encode(text.slice(0, match.index)).byteLength;
    const matchBytes = encoder.encode(fullMatch).byteLength;
    facets.push({
      index: { byteStart: beforeBytes, byteEnd: beforeBytes + matchBytes },
      features: [{ $type: 'app.bsky.richtext.facet#tag', tag }],
    });
  }

  return facets;
}
