# Release Notes

This directory holds StableFlow SDK release notes for published `@stableflow/*` packages.

## Package version format

All packages in a release share the same version string.

### Stable (npm dist-tag: `latest`)

```
{MAJOR}.{MINOR}.{PATCH}
```

Example: `3.1.4`

Publish with: `pnpm pub`

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

| Version | Channel | Publish script |
|---------|---------|----------------|
| `3.1.4-rc-0f7f3e64ed-20260731` | `rc` | `pnpm pub:rc` |
| `3.1.4-canary-0f7f3e64ed-20260731` | `canary` | `pnpm pub:canary` |
| `3.1.1-beta-d5f36a0408-20260723` | `beta` | `pnpm pub:beta` |
| `0.0.0-experimental-66f3349774-20260703` | `experimental` | (custom / experimental lane) |

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
| `3.1.4` | `latest` | 2026-07-31 | [v3.1.4.md](./v3.1.4.md) |
| `3.1.4-rc-0f7f3e64ed-20260731` | `rc` | 2026-07-31 | → same changeset as [v3.1.4.md](./v3.1.4.md) |
| `3.1.4-canary-0f7f3e64ed-20260731` | `canary` | 2026-07-31 | → same changeset as [v3.1.4.md](./v3.1.4.md) |
