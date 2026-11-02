import assert from "node:assert/strict";
import test from "node:test";
import {
  channelVersion,
  distTag,
  distTagFromVersion,
  isReleaseVersion,
  prereleaseHash,
  releaseBranch,
  shanghaiDateStamp,
  stableCore,
} from "./version.mjs";

const date = "20261102";
const hash = "abcdef0123456789dead";

test("latest patch, minor, and major increment the stable core", () => {
  assert.equal(channelVersion("latest", { current: "3.1.6", bump: "patch" }), "3.1.7");
  assert.equal(channelVersion("latest", { current: "3.1.6", bump: "minor" }), "3.2.0");
  assert.equal(channelVersion("latest", { current: "3.1.6", bump: "major" }), "4.0.0");
  assert.equal(stableCore("3.1.7-rc-456789dead-20261102"), "3.1.7");
});

test("first latest release from 0.0.0 is 0.0.1", () => {
  assert.equal(channelVersion("latest", { current: "0.0.0", bump: "minor" }), "0.0.1");
});

test("rc, beta, and canary default to the next patch", () => {
  assert.equal(
    channelVersion("rc", { current: "3.1.6", hash, date }),
    "3.1.7-rc-456789dead-20261102",
  );
  assert.equal(
    channelVersion("beta", { current: "3.1.6", hash, date }),
    "3.1.7-beta-456789dead-20261102",
  );
  assert.equal(
    channelVersion("canary", { current: "3.1.6", hash, date, base: "3.2.0" }),
    "3.2.0-canary-456789dead-20261102",
  );
});

test("experimental version and dist-tag drop the 0.0.0- prefix", () => {
  const version = channelVersion("experimental", { current: "3.1.6", hash, date });
  assert.equal(version, "0.0.0-experimental-456789dead-20261102");
  assert.equal(distTag("experimental", version), "experimental-456789dead-20261102");
  assert.equal(distTagFromVersion(version), "experimental-456789dead-20261102");
});

test("dist-tags for stable and channel builds", () => {
  assert.equal(distTag("latest", "3.1.7"), "latest");
  assert.equal(distTag("canary", "3.1.7-canary-456789dead-20261102"), "canary");
  assert.equal(distTagFromVersion("3.1.7"), "latest");
  assert.equal(distTagFromVersion("3.1.7-beta-456789dead-20261102"), "beta");
});

test("an all-digit hash suffix is prefixed", () => {
  assert.equal(prereleaseHash("zzzz0123456789"), "h0123456789");
  assert.equal(
    channelVersion("rc", { current: "3.1.6", hash: "zzzz0123456789", date }),
    "3.1.7-rc-h0123456789-20261102",
  );
});

test("shanghai date stamp uses UTC+8", () => {
  assert.equal(shanghaiDateStamp(new Date("2026-11-02T15:30:00.000Z")), "20261102");
  assert.equal(shanghaiDateStamp(new Date("2026-11-02T16:30:00.000Z")), "20261103");
});

test("release versions and branch names", () => {
  assert.equal(isReleaseVersion("3.1.7"), true);
  assert.equal(isReleaseVersion("3.1.7-rc-456789dead-20261102"), true);
  assert.equal(isReleaseVersion("0.0.0-experimental-456789dead-20261102"), true);
  assert.equal(isReleaseVersion("3.1.7-rc"), false);
  assert.equal(releaseBranch("3.1.7"), "release/3.1.7");
});
