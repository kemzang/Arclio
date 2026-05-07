const ar = {
  common: {
    back: 'رجوع',
    continue: 'متابعة',
    retry: 'إعادة المحاولة',
    startOver: 'البدء من جديد',
    loading: 'جارٍ التحميل…'
  },
  app: {
    feedback: 'ملاحظات',
    logs: 'السجلات',
    feedbackNudge: 'هل تستمتع بـ Arroxy؟ يسعدني سماع رأيك! 💬',
    debugCopied: 'تم النسخ!',
    debugCopyTitle: 'نسخ معلومات التصحيح (إصدارات Electron والنظام وChrome)',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير'
  },
  titleBar: {
    close: 'إغلاق',
    minimize: 'تصغير',
    maximize: 'تكبير',
    restore: 'استعادة'
  },
  splash: {
    greeting: 'مرحباً، أهلاً بعودتك!',
    warmup: 'Arroxy يستعد…',
    downloading: 'جارٍ تنزيل {{binary}}…',
    warning: 'الإعداد غير مكتمل — قد لا تعمل بعض الميزات',
    warmupFailedNoDiag: 'فشل الإعداد. افتح سجل الإعداد للاطلاع على التفاصيل.'
  },
  repair: {
    title: 'الإعداد يحتاج مساعدتك',
    deps: {
      ytDlp: 'yt-dlp',
      ffmpeg: 'FFmpeg',
      ffprobe: 'FFprobe',
      deno: 'Deno'
    },
    hints: {
      unknown: 'تعذّر التحقق.',
      downloadFailed: 'فشل التنزيل. تحقق من اتصالك بالإنترنت وأعد المحاولة.',
      extractFailed: 'فشل استخراج الأرشيف. قد يكون التنزيل تالفاً — أعد المحاولة.',
      hashFailed: 'عدم تطابق المجموع الاختباري للملف المنزَّل. أعد التنزيل.',
      spawnFailed: 'الملف مفقود أو تعذّر تشغيله. اختر نسخة صالحة للعمل.',
      permissionDenied: 'رفض النظام تشغيل الملف. اختر نسخة موثوقة أو أعد المحاولة كمسؤول.',
      blockedOrQuarantined: 'حظر Windows الملف (SmartScreen / Defender). اختر نسخة مثبّتة أو أضف مجلد وقت التشغيل إلى القائمة البيضاء.',
      badExitCode: 'لم يستجب الملف الثنائي لـ --version. قد يكون تالفاً أو إصدار خاطئ.',
      timeout: 'انتهت مهلة فحص الإصدار. قد يكون الملف متوقفاً — أعد المحاولة.',
      pairIncomplete: 'يجب إعداد ffmpeg و ffprobe معاً كزوج متطابق.'
    },
    actions: {
      chooseExecutable: 'اختر الملف القابل للتنفيذ',
      resetToDefault: 'إعادة إلى الافتراضي',
      retrySetup: 'إعادة محاولة الإعداد',
      cancel: 'إلغاء',
      openDependencyFolder: 'فتح مجلد التبعيات',
      viewSetupLog: 'عرض سجل الإعداد'
    }
  },
  theme: {
    light: 'الوضع الفاتح',
    dark: 'الوضع الداكن',
    system: 'إعداد النظام الافتراضي'
  },
  language: {
    label: 'اللغة'
  },
  wizard: {
    steps: {
      url: 'URL',
      playlistItems: 'Playlist',
      playlistPresets: 'الجودة',
      formats: 'الصيغة',
      subtitles: 'الترجمات',
      sponsorblock: 'SponsorBlock',
      output: 'الإخراج',
      folder: 'حفظ',
      confirm: 'تأكيد'
    },
    playlist: {
      heading: 'عناصر القائمة',
      itemCount_one: '{{count}} فيديو',
      itemCount_other: '{{count}} مقاطع فيديو',
      selectAll: 'تحديد الكل',
      selectNone: 'إلغاء تحديد الكل',
      rangeFrom: 'من',
      rangeTo: 'إلى',
      rangeApply: 'تطبيق النطاق',
      selectedCount_one: '{{count}} محدد',
      selectedCount_other: '{{count}} محددة',
      noSelection: 'حدد فيديو واحداً على الأقل للمتابعة',
      loadingItems: 'جارٍ جلب القائمة…',
      thumbnailAlt: 'صورة مصغرة للفيديو',
      continue: 'متابعة',
      durationUnknown: 'مباشر'
    },
    playlistPresets: {
      heading: 'اختر الجودة للدفعة',
      subhead: 'يحل كل فيديو المستوى المختار بشكل مستقل — قوائم التشغيل غير المتجانسة تعمل بدون مفاجآت.',
      itemCount_one: '{{count}} عنصر',
      itemCount_other: '{{count}} عناصر',
      continue: 'متابعة'
    },
    mixedPrompt: {
      title: 'هذا الرابط يحتوي على Playlist',
      body: 'هل تريد الفيديو الذي اخترته فقط، أم تفضّل الاختيار من الـ Playlist؟ ستختار فيديوهات بعينها أو نطاقاً في الخطوة التالية.',
      singleVideo: 'هذا الواحد فقط',
      pickFromPlaylist: 'اختر من الـ Playlist'
    },

    url: {
      heading: 'رابط YouTube',
      placeholder: 'https://www.youtube.com/watch?v=...',
      fetchFormats: 'جلب الصيغ',
      features: {
        heading: 'ما الذي يستطيع Arroxy سحبه',
        video: {
          title: 'مقاطع فيديو',
          desc: 'اختر أي دقة حتى 4K'
        },
        playlist: {
          title: 'قوائم التشغيل',
          desc: 'اختر عناصر متعددة من قائمة'
        },
        audio: {
          title: 'صوت',
          desc: 'المقطع الأصلي أو تحويل MP3/M4A'
        }
      },
      mascotIdle: 'أرسل لي رابط YouTube (فيديو أو Short) — ثم اضغط "جلب الصيغ" وسأبدأ العمل ✨',
      mascotBusy: 'جارٍ التنزيل في الخلفية… أستطيع تعدد المهام 😎',
      advanced: 'متقدم',
      clearAria: 'مسح الرابط',
      clipboard: {
        toggle: 'مراقبة الحافظة',
        toggleDescription: 'يملأ حقل الرابط تلقائياً عند نسخ رابط YouTube.',
        dialog: {
          title: 'تم اكتشاف رابط YouTube',
          body: 'هل تريد استخدام هذا الرابط من الحافظة؟',
          useButton: 'استخدام الرابط',
          disableButton: 'تعطيل',
          cancelButton: 'إلغاء',
          disableNote: 'يمكنك إعادة تفعيل مراقبة الحافظة لاحقاً في الإعدادات المتقدمة.'
        }
      },
      cookies: {
        sourceLabel: 'مصدر الكوكيز',
        sourceOff: 'إيقاف',
        sourceFile: 'ملف',
        sourceBrowser: 'متصفح',
        toggleDescription: 'يساعد مع مقاطع الفيديو المقيدة بالعمر والمخصصة للأعضاء والخاصة بالحساب.',
        risk: 'تحذير: يحتوي cookies.txt على جميع جلسات تسجيل الدخول لذلك المتصفح — احتفظ به سرياً.',
        fileLabel: 'ملف الكوكيز',
        choose: 'اختيار…',
        clear: 'مسح',
        placeholder: 'لم يتم اختيار ملف',
        helpLink: 'كيف أصدّر الكوكيز؟',
        enabledButNoFile: 'اختر ملفاً لاستخدام الكوكيز',
        browserLabel: 'المتصفح',
        browserPlaceholder: 'اختر متصفحاً…',
        browserHelp: 'يقرأ الكوكيز مباشرةً من المتصفح. يجب أن يكون المتصفح مغلقاً لمتصفحات عائلة Chromium.',
        enabledButNoBrowser: 'اختر متصفحاً لاستخدام الكوكيز',
        banWarning: 'قد يُعلّم YouTube — وأحياناً يحظر — الحسابات التي يستخدم yt-dlp كوكيزها. استخدم حساباً مؤقتاً إن أمكن.',
        extensionFirefox: 'cookies.txt (Firefox)',
        extensionChrome: 'Get cookies.txt LOCALLY (Chrome)'
      },
      proxy: {
        label: 'Proxy URL',
        description: 'توجيه حركة البيانات عبر وكيل — مفيد للمحتوى المقيّد جغرافياً.',
        placeholder: 'http://host:port',
        clear: 'مسح'
      },
      closeToTray: {
        toggle: 'الإخفاء في علبة النظام عند الإغلاق',
        toggleDescription: 'تستمر التنزيلات في الخلفية بعد إغلاق النافذة.'
      },
      analytics: {
        toggle: 'إرسال إحصائيات الاستخدام المجهولة',
        toggleDescription: 'يحسب فقط مرات تشغيل التطبيق. بدون عناوين URL أو أسماء ملفات أو بيانات شخصية.'
      }
    },
    subtitles: {
      heading: 'الترجمات',
      autoBadge: 'تلقائي',
      hint: 'ستُحفظ الملفات الجانبية بجانب الفيديو',
      noLanguages: 'لا توجد ترجمات متاحة لهذا الفيديو',
      skip: 'تخطي',
      skipSubs: 'تخطي لهذا الفيديو',
      selectAll: 'تحديد الكل',
      deselectAll: 'إلغاء تحديد الكل',
      mascot: 'اختر صفراً أو واحداً أو أكثر — الأمر يعود لك تماماً ✨',
      searchPlaceholder: 'البحث عن لغات…',
      noMatches: 'لا توجد لغات مطابقة',
      clearAll: 'مسح الكل',
      noSelected: 'لم يتم اختيار أي ترجمة',
      selectedNote_one: 'سيتم تنزيل {{count}} ترجمة',
      selectedNote_other: 'سيتم تنزيل {{count}} ترجمات',
      sectionManual: 'يدوي',
      sectionAuto: 'مولّد تلقائياً',
      saveMode: {
        heading: 'حفظ بصيغة',
        sidecar: 'بجانب الفيديو',
        embed: 'تضمين في الفيديو',
        subfolder: 'مجلد فرعي subtitles/'
      },
      format: {
        heading: 'الصيغة'
      },
      embedNote: 'يحفظ وضع التضمين المخرج بصيغة .mkv لضمان تضمين مسارات الترجمة بشكل موثوق.',
      autoAssNote: 'ستُحفظ الترجمات التلقائية بصيغة SRT بدلاً من ASS — يتم دائماً تنظيفها من تكرارات YouTube المتدحرجة التي لا يستطيع محوّل ASS لدينا إعادة إنتاجها بعد.'
    },
    sponsorblock: {
      modeHeading: 'تصفية الرعاة',
      mode: {
        off: 'إيقاف',
        mark: 'تحديد كفصول',
        remove: 'إزالة المقاطع'
      },
      modeHint: {
        off: 'لا يوجد SponsorBlock — يُشغَّل الفيديو كما رُفع.',
        mark: 'يُحدد مقاطع الرعاة كفصول (غير تدميري).',
        remove: 'يحذف مقاطع الرعاة من الفيديو باستخدام FFmpeg.'
      },
      categoriesHeading: 'الفئات',
      cat: {
        sponsor: 'رعاية',
        intro: 'مقدمة',
        outro: 'خاتمة',
        selfpromo: 'ترويج ذاتي',
        music_offtopic: 'موسيقى خارج الموضوع',
        preview: 'معاينة',
        filler: 'حشو'
      }
    },
    formats: {
      quickPresets: 'إعدادات سريعة',
      video: 'فيديو',
      audio: 'صوت',
      noAudio: 'بدون صوت',
      videoOnly: 'فيديو فقط',
      audioOnly: 'صوت فقط',
      audioOnlyOption: 'صوت فقط (بدون فيديو)',
      mascot: 'الأفضل + الأفضل = أقصى جودة. هذا ما كنت سأختاره!',
      sniffing: 'جارٍ البحث عن أفضل الصيغ لك…',
      loadingHint: 'عادةً يستغرق ثانية',
      loadingAria: 'جارٍ تحميل الصيغ',
      sizeUnknown: 'الحجم غير معروف',
      total: 'الإجمالي',
      convert: {
        label: 'تحويل',
        uncompressed: 'تحويل · غير مضغوط',
        bitrate: 'معدل البت',
        wavLabel: 'WAV (غير مضغوط)',
        lossyLabel: '{{target}} {{bitrate}} kbps',
        requiresAudioOnly: 'يتطلب تحويل الصوت وضع الصوت فقط (قم بإلغاء تحديد الفيديو).',
        requiresLossy: 'تم اختيار مقطع صوتي أصلي — معدل البت لا ينطبق إلا عند التحويل إلى mp3 أو m4a أو opus.'
      },
      botWall: {
        heading: 'YouTube قيّد هذا الفحص',
        bodyUnconfigured: 'قائمة الصيغ قد تكون غير مكتملة. أعدّ الكوكيز في الإعدادات المتقدمة، أو غيّر الشبكة وأعد المحاولة.',
        bodyDisabled: 'الكوكيز مضبوطة لكنها معطّلة. فعّلها وأعد المحاولة للحصول على القائمة الكاملة، أو غيّر الشبكة وأعد المحاولة.',
        bodyEnabled: 'حتى مع الكوكيز، قيّد YouTube هذا الفحص. حاول لاحقاً أو بدّل الشبكة.',
        retryCta: 'إعادة المحاولة',
        enableRetryCta: 'تفعيل الكوكيز وإعادة المحاولة',
        openSettingsCta: 'فتح الإعدادات المتقدمة'
      },
      cookiesError: {
        heading: 'ربما تكون الكوكيز هي السبب',
        currentModeLabel: 'مصدر الكوكيز',
        currentModeFile: 'ملف',
        currentModeBrowser: 'متصفح',
        explanationFile: 'ملف الكوكيز قد يكون فارغاً أو منتهي الصلاحية أو بتنسيق خاطئ (يتوقع yt-dlp ملف Netscape cookies.txt). جرّب إعادة تصدير الكوكيز، أو اختيار ملف مختلف، أو التبديل إلى وضع المتصفح، أو إيقاف الكوكيز.',
        explanationBrowser: 'تُقرأ الكوكيز مباشرةً من المتصفح. إذا كان المتصفح يعمل حالياً، فقد تكون قاعدة بيانات الكوكيز مقفلة (متصفحات عائلة Chromium). يجب أن يكون المتصفح مسجّل الدخول إلى YouTube. جرّب إغلاق المتصفح، أو التبديل إلى متصفح مختلف، أو التبديل إلى وضع الملف، أو إيقاف الكوكيز.',
        openSettingsCta: 'فتح إعدادات الكوكيز',
        dpapi: {
          heading: 'كوكيز Chrome محجوبة بسبب تشفير Windows',
          explanation: 'يُشفّر Chrome 127 والإصدارات الأحدث الكوكيز بطريقة لا تستطيع التطبيقات الأخرى قراءتها على Windows. جرّب أحد الحلول البديلة أدناه.',
          fixFirefoxLabel: 'التبديل إلى Firefox',
          fixFirefoxBody: 'لا يستخدم Firefox تشفير App-Bound Encryption. افتح إعدادات الكوكيز واختر Firefox من قائمة المتصفحات.',
          fixFileLabel: 'تصدير cookies.txt',
          fixFileBody: 'صدّر الكوكيز من Chrome باستخدام إضافة متصفح، ثم بدّل هذا التطبيق إلى وضع الملف واختر الملف المُصدَّر.',
          fixUnsafeLabel: 'تشغيل Chrome مع تعطيل App-Bound Encryption',
          fixUnsafeBody: 'أضف --disable-features=LockProfileCookieDatabase إلى اختصار تشغيل Chrome. تحذير: سيؤدي ذلك إلى إبطال الكوكيز المشفّرة مسبقاً، وستُسجَّل خارجاً من جميع المواقع وستحتاج إلى تسجيل الدخول من جديد.',
          docsLinkLabel: 'وثائق yt-dlp (issue #10927)'
        }
      }
    },
    folder: {
      heading: 'الحفظ في',
      downloads: 'التنزيلات',
      videos: 'الأفلام',
      desktop: 'سطح المكتب',
      music: 'الموسيقى',
      documents: 'المستندات',
      pictures: 'الصور',
      home: 'الرئيسية',
      custom: 'مخصص…',
      subfolder: {
        toggle: 'الحفظ داخل مجلد فرعي',
        placeholder: 'مثل lo-fi rips',
        invalid: 'اسم المجلد يحتوي على أحرف غير صالحة'
      }
    },
    output: {
      embedChapters: {
        label: 'تضمين الفصول',
        description: 'علامات فصول قابلة للتنقل في أي مشغّل حديث.'
      },
      embedMetadata: {
        label: 'تضمين البيانات الوصفية',
        description: 'كتابة العنوان والفنان والوصف وتاريخ الرفع في الملف.'
      },
      embedThumbnail: {
        label: 'تضمين الصورة المصغرة',
        description: 'صورة الغلاف داخل الملف. سيُعاد تغليف فيديو WebM إلى MKV؛ يُتخطى عند تضمين الترجمات.'
      },
      writeDescription: {
        label: 'حفظ الوصف',
        description: 'يحفظ وصف الفيديو كملف نصي .description بجانب التنزيل.'
      },
      writeThumbnail: {
        label: 'حفظ الصورة المصغرة',
        description: 'يحفظ الصورة المصغرة كملف صورة .jpg بجانب التنزيل.'
      }
    },
    confirm: {
      readyHeadline: 'جاهز للتنزيل!',
      landIn: 'سيُحفظ ملفك في',
      labelVideo: 'فيديو',
      labelAudio: 'صوت',
      labelSubtitles: 'الترجمات',
      subtitlesNone: '—',
      labelSaveTo: 'الحفظ في',
      labelSize: 'الحجم',
      sizeUnknown: 'غير معروف',
      nothingToDownload: 'الإعداد المسبق "ترجمات فقط" مفعّل ولكن لم يتم اختيار أي لغة ترجمة — لن يتم تنزيل أي شيء.',
      audioOnly: 'صوت فقط',
      addToQueue: '+ Queue',
      addToQueueTooltip: 'يبدأ عند انتهاء التنزيلات الأخرى — يحصل على كامل عرض النطاق',
      pullIt: 'Pull it! ↓',
      pullItTooltip: 'يبدأ فوراً — يعمل جنباً إلى جنب مع التنزيلات النشطة الأخرى',
      playlistBatch_one: '{{count}} فيديو · {{title}}',
      playlistBatch_other: '{{count}} مقاطع فيديو · {{title}}',
      labelPlaylist: 'قائمة التشغيل',
      labelPreset: 'الإعداد المسبق',
      labelItems: 'العناصر',
      itemsValue_one: '{{count}} من {{total}} فيديو',
      itemsValue_other: '{{count}} من {{total}} مقاطع فيديو'
    },
    error: {
      icon: 'خطأ'
    }
  },
  videoCard: {
    titlePlaceholder: 'جارٍ التحميل…',
    domain: 'youtube.com'
  },
  queue: {
    header: 'قائمة التنزيل',
    toggleTitle: 'تبديل قائمة التنزيل',
    empty: 'ستظهر التنزيلات التي تضيفها إلى القائمة هنا',
    noDownloads: 'لا توجد تنزيلات بعد.',
    activeCount: '{{count}} جارٍ التنزيل · {{percent}}%',
    clear: 'مسح',
    clearTitle: 'مسح التنزيلات المكتملة',
    pauseAll: 'إيقاف الكل مؤقتاً',
    pauseAllTitle: 'إيقاف جميع التنزيلات النشطة مؤقتاً',
    cancelAll: 'إلغاء الكل',
    cancelAllTitle: 'إلغاء جميع التنزيلات النشطة والمعلقة',
    tip: 'تنزيلك في قائمة الانتظار أدناه — افتح في أي وقت لمتابعة التقدم.',
    item: {
      doneAt: 'اكتمل {{time}}',
      paused: 'موقوف',
      defaultError: 'فشل التنزيل',
      openUrl: 'فتح الرابط',
      pause: 'إيقاف مؤقت',
      hold: 'تأجيل',
      resume: 'استئناف',
      cancel: 'إلغاء',
      remove: 'إزالة'
    },
    interJobSleep_one: 'التنزيل التالي يبدأ خلال {{count}} ثانية',
    interJobSleep_other: 'التنزيل التالي يبدأ خلال {{count}} ثوانٍ'
  },
  update: {
    appVersion: 'Arroxy {{version}}',
    isAvailable: 'متاح',
    youHave: '— لديك {{currentVersion}}',
    install: 'تثبيت وإعادة التشغيل',
    downloading: 'جارٍ التنزيل…',
    download: 'Download ↗',
    dismiss: 'إخفاء شريط التحديث',
    copy: 'نسخ الأمر إلى الحافظة',
    copied: 'تم نسخ الأمر إلى الحافظة',
    installFailed: 'فشل التحديث',
    retry: 'إعادة المحاولة'
  },
  status: {
    preparingBinaries: 'جارٍ تحضير الثنائيات…',
    mintingToken: 'جارٍ إنشاء رمز YouTube…',
    remintingToken: 'جارٍ إعادة إنشاء الرمز…',
    startingYtdlp: 'جارٍ تشغيل عملية yt-dlp…',
    downloadingMedia: 'جارٍ تنزيل الفيديو والصوت…',
    mergingFormats: 'جارٍ دمج الصوت والفيديو…',
    extractingAudio: 'جارٍ تحويل الصوت…',
    convertingVideo: 'جارٍ تحويل الفيديو…',
    embeddingMetadata: 'جارٍ تضمين البيانات الوصفية…',
    movingFiles: 'جارٍ نقل الملفات…',
    fetchingSubtitles: 'جارٍ جلب الترجمات…',
    sleepingBetweenRequests: 'الانتظار {{seconds}} ثانية لتجنب تجاوز الحد…',
    subtitlesFailed: 'تم حفظ الفيديو — تعذّر تنزيل بعض الترجمات',
    cancelled: 'تم إلغاء التنزيل',
    complete: 'اكتمل التنزيل',
    usedExtractorFallback: 'تم التنزيل باستخدام المستخرج المخفف — أعدّ cookies.txt لتنزيلات أكثر موثوقية',
    ytdlpProcessError: 'خطأ في عملية yt-dlp: {{error}}',
    ytdlpExitCode: 'خرج yt-dlp بالرمز {{code}}',
    downloadingBinary: 'جارٍ تنزيل ثنائي {{name}}…',
    unknownStartupFailure: 'فشل غير معروف في بدء التنزيل'
  },
  errors: {
    ytdlp: {
      botBlock: 'تم تفعيل الحماية من الروبوتات. على الأرجح أن عنوان IP الذي تستخدمه مُعلَّم (نطاق مراكز البيانات أو نقطة خروج VPN مزدحمة). غيّر عنوان IP أو اختر نقطة اتصال VPN مختلفة وأعد المحاولة. إذا استمر الفشل، فقد يكون ذلك تغييراً مؤقتاً من جانب YouTube — يُحدّث Arroxy تلقائياً yt-dlp عند التشغيل، لذا سيصل الإصلاح تلقائياً بمجرد أن يُطلقه المصدر.',
      ipBlock: 'يبدو أن عنوان IP الخاص بك محظور من قِبل YouTube. حاول لاحقاً أو استخدم VPN.',
      rateLimit: 'تُقيّد YouTube الطلبات. انتظر دقيقة ثم حاول مجدداً.',
      ageRestricted: 'هذا الفيديو مقيّد بالعمر ولا يمكن تنزيله بدون حساب مسجّل الدخول.',
      unavailable: 'هذا الفيديو غير متاح — قد يكون خاصاً أو محذوفاً أو مقيّداً بالمنطقة.',
      geoBlocked: 'هذا الفيديو غير متاح في منطقتك.',
      outOfDiskSpace: 'مساحة القرص غير كافية. أفرغ مساحة وأعد المحاولة.',
      unsupportedUrl: 'لا يبدو هذا رابط فيديو. الصق رابط فيديو YouTube أو Short أو قائمة تشغيل.'
    }
  },
  presets: {
    'best-quality': {
      label: 'أفضل جودة',
      desc: 'أعلى دقة + أفضل صوت'
    },
    balanced: {
      label: 'متوازن',
      desc: '720p كحد أقصى + صوت جيد'
    },
    'audio-only': {
      label: 'صوت فقط',
      desc: 'بدون فيديو، أفضل صوت'
    },
    'small-file': {
      label: 'ملف صغير',
      desc: 'أدنى دقة + صوت منخفض'
    },
    'subtitle-only': {
      label: 'ترجمات فقط',
      desc: 'بدون فيديو، بدون صوت، ترجمات فقط'
    }
  },
  playlistPresets: {
    'video-best': { label: 'أفضل جودة', desc: 'أعلى فيديو + صوت متاح لكل عنصر' },
    'video-2160p': { label: 'حتى 4K', desc: 'محدود بـ 2160p، ينخفض لكل عنصر' },
    'video-1440p': { label: 'حتى 1440p', desc: 'محدود بـ 2K، ينخفض لكل عنصر' },
    'video-1080p': { label: 'حتى 1080p', desc: 'محدود لكل عنصر، ينخفض إلى أدنى' },
    'video-720p': { label: 'حتى 720p', desc: 'ملفات أصغر، توافق واسع' },
    'video-480p': { label: 'حتى 480p', desc: 'نطاق ترددي منخفض' },
    'video-360p': { label: 'حتى 360p', desc: 'أصغر فيديو' },
    'audio-best': { label: 'Audio (الأفضل)', desc: 'أفضل صوت أصلي، بدون إعادة ترميز' },
    'audio-mp3': { label: 'Audio (MP3)', desc: 'تحويل إلى MP3 192 kbps' }
  },
  formatLabel: {
    audioOnly: 'صوت فقط',
    audioFallback: 'صوت',
    audioOnlyDot: 'Audio only · {{audio}}',
    videoDot: '{{resolution}} · {{audio}}'
  },
  tray: {
    tooltip: 'Arroxy',
    menu: {
      statusIdle: 'خامل',
      statusActive_one: '1 جارٍ التنزيل · {{percent}}%',
      statusActive_other: '{{count}} جارٍ التنزيل · {{percent}}%',
      open: 'فتح Arroxy',
      quit: 'الخروج من Arroxy'
    }
  },
  dialogs: {
    quitWithActiveDownloads: {
      message_one: '{{count}} تنزيل قيد التقدم',
      message_other: '{{count}} تنزيلات قيد التقدم',
      detail: 'سيؤدي الإغلاق إلى إلغاء جميع التنزيلات النشطة.',
      confirm: 'إلغاء التنزيلات والخروج',
      keep: 'الاستمرار في التنزيل'
    },
    closeToTray: {
      message: 'هل تريد إخفاء Arroxy في علبة النظام عند الإغلاق؟',
      detail: 'يستمر Arroxy في العمل وينهي التنزيلات النشطة. يمكنك تغيير ذلك لاحقاً في الإعدادات المتقدمة.',
      hide: 'الإخفاء في علبة النظام',
      quit: 'الخروج',
      remember: 'لا تسألني مجدداً'
    },
    rendererCrashed: {
      message: 'واجه Arroxy مشكلة',
      detail: 'تعطّلت عملية العرض ({{reason}}). أعد التحميل للمحاولة مجدداً.',
      reload: 'إعادة التحميل',
      quit: 'الخروج'
    }
  }
} as const;

export default ar;
