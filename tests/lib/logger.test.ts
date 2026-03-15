/**
 * Tests for lib/logger.ts — verifies all log levels call the correct console method
 * with the correctly structured JSON payload.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLogger } from '@/lib/logger';

describe('createLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('info() calls console.log with level="info"', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const log = createLogger('test-feature');
    log.info('some info message', { key: 'value' });

    expect(spy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry.level).toBe('info');
    expect(entry.feature).toBe('test-feature');
    expect(entry.message).toBe('some info message');
    expect(entry.context).toEqual({ key: 'value' });
    expect(typeof entry.timestamp).toBe('string');
  });

  it('warn() calls console.warn with level="warn"', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = createLogger('test-feature');
    log.warn('something suspicious', { detail: 42 });

    expect(spy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry.level).toBe('warn');
    expect(entry.feature).toBe('test-feature');
    expect(entry.message).toBe('something suspicious');
    expect(entry.context).toEqual({ detail: 42 });
  });

  it('warn() without context omits context field', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = createLogger('test-feature');
    log.warn('bare warning');

    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry.level).toBe('warn');
    expect(entry.context).toBeUndefined();
  });

  it('error() calls console.error with level="error" and error details', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = createLogger('test-feature');
    const err = new Error('something broke');
    log.error('operation failed', err, { tradeId: 'trade-1' });

    expect(spy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry.level).toBe('error');
    expect(entry.message).toBe('operation failed');
    expect(entry.error.name).toBe('Error');
    expect(entry.error.message).toBe('something broke');
    expect(entry.context).toEqual({ tradeId: 'trade-1' });
  });

  it('debug() calls console.log with level="debug"', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const log = createLogger('test-feature');
    log.debug('debugging internals', { data: [1, 2, 3] });

    expect(spy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry.level).toBe('debug');
    expect(entry.feature).toBe('test-feature');
    expect(entry.message).toBe('debugging internals');
    expect(entry.context).toEqual({ data: [1, 2, 3] });
  });

  it('debug() without context omits context field', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const log = createLogger('test-feature');
    log.debug('bare debug');

    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry.level).toBe('debug');
    expect(entry.context).toBeUndefined();
  });
});
