---
name: translate
description: Translate strings across all locales (readme-src and src/shared/i18n/locales). Use when adding or updating translatable strings that need to be propagated to all languages. Dispatches Sonnet sub-agents in parallel, with each agent handling up to 5 locales.
model: sonnet
effort: low
allowed-tools: Bash(node readme-src/build.mjs)
---

# Locale Translation

## Locales in scope

Always translate all locales: in @src/shared/i18n/types.ts

The `en` locale is the canonical reference. The README build script enforces strict key parity — every locale must have exactly the same keys as `en` or the build fails. Landing-page translations live in a separate repo ([`antonio-orionus/arroxy-web`](https://github.com/antonio-orionus/arroxy-web)) and are not in scope here.

## File locations

| Content               | Files                                                |
| --------------------- | ---------------------------------------------------- |
| README strings        | `readme-src/strings.mjs` — one object per locale     |
| Renderer i18n strings | `src/shared/i18n/locales/*.ts` — one file per locale |

## Workflow

### 1. Update `en` first

Make all changes to the English locale first so you have the exact strings to translate.

### 2. Dispatch agents in locale batches of 5

Group the non-English locales into batches of **up to 5 locales per agent**.

Send **all agent calls in a single message** using parallel `tool_use` blocks — never sequentially.

- `subagent_type: "general-purpose"`, `model: "sonnet"`
- Each agent handles one batch of up to 5 locales
- Each agent prompt must be self-contained and include:
  - All locale codes in the batch
  - Language names for each locale
  - File paths for each locale
  - Exact diff spec: keys to remove / replace / add
  - EN reference values
  - Translation rules
  - Terms that must stay in English, such as brand names or technical terms like `yt-dlp`
  - Instruction to preserve all other keys untouched

Do not dispatch one agent per locale unless there are fewer than 2 locales total or a batch needs special handling.

### 3. Verify with build script

Always run the build script after all agents complete:

```bash
node readme-src/build.mjs    # for README strings (use --strict for CI parity)
```

The script validates key parity and exits with `✓` for each locale or fails loudly on mismatch. Renderer i18n parity is enforced by `bun scripts/check-app-i18n.ts --strict`.

### 4. Hand-fix stragglers

Agents occasionally skip a removal step, add a stale key, or apply an inconsistent export format. Do not re-spawn the agent for a one-line fix — patch stragglers by hand.

## Batched agent prompt template

```txt
Translate the following changes into these locales:

[LOCALE_CODE_1] ([LANGUAGE_NAME_1])
File: [FILE_PATH_1]

[LOCALE_CODE_2] ([LANGUAGE_NAME_2])
File: [FILE_PATH_2]

[LOCALE_CODE_3] ([LANGUAGE_NAME_3])
File: [FILE_PATH_3]

[LOCALE_CODE_4] ([LANGUAGE_NAME_4])
File: [FILE_PATH_4]

[LOCALE_CODE_5] ([LANGUAGE_NAME_5])
File: [FILE_PATH_5]

Changes needed for every locale in this batch (EN reference values shown):
- Add key `foo`: "[EN value]"
- Update key `bar` from "[old EN]" to "[new EN]"
- Remove key `baz`

Rules:
- Translate naturally for each target language
- Keep these terms in English: [list any brand names / tech terms]
- Preserve all other keys exactly as they are
- Maintain the same file format and export style for each file
- Ensure every locale has exactly the same keys as `en`
- Do not modify locales outside this batch
```
