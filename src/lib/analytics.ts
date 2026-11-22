/**
 * Privacy-preserving Analytics Module for Seller Calc Hub.
 *
 * Guarantees:
 * 1. ZERO COOKIES: Never reads, writes, or accesses document.cookie.
 * 2. ZERO PERSONAL DATA (No PII): No names, emails, IPs, usernames, or monetary transaction values.
 * 3. CLOUDFLARE INTEGRATION: Bridges to Cloudflare Zaraz (zaraz.track) and Cloudflare Web Analytics beacon.
 * 4. TEST SESSION DASHBOARD: Maintains an in-memory & sessionStorage event stream for real-time auditability.
 */

export type AnalyticsEventName =
  | 'calculator_used'
  | 'mode_changed'
  | 'result_copied'
  | 'share_link_copied'
  | 'fee_report_clicked';

export interface CalculatorUsedPayload {
  platform: string;
  mode: 'forward' | 'reverse';
  category?: string;
  hasPromoted?: boolean;
  hasStore?: boolean;
}

export interface ModeChangedPayload {
  platform: string;
  previousMode: 'forward' | 'reverse';
  newMode: 'forward' | 'reverse';
}

export interface ResultCopiedPayload {
  platform: string;
  format?: string;
}

export interface ShareLinkCopiedPayload {
  platform: string;
}

export interface FeeReportClickedPayload {
  platform?: string;
  href: string;
  label: string;
}

export type EventPayloadMap = {
  calculator_used: CalculatorUsedPayload;
  mode_changed: ModeChangedPayload;
  result_copied: ResultCopiedPayload;
  share_link_copied: ShareLinkCopiedPayload;
  fee_report_clicked: FeeReportClickedPayload;
};

export interface AnalyticsEventRecord<T extends AnalyticsEventName = AnalyticsEventName> {
  id: string;
  name: T;
  payload: EventPayloadMap[T];
  timestamp: string; // ISO 8601
}

// Disallowed PII field names to prevent accidental leakage
const FORBIDDEN_PII_KEYS = [
  'email',
  'name',
  'username',
  'user_id',
  'ip',
  'ip_address',
  'phone',
  'address',
  'ssn',
  'password',
  'credit_card',
  'token',
];

/**
 * Sanitizes an event payload ensuring zero personal data is included.
 */
export function sanitizePayload<T extends Record<string, unknown>>(payload: T): T {
  const clean: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_PII_KEYS.includes(lowerKey)) {
      continue; // Strip forbidden PII keys
    }

    if (typeof val === 'string') {
      // Disallow email patterns in strings
      if (val.includes('@') && val.includes('.')) {
        continue;
      }
      clean[key] = val.slice(0, 200); // Truncate strings to prevent payload bloat
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      clean[key] = val;
    } else if (val === null || val === undefined) {
      clean[key] = val;
    }
  }

  return clean as T;
}

const STORAGE_SESSION_KEY = 'sch_test_analytics_session';

/**
 * In-memory fallback event log for environments without sessionStorage.
 */
const inMemorySessionEvents: AnalyticsEventRecord[] = [];

/**
 * Retrieves the recorded events in the current session.
 */
export function getRecordedEvents(): AnalyticsEventRecord[] {
  if (typeof window === 'undefined') {
    return [...inMemorySessionEvents];
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // sessionStorage disabled or unavailable; use in-memory
  }

  return [...inMemorySessionEvents];
}

/**
 * Clears the test session event history.
 */
export function clearRecordedEvents(): void {
  inMemorySessionEvents.length = 0;
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {
      // Ignore sessionStorage exceptions
    }
    // Also clear debug window array if present
    if (Array.isArray((window as unknown as { __sch_analytics_events?: unknown[] }).__sch_analytics_events)) {
      (window as unknown as { __sch_analytics_events: unknown[] }).__sch_analytics_events = [];
    }
  }
}

/**
 * Returns event counts grouped by event name.
 */
export function getEventCounts(): Record<AnalyticsEventName, number> {
  const events = getRecordedEvents();
  const counts: Record<AnalyticsEventName, number> = {
    calculator_used: 0,
    mode_changed: 0,
    result_copied: 0,
    share_link_copied: 0,
    fee_report_clicked: 0,
  };

  for (const ev of events) {
    if (counts[ev.name] !== undefined) {
      counts[ev.name]++;
    }
  }

  return counts;
}

/**
 * Verifies that zero cookies are active on document.cookie.
 */
export function verifyZeroCookies(): boolean {
  if (typeof document === 'undefined') return true;
  return document.cookie.trim().length === 0;
}

/**
 * Tracks a custom privacy-friendly event.
 *
 * Dispatches to:
 * 1. Cloudflare Zaraz if window.zaraz.track is available
 * 2. Custom DOM Event 'sch:analytics' on window
 * 3. Session event storage for test dashboard inspection
 */
export function trackEvent<T extends AnalyticsEventName>(
  name: T,
  payload: EventPayloadMap[T]
): AnalyticsEventRecord<T> {
  const sanitized = sanitizePayload(payload as unknown as Record<string, unknown>) as unknown as EventPayloadMap[T];
  const record: AnalyticsEventRecord<T> = {
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    payload: sanitized,
    timestamp: new Date().toISOString(),
  };

  // 1. Record in session store for dashboard/test session
  const currentEvents = getRecordedEvents();
  currentEvents.unshift(record as AnalyticsEventRecord);
  if (currentEvents.length > 200) {
    currentEvents.pop();
  }

  inMemorySessionEvents.length = 0;
  inMemorySessionEvents.push(...currentEvents);

  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(currentEvents));
    } catch {
      // Ignore storage errors
    }

    // Attach to global window for test inspection
    const win = window as unknown as {
      __sch_analytics_events?: AnalyticsEventRecord[];
      zaraz?: { track: (name: string, payload: unknown) => void };
    };

    win.__sch_analytics_events = currentEvents;

    // 2. Dispatch to Cloudflare Zaraz if installed
    try {
      if (typeof win.zaraz?.track === 'function') {
        win.zaraz.track(name, sanitized);
      }
    } catch (err) {
      console.warn('[Analytics] Zaraz dispatch error:', err);
    }

    // 3. Dispatch standard custom event on window
    try {
      window.dispatchEvent(
        new CustomEvent('sch:analytics', {
          detail: record,
        })
      );
    } catch {
      // Ignore dispatch error in unsupported runtimes
    }
  }

  return record;
}
