import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printSupportedFormat } from '../src/print/supported-format';

describe('printSupportedFormat', () => {
  let mockExit: any;
  let mockLog: any;

  beforeEach(() => {
    mockExit = vi.spyOn(process, 'exit').mockImplementation(vi.fn() as any);
    mockLog = vi.spyOn(console, 'log').mockImplementation(vi.fn());
  });

  afterEach(() => {
    mockExit.mockRestore();
    mockLog.mockRestore();
  });

  it('should log supported formats header', () => {
    printSupportedFormat();
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Supported formats'));
  });

  it('should log a comma-separated list of formats', () => {
    printSupportedFormat();
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining(','));
  });

  it('should call process.exit with 0', () => {
    printSupportedFormat();
    expect(mockExit).toHaveBeenCalledWith(0);
  });
});
