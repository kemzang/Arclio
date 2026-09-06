import {useId, useState, type ReactNode} from 'react'
import {useTranslation} from 'react-i18next'
import {Captions, ChevronDown, Folder, FolderCog, Plus, RotateCcw, X} from 'lucide-react'
import {DOWNLOAD_PROFILE_ICONS} from '@shared/schemas.js'
import type {CommonSettings, DownloadProfile, DownloadProfileAudioFormat, DownloadProfileIcon, PlaylistVideoCodec, SponsorBlockMode, SubtitleFormat, SubtitleMode} from '@shared/types.js'
import {effectiveOutputDir} from '@shared/subfolder.js'
import {cn} from '@renderer/lib/utils.js'
import {createDownloadProfileDraft, defaultProfileSubfolderName, downloadProfileFromDraft, type DownloadProfileDraftAction, type DownloadProfileMediaMode, updateDownloadProfileDraft, validateDownloadProfileDraft} from '../../store/wizard/downloadProfileDraft.js'
import {Alert, AlertDescription} from '../ui/alert.js'
import {Badge} from '../ui/badge.js'
import {Button} from '../ui/button.js'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../ui/card.js'
import {Checkbox} from '../ui/checkbox.js'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '../ui/dialog.js'
import {Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle} from '../ui/field.js'
import {InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput} from '../ui/input-group.js'
import {Popover, PopoverContent, PopoverTrigger} from '../ui/popover.js'
import {ScrollArea} from '../ui/scroll-area.js'
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from '../ui/select.js'
import {ToggleGroup, ToggleGroupItem} from '../ui/toggle-group.js'
import {ProfileSwitchRow} from './DownloadProfileSwitchRow.js'
import {
	audioFormatOptions,
	audioQualityOptions,
	createProfileId,
	fallbackFinalPath,
	mediaModes,
	OUTPUT_MODE_CARD_CLASS,
	optionLabel,
	outputOptionDescriptions,
	profileIconMeta,
	readablePath,
	resolutionOptions,
	SELECTABLE_TOGGLE_CLASS,
	SMART_TV_MP4_BLOCKED_RESOLUTIONS,
	type SelectOption,
	sponsorBlockHints,
	sponsorBlockOptions,
	subtitleDeliveryOptions,
	subtitleFormatOptions,
	subtitleSourceOptions,
	videoAudioFormatOptions,
	videoCompatibilityOptions
} from './downloadProfileEditorOptions.js'

interface ResetProfileAction {
	enabled: boolean
	onReset: () => Promise<void> | void
}

interface DownloadProfileEditorProps {
	commonPaths?: CommonSettings['commonPaths']
	globalDestination?: string
	initialProfile?: DownloadProfile | null
	onChangeGlobalDestination?: () => Promise<void> | void
	onOpenChange: (open: boolean) => void
	onSave?: (profile: DownloadProfile) => void | Promise<void>
	open: boolean
	resetProfile?: ResetProfileAction
}

function ProfilePanel({title, description, children, className}: {title: string; description?: string; children: ReactNode; className?: string}): ReactNode {
	return (
		<Card size="sm" className={cn('gap-3 rounded-lg border-[var(--border-strong)] bg-card/40 py-3', className)}>
			<CardHeader className="gap-1 px-3">
				<CardTitle className="text-sm font-semibold leading-tight">{title}</CardTitle>
				{description ? <CardDescription className="text-[12px] leading-snug text-[var(--text-subtle)]">{description}</CardDescription> : null}
			</CardHeader>
			<CardContent className="px-3">{children}</CardContent>
		</Card>
	)
}

function ProfileSelect<T extends string>({label, value, options, onValueChange, testId, disabled = false}: {label: string; value: T; options: readonly SelectOption<T>[]; onValueChange: (value: T) => void; testId?: string; disabled?: boolean}): ReactNode {
	const generatedId = useId()
	const triggerId = testId ? `${testId}-trigger` : generatedId

	return (
		<Field className="gap-1.5">
			<FieldLabel htmlFor={triggerId} className="text-[12px] font-medium text-[var(--text-subtle)]">
				{label}
			</FieldLabel>
			<Select
				value={value}
				onValueChange={next => {
					if (typeof next === 'string') onValueChange(next)
				}}
			>
				<SelectTrigger id={triggerId} className="w-full" data-testid={testId} disabled={disabled}>
					<SelectValue>{selected => optionLabel(options, selected)}</SelectValue>
				</SelectTrigger>
				<SelectContent align="start">
					<SelectGroup>
						{options.map(option => (
							<SelectItem key={option.value} value={option.value} onClick={() => onValueChange(option.value)} data-testid={testId ? `${testId}-option-${option.value}` : undefined}>
								{option.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	)
}

// react-doctor-disable-next-line react-doctor/no-giant-component react-doctor/prefer-useReducer -- this dense profile form needs a focused decomposition outside the mechanical React Doctor cleanup
export function DownloadProfileEditor({commonPaths, globalDestination = '', initialProfile = null, onChangeGlobalDestination, onOpenChange, onSave, open, resetProfile}: DownloadProfileEditorProps): ReactNode {
	const {t} = useTranslation()
	const [draft, setDraft] = useState(() => createDownloadProfileDraft(initialProfile))
	const [profileIconPickerOpen, setProfileIconPickerOpen] = useState(false)
	const [profileActionError, setProfileActionError] = useState<string | null>(null)
	const [destinationPickerError, setDestinationPickerError] = useState<string | null>(null)
	const [destinationOverrideOpen, setDestinationOverrideOpen] = useState(() => initialProfile?.output.kind === 'fixed')
	const {
		profileName,
		profileIcon,
		mediaMode,
		codec,
		resolution,
		audioFormat,
		audioQuality,
		subtitleEnabled,
		subtitleLanguages,
		subtitleLanguageDraft,
		subtitleSource,
		subtitleDelivery,
		subtitleFormat,
		destination,
		saveInsideSubfolder,
		subfolderName,
		embedMetadata,
		embedChapters,
		saveDescription,
		saveThumbnail,
		sponsorBlockMode
	} = draft
	const showVideo = mediaMode === 'video-audio' || mediaMode === 'video-only'
	const showAudio = mediaMode === 'video-audio' || mediaMode === 'audio-only'
	const subtitlesOnly = mediaMode === 'subtitles-only'
	const effectiveSubtitleEnabled = subtitlesOnly || subtitleEnabled
	const outputEnabledCount = [embedMetadata, embedChapters, saveDescription, saveThumbnail].filter(Boolean).length
	const profileIconOptions = DOWNLOAD_PROFILE_ICONS.map(value => ({value, ...profileIconMeta(t)[value]}))
	const SelectedProfileIcon = profileIconOptions.find(option => option.value === profileIcon)?.icon ?? Captions
	const {subfolderInvalid} = validateDownloadProfileDraft(draft)
	const videoAudioFormat: Extract<DownloadProfileAudioFormat, 'best' | 'm4a'> = audioFormat === 'm4a' ? 'm4a' : 'best'
	const audioQualityDisabled = audioFormat === 'best' || audioFormat === 'wav'
	const allResolutionOptions = resolutionOptions(t)
	const videoResolutionOptions = codec === 'mp4' ? allResolutionOptions.filter(option => !SMART_TV_MP4_BLOCKED_RESOLUTIONS.has(option.value)) : allResolutionOptions
	const destinationOverride = destination.trim()
	const hasDestinationOverride = destinationOverride.length > 0
	const showDestinationOverride = destinationOverrideOpen || hasDestinationOverride
	const globalDestinationRoot = globalDestination.trim()
	const destinationBase = destinationOverride || globalDestinationRoot
	const resolvedSubfolderName = saveInsideSubfolder ? subfolderName.trim() || defaultProfileSubfolderName(profileName) : ''
	const resolvedDestination = destinationBase ? effectiveOutputDir(destinationBase, saveInsideSubfolder, resolvedSubfolderName) : ''
	const resolvedDestinationLabel = resolvedDestination ? readablePath(resolvedDestination, commonPaths, t) : fallbackFinalPath(resolvedSubfolderName, t)
	const sponsorBlockOptionsList = sponsorBlockOptions(t)
	const sponsorBlockHintsMap = sponsorBlockHints(t)
	const outputOptionDescriptionsMap = outputOptionDescriptions(t)

	function updateDraft(action: DownloadProfileDraftAction): void {
		setDraft(current => updateDownloadProfileDraft(current, action))
	}

	function changeDestination(nextDestination: string): void {
		setProfileActionError(null)
		setDestinationPickerError(null)
		setDestinationOverrideOpen(true)
		updateDraft({type: 'set-destination', destination: nextDestination})
	}

	function useGlobalDefaultDestination(): void {
		setProfileActionError(null)
		setDestinationPickerError(null)
		setDestinationOverrideOpen(false)
		updateDraft({type: 'set-destination', destination: ''})
	}

	function changeProfileName(nextName: string): void {
		updateDraft({type: 'set-profile-name', profileName: nextName})
	}

	function setProfileMediaMode(nextMode: DownloadProfileMediaMode): void {
		updateDraft({type: 'set-media-mode', mediaMode: nextMode})
	}

	function setProfileCodec(nextCodec: PlaylistVideoCodec): void {
		updateDraft({type: 'set-codec', codec: nextCodec})
	}

	function addSubtitleLanguages(): void {
		updateDraft({type: 'add-subtitle-languages'})
	}

	function removeSubtitleLanguage(code: string): void {
		updateDraft({type: 'remove-subtitle-language', code})
	}

	async function chooseDestinationFolder(): Promise<void> {
		setProfileActionError(null)
		setDestinationPickerError(null)
		setDestinationOverrideOpen(true)
		try {
			const result = await window.appApi.dialog.chooseFolder(destination.trim() || undefined)
			if (!result.ok || !result.data.path) return
			updateDraft({type: 'set-destination', destination: result.data.path})
		} catch (error) {
			console.error('Failed to open destination folder picker', error)
			setDestinationPickerError(t('wizard.profileEditor.errors.folderPickerFailed'))
		}
	}

	async function saveProfile(): Promise<void> {
		setProfileActionError(null)
		const now = new Date().toISOString()
		const profile = downloadProfileFromDraft(draft, now, createProfileId)
		try {
			await onSave?.(profile)
			onOpenChange(false)
		} catch (error) {
			console.error('Failed to save profile settings', error)
			setProfileActionError(t('wizard.profileEditor.errors.saveFailed'))
		}
	}

	async function changeGlobalDestination(): Promise<void> {
		if (!onChangeGlobalDestination) return
		setProfileActionError(null)
		try {
			await onChangeGlobalDestination()
		} catch (error) {
			console.error('Failed to change global destination', error)
			setProfileActionError(t('wizard.profileEditor.errors.changeGlobalFailed'))
		}
	}

	async function resetProfileOverride(): Promise<void> {
		if (!resetProfile?.enabled) return
		setProfileActionError(null)
		try {
			await resetProfile.onReset()
			onOpenChange(false)
		} catch (error) {
			console.error('Failed to reset profile settings', error)
			setProfileActionError(t('wizard.profileEditor.errors.resetFailed'))
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[58rem]" data-testid="profiles-editor-dialog">
				<DialogHeader>
					<DialogTitle>{t('wizard.profileEditor.title')}</DialogTitle>
					<DialogDescription>{t('wizard.profileEditor.description')}</DialogDescription>
				</DialogHeader>
				{profileActionError ? (
					<Alert variant="destructive" className="py-2">
						<AlertDescription className="text-[12px]">{profileActionError}</AlertDescription>
					</Alert>
				) : null}
				<ScrollArea className="max-h-[min(78vh,46rem)]">
					<div className="grid gap-4 p-1 pr-3 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.85fr)]">
						<div className="flex flex-col gap-3">
							<ProfilePanel title={t('wizard.profileEditor.identity.title')} description={t('wizard.profileEditor.identity.description')}>
								<Field className="gap-1.5">
									<FieldLabel htmlFor="profile-name" className="text-[12px] font-medium text-[var(--text-subtle)]">
										{t('wizard.profileEditor.identity.nameLabel')}
									</FieldLabel>
									<InputGroup className="h-10" aria-label={t('wizard.profileEditor.identity.nameAndIconAria')}>
										<Popover open={profileIconPickerOpen} onOpenChange={setProfileIconPickerOpen}>
											<InputGroupAddon align="inline-start" className="pl-1.5">
												<PopoverTrigger
													render={
														<InputGroupButton type="button" size="sm" className="h-8 w-14 justify-between px-2" aria-label={t('wizard.profileEditor.identity.chooseIconAria')} data-testid="profiles-editor-icon-trigger">
															<SelectedProfileIcon data-icon="inline-start" aria-hidden />
															<ChevronDown data-icon="inline-end" aria-hidden />
														</InputGroupButton>
													}
												/>
											</InputGroupAddon>
											<PopoverContent align="start" sideOffset={6} className="w-40" data-testid="profiles-editor-icon-menu">
												<ToggleGroup
													variant="outline"
													value={[profileIcon]}
													onValueChange={value => {
														const next = value[0] as DownloadProfileIcon | undefined
														if (!next) return
														updateDraft({type: 'set-profile-icon', profileIcon: next})
														setProfileIconPickerOpen(false)
													}}
													spacing={1}
													className="grid w-full grid-cols-3 gap-1.5"
													aria-label={t('wizard.profileEditor.identity.chooseIconAria')}
												>
													{profileIconOptions.map(option => {
														const Icon = option.icon
														return (
															<ToggleGroupItem
																key={option.value}
																value={option.value}
																title={option.label}
																className="grid h-10 place-items-center rounded-lg border bg-background/25 p-0 text-[var(--text-subtle)] aria-pressed:border-[var(--brand)] aria-pressed:bg-[var(--brand-dim)] aria-pressed:text-[var(--brand)] hover:border-[var(--border-strong)] hover:text-foreground"
																data-testid={`profiles-editor-icon-${option.value}`}
															>
																<Icon aria-hidden />
																<span className="sr-only">{option.label}</span>
															</ToggleGroupItem>
														)
													})}
												</ToggleGroup>
											</PopoverContent>
										</Popover>
										<InputGroupInput id="profile-name" value={profileName} onChange={event => changeProfileName(event.target.value)} data-testid="profiles-editor-name" />
									</InputGroup>
								</Field>
							</ProfilePanel>

							<ProfilePanel title={t('wizard.profileEditor.mediaMode.title')} description={t('wizard.profileEditor.mediaMode.description')}>
								<ToggleGroup
									variant="outline"
									value={[mediaMode]}
									onValueChange={value => {
										if (value[0]) setProfileMediaMode(value[0] as DownloadProfileMediaMode)
									}}
									spacing={2}
									className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
								>
									{mediaModes(t).map(option => {
										const Icon = option.icon
										return (
											<ToggleGroupItem key={option.value} value={option.value} className={OUTPUT_MODE_CARD_CLASS} title={option.description}>
												<Icon data-icon="inline-start" aria-hidden />
												<span className="text-[11px] font-semibold leading-tight">{option.label}</span>
											</ToggleGroupItem>
										)
									})}
								</ToggleGroup>
							</ProfilePanel>

							<div className="grid gap-3 sm:grid-cols-2">
								{showVideo ? (
									<ProfilePanel title={t('wizard.confirm.labelVideo')}>
										<FieldGroup className="gap-3">
											<ProfileSelect label={t('wizard.profileEditor.video.compatibilityLabel')} value={codec} options={videoCompatibilityOptions(t)} onValueChange={setProfileCodec} testId="profiles-editor-video-codec" />
											<ProfileSelect label={t('wizard.profileEditor.video.resolutionLabel')} value={resolution} options={videoResolutionOptions} onValueChange={next => updateDraft({type: 'set-resolution', resolution: next})} testId="profiles-editor-video-resolution" />
										</FieldGroup>
									</ProfilePanel>
								) : null}

								{showAudio ? (
									<ProfilePanel title={t('wizard.confirm.labelAudio')}>
										<FieldGroup className="gap-3">
											{mediaMode === 'audio-only' ? (
												<>
													<ProfileSelect label={t('wizard.profileEditor.common.formatLabel')} value={audioFormat} options={audioFormatOptions(t)} onValueChange={next => updateDraft({type: 'set-audio-format', audioFormat: next})} testId="profiles-editor-audio-format" />
													<ProfileSelect label={t('wizard.profileEditor.audio.qualityLabel')} value={audioQuality} options={audioQualityOptions(t)} onValueChange={next => updateDraft({type: 'set-audio-quality', audioQuality: next})} testId="profiles-editor-audio-quality" disabled={audioQualityDisabled} />
												</>
											) : (
												<ProfileSelect label={t('wizard.profileEditor.common.formatLabel')} value={videoAudioFormat} options={videoAudioFormatOptions(t)} onValueChange={next => updateDraft({type: 'set-audio-format', audioFormat: next})} testId="profiles-editor-audio-format" />
											)}
										</FieldGroup>
									</ProfilePanel>
								) : null}
							</div>

							{subtitlesOnly ? (
								<Alert variant="info" className="py-2 text-[12px]">
									<AlertDescription className="text-[12px]">{t('wizard.profileEditor.subtitlesOnlyNotice')}</AlertDescription>
								</Alert>
							) : null}

							<ProfilePanel title={t('wizard.steps.subtitles')}>
								<FieldGroup className="gap-3">
									<Field orientation="horizontal" className="items-start justify-between gap-3">
										<FieldContent className="gap-1">
											<FieldTitle id="profile-subtitle-downloads" className="text-[12px] font-medium text-[var(--text-subtle)]">
												{t('wizard.profileEditor.subtitles.downloadsTitle')}
											</FieldTitle>
											<FieldDescription className="text-[11px] leading-snug text-[var(--text-subtle)]">{t('wizard.profileEditor.subtitles.downloadsDescription')}</FieldDescription>
										</FieldContent>
										<ToggleGroup
											variant="outline"
											aria-labelledby="profile-subtitle-downloads"
											value={[effectiveSubtitleEnabled ? 'on' : 'off']}
											onValueChange={value => {
												const next = value[0]
												if (next === 'on') updateDraft({type: 'set-subtitle-enabled', subtitleEnabled: true})
												if (next === 'off' && !subtitlesOnly) updateDraft({type: 'set-subtitle-enabled', subtitleEnabled: false})
											}}
											className="grid w-36 shrink-0 grid-cols-2"
										>
											<ToggleGroupItem value="off" disabled={subtitlesOnly} className={SELECTABLE_TOGGLE_CLASS}>
												{t('wizard.profileEditor.common.offLabel')}
											</ToggleGroupItem>
											<ToggleGroupItem value="on" className={SELECTABLE_TOGGLE_CLASS}>
												{t('wizard.profileEditor.common.onLabel')}
											</ToggleGroupItem>
										</ToggleGroup>
									</Field>

									{!effectiveSubtitleEnabled ? (
										<Alert variant="info" className="py-2 text-[12px]">
											<AlertDescription className="text-[12px]">{t('wizard.profileEditor.subtitles.disabledNotice')}</AlertDescription>
										</Alert>
									) : (
										<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)]">
											<Field className="gap-1.5">
												<FieldLabel htmlFor="profile-subtitle-language-draft" className="text-[12px] font-medium text-[var(--text-subtle)]">
													{t('wizard.profileEditor.subtitles.languagesLabel')}
												</FieldLabel>
												<div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background/30 px-2 py-1">
													{subtitleLanguages.length > 0 ? (
														subtitleLanguages.map(code => (
															<Badge key={code} variant="secondary" className="h-6 gap-1 px-2 text-[11px] font-semibold">
																<span>{code}</span>
																<Button type="button" variant="ghost" size="icon-xs" onClick={() => removeSubtitleLanguage(code)} className="-me-1 size-4 rounded-full p-0" aria-label={t('wizard.subtitles.removeLanguage', {name: code})}>
																	<X data-icon="inline-start" aria-hidden />
																</Button>
															</Badge>
														))
													) : (
														<span className="px-1 text-[11px] italic text-[var(--text-subtle)]">{t('wizard.profileEditor.subtitles.noLanguagesSelected')}</span>
													)}
												</div>
												<InputGroup aria-label={t('wizard.profileEditor.subtitles.languageCodesAria')}>
													<InputGroupInput
														id="profile-subtitle-language-draft"
														value={subtitleLanguageDraft}
														onChange={event => updateDraft({type: 'set-subtitle-language-draft', subtitleLanguageDraft: event.target.value})}
														onKeyDown={event => {
															if (event.key !== 'Enter') return
															event.preventDefault()
															addSubtitleLanguages()
														}}
														placeholder={t('wizard.profileEditor.subtitles.languageCodesPlaceholder')}
														className="text-[12px]"
														aria-label={t('wizard.profileEditor.subtitles.languageCodesAria')}
													/>
													<InputGroupAddon align="inline-end">
														<InputGroupButton type="button" className="text-[11px]" onClick={addSubtitleLanguages} disabled={subtitleLanguageDraft.trim().length === 0}>
															<Plus data-icon="inline-start" />
															{t('wizard.profileEditor.common.addButton')}
														</InputGroupButton>
													</InputGroupAddon>
												</InputGroup>
											</Field>

											<FieldGroup className="gap-3">
												<ProfileSelect label={t('wizard.profileEditor.subtitles.sourceLabel')} value={subtitleSource} options={subtitleSourceOptions(t)} onValueChange={next => updateDraft({type: 'set-subtitle-source', subtitleSource: next})} testId="profiles-editor-subtitle-source" />

												<Field className="gap-1.5">
													<FieldTitle id="profile-subtitle-delivery" className="text-[12px] font-medium text-[var(--text-subtle)]">
														{t('wizard.profileEditor.subtitles.deliveryTitle')}
													</FieldTitle>
													<ToggleGroup
														variant="outline"
														aria-labelledby="profile-subtitle-delivery"
														value={[subtitleDelivery]}
														onValueChange={value => {
															if (value[0]) updateDraft({type: 'set-subtitle-delivery', subtitleDelivery: value[0] as SubtitleMode})
														}}
														className="grid w-full grid-cols-3"
													>
														{subtitleDeliveryOptions(t).map(option => (
															<ToggleGroupItem key={option.value} value={option.value} className={SELECTABLE_TOGGLE_CLASS}>
																{option.label}
															</ToggleGroupItem>
														))}
													</ToggleGroup>
													{subtitleDelivery === 'embed' ? <FieldDescription className="text-[11px] leading-snug text-[var(--text-subtle)]">{t('wizard.subtitles.embedNote')}</FieldDescription> : null}
												</Field>

												{subtitleDelivery !== 'embed' ? (
													<Field className="gap-1.5">
														<FieldTitle id="profile-subtitle-format" className="text-[12px] font-medium text-[var(--text-subtle)]">
															{t('wizard.profileEditor.common.formatLabel')}
														</FieldTitle>
														<ToggleGroup
															variant="outline"
															aria-labelledby="profile-subtitle-format"
															value={[subtitleFormat]}
															onValueChange={value => {
																if (value[0]) updateDraft({type: 'set-subtitle-format', subtitleFormat: value[0] as SubtitleFormat})
															}}
															className="grid w-full grid-cols-3"
														>
															{subtitleFormatOptions(t).map(option => (
																<ToggleGroupItem key={option.value} value={option.value} className={SELECTABLE_TOGGLE_CLASS}>
																	{option.label}
																</ToggleGroupItem>
															))}
														</ToggleGroup>
														{subtitleSource !== 'manual-only' && subtitleFormat === 'ass' ? <FieldDescription className="text-[11px] leading-snug text-[var(--text-subtle)]">{t('wizard.profileEditor.subtitles.autoAssShortNote')}</FieldDescription> : null}
													</Field>
												) : null}
											</FieldGroup>
										</div>
									)}
								</FieldGroup>
							</ProfilePanel>
						</div>

						<ProfilePanel title={t('wizard.profileEditor.advancedOptions.title')} description={t('wizard.profileEditor.advancedOptions.description')} className="lg:self-start">
							<FieldGroup className="gap-3">
								<div className="grid gap-2" data-testid="profiles-editor-destination-policy">
									<div className={cn('rounded-lg border bg-background/25 p-3 transition-colors', hasDestinationOverride ? 'border-border' : 'border-[var(--brand)]/55 bg-[var(--brand-dim)]')} data-testid="profiles-editor-global-destination">
										<div className="min-w-0">
											<div className="flex min-w-0 items-center gap-2">
												<FolderCog className="size-4 shrink-0 text-[var(--brand)]" aria-hidden />
												<span className="text-[12px] font-semibold">{t('wizard.profileEditor.destination.globalLabel')}</span>
												<Badge variant={hasDestinationOverride ? 'outline' : 'secondary'}>{hasDestinationOverride ? t('wizard.profileEditor.destination.inheritedBadge') : t('wizard.profileEditor.destination.activeBadge')}</Badge>
											</div>
											<p className="mt-1 truncate font-mono text-[12px] text-[var(--text-subtle)]" title={globalDestinationRoot || undefined}>
												{readablePath(globalDestinationRoot, commonPaths, t)}
											</p>
										</div>
										<div className="mt-2 flex flex-wrap gap-2">
											<Button type="button" variant="outline" size="sm" aria-label={t('wizard.url.profile.changeGlobalDestination')} title={t('wizard.url.profile.changeGlobalDestination')} onClick={() => void changeGlobalDestination()} disabled={!onChangeGlobalDestination} className="shrink-0">
												<FolderCog data-icon="inline-start" aria-hidden />
												{t('wizard.profileEditor.destination.changeGlobalButton')}
											</Button>
										</div>
									</div>

									<div className={cn('rounded-lg border bg-background/25 p-3 transition-colors', hasDestinationOverride ? 'border-[var(--brand)]/55 bg-[var(--brand-dim)]' : 'border-border')} data-testid="profiles-editor-profile-override">
										<div className="min-w-0">
											<div className="flex min-w-0 items-center gap-2">
												<Folder className="size-4 shrink-0 text-[var(--brand)]" aria-hidden />
												<span className="text-[12px] font-semibold">{t('wizard.profileEditor.destination.overrideLabel')}</span>
												<Badge variant={hasDestinationOverride ? 'secondary' : 'outline'}>
													{hasDestinationOverride ? t('wizard.profileEditor.destination.overridesGlobalBadge') : showDestinationOverride ? t('wizard.profileEditor.destination.chooseFolderBadge') : t('wizard.profileEditor.destination.noOverrideSetBadge')}
												</Badge>
											</div>
											<p className="mt-1 text-[11px] leading-snug text-[var(--text-subtle)]">{hasDestinationOverride ? t('wizard.profileEditor.destination.overrideActiveDescription') : t('wizard.profileEditor.destination.overrideInactiveDescription')}</p>
										</div>
										{!showDestinationOverride ? (
											<div className="mt-2 flex flex-wrap gap-2">
												<Button type="button" variant="outline" size="sm" aria-label={t('wizard.profileEditor.destination.setOverrideAria')} title={t('wizard.profileEditor.destination.setOverrideAria')} onClick={() => void chooseDestinationFolder()} className="shrink-0">
													<Folder data-icon="inline-start" aria-hidden />
													{t('wizard.profileEditor.destination.setOverrideButton')}
												</Button>
											</div>
										) : null}

										{showDestinationOverride ? (
											<Field className="mt-3 gap-1.5">
												<FieldLabel htmlFor="profile-destination" className="text-[12px] font-medium text-[var(--text-subtle)]">
													{t('wizard.profileEditor.destination.overridePathLabel')}
												</FieldLabel>
												<InputGroup>
													<InputGroupInput id="profile-destination" value={destination} onChange={event => changeDestination(event.target.value)} placeholder={t('wizard.profileEditor.destination.overridePathPlaceholder')} className="font-mono text-[12px]" />
													<InputGroupAddon align="inline-end">
														<InputGroupButton type="button" size="icon-xs" aria-label={t('wizard.profileEditor.destination.chooseDestinationFolderAria')} onClick={() => void chooseDestinationFolder()}>
															<Folder aria-hidden />
														</InputGroupButton>
													</InputGroupAddon>
												</InputGroup>
												<div className="flex flex-wrap items-center gap-2">
													<Button type="button" variant="ghost" size="xs" onClick={useGlobalDefaultDestination}>
														{t('wizard.profileEditor.destination.useGlobalDefaultButton')}
													</Button>
													{destinationPickerError ? <FieldDescription className="text-[12px] text-destructive">{destinationPickerError}</FieldDescription> : null}
												</div>
											</Field>
										) : null}
									</div>

									<div className="rounded-lg border border-[var(--border-strong)] bg-background/35 px-3 py-2" data-testid="profiles-editor-final-destination">
										<p className="text-[11px] font-medium text-[var(--text-subtle)]">{t('wizard.profileEditor.destination.resolvedLabel')}</p>
										<p className="mt-1 truncate font-mono text-[12px] text-foreground" title={resolvedDestination || resolvedDestinationLabel}>
											{resolvedDestinationLabel}
										</p>
									</div>
								</div>

								<Field orientation="horizontal" className="items-center gap-2 text-[12px] text-[var(--text-subtle)]">
									<Checkbox id="profile-subfolder-enabled" checked={saveInsideSubfolder} onCheckedChange={checked => updateDraft({type: 'set-save-inside-subfolder', saveInsideSubfolder: checked === true})} />
									<FieldLabel htmlFor="profile-subfolder-enabled" className="text-[12px] text-[var(--text-subtle)]">
										{t('wizard.profileEditor.subfolder.enableLabel')}
									</FieldLabel>
								</Field>
								<Field className="gap-1.5 pl-7">
									<FieldLabel htmlFor="profile-subfolder-name" className="text-[12px] font-medium text-[var(--text-subtle)]">
										{t('wizard.profileEditor.subfolder.nameLabel')}
									</FieldLabel>
									<InputGroup aria-label={t('wizard.profileEditor.subfolder.nameAria')}>
										<InputGroupInput
											id="profile-subfolder-name"
											value={subfolderName}
											onChange={event => updateDraft({type: 'set-subfolder-name', subfolderName: event.target.value})}
											disabled={!saveInsideSubfolder}
											placeholder={defaultProfileSubfolderName(profileName)}
											maxLength={64}
											aria-invalid={subfolderInvalid}
											data-testid="profiles-editor-subfolder-name"
										/>
									</InputGroup>
									{subfolderInvalid ? <FieldDescription className="text-[12px] text-destructive">{t('wizard.profileEditor.subfolder.invalidChars')}</FieldDescription> : null}
								</Field>

								<Card size="sm" className="rounded-lg bg-background/25 px-3 py-3">
									<div className="mb-2 flex items-center justify-between gap-3">
										<h4 className="text-sm font-semibold">{t('wizard.profileEditor.output.heading')}</h4>
										<Badge variant="outline">{t('wizard.profileEditor.output.enabledCount', {count: outputEnabledCount})}</Badge>
									</div>
									<div className="grid gap-2">
										<ProfileSwitchRow id="profile-output-metadata" label={t('wizard.output.embedMetadata.label')} description={outputOptionDescriptionsMap.metadata} checked={embedMetadata} onCheckedChange={next => updateDraft({type: 'set-embed-metadata', embedMetadata: next})} />
										<ProfileSwitchRow id="profile-output-chapters" label={t('wizard.output.embedChapters.label')} description={outputOptionDescriptionsMap.chapters} checked={embedChapters} onCheckedChange={next => updateDraft({type: 'set-embed-chapters', embedChapters: next})} />
										<ProfileSwitchRow id="profile-output-description" label={t('wizard.output.writeDescription.label')} description={outputOptionDescriptionsMap.description} checked={saveDescription} onCheckedChange={next => updateDraft({type: 'set-save-description', saveDescription: next})} />
										<ProfileSwitchRow id="profile-output-thumbnail" label={t('wizard.output.writeThumbnail.label')} description={outputOptionDescriptionsMap.thumbnail} checked={saveThumbnail} onCheckedChange={next => updateDraft({type: 'set-save-thumbnail', saveThumbnail: next})} />
									</div>
								</Card>

								<Card size="sm" className="rounded-lg bg-background/25 px-3 py-3">
									<div className="mb-2 flex items-center justify-between gap-3">
										<h4 className="text-sm font-semibold">{t('wizard.steps.sponsorblock')}</h4>
										<Badge variant="outline">{showVideo ? optionLabel(sponsorBlockOptionsList, sponsorBlockMode) : t('wizard.profileEditor.sponsorBlock.skippedBadge')}</Badge>
									</div>
									{showVideo ? (
										<ToggleGroup
											variant="outline"
											value={[sponsorBlockMode]}
											onValueChange={value => {
												if (value[0]) updateDraft({type: 'set-sponsor-block-mode', sponsorBlockMode: value[0] as SponsorBlockMode})
											}}
											className="grid w-full grid-cols-3"
										>
											{sponsorBlockOptionsList.map(option => (
												<ToggleGroupItem key={option.value} value={option.value} className={SELECTABLE_TOGGLE_CLASS} title={sponsorBlockHintsMap[option.value]}>
													{option.label}
												</ToggleGroupItem>
											))}
										</ToggleGroup>
									) : (
										<Alert variant="info" className="py-2 text-[12px]">
											<AlertDescription className="text-[12px]">{t('wizard.profileEditor.sponsorBlock.skippedNotice')}</AlertDescription>
										</Alert>
									)}
								</Card>
							</FieldGroup>
						</ProfilePanel>
					</div>
				</ScrollArea>
				<DialogFooter className="sm:justify-between">
					<div className="flex min-w-0 flex-1">
						{resetProfile ? (
							<Button type="button" variant="ghost" onClick={() => void resetProfileOverride()} disabled={!resetProfile.enabled} title={resetProfile.enabled ? t('wizard.profileEditor.reset.enabledTitle') : t('wizard.profileEditor.reset.disabledTitle')}>
								<RotateCcw data-icon="inline-start" aria-hidden />
								{t('wizard.profileEditor.reset.button')}
							</Button>
						) : null}
					</div>
					<div className="flex flex-col-reverse gap-2 sm:flex-row">
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							{t('common.cancel')}
						</Button>
						<Button type="button" onClick={() => void saveProfile()} disabled={subfolderInvalid} className="shadow-[0_4px_14px_var(--brand-glow)] disabled:shadow-none">
							{t('wizard.profileEditor.saveButton')}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
