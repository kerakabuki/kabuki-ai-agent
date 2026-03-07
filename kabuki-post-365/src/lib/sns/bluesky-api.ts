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

export async function postToBluesky(
  config: BlueskyConfig,
  imageData: Uint8Array,
  text: string,
): Promise<PostResult> {
  try {
    // Step 1: Authenticate
    const session = await createSession(config);
    if (!session) {
      return { success: false, error: 'Bluesky authentication failed' };
    }

    // Step 2: Upload image as blob
    const blobRef = await uploadBlob(session, imageData, 'image/jpeg');
    if (!blobRef) {
      return { success: false, error: 'Bluesky blob upload failed' };
    }

    // Step 3: Parse facets (URLs and hashtags)
    const facets = parseFacets(text);

    // Step 4: Create record (post)
    const now = new Date().toISOString();
    const record: Record<string, unknown> = {
      $type: 'app.bsky.feed.post',
      text,
      createdAt: now,
      embed: {
        $type: 'app.bsky.embed.images',
        images: [
          {
            alt: text.slice(0, 300),
            image: blobRef,
          },
        ],
      },
    };
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
