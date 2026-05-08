import log from 'electron-log/main.js';
import { IPC_CHANNELS } from '@shared/ipc.js';
import { supportedLangSchema } from '@shared/schemas.js';
import type { SupportedLang } from '@shared/i18n/types.js';
import type { WarmupService } from '@main/services/WarmupService.js';
import { handleRaw } from './utils.js';

interface AppHandlerDeps {
  warmupService: WarmupService;
  languageRef: { current: SupportedLang };
}

export function registerAppHandlers(deps: AppHandlerDeps): void {
  const { warmupService, languageRef } = deps;

  handleRaw(IPC_CHANNELS.appWarmUp, (_, payload: unknown) => {
    const force = typeof payload === 'object' && payload !== null && (payload as { force?: unknown }).force === true;
    return warmupService.run({ force });
  });

  handleRaw(IPC_CHANNELS.appCancelWarmup, () => {
    warmupService.cancel();
  });

  handleRaw(IPC_CHANNELS.appSetLanguage, (_, payload: unknown) => {
    const parsed = supportedLangSchema.safeParse(payload);
    if (parsed.success) {
      languageRef.current = parsed.data;
    } else {
      log.warn('app:setLanguage rejected — invalid language', { payload });
    }
  });
}
