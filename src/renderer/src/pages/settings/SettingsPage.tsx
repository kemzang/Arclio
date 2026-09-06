import {useState, useCallback} from 'react'
import {useTranslation} from 'react-i18next'
import {FolderOpen, Globe, Monitor, Clipboard, Subtitles, Image, Download, Library, Settings, Zap, Shield, Info, FolderPlus, Trash2, RotateCcw, UserRound} from 'lucide-react'
import {SUPPORTED_LANGS, LANGUAGE_NATIVE_NAMES, type SupportedLang} from '@shared/i18n/index.js'
import {useAppStore} from '../../store/useAppStore.js'
import {Button} from '../../components/ui/button.js'
import {Switch} from '../../components/ui/switch.js'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../../components/ui/select.js'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '../../components/ui/tabs.js'
import {ThemeToggle} from '../../components/system/ThemeToggle.js'
import {AccountPanel} from '../../components/system/AccountPanel.js'

const TABS = [
	{id: 'general', icon: Settings, labelKey: 'settings.tabs.general'},
	{id: 'downloads', icon: Download, labelKey: 'settings.tabs.downloads'},
	{id: 'library', icon: Library, labelKey: 'settings.tabs.library'},
	{id: 'sources', icon: FolderPlus, labelKey: 'settings.tabs.sources'},
	{id: 'converter', icon: Zap, labelKey: 'settings.tabs.converter'},
	{id: 'viewer', icon: Monitor, labelKey: 'settings.tabs.viewer'},
	{id: 'account', icon: UserRound, labelKey: 'settings.tabs.account'},
	{id: 'advanced', icon: Shield, labelKey: 'settings.tabs.advanced'}
] as const

export function SettingsPage(): React.JSX.Element {
	const {t} = useTranslation()
	const {settings, language, setLanguage, applySettingsPatch, resetSettings} = useAppStore()
	const [activeTab, setActiveTab] = useState('general')
	const [cacheStatus, setCacheStatus] = useState<string | null>(null)

	// Routed through the store so the controls reflect the saved value; calling
	// the IPC bridge directly leaves the rendered state stale.
	const updateSettings = applySettingsPatch

	const handleClearThumbnailCache = useCallback(async () => {
		setCacheStatus(null)
		const {removed, freedBytes} = await window.appApi.thumbnail.clearCache()
		const megabytes = freedBytes / (1024 * 1024)
		setCacheStatus(removed === 0 ? t('settings.advanced.cacheEmpty') : t('settings.advanced.cacheCleared', {count: removed, size: megabytes.toFixed(1)}))
	}, [t])

	const handleResetSettings = useCallback(async () => {
		await resetSettings()
	}, [resetSettings])

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
							<span className="hidden sm:inline">{t(tab.labelKey)}</span>
						</TabsTrigger>
					))}
				</TabsList>

				<TabsContent value="general" className="flex-1 space-y-4 mt-4">
					<SettingsSection icon={FolderOpen} title={t('settings.outputDir')} description={t('settings.outputDirDescription')}>
						<div className="flex items-center gap-2">
							<code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate">{common.defaultOutputDir}</code>
							<Button variant="outline" size="sm" onClick={() => void handleChangeOutputDir()}>
								{t('settings.change')}
							</Button>
						</div>
					</SettingsSection>

					<SettingsSection icon={Globe} title={t('settings.language')} description={t('settings.languageDescription')}>
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

					<SettingsSection icon={Monitor} title={t('settings.theme')} description={t('settings.themeDescription')}>
						<ThemeToggle />
					</SettingsSection>

					<SettingsSection icon={Clipboard} title={t('settings.clipboardWatch')} description={t('settings.clipboardWatchDescription')}>
						<Switch checked={common.clipboardWatchEnabled} onCheckedChange={checked => void updateSettings({common: {clipboardWatchEnabled: checked}})} />
					</SettingsSection>
				</TabsContent>

				<TabsContent value="downloads" className="flex-1 space-y-4 mt-4">
					<SettingsSection icon={Subtitles} title={t('settings.writeSubtitles')} description={t('settings.writeSubtitlesDescription')}>
						<Switch checked={(settings.single.lastSubtitleLanguages?.length ?? 0) > 0} onCheckedChange={checked => void updateSettings({single: {lastSubtitleLanguages: checked ? ['en'] : []}})} />
					</SettingsSection>

					<SettingsSection icon={Image} title={t('settings.embedThumbnail')} description={t('settings.embedThumbnailDescription')}>
						<Switch checked={common.embedThumbnail ?? false} onCheckedChange={checked => void updateSettings({common: {embedThumbnail: checked}})} />
					</SettingsSection>
				</TabsContent>

				<TabsContent value="library" className="flex-1 space-y-4 mt-4">
					<div className="text-sm text-[var(--text-subtle)]">
						<p>{t('settings.library.autoIndexInfo')}</p>
						<p className="mt-2">{t('settings.library.browseHint')}</p>
					</div>
				</TabsContent>

				<TabsContent value="sources" className="flex-1 space-y-4 mt-4">
					<div className="text-sm text-[var(--text-subtle)]">
						<p>{t('settings.sources.watchedFoldersInfo')}</p>
						<p className="mt-2">{t('settings.sources.manageHint')}</p>
					</div>
				</TabsContent>

				<TabsContent value="converter" className="flex-1 space-y-4 mt-4">
					<div className="text-sm text-[var(--text-subtle)]">
						<p>{t('settings.converter.perFileInfo')}</p>
						<p className="mt-2">{t('settings.converter.openHint')}</p>
					</div>
				</TabsContent>

				<TabsContent value="viewer" className="flex-1 space-y-4 mt-4">
					<div className="text-sm text-[var(--text-subtle)]">
						<p>{t('settings.viewer.readingDirectionInfo')}</p>
					</div>
				</TabsContent>

				<TabsContent value="account" className="flex-1 space-y-4 mt-4">
					<AccountPanel />
				</TabsContent>

				<TabsContent value="advanced" className="flex-1 space-y-4 mt-4">
					<SettingsSection icon={Info} title={t('settings.advanced.appVersionTitle')} description={t('settings.advanced.appVersionDescription')}>
						<code className="text-xs bg-muted px-2 py-1 rounded">v{window.appVersion}</code>
					</SettingsSection>

					<SettingsSection icon={FolderOpen} title={t('settings.advanced.openLogDirTitle')} description={t('settings.advanced.openLogDirDescription')}>
						<Button variant="outline" size="sm" onClick={() => void window.appApi.logs.openDir()}>
							{t('settings.advanced.openLogsButton')}
						</Button>
					</SettingsSection>

					<SettingsSection icon={Trash2} title={t('settings.advanced.clearCacheTitle')} description={cacheStatus ?? t('settings.advanced.clearCacheDescription')}>
						<Button variant="outline" size="sm" onClick={() => void handleClearThumbnailCache()}>
							<Trash2 className="size-4 mr-1" />
							{t('settings.advanced.clearCacheButton')}
						</Button>
					</SettingsSection>

					<SettingsSection icon={RotateCcw} title={t('settings.advanced.resetTitle')} description={t('settings.advanced.resetDescription')}>
						<Button variant="outline" size="sm" onClick={() => void handleResetSettings()}>
							<RotateCcw className="size-4 mr-1" />
							{t('settings.advanced.resetButton')}
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
