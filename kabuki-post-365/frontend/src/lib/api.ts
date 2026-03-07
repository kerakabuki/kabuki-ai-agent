const BASE = '/api/v1';

function getAuthToken(): string | null {
  return sessionStorage.getItem('kp365_token');
}

export function setAuthToken(token: string) {
  sessionStorage.setItem('kp365_token', token);
}

export function clearAuthToken() {
  sessionStorage.removeItem('kp365_token');
}

export function hasAuthToken(): boolean {
  return !!sessionStorage.getItem('kp365_token');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const authHeaders: Record<string, string> = {};
  if (token) authHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders,
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    clearAuthToken();
    window.location.reload();
    throw new Error('認証が必要です');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as Record<string, string>).error || res.statusText);
  }
  if (res.headers.get('content-type')?.includes('text/csv')) {
    return res.text() as unknown as T;
  }
  return res.json();
}

// Characters
export const api = {
  characters: {
    list: () => request<any[]>('/characters'),
    get: (id: number) => request<any>(`/characters/${id}`),
    create: (data: any) => request<any>('/characters', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/characters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/characters/${id}`, { method: 'DELETE' }),
    import: (data: any[]) => request<any>('/characters/import', { method: 'POST', body: JSON.stringify(data) }),
  },
  images: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/images${qs}`);
    },
    get: (id: number) => request<any>(`/images/${id}`),
    upload: (formData: FormData) => request<any>('/images/upload', { method: 'POST', body: formData }),
    analyze: (formData: FormData) => request<any>('/images/analyze', { method: 'POST', body: formData }),
    update: (id: number, data: any) => request<any>(`/images/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    setPrimary: (id: number) => request<any>(`/images/${id}/primary`, { method: 'PUT' }),
    delete: (id: number) => request<any>(`/images/${id}`, { method: 'DELETE' }),
  },
  posts: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/posts${qs}`);
    },
    get: (id: number) => request<any>(`/posts/${id}`),
    create: (data: any) => request<any>('/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: number, status: string) => request<any>(`/posts/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: number) => request<any>(`/posts/${id}`, { method: 'DELETE' }),
  },
  calendar: {
    getMonth: (year: number, month: number) => request<any>(`/calendar/${year}/${month}`),
    generate: (startDate?: string) => request<any>('/calendar/generate', { method: 'POST', body: JSON.stringify({ start_date: startDate }) }),
    swap: (postIdA: number, postIdB: number) => request<any>('/calendar/swap', { method: 'POST', body: JSON.stringify({ post_id_a: postIdA, post_id_b: postIdB }) }),
  },
  generate: {
    batch: (params?: { from?: string; to?: string; limit?: number }) =>
      request<any>('/generate/batch', { method: 'POST', body: JSON.stringify(params || {}) }),
    single: (postId: number) =>
      request<any>(`/generate/single/${postId}`, { method: 'POST' }),
    singlePlatform: (postId: number, platform: string) =>
      request<any>(`/generate/single/${postId}/${platform}`, { method: 'POST' }),
  },
  quiz: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/quiz${qs}`);
    },
    get: (id: number) => request<any>(`/quiz/${id}`),
    create: (data: any) => request<any>('/quiz', { method: 'POST', body: JSON.stringify(data) }),
    import: (data: any[]) => request<any>('/quiz/import', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/quiz/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/quiz/${id}`, { method: 'DELETE' }),
  },
  export: {
    csv: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<string>(`/export/csv${qs}`);
    },
  },
  settings: {
    getAll: () => request<Record<string, string>>('/settings'),
    update: (key: string, value: string) => request<any>(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  },
};
