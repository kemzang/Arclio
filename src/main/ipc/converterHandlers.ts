import {ipcMain} from 'electron'
import type {ConverterService, ConversionFormat, ConversionOptions} from '@main/services/ConverterService.js'

export function registerConverterHandlers(converterService: ConverterService): void {
	ipcMain.handle('converter:convert', async (_event, inputPath: string, format: ConversionFormat, options?: ConversionOptions, outputDir?: string) => {
		return converterService.convert(inputPath, format, options, outputDir)
	})

	ipcMain.handle('converter:convertVideo', async (_event, inputPath: string, options?: {format?: string; codec?: string; resolution?: string; crf?: number; trimStart?: string; trimEnd?: string}) => {
		return converterService.convertVideo(inputPath, options)
	})

	ipcMain.handle('converter:convertAudio', async (_event, inputPath: string, options?: {format?: string; bitrate?: string; sampleRate?: number}) => {
		return converterService.convertAudio(inputPath, options)
	})

	ipcMain.handle('converter:convertImage', async (_event, inputPath: string, options?: {format?: string; width?: number; height?: number; quality?: number}) => {
		return converterService.convertImage(inputPath, options)
	})

	ipcMain.handle('converter:extractAudio', async (_event, videoPath: string, format?: string) => {
		return converterService.extractAudio(videoPath, format as 'mp3' | 'aac' | 'flac' | 'opus' | 'wav')
	})

	ipcMain.handle('converter:createGif', async (_event, videoPath: string, options?: {fps?: number; width?: number; duration?: number}) => {
		return converterService.createGif(videoPath, options)
	})
}
