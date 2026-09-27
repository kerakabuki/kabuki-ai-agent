/** Per-image attribution and a bounded photo-only publishing period. */
export function requiredImageCredits(settings: Record<string, string>, imageIds: number[]): string[] {
  const raw = settings.image_required_credits;
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid image_required_credits setting');
  }
  const entries = parsed as Record<string, unknown>;
  const credits: string[] = [];
  for (const id of imageIds) {
    const value = entries[String(id)];
    if (value === undefined) continue;
    if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid required photo credit');
    if (!credits.includes(value.trim())) credits.push(value.trim());
  }
  return credits;
}

export function creditedCaption(text: string | null, tags: string | null, credits: string[] = []): string {
  const body = text?.trim() || '';
  const lines = body.split(/\r?\n/).map(line => line.trim());
  const missing = [...new Set(credits)].filter(credit => !lines.includes(credit));
  return [body, missing.join('\n'), tags?.trim()].filter(Boolean).join('\n\n');
}

export function isPhotoOnlyDate(settings: Record<string, string>, date: string): boolean {
  const start = settings.photo_only_start_date;
  const end = settings.photo_only_end_date;
  return /^\d{4}-\d{2}-\d{2}$/.test(start || '') &&
    /^\d{4}-\d{2}-\d{2}$/.test(end || '') && start <= date && date <= end;
}
