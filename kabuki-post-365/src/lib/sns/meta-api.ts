export interface MetaConfig {
  accessToken: string;
  igUserId?: string;
  fbPageId?: string;
}

export interface PostResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

const GRAPH_API = 'https://graph.facebook.com/v21.0';

// ── Instagram (Container-based publishing) ──

export async function postToInstagram(
  config: MetaConfig,
  imageUrl: string,
  caption: string,
): Promise<PostResult> {
  if (!config.igUserId) {
    return { success: false, error: 'INSTAGRAM_USER_ID not configured' };
  }
  try {
    // Step 1: Create media container
    const createRes = await fetch(
      `${GRAPH_API}/${config.igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: config.accessToken,
        }),
      },
    );
    const createData = await createRes.json() as Record<string, unknown>;
    if (createData.error) {
      return { success: false, error: formatMetaError(createData.error) };
    }
    const containerId = createData.id as string;

    // Step 2: Poll until container is ready (max 30s)
    const ready = await pollContainerStatus(config, containerId);
    if (!ready.success) return ready;

    // Step 3: Publish
    const publishRes = await fetch(
      `${GRAPH_API}/${config.igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: config.accessToken,
        }),
      },
    );
    const publishData = await publishRes.json() as Record<string, unknown>;
    if (publishData.error) {
      return { success: false, error: formatMetaError(publishData.error) };
    }
    return { success: true, platformPostId: publishData.id as string };
  } catch (e: unknown) {
    return { success: false, error: `Instagram API error: ${(e as Error).message}` };
  }
}

async function pollContainerStatus(
  config: MetaConfig,
  containerId: string,
  maxAttempts = 10,
): Promise<PostResult> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${config.accessToken}`,
    );
    const data = await res.json() as Record<string, unknown>;
    if (data.status_code === 'FINISHED') {
      return { success: true };
    }
    if (data.status_code === 'ERROR') {
      return { success: false, error: `Container processing failed` };
    }
    // IN_PROGRESS — keep polling
  }
  return { success: false, error: 'Container processing timed out' };
}

// ── Facebook (Page Photos API) ──

async function getPageAccessToken(
  config: MetaConfig,
): Promise<{ token: string } | { error: string }> {
  const res = await fetch(
    `${GRAPH_API}/${config.fbPageId}?fields=access_token&access_token=${config.accessToken}`,
  );
  const data = await res.json() as Record<string, unknown>;
  if (data.error) {
    return { error: formatMetaError(data.error) };
  }
  if (!data.access_token) {
    return { error: 'Could not retrieve page access token. Ensure pages_manage_posts permission is granted.' };
  }
  return { token: data.access_token as string };
}

export async function postToFacebook(
  config: MetaConfig,
  imageUrl: string,
  message: string,
): Promise<PostResult> {
  if (!config.fbPageId) {
    return { success: false, error: 'FACEBOOK_PAGE_ID not configured' };
  }
  try {
    // Get page access token from user token
    const pageTokenResult = await getPageAccessToken(config);
    if ('error' in pageTokenResult) {
      return { success: false, error: pageTokenResult.error };
    }

    const res = await fetch(
      `${GRAPH_API}/${config.fbPageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,
          message,
          access_token: pageTokenResult.token,
        }),
      },
    );
    const data = await res.json() as Record<string, unknown>;
    if (data.error) {
      return { success: false, error: formatMetaError(data.error) };
    }
    return { success: true, platformPostId: (data.post_id || data.id) as string };
  } catch (e: unknown) {
    return { success: false, error: `Facebook API error: ${(e as Error).message}` };
  }
}

function formatMetaError(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    return `Meta API [${e.code}]: ${e.message}`;
  }
  return String(err);
}
