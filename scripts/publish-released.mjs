/**
 * Publish the version already committed on this release branch.
 * Skips packages that already have the version on npm so a failed run can resume.
 * Auth is the GitHub Actions Trusted Publisher. A token would skip OIDC and
 * leave the publisher pending.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { distTagFromVersion, isReleaseVersion } from "./version.mjs";

const PUBLISH_ORDER = [
  "@stableflow/core",
  "@stableflow/utils-evm",
  "@stableflow/utils-solana",
  "@stableflow/bridges",
  "@stableflow/wallet-solana",
  "@stableflow/wallet-evm",
  "@stableflow/wallet-near",
  "@stableflow/wallet-ton",
  "@stableflow/wallet-aptos",
  "@stableflow/wallet-tron",
  "@stableflow/wallet-sui",
  "@stableflow/hyperliquid",
];

if (process.env.NODE_AUTH_TOKEN || process.env.NPM_TOKEN) {
  console.error("Unset NODE_AUTH_TOKEN and NPM_TOKEN so npm publishes with the Trusted Publisher.");
  process.exit(1);
}

const byName = publicManifests();
assertPublishOrder(byName);

const version = byName.get("@stableflow/core").version;
if (!isReleaseVersion(version)) {
  console.error(`Refusing to publish invalid version "${version}".`);
  process.exit(1);
}
for (const name of PUBLISH_ORDER) {
  if (byName.get(name).version !== version) {
    console.error(`${name} is ${byName.get(name).version}, expected ${version}.`);
    process.exit(1);
  }
}

const tag = distTagFromVersion(version);
console.log(`version ${version}`);
console.log(`dist-tag ${tag}`);

for (const name of PUBLISH_ORDER) {
  if (isPublished(name, version)) {
    console.log(`skip ${name}@${version}`);
    continue;
  }
  console.log(`publish ${name}@${version}`);
  const result = spawnSync(
    "pnpm",
    ["--filter", name, "publish", "--access", "public", "--tag", tag, "--no-git-checks", "--provenance"],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  if (!isPublished(name, version)) {
    console.error(`${name}@${version} is still missing from npm after publish.`);
    process.exit(1);
  }
}

function publicManifests() {
  const byName = new Map();
  for (const dir of readdirSync("packages")) {
    const manifest = JSON.parse(readFileSync(`packages/${dir}/package.json`, "utf8"));
    if (manifest.private === true) continue;
    byName.set(manifest.name, manifest);
  }
  const names = [...byName.keys()].sort();
  const expected = [...PUBLISH_ORDER].sort();
  if (names.join("\n") !== expected.join("\n")) {
    console.error(`Public packages do not match the publish list.\nFound: ${names.join(", ")}\nExpected: ${expected.join(", ")}`);
    process.exit(1);
  }
  return byName;
}

function assertPublishOrder(byName) {
  const index = new Map(PUBLISH_ORDER.map((name, position) => [name, position]));
  for (const name of PUBLISH_ORDER) {
    for (const dep of workspaceDeps(byName.get(name))) {
      if (!index.has(dep) || index.get(dep) >= index.get(name)) {
        console.error(`${name} depends on ${dep}, which is not earlier in the publish order.`);
        process.exit(1);
      }
    }
  }
}

function workspaceDeps(manifest) {
  const deps = { ...manifest.dependencies, ...manifest.peerDependencies };
  return Object.entries(deps)
    .filter(([name, spec]) => name.startsWith("@stableflow/") && String(spec).startsWith("workspace:"))
    .map(([name]) => name);
}

function isPublished(name, version) {
  const result = spawnSync("npm", ["view", `${name}@${version}`, "version"], { encoding: "utf8" });
  if (result.status === 0) return true;
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status === 1 && /E404|404 Not Found/.test(output)) return false;
  console.error(output.trim());
  process.exit(result.status ?? 1);
}
