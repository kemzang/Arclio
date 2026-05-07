<div align="center">
  <img src="src/renderer/src/assets/App-icon-HQ.png" alt="Mascotte Arroxy" width="180" />

# Arroxy — Téléchargeur YouTube gratuit et open source pour Windows, macOS & Linux

**4K · 1080p60 · HDR · Playlists · MP3 · Shorts · Subtitles · SponsorBlock**

**Lire en :** [Afaan Oromoo](README.om.md) · [Deutsch](README.de.md) · [English](README.md) · [Español](README.es.md) · **Français** · [Kiswahili](README.sw.md) · [O'zbekcha](README.uz.md) · [Tiếng Việt](README.vi.md) · [አማርኛ](README.am.md) · [العربية](README.ar.md) · [اردو](README.ur.md) · [پښتو](README.ps.md) · [বাংলা](README.bn.md) · [हिन्दी](README.hi.md) · [မြန်မာဘာသာ](README.my.md) · [Ελληνικά](README.el.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Українська](README.uk.md) · [中文](README.zh.md) · [日本語](README.ja.md)

[![Version](https://img.shields.io/github/v/release/antonio-orionus/Arroxy?label=Release&color=blueviolet)](https://github.com/antonio-orionus/Arroxy/releases/latest) [![Build](https://img.shields.io/github/actions/workflow/status/antonio-orionus/Arroxy/release.yml?label=Build)](https://github.com/antonio-orionus/Arroxy/actions/workflows/release.yml) [![Site web](https://img.shields.io/badge/website-arroxy.orionus.dev-blueviolet)](https://arroxy.orionus.dev/) ![Licence](https://img.shields.io/badge/license-MIT-green) ![Plateformes](https://img.shields.io/badge/platform-cross--platform-1f2937?logo=github&logoColor=white) ![Langues](https://img.shields.io/badge/i18n-21_languages-blue)

Télécharge n'importe quelle vidéo YouTube, Short ou piste audio en qualité originale — jusqu'à 4K HDR à 60 fps, ou en MP3 / AAC / Opus. Fonctionne en local sur Windows, macOS et Linux. **Pas de pub, pas de connexion, pas de cookies de navigateur, pas de compte Google lié.**

[**↓ Télécharger la dernière version**](../../releases/latest) &nbsp;·&nbsp; [**Site web**](https://arroxy.orionus.dev/) &nbsp;·&nbsp; [Windows](#download) · [macOS](#download) · [Linux](#download)

<img src="build/demo.gif" alt="Démo Arroxy" width="720" />

Si Arroxy te fait gagner du temps, une ⭐ aide les autres à le trouver.

</div>

> 🌐 Traduction assistée par IA. Le [README en anglais](README.md) fait foi. Tu vois une erreur ? [Les PRs sont les bienvenues](../../pulls).

---

## Sommaire

- [Pourquoi Arroxy](#why)
- [Pas de cookies, pas de connexion, pas de compte lié](#no-cookies)
- [Fonctionnalités](#features)
- [Téléchargement](#download)
- [Confidentialité](#privacy)
- [Questions fréquentes](#faq)
- [Feuille de route](#roadmap)
- [Construit avec](#tech)

---

## <a id="why"></a>Pourquoi Arroxy

Une comparaison côte à côte avec les alternatives les plus courantes :

|            | Arroxy | 4K Video Downloader | JDownloader | Y2Mate / online converters | Browser extensions |
| ---------- | :----: | :-----------------: | :---------: | :------------------------: | :----------------: |
| Gratuit, pas de niveau premium |   ✅   |         ⚠️          |     ✅      |             ⚠️             |         ⚠️         |
| Open source |   ✅   |         ❌          |     ❌      |             ❌             |         ⚠️         |
| Traitement 100 % local |   ✅   |         ✅          |     ✅      |             ❌             |         ✅         |
| Pas de connexion ni d'export de cookies |   ✅   |         ⚠️          |     ⚠️      |             ⚠️             |         ✅         |
| Pas de limites d'utilisation |   ✅   |         ⚠️          |     ✅      |             🚫             |         ⚠️         |
| Application de bureau multiplateforme |   ✅   |         ✅          |     ✅      |            N/A             |         ❌         |
| Sous-titres + SponsorBlock |   ✅   |         ⚠️          |     ❌      |             ❌             |         ❌         |

Arroxy est conçu pour une seule chose : coller une URL et obtenir un fichier local propre. Pas de comptes, pas d'upsell, pas de collecte de données.

---

## <a id="no-cookies"></a>Pas de cookies, pas de connexion, pas de compte lié

C'est la raison la plus fréquente pour laquelle les téléchargeurs YouTube de bureau tombent en panne — et la principale raison pour laquelle Arroxy existe.

Lorsque YouTube met à jour sa détection de bots, la plupart des outils te demandent d'exporter les cookies YouTube de ton navigateur comme contournement. Deux problèmes avec ça :

1. Les sessions exportées expirent généralement en ~30 minutes, donc tu dois les ré-exporter constamment.
2. La documentation de yt-dlp elle-même [prévient que l'automatisation à base de cookies peut signaler ton compte Google](https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies).

**Arroxy ne demande jamais de cookies, de connexion, ni d'identifiant.** Il utilise uniquement les tokens publics que YouTube sert à n'importe quel navigateur. Rien de lié à ton identité Google, rien qui expire, rien à faire tourner.

---

## <a id="features"></a>Fonctionnalités

### Qualité & formats

- Jusqu'à **4K UHD (2160p)**, 1440p, 1080p, 720p, 480p, 360p
- **Haut framerate** préservé tel quel — 60 fps, 120 fps, HDR
- **Audio seul** en MP3, M4A/AAC, Opus ou WAV
- Préréglages rapides : *Meilleure qualité* · *Équilibré* · *Petit fichier*

### Confidentialité & contrôle

- Traitement 100 % local — les téléchargements vont directement de YouTube à ton disque
- Pas de connexion, pas de cookies, pas de compte Google lié
- Fichiers enregistrés directement dans le dossier que tu choisis

### Flux de travail

- **Colle n'importe quelle URL YouTube** — vidéos, Shorts et playlists pris en charge ; télécharge toute la playlist ou choisis d'abord des vidéos précises
- **File de téléchargement multi** — suivi de plusieurs téléchargements en parallèle
- **Surveillance du presse-papiers** — copie un lien YouTube et Arroxy remplit automatiquement l'URL quand tu reviens sur l'app (désactivable dans les Paramètres avancés)
- **Nettoyage auto des URLs** — supprime les paramètres de tracking (`si`, `pp`, `utm_*`, `fbclid`, `gclid`) et dénoue les liens `youtube.com/redirect`
- **Mode tray** — fermer la fenêtre garde les téléchargements en cours en arrière-plan
- **21 langues** — détecte automatiquement la langue du système, modifiable à tout moment

### Sous-titres & post-traitement

- **Sous-titres** en SRT, VTT ou ASS — manuels ou auto-générés, dans toute langue disponible
- Enregistre à côté de la vidéo, intègre dans un `.mkv`, ou organise dans un sous-dossier `Subtitles/`
- **SponsorBlock** — passe ou marque les sponsors, intros, outros, autopromos en chapitres
- **Métadonnées intégrées** — titre, date de mise en ligne, chaîne, description, miniature et marqueurs de chapitres écrits dans le fichier

<div align="center">
  <img src="build/Main-screenshot.png" width="48%" alt="Coller une URL" />
  <img src="build/Choosing-format-screenshot.png" width="48%" alt="Choisir la qualité" />
  <br/>
  <img src="build/Choosing-destination-screenshot.png" width="48%" alt="Choisir où enregistrer" />
  <img src="build/Downloading-in-parallel-screenshot.png" width="48%" alt="File de téléchargement en action" />
  <br/>
  <img src="build/Subtitles-screenshot.png" width="48%" alt="Sélecteur de langue et de format pour les sous-titres" />
</div>

---

## <a id="download"></a>Téléchargement

| Plateforme | Format   |
| ------------------- | ------------------- |
| Windows             | Installeur (NSIS) ou `.exe` portable   |
| macOS               | `.dmg` (Intel + Apple Silicon)   |
| Linux               | `.AppImage` ou `.flatpak` (sandboxed) |

[**Récupère la dernière version →**](../../releases/latest)

### Installation via gestionnaire de paquets

| Canal | Commande                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Winget             | `winget install AntonioOrionus.Arroxy`                                                            |
| Scoop              | `scoop bucket add arroxy https://github.com/antonio-orionus/scoop-bucket && scoop install arroxy` |
| Homebrew           | `brew tap antonio-orionus/arroxy && brew install --cask arroxy`                                   |

<details>
<summary><strong>Windows : Installeur vs Portable</strong></summary>

|               | Installeur NSIS | `.exe` portable |
| ------------- | :----------------------: | :---------------------: |
| Installation requise | Oui  | Non — exécutable de partout  |
| Mises à jour automatiques | ✅ dans l'app  | ❌ téléchargement manuel  |
| Vitesse de démarrage | ✅ plus rapide  | ⚠️ démarrage à froid plus lent  |
| Ajouté au menu Démarrer |            ✅            |           ❌            |
| Désinstallation simple |            ✅            | ❌ supprime juste le fichier  |

**Recommandation :** utilise l'installeur NSIS pour les mises à jour automatiques et un démarrage plus rapide. Utilise le `.exe` portable pour une option sans installation ni registre.

**Avertissement Windows SmartScreen**

Au premier lancement, tu peux voir **"Windows protected your PC"** ou **"Unknown publisher."** Cela s'applique à la fois à `Arroxy-Setup-*.exe` et à `Arroxy-Portable-*.exe`. Arroxy est gratuit et open source, et les builds Windows ne sont pas signés avec un certificat payant, c'est pourquoi SmartScreen les signale. Cela ne signifie **pas** automatiquement qu'Arroxy est dangereux. Pour continuer :

1. Clique sur **More info**.
2. Clique sur **Run anyway**.

> Ne télécharge Arroxy que depuis la page officielle GitHub Releases. Si tu as obtenu le fichier depuis un autre site ou que quelqu'un te l'a envoyé, supprime-le et télécharge une copie fraîche depuis la source officielle. Le code source est public, tu peux donc l'inspecter ou compiler Arroxy toi-même si tu préfères.

</details>

<details>
<summary><strong>Premier lancement sur macOS</strong></summary>

Arroxy n'est pas encore signé, donc macOS Gatekeeper affichera un avertissement au premier lancement. C'est normal — ce n'est pas un signe d'endommagement.

**Méthode via Réglages Système (recommandé) :**

1. Clic droit sur l'icône de l'app Arroxy et sélectionne **Ouvrir**.
2. La boîte de dialogue d'avertissement apparaît — clique sur **Annuler** (ne clique pas sur *Mettre à la corbeille*).
3. Ouvre **Réglages Système → Confidentialité et sécurité**.
4. Descends jusqu'à la section **Sécurité**. Tu verras *"Arroxy a été bloqué car il ne provient pas d'un développeur identifié."*
5. Clique sur **Ouvrir quand même** et confirme avec ton mot de passe ou Touch ID.

Après l'étape 5, Arroxy s'ouvre normalement et l'avertissement ne réapparaît plus jamais.

**Méthode Terminal (avancé) :**

```bash
xattr -dr com.apple.quarantine /Applications/Arroxy.app
```

> Les builds macOS sont produits via CI sur des runners Apple Silicon et Intel. Si tu rencontres des problèmes, merci d'[ouvrir un issue](../../issues) — les retours des utilisateurs macOS orientent activement le cycle de test macOS.

</details>

<details>
<summary><strong>Premier lancement sur Linux</strong></summary>

Les AppImages s'exécutent directement — pas d'installation. Tu dois juste marquer le fichier comme exécutable.

**Gestionnaire de fichiers :** clic droit sur le `.AppImage` → **Propriétés** → **Permissions** → active **Autoriser l'exécution du fichier comme programme**, puis double-clique.

**Terminal :**

```bash
chmod +x Arroxy-*.AppImage
./Arroxy-*.AppImage
```

Si le lancement échoue encore, il te manque peut-être FUSE :

```bash
# Ubuntu / Debian
sudo apt install -y libfuse2

# Fedora
sudo dnf install -y fuse-libs

# Arch
sudo pacman -S fuse2
```

**Flatpak (alternative en sandbox) :** télécharge `Arroxy-*.flatpak` depuis la même page de release.

```bash
flatpak install --user Arroxy-*.flatpak
flatpak run io.github.antonio_orionus.Arroxy
```

</details>

---

## <a id="privacy"></a>Confidentialité

Les téléchargements sont récupérés directement via [yt-dlp](https://github.com/yt-dlp/yt-dlp) depuis YouTube vers le dossier que tu choisis — rien ne passe par un serveur tiers. L'historique de visionnage, l'historique de téléchargement, les URLs et le contenu des fichiers restent sur ton appareil.

Arroxy envoie une télémétrie anonyme et agrégée via [OpenPanel](https://openpanel.dev) — juste assez pour comprendre les lancements, OS, versions de l’app et crashs. Pas d’URLs, de titres de vidéos, de chemins de fichiers, d’infos de compte, de fingerprinting ni de données personnelles. L’identifiant par installation est aléatoire et non lié à ton identité. Tu peux te désabonner dans les Paramètres.

---

## <a id="faq"></a>Questions fréquentes

**C'est vraiment gratuit ?**
Oui — licence MIT, pas de niveau premium, pas de fonctions verrouillées.

**Quelles qualités de vidéo puis-je télécharger ?**
Tout ce que YouTube propose : 4K UHD (2160p), 1440p, 1080p, 720p, 480p, 360p, plus audio seul. Les flux 60 fps, 120 fps et HDR sont préservés tels quels.

**Puis-je extraire uniquement l'audio en MP3 ?**
Oui. Choisis *audio seul* dans le menu des formats puis MP3, M4A/AAC, Opus ou WAV.

**Ai-je besoin d'un compte YouTube ou de cookies ?**
Non. Arroxy utilise uniquement les tokens publics que YouTube sert à n'importe quel navigateur. Pas de cookies, pas de connexion, pas d'identifiants stockés. Voir [Pas de cookies, pas de connexion, pas de compte lié](#no-cookies) pour comprendre pourquoi c'est important.

**Ça continuera de fonctionner si YouTube change quelque chose ?**
Deux couches de résilience : yt-dlp est mis à jour dans les heures qui suivent les changements YouTube, et Arroxy ne dépend pas de cookies qui expirent toutes les ~30 minutes. Cela le rend notablement plus stable que les outils qui dépendent de sessions de navigateur exportées.

**Dans quelles langues Arroxy est-il disponible ?**
Vingt-et-une, prêtes à l'emploi : English, Español (espagnol), Deutsch (allemand), Français, 日本語 (japonais), 中文 (chinois), Русский (russe), Українська (ukrainien), हिन्दी (hindi), Afaan Oromoo, Kiswahili, O'zbekcha (ouzbek), Tiếng Việt (vietnamien), አማርኛ (amharique), العربية (arabe), اردو (ourdou), پښتو (pachto), বাংলা (bengali), မြန်မာဘာသာ (birman), Ελληνικά (grec) et Српски (serbe). Arroxy détecte la langue de ton système d'exploitation au premier lancement et tu peux changer à tout moment depuis le sélecteur de langue dans la barre d'outils. Les traductions sont de simples objets TypeScript dans src/shared/i18n/locales/ — ouvre une PR sur GitHub pour contribuer.

**Dois-je installer autre chose ?**
Non. yt-dlp est téléchargé automatiquement au premier lancement et mis en cache sur ta machine ; ffmpeg et ffprobe sont inclus dans l’app. Après ça, aucune configuration supplémentaire.

**Puis-je télécharger des playlists ou des chaînes entières ?**
Oui, pour les playlists : colle l'URL d'une playlist puis mets en file toute la liste ou seulement les vidéos que tu sélectionnes. Les téléchargements par lot de chaînes entières ne sont pas encore pris en charge.

**macOS dit "l'application est endommagée" — que faire ?**
C'est Gatekeeper de macOS qui bloque une app non signée, pas un vrai endommagement. Voir la section [premier lancement sur macOS](#download) pour la marche à suivre.

**Télécharger des vidéos YouTube est-il légal ?**
Pour un usage personnel et privé, c'est généralement accepté dans la plupart des juridictions. Tu es responsable de respecter les [Conditions d'Utilisation](https://www.youtube.com/t/terms) de YouTube et les lois sur le droit d'auteur de ton pays.

---

## <a id="roadmap"></a>Feuille de route

À venir — approximativement par ordre de priorité :

| Fonctionnalité    | Description    |
| ---------------- | ---------------- |
| **Saisie d'URLs en lot** | Colle plusieurs URLs d'un coup et lance tout ensemble |
| **Modèles de noms de fichier personnalisés** | Nomme les fichiers par titre, auteur, date, résolution — avec aperçu en direct |
| **Téléchargements programmés** | Démarre une file à une heure définie (lancements nocturnes) |
| **Limites de vitesse** | Plafonne la bande passante pour ne pas saturer ta connexion |
| **Découpe de clips** | Télécharge uniquement un segment par heure de début/fin |

Tu as une fonctionnalité en tête ? [Ouvre une demande](../../issues) — les retours de la communauté orientent les priorités.

---

## <a id="tech"></a>Construit avec

<details>
<summary><strong>Stack</strong></summary>

- **Electron** — shell de bureau multiplateforme
- **React 19** + **TypeScript** — UI
- **Tailwind CSS v4** — styles
- **Zustand** — gestion d'état
- **yt-dlp** + **ffmpeg** — moteur de téléchargement et de muxage (yt-dlp est récupéré à l’exécution ; ffmpeg/ffprobe sont inclus au build)
- **Vite** + **electron-vite** — outillage de build
- **Vitest** + **Playwright** — tests unitaires et end-to-end

</details>

<details>
<summary><strong>Compiler depuis les sources</strong></summary>

### Prérequis — toutes plateformes

| Outil | Version | Installation |
| ----- | ------- | ------------ |
| Git   | quelconque | [git-scm.com](https://git-scm.com) |
| Bun   | dernière   | voir ci-dessous par OS |

### Windows

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Aucun outil de compilation natif requis — le projet n'a pas d'addons Node natifs.

### macOS

```bash
xcode-select --install
curl -fsSL https://bun.sh/install | bash
```

### Linux (Ubuntu / Debian)

```bash
curl -fsSL https://bun.sh/install | bash

# Dépendances runtime Electron
sudo apt install -y libgtk-3-0 libnss3 libasound2t64

# Tests E2E uniquement (Electron a besoin d'un affichage)
sudo apt install -y xvfb
```

### Cloner & lancer

```bash
git clone https://github.com/antonio-orionus/Arroxy
cd arroxy
bun install
bun run dev          # build de développement avec rechargement à chaud
```

### Créer un paquet distribuable

```bash
bun run build        # vérification des types + compilation
bun run dist         # paquet pour l'OS actuel
bun run dist:win     # compilation croisée exe portable Windows
```

> yt-dlp est récupéré depuis GitHub au premier lancement et mis en cache dans le dossier de données de l’app. ffmpeg et ffprobe sont inclus dans chaque release d’Arroxy.

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

## Conditions d'utilisation

Arroxy est un outil destiné à un usage personnel et privé uniquement. Tu es seul responsable du fait que tes téléchargements respectent les [Conditions d'Utilisation](https://www.youtube.com/t/terms) de YouTube et les lois sur le droit d'auteur de ta juridiction. N'utilise pas Arroxy pour télécharger, reproduire ou distribuer du contenu sur lequel tu n'as pas de droits. Les développeurs ne sont pas responsables de tout usage abusif.

<div align="center">
  <sub>Licence MIT · Fait avec soin par <a href="https://x.com/OrionusAI">@OrionusAI</a></sub>
</div>
