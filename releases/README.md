# Release Notes

This directory holds StableFlow SDK release notes for published `@stableflow/*` packages.

## How to publish

Feature branches merge to `main`. A release starts from a clean checkout of the commit to ship. `pnpm release` creates `release/<version>`, writes the same version into every public package, commits, and tags. It does not push or run `npm publish`.

Commit `releases/vX.Y.Z.md` before a stable release. The script exits when that file is missing.

| Channel | Command | Version | npm dist-tag | After CI |
|---------|---------|---------|--------------|----------|
| latest | `pnpm release latest patch` (`minor` or `major`) | `x.y.z` | `latest` | Merge `release/x.y.z` back to `main` |
| rc, beta, canary | `pnpm release rc` (`beta`, `canary`). Optional `--base x.y.z` | `{base}-{channel}-{hash}-{YYYYMMDD}` | `rc`, `beta`, or `canary` | Keep the release branch off `main` |
| experimental | `pnpm release experimental` | `0.0.0-experimental-{hash}-{YYYYMMDD}` | `experimental-{hash}-{YYYYMMDD}` | Keep the release branch off `main` |

`<hash>` is the last 10 characters of the commit being released. The date is the `Asia/Shanghai` day as `YYYYMMDD`. When those 10 characters are all digits, the script prefixes `h` so the prerelease id stays valid semver. npm rejects a dist-tag that is itself valid semver, so the experimental dist-tag drops the leading `0.0.0-`.

`--dry-run` prints the version, dist-tag, branch, and tag and leaves git untouched.

Push the branch and the annotated tag together:

```bash
git push -u origin release/<version> <version>
```

A push to `release/**` runs [`.github/workflows/release.yml`](../.github/workflows/release.yml). The workflow requires the branch name `release/<version>`. The tag may point at that commit, or at an earlier commit on the branch when the package version is unchanged. It installs from `pnpm-lock.yaml`, runs `pnpm build:pub`, stages any of the 12 public packages that do not already have the version, and opens a GitHub Release. Channel builds are marked as prereleases. The release body is `releases/v<version>.md` when that file exists.

npm auth is the Trusted Publisher on `stableflow-ai/stableflow-sdk` for workflow file `release.yml` (`id-token: write`). Node 22 ships npm 10, which cannot exchange that OIDC token, so the workflow installs npm 11 and runs `npm stage publish`. The configured permission is stage publish: a maintainer approves each staged version on npmjs.com before it can be installed. The workflow does not read `NPM_TOKEN`. Each package's publisher stays pending until that workflow stages the package once. Validate the current pending configuration before **2026-11-04 09:07 UTC**. `pnpm pub`, `pnpm pub:rc`, `pnpm pub:beta`, and `pnpm pub:canary` remain local fallbacks and authenticate with the user npm token, so they do not validate the Trusted Publisher. Let CI stage a version that still needs to go out through that workflow.

The same commit on the same Shanghai day produces the same prerelease version. Add a commit, or wait until the next day, before cutting another prerelease from that commit.

## Package version format

All packages in a release share the same version string.

### Stable (npm dist-tag: `latest`)

```
{MAJOR}.{MINOR}.{PATCH}
```

Example: `3.1.4`

Release with: `pnpm release latest patch` (or `minor` / `major`). See [How to publish](#how-to-publish).

### Channel / prerelease builds

```
{base}-{channel}-{shortSha}-{YYYYMMDD}
```

| Part | Meaning | Example |
|------|---------|---------|
| `base` | Target semver, or `0.0.0` for experimental | `3.1.4`, `3.1.1`, `0.0.0` |
| `channel` | npm dist-tag / release lane | `rc`, `canary`, `beta`, `experimental` |
| `shortSha` | 10-char git commit id (usually trailing 10 of full SHA) | `0f7f3e64ed` |
| `YYYYMMDD` | Publish date (UTC+8 / local release day) | `20260731` |

Examples:

| Version | Channel | Release command |
|---------|---------|----------------|
| `3.1.4-rc-0f7f3e64ed-20260731` | `rc` | `pnpm release rc` |
| `3.1.4-canary-0f7f3e64ed-20260731` | `canary` | `pnpm release canary` |
| `3.1.1-beta-d5f36a0408-20260723` | `beta` | `pnpm release beta` |
| `0.0.0-experimental-66f3349774-20260703` | `experimental` | `pnpm release experimental` |

Install examples:

```bash
pnpm add @stableflow/bridges@3.1.4
pnpm add @stableflow/bridges@rc
pnpm add @stableflow/bridges@3.1.4-rc-0f7f3e64ed-20260731
pnpm add @stableflow/bridges@canary
pnpm add @stableflow/bridges@beta
```

## Release note file naming

| Release type | File name | Example |
|--------------|-----------|---------|
| Stable | `v{MAJOR}.{MINOR}.{PATCH}.md` | `v3.1.4.md` |
| Channel build (optional) | `v{base}-{channel}-{shortSha}-{YYYYMMDD}.md` | `v3.1.4-rc-0f7f3e64ed-20260731.md` |

Rules:

- Title (H1): `StableFlow SDK {version}` matching the npm version string
- Do **not** use prefixes like `RELEASE_NOTES_`, or package-scoped filenames
- One note file covers all `@stableflow/*` packages for that version
- Prefer writing notes for **stable** releases; add a channel-specific note only when the build is noteworthy and will not immediately become a stable release (or when consumers need install guidance for that exact build)
- If a channel build later ships as stable with the same changes, keep a single stable note (`v3.1.4.md`) and list related channel versions in the Index / in the note body

## When to add a file

1. Diff against the previous stable (or relevant) release: `git diff 3.1.3..3.1.4` (or the commit behind `shortSha`).
2. Summarize user-facing changes only (features, fixes, migrations).
3. Add `releases/v{version}.md`.
4. Update the [Index](#index) below (newest first). Include related `rc` / `canary` / `beta` version strings when they exist for the same changeset.

## Document template

```markdown
# StableFlow SDK X.Y.Z

**Release date:** YYYY-MM-DD

All `@stableflow/*` packages bumped to `X.Y.Z`.

<!-- For channel builds, use the full version in the title and state the dist-tag. -->
<!-- Related builds: `X.Y.Z-rc-{sha}-{date}`, `X.Y.Z-canary-{sha}-{date}` -->

## Highlights

One short paragraph: why this release matters.

## What's Changed

### `@stableflow/<package>`

- Bullet points of functional changes

## Affected Packages

| Package | Version |
|---------|---------|
| `@stableflow/core` | X.Y.Z |
| … | X.Y.Z |

## Migration / Upgrade Notes

- Breaking changes (if any)
- Upgrade / install commands (exact version or dist-tag)
- New errors / behavior integrators should handle

## Commits

- `{shortSha}` — subject line
```

Omit optional sections when empty. Keep **Highlights** and **What's Changed**.

## Style

- Prefer package-scoped headings under **What's Changed**.
- Call out breaking changes and new error strings explicitly.
- Prefer exact installable version strings for channel builds; mention dist-tags (`rc`, `canary`, `beta`) when useful.

## Index

| Version | Channel | Date | File |
|---------|---------|------|------|
| `3.1.7` | `latest` | 2026-11-02 | [v3.1.7.md](./v3.1.7.md) |
| `3.1.6` | `latest` | 2026-08-21 | [v3.1.6.md](./v3.1.6.md) |
| `3.1.5` | `latest` | 2026-07-31 | [v3.1.5.md](./v3.1.5.md) |
| `3.1.4` | `latest` | 2026-07-31 | [v3.1.4.md](./v3.1.4.md) |
| `3.1.4-rc-0f7f3e64ed-20260731` | `rc` | 2026-07-31 | → same changeset as [v3.1.4.md](./v3.1.4.md) |
| `3.1.4-canary-0f7f3e64ed-20260731` | `canary` | 2026-07-31 | → same changeset as [v3.1.4.md](./v3.1.4.md) |
