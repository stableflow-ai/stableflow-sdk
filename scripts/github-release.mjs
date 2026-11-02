/**
 * Open the GitHub Release for the version on this commit.
 * The body is releases/v<version>.md when that file exists.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { distTagFromVersion, isReleaseVersion } from "./version.mjs";

const version = JSON.parse(readFileSync("packages/core/package.json", "utf8")).version;
if (!isReleaseVersion(version)) {
  console.error(`Refusing to create a release for invalid version "${version}".`);
  process.exit(1);
}

const existing = spawnSync("gh", ["release", "view", version], { encoding: "utf8" });
if (existing.status === 0) {
  console.log(`GitHub Release ${version} already exists.`);
  process.exit(0);
}

const notesPath = `releases/v${version}.md`;
const args = [
  "release",
  "create",
  version,
  "--target",
  process.env.GITHUB_SHA || "HEAD",
  "--title",
  `StableFlow SDK ${version}`,
];
if (existsSync(notesPath)) args.push("--notes-file", notesPath);
else args.push("--notes", `StableFlow SDK ${version}.`);
if (distTagFromVersion(version) !== "latest") args.push("--prerelease");

const created = spawnSync("gh", args, { stdio: "inherit" });
if (created.status !== 0) process.exit(created.status ?? 1);
