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
const staged =
  "The npm packages are staged by release.yml. A maintainer approves them on npmjs.com before they can be installed.";
const notes = existsSync(notesPath)
  ? `${readFileSync(notesPath, "utf8").trimEnd()}\n\n${staged}`
  : `StableFlow SDK ${version}.\n\n${staged}`;
const args = [
  "release",
  "create",
  version,
  "--target",
  process.env.GITHUB_SHA || "HEAD",
  "--title",
  `StableFlow SDK ${version}`,
  "--notes",
  notes,
];
if (distTagFromVersion(version) !== "latest") args.push("--prerelease");

const created = spawnSync("gh", args, { stdio: "inherit" });
if (created.status !== 0) process.exit(created.status ?? 1);
