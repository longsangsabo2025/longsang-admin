import { describe, it, expect } from 'vitest';
import { logger, LogLevel } from '../logger';

describe('Logger', () => {
  it('should create log entries with correct format', () => {
    // This is a basic smoke test
    expect(logger).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
  });

  it('should clear logs', () => {
    logger.clearLogs();
    const logs = logger.getLogs();
    expect(logs).toEqual([]);
  });

  it('should have correct log levels', () => {
    expect(LogLevel.DEBUG).toBe('DEBUG');
    expect(LogLevel.INFO).toBe('INFO');
    expect(LogLevel.WARN).toBe('WARN');
    expect(LogLevel.ERROR).toBe('ERROR');
  });
});
