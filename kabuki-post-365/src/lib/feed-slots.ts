import { threePlayMode, threePlayOwnsDate } from './three-plays';
export type FeedSlot = 'morning' | 'evening';
export function eveningFeedEnabled(s: Record<string,string>, date: string): boolean {
  if (threePlayOwnsDate(s, date)) return true; // Also prevents a malformed enabled mode falling back to Stories.
  return !!s.evening_feed_start_date && !!s.evening_feed_end_date
    && date >= s.evening_feed_start_date && date <= s.evening_feed_end_date;
}
export function jstClock(at: Date = new Date()) {
  const d = new Date(at.getTime() + 9 * 3600000);
  return {date:d.toISOString().slice(0,10), hour:d.getUTCHours()};
}
export function currentFeedSlot(s: Record<string,string>, at: Date = new Date()): FeedSlot | null {
  const {date,hour}=jstClock(at);
  if (threePlayOwnsDate(s, date)) {
    if (threePlayMode(s, date).state !== 'active') return null;
    return hour === 9 ? 'morning' : hour === 19 ? 'evening' : null;
  }
  if(hour>=9 && hour<12) return 'morning';
  if(hour>=19 && hour<22 && eveningFeedEnabled(s,date)) return 'evening';
  return null;
}
export function doneKey(date: string, slot: FeedSlot): string { return `autopost_done:${date}:${slot}`; }
