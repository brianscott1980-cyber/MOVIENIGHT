'use client';

/**
 * Returns a persistent anonymous visitor ID stored in localStorage.
 * Generated once per browser and reused across sessions.
 */
export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  const storageKey = 'movienight_visitor_id';
  try {
    let vid = localStorage.getItem(storageKey);
    if (!vid) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        vid = crypto.randomUUID();
      } else {
        vid = `vis_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString(36)}`;
      }
      localStorage.setItem(storageKey, vid);
    }
    return vid;
  } catch {
    return '';
  }
}

const TEN_MINUTES_MS = 10 * 60 * 1000;

interface TrackViewOptions {
  sessionId: string;
  voterId?: string;
  voterName?: string;
  avatar?: string;
}

/**
 * Checks if 10 minutes of inactivity have elapsed since the last tracked view.
 * If yes (or on first visit), records a new view asynchronously via navigator.sendBeacon
 * or keepalive fetch, without blocking any UI or data fetching.
 * Also touches an activity timestamp to track continuous activity within the session.
 */
export function recordSessionViewActivity(options: TrackViewOptions): void {
  if (typeof window === 'undefined') return;
  const { sessionId, voterId, voterName, avatar } = options;
  if (!sessionId) return;

  const now = Date.now();
  const lastViewKey = `movienight_last_view_${sessionId}`;
  const lastActiveKey = `movienight_last_active_${sessionId}`;

  try {
    const lastViewStr = localStorage.getItem(lastViewKey);
    const lastActiveStr = localStorage.getItem(lastActiveKey);

    const lastViewTime = lastViewStr ? parseInt(lastViewStr, 10) : 0;
    const lastActiveTime = lastActiveStr ? parseInt(lastActiveStr, 10) : 0;

    // Check if 10 minutes have elapsed since either the last recorded view OR the last activity
    const isFirstView = !lastViewStr;
    const timeSinceLastActive = now - (lastActiveTime || lastViewTime);
    const shouldRecordNewView = isFirstView || timeSinceLastActive >= TEN_MINUTES_MS;

    // Update last active timestamp
    localStorage.setItem(lastActiveKey, now.toString());

    if (shouldRecordNewView) {
      localStorage.setItem(lastViewKey, now.toString());
      const visitorId = getOrCreateVisitorId();

      const payload = JSON.stringify({
        sessionId,
        visitorId: visitorId || undefined,
        voterId: voterId || undefined,
        voterName: voterName || undefined,
        avatar: avatar || undefined,
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/session/view', blob);
      } else {
        fetch('/api/session/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    }
  } catch {
    // Zero-impact fallback: ignore storage failures
  }
}
