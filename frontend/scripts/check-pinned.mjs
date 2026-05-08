#!/usr/bin/env node
/**
 * Fail if any dep in package.json is not exact-pinned to X.Y.Z
 * (with optional prerelease/build suffix). Belt-and-suspenders for
 * the no-carets invariant: .npmrc `save-exact=true` plus Dependabot's
 * `versioning-strategy: increase` are the *prevention*; this script
 * is the *enforcement* in CI.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(resolve('.', 'package.json'), 'utf8'));
const exact = /^\d+\.\d+\.\d+([-+][\w.-]+)?$/;

let unpinned = 0;
for (const section of ['dependencies', 'devDependencies']) {
  const deps = pkg[section] || {};
  for (const name of Object.keys(deps)) {
    if (!exact.test(deps[name])) {
      console.error(`::error::Unpinned: ${section}.${name} = ${deps[name]}`);
      unpinned++;
    }
  }
}

if (unpinned > 0) {
  console.error(`\n${unpinned} unpinned dep(s). Replace caret/tilde/range with exact X.Y.Z.`);
  process.exit(1);
}

console.log('deps: all pinned.');
