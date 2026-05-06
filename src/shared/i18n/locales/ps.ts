const ps = {
  common: {
    back: 'شاته',
    continue: 'دوام ورکړه',
    retry: 'بیا هڅه وکړه',
    startOver: 'له سره پیل کړه',
    loading: 'بارول…'
  },
  app: {
    feedback: 'نظر',
    logs: 'لاګونه',
    feedbackNudge: 'ایا Arroxy خوند درکوي؟ ستاسو د اورولو شوق لرم! 💬',
    debugCopied: 'کاپي شو!',
    debugCopyTitle: 'د ډیبګ معلومات کاپي کړئ (Electron، OS، Chrome نسخې)',
    zoomIn: 'لویول',
    zoomOut: 'کوچنیول'
  },
  titleBar: {
    close: 'تړل',
    minimize: 'کوچنی کول',
    maximize: 'لوی کول',
    restore: 'بیرته راوستل'
  },
  splash: {
    greeting: 'سلام، ښه راغلاست!',
    warmup: 'Arroxy چمتو کیږي…',
    downloading: '{{binary}} ډاونلوډ کیږي…',
    warning: 'نصب ناپوره دی — ځینې ځانګړتیاوې ممکن کار ونکړي'
  },
  theme: {
    light: 'رڼا حالت',
    dark: 'تیاره حالت',
    system: 'د سیسټم ډیفالټ'
  },
  language: {
    label: 'ژبه'
  },
  wizard: {
    steps: {
      url: 'URL',
      playlistItems: 'Playlist',
      playlistPresets: 'کیفیت',
      formats: 'بڼه',
      subtitles: 'ژباړلیکونه',
      sponsorblock: 'SponsorBlock',
      output: 'محصول',
      folder: 'خوندي کړه',
      confirm: 'تایید کړه'
    },
    playlist: {
      heading: 'د Playlist توکي',
      itemCount_one: '{{count}} ویډیو',
      itemCount_other: '{{count}} ویډیوګانې',
      selectAll: 'ټول غوره کړئ',
      selectNone: 'هیڅ غوره مه کوئ',
      rangeFrom: 'له',
      rangeTo: 'تر',
      rangeApply: 'سلسله پلي کړئ',
      selectedCount_one: '{{count}} غوره شوی',
      selectedCount_other: '{{count}} غوره شوي',
      noSelection: 'دوام کولو لپاره لږترلږه یو ویډیو غوره کړئ',
      loadingItems: 'Playlist ترلاسه کیږي…',
      thumbnailAlt: 'د ویډیو تھمبنیل',
      continue: 'دوام ورکړه',
      durationUnknown: 'live'
    },
    playlistPresets: {
      heading: 'د بیچ لپاره کیفیت وټاکئ',
      subhead: 'هر ویډیو خپلواکه د غوره شوي کچې سره حل کوي — مخلوط Playlist ونه بیا پرته له مشکل کار کوي.',
      itemCount_one: '{{count}} توکی',
      itemCount_other: '{{count}} توکي',
      continue: 'دوام ورکړه'
    },
    mixedPrompt: {
      title: 'یو ویډیو که ټول Playlist؟',
      body: 'دا URL د یو Playlist برخه ده. تاسو څه ډاونلوډ کول غواړئ؟',
      singleVideo: 'یوازې دا ویډیو',
      wholePlaylist: 'ټول Playlist'
    },

    url: {
      heading: 'YouTube URL',
      placeholder: 'https://www.youtube.com/watch?v=...',
      hint: 'youtube.com او youtu.be لینکونه ملاتړ کیږي',
      fetchFormats: 'بڼې ترلاسه کړه',
      mascotIdle: 'یو YouTube لینک (ویډیو یا Short) راکړئ — بیا "بڼې ترلاسه کړه" کلیک وکړئ او زه کار پیل کوم ✨',
      mascotBusy: 'شاتهپرده ډاونلوډ کیږي… زه کولی شم له ډیرو کارونو سره معامله وکړم 😎',
      advanced: 'پرمختللي',
      clearAria: 'URL پاکول',
      clipboard: {
        toggle: 'کلیپبورډ وګورئ',
        toggleDescription: 'کله چې تاسو یو YouTube لینک کاپي کړئ، د URL ساحه اتوماتیک ډکه کړئ.',
        dialog: {
          title: 'YouTube URL وموندل شو',
          body: 'ایا د کلیپبورډ دا لینک وکاروئ؟',
          useButton: 'URL وکاروئ',
          disableButton: 'غیر فعاله کړه',
          cancelButton: 'لغوه کړه',
          disableNote: 'تاسو کولی شئ وروسته د پرمختللو تنظیماتو کې د کلیپبورډ لیدل بیا فعاله کړئ.'
        }
      },
      cookies: {
        toggle: 'د کوکیز فایل وکاروئ',
        toggleDescription: 'د عمر محدودیت لرونکو، یوازې غړو، او شخصي ویډیوګانو سره مرسته کوي.',
        risk: 'خطر: cookies.txt د هغه براوزر هر ننوتلی سیشن لري — دا خصوصي وساتئ.',
        fileLabel: 'کوکیز فایل',
        choose: 'غوره کړئ…',
        clear: 'پاکول',
        placeholder: 'هیڅ فایل غوره نه دی شوی',
        helpLink: 'کوکیز څنګه صادر کړم؟',
        enabledButNoFile: 'د کوکیزو کارولو لپاره یو فایل غوره کړئ',
        banWarning: 'YouTube ممکن هغه حسابونه چې د yt-dlp لخوا د کوکیزو لپاره کارول کیږي بنده کړي — کله چې ممکنه وي یو لنډمهاله حساب وکاروئ.',
        extensionFirefox: 'cookies.txt (Firefox)',
        extensionChrome: 'Get cookies.txt LOCALLY (Chrome)'
      },
      proxy: {
        label: 'Proxy URL',
        description: 'د پراکسي له لارې ترافیک لیږدول — د جغرافیایي محدودیتونو لرونکي مینځپانګې لپاره ګټور.',
        placeholder: 'http://host:port',
        clear: 'پاکول'
      },
      closeToTray: {
        toggle: 'د تړولو پر وخت ټرې ته پټ کړه',
        toggleDescription: 'د کړکۍ د تړولو وروسته شاتهپرده ډاونلوډونه دوام کړئ.'
      },
      analytics: {
        toggle: 'د ناپیژندل شوي کارونې احصائیې واستوئ',
        toggleDescription: 'یوازې د اپلیکیشن پیلونه شمیري. هیڅ URL، د فایل نومونه، یا شخصي معلومات نه شته.'
      }
    },
    subtitles: {
      heading: 'ژباړلیکونه',
      autoBadge: 'اتوماتیک',
      hint: 'د سایډکار فایلونه به د ویډیو سره یوځای خوندي شي',
      noLanguages: 'د دې ویډیو لپاره هیڅ ژباړلیک شتون نلري',
      skip: 'پریږدئ',
      skipSubs: 'د دې ویډیو لپاره پریږدئ',
      selectAll: 'ټول غوره کړئ',
      deselectAll: 'غیر انتخاب کړئ',
      mascot: 'صفر، یو، یا ډیر غوره کړئ — بشپړ ستاسو خوښه ده ✨',
      searchPlaceholder: 'ژبې لټول…',
      noMatches: 'هیڅ ژبه سره برابره نه ده',
      clearAll: 'ټول پاکول',
      noSelected: 'هیڅ ژباړلیک غوره نه دی شوی',
      selectedNote_one: '{{count}} ژباړلیک به ډاونلوډ شي',
      selectedNote_other: '{{count}} ژباړلیکونه به ډاونلوډ شي',
      sectionManual: 'لاسي',
      sectionAuto: 'اتوماتیک جوړ شوی',
      saveMode: {
        heading: 'د خوندي کولو بڼه',
        sidecar: 'د ویډیو سره یوځای',
        embed: 'ویډیو کې ځای پر ځای کړه',
        subfolder: 'subtitles/ فرعي فولډر'
      },
      format: {
        heading: 'بڼه'
      },
      embedNote: 'د Embed حالت محصول د .mkv په توګه خوندي کوي ترڅو د ژباړلیکونو ټریکونه باوري طریقه سره ځای پر ځای شي.',
      autoAssNote: 'اتوماتیک کیپشنونه به د ASS پر ځای SRT بڼه کې خوندي شي — دوی تل د YouTube د رولینګ کیو تکرار پاکیږي، کوم چې زموږ ASS کنورتر لا نه شي تقلید کولی.'
    },
    sponsorblock: {
      modeHeading: 'د سپانسر فلټر کول',
      mode: {
        off: 'بند',
        mark: 'د فصلونو په توګه نښه کړه',
        remove: 'برخې لیرې کړه'
      },
      modeHint: {
        off: 'SponsorBlock نشته — ویډیو لکه اپلوډ شوي بیا کیږي.',
        mark: 'د سپانسر برخې د فصلونو (غیر ویجاړونکي) په توګه نښه کوي.',
        remove: 'FFmpeg سره د سپانسر برخې له ویډیو څخه غوڅوي.'
      },
      categoriesHeading: 'کټګورۍ',
      cat: {
        sponsor: 'سپانسر',
        intro: 'پیژندنه',
        outro: 'پای',
        selfpromo: 'ځان پروموشن',
        music_offtopic: 'Music off-topic',
        preview: 'پریویو',
        filler: 'ډکول'
      }
    },
    formats: {
      quickPresets: 'ګړندي پریسټونه',
      video: 'ویډیو',
      audio: 'غږ',
      noAudio: 'غږ نشته',
      videoOnly: 'یوازې ویډیو',
      audioOnly: 'یوازې غږ',
      audioOnlyOption: 'یوازې غږ (ویډیو نشته)',
      mascot: 'بهترین + بهترین = اعظمي کیفیت. زه به دا غوره کړم!',
      sniffing: 'ستاسو لپاره غوره بڼې لټوم…',
      loadingHint: 'معمولاً یوه ثانیه وخت نیسي',
      loadingAria: 'بڼې بارول',
      sizeUnknown: 'اندازه نامعلومه',
      total: 'ټول',
      convert: {
        label: 'بدلول',
        uncompressed: 'بدلول · غیر فشارشوی',
        bitrate: 'بټ ریټ',
        wavLabel: 'WAV (uncompressed)',
        lossyLabel: '{{target}} {{bitrate}} kbps',
        requiresAudioOnly: 'د غږ بدلول یوازې د غږ حالت ته اړتیا لري (د ویډیو انتخاب لغوه کړئ).',
        requiresLossy: 'یو اصلي سټریم غوره شوی — بټ ریټ یوازې د mp3, m4a, یا opus ته د بدلولو پر وخت پلي کیږي.'
      }
    },
    folder: {
      heading: 'خوندي کولو ځای',
      downloads: 'ډاونلوډونه',
      videos: 'فلمونه',
      desktop: 'ډیسکټاپ',
      music: 'موسیقي',
      documents: 'سندونه',
      pictures: 'انځورونه',
      home: 'کور',
      custom: 'دودیز…',
      subfolder: {
        toggle: 'فرعي فولډر کې خوندي کړه',
        placeholder: 'مثلاً lo-fi rips',
        invalid: 'د فولډر نوم کې غلط حروف شتون لري'
      }
    },
    output: {
      embedChapters: {
        label: 'فصلونه ځای پر ځای کړه',
        description: 'د هر عصري پلیر کې د ناوي وړ فصل نښانکیان.'
      },
      embedMetadata: {
        label: 'میټاډیټا ځای پر ځای کړه',
        description: 'سرلیک، هنرمند، توضیحات، او د اپلوډ نیټه فایل کې لیکل کیږي.'
      },
      embedThumbnail: {
        label: 'تھمبنیل ځای پر ځای کړه',
        description: 'فایل کې د پوښ اثر. MP4 / M4A یوازې — کله چې ژباړلیکونه ځای پر ځای شوي وي نه کارول کیږي.'
      },
      writeDescription: {
        label: 'توضیح خوندي کړه',
        description: 'د ویډیو توضیح د ډاونلوډ سره یوځای د .description متن فایل بڼه کې خوندي کوي.'
      },
      writeThumbnail: {
        label: 'تھمبنیل خوندي کړه',
        description: 'تھمبنیل د ډاونلوډ سره یوځای د .jpg انځور فایل بڼه کې خوندي کوي.'
      }
    },
    confirm: {
      readyHeadline: 'د راکشولو لپاره چمتو!',
      landIn: 'ستاسو فایل به دلته ځای پر ځای شي',
      labelVideo: 'ویډیو',
      labelAudio: 'غږ',
      labelSubtitles: 'ژباړلیکونه',
      subtitlesNone: '—',
      labelSaveTo: 'خوندي کولو ځای',
      labelSize: 'اندازه',
      sizeUnknown: 'نامعلومه',
      nothingToDownload: 'یوازې د ژباړلیکونو پریسټ فعال دی خو هیڅ د ژباړلیک ژبه غوره نه ده شوې — هیڅ شی ډاونلوډ نه کیږي.',
      audioOnly: 'یوازې غږ',
      addToQueue: '+ Queue',
      addToQueueTooltip: 'کله چې نور ډاونلوډونه پای ته ورسیږي پیل کیږي — بشپړ بینډوډت ترلاسه کوي',
      pullIt: 'Pull it! ↓',
      pullItTooltip: 'سمدلاسه پیل کیږي — د نورو فعالو ډاونلوډونو سره یوځای چلیږي',
      playlistBatch_one: '{{count}} ویډیو · {{title}}',
      playlistBatch_other: '{{count}} ویډیوګانې · {{title}}',
      labelPlaylist: 'Playlist',
      labelPreset: 'Preset',
      labelItems: 'توکي',
      itemsValue_one: '{{count}} له {{total}} ویډیو',
      itemsValue_other: '{{count}} له {{total}} ویډیوګانې'
    },
    error: {
      icon: 'تیروتنه'
    }
  },
  videoCard: {
    titlePlaceholder: 'بارول…',
    domain: 'youtube.com'
  },
  queue: {
    header: 'د ډاونلوډ کتار',
    toggleTitle: 'د ډاونلوډ کتار پرانیستل/تړل',
    empty: 'هغه ډاونلوډونه چې تاسو کتار کې اچوئ دلته ښکاره کیږي',
    noDownloads: 'لا هیڅ ډاونلوډ نشته.',
    activeCount: '{{count}} ډاونلوډیږي · {{percent}}%',
    clear: 'پاکول',
    clearTitle: 'بشپړ شوي ډاونلوډونه پاکول',
    pauseAll: 'ټول ودروئ',
    pauseAllTitle: 'ټول فعال ډاونلوډونه ودروئ',
    cancelAll: 'ټول لغوه کړئ',
    cancelAllTitle: 'ټول فعال او انتظار کې ډاونلوډونه لغوه کړئ',
    tip: 'ستاسو ډاونلوډ لاندې کتار شوی — پرمختګ تعقیبولو لپاره هر وخت پرانیستلی شئ.',
    item: {
      doneAt: '{{time}} بشپړ شو',
      paused: 'درولی شوی',
      defaultError: 'ډاونلوډ ناکام شو',
      openUrl: 'URL پرانیستل',
      pause: 'درول',
      hold: 'ودرول',
      resume: 'دوام',
      cancel: 'لغوه کول',
      remove: 'لیرې کول'
    },
    interJobSleep_one: 'راتلونکی ډاونلوډ {{count}} ثانیو کې پیل کیږي',
    interJobSleep_other: 'راتلونکی ډاونلوډ {{count}} ثانیو کې پیل کیږي'
  },
  update: {
    appVersion: 'Arroxy {{version}}',
    isAvailable: 'شتون لري',
    youHave: '— تاسو {{currentVersion}} لرئ',
    install: 'نصب کړه او بیا پیل کړه',
    downloading: 'ډاونلوډیږي…',
    download: 'Download ↗',
    dismiss: 'د تازه کولو بنر وتړئ',
    copy: 'امر کلیپبورډ ته کاپي کړئ',
    copied: 'امر کلیپبورډ ته کاپي شو',
    installFailed: 'تازه کول ناکام شو',
    retry: 'بیا هڅه وکړئ'
  },
  status: {
    preparingBinaries: 'بائنري فایلونه چمتو کیږي…',
    mintingToken: 'YouTube ټوکن جوړیږي…',
    remintingToken: 'ټوکن بیا جوړیږي…',
    startingYtdlp: 'yt-dlp پروسه پیلیږي…',
    downloadingMedia: 'ویډیو او غږ ډاونلوډیږي…',
    mergingFormats: 'غږ او ویډیو یوځای کیږي…',
    extractingAudio: 'غږ بدلیږي…',
    convertingVideo: 'ویډیو بدلیږي…',
    embeddingMetadata: 'میټاډیټا ځای پر ځای کیږي…',
    movingFiles: 'فایلونه لیږدول کیږي…',
    fetchingSubtitles: 'ژباړلیکونه ترلاسه کیږي…',
    sleepingBetweenRequests: 'د نرخ محدودیتونو مخنیوي لپاره {{seconds}} ثانیې انتظار…',
    subtitlesFailed: 'ویډیو خوندي شوه — ځینې ژباړلیکونه ډاونلوډ نه شول',
    cancelled: 'ډاونلوډ لغوه شو',
    complete: 'ډاونلوډ بشپړ شو',
    usedExtractorFallback: 'د آزاد ایکسټریکټر سره ډاونلوډ شو — د باوري ډاونلوډونو لپاره cookies.txt تنظیم کړئ',
    ytdlpProcessError: 'yt-dlp پروسه تیروتنه: {{error}}',
    ytdlpExitCode: 'yt-dlp د {{code}} کوډ سره وتلو',
    downloadingBinary: '{{name}} بائنري ډاونلوډیږي…',
    unknownStartupFailure: 'نامعلومه د پیل ناکامي'
  },
  errors: {
    ytdlp: {
      botBlock: 'د بوټ محافظت فعال شو. ستاسو IP پته ډیره احتمال نښه شوې (د ډیټاسینټر رینج یا ګڼ کارونکي VPN وتلو ټکی). خپل IP بدل کړئ یا بل VPN پای ټکی غوره کړئ او بیا هڅه وکړئ. که چیرې لا هم ناکامه وي، دا ممکن د YouTube خوا لنډمهاله بدلون وي — Arroxy د پیل پر وخت yt-dlp اتوماتیک تازه کوي، نو سمون به چمتو شي کله چې د پروژې خوا لیږل شي.',
      ipBlock: 'ستاسو IP پته ممکن د YouTube لخوا بنده شوې وي. وروسته بیا هڅه وکړئ یا VPN وکاروئ.',
      rateLimit: 'YouTube غوښتنې محدودوي. یوه دقیقه انتظار کړئ بیا هڅه وکړئ.',
      ageRestricted: 'دا ویډیو د عمر محدودیت لري او پرته د ننوتلي حساب نه شي ډاونلوډ کیدی.',
      unavailable: 'دا ویډیو شتون نلري — ممکن شخصي، حذف شوې، یا سیمه بنده وي.',
      geoBlocked: 'دا ویډیو ستاسو سیمه کې شتون نلري.',
      outOfDiskSpace: 'د ډیسک کافي ځای نشته. ځای خالي کړئ او بیا هڅه وکړئ.'
    }
  },
  presets: {
    'best-quality': {
      label: 'غوره کیفیت',
      desc: 'لوړه ریزولوشن + غوره غږ'
    },
    balanced: {
      label: 'متوازن',
      desc: '720p اعظمي + ښه غږ'
    },
    'audio-only': {
      label: 'یوازې غږ',
      desc: 'ویډیو نشته، غوره غږ'
    },
    'small-file': {
      label: 'کوچنی فایل',
      desc: 'ټیټه ریزولوشن + کم غږ'
    },
    'subtitle-only': {
      label: 'یوازې ژباړلیکونه',
      desc: 'ویډیو نشته، غږ نشته، یوازې ژباړلیکونه'
    }
  },
  playlistPresets: {
    'video-best': { label: 'غوره کیفیت', desc: 'د هر توکي لپاره لوړه ریزولوشن + غږ' },
    'video-2160p': { label: '4K پورې', desc: '2160p ته محدود، د هر توکي لپاره ټیټ ته ورګرځي' },
    'video-1440p': { label: '1440p پورې', desc: '2K ته محدود، د هر توکي لپاره ټیټ ته ورګرځي' },
    'video-1080p': { label: '1080p پورې', desc: 'د هر توکي لپاره محدود، ټیټ ته ورګرځي' },
    'video-720p': { label: '720p پورې', desc: 'کوچني فایلونه، پراخه مطابقت' },
    'video-480p': { label: '480p پورې', desc: 'ټیټ پراخه کارول' },
    'video-360p': { label: '360p پورې', desc: 'تر ټولو کوچنۍ ویډیو' },
    'audio-best': { label: 'Audio (غوره)', desc: 'اصلي غوره غږ، بیا نه کوډول کیږي' },
    'audio-mp3': { label: 'Audio (MP3)', desc: 'MP3 192 kbps ته بدلول' }
  },
  formatLabel: {
    audioOnly: 'یوازې غږ',
    audioFallback: 'غږ',
    audioOnlyDot: 'Audio only · {{audio}}',
    videoDot: '{{resolution}} · {{audio}}'
  },
  tray: {
    tooltip: 'Arroxy',
    menu: {
      statusIdle: 'بیکار',
      statusActive_one: '1 ډاونلوډیږي · {{percent}}%',
      statusActive_other: '{{count}} ډاونلوډیږي · {{percent}}%',
      open: 'Arroxy پرانیستل',
      quit: 'Arroxy پریښودل'
    }
  },
  dialogs: {
    quitWithActiveDownloads: {
      message_one: '{{count}} ډاونلوډ روان دی',
      message_other: '{{count}} ډاونلوډونه روان دي',
      detail: 'تړول به ټول فعال ډاونلوډونه لغوه کړي.',
      confirm: 'ډاونلوډونه لغوه کړه او وتلو',
      keep: 'ډاونلوډ دوام کړه'
    },
    closeToTray: {
      message: 'ایا د تړولو پر وخت Arroxy سیسټم ټرې ته پټ کړو؟',
      detail: 'Arroxy کار کوي او فعال ډاونلوډونه بشپړوي. دا وروسته د پرمختللو تنظیماتو کې بدل کړئ.',
      hide: 'ټرې ته پټول',
      quit: 'وتل',
      remember: 'بیا مه پوښتئ'
    },
    rendererCrashed: {
      message: 'Arroxy ستونزې سره مخ شو',
      detail: 'د رینډرر پروسه کریش شوه ({{reason}}). بیا هڅه کولو لپاره بیا بار کړئ.',
      reload: 'بیا بار کړئ',
      quit: 'وتل'
    }
  }
} as const;

export default ps;
