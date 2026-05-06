const uk = {
  common: {
    back: 'Назад',
    continue: 'Продовжити',
    retry: 'Повторити',
    startOver: 'Почати спочатку',
    loading: 'Завантаження…'
  },
  app: {
    feedback: "Зворотний зв'язок",
    logs: 'Журнали',
    feedbackNudge: 'Подобається Arroxy? Я б залюбки почув твою думку! 💬',
    debugCopied: 'Скопійовано!',
    debugCopyTitle: 'Скопіювати налагоджувальну інформацію (версії Electron, ОС, Chrome)',
    zoomIn: 'Збільшити',
    zoomOut: 'Зменшити'
  },
  titleBar: {
    close: 'Закрити',
    minimize: 'Згорнути',
    maximize: 'Розгорнути',
    restore: 'Відновити'
  },
  splash: {
    greeting: 'Привіт, з поверненням!',
    warmup: 'Arroxy розігрівається…',
    downloading: 'Завантаження {{binary}}…',
    warning: 'Налаштування не завершено — деякі функції можуть не працювати',
    warmupFailedNoDiag: 'Налаштування не вдалося. Відкрий журнал налаштування для деталей.'
  },
  repair: {
    title: 'Налаштування потребує твоєї допомоги',
    deps: {
      ytDlp: 'yt-dlp',
      ffmpeg: 'FFmpeg',
      ffprobe: 'FFprobe',
      deno: 'Deno'
    },
    hints: {
      unknown: 'Не вдалося перевірити.',
      downloadFailed: 'Завантаження не вдалося. Перевір підключення до інтернету та спробуй ще раз.',
      extractFailed: 'Не вдалося розпакувати архів. Можливо, завантаження пошкоджено — спробуй ще раз.',
      hashFailed: 'Контрольна сума завантаженого файлу не збігається. Повтори завантаження.',
      spawnFailed: 'Файл відсутній або не вдалося запустити. Вибери робочу копію.',
      permissionDenied: 'Система відмовила у запуску файлу. Вибери копію, якій довіряєш, або повтори від імені адміністратора.',
      blockedOrQuarantined: 'Windows заблокувала файл (SmartScreen / Defender). Вибери встановлену копію або додай папку середовища виконання у виключення.',
      badExitCode: 'Двійковий файл не відповів на --version. Можливо, він пошкоджений або призначений для іншої платформи.',
      timeout: 'Перевірка версії завершилася з тайм-аутом. Файл може зависнути — спробуй ще раз.',
      pairIncomplete: "ffmpeg і ffprobe мають бути вказані разом як пов'язана пара."
    },
    actions: {
      chooseExecutable: 'Вибрати виконуваний файл',
      resetToDefault: 'Скинути до стандартного',
      retrySetup: 'Повторити налаштування',
      cancel: 'Скасувати',
      openDependencyFolder: 'Відкрити папку залежностей',
      viewSetupLog: 'Переглянути журнал налаштування'
    }
  },
  theme: {
    light: 'Світла тема',
    dark: 'Темна тема',
    system: 'Системна'
  },
  language: {
    label: 'Мова'
  },
  wizard: {
    steps: {
      url: 'Посилання',
      playlistItems: 'Playlist',
      playlistPresets: 'Якість',
      formats: 'Формат',
      subtitles: 'Субтитри',
      sponsorblock: 'SponsorBlock',
      output: 'Вивід',
      folder: 'Зберегти',
      confirm: 'Підтвердити'
    },
    playlist: {
      heading: 'Елементи Playlist',
      itemCount_one: '{{count}} відео',
      itemCount_other: '{{count}} відео',
      selectAll: 'Вибрати всі',
      selectNone: 'Зняти вибір',
      rangeFrom: 'Від',
      rangeTo: 'До',
      rangeApply: 'Застосувати діапазон',
      selectedCount_one: '{{count}} вибрано',
      selectedCount_other: '{{count}} вибрано',
      noSelection: 'Вибери хоча б одне відео, щоб продовжити',
      loadingItems: 'Завантаження Playlist…',
      thumbnailAlt: 'Мініатюра відео',
      continue: 'Продовжити',
      durationUnknown: 'live'
    },
    playlistPresets: {
      heading: 'Вибери якість для пакетного завантаження',
      subhead: 'Кожне відео самостійно підбирає відповідний рівень якості — неоднорідні плейлисти працюють без сюрпризів.',
      itemCount_one: '{{count}} елемент',
      itemCount_other: '{{count}} елементів',
      continue: 'Продовжити'
    },
    mixedPrompt: {
      title: 'Одне відео чи весь Playlist?',
      body: 'Це посилання є частиною Playlist. Що ти хочеш завантажити?',
      singleVideo: 'Тільки це відео',
      wholePlaylist: 'Весь Playlist'
    },

    url: {
      heading: 'Посилання YouTube',
      placeholder: 'https://www.youtube.com/watch?v=...',
      fetchFormats: 'Отримати формати',
      features: {
        heading: 'Що Arroxy вміє завантажувати',
        video: {
          title: 'Відео',
          desc: 'Будь-яка роздільна здатність до 4K'
        },
        playlist: {
          title: 'Плейлисти',
          desc: 'Мультивибір елементів плейлиста'
        },
        audio: {
          title: 'Аудіо',
          desc: 'Оригінальний потік або конвертація в MP3/M4A'
        }
      },
      mascotIdle: 'Кинь мені посилання YouTube (відео або Shorts) — натисни «Отримати формати» і я візьмусь за справу ✨',
      mascotBusy: 'Завантажую у фоні… можу робити кілька справ одночасно 😎',
      advanced: 'Додатково',
      clearAria: 'Очистити URL',
      clipboard: {
        toggle: 'Стежити за буфером обміну',
        toggleDescription: 'Автоматично підставляє посилання YouTube у поле URL при копіюванні.',
        dialog: {
          title: 'Знайдено посилання YouTube',
          body: 'Використати це посилання з буфера обміну?',
          useButton: 'Використати URL',
          disableButton: 'Вимкнути',
          cancelButton: 'Скасувати',
          disableNote: 'Стеження за буфером обміну можна знову ввімкнути в додаткових налаштуваннях.'
        }
      },
      cookies: {
        toggle: 'Використовувати файл cookies',
        toggleDescription: 'Допомагає з відео з віковим обмеженням, лише для учасників і приватними у твоєму акаунті.',
        risk: 'Ризик: cookies.txt містить усі активні сесії браузера — тримай його в таємниці.',
        fileLabel: 'Файл cookies',
        choose: 'Обрати…',
        clear: 'Скинути',
        placeholder: 'Файл не обрано',
        helpLink: 'Як експортувати cookies?',
        enabledButNoFile: 'Обери файл, щоб використовувати cookies',
        banWarning: 'YouTube може позначити — і іноді забанити — акаунти, чиї cookies використовує yt-dlp. По можливості використовуй одноразовий акаунт.',
        extensionFirefox: 'cookies.txt (Firefox)',
        extensionChrome: 'Get cookies.txt LOCALLY (Chrome)'
      },
      proxy: {
        label: 'Proxy URL',
        description: 'Направляти трафік через проксі — корисно для контенту з географічними обмеженнями.',
        placeholder: 'http://host:port',
        clear: 'Очистити'
      },
      closeToTray: {
        toggle: 'Приховувати в трей при закритті',
        toggleDescription: 'Продовжувати завантаження у фоні після закриття вікна.'
      },
      analytics: {
        toggle: 'Надсилати анонімну статистику',
        toggleDescription: 'Лише підрахунок запусків додатку. Без URL, імен файлів чи особистих даних.'
      }
    },
    subtitles: {
      heading: 'Субтитри',
      autoBadge: 'Авто',
      hint: 'Файли буде збережено поряд із відео',
      noLanguages: 'Для цього відео субтитри недоступні',
      skip: 'Пропустити',
      skipSubs: 'Пропустити для цього відео',
      selectAll: 'Вибрати всі',
      deselectAll: 'Зняти вибір',
      mascot: 'Нуль, одну або кілька мов — вирішуй сам ✨',
      searchPlaceholder: 'Пошук мов…',
      noMatches: 'Мови не знайдено',
      clearAll: 'Очистити все',
      noSelected: 'Субтитри не вибрані',
      selectedNote_one: 'Буде завантажено {{count}} субтитр',
      selectedNote_other: 'Буде завантажено субтитрів: {{count}}',
      sectionManual: 'Ручні',
      sectionAuto: 'Автоматичні',
      saveMode: {
        heading: 'Зберегти як',
        sidecar: 'Поруч із відео',
        embed: 'Вбудувати у відео',
        subfolder: 'Підпапка subtitles/'
      },
      format: {
        heading: 'Format'
      },
      embedNote: 'Режим вбудовування зберігає файл як .mkv, щоб доріжки субтитрів вбудовувалися надійно.',
      autoAssNote: 'Авто-субтитри будуть збережені як SRT замість ASS — вони завжди очищаються від роллінгових дублів YouTube, а наш ASS-конвертер поки такого не повторює.'
    },
    sponsorblock: {
      modeHeading: 'Фільтрація спонсорів',
      mode: {
        off: 'Вимк',
        mark: 'Позначити як розділи',
        remove: 'Видалити сегменти'
      },
      modeHint: {
        off: 'Без SponsorBlock — відео відтворюється як завантажено.',
        mark: 'Позначає спонсорські сегменти як розділи (не деструктивно).',
        remove: 'Вирізає спонсорські сегменти за допомогою FFmpeg.'
      },
      categoriesHeading: 'Категорії',
      cat: {
        sponsor: 'Спонсор',
        intro: 'Інтро',
        outro: 'Аутро',
        selfpromo: 'Самореклама',
        music_offtopic: 'Музика не по темі',
        preview: 'Перегляд',
        filler: 'Заповнювач'
      }
    },
    formats: {
      quickPresets: 'Швидкі пресети',
      video: 'Відео',
      audio: 'Аудіо',
      noAudio: 'Без аудіо',
      videoOnly: 'Тільки відео',
      audioOnly: 'Тільки аудіо',
      audioOnlyOption: 'Тільки аудіо (без відео)',
      mascot: 'Найкраще + найкраще = максимальна якість. Я б обрав саме це!',
      sniffing: 'Шукаю для тебе найкращі формати…',
      loadingHint: 'Зазвичай займає секунду',
      loadingAria: 'Завантаження форматів',
      sizeUnknown: 'Розмір невідомий',
      total: 'Усього',
      convert: {
        label: 'Конвертувати',
        uncompressed: 'Конвертувати · без стиснення',
        bitrate: 'Бітрейт',
        wavLabel: 'WAV (uncompressed)',
        lossyLabel: '{{target}} {{bitrate}} kbps',
        requiresAudioOnly: 'Конвертація аудіо потребує режиму «Тільки аудіо» (зніміть вибір відео).',
        requiresLossy: 'Вибрано нативний потік — бітрейт застосовується лише при конвертації в mp3, m4a або opus.'
      }
    },
    folder: {
      heading: 'Зберегти у',
      downloads: 'Завантаження',
      videos: 'Відео',
      desktop: 'Робочий стіл',
      music: 'Музика',
      documents: 'Документи',
      pictures: 'Зображення',
      home: 'Домашня папка',
      custom: 'Обрати…',
      subfolder: {
        toggle: 'Зберегти у вкладеній папці',
        placeholder: 'напр. lo-fi rips',
        invalid: 'Назва папки містить недопустимі символи'
      }
    },
    output: {
      embedChapters: {
        label: 'Вбудувати розділи',
        description: 'Маркери розділів, доступні для навігації в будь-якому сучасному плеєрі.'
      },
      embedMetadata: {
        label: 'Вбудувати метадані',
        description: 'Назва, виконавець, опис і дата завантаження записуються у файл.'
      },
      embedThumbnail: {
        label: 'Вбудувати мініатюру',
        description: 'Обкладинка всередині файлу. WebM відео буде перепакована в MKV; пропускається при вбудованих субтитрах.'
      },
      writeDescription: {
        label: 'Зберегти опис',
        description: 'Зберігає опис відео як файл .description поруч із завантаженням.'
      },
      writeThumbnail: {
        label: 'Зберегти мініатюру',
        description: 'Зберігає мініатюру як файл .jpg поруч із завантаженням.'
      }
    },
    confirm: {
      readyHeadline: 'Готово до завантаження!',
      landIn: 'Файл потрапить у',
      labelVideo: 'Відео',
      labelAudio: 'Аудіо',
      labelSubtitles: 'Субтитри',
      subtitlesNone: '—',
      labelSaveTo: 'Папка',
      labelSize: 'Розмір',
      sizeUnknown: 'Невідомо',
      nothingToDownload: 'Пресет «Тільки субтитри» активний, але мову субтитрів не вибрано — нічого не буде завантажено.',
      audioOnly: 'Тільки аудіо',
      addToQueue: '+ У чергу',
      addToQueueTooltip: 'Запуститься, коли завершаться інші завантаження — на повній швидкості',
      pullIt: 'Качаємо! ↓',
      pullItTooltip: 'Запускається миттєво — паралельно з іншими активними завантаженнями',
      playlistBatch_one: '{{count}} відео · {{title}}',
      playlistBatch_other: '{{count}} відео · {{title}}',
      labelPlaylist: 'Плейлист',
      labelPreset: 'Пресет',
      labelItems: 'Елементи',
      itemsValue_one: '{{count}} з {{total}} відео',
      itemsValue_other: '{{count}} з {{total}} відео'
    },
    error: {
      icon: 'Помилка'
    }
  },
  videoCard: {
    titlePlaceholder: 'Завантаження…',
    domain: 'youtube.com'
  },
  queue: {
    header: 'Черга завантажень',
    toggleTitle: 'Показати/сховати чергу завантажень',
    empty: "Тут з'являться завантаження, додані в чергу",
    noDownloads: 'Завантажень поки немає.',
    activeCount: '{{count}} завантажуються · {{percent}}%',
    clear: 'Очистити',
    clearTitle: 'Очистити завершені завантаження',
    pauseAll: 'Призупинити всі',
    pauseAllTitle: 'Призупинити всі активні завантаження',
    cancelAll: 'Скасувати всі',
    cancelAllTitle: 'Скасувати всі активні та очікувані завантаження',
    tip: 'Твоє завантаження в черзі нижче — відкрий її будь-коли, щоб стежити за прогресом.',
    item: {
      doneAt: 'Готово о {{time}}',
      paused: 'На паузі',
      defaultError: 'Не вдалося завантажити',
      openUrl: 'Відкрити посилання',
      pause: 'Пауза',
      hold: 'Утримати',
      resume: 'Продовжити',
      cancel: 'Скасувати',
      remove: 'Видалити'
    },
    interJobSleep_one: 'Наступне завантаження розпочнеться через {{count}}с',
    interJobSleep_other: 'Наступне завантаження розпочнеться через {{count}}с'
  },
  update: {
    appVersion: 'Arroxy {{version}}',
    isAvailable: 'доступна',
    youHave: '— у тебе {{currentVersion}}',
    install: 'Встановити й перезапустити',
    downloading: 'Завантаження…',
    download: 'Завантажити ↗',
    dismiss: 'Закрити сповіщення про оновлення',
    copy: 'Скопіювати команду в буфер обміну',
    copied: 'Команду скопійовано в буфер обміну',
    installFailed: 'Помилка оновлення',
    retry: 'Повторити'
  },
  status: {
    preparingBinaries: 'Підготовка бінарників…',
    mintingToken: 'Створення токена YouTube…',
    remintingToken: 'Оновлення токена…',
    startingYtdlp: 'Запуск процесу yt-dlp…',
    downloadingMedia: 'Завантаження відео та аудіо…',
    mergingFormats: "Об'єднання аудіо та відео…",
    extractingAudio: 'Конвертація аудіо…',
    convertingVideo: 'Конвертація відео…',
    embeddingMetadata: 'Вбудовування метаданих…',
    movingFiles: 'Переміщення файлів…',
    fetchingSubtitles: 'Отримання субтитрів…',
    sleepingBetweenRequests: 'Очікування {{seconds}}с для уникнення лімітів…',
    subtitlesFailed: 'Відео збережено — деякі субтитри не завантажилися',
    cancelled: 'Завантаження скасовано',
    complete: 'Завантаження завершено',
    usedExtractorFallback: 'Завантажено зі спрощеним екстрактором — налаштуй cookies.txt для надійніших завантажень',
    ytdlpProcessError: 'Помилка процесу yt-dlp: {{error}}',
    ytdlpExitCode: 'yt-dlp завершився з кодом {{code}}',
    downloadingBinary: 'Завантаження бінарника {{name}}…',
    unknownStartupFailure: 'Невідома помилка під час запуску завантаження'
  },
  errors: {
    ytdlp: {
      botBlock: "Спрацював захист від ботів. IP-адреса, яку ти використовуєш, найімовірніше заблокована (діапазон датацентру або перевантажений вихідний вузол VPN). Зміни IP або вибери інший сервер VPN і повтори спробу. Якщо помилка повторюється, можливо, це тимчасова зміна на боці YouTube — Arroxy автоматично оновлює yt-dlp під час запуску, тож виправлення з'явиться само після виходу оновлення.",
      ipBlock: 'YouTube, схоже, заблокував твою IP-адресу. Спробуй пізніше або скористайся VPN.',
      rateLimit: 'YouTube обмежує кількість запитів. Зачекай хвилину і повтори.',
      ageRestricted: 'Це відео має віковий ценз — без авторизації завантажити неможливо.',
      unavailable: 'Це відео недоступне — можливо, воно приватне, видалене або обмежене за регіоном.',
      geoBlocked: 'Це відео недоступне у твоєму регіоні.',
      outOfDiskSpace: 'Недостатньо місця на диску. Звільни місце та спробуй ще раз.',
      unsupportedUrl: 'Це не схоже на посилання на відео. Встав посилання на YouTube-відео, Short або плейлист.'
    }
  },
  presets: {
    'best-quality': {
      label: 'Найкраща якість',
      desc: 'Максимальна роздільна здатність + найкраще аудіо'
    },
    balanced: {
      label: 'Збалансовано',
      desc: '720p макс. + гарне аудіо'
    },
    'audio-only': {
      label: 'Тільки аудіо',
      desc: 'Без відео, найкраще аудіо'
    },
    'small-file': {
      label: 'Малий файл',
      desc: 'Найнижча роздільна здатність + слабке аудіо'
    },
    'subtitle-only': {
      label: 'Тільки субтитри',
      desc: 'Без відео та аудіо, лише субтитри'
    }
  },
  playlistPresets: {
    'video-best': { label: 'Найкраща якість', desc: 'Максимальна роздільна здатність + найкраще аудіо на кожен елемент' },
    'video-2160p': { label: 'До 4K', desc: 'Обмежено до 2160p, з відкатом нижче для кожного елемента' },
    'video-1440p': { label: 'До 1440p', desc: 'Обмежено до 2K, з відкатом нижче для кожного елемента' },
    'video-1080p': { label: 'До 1080p', desc: 'Обмежено для кожного елемента, з відкатом нижче' },
    'video-720p': { label: 'До 720p', desc: 'Менший розмір файлу, широка сумісність' },
    'video-480p': { label: 'До 480p', desc: 'Низький трафік' },
    'video-360p': { label: 'До 360p', desc: 'Найменше відео' },
    'audio-best': { label: 'Audio (best)', desc: 'Найкраще нативне аудіо без перекодування' },
    'audio-mp3': { label: 'Audio (MP3)', desc: 'Конвертувати в MP3 192 kbps' }
  },
  formatLabel: {
    audioOnly: 'Тільки аудіо',
    audioFallback: 'Аудіо',
    audioOnlyDot: 'Тільки аудіо · {{audio}}',
    videoDot: '{{resolution}} · {{audio}}'
  },
  tray: {
    tooltip: 'Arroxy',
    menu: {
      statusIdle: 'Очікування',
      statusActive_one: '1 завантажується · {{percent}}%',
      statusActive_other: '{{count}} завантажуються · {{percent}}%',
      open: 'Відкрити Arroxy',
      quit: 'Вийти з Arroxy'
    }
  },
  dialogs: {
    quitWithActiveDownloads: {
      message_one: 'Триває {{count}} завантаження',
      message_other: 'Триває завантажень: {{count}}',
      detail: 'Закриття скасує всі активні завантаження.',
      confirm: 'Скасувати завантаження й вийти',
      keep: 'Продовжити завантаження'
    },
    closeToTray: {
      message: 'Приховувати Arroxy в системний трей при закритті?',
      detail: 'Arroxy продовжить роботу і завершить активні завантаження. Змінити в розширених налаштуваннях.',
      hide: 'Приховати в трей',
      quit: 'Вийти',
      remember: 'Більше не питати'
    },
    rendererCrashed: {
      message: 'Arroxy зіткнувся з проблемою',
      detail: 'Процес рендерера завершився аварійно ({{reason}}). Перезавантажте, щоб спробувати ще раз.',
      reload: 'Перезавантажити',
      quit: 'Вийти'
    }
  }
} as const;

export default uk;
