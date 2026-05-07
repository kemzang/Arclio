<div align="center">
  <img src="src/renderer/src/assets/App-icon-HQ.png" alt="Μασκότ Arroxy" width="180" />

# Arroxy — Δωρεάν Ανοιχτού Κώδικα Λήψη YouTube για Windows, macOS & Linux

**4K · 1080p60 · HDR · Playlists · MP3 · Shorts · Subtitles · SponsorBlock**

**Διαβάστε στα:** [Afaan Oromoo](README.om.md) · [Deutsch](README.de.md) · [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Kiswahili](README.sw.md) · [O'zbekcha](README.uz.md) · [Tiếng Việt](README.vi.md) · [አማርኛ](README.am.md) · [العربية](README.ar.md) · [اردو](README.ur.md) · [پښتو](README.ps.md) · [বাংলা](README.bn.md) · [हिन्दी](README.hi.md) · [မြန်မာဘာသာ](README.my.md) · **Ελληνικά** · [Русский](README.ru.md) · [Српски](README.sr.md) · [Українська](README.uk.md) · [中文](README.zh.md) · [日本語](README.ja.md)

[![Έκδοση](https://img.shields.io/github/v/release/antonio-orionus/Arroxy?label=Release&color=blueviolet)](https://github.com/antonio-orionus/Arroxy/releases/latest) [![Build](https://img.shields.io/github/actions/workflow/status/antonio-orionus/Arroxy/release.yml?label=Build)](https://github.com/antonio-orionus/Arroxy/actions/workflows/release.yml) [![Ιστότοπος](https://img.shields.io/badge/website-arroxy.orionus.dev-blueviolet)](https://arroxy.orionus.dev/) ![Άδεια](https://img.shields.io/badge/license-MIT-green) ![Πλατφόρμες](https://img.shields.io/badge/platform-cross--platform-1f2937?logo=github&logoColor=white) ![Γλώσσες](https://img.shields.io/badge/i18n-21_languages-blue)

Κατεβάστε οποιοδήποτε βίντεο YouTube, Short ή ηχητικό κομμάτι σε αρχική ποιότητα — έως 4K HDR στα 60 fps, ή ως MP3 / AAC / Opus. Εκτελείται τοπικά σε Windows, macOS και Linux. **Χωρίς διαφημίσεις, χωρίς σύνδεση, χωρίς cookies προγράμματος περιήγησης, χωρίς συνδεδεμένο λογαριασμό Google.**

[**↓ Λήψη Τελευταίας Έκδοσης**](../../releases/latest) &nbsp;·&nbsp; [**Ιστότοπος**](https://arroxy.orionus.dev/) &nbsp;·&nbsp; [Windows](#download) · [macOS](#download) · [Linux](#download)

<img src="build/demo.gif" alt="Demo του Arroxy" width="720" />

Αν το Arroxy σας εξοικονομεί χρόνο, ένα ⭐ βοηθά άλλους να το βρουν.

</div>

---

## Περιεχόμενα

- [Γιατί Arroxy](#why)
- [Χωρίς cookies, χωρίς συνδέσεις, χωρίς σύνδεση λογαριασμού](#no-cookies)
- [Χαρακτηριστικά](#features)
- [Λήψη](#download)
- [Απόρρητο](#privacy)
- [Συχνές Ερωτήσεις](#faq)
- [Χάρτης Πορείας](#roadmap)
- [Κατασκευάστηκε με](#tech)

---

## <a id="why"></a>Γιατί Arroxy

Σύγκριση δίπλα-δίπλα με τις πιο κοινές εναλλακτικές λύσεις:

|            | Arroxy | 4K Video Downloader | JDownloader | Y2Mate / online converters | Browser extensions |
| ---------- | :----: | :-----------------: | :---------: | :------------------------: | :----------------: |
| Δωρεάν, χωρίς premium επίπεδο |   ✅   |         ⚠️          |     ✅      |             ⚠️             |         ⚠️         |
| Ανοιχτού κώδικα |   ✅   |         ❌          |     ❌      |             ❌             |         ⚠️         |
| Μόνο τοπική επεξεργασία |   ✅   |         ✅          |     ✅      |             ❌             |         ✅         |
| Χωρίς σύνδεση ή εξαγωγή cookies |   ✅   |         ⚠️          |     ⚠️      |             ⚠️             |         ✅         |
| Χωρίς όρια χρήσης |   ✅   |         ⚠️          |     ✅      |             🚫             |         ⚠️         |
| Εφαρμογή επιφάνειας εργασίας για πολλαπλές πλατφόρμες |   ✅   |         ✅          |     ✅      |            N/A             |         ❌         |
| Υπότιτλοι + SponsorBlock |   ✅   |         ⚠️          |     ❌      |             ❌             |         ❌         |

Το Arroxy κατασκευάστηκε για ένα πράγμα: επικολλήστε ένα URL, αποκτήστε ένα καθαρό τοπικό αρχείο. Χωρίς λογαριασμούς, χωρίς upsells, χωρίς συλλογή δεδομένων.

---

## <a id="no-cookies"></a>Χωρίς cookies, χωρίς συνδέσεις, χωρίς σύνδεση λογαριασμού

Αυτός είναι ο πιο συνηθισμένος λόγος που σπάνε οι εφαρμογές λήψης YouTube για επιφάνεια εργασίας — και ο κύριος λόγος που υπάρχει το Arroxy.

Όταν το YouTube ενημερώνει τον εντοπισμό bot, τα περισσότερα εργαλεία σας λένε να εξάγετε τα cookies YouTube του προγράμματος περιήγησής σας ως λύση. Δύο προβλήματα με αυτό:

1. Οι εξαγόμενες συνεδρίες συνήθως λήγουν εντός ~30 λεπτών, οπότε επανεξάγετε συνεχώς.
2. Η ίδια η τεκμηρίωση του yt-dlp [προειδοποιεί ότι η αυτοματοποίηση με βάση cookies μπορεί να επισημάνει τον λογαριασμό σας Google](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies).

**Το Arroxy δεν ζητά ποτέ cookies, συνδέσεις ή οποιοδήποτε διαπιστευτήριο.** Χρησιμοποιεί μόνο τα δημόσια tokens που παρέχει το YouTube σε οποιοδήποτε πρόγραμμα περιήγησης. Τίποτα δεν συνδέεται με την ταυτότητά σας στο Google, τίποτα δεν λήγει, τίποτα δεν χρειάζεται εναλλαγή.

---

## <a id="features"></a>Χαρακτηριστικά

### Ποιότητα & μορφές

- Έως **4K UHD (2160p)**, 1440p, 1080p, 720p, 480p, 360p
- **Υψηλός ρυθμός καρέ** διατηρείται ως έχει — 60 fps, 120 fps, HDR
- **Μόνο ήχος** σε MP3, M4A/AAC, Opus ή WAV
- Γρήγορες προεπιλογές: *Καλύτερη ποιότητα* · *Ισορροπημένη* · *Μικρό αρχείο*

### Απόρρητο & έλεγχος

- 100% τοπική επεξεργασία — οι λήψεις πηγαίνουν απευθείας από το YouTube στον δίσκο σας
- Χωρίς σύνδεση, χωρίς cookies, χωρίς συνδεδεμένο λογαριασμό Google
- Αρχεία αποθηκευμένα απευθείας στον φάκελο που επιλέγετε

### Ροή εργασίας

- **Επικόλλησε οποιοδήποτε URL YouTube** — υποστηρίζονται βίντεο, Shorts και playlists· κατέβασε ολόκληρη την playlist ή διάλεξε πρώτα συγκεκριμένα βίντεο
- **Ουρά πολλαπλών λήψεων** — παρακολούθηση αρκετών λήψεων παράλληλα
- **Παρακολούθηση πρόχειρου** — αντιγράψτε έναν σύνδεσμο YouTube και το Arroxy συμπληρώνει αυτόματα το URL όταν εστιάζετε ξανά στην εφαρμογή (εναλλαγή στις Σύνθετες ρυθμίσεις)
- **Αυτόματη εκκαθάριση URL** — αφαιρεί παραμέτρους παρακολούθησης (`si`, `pp`, `utm_*`, `fbclid`, `gclid`) και ξετυλίγει συνδέσμους `youtube.com/redirect`
- **Λειτουργία δίσκου** — το κλείσιμο του παραθύρου διατηρεί τις λήψεις στο παρασκήνιο
- **21 γλώσσες** — αυτόματη ανίχνευση τοπικής ρύθμισης συστήματος, εναλλαγή οποιαδήποτε στιγμή

### Υπότιτλοι & μετεπεξεργασία

- **Υπότιτλοι** σε SRT, VTT ή ASS — χειροκίνητοι ή αυτόματα δημιουργημένοι, σε οποιαδήποτε διαθέσιμη γλώσσα
- Αποθήκευση δίπλα στο βίντεο, ενσωμάτωση σε `.mkv`, ή οργάνωση σε υποφάκελο `Subtitles/`
- **SponsorBlock** — παράλειψη ή επισήμανση κεφαλαίου για χορηγούς, εισαγωγές, εξόδους, αυτο-προωθήσεις
- **Ενσωματωμένα μεταδεδομένα** — τίτλος, ημερομηνία μεταφόρτωσης, κανάλι, περιγραφή, μικρογραφία και δείκτες κεφαλαίων γραμμένα στο αρχείο

<div align="center">
  <img src="build/Main-screenshot.png" width="48%" alt="Επικόλληση URL" />
  <img src="build/Choosing-format-screenshot.png" width="48%" alt="Επιλογή ποιότητας" />
  <br/>
  <img src="build/Choosing-destination-screenshot.png" width="48%" alt="Επιλογή τοποθεσίας αποθήκευσης" />
  <img src="build/Downloading-in-parallel-screenshot.png" width="48%" alt="Ουρά λήψεων σε δράση" />
  <br/>
  <img src="build/Subtitles-screenshot.png" width="48%" alt="Επιλογή γλώσσας και μορφής υποτίτλων" />
</div>

---

## <a id="download"></a>Λήψη

| Πλατφόρμα | Μορφή   |
| ------------------- | ------------------- |
| Windows             | Πρόγραμμα εγκατάστασης (NSIS) ή Φορητό `.exe`   |
| macOS               | `.dmg` (Intel + Apple Silicon)   |
| Linux               | `.AppImage` ή `.flatpak` (σε sandbox) |

[**Αποκτήστε την τελευταία έκδοση →**](../../releases/latest)

### Εγκατάσταση μέσω διαχειριστή πακέτων

| Κανάλι | Εντολή                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Winget             | `winget install AntonioOrionus.Arroxy`                                                            |
| Scoop              | `scoop bucket add arroxy https://github.com/antonio-orionus/scoop-bucket && scoop install arroxy` |
| Homebrew           | `brew tap antonio-orionus/arroxy && brew install --cask arroxy`                                   |

<details>
<summary><strong>Windows: Πρόγραμμα εγκατάστασης vs Φορητό</strong></summary>

|               | NSIS Installer | Φορητό `.exe` |
| ------------- | :----------------------: | :---------------------: |
| Απαιτείται εγκατάσταση | Ναι  | Όχι — εκτέλεση από οπουδήποτε  |
| Αυτόματες ενημερώσεις | ✅ εντός εφαρμογής  | ❌ χειροκίνητη λήψη  |
| Ταχύτητα εκκίνησης | ✅ ταχύτερη  | ⚠️ πιο αργή κρύα εκκίνηση  |
| Προσθήκη στο μενού Έναρξης |            ✅            |           ❌            |
| Εύκολη απεγκατάσταση |            ✅            | ❌ διαγράψτε το αρχείο  |

**Σύσταση:** χρησιμοποιήστε το πρόγραμμα εγκατάστασης NSIS για αυτόματες ενημερώσεις και ταχύτερη εκκίνηση. Χρησιμοποιήστε το φορητό `.exe` για επιλογή χωρίς εγκατάσταση και χωρίς μητρώο.

**Προειδοποίηση Windows SmartScreen**

Κατά την πρώτη εκκίνηση μπορεί να δείτε **"Windows protected your PC"** ή **"Unknown publisher."** Αυτό ισχύει τόσο για το `Arroxy-Setup-*.exe` όσο και για το `Arroxy-Portable-*.exe`. Το Arroxy είναι δωρεάν και ανοιχτού κώδικα και τα Windows builds δεν είναι υπογεγραμμένα με επί πληρωμή πιστοποιητικό, γι' αυτό το SmartScreen τα επισημαίνει. Αυτό **δεν** σημαίνει αυτόματα ότι το Arroxy είναι επικίνδυνο. Για να συνεχίσετε:

1. Κάντε κλικ στο **More info**.
2. Κάντε κλικ στο **Run anyway**.

> Κατεβάστε το Arroxy μόνο από την επίσημη σελίδα GitHub Releases. Αν το αρχείο προήλθε από άλλη ιστοσελίδα ή σας το έστειλε κάποιος, διαγράψτε το και κατεβάστε αντίγραφο από την επίσημη πηγή. Ο πηγαίος κώδικας είναι δημόσιος, οπότε μπορείτε να τον ελέγξετε ή να φτιάξετε το Arroxy μόνοι σας αν προτιμάτε.

</details>

<details>
<summary><strong>Πρώτη εκκίνηση στο macOS</strong></summary>

Το Arroxy δεν έχει ακόμα υπογραφεί κώδικα, οπότε το macOS Gatekeeper θα σας προειδοποιήσει κατά την πρώτη εκκίνηση. Αυτό είναι αναμενόμενο — δεν αποτελεί ένδειξη βλάβης.

**Μέθοδος Ρυθμίσεων Συστήματος (προτεινόμενη):**

1. Κάντε δεξί κλικ στο εικονίδιο εφαρμογής Arroxy και επιλέξτε **Άνοιγμα**.
2. Εμφανίζεται το παράθυρο προειδοποίησης — κάντε κλικ στο **Άκυρο** (μην κάνετε κλικ στο *Μετακίνηση στον Κάδο*).
3. Ανοίξτε **Ρυθμίσεις Συστήματος → Απόρρητο & Ασφάλεια**.
4. Μετακινηθείτε στην ενότητα **Ασφάλεια**. Θα δείτε *"Το Arroxy αποκλείστηκε από χρήση επειδή δεν προέρχεται από αναγνωρισμένο προγραμματιστή."*
5. Κάντε κλικ στο **Άνοιγμα Ούτως ή Άλλως** και επιβεβαιώστε με τον κωδικό σας ή το Touch ID.

Μετά το βήμα 5, το Arroxy ανοίγει κανονικά και η προειδοποίηση δεν εμφανίζεται ξανά.

**Μέθοδος Terminal (για προχωρημένους):**

```bash
xattr -dr com.apple.quarantine /Applications/Arroxy.app
```

> Τα builds για macOS παράγονται μέσω CI σε Apple Silicon και Intel runners. Αν αντιμετωπίσετε προβλήματα, παρακαλώ [ανοίξτε ένα ζήτημα](../../issues) — τα σχόλια χρηστών macOS διαμορφώνουν ενεργά τον κύκλο δοκιμών macOS.

</details>

<details>
<summary><strong>Πρώτη εκκίνηση στο Linux</strong></summary>

Τα AppImage εκτελούνται απευθείας — χωρίς εγκατάσταση. Απλά πρέπει να επισημάνετε το αρχείο ως εκτελέσιμο.

**Διαχειριστής αρχείων:** δεξί κλικ στο `.AppImage` → **Ιδιότητες** → **Δικαιώματα** → ενεργοποιήστε **Να επιτρέπεται η εκτέλεση αρχείου ως πρόγραμμα**, στη συνέχεια διπλό κλικ.

**Terminal:**

```bash
chmod +x Arroxy-*.AppImage
./Arroxy-*.AppImage
```

Αν η εκκίνηση εξακολουθεί να αποτυγχάνει, μπορεί να λείπει το FUSE:

```bash
# Ubuntu / Debian
sudo apt install -y libfuse2

# Fedora
sudo dnf install -y fuse-libs

# Arch
sudo pacman -S fuse2
```

**Flatpak (εναλλακτικό σε sandbox):** κατεβάστε το `Arroxy-*.flatpak` από την ίδια σελίδα έκδοσης.

```bash
flatpak install --user Arroxy-*.flatpak
flatpak run io.github.antonio_orionus.Arroxy
```

</details>

---

## <a id="privacy"></a>Απόρρητο

Οι λήψεις γίνονται απευθείας μέσω [yt-dlp](https://github.com/yt-dlp/yt-dlp) από το YouTube στον φάκελο που επιλέγετε — τίποτα δεν δρομολογείται μέσω τρίτου διακομιστή. Το ιστορικό παρακολούθησης, το ιστορικό λήψεων, τα URL και τα περιεχόμενα αρχείων παραμένουν στη συσκευή σας.

Το Arroxy στέλνει ανώνυμη, συγκεντρωτική τηλεμετρία μέσω [OpenPanel](https://openpanel.dev) — μόνο ό,τι χρειάζεται για εκκινήσεις, OS, εκδόσεις εφαρμογής και σφάλματα. Χωρίς URLs, τίτλους βίντεο, διαδρομές αρχείων, στοιχεία λογαριασμού, fingerprinting ή προσωπικά δεδομένα. Το αναγνωριστικό ανά εγκατάσταση είναι τυχαίο και δεν συνδέεται με την ταυτότητά σας. Μπορείτε να το απενεργοποιήσετε στις Ρυθμίσεις.

---

## <a id="faq"></a>Συχνές Ερωτήσεις

**Είναι πραγματικά δωρεάν;**
Ναι — άδεια MIT, χωρίς premium επίπεδο, χωρίς περιορισμούς λειτουργιών.

**Ποιες ποιότητες βίντεο μπορώ να κατεβάσω;**
Ό,τι παρέχει το YouTube: 4K UHD (2160p), 1440p, 1080p, 720p, 480p, 360p, καθώς και μόνο ήχο. Ροές 60 fps, 120 fps και HDR διατηρούνται ως έχουν.

**Μπορώ να εξάγω μόνο τον ήχο ως MP3;**
Ναι. Επίλεξε *μόνο ήχος* στο μενού μορφής και μετά MP3, M4A/AAC, Opus ή WAV.

**Χρειάζομαι λογαριασμό YouTube ή cookies;**
Όχι. Το Arroxy χρησιμοποιεί μόνο τα δημόσια tokens που παρέχει το YouTube σε οποιοδήποτε πρόγραμμα περιήγησης. Χωρίς cookies, χωρίς σύνδεση, χωρίς αποθηκευμένα διαπιστευτήρια. Δείτε [Χωρίς cookies, χωρίς συνδέσεις, χωρίς σύνδεση λογαριασμού](#no-cookies) για το γιατί αυτό είναι σημαντικό.

**Θα συνεχίσει να λειτουργεί όταν το YouTube αλλάξει κάτι;**
Δύο επίπεδα ανθεκτικότητας: το yt-dlp ενημερώνεται εντός ωρών από αλλαγές του YouTube, και το Arroxy δεν βασίζεται σε cookies που λήγουν κάθε ~30 λεπτά. Αυτό το κάνει αισθητά πιο σταθερό από εργαλεία που εξαρτώνται από εξαγόμενες συνεδρίες προγράμματος περιήγησης.

**Σε ποιες γλώσσες είναι διαθέσιμο το Arroxy;**
Είκοσι μία, εκτός συσκευής: English, Español (ισπανικά), Deutsch (γερμανικά), Français (γαλλικά), 日本語 (ιαπωνικά), 中文 (κινέζικα), Русский (ρωσικά), Українська (ουκρανικά), हिन्दी (χίντι), Afaan Oromoo (ορόμο), Kiswahili (σουαχίλι), O'zbekcha (ουζμπεκικά), Tiếng Việt (βιετναμέζικα), አማርኛ (αμχαρικά), العربية (αραβικά), اردو (ούρντου), پښتو (παστό), বাংলা (βεγγαλικά), မြန်မာဘာသာ (βιρμανικά), Ελληνικά και Српски (σερβικά). Το Arroxy εντοπίζει αυτόματα τη γλώσσα του λειτουργικού σας συστήματος κατά την πρώτη εκκίνηση και μπορείτε να αλλάξετε ανά πάσα στιγμή από τον επιλογέα γλώσσας στη γραμμή εργαλείων. Οι μεταφράσεις βρίσκονται ως απλά TypeScript αντικείμενα στο src/shared/i18n/locales/ — ανοίξτε PR στο GitHub για να συνεισφέρετε.

**Χρειάζεται να εγκαταστήσω κάτι άλλο;**
Όχι. Το yt-dlp κατεβαίνει αυτόματα στην πρώτη εκκίνηση και αποθηκεύεται στον υπολογιστή σας· το ffmpeg και το ffprobe περιλαμβάνονται στην εφαρμογή. Μετά από αυτό δεν απαιτείται καμία επιπλέον ρύθμιση.

**Μπορώ να κατεβάσω λίστες αναπαραγωγής ή ολόκληρα κανάλια;**
Ναι, για playlists: επικόλλησε το URL μιας playlist και μετά βάλε στην ουρά ολόκληρη τη λίστα ή μόνο τα βίντεο που επιλέγεις. Η μαζική λήψη ολόκληρων καναλιών δεν υποστηρίζεται ακόμη.

**Το macOS λέει "η εφαρμογή είναι κατεστραμμένη" — τι να κάνω;**
Αυτό είναι το macOS Gatekeeper που αποκλείει μια μη υπογεγραμμένη εφαρμογή, όχι πραγματική βλάβη. Δείτε την ενότητα [πρώτη εκκίνηση στο macOS](#download) για τη λύση.

**Είναι νόμιμη η λήψη βίντεο YouTube;**
Για προσωπική, ιδιωτική χρήση γίνεται γενικά αποδεκτή στις περισσότερες δικαιοδοσίες. Είστε υπεύθυνοι για τη συμμόρφωση με τους [Όρους Χρήσης](https://www.youtube.com/t/terms) του YouTube και τους τοπικούς νόμους πνευματικής ιδιοκτησίας.

---

## <a id="roadmap"></a>Χάρτης Πορείας

Επερχόμενα — περίπου με σειρά προτεραιότητας:

| Λειτουργία    | Περιγραφή    |
| ---------------- | ---------------- |
| **Εισαγωγή URL σε παρτίδα** | Επικολλήστε πολλαπλά URL ταυτόχρονα και εκτελέστε τα μαζί |
| **Προσαρμοσμένα πρότυπα ονόματος αρχείου** | Ονομάστε αρχεία με βάση τίτλο, αναρτητή, ημερομηνία, ανάλυση — με ζωντανή προεπισκόπηση |
| **Προγραμματισμένες λήψεις** | Ξεκινήστε μια ουρά σε καθορισμένη ώρα (νυχτερινές εκτελέσεις) |
| **Όρια ταχύτητας** | Περιορισμός εύρους ζώνης ώστε οι λήψεις να μην κορεστούν τη σύνδεσή σας |
| **Περικοπή κλιπ** | Λήψη μόνο ενός τμήματος με χρόνο έναρξης/λήξης |

Έχετε κάποια λειτουργία στο μυαλό σας; [Ανοίξτε ένα αίτημα](../../issues) — η συμβολή της κοινότητας διαμορφώνει τις προτεραιότητες.

---

## <a id="tech"></a>Κατασκευάστηκε με

<details>
<summary><strong>Στοίβα τεχνολογιών</strong></summary>

- **Electron** — cross-platform desktop shell
- **React 19** + **TypeScript** — UI
- **Tailwind CSS v4** — styling
- **Zustand** — διαχείριση κατάστασης
- **yt-dlp** + **ffmpeg** — μηχανή λήψης και mux (το yt-dlp λαμβάνεται στο runtime· τα ffmpeg/ffprobe περιλαμβάνονται στο build)
- **Vite** + **electron-vite** — build tooling
- **Vitest** + **Playwright** — unit και end-to-end tests

</details>

<details>
<summary><strong>Κατασκευή από πηγαίο κώδικα</strong></summary>

### Προαπαιτούμενα — όλες οι πλατφόρμες

| Εργαλείο | Έκδοση  | Εγκατάσταση |
| -------- | ------- | ----------- |
| Git      | οποιαδήποτε | [git-scm.com](https://git-scm.com) |
| Bun      | τελευταία   | δείτε παρακάτω ανά λειτουργικό |

### Windows

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Δεν απαιτούνται εγγενή εργαλεία κατασκευής — το έργο δεν έχει εγγενή πρόσθετα Node.

### macOS

```bash
xcode-select --install
curl -fsSL https://bun.sh/install | bash
```

### Linux (Ubuntu / Debian)

```bash
curl -fsSL https://bun.sh/install | bash

# Electron runtime deps
sudo apt install -y libgtk-3-0 libnss3 libasound2t64

# E2E tests only (Electron needs a display)
sudo apt install -y xvfb
```

### Κλωνοποίηση & εκτέλεση

```bash
git clone https://github.com/antonio-orionus/Arroxy
cd arroxy
bun install
bun run dev          # hot-reload dev build
```

### Κατασκευή διανεμήσιμου πακέτου

```bash
bun run build        # typecheck + compile
bun run dist         # package for current OS
bun run dist:win     # cross-compile Windows portable exe
```

> Το yt-dlp λαμβάνεται από το GitHub στην πρώτη εκκίνηση και αποθηκεύεται στον φάκελο δεδομένων της εφαρμογής. Τα ffmpeg και ffprobe περιλαμβάνονται σε κάθε έκδοση του Arroxy.

</details>

---

## <a id="troubleshooting"></a>Troubleshooting

### App won't open / no window appears

The Arroxy process starts but no window shows up. Most often this is a GPU driver hang during startup. Try, in order:

**1. Check the log.** It records startup, GPU info, and any crash. Path:

| Platform | Path                                              |
| -------- | ------------------------------------------------- |
| Windows  | `%APPDATA%\Arroxy\logs\main.log`                  |
| macOS    | `~/Library/Logs/Arroxy/main.log`                  |
| Linux    | `~/.config/Arroxy/logs/main.log`                  |

**2. Launch with hardware acceleration disabled.** Open a terminal / Command Prompt and run the executable with a flag:

```bash
# Windows (Portable) — PowerShell, run from the folder containing the exe
.\Arroxy-Portable-<version>.exe --disable-gpu

# Windows (Portable) — Command Prompt (cmd.exe), from the same folder
Arroxy-Portable-<version>.exe --disable-gpu

# Windows (Installed) — works in both PowerShell and cmd.exe
"%LOCALAPPDATA%\Programs\Arroxy\Arroxy.exe" --disable-gpu

# macOS
/Applications/Arroxy.app/Contents/MacOS/Arroxy --disable-gpu

# Linux (AppImage)
./Arroxy-*.AppImage --disable-gpu
```

If that works, the GPU/driver is the cause. Make the change permanent (next step).

**3. Persist the flag via `argv.json`.** Create the file at:

| Platform | Path                                          |
| -------- | --------------------------------------------- |
| Windows  | `%APPDATA%\Arroxy\argv.json`                  |
| macOS    | `~/Library/Application Support/Arroxy/argv.json` |
| Linux    | `~/.config/Arroxy/argv.json`                  |

With contents:

```json
{ "disable-hardware-acceleration": true }
```

Arroxy reads this before opening any window, so it works even when the window never appeared.

**4. Other flags worth trying** (combine if needed): `--disable-software-rasterizer`, `--disable-gpu-sandbox`, `--in-process-gpu`.

**5. Stale window position.** If the window may be opening off-screen (multi-monitor change since last run), delete `<userData>\window-state.json` and relaunch.

**6. Still stuck?** Open an issue with: OS version, the contents of `main.log`, and any output from running with `--enable-logging --v=1`.

---

## Όροι χρήσης

Το Arroxy είναι εργαλείο αποκλειστικά για προσωπική, ιδιωτική χρήση. Είστε αποκλειστικά υπεύθυνοι για τη διασφάλιση ότι οι λήψεις σας συμμορφώνονται με τους [Όρους Χρήσης](https://www.youtube.com/t/terms) του YouTube και τους νόμους πνευματικής ιδιοκτησίας της δικαιοδοσίας σας. Μην χρησιμοποιείτε το Arroxy για λήψη, αναπαραγωγή ή διανομή περιεχομένου που δεν έχετε δικαίωμα χρήσης. Οι προγραμματιστές δεν ευθύνονται για οποιαδήποτε κακή χρήση.

<div align="center">
  <sub>MIT License · Δημιουργήθηκε με φροντίδα από <a href="https://x.com/OrionusAI">@OrionusAI</a></sub>
</div>
