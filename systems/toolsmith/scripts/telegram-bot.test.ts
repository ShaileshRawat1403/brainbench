import { describe, test, expect } from 'bun:test';
import {
  executeDigest,
  clampMessage,
  shouldFireDaily,
  shouldFireWeekly,
  sanitizeText,
  safeFetch,
  validateStartupConfig
} from './telegram-bot';

describe('Telegram Bot Integration Helper Tests', () => {
  test('executeDigest allowed status command', () => {
    const res = executeDigest('/status');
    expect(res.code).toBe(0);
    expect(res.stdout).toContain('BrainBench Status');
  });

  test('executeDigest rejects mutation mark_done command instantly', () => {
    const start = Date.now();
    const res = executeDigest('/mark_done issue-12');
    const elapsed = Date.now() - start;
    
    expect(res.code).toBe(1);
    expect(res.stdout).toContain('Rejected.');
    expect(res.stdout).toContain('State mutation is not allowed');
    // Ensure it did not wait/retry (governance rejection is instant)
    expect(elapsed).toBeLessThan(1000);
  });

  test('clampMessage behavior for normal length', () => {
    const msg = 'Compact text status report';
    expect(clampMessage(msg)).toBe(msg);
  });

  test('clampMessage behavior for very long length', () => {
    const longMsg = 'a'.repeat(4500);
    const clamped = clampMessage(longMsg);
    expect(clamped.length).toBeLessThan(4500);
    expect(clamped).toContain('... (message truncated)');
    expect(clamped).toContain('Open dashboard/index.md for full details.');
  });
});

describe('Telegram Bot Scheduler Logic Tests (Asia/Kolkata)', () => {
  test('18:00 IST daily fires once', () => {
    const fires = shouldFireDaily(18, 0, '2026-06-27', '');
    expect(fires).toBe(true);
  });

  test('18:01 IST daily does not fire', () => {
    const fires = shouldFireDaily(18, 1, '2026-06-27', '');
    expect(fires).toBe(false);
  });

  test('Sunday 18:00 IST weekly fires', () => {
    const fires = shouldFireWeekly(18, 0, 'Sunday', '2026-06-28', '');
    expect(fires).toBe(true);
  });

  test('Monday 18:00 IST weekly does not fire', () => {
    const fires = shouldFireWeekly(18, 0, 'Monday', '2026-06-29', '');
    expect(fires).toBe(false);
  });

  test('already-sent daily does not resend', () => {
    const fires = shouldFireDaily(18, 0, '2026-06-27', '2026-06-27');
    expect(fires).toBe(false);
  });

  test('already-sent weekly does not resend', () => {
    const fires = shouldFireWeekly(18, 0, 'Sunday', '2026-06-28', '2026-06-28');
    expect(fires).toBe(false);
  });
});

describe('Telegram Bot Hosted Reliability Tests', () => {
  test('validateStartupConfig validation constraints', () => {
    // Correct config
    expect(validateStartupConfig('123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ', '99999').valid).toBe(true);

    // Missing token
    expect(validateStartupConfig('', '99999').valid).toBe(false);

    // Short token
    expect(validateStartupConfig('12345', '99999').valid).toBe(false);

    // Placeholder token
    expect(validateStartupConfig('your_telegram_bot_token_here', '99999').valid).toBe(false);

    // Placeholder allowed chat
    expect(validateStartupConfig('123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ', 'your_telegram_chat_id_here').valid).toBe(false);

    // Malformed allowed chat
    expect(validateStartupConfig('123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ', 'not_a_number').valid).toBe(false);
  });

  test('sanitizeText strips bot token from text', () => {
    const originalToken = process.env.TELEGRAM_BOT_TOKEN;
    process.env.TELEGRAM_BOT_TOKEN = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';

    const logText = 'Error connecting to https://api.telegram.org/bot123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ/getUpdates';
    const sanitized = sanitizeText(logText);
    expect(sanitized).toBe('Error connecting to https://api.telegram.org/bot[REDACTED_TOKEN]/getUpdates');

    process.env.TELEGRAM_BOT_TOKEN = originalToken;
  });

  test('safeFetch retries transient failures and then succeeds', async () => {
    const originalToken = process.env.TELEGRAM_BOT_TOKEN;
    process.env.TELEGRAM_BOT_TOKEN = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';

    let callCount = 0;
    const originalFetch = global.fetch;
    
    global.fetch = async (input, init) => {
      callCount++;
      if (callCount < 3) {
        return new Response('Transient Server Error', { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true, result: [] }), { status: 200 });
    };

    const res = await safeFetch('https://api.telegram.org/bot123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ/getUpdates', {}, 3, 1);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(callCount).toBe(3);

    global.fetch = originalFetch;
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
  });

  test('safeFetch returns sanitized failure after max retries', async () => {
    const originalToken = process.env.TELEGRAM_BOT_TOKEN;
    process.env.TELEGRAM_BOT_TOKEN = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';

    let callCount = 0;
    const originalFetch = global.fetch;
    
    global.fetch = async (input, init) => {
      callCount++;
      throw new Error('Failed to fetch: token 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ was rejected');
    };

    expect(
      safeFetch('https://api.telegram.org/bot123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ/getUpdates', {}, 3, 1)
    ).rejects.toThrow('Failed to fetch: token [REDACTED_TOKEN] was rejected');

    global.fetch = originalFetch;
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
  });
});
