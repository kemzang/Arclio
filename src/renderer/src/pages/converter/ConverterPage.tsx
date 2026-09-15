import {useState, useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {FileUp, Zap, CheckCircle2, AlertCircle, Loader2, FolderOpen} from 'lucide-react'
import type {TFunction} from 'i18next'
import type {ConversionResult} from '@shared/api.js'
import type {ConversionFormat} from '@shared/schemas.js'
import {Button} from '@renderer/components/ui/button.js'
import {Input} from '@renderer/components/ui/input.js'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@renderer/components/ui/select.js'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@renderer/components/ui/tabs.js'

type ConverterMode = 'video' | 'audio' | 'image' | 'extract' | 'gif'

const VIDEO_FORMATS: ConversionFormat[] = ['mp4', 'mkv', 'webm', 'avi']
const AUDIO_FORMATS: ConversionFormat[] = ['mp3', 'aac', 'flac', 'opus', 'wav', 'ogg']
const IMAGE_FORMATS: ConversionFormat[] = ['jpg', 'png', 'webp', 'avif']

// `KEEP_ORIGINAL` is a sentinel rather than '' so the select always has a
// matching item to display; it maps back to "no -vf scale argument".
const KEEP_ORIGINAL = 'original'

const VIDEO_RESOLUTIONS = [
	{value: KEEP_ORIGINAL, labelKey: 'converter.resolutions.original'},
	{value: '3840:-2', labelKey: 'converter.resolutions.2160'},
	{value: '1920:-2', labelKey: 'converter.resolutions.1080'},
	{value: '1280:-2', labelKey: 'converter.resolutions.720'},
	{value: '854:-2', labelKey: 'converter.resolutions.480'}
] as const

function resolutionLabel(value: string, t: TFunction): string {
	const option = VIDEO_RESOLUTIONS.find(candidate => candidate.value === value)
	return option ? t(option.labelKey) : value
}

const AUDIO_BITRATES = ['320k', '256k', '192k', '128k', '96k']

const MODE_TABS = [
	{id: 'video', labelKey: 'converter.modes.video'},
	{id: 'audio', labelKey: 'converter.modes.audio'},
	{id: 'image', labelKey: 'converter.modes.image'},
	{id: 'extract', labelKey: 'converter.modes.extract'},
	{id: 'gif', labelKey: 'converter.modes.gif'}
] as const satisfies {id: ConverterMode; labelKey: string}[]

export function ConverterPage(): React.JSX.Element {
	const {t} = useTranslation()
	const [mode, setMode] = useState<ConverterMode>('video')
	const [inputPath, setInputPath] = useState<string | null>(null)
	const [running, setRunning] = useState(false)
	const [result, setResult] = useState<ConversionResult | null>(null)

	const [videoFormat, setVideoFormat] = useState<ConversionFormat>('mp4')
	const [resolution, setResolution] = useState(KEEP_ORIGINAL)
	const [crf, setCrf] = useState('23')

	const [audioFormat, setAudioFormat] = useState<ConversionFormat>('mp3')
	const [bitrate, setBitrate] = useState('192k')

	const [imageFormat, setImageFormat] = useState<ConversionFormat>('webp')
	const [imageWidth, setImageWidth] = useState('')
	const [quality, setQuality] = useState('85')

	const [gifFps, setGifFps] = useState('10')
	const [gifWidth, setGifWidth] = useState('480')

	const pickFile = useCallback(async () => {
		const picked = await window.appApi.dialog.chooseFile()
		if (picked.ok && picked.data.path) {
			setInputPath(picked.data.path)
			setResult(null)
		}
	}, [])

	const numeric = (value: string): number | undefined => {
		const parsed = Number(value)
		return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
	}

	const runConversion = useCallback(async () => {
		if (!inputPath) return
		setRunning(true)
		setResult(null)
		try {
			const converter = window.appApi.converter
			let outcome: ConversionResult
			switch (mode) {
				case 'video':
					outcome = await converter.convertVideo(inputPath, {format: videoFormat, resolution: resolution === KEEP_ORIGINAL ? undefined : resolution, crf: numeric(crf)})
					break
				case 'audio':
					outcome = await converter.convertAudio(inputPath, {format: audioFormat, bitrate})
					break
				case 'image':
					outcome = await converter.convertImage(inputPath, {format: imageFormat, width: numeric(imageWidth), quality: numeric(quality)})
					break
				case 'extract':
					outcome = await converter.extractAudio(inputPath, audioFormat)
					break
				case 'gif':
					outcome = await converter.createGif(inputPath, {fps: numeric(gifFps), width: numeric(gifWidth)})
					break
			}
			setResult(outcome)
		} catch (error) {
			setResult({success: false, error: error instanceof Error ? error.message : String(error)})
		} finally {
			setRunning(false)
		}
	}, [audioFormat, bitrate, crf, gifFps, gifWidth, imageFormat, imageWidth, inputPath, mode, quality, resolution, videoFormat])

	const fileName = inputPath?.split(/[/\\]/).pop() ?? null

	return (
		<div className="p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">{t('converter.title')}</h1>
			</div>

			<p className="text-sm text-[var(--text-subtle)]">{t('converter.description')}</p>

			{/* Source file */}
			<div className="rounded-xl border border-[var(--border)] bg-[var(--glass-tile)] p-4 flex items-center gap-3">
				<FileUp className="size-5 text-[var(--text-subtle)] shrink-0" />
				<div className="min-w-0 flex-1">
					{fileName ? (
						<>
							<p className="text-sm font-medium truncate">{fileName}</p>
							<p className="text-xs text-[var(--text-subtle)] truncate">{inputPath}</p>
						</>
					) : (
						<p className="text-sm text-[var(--text-subtle)]">{t('converter.noFileSelected')}</p>
					)}
				</div>
				<Button variant="outline" size="sm" onClick={() => void pickFile()}>
					<FolderOpen className="size-4 mr-1" />
					{t('converter.chooseFile')}
				</Button>
			</div>

			<Tabs value={mode} onValueChange={value => setMode(value as ConverterMode)}>
				<TabsList className="w-full justify-start overflow-x-auto">
					{MODE_TABS.map(tab => (
						<TabsTrigger key={tab.id} value={tab.id}>
							{t(tab.labelKey)}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="video" className="space-y-3 mt-4">
					<OptionRow label={t('converter.outputFormat')}>
						<FormatSelect value={videoFormat} onChange={setVideoFormat} options={VIDEO_FORMATS} />
					</OptionRow>
					<OptionRow label={t('converter.resolution')}>
						<Select value={resolution} onValueChange={value => setResolution(value ?? KEEP_ORIGINAL)}>
							<SelectTrigger className="w-[180px]">
								<SelectValue>{resolutionLabel(resolution, t)}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{VIDEO_RESOLUTIONS.map(option => (
									<SelectItem key={option.value} value={option.value}>
										{t(option.labelKey)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</OptionRow>
					<OptionRow label={t('converter.qualityCrf')} hint={t('converter.qualityCrfHint')}>
						<Input type="number" min={0} max={51} value={crf} onChange={e => setCrf(e.target.value)} className="w-24" />
					</OptionRow>
				</TabsContent>

				<TabsContent value="audio" className="space-y-3 mt-4">
					<OptionRow label={t('converter.outputFormat')}>
						<FormatSelect value={audioFormat} onChange={setAudioFormat} options={AUDIO_FORMATS} />
					</OptionRow>
					<OptionRow label={t('converter.bitrate')}>
						<Select value={bitrate} onValueChange={value => setBitrate(value ?? '192k')}>
							<SelectTrigger className="w-[120px]">
								<SelectValue>{bitrate}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{AUDIO_BITRATES.map(option => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</OptionRow>
				</TabsContent>

				<TabsContent value="image" className="space-y-3 mt-4">
					<OptionRow label={t('converter.outputFormat')}>
						<FormatSelect value={imageFormat} onChange={setImageFormat} options={IMAGE_FORMATS} />
					</OptionRow>
					<OptionRow label={t('converter.width')} hint={t('converter.widthHint')}>
						<Input type="number" min={1} placeholder="auto" value={imageWidth} onChange={e => setImageWidth(e.target.value)} className="w-28" />
					</OptionRow>
					<OptionRow label={t('converter.quality')}>
						<Input type="number" min={1} max={100} value={quality} onChange={e => setQuality(e.target.value)} className="w-24" />
					</OptionRow>
				</TabsContent>

				<TabsContent value="extract" className="space-y-3 mt-4">
					<OptionRow label={t('converter.audioFormat')} hint={t('converter.audioFormatHint')}>
						<FormatSelect value={audioFormat} onChange={setAudioFormat} options={AUDIO_FORMATS} />
					</OptionRow>
				</TabsContent>

				<TabsContent value="gif" className="space-y-3 mt-4">
					<OptionRow label={t('converter.fps')}>
						<Input type="number" min={1} max={50} value={gifFps} onChange={e => setGifFps(e.target.value)} className="w-24" />
					</OptionRow>
					<OptionRow label={t('converter.width')}>
						<Input type="number" min={1} value={gifWidth} onChange={e => setGifWidth(e.target.value)} className="w-28" />
					</OptionRow>
				</TabsContent>
			</Tabs>

			<div className="flex items-center gap-3 pt-2">
				<Button disabled={!inputPath || running} onClick={() => void runConversion()} className="shadow-[0_4px_14px_var(--brand-glow)]">
					{running ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Zap className="size-4 mr-1" />}
					{running ? t('converter.converting') : t('converter.convert')}
				</Button>
				{!inputPath && <span className="text-xs text-[var(--text-subtle)]">{t('converter.chooseFileHint')}</span>}
			</div>

			{result && (
				<div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${result.success ? 'border-emerald-500/40 text-emerald-500' : 'border-red-500/40 text-red-500'}`}>
					{result.success ? <CheckCircle2 className="size-4 mt-0.5 shrink-0" /> : <AlertCircle className="size-4 mt-0.5 shrink-0" />}
					<div className="min-w-0">
						{result.success ? (
							<>
								<p className="font-medium">{t('converter.conversionComplete')}</p>
								<p className="text-xs opacity-80 break-all">{result.outputPath}</p>
								<ShowInFolderButton outputPath={result.outputPath} />
							</>
						) : (
							<>
								<p className="font-medium">{t('converter.conversionFailed')}</p>
								<p className="text-xs opacity-80 break-all">{result.error}</p>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

function ShowInFolderButton({outputPath}: {outputPath: string | undefined}): React.JSX.Element | null {
	const {t} = useTranslation()
	if (!outputPath) return null
	return (
		<Button variant="outline" size="sm" className="mt-2" onClick={() => void window.appApi.shell.openFolder(outputPath)}>
			<FolderOpen className="size-4 mr-1" />
			{t('converter.showInFolder')}
		</Button>
	)
}

function OptionRow({label, hint, children}: {label: string; hint?: string; children: React.ReactNode}): React.JSX.Element {
	return (
		<div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] px-4 py-3">
			<div className="min-w-0">
				<p className="text-sm font-medium">{label}</p>
				{hint && <p className="text-xs text-[var(--text-subtle)]">{hint}</p>}
			</div>
			{children}
		</div>
	)
}

function FormatSelect({value, onChange, options}: {value: ConversionFormat; onChange: (value: ConversionFormat) => void; options: ConversionFormat[]}): React.JSX.Element {
	return (
		<Select value={value} onValueChange={next => next && onChange(next)}>
			<SelectTrigger className="w-[120px]">
				<SelectValue>{value.toUpperCase()}</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{options.map(option => (
					<SelectItem key={option} value={option}>
						{option.toUpperCase()}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
