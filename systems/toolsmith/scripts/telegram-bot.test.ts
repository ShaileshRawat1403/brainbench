import { describe, test, expect } from 'bun:test';
import { executeDigest, clampMessage } from './telegram-bot';

describe('Telegram Bot Integration Helper Tests', () => {
  test('executeDigest allowed status command', () => {
    const res = executeDigest('/status');
    expect(res.code).toBe(0);
    expect(res.stdout).toContain('BrainBench Status');
    expect(res.stdout).toContain('Sprint:');
  });

  test('executeDigest allowed weekly command', () => {
    const res = executeDigest('/weekly');
    expect(res.code).toBe(0);
    expect(res.stdout).toContain('Weekly Brief:');
  });

  test('executeDigest rejects mutation mark_done command', () => {
    const res = executeDigest('/mark_done issue-12');
    expect(res.code).toBe(1);
    expect(res.stdout).toContain('Rejected.');
    expect(res.stdout).toContain('State mutation is not allowed');
  });

  test('executeDigest rejects mutation approve command', () => {
    const res = executeDigest('/approve decision');
    expect(res.code).toBe(1);
    expect(res.stdout).toContain('Rejected.');
  });

  test('executeDigest rejects unknown command', () => {
    const res = executeDigest('/invalid_action');
    expect(res.code).toBe(1);
    expect(res.stdout).toContain('Unknown command. Supported read-only commands are');
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
