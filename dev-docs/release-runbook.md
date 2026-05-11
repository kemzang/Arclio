# Release runbook

| Area                    | Lives in                                |
| ----------------------- | --------------------------------------- |
| Release wrapper         | `scripts/release.sh`                    |
| Resume-dev helper       | `scripts/release-resume-dev.sh`         |
| Release workflow        | `.github/workflows/release.yml`         |
| Windows release gate    | `.github/workflows/installer-smoke.yml` |
| Cold-start release gate | `.github/workflows/e2e-cold-start.yml`  |

This is the manual checklist for promoting tested `dev` code to a stable release.

## Branch model

- Normal contributor PRs target `dev`.
- `dev` is the integration / next-release branch.
- `main` is stable release code.
- `dev -> main` PRs are release-candidate gates, not normal feature-review PRs.
- Beta tags come from `dev`.
- Stable tags come from `main`.

## 1. Final beta from `dev`

Before promoting to stable, cut and test a beta from `dev`.

```bash
git checkout dev
git pull origin dev

# package.json must be a beta version, e.g. 0.3.2-beta.13
bun run release:beta
```

Download the prerelease artifacts from GitHub Releases and smoke-test the app.

## 2. Open / update the release-candidate PR

Open a `dev -> main` PR, or reuse the existing release-candidate PR.

```bash
gh pr create --base main --head dev --title "Release 0.3.2"
```

Wait for the release-gate checks on the PR:

- `check`
- `Cold start (windows)`
- `Cold start (linux)`
- `Cold start (macos-arm64)`
- `Cold-state install`
- `1x install/uninstall cycle`

Docs / landing warnings are advisory and should not block release unless the release intentionally changes public content.

## 3. Merge the release-candidate PR

From the main release worktree, for example `refs/arroxy-main`:

```bash
cd refs/arroxy-main
gh pr merge 5 --merge
git pull origin main
```

Use the real PR number instead of `5`.

## 4. Bump `main` to stable

After the merge, update `package.json` from beta to stable:

```bash
# edit package.json: 0.3.2-beta.13 -> 0.3.2
git commit -am "release: 0.3.2"
git push origin main
```

Do not tag yet.

## 5. Wait for `main` checks

The stable tag script refuses to tag until the exact `main` commit passed the required release-gate checks.

Watch the latest `main` runs:

```bash
gh run list --branch main --limit 10
```

Wait for these checks on the stable version-bump commit:

- `check`
- `Cold start (windows)`
- `Cold start (linux)`
- `Cold start (macos-arm64)`
- `Cold-state install`
- `1x install/uninstall cycle`

Optional dry check:

```bash
bash scripts/release.sh stable --verify-only
```

## 6. Cut stable release from `main`

Once checks are green:

```bash
git checkout main
git pull origin main
bun run release:stable
```

This creates the annotated `vX.Y.Z` tag and pushes it. The release workflows publish GitHub assets and stable package-manager updates.

## 7. Resume `dev` for the next beta

After stable release is cut, sync the release bookkeeping back into `dev` and start the next beta line:

```bash
bun run release:resume-dev
```

By default this reads the stable version from `origin/main` and bumps patch:

- `0.3.2` -> `0.3.3-beta.1`

For a minor / major jump, pass the next beta explicitly:

```bash
bun run release:resume-dev 0.4.0-beta.1
```

## Common misses

- Do not tag stable before the post-bump `main` checks finish.
- Do not forget `git push origin main` after the stable version bump.
- Do not run `release:stable` from `dev`; it must run from `main`.
- Do not leave `dev` behind `main` after release; run `release:resume-dev`.
- If `release:stable --verify-only` says a required check is missing, it usually means the current `main` commit predates that required check or the latest `main` run is still in progress.
