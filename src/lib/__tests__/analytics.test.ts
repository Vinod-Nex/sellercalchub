import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  trackEvent,
  sanitizePayload,
  getRecordedEvents,
  clearRecordedEvents,
  getEventCounts,
  verifyZeroCookies,
} from '../analytics';

describe('Privacy-preserving Analytics Module', () => {
  let originalWindow: unknown;
  let originalDocument: unknown;

  beforeEach(() => {
    clearRecordedEvents();
    originalWindow = (globalThis as unknown as { window?: unknown }).window;
    originalDocument = (globalThis as unknown as { document?: unknown }).document;

    const mockListeners: Record<string, ((ev: unknown) => void)[]> = {};
    const mockSessionStorage: Record<string, string> = {};

    const mockWin = {
      sessionStorage: {
        getItem: (k: string) => mockSessionStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          mockSessionStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockSessionStorage[k];
        },
      },
      addEventListener: (type: string, fn: (ev: unknown) => void) => {
        mockListeners[type] = mockListeners[type] || [];
        mockListeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: (ev: unknown) => void) => {
        if (mockListeners[type]) {
          mockListeners[type] = mockListeners[type].filter((f) => f !== fn);
        }
      },
      dispatchEvent: (ev: { type: string; detail?: unknown }) => {
        const list = mockListeners[ev.type] || [];
        for (const fn of list) fn(ev);
        return true;
      },
    };

    const mockDoc = {
      cookie: '',
    };

    (globalThis as unknown as { window: unknown }).window = mockWin;
    (globalThis as unknown as { document: unknown }).document = mockDoc;
    (globalThis as unknown as { CustomEvent: unknown }).CustomEvent = class CustomEvent {
      type: string;
      detail: unknown;
      constructor(type: string, params?: { detail?: unknown }) {
        this.type = type;
        this.detail = params?.detail;
      }
    };
  });

  afterEach(() => {
    (globalThis as unknown as { window?: unknown }).window = originalWindow;
    (globalThis as unknown as { document?: unknown }).document = originalDocument;
  });

  it('tracks calculator_used event with non-PII payload', () => {
    const record = trackEvent('calculator_used', {
      platform: 'ebay-us',
      mode: 'forward',
      category: 'Electronics',
      hasStore: true,
    });

    expect(record.name).toBe('calculator_used');
    expect(record.payload.platform).toBe('ebay-us');
    expect(record.payload.mode).toBe('forward');
    expect(record.payload.category).toBe('Electronics');
    expect(record.payload.hasStore).toBe(true);

    const events = getRecordedEvents();
    expect(events.length).toBe(1);
    expect(events[0].name).toBe('calculator_used');
  });

  it('tracks mode_changed event', () => {
    const record = trackEvent('mode_changed', {
      platform: 'etsy',
      previousMode: 'forward',
      newMode: 'reverse',
    });

    expect(record.name).toBe('mode_changed');
    expect(record.payload.platform).toBe('etsy');
    expect(record.payload.previousMode).toBe('forward');
    expect(record.payload.newMode).toBe('reverse');
  });

  it('tracks result_copied event', () => {
    const record = trackEvent('result_copied', {
      platform: 'whatnot',
      format: 'summary',
    });

    expect(record.name).toBe('result_copied');
    expect(record.payload.platform).toBe('whatnot');
    expect(record.payload.format).toBe('summary');
  });

  it('tracks share_link_copied event', () => {
    const record = trackEvent('share_link_copied', {
      platform: 'tiktok-shop',
    });

    expect(record.name).toBe('share_link_copied');
    expect(record.payload.platform).toBe('tiktok-shop');
  });

  it('tracks fee_report_clicked event', () => {
    const record = trackEvent('fee_report_clicked', {
      platform: 'depop',
      href: 'https://depop.com/fees',
      label: 'Official Depop Fees',
    });

    expect(record.name).toBe('fee_report_clicked');
    expect(record.payload.platform).toBe('depop');
    expect(record.payload.href).toBe('https://depop.com/fees');
    expect(record.payload.label).toBe('Official Depop Fees');
  });

  it('sanitizes forbidden personal data keys and email patterns', () => {
    const dirtyPayload = {
      platform: 'ebay-us',
      email: 'reseller@example.com',
      name: 'John Doe',
      ip: '192.168.1.1',
      user_id: 'usr_12345',
      note: 'contact me at test@domain.org for info',
      validField: 'allowed value',
    };

    const clean = sanitizePayload(dirtyPayload);

    expect(clean.platform).toBe('ebay-us');
    expect(clean.validField).toBe('allowed value');
    expect((clean as Record<string, unknown>).email).toBeUndefined();
    expect((clean as Record<string, unknown>).name).toBeUndefined();
    expect((clean as Record<string, unknown>).ip).toBeUndefined();
    expect((clean as Record<string, unknown>).user_id).toBeUndefined();
    expect((clean as Record<string, unknown>).note).toBeUndefined();
  });

  it('maintains zero cookies on document.cookie', () => {
    expect(verifyZeroCookies()).toBe(true);

    trackEvent('calculator_used', { platform: 'whatnot', mode: 'forward' });
    trackEvent('result_copied', { platform: 'whatnot' });

    expect(verifyZeroCookies()).toBe(true);
    expect((globalThis as unknown as { document: { cookie: string } }).document.cookie).toBe('');
  });

  it('correctly aggregates event counts across all 5 event types', () => {
    trackEvent('calculator_used', { platform: 'ebay-us', mode: 'forward' });
    trackEvent('calculator_used', { platform: 'etsy', mode: 'forward' });
    trackEvent('mode_changed', { platform: 'etsy', previousMode: 'forward', newMode: 'reverse' });
    trackEvent('result_copied', { platform: 'whatnot' });
    trackEvent('share_link_copied', { platform: 'tiktok-shop' });
    trackEvent('fee_report_clicked', { platform: 'depop', href: '/methodology/', label: 'Sources' });
    trackEvent('fee_report_clicked', { platform: 'ebay-us', href: '/methodology/', label: 'Sources' });

    const counts = getEventCounts();
    expect(counts.calculator_used).toBe(2);
    expect(counts.mode_changed).toBe(1);
    expect(counts.result_copied).toBe(1);
    expect(counts.share_link_copied).toBe(1);
    expect(counts.fee_report_clicked).toBe(2);
  });

  it('dispatches custom DOM event "sch:analytics" on window', () => {
    const listener = vi.fn();
    const win = (globalThis as unknown as { window: { addEventListener: (type: string, fn: (ev: unknown) => void) => void; removeEventListener: (type: string, fn: (ev: unknown) => void) => void } }).window;
    win.addEventListener('sch:analytics', listener);

    trackEvent('share_link_copied', { platform: 'ebay-uk' });

    expect(listener).toHaveBeenCalledTimes(1);
    const customEv = listener.mock.calls[0][0] as { detail: { name: string; payload: { platform: string } } };
    expect(customEv.detail.name).toBe('share_link_copied');
    expect(customEv.detail.payload.platform).toBe('ebay-uk');

    win.removeEventListener('sch:analytics', listener);
  });

  it('forwards events to Cloudflare Zaraz when window.zaraz is present', () => {
    const zarazMock = {
      track: vi.fn(),
    };
    const win = (globalThis as unknown as { window: { zaraz?: typeof zarazMock } }).window;
    win.zaraz = zarazMock;

    trackEvent('calculator_used', { platform: 'whatnot', mode: 'reverse' });

    expect(zarazMock.track).toHaveBeenCalledTimes(1);
    expect(zarazMock.track).toHaveBeenCalledWith('calculator_used', {
      platform: 'whatnot',
      mode: 'reverse',
    });

    delete win.zaraz;
  });
});
