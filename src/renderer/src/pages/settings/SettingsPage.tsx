import {useState, useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {FolderOpen, Globe, Monitor, Clipboard, Subtitles, Image, Download, Library, HardDrive, Settings, Zap, Shield, Info, FolderPlus, Trash2, RotateCcw} from 'lucide-react'
import {SUPPORTED_LANGS, LANGUAGE_NATIVE_NAMES, type SupportedLang} from '@shared/i18n/index.js'
import {useAppStore} from '../../store/useAppStore.js'
import {Button} from '../../components/ui/button.js'
import {Switch} from '../../components/ui/switch.js'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select.js'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '../../components/ui/tabs.js'
import {Input} from '../../components/ui/input.js'
import {ThemeToggle} from '../../components/system/ThemeToggle.js'

const TABS = [
	{id: 'general', icon: Settings, label: 'General'},
	{id: 'downloads', icon: Download, label: 'Downloads'},
	{id: 'library', icon: Library, label: 'Library'},
	{id: 'sources', icon: FolderPlus, label: 'Sources'},
	{id: 'converter', icon: Zap, label: 'Converter'},
	{id: 'viewer', icon: Monitor, label: 'Viewer'},
	{id: 'advanced', icon: Shield, label: 'Advanced'}
] as const

export function SettingsPage(): React.JSX.Element {
	const {t} = useTranslation()
	const {settings, language, setLanguage} = useAppStore()
	const [activeTab, setActiveTab] = useState('general')

	const updateSettings = useCallback(async (patch: Parameters<typeof window.appApi.settings.update>[0]) => {
		await window.appApi.settings.update(patch)
	}, [])

	const handleChangeOutputDir = useCallback(async () => {
		const result = await window.appApi.dialog.chooseFolder(settings?.common.defaultOutputDir)
		if (result.ok && result.data.path) {
			await updateSettings({common: {defaultOutputDir: result.data.path}})
		}
	}, [settings?.common.defaultOutputDir, updateSettings])

	const handleLanguageChange = useCallback(
		(lang: string | null) => {
			if (lang !== null) setLanguage(lang as SupportedLang)
		},
		[setLanguage]
	)

	if (!settings) return <div className="p-6" />

	const {common} = settings

	return (
		<div className="p-6 h-full flex flex-col">
			<h1 className="text-2xl font-bold mb-6">{t('nav.settings')}</h1>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
				<TabsList className="w-full justify-start overflow-x-auto">
					{TABS.map(tab => (
						<TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
							<tab.icon className="size-3.5" />
							<span className="hidden sm:inline">{tab.label}</span>
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="general" className="flex-1 space-y-4 mt-4">
					<SettingsSection icon={FolderOpen} title="Output Directory" description="Default location for downloaded files">
						<div className="flex items-center gap-2">
							<code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">{common.defaultOutputDir}</code>
							<Button variant="outline" size="sm" onClick={handleChangeOutputDir}>
								Change
							</Button>
						</div>
					</SettingsSection>

					<SettingsSection icon={Globe} title="Language" description="Application display language">
						<Select value={language} onValueChange={handleLanguageChange}>
							<SelectTrigger className="w-[180px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SUPPORTED_LANGS.map(code => (
									<SelectItem key={code} value={code}>
										{LANGUAGE_NATIVE_NAMES[code]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</SettingsSection>

					<SettingsSection icon={Monitor} title="Theme" description="Application appearance">
						<ThemeToggle />
					</SettingsSection>

					<SettingsSection icon={Clipboard} title="Clipboard Watch" description="Automatically detect URLs from clipboard">
						<Switch checked={common.clipboardWatchEnabled} onCheckedChange={checked => void updateSettings({common: {clipboardWatchEnabled: checked}})} />
					</SettingsSection>
				</TabsContent>

				<TabsContent value="downloads" className="flex-1 space-y-4 mt-4">
					<SettingsSection icon={Subtitles} title="Download Subtitles" description="Automatically download subtitles for videos">
						<Switch checked={(settings.single.lastSubtitleLanguages?.length ?? 0) > 0} onCheckedChange={checked => void updateSettings({single: {lastSubtitleLanguages: checked ? ['en'] : []}})} />
					</SettingsSection>

					<SettingsSection icon={Image} title="Embed Thumbnail" description="Embed thumbnail into downloaded video file">
						<Switch checked={common.embedThumbnail ?? false} onCheckedChange={checked => void updateSettings({common: {embedThumbnail: checked}})} />
					</SettingsSection>

					<SettingsSection icon={Download} title="Concurrent Downloads" description="Number of simultaneous downloads">
						<Input
							type="number"
							min={1}
							max={5}
							value={common.concurrentDownloads ?? 2}
							onChange={e => {
								const val = parseInt(e.target.value, 10)
								if (!isNaN(val) && val >= 1 && val <= 5) {
									void updateSettings({common: {concurrentDownloads: val}})
								}
							}}
							className="w-20"
						/>
					</SettingsSection>
				</TabsContent>

				<TabsContent value="library" className="flex-1 space-y-4 mt-4">
					<SettingsSection icon={Library} title="Library Auto-Import" description="Automatically add downloaded files to library">
						<Switch checked={common.autoImport ?? true} onCheckedChange={checked => void updateSettings({common: {autoImport: checked}})} />
					</SettingsSection>

					<SettingsSection icon={HardDrive} title="Metadata Extraction" description="Extract metadata from media files">
						<Switch checked={common.extractMetadata ?? true} onCheckedChange={checked => void updateSettings({common: {extractMetadata: checked}})} />
					</SettingsSection>

					<SettingsSection icon={Image} title="Thumbnail Generation" description="Generate thumbnails for media files">
						<Switch checked={common.generateThumbnails ?? true} onCheckedChange={checked => void updateSettings({common: {generateThumbnails: checked}})} />
					</SettingsSection>
				</TabsContent>

				<TabsContent value="sources" className="flex-1 space-y-4 mt-4">
					<div className="text-sm text-[var(--text-subtle)]">
						<p>Watched folders automatically import new media files into your library.</p>
						<p className="mt-2">Use the Library page to add and manage watched folders.</p>
					</div>
				</TabsContent>

				<TabsContent value="converter" className="flex-1 space-y-4 mt-4">
					<SettingsSection icon={Zap} title="Default Video Format" description="Default output format for video conversion">
						<Select value="mp4" onValueChange={() => {}}>
							<SelectTrigger className="w-[120px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="mp4">MP4</SelectItem>
								<SelectItem value="mkv">MKV</SelectItem>
								<SelectItem value="webm">WebM</SelectItem>
							</SelectContent>
						</Select>
					</SettingsSection>

					<SettingsSection icon={Zap} title="Default Audio Format" description="Default output format for audio conversion">
						<Select value="mp3" onValueChange={() => {}}>
							<SelectTrigger className="w-[120px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="mp3">MP3</SelectItem>
								<SelectItem value="aac">AAC</SelectItem>
								<SelectItem value="flac">FLAC</SelectItem>
								<SelectItem value="opus">Opus</SelectItem>
							</SelectContent>
						</Select>
					</SettingsSection>
				</TabsContent>

				<TabsContent value="viewer" className="flex-1 space-y-4 mt-4">
					<SettingsSection icon={Monitor} title="Comic Reading Mode" description="Default reading direction for comics">
						<Select value="rtl" onValueChange={() => {}}>
							<SelectTrigger className="w-[120px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="rtl">RTL (Manga)</SelectItem>
								<SelectItem value="ltr">LTR (Western)</SelectItem>
								<SelectItem value="vertical">Vertical</SelectItem>
							</SelectContent>
						</Select>
					</SettingsSection>
				</TabsContent>

				<TabsContent value="advanced" className="flex-1 space-y-4 mt-4">
					<SettingsSection icon={Info} title="Application Version" description="Current version of Arclio">
						<code className="text-xs bg-muted px-2 py-1 rounded">v0.4.1</code>
					</SettingsSection>

					<SettingsSection icon={FolderOpen} title="Open Log Directory" description="View application logs for debugging">
						<Button variant="outline" size="sm" onClick={() => void window.appApi.logs.openDir()}>
							Open Logs
						</Button>
					</SettingsSection>

					<SettingsSection icon={Trash2} title="Clear Thumbnail Cache" description="Remove all generated thumbnails">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								// TODO: Implement cache clear
							}}
						>
							<Trash2 className="size-4 mr-1" />
							Clear Cache
						</Button>
					</SettingsSection>

					<SettingsSection icon={RotateCcw} title="Reset Settings" description="Restore all settings to defaults">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								// TODO: Implement settings reset
							}}
						>
							<RotateCcw className="size-4 mr-1" />
							Reset
						</Button>
					</SettingsSection>
				</TabsContent>
			</Tabs>
		</div>
	)
}

function SettingsSection({icon: Icon, title, description, children}: {icon: typeof FolderOpen; title: string; description: string; children: React.ReactNode}): React.JSX.Element {
	return (
		<div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] bg-card">
			<div className="flex items-start gap-3 min-w-0">
				<Icon className="size-5 mt-0.5 text-[var(--text-subtle)] shrink-0" />
				<div className="min-w-0">
					<p className="text-sm font-medium">{title}</p>
					<p className="text-xs text-[var(--text-subtle)]">{description}</p>
				</div>
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	)
}
