import type {UiTheme} from '@shared/schemas.js'

export const BOOT_SPLASH_DARK_BACKGROUND_COLOR = '#050813'
export const BOOT_SPLASH_LIGHT_BACKGROUND_COLOR = '#f1f3f9'

export function resolveMainWindowBackgroundColor(uiTheme: UiTheme | undefined, systemPrefersDark: boolean): string {
	if (uiTheme === 'dark') return BOOT_SPLASH_DARK_BACKGROUND_COLOR
	if (uiTheme === 'light') return BOOT_SPLASH_LIGHT_BACKGROUND_COLOR
	return systemPrefersDark ? BOOT_SPLASH_DARK_BACKGROUND_COLOR : BOOT_SPLASH_LIGHT_BACKGROUND_COLOR
}
