const en = {
  common: {
    back: 'Back',
    continue: 'Continue',
    retry: 'Retry',
    startOver: 'Start over',
    loading: 'Loading…'
  },
  app: {
    feedback: 'Feedback',
    logs: 'Logs',
    feedbackNudge: "Enjoying Arroxy? I'd love to hear from you! 💬",
    debugCopied: 'Copied!',
    debugCopyTitle: 'Copy debug info (Electron, OS, Chrome versions)',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out'
  },
  titleBar: {
    close: 'Close',
    minimize: 'Minimize',
    maximize: 'Maximize',
    restore: 'Restore'
  },
  splash: {
    greeting: 'Hey, welcome back!',
    warmup: 'Arroxy is warming up…',
    downloading: 'Downloading {{binary}}…',
    warning: 'Setup incomplete — some features may not work',
    warmupFailedNoDiag: 'Setup failed. Open the setup log for details.'
  },
  repair: {
    title: 'Setup needs your help',
    deps: {
      ytDlp: 'yt-dlp',
      ffmpeg: 'FFmpeg',
      ffprobe: 'FFprobe',
      deno: 'Deno'
    },
    hints: {
      unknown: 'Could not be verified.',
      downloadFailed: 'Download failed. Check your internet connection and retry.',
      extractFailed: 'Archive extraction failed. The download may be corrupt — retry.',
      hashFailed: 'Checksum mismatch on the downloaded file. Retry the download.',
      spawnFailed: 'The file is missing or could not be launched. Pick a working copy.',
      permissionDenied: 'The system refused to run the file. Pick a copy you trust or retry as admin.',
      blockedOrQuarantined: 'Windows blocked the file (SmartScreen / Defender). Pick an installed copy or whitelist the runtime folder.',
      badExitCode: 'The binary did not respond to --version. It may be corrupt or the wrong build.',
      timeout: 'The version probe timed out. The file may be hung — retry.',
      pairIncomplete: 'ffmpeg and ffprobe must both be set as a matched pair.'
    },
    actions: {
      chooseExecutable: 'Choose executable',
      resetToDefault: 'Reset to default',
      retrySetup: 'Retry setup',
      cancel: 'Cancel',
      openDependencyFolder: 'Open dependency folder',
      viewSetupLog: 'View setup log'
    }
  },
  theme: {
    light: 'Light mode',
    dark: 'Dark mode',
    system: 'System default'
  },
  language: {
    label: 'Language'
  },
  wizard: {
    steps: {
      url: 'URL',
      playlistItems: 'Playlist',
      playlistPresets: 'Quality',
      formats: 'Format',
      subtitles: 'Subtitles',
      sponsorblock: 'SponsorBlock',
      output: 'Output',
      folder: 'Save',
      confirm: 'Confirm'
    },
    playlistPresets: {
      heading: 'Pick quality for the batch',
      subhead: 'Each video resolves the chosen tier independently — heterogeneous playlists work without surprises.',
      itemCount_one: '{{count}} item',
      itemCount_other: '{{count}} items',
      continue: 'Continue'
    },
    playlist: {
      heading: 'Playlist items',
      itemCount_one: '{{count}} video',
      itemCount_other: '{{count}} videos',
      selectAll: 'Select all',
      selectNone: 'Select none',
      rangeFrom: 'From',
      rangeTo: 'To',
      rangeApply: 'Apply range',
      selectedCount_one: '{{count}} selected',
      selectedCount_other: '{{count}} selected',
      noSelection: 'Select at least one video to continue',
      loadingItems: 'Fetching playlist…',
      thumbnailAlt: 'Video thumbnail',
      continue: 'Continue',
      durationUnknown: 'live'
    },
    mixedPrompt: {
      title: 'Single video or whole playlist?',
      body: 'This URL is part of a playlist. What do you want to download?',
      singleVideo: 'Just this video',
      wholePlaylist: 'Whole playlist'
    },
    url: {
      heading: 'YouTube URL',
      placeholder: 'https://www.youtube.com/watch?v=...',
      fetchFormats: 'Fetch formats',
      features: {
        heading: 'What Arroxy can pull',
        video: {
          title: 'Videos',
          desc: 'Pick any resolution up to 4K'
        },
        playlist: {
          title: 'Playlists',
          desc: 'Multi-select items from a playlist'
        },
        audio: {
          title: 'Audio',
          desc: 'Original stream or MP3/M4A convert'
        }
      },
      mascotIdle: 'Drop me a YouTube link (video or Short) — then hit "Fetch formats" and I\'ll get to work ✨',
      mascotBusy: 'Downloading in the background… I can multitask 😎',
      advanced: 'Advanced',
      clearAria: 'Clear URL',
      clipboard: {
        toggle: 'Watch clipboard',
        toggleDescription: 'Auto-fill the URL field when you copy a YouTube link.',
        dialog: {
          title: 'YouTube URL detected',
          body: 'Use this link from your clipboard?',
          useButton: 'Use URL',
          disableButton: 'Disable',
          cancelButton: 'Cancel',
          disableNote: 'You can re-enable clipboard watching later in Advanced settings.'
        }
      },
      cookies: {
        toggle: 'Use cookies file',
        toggleDescription: 'Helps with age-restricted, members-only, and account-private videos.',
        risk: 'Risk: a cookies.txt contains every logged-in session for that browser — keep it private.',
        fileLabel: 'Cookies file',
        choose: 'Choose…',
        clear: 'Clear',
        placeholder: 'No file selected',
        helpLink: 'How do I export cookies?',
        enabledButNoFile: 'Pick a file to use cookies',
        banWarning: 'YouTube may flag — and sometimes ban — accounts whose cookies are used by yt-dlp. Use a throwaway account when possible.',
        extensionFirefox: 'cookies.txt (Firefox)',
        extensionChrome: 'Get cookies.txt LOCALLY (Chrome)'
      },
      proxy: {
        label: 'Proxy URL',
        description: 'Route traffic through a proxy — useful for geo-restricted content.',
        placeholder: 'http://host:port',
        clear: 'Clear'
      },
      closeToTray: {
        toggle: 'Hide to tray on close',
        toggleDescription: 'Continue downloads in the background after closing the window.'
      },
      analytics: {
        toggle: 'Send anonymous usage stats',
        toggleDescription: 'Counts app launches only. No URLs, filenames, or personal data.'
      }
    },
    subtitles: {
      heading: 'Subtitles',
      autoBadge: 'Auto',
      hint: 'Sidecar files will be saved next to the video',
      noLanguages: 'No subtitles available for this video',
      skip: 'Skip',
      skipSubs: 'Skip for this video',
      selectAll: 'Select all',
      deselectAll: 'Deselect all',
      mascot: 'Pick zero, one, or many — totally up to you ✨',
      searchPlaceholder: 'Search languages…',
      noMatches: 'No languages match',
      clearAll: 'Clear all',
      noSelected: 'No subtitles selected',
      selectedNote_one: '{{count}} subtitle will be downloaded',
      selectedNote_other: '{{count}} subtitles will be downloaded',
      sectionManual: 'Manual',
      sectionAuto: 'Auto-generated',
      saveMode: {
        heading: 'Save as',
        sidecar: 'Next to video',
        embed: 'Embed into video',
        subfolder: 'subtitles/ subfolder'
      },
      format: {
        heading: 'Format'
      },
      embedNote: 'Embed mode saves output as .mkv so subtitle tracks embed reliably.',
      autoAssNote: "Auto-captions will be saved as SRT instead of ASS — they're always cleaned of YouTube's rolling-cue duplication, which our ASS converter can't replicate yet."
    },
    sponsorblock: {
      modeHeading: 'Sponsor filtering',
      mode: {
        off: 'Off',
        mark: 'Mark as chapters',
        remove: 'Remove segments'
      },
      modeHint: {
        off: 'No SponsorBlock — video plays as uploaded.',
        mark: 'Marks sponsor segments as chapters (non-destructive).',
        remove: 'Cuts sponsor segments from the video using FFmpeg.'
      },
      categoriesHeading: 'Categories',
      cat: {
        sponsor: 'Sponsor',
        intro: 'Intro',
        outro: 'Outro',
        selfpromo: 'Self-promo',
        music_offtopic: 'Music off-topic',
        preview: 'Preview',
        filler: 'Filler'
      }
    },
    formats: {
      quickPresets: 'Quick presets',
      video: 'Video',
      audio: 'Audio',
      noAudio: 'No audio',
      videoOnly: 'Video only',
      audioOnly: 'Audio only',
      audioOnlyOption: 'Audio only (no video)',
      mascot: "Best + Best = max quality. I'd pick that!",
      sniffing: 'Sniffing out the best formats for you…',
      loadingHint: 'Usually takes a second',
      loadingAria: 'Loading formats',
      sizeUnknown: 'Size unknown',
      total: 'Total',
      convert: {
        label: 'Convert',
        uncompressed: 'Convert · uncompressed',
        bitrate: 'Bitrate',
        wavLabel: 'WAV (uncompressed)',
        lossyLabel: '{{target}} {{bitrate}} kbps',
        requiresAudioOnly: 'Audio conversion requires audio-only mode (deselect the video pick).',
        requiresLossy: 'A native stream is selected — bitrate only applies when converting to mp3, m4a, or opus.'
      }
    },
    folder: {
      heading: 'Save to',
      downloads: 'Downloads',
      videos: 'Movies',
      desktop: 'Desktop',
      music: 'Music',
      documents: 'Documents',
      pictures: 'Pictures',
      home: 'Home',
      custom: 'Custom…',
      subfolder: {
        toggle: 'Save inside subfolder',
        placeholder: 'e.g. lo-fi rips',
        invalid: 'Folder name has invalid characters'
      }
    },
    output: {
      embedChapters: {
        label: 'Embed chapters',
        description: 'Chapter markers navigable in any modern player.'
      },
      embedMetadata: {
        label: 'Embed metadata',
        description: 'Title, artist, description, and upload date written into the file.'
      },
      embedThumbnail: {
        label: 'Embed thumbnail',
        description: 'Cover art inside the file. WebM video will be remuxed to MKV; skipped when subtitles are embedded.'
      },
      writeDescription: {
        label: 'Save description',
        description: 'Saves the video description as a .description text file next to the download.'
      },
      writeThumbnail: {
        label: 'Save thumbnail',
        description: 'Saves the thumbnail as a .jpg image file next to the download.'
      }
    },
    confirm: {
      readyHeadline: 'Ready to pull it in!',
      landIn: 'Your file will land in',
      labelVideo: 'Video',
      labelAudio: 'Audio',
      labelSubtitles: 'Subtitles',
      subtitlesNone: '—',
      labelSaveTo: 'Save to',
      labelSize: 'Size',
      sizeUnknown: 'Unknown',
      nothingToDownload: 'Subtitles only preset is active but no subtitle language is selected — nothing will be downloaded.',
      audioOnly: 'Audio only',
      addToQueue: '+ Queue',
      addToQueueTooltip: 'Starts when other downloads finish — gets full bandwidth',
      pullIt: 'Pull it! ↓',
      pullItTooltip: 'Starts immediately — runs alongside other active downloads',
      playlistBatch_one: '{{count}} video · {{title}}',
      playlistBatch_other: '{{count}} videos · {{title}}',
      labelPlaylist: 'Playlist',
      labelPreset: 'Preset',
      labelItems: 'Items',
      itemsValue_one: '{{count}} of {{total}} video',
      itemsValue_other: '{{count}} of {{total}} videos'
    },
    error: {
      icon: 'Error'
    }
  },
  videoCard: {
    titlePlaceholder: 'Loading…',
    domain: 'youtube.com'
  },
  queue: {
    header: 'Download Queue',
    toggleTitle: 'Toggle download queue',
    empty: 'Downloads you queue will appear here',
    noDownloads: 'No downloads yet.',
    activeCount: '{{count}} downloading · {{percent}}%',
    clear: 'Clear',
    clearTitle: 'Clear completed downloads',
    pauseAll: 'Pause all',
    pauseAllTitle: 'Pause all active downloads',
    cancelAll: 'Cancel all',
    cancelAllTitle: 'Cancel all active and pending downloads',
    tip: 'Your download is queued below — open anytime to track progress.',
    item: {
      doneAt: 'Done {{time}}',
      paused: 'Paused',
      defaultError: 'Download failed',
      openUrl: 'Open URL',
      pause: 'Pause',
      hold: 'Hold',
      resume: 'Resume',
      cancel: 'Cancel',
      remove: 'Remove'
    },
    interJobSleep_one: 'Next download starts in {{count}}s',
    interJobSleep_other: 'Next download starts in {{count}}s'
  },
  update: {
    appVersion: 'Arroxy {{version}}',
    isAvailable: 'is available',
    youHave: '— you have {{currentVersion}}',
    install: 'Install & Restart',
    downloading: 'Downloading…',
    download: 'Download ↗',
    dismiss: 'Dismiss update banner',
    copy: 'Copy command to clipboard',
    copied: 'Copied command to clipboard',
    installFailed: 'Update failed',
    retry: 'Retry'
  },
  status: {
    preparingBinaries: 'Preparing binaries…',
    mintingToken: 'Minting YouTube token…',
    remintingToken: 'Re-minting token…',
    startingYtdlp: 'Starting yt-dlp process…',
    downloadingMedia: 'Downloading video & audio…',
    mergingFormats: 'Merging audio and video…',
    extractingAudio: 'Converting audio…',
    convertingVideo: 'Converting video…',
    embeddingMetadata: 'Embedding metadata…',
    movingFiles: 'Moving files…',
    fetchingSubtitles: 'Fetching subtitles…',
    sleepingBetweenRequests: 'Waiting {{seconds}}s to avoid rate limits…',
    subtitlesFailed: 'Video saved — some subtitles could not be downloaded',
    cancelled: 'Download cancelled',
    complete: 'Download complete',
    usedExtractorFallback: 'Downloaded with relaxed extractor — set up a cookies.txt for more reliable downloads',
    ytdlpProcessError: 'yt-dlp process error: {{error}}',
    ytdlpExitCode: 'yt-dlp exited with code {{code}}',
    downloadingBinary: 'Downloading {{name}} binary…',
    unknownStartupFailure: 'Unknown download startup failure'
  },
  errors: {
    ytdlp: {
      botBlock: "Bot protection triggered. The IP you're using is most likely flagged (datacenter range or busy VPN exit). Change your IP or pick a different VPN endpoint and retry. If it keeps failing, this may be a temporary YouTube-side change — Arroxy auto-updates yt-dlp on launch, so the fix lands automatically once upstream ships it.",
      ipBlock: 'Your IP address appears to be blocked by YouTube. Try again later or use a VPN.',
      rateLimit: 'YouTube is rate-limiting requests. Wait a minute then retry.',
      ageRestricted: 'This video is age-restricted and cannot be downloaded without a signed-in account.',
      unavailable: 'This video is unavailable — it may be private, deleted, or region-locked.',
      geoBlocked: 'This video is not available in your region.',
      outOfDiskSpace: 'Not enough disk space. Free up space and retry.'
    }
  },
  presets: {
    'best-quality': {
      label: 'Best quality',
      desc: 'Highest resolution + best audio'
    },
    balanced: {
      label: 'Balanced',
      desc: '720p max + good audio'
    },
    'audio-only': {
      label: 'Audio only',
      desc: 'No video, best audio'
    },
    'small-file': {
      label: 'Small file',
      desc: 'Lowest resolution + low audio'
    },
    'subtitle-only': {
      label: 'Subtitles only',
      desc: 'No video, no audio, only subtitles'
    }
  },
  playlistPresets: {
    'video-best': { label: 'Best quality', desc: 'Highest available video + audio per item' },
    'video-2160p': { label: 'Up to 4K', desc: 'Capped at 2160p, falls back to lower per item' },
    'video-1440p': { label: 'Up to 1440p', desc: 'Capped at 2K, falls back to lower per item' },
    'video-1080p': { label: 'Up to 1080p', desc: 'Capped per item, falls back to lower' },
    'video-720p': { label: 'Up to 720p', desc: 'Smaller files, broad compatibility' },
    'video-480p': { label: 'Up to 480p', desc: 'Low bandwidth' },
    'video-360p': { label: 'Up to 360p', desc: 'Smallest video' },
    'audio-best': { label: 'Audio (best)', desc: 'Native best audio, no re-encode' },
    'audio-mp3': { label: 'Audio (MP3)', desc: 'Convert to MP3 192 kbps' }
  },
  formatLabel: {
    audioOnly: 'Audio only',
    audioFallback: 'Audio',
    audioOnlyDot: 'Audio only · {{audio}}',
    videoDot: '{{resolution}} · {{audio}}'
  },
  tray: {
    tooltip: 'Arroxy',
    menu: {
      statusIdle: 'Idle',
      statusActive_one: '1 downloading · {{percent}}%',
      statusActive_other: '{{count}} downloading · {{percent}}%',
      open: 'Open Arroxy',
      quit: 'Quit Arroxy'
    }
  },
  dialogs: {
    quitWithActiveDownloads: {
      message_one: '{{count}} download in progress',
      message_other: '{{count}} downloads in progress',
      detail: 'Closing will cancel all active downloads.',
      confirm: 'Cancel Downloads & Quit',
      keep: 'Keep Downloading'
    },
    closeToTray: {
      message: 'Hide Arroxy to the system tray when closing?',
      detail: 'Arroxy keeps running and finishes active downloads. Change this later in Advanced settings.',
      hide: 'Hide to tray',
      quit: 'Quit',
      remember: "Don't ask again"
    },
    rendererCrashed: {
      message: 'Arroxy encountered a problem',
      detail: 'The renderer process crashed ({{reason}}). Reload to try again.',
      reload: 'Reload',
      quit: 'Quit'
    }
  }
} as const;

export default en;
