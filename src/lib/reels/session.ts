const REEL_SESSION_STORAGE_KEY = "tijvorya-reel-session-id";

// A stable per-browser id (not tied to auth) so an anonymous viewer's
// repeat reel views within the same browser dedupe against
// reel_events_view_dedup_session_uidx instead of inflating the view count
// on every reload.
export function getReelSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(REEL_SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(REEL_SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return "";
  }
}
