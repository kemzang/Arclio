import {useState, useCallback} from 'react'
import {FileUp, Zap, CheckCircle2, AlertCircle, Loader2, FolderOpen} from 'lucide-react'
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
	{value: KEEP_ORIGINAL, label: 'Keep original'},
	{value: '3840:-2', label: '4K (2160p)'},
	{value: '1920:-2', label: 'Full HD (1080p)'},
	{value: '1280:-2', label: 'HD (720p)'},
	{value: '854:-2', label: 'SD (480p)'}
]

function resolutionLabel(value: string): string {
	return VIDEO_RESOLUTIONS.find(option => option.value === value)?.label ?? value
}

const AUDIO_BITRATES = ['320k', '256k', '192k', '128k', '96k']

const MODE_TABS: {id: ConverterMode; label: string}[] = [
	{id: 'video', label: 'Video'},
	{id: 'audio', label: 'Audio'},
	{id: 'image', label: 'Image'},
	{id: 'extract', label: 'Extract audio'},
	{id: 'gif', label: 'GIF'}
]

export function ConverterPage(): React.JSX.Element {
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
				<h1 className="text-2xl font-bold">Converter</h1>
			</div>

			<p className="text-sm text-[var(--text-subtle)]">Convert media already on your disk. The original file is never modified — output is written alongside it.</p>

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
						<p className="text-sm text-[var(--text-subtle)]">No file selected</p>
					)}
				</div>
				<Button variant="outline" size="sm" onClick={() => void pickFile()}>
					<FolderOpen className="size-4 mr-1" />
					Choose file
				</Button>
			</div>

			<Tabs value={mode} onValueChange={value => setMode(value as ConverterMode)}>
				<TabsList className="w-full justify-start overflow-x-auto">
					{MODE_TABS.map(tab => (
						<TabsTrigger key={tab.id} value={tab.id}>
							{tab.label}
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="video" className="space-y-3 mt-4">
					<OptionRow label="Output format">
						<FormatSelect value={videoFormat} onChange={setVideoFormat} options={VIDEO_FORMATS} />
					</OptionRow>
					<OptionRow label="Resolution">
						<Select value={resolution} onValueChange={value => setResolution(value ?? KEEP_ORIGINAL)}>
							<SelectTrigger className="w-[180px]">
								<SelectValue>{resolutionLabel(resolution)}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{VIDEO_RESOLUTIONS.map(option => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</OptionRow>
					<OptionRow label="Quality (CRF)" hint="Lower is better quality and a larger file. 23 is a good default.">
						<Input type="number" min={0} max={51} value={crf} onChange={e => setCrf(e.target.value)} className="w-24" />
					</OptionRow>
				</TabsContent>

				<TabsContent value="audio" className="space-y-3 mt-4">
					<OptionRow label="Output format">
						<FormatSelect value={audioFormat} onChange={setAudioFormat} options={AUDIO_FORMATS} />
					</OptionRow>
					<OptionRow label="Bitrate">
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
					<OptionRow label="Output format">
						<FormatSelect value={imageFormat} onChange={setImageFormat} options={IMAGE_FORMATS} />
					</OptionRow>
					<OptionRow label="Width" hint="Leave empty to keep the original size. Height scales proportionally.">
						<Input type="number" min={1} placeholder="auto" value={imageWidth} onChange={e => setImageWidth(e.target.value)} className="w-28" />
					</OptionRow>
					<OptionRow label="Quality">
						<Input type="number" min={1} max={100} value={quality} onChange={e => setQuality(e.target.value)} className="w-24" />
					</OptionRow>
				</TabsContent>

				<TabsContent value="extract" className="space-y-3 mt-4">
					<OptionRow label="Audio format" hint="Pulls the audio track out of a video file.">
						<FormatSelect value={audioFormat} onChange={setAudioFormat} options={AUDIO_FORMATS} />
					</OptionRow>
				</TabsContent>

				<TabsContent value="gif" className="space-y-3 mt-4">
					<OptionRow label="Frames per second">
						<Input type="number" min={1} max={50} value={gifFps} onChange={e => setGifFps(e.target.value)} className="w-24" />
					</OptionRow>
					<OptionRow label="Width">
						<Input type="number" min={1} value={gifWidth} onChange={e => setGifWidth(e.target.value)} className="w-28" />
					</OptionRow>
				</TabsContent>
			</Tabs>

			<div className="flex items-center gap-3 pt-2">
				<Button disabled={!inputPath || running} onClick={() => void runConversion()} className="shadow-[0_4px_14px_var(--brand-glow)]">
					{running ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Zap className="size-4 mr-1" />}
					{running ? 'Converting…' : 'Convert'}
				</Button>
				{!inputPath && <span className="text-xs text-[var(--text-subtle)]">Choose a file to start.</span>}
			</div>

			{result && (
				<div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${result.success ? 'border-emerald-500/40 text-emerald-500' : 'border-red-500/40 text-red-500'}`}>
					{result.success ? <CheckCircle2 className="size-4 mt-0.5 shrink-0" /> : <AlertCircle className="size-4 mt-0.5 shrink-0" />}
					<div className="min-w-0">
						{result.success ? (
							<>
								<p className="font-medium">Conversion complete</p>
								<p className="text-xs opacity-80 break-all">{result.outputPath}</p>
								<ShowInFolderButton outputPath={result.outputPath} />
							</>
						) : (
							<>
								<p className="font-medium">Conversion failed</p>
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
	if (!outputPath) return null
	return (
		<Button variant="outline" size="sm" className="mt-2" onClick={() => void window.appApi.shell.openFolder(outputPath)}>
			<FolderOpen className="size-4 mr-1" />
			Show in folder
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
