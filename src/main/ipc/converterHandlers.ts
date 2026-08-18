import {ipcMain} from 'electron'
import {z} from 'zod'
import {conversionFormatSchema} from '@shared/schemas.js'
import type {ConverterService} from '@main/services/ConverterService.js'
import type {ConversionResult} from '@main/services/ConverterService.js'

// Renderer input reaches ffmpeg argument construction, so every payload is
// parsed here instead of being trusted as typed.
const conversionOptionsSchema = z
	.object({
		videoCodec: z.string().min(1),
		audioCodec: z.string().min(1),
		resolution: z.string().min(1),
		bitrate: z.string().min(1),
		fps: z.number().positive(),
		crf: z.number().int().min(0).max(63),
		trimStart: z.string().min(1),
		trimEnd: z.string().min(1),
		audioBitrate: z.string().min(1),
		sampleRate: z.number().positive(),
		channels: z.number().int().positive(),
		volume: z.number().min(0),
		quality: z.number().int().min(1).max(100),
		width: z.number().int().positive(),
		height: z.number().int().positive(),
		fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']),
		preset: z.enum(['ultrafast', 'fast', 'medium', 'slow', 'veryslow'])
	})
	.partial()

const videoOptionsSchema = z.object({format: conversionFormatSchema, codec: z.string().min(1), resolution: z.string().min(1), crf: z.number().int().min(0).max(63), trimStart: z.string().min(1), trimEnd: z.string().min(1)}).partial()

const audioOptionsSchema = z.object({format: conversionFormatSchema, bitrate: z.string().min(1), sampleRate: z.number().positive()}).partial()

const imageOptionsSchema = z.object({format: conversionFormatSchema, width: z.number().int().positive(), height: z.number().int().positive(), quality: z.number().int().min(1).max(100)}).partial()

const gifOptionsSchema = z.object({fps: z.number().positive(), width: z.number().int().positive(), duration: z.number().positive()}).partial()

const filePathSchema = z.string().min(1)

function invalid(error: z.ZodError): ConversionResult {
	return {success: false, error: `Invalid conversion request: ${z.prettifyError(error)}`}
}

export function registerConverterHandlers(converterService: ConverterService): void {
	ipcMain.removeHandler('converter:convert')
	ipcMain.handle('converter:convert', async (_event, inputPath: unknown, format: unknown, options: unknown, outputDir: unknown) => {
		const parsed = z.object({inputPath: filePathSchema, format: conversionFormatSchema, options: conversionOptionsSchema.optional(), outputDir: filePathSchema.optional()}).safeParse({inputPath, format, options, outputDir})
		if (!parsed.success) return invalid(parsed.error)
		return converterService.convert(parsed.data.inputPath, parsed.data.format, parsed.data.options, parsed.data.outputDir)
	})

	ipcMain.removeHandler('converter:convertVideo')
	ipcMain.handle('converter:convertVideo', async (_event, inputPath: unknown, options: unknown) => {
		const parsed = z.object({inputPath: filePathSchema, options: videoOptionsSchema.optional()}).safeParse({inputPath, options})
		if (!parsed.success) return invalid(parsed.error)
		return converterService.convertVideo(parsed.data.inputPath, parsed.data.options)
	})

	ipcMain.removeHandler('converter:convertAudio')
	ipcMain.handle('converter:convertAudio', async (_event, inputPath: unknown, options: unknown) => {
		const parsed = z.object({inputPath: filePathSchema, options: audioOptionsSchema.optional()}).safeParse({inputPath, options})
		if (!parsed.success) return invalid(parsed.error)
		return converterService.convertAudio(parsed.data.inputPath, parsed.data.options)
	})

	ipcMain.removeHandler('converter:convertImage')
	ipcMain.handle('converter:convertImage', async (_event, inputPath: unknown, options: unknown) => {
		const parsed = z.object({inputPath: filePathSchema, options: imageOptionsSchema.optional()}).safeParse({inputPath, options})
		if (!parsed.success) return invalid(parsed.error)
		return converterService.convertImage(parsed.data.inputPath, parsed.data.options)
	})

	ipcMain.removeHandler('converter:extractAudio')
	ipcMain.handle('converter:extractAudio', async (_event, videoPath: unknown, format: unknown) => {
		const parsed = z.object({videoPath: filePathSchema, format: conversionFormatSchema.optional()}).safeParse({videoPath, format})
		if (!parsed.success) return invalid(parsed.error)
		return converterService.extractAudio(parsed.data.videoPath, parsed.data.format)
	})

	ipcMain.removeHandler('converter:createGif')
	ipcMain.handle('converter:createGif', async (_event, videoPath: unknown, options: unknown) => {
		const parsed = z.object({videoPath: filePathSchema, options: gifOptionsSchema.optional()}).safeParse({videoPath, options})
		if (!parsed.success) return invalid(parsed.error)
		return converterService.createGif(parsed.data.videoPath, parsed.data.options)
	})
}
