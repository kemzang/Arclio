import type { AppError, AppErrorCode } from '@shared/types.js';
import type { YtDlpErrorKind } from '@shared/schemas.js';

export function createAppError(code: AppErrorCode, message: string, details?: string, recoverable = true, localizedKey?: YtDlpErrorKind): AppError {
  return { code, message, details, recoverable, localizedKey };
}

export function unknownToMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}
