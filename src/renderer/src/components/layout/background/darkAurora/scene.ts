import type {BackdropScene} from '../types.js'
import {FRAG} from './shader.js'

export const darkAuroraScene: BackdropScene = {bodyClassName: 'backdrop-dark-aurora', fragmentShader: FRAG, frameIntervalMs: 1000 / 30, id: 'dark-aurora', maxDevicePixelRatio: 1.5, renderScale: 0.7}
