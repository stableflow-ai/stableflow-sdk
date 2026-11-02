/**
 * Version math for `pnpm release`. Pure functions so the rules can be tested
 * without publishing or touching git.
 *
 * Prerelease dates use Asia/Shanghai (UTC+8), matching releases/README.md.
 */

const STABLE = /^(\d+)\.(\d+)\.(\d+)$/;
const CHANNEL_PRERELEASE = /^(\d+)\.(\d+)\.(\d+)-(rc|beta|canary)-([0-9A-Za-z]+)-(\d{8})$/;
const EXPERIMENTAL = /^0\.0\.0-(experimental-[0-9A-Za-z]+-\d{8})$/;

export function stableCore(version) {
  const match = STABLE.exec(version) ?? /^(\d+)\.(\d+)\.(\d+)-/.exec(version);
  if (!match) {
    throw new Error(`Cannot read a stable core from version "${version}".`);
  }
  return `${match[1]}.${match[2]}.${match[3]}`;
}

export function increment(version, bump) {
  const [major, minor, patch] = stableCore(version).split(".").map(Number);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  if (bump === "patch") return `${major}.${minor}.${patch + 1}`;
  throw new Error(`Unknown bump "${bump}". Use patch, minor, or major.`);
}

export function latestVersion(current, bump) {
  if (stableCore(current) === "0.0.0") return "0.0.1";
  return increment(current, bump);
}

export function nextBase(current, explicitBase) {
  if (explicitBase) {
    if (!STABLE.test(explicitBase)) {
      throw new Error(`--base must be x.y.z, received "${explicitBase}".`);
    }
    return explicitBase;
  }
  const core = stableCore(current);
  if (core === "0.0.0") return "0.0.1";
  return increment(core, "patch");
}

export function prereleaseHash(fullHash) {
  const suffix = fullHash.slice(-10);
  if (suffix.length !== 10) {
    throw new Error("Commit hash must contain at least 10 characters.");
  }
  return /^\d+$/.test(suffix) ? `h${suffix}` : suffix;
}

export function shanghaiDateStamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts.replaceAll("-", "");
}

export function stampToIsoDate(stamp) {
  if (!/^\d{8}$/.test(stamp)) {
    throw new Error(`Expected YYYYMMDD, received "${stamp}".`);
  }
  return `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`;
}

export function channelVersion(channel, options) {
  const { current, bump = "patch", base, hash, date } = options;
  if (channel === "latest") return latestVersion(current, bump);
  if (channel === "experimental") {
    return `0.0.0-experimental-${prereleaseHash(hash)}-${date}`;
  }
  if (channel === "rc" || channel === "beta" || channel === "canary") {
    return `${nextBase(current, base)}-${channel}-${prereleaseHash(hash)}-${date}`;
  }
  throw new Error(`Unknown channel "${channel}". Use latest, rc, beta, canary, or experimental.`);
}

export function distTag(channel, version) {
  if (channel === "latest" || channel === "rc" || channel === "beta" || channel === "canary") return channel;
  if (channel === "experimental") return version.slice("0.0.0-".length);
  throw new Error(`Unknown channel "${channel}".`);
}

export function distTagFromVersion(version) {
  if (STABLE.test(version)) return "latest";
  const experimental = EXPERIMENTAL.exec(version);
  if (experimental) return experimental[1];
  const channel = CHANNEL_PRERELEASE.exec(version);
  if (channel) return channel[4];
  throw new Error(`Cannot read a dist-tag from version "${version}".`);
}

export function isReleaseVersion(version) {
  return STABLE.test(version) || CHANNEL_PRERELEASE.test(version) || EXPERIMENTAL.test(version);
}

export function releaseBranch(version) {
  return `release/${version}`;
}
