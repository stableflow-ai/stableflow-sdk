/**
 * Confirm this CI checkout is the release branch and that the matching tag
 * points at HEAD. Fetches the tag a few times because a combined branch+tag
 * push can arrive slightly apart.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { isReleaseVersion, releaseBranch } from "./version.mjs";

const version = JSON.parse(readFileSync("packages/core/package.json", "utf8")).version;
if (!isReleaseVersion(version)) {
  console.error(`Refusing to publish invalid version "${version}".`);
  process.exit(1);
}

const branch = process.env.GITHUB_REF_NAME ?? git("rev-parse", "--abbrev-ref", "HEAD");
const expected = releaseBranch(version);
if (branch !== expected) {
  console.error(`Branch ${branch} does not match ${expected}.`);
  process.exit(1);
}

if (process.env.GITHUB_ACTIONS === "true") await fetchTag(version);

let tagCommit;
try {
  tagCommit = git("rev-parse", "--verify", `${version}^{commit}`);
} catch {
  console.error(`Tag ${version} does not point at a commit.`);
  console.error(`Push it with the branch: git push -u origin ${expected} ${version}`);
  process.exit(1);
}

const head = git("rev-parse", "HEAD");
if (tagCommit !== head) {
  console.error(`Tag ${version} points at ${tagCommit}, HEAD is ${head}.`);
  process.exit(1);
}

console.log(`verified ${expected} at ${head}`);

async function fetchTag(version) {
  const ref = `refs/tags/${version}:refs/tags/${version}`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const result = spawnSync("git", ["fetch", "origin", ref], { encoding: "utf8" });
    if (result.status === 0) return;
    if (attempt === 6) {
      console.error(result.stderr.trim());
      console.error(`Tag ${version} is not on origin.`);
      console.error(`Push it with the branch: git push -u origin ${releaseBranch(version)} ${version}`);
      process.exit(1);
    }
    await sleep(10_000);
  }
}

function git(...gitArgs) {
  return execFileSync("git", gitArgs, { encoding: "utf8" }).trim();
}
