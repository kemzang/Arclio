export type BackdropColorScheme = 'light' | 'dark'
export type BackdropMode = 'webgl' | 'css'
export type BackdropSceneId = 'dark-aurora' | 'light-ocean'

export interface BackdropScene {
	bodyClassName: string
	fragmentShader: string
	frameIntervalMs: number
	id: BackdropSceneId
	maxDevicePixelRatio: number
	renderScale: number
}
