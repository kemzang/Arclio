import type {ThumbnailOptions, ThumbnailResult} from './types'
import {ThumbnailCache} from './ThumbnailCache'

export class ThumbnailGenerator {
	#cache: ThumbnailCache
	#outputDir: string

	constructor(outputDir: string, cacheDir: string, cacheSize = 500) {
		this.#outputDir = outputDir
		this.#cache = new ThumbnailCache(cacheDir, cacheSize)
	}

	generate(sourcePath: string, options: ThumbnailOptions): Promise<ThumbnailResult> {
		const key = this.#makeKey(sourcePath, options)
		const cached = this.#cache.get(key)
		if (cached) {
			return Promise.resolve({path: cached.path, width: options.width, height: options.height, size: cached.size})
		}

		// Stub implementation — real implementation would use ffmpeg/sharp
		const result: ThumbnailResult = {path: `${this.#outputDir}/${key}.${options.format === 'jpeg' ? 'jpg' : options.format}`, width: options.width, height: options.height, size: 0}

		this.#cache.set({key, path: result.path, createdAt: Date.now(), accessedAt: Date.now(), size: result.size})

		return Promise.resolve(result)
	}

	regenerate(sourcePath: string, options: ThumbnailOptions): Promise<ThumbnailResult> {
		const key = this.#makeKey(sourcePath, options)
		this.#cache.delete(key)
		return this.generate(sourcePath, options)
	}

	remove(sourcePath: string, options: ThumbnailOptions): Promise<void> {
		const key = this.#makeKey(sourcePath, options)
		this.#cache.delete(key)
		return Promise.resolve()
	}

	#makeKey(sourcePath: string, options: ThumbnailOptions): string {
		return `${sourcePath}-${options.width}x${options.height}-${options.format}`
	}
}
