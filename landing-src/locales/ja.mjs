// Landing-page translations for "ja". One key per string; build.mjs
// validates parity against en.mjs at build time.
//
// Keys ending in `_html` are injected as raw HTML so translations can
// keep inline tags like <em>. Everything else is HTML-escaped.

export const ja = {
  title: "Arroxy — 無料 4K YouTube + 2000 サイト対応ダウンローダー、ログイン不要",
  description:
    "Windows、macOS、Linux 向けの無料・MIT ライセンスのデスクトップダウンローダー。YouTube と 2000 以上の対応サイトから最大 4K HDR・60 fps で動画をダウンロード。広告なし、余計なものなし、アップセルなし。",
  og_title: "Arroxy — 無料 4K YouTube + 2000 サイト対応ダウンローダー、ログイン不要",
  og_description:
    "YouTube と 2000 以上のサイトに対応した無料 4K ダウンローダー。広告なし、余計なものなし、アップセルなし。MIT ライセンス。Windows · macOS · Linux。",

  nav_features: "機能",
  nav_screenshots: "スクリーンショット",
  nav_install: "インストール",
  nav_blog: "Blog",
  nav_download: "ダウンロード",

  hero_eyebrow: "Open Source · MIT · 継続開発中",
  hero_h1_a: "無料 4K YouTube（+ 2000 サイト）ダウンローダー。",
  hero_h1_b: "広告なし、余計なものなし、アップセルなし。",
  hero_tagline:
    "Arroxy は Windows、macOS、Linux 向けの無料・MIT ライセンスのデスクトップダウンローダーです。YouTube と 2000 以上の対応サイトから最大 4K HDR・60 fps で動画をダウンロード。広告なし、余計なものなし、アップセルなし — URL を貼り付けるだけで始められます。",
  hero_trust: "GitHub ですべてのコードを監査できます。",
  pill_no_tracking: "トラッキングなし",
  pill_no_account: "広告なし",
  pill_open_source: "オープンソース (MIT)",
  cta_download_os: "あなたの OS 向けにダウンロード",
  cta_view_github: "GitHub で見る",
  release_label: "最新リリース:",
  release_loading: "読み込み中…",

  cta_download_windows: "Windows 版をダウンロード",
  cta_download_windows_portable: "ポータブル .exe（インストール不要）",
  cta_download_mac_arm: "macOS 版をダウンロード（Apple Silicon）",
  cta_download_mac_intel: "Intel Mac ですか？ x64 DMG を取得",
  cta_download_linux_appimage: "Linux 版をダウンロード（.AppImage）",
  cta_download_linux_flatpak: "Flatpak バンドル →",
  cta_other_platforms: "他のプラットフォーム / すべてのダウンロード",
  cta_os_windows: "Windows",
  cta_os_mac: "macOS",
  cta_os_linux: "Linux",
  cta_installer_label: "インストーラー",
  cta_portable_label: "ポータブル",
  cta_arm_label: "Apple Silicon",
  cta_intel_label: "Intel",
  mobile_notice: "Arroxy は Windows、macOS、Linux 向けのデスクトップアプリです。",
  mobile_notice_sub: "ダウンロードするには、お使いのパソコンでこのページを開いてください。",
  mobile_copy_link: "リンクをコピー",
  first_launch_label: "初回起動のヘルプ",
  first_launch_windows_html:
    "初回起動時、Windows SmartScreen が <em>«Windows protected your PC»</em> または <em>«Unknown publisher»</em> を表示することがあります — Arroxy は無料のオープンソースソフトウェアであり、Windows ビルドには有料の証明書によるコード署名がありません。これは <code>Arroxy-Setup-*.exe</code> と <code>Arroxy-Portable-*.exe</code> の両方に該当し、Arroxy が危険であることを意味<strong>しません</strong>。<strong>More info</strong> をクリックし、続いて <strong>Run anyway</strong> をクリックしてください。Arroxy は必ず公式の GitHub Releases ページからダウンロードしてください — ソースコードは公開されているため、ご自身で確認またはビルドすることも可能です。",
  first_launch_mac_html:
    "macOS は初回起動時に <em>開発元未確認</em> の警告を表示します — Arroxy はまだ署名されていません。<strong>アプリアイコンを右クリック → 開く</strong>、ダイアログで <strong>開く</strong> をクリック。最初の一度だけです。",
  first_launch_linux_html:
    "<strong>AppImage:</strong> ファイルを右クリック → <strong>プロパティ → プログラムとして実行を許可</strong>、またはターミナルで <code>chmod +x Arroxy-*.AppImage</code> を実行。それでも起動しない場合は <code>libfuse2</code> (Ubuntu/Debian)、<code>fuse-libs</code> (Fedora)、または <code>fuse2</code> (Arch) をインストール。<br><br><strong>Flatpak:</strong> <code>flatpak install --user Arroxy-*.flatpak</code> を実行し、アプリメニューから起動するか <code>flatpak run io.github.antonio_orionus.Arroxy</code> を実行。",

  features_eyebrow: "できること",
  features_h2: "期待されることはすべて、面倒は一切なく。",
  features_sub: "URL を貼り付けて、画質を選んで、ダウンロードをクリック。それだけ。",
  f1_h: "最大 4K UHD",
  f1_p: "2160p、1440p、1080p、720p — YouTube と他の対応サイトが提供するあらゆる解像度に対応し、音声のみのダウンロードは MP3、M4A/AAC、Opus、WAV へ変換できます。",
  f2_h: "60 fps と HDR を維持",
  f2_p: "高フレームレートと HDR ストリームは YouTube がエンコードしたまま — 画質劣化なし。",
  f3_h: "プレイリストにも対応",
  f3_p: "プレイリスト URL を貼り付けて、一覧全体をダウンロードすることも、Arroxy がキューに入れる前に欲しい動画だけにチェックを入れることもできます。",
  f4_h: "自動アップデート",
  f4_p: "Arroxy は yt-dlp を最新に保ち、ffmpeg はアプリに同梱 — YouTube や他のサイトの変化に合わせて毎週修正を提供します。",
  f5_h: "21 言語対応",
  f5_p: "English, Español, Deutsch, Français, 日本語, 中文, Русский, Українська, हिन्दी, Afaan Oromoo, Kiswahili, O'zbekcha, Tiếng Việt, አማርኛ, العربية, اردو, پښتو, বাংলা, မြန်မာဘာသာ, Ελληνικά, Српски — あなたの言語を自動検出。",
  f6_h: "マルチプラットフォーム",
  f6_p: "Windows、macOS、Linux のネイティブビルド — インストーラー、ポータブル、DMG、AppImage。",
  f7_h: "字幕は思いのままに",
  f7_p: "手動または自動生成の字幕を SRT、VTT、ASS で取得 — 動画と並べて保存、ポータブルな .mkv に埋め込み、または Subtitles/ フォルダに整理。",
  f8_h: "SponsorBlock 内蔵",
  f8_p: "スポンサー、イントロ、アウトロ、自己宣伝などをスキップまたはマーク — FFmpeg でカットするか章として追加するか。カテゴリごとにあなたが決める。",
  f9_h: "クリップボード自動入力",
  f9_p: "対応リンクをどこかでコピーするだけで、アプリに切り替えた瞬間 Arroxy が検出します — 確認プロンプトで常に制御を維持。詳細設定で有効・無効を切り替え。",
  f10_h: "URL 自動クリーンアップ",
  f10_p: "貼り付けたリンクからトラッキングパラメータ（si、pp、feature、utm_*、fbclid、gclid など）が自動で除去され、youtube.com/redirect ラッパーも展開 — URL フィールドには常に正規リンクが表示されます。",
  f11_h: "トレイに格納",
  f11_p: "ウィンドウを閉じると Arroxy はシステムトレイに格納されます。ダウンロードはバックグラウンドで継続 — トレイアイコンをクリックするとウィンドウが戻り、トレイメニューから終了もできます。",
  f12_h: "メタデータ・カバーアート埋め込み",
  f12_p: "タイトル、アップロード日、アーティスト、説明、カバーアート、チャプターマーカーをファイルに直接書き込み — サイドカーファイルも手動タグ付けも不要。",

  shots_eyebrow: "実際の動作",
  shots_h2: "明快さのために設計、雑然さは排除。",
  shot1_alt: "URL を貼り付け",
  shot2_alt: "画質を選択",
  shot3_alt: "保存先を選択",
  shot4_alt: "並行ダウンロード",
  shot5_alt: "字幕ステップ — 言語・フォーマット・保存モードを選ぶ",
  og_image_alt: "Arroxy アプリアイコン — YouTube と 2000 以上のサイトから 4K でダウンロードするデスクトップアプリ。",

  privacy_eyebrow: "プライバシー",
  privacy_h2_html: "Arroxy が<em>しない</em>こと。",
  privacy_sub:
    "100% ローカル処理。広告なし、アップセルなし、サードパーティサーバーなし — ファイルは yt-dlp からあなたのディスクに直接保存されます。",
  p1_h: "ログイン不要",
  p1_p: "デフォルトモードは Google アカウントやログインなしで動作します。年齢制限付きやメンバー限定コンテンツ向けのオプション Cookie サポートが詳細設定で利用可能 — デフォルトはオフ。",
  p2_h: "ローカルファイルのみ",
  p2_p: "ファイルは yt-dlp からあなたが選んだフォルダへ直接保存されます。リモートサーバーを経由しません。",
  p3_h: "匿名テレメトリー",
  p3_p: "OpenPanel による匿名テレメトリー — インストールごとのランダム ID は起動数、バージョン、OS、クラッシュの集計にだけ使われます。URL、タイトル、ファイルパス、アカウント情報、フィンガープリンティング、個人データはありません。ダウンロード、履歴、ファイルはすべてあなたのデバイス内に留まります。",
  p4_h: "広告なし、アップセルなし",
  p4_p: "MIT ライセンス。プレミアム層なし、機能ゲートなし、バナー広告なし、ダークパターンなし。全パイプラインが yt-dlp + ffmpeg でローカル実行。",

  install_eyebrow: "インストール",
  install_h2: "チャンネルを選んでください。",
  install_sub:
    "直接ダウンロード、または主要パッケージマネージャー経由 — すべてリリースごとに自動更新。",
  badge_windows: "Windows",
  badge_macos: "macOS",
  badge_linux: "Linux",
  badge_all: "全 OS",
  winget_desc: "Windows 10/11 推奨。システムと一緒に自動更新。",
  scoop_desc: "Scoop バケット経由のポータブルインストール。管理者権限不要。",
  brew_desc: "Cask を tap してワンコマンドでインストール。ユニバーサルバイナリ (Intel + Apple Silicon)。",
  flatpak_h: "Flatpak",
  flatpak_desc: "サンドボックスでインストール。Releases から .flatpak バンドルをダウンロードし、ワンコマンドでインストール。Flathub のセットアップは不要。",
  direct_h: "直接ダウンロード",
  direct_desc: "NSIS インストーラー、ポータブル .exe、.dmg、.AppImage、.flatpak — GitHub Releases から直接。",
  direct_btn: "Releases を開く →",
  copy_label: "コピー",
  copied_label: "コピーしました！",

  footer_made_by: "MIT ライセンス · 作者:",
  footer_github: "GitHub",
  footer_issues: "Issues",
  footer_releases: "Releases",
  footer_languages_label: "言語:",

  faq_eyebrow: "FAQ",
  faq_h2: "よくある質問",
  faq_q1: "どの画質でダウンロードできますか？",
  faq_a1:
    "YouTube と他の対応サイトが提供するものなら何でも対応しています。4K UHD（2160p）、1440p QHD、1080p Full HD、720p、480p、360p、そして音声のみ。高フレームレートのストリーム（60 fps、120 fps）や HDR コンテンツもそのまま保持されます。Arroxy は利用可能な形式をすべて表示し、音声のみのダウンロードでは MP3、M4A/AAC、Opus、WAV への変換も選べます。",
  faq_q2: "本当に無料ですか？",
  faq_a2: "はい。MIT ライセンス。プレミアム版や機能ロックはありません。",
  faq_q3: "Arroxy は何カ国語に対応していますか？",
  faq_a3:
    "21 言語に標準対応：English、Español（スペイン語）、Deutsch（ドイツ語）、Français（フランス語）、日本語、中文（中国語）、Русский（ロシア語）、Українська（ウクライナ語）、हिन्दी（ヒンディー語）、Afaan Oromoo、Kiswahili、O'zbekcha（ウズベク語）、Tiếng Việt（ベトナム語）、አማርኛ（アムハラ語）、العربية（アラビア語）、اردو（ウルドゥー語）、پښتو（パシュトー語）、বাংলা（ベンガル語）、မြန်မာဘာသာ（ビルマ語）、Ελληνικά（ギリシャ語）、Српски（セルビア語）。Arroxy は初回起動時に OS の言語を自動検出し、ツールバーの言語選択でいつでも切り替え可能です。翻訳は src/shared/i18n/locales/ 内の素の TypeScript オブジェクトとして管理されているので、GitHub で PR を開いて貢献できます。",
  faq_q4: "何かインストールが必要ですか？",
  faq_a4:
    "いいえ。yt-dlp は初回起動時に自動ダウンロードされてマシンにキャッシュされます。ffmpeg と ffprobe はアプリに同梱されています。それ以降は追加のセットアップ不要です。",
  faq_q5: "YouTube が変更したら使えなくなりますか？",
  faq_a5:
    "はい — Arroxy には 2 段階の耐性があります。第一に、yt-dlp はオープンソースで最も活発に保守されているツールの 1 つで、YouTube を含む対応サイトの変更から数時間以内に更新されます。第二に、Arroxy は Cookie や Google アカウントに一切依存しないため、失効するセッションも、ローテートする資格情報もありません。この組み合わせにより、ブラウザの Cookie に依存するツールよりも遥かに安定しています。",
  faq_q6: "プレイリストはダウンロードできますか？",
  faq_a6:
    "はい。プレイリスト URL を貼り付け、すべての動画または必要な動画だけを選ぶと、Arroxy がひとつのバッチとしてキューに入れます。チャンネル全体の一括ダウンロードはまだ未対応です。",
  faq_q7: "YouTube アカウントや Cookie が必要ですか？",
  faq_a7:
    "デフォルトでは不要です — Arroxy はアカウント、ログイン、Cookie のエクスポートなしで動作します。年齢制限付きやメンバー限定コンテンツなど、認証が必要なコンテンツ向けに、詳細設定でオプションの Cookie サポート（ファイルまたはブラウザインポート）が利用可能です。デフォルトはオフです。有効にする場合、yt-dlp の公式ドキュメントは Cookie ベースの自動化が Google アカウントにフラグを立てる可能性があると警告しているため、使い捨てアカウントを使うのが安全です。",
  faq_q8:
    'macOS で「アプリが壊れている」「開けません」と表示される — どうすれば？',
  faq_a8:
    "これは macOS Gatekeeper が未署名アプリをブロックしているもので、実際に壊れているわけではありません。README に macOS 初回起動のステップごとの手順があります。",
  faq_q9: "これは合法ですか？",
  faq_a9:
    "個人使用のための動画ダウンロードは、ほとんどの法域で一般的に容認されています。YouTube の利用規約および所在地の法律の遵守はあなたの責任です。",

  f13_h: "YouTube + 2000 サイト",
  f13_p: "YouTube 以外にも、Arroxy は yt-dlp が対応する 2000 以上のサイトからダウンロードできます — Vimeo、Twitch、Twitter/X、TikTok、SoundCloud、Bandcamp、Bilibili、BBC iPlayer、archive.org など多数。音声のみと字幕は YouTube に限らず、すべての対応サイトで機能します。",
};
