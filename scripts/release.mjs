/**
 * Prepare a StableFlow SDK release locally.
 *
 * Bumps every public package, commits, tags, and checks out `release/<version>`.
 * Does not push and does not publish. Pushing that branch and tag runs
 * `.github/workflows/release.yml`.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  channelVersion,
  distTag,
  isReleaseVersion,
  releaseBranch,
  shanghaiDateStamp,
  stampToIsoDate,
} from "./version.mjs";

const USAGE = "Usage: pnpm release <latest|rc|beta|canary|experimental> [patch|minor|major] [--base x.y.z] [--dry-run]";
const INDEX_MARKER = "|---------|---------|------|------|\n";
const CHANNELS = new Set(["latest", "rc", "beta", "canary", "experimental"]);

const packages = readdirSync("packages")
  .map((name) => `packages/${name}/package.json`)
  .filter((file) => {
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    return manifest.private !== true;
  })
  .sort();

const { dryRun, channel, bump, base } = parseArgs(process.argv.slice(2));
const current = sharedVersion(packages);
const hash = git("rev-parse", "HEAD");
const date = shanghaiDateStamp();
const version = channelVersion(channel, { current, bump, base, hash, date });
const tag = distTag(channel, version);
const branch = releaseBranch(version);

if (!isReleaseVersion(version)) {
  console.error(`Refusing to release invalid version "${version}".`);
  process.exit(1);
}

console.log(`version ${version}`);
console.log(`dist-tag ${tag}`);
console.log(`branch ${branch}`);
console.log(`git-tag ${version}`);
console.log(`packages ${packages.join(", ")}`);

if (dryRun) {
  if (channel === "latest" && !existsSync(`releases/v${version}.md`)) {
    console.log(`notes missing: releases/v${version}.md`);
  }
  process.exit(0);
}

assertClean();
assertReleaseAbsent(version, branch);
if (channel === "latest") assertStableNotes(version);

git("checkout", "-b", branch);
for (const file of packages) writeVersion(file, version);
if (channel === "latest") insertIndexRow(version, date);

const paths = [...packages];
if (channel === "latest") paths.push("releases/README.md");
git("add", "--", ...paths);
git("commit", "-m", `Update package versions for StableFlow components to ${version}`);
git("tag", "-a", version, "-m", `StableFlow SDK ${version}`);

console.log("");
console.log("Push the branch and tag together:");
console.log(`  git push -u origin ${branch} ${version}`);
if (channel === "latest") {
  console.log("After CI publishes, merge this branch back to main.");
} else {
  console.log("Leave this branch off main so the prerelease version does not become the stable version.");
}

function parseArgs(args) {
  const positional = [];
  let dryRun = false;
  let base;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--base") {
      base = args[++i];
      if (!base) fail("Missing value for --base.");
      continue;
    }
    if (arg.startsWith("--")) fail(`Unknown option "${arg}".\n${USAGE}`);
    positional.push(arg);
  }

  const channel = positional[0];
  const bump = positional[1] ?? "patch";
  if (!CHANNELS.has(channel) || positional.length > 2) fail(USAGE);
  if (channel === "latest" && !["patch", "minor", "major"].includes(bump)) {
    fail(`Unknown bump "${bump}". Use patch, minor, or major.`);
  }
  if (channel !== "latest" && positional[1]) {
    fail("patch, minor, and major are only valid for latest.");
  }
  if (base && channel !== "rc" && channel !== "beta" && channel !== "canary") {
    fail("--base is only valid for rc, beta, and canary.");
  }
  return { dryRun, channel, bump, base };
}

function sharedVersion(files) {
  if (files.length === 0) fail("No public packages to release.");
  const versions = files.map((file) => JSON.parse(readFileSync(file, "utf8")).version);
  const [current, ...rest] = versions;
  if (rest.some((version) => version !== current)) {
    fail(`Public packages must share one version before release. Found ${[...new Set(versions)].join(", ")}.`);
  }
  return current;
}

function assertStableNotes(version) {
  if (!existsSync(`releases/v${version}.md`)) {
    fail(`Missing releases/v${version}.md. Commit that note before releasing.`);
  }
  const readme = readFileSync("releases/README.md", "utf8");
  if (!readme.includes(INDEX_MARKER)) {
    fail("Cannot find the release index table in releases/README.md.");
  }
}

function assertReleaseAbsent(version, branch) {
  if (refExists(`refs/heads/${branch}`)) fail(`Branch ${branch} already exists.`);
  if (refExists(`refs/tags/${version}`)) fail(`Tag ${version} already exists.`);
}

function insertIndexRow(version, dateStamp) {
  const readme = readFileSync("releases/README.md", "utf8");
  const row = `| \`${version}\` | \`latest\` | ${stampToIsoDate(dateStamp)} | [v${version}.md](./v${version}.md) |`;
  if (readme.includes(`| \`${version}\` |`)) return;
  writeFileSync("releases/README.md", readme.replace(INDEX_MARKER, `${INDEX_MARKER}${row}\n`));
}

function writeVersion(file, version) {
  const text = readFileSync(file, "utf8");
  const next = text.replace(/"version":\s*"[^"]+"/, `"version": "${version}"`);
  if (next === text) fail(`No version field in ${file}.`);
  writeFileSync(file, next);
}

function assertClean() {
  const status = git("status", "--porcelain");
  if (status.trim()) fail("Release requires a clean git worktree.");
}

function refExists(ref) {
  try {
    execFileSync("git", ["show-ref", "--verify", "--quiet", ref], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function git(...gitArgs) {
  return execFileSync("git", gitArgs, { encoding: "utf8" }).trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
