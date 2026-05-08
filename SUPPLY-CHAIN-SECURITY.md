# Supply Chain Security

This document describes how `agent-scan` protects itself against npm supply chain attacks — specifically, the scenario where a dependency (direct or transitive) is compromised and a malicious version is published.

It complements [`SECURITY.md`](./SECURITY.md), which covers reporting vulnerabilities in our own code, and mirrors the policy applied across the Valory frontend stack ([`agents-fun`](https://github.com/valory-xyz/agents-fun), [`townhall-kpis`](https://github.com/valory-xyz/townhall-kpis), [`olas-website`](https://github.com/valory-xyz/olas-website), [`pearl-website`](https://github.com/valory-xyz/pearl-website), [`autonolas-frontend-mono`](https://github.com/valory-xyz/autonolas-frontend-mono)).

> **Repo state when this document was written.** [`frontend/`](./frontend/) is a single Next.js 16 + React 19 + Tailwind v4 app, currently shipping a "Coming Soon" landing page. The [README](./README.md) describes a future architecture with a FastAPI backend, indexers, Postgres, and Redis — none of which exist in this repo today. This document covers only what exists. **When the backend / indexer surface lands, the threat model and [§7 secrets-inventory](#7-secrets-hygiene-in-the-build-environment) need to be revisited** — that is the largest open-ended risk on this policy.

## Threat model

The attacks we care about:

1. **Malicious publish** — a maintainer account is compromised (or a maintainer goes rogue) and a bad version of a legitimate package is published. Recent examples: `ua-parser-js` (2021), `node-ipc` protestware (2022), various `@ctrl/*` / `rspack`-related worms (2024–2025), the `shai-hulud` npm worm (2025), the `tj-actions/changed-files` GitHub Action compromise (2025).
2. **Typosquatting / dependency confusion** — a look-alike name is installed instead of the intended package.
3. **Postinstall script abuse** — a compromised package runs arbitrary code during `yarn install`, exfiltrating env vars or tokens from the build environment. Lower direct impact today than on a backend-bearing repo because this app currently has **no runtime secrets** ([§7](#7-secrets-hygiene-in-the-build-environment)) — but the Vercel deploy token reachable from CI is still in scope, and the threat model expands materially when the backend lands.
4. **Transitive compromise** — a deep, rarely-audited dependency is the attack vector. The Next.js 16 + Tailwind v4 transitive tree is medium-sized; Tailwind v4 in particular (rewritten in Rust as the Oxide engine) ships ~10 platform-specific native binaries via `@tailwindcss/oxide-*` — a new transitive surface relative to v3.

## Policies

### 1. Exact version pinning in `package.json`

All direct dependencies in [`frontend/package.json`](./frontend/package.json) are pinned to **exact versions** — no `^`, no `~`, no `>=`, no floating major. Enforced in CI by [`yarn deps:check-pinned`](./frontend/scripts/check-pinned.mjs) (fails on any caret or tilde) and locally by `save-exact=true` in [`frontend/.npmrc`](./frontend/.npmrc).

**Why:** `^` allows minor and patch updates; `~` allows patch updates. If a compromised patch is published and someone runs `yarn add <other-pkg>` or a fresh `yarn install` against a stale lockfile, the bad version can enter the tree silently. Exact pins make every version change an explicit, reviewable `package.json` diff.

**How to update a dependency:** bump the exact version in `package.json`, run `yarn install`, review the `yarn.lock` diff, run [`yarn audit:install-hooks:update`](./frontend/scripts/audit-install-hooks.mjs) if any new install hooks landed, and commit `package.json` + `yarn.lock` (+ updated `install-hooks.allowlist`) in the same PR. Never run `yarn upgrade` without re-pinning the result.

**Transitive overrides follow the same rule.** Entries under `"resolutions"` in `package.json` are a transitive-pinning mechanism, not an escape hatch for ranges. Use `"1.2.3"`, not `"^1.2.3"` or `">=1.2.3"`. When adding a resolution to clear a CVE, reference the advisory in the PR/commit message so future readers understand why the override exists. There are no resolutions in the tree today.

### 2. Single lockfile, treated as source of truth

[`frontend/yarn.lock`](./frontend/yarn.lock) is the canonical lockfile. The `packageManager` field in `frontend/package.json` pins Yarn `1.22.22`; CI activates that version explicitly via `corepack enable` + `corepack prepare yarn@1.22.22 --activate` at the start of every Node job in [.github/workflows/ci.yml](./.github/workflows/ci.yml), with a trailing assertion that fails the job if the activation didn't stick. Without corepack activation the `packageManager` pin is silently ignored — CI would fall back to whatever yarn ships with the runner.

[`frontend/vercel.json`](./frontend/vercel.json) pins `installCommand` to `yarn install --frozen-lockfile` so the deployed build matches the locked tree. `package-lock.json`, `pnpm-lock.yaml`, and `bun.lockb` are in [`frontend/.gitignore`](./frontend/.gitignore) so a stray `npm install` / `pnpm install` / `bun install` can't land a second lockfile that conflicts with `yarn.lock`. CI installs with `yarn install --frozen-lockfile`, which fails if `package.json` and `yarn.lock` disagree — catching any silent resolution drift at build time.

### 3. Lockfile review in PRs

Any PR that touches `yarn.lock` requires a reviewer to confirm:

- The diff is proportionate to the `package.json` change.
- No unexpected packages appear. Look for unfamiliar names, typos of known packages, or packages with very recent publish dates on high-traffic names.
- Resolved URLs point to the official registry (`registry.yarnpkg.com` / `registry.npmjs.org`), not a fork or mirror. Automated by the `lockfile-lint` job in [.github/workflows/ci.yml](./.github/workflows/ci.yml) — see [§5](#5-audit-in-ci).

### 4. Cooldown window on updates

Prefer dependency versions that are **at least 7 days old**. Most malicious publishes are caught and unpublished within hours to days.

This is enforced by **manual discipline on every PR** — Dependabot version-update PRs are intentionally suppressed (`open-pull-requests-limit: 0` in [`.github/dependabot.yml`](./.github/dependabot.yml)), and Dependabot security-update PRs are turned off at the repo level. Dependabot **alerts** remain on at the repo level so the GitHub Security tab still surfaces advisories that match `yarn.lock`.

When a manual dependency PR bumps a version, the reviewer checks `npm view <pkg> time` (or the npm page) and confirms the target is at least 7 days old. If the bump is for a disclosed security advisory, the cooldown does not apply — note the advisory ID in the PR description so the override is auditable.

Vulnerability discovery does not depend on the 7-day rule. Already-disclosed CVEs are caught by the `audit` job in [.github/workflows/ci.yml](./.github/workflows/ci.yml) on every PR (see [§5](#5-audit-in-ci)) and the weekly cron run in the same workflow.

**Known gap:** the GitHub Actions in [.github/workflows/](./.github/workflows/) are SHA-pinned and will not receive updates (including security fixes) without a human bumping the SHA. Audit the pins periodically — at minimum once per major release of each action.

### 5. Audit in CI

Five jobs run on every PR and push to `main`, plus a weekly cron schedule on the same workflow.

- **`verify`** — `yarn install --frozen-lockfile`, `deps:check-pinned`, `lint`, `build`. The build/lint backbone with the supply-chain assertions added.
- **`audit` (production tree, blocking on high/critical)** — delegates to [`frontend/scripts/audit.mjs`](./frontend/scripts/audit.mjs), which runs `yarn audit --groups dependencies --json` and gates on its own logic instead of Yarn 1.x's bitmask exit code. `--groups dependencies` restricts to the production tree — `devDependencies` (ESLint / TypeScript / types) generate substantial transitive-advisory noise and do not ship to users. An unlisted high/critical advisory against a production dependency blocks merge; the PR author must either (a) bump the dep, (b) add an exact-pinned Yarn `resolutions` entry per [§1](#1-exact-version-pinning-in-packagejson) with the advisory ID in the PR description, or (c) add the advisory to [`frontend/.supply-chain/audit-allowlist.json`](./frontend/.supply-chain/audit-allowlist.json) with a reason and review date. Allowlist entries whose `review` date has passed generate a `::warning::` in CI output but do not fail the job. **The audit job runs without `yarn install`** — `yarn audit` queries the npm advisory database against `yarn.lock` directly, so `node_modules` is unnecessary; skipping install means a compromised postinstall cannot run inside the gate that exists to detect compromised postinstalls. The allowlist is currently empty.
- **`install-hooks`** — runs [`frontend/scripts/audit-install-hooks.mjs`](./frontend/scripts/audit-install-hooks.mjs) to enumerate every package in `node_modules` with a non-trivial `preinstall` / `install` / `postinstall` script and diff that set against [`frontend/.supply-chain/install-hooks.allowlist`](./frontend/.supply-chain/install-hooks.allowlist). Two failure modes: (1) a new name in the tree not in the allowlist, (2) a stale allowlist entry not in the tree. Install runs with `--ignore-scripts` so the audit fires before any hook executes on the runner. Run `yarn audit:install-hooks:update` locally after any dependency change and commit the regenerated allowlist alongside the `package.json` / `yarn.lock` diff.
- **`lockfile-lint`** — validates that every `resolved` URL in `yarn.lock` points at `registry.yarnpkg.com` or `registry.npmjs.org`, uses HTTPS, and has an integrity hash. Run via `npx --yes lockfile-lint` (no devDependency added).
- **`scan` (Gitleaks)** — full-history secret scan in a separate workflow at [.github/workflows/gitleaks.yml](./.github/workflows/gitleaks.yml). The CLI is downloaded directly from the official GitHub release with SHA-256 verification (`gitleaks 8.30.1`); the action wrapper requires a license for org-private repos.
- **`all-checks-passed`** — single aggregator job that fails if any of the four CI-workflow jobs above failed. **Cross-workflow `needs:` is not supported**, so the gitleaks scan can't be a dependency of the aggregator. When branch protection is enabled, require both `All checks passed` and `Gitleaks / scan` as separate required contexts.

The audit step deliberately runs `yarn audit:prod`, not `yarn audit`. Yarn 1.x ships a built-in `yarn audit` subcommand that takes priority over a same-named entry in `package.json` `scripts`, so naming the wrapper `audit` would silently bypass `audit.mjs` and run the stock command instead — skipping the allowlist and the production-tree filter. The `audit:prod` name makes the collision impossible.

**Why a wrapper and not stock `yarn audit`.** Yarn 1.x `yarn audit` exits with a severity bitmask (`1`=info, `2`=low, `4`=moderate, `8`=high, `16`=critical) rather than a threshold comparison — `--level high` filters the *printed* output but does not affect the exit code. On top of that, there is no native way to suppress a specific advisory that cannot be fixed (e.g. abandoned upstream, deferred major migration). `audit.mjs` handles both: it parses the JSON output, applies the high/critical gate explicitly, and consults the allowlist.

### 6. Avoid postinstall-heavy dependencies

When adding a new dependency, check:

- Does it have a `postinstall` / `preinstall` / `install` script? (`yarn why <pkg>` + inspect its `package.json`.)
- If yes, is the script necessary, and is the package well-known?
- Prefer alternatives with no install scripts for new additions.

**Known live install-hook surface.** As of this writing, the production tree carries exactly **two** packages with non-trivial install hooks, both legitimate native bindings:

- [`sharp`](https://www.npmjs.com/package/sharp) — Next.js's image-optimization library. Pulled in directly by `next`. Its `install` hook fetches a prebuilt native binary if one is available for the runner's platform, otherwise builds from source.
- [`unrs-resolver`](https://www.npmjs.com/package/unrs-resolver) — Rust-based module resolver from the unrs project. Reaches the tree as a transitive of `eslint-config-next > eslint-import-resolver-typescript`. `napi-postinstall` validation step — verifies the platform-correct NAPI binding is in place; no network/exec at install time.

The full set is enumerated in [`frontend/.supply-chain/install-hooks.allowlist`](./frontend/.supply-chain/install-hooks.allowlist) and a new entry in the tree fails CI until explicitly added — see the `install-hooks` job in [§5](#5-audit-in-ci).

**Repo-specific watches** (high-attention surface in our tree):

- [`next`](https://www.npmjs.com/package/next) — the framework itself. Past advisories include RSC denial-of-service issues; we shipped a manual `16.0.10 → 16.2.6` bump to clear two of those (`GHSA-h25m-26qc-wcjf`, `GHSA-q4gf-8mx6-v5v3`). Highest-attention surface in this repo.
- [`@tailwindcss/oxide`](https://www.npmjs.com/package/@tailwindcss/oxide) (and platform variants) — Tailwind v4 was rewritten in Rust; the Oxide engine ships ~10 platform-specific NAPI binaries. New transitive surface in v4 vs. v3, and the package is still relatively young.
- [`eslint-config-next`](https://www.npmjs.com/package/eslint-config-next) — pulls a substantial dev-tree, including `unrs-resolver`. Dev-only, but the install-hook gate in [§5](#5-audit-in-ci) covers postinstall execution on CI runners.

### 7. Secrets hygiene in the build environment

#### What secrets this app actually uses

**Currently, none.** The repo ships a single static "Coming Soon" page; there is no runtime configuration, no API client, no auth, no database. Nothing from `process.env.*` is read in any source file. Confirm with: `grep -RE "process\.env" frontend/app/`.

**The only credential reachable from this repo's CI/build environment is the Vercel deploy token** (held by Vercel's GitHub integration, never exposed to GitHub Actions runs). A compromised `postinstall` running on a Vercel build could exfiltrate Vercel-internal env that the deployment image happens to set, but no project secrets are configured in Vercel today.

**This section is the single biggest open-ended risk** — and will need expansion when the README's planned backend (FastAPI + Postgres + Redis + indexer workers) lands. Anticipated additions when that happens, none of which are committed today:

- DB connection strings (Postgres, Redis).
- RPC URLs (likely Alchemy/Infura keyed) for whichever chains the indexer covers.
- Backend bearer tokens for the read-only API.
- Any third-party service keys (analytics, error reporting, etc.).

When the first of these is added, this section must be re-enumerated as a table (per the `agents-fun` and `townhall-kpis` template), and the response playbook below must be updated to rotate the new credentials.

#### General hygiene

- **No long-lived secrets in CI env vars that a postinstall script could exfiltrate.** The GitHub Actions workflows in [.github/workflows/](./.github/workflows/) do not export any repo or org secrets to the install step. If a new job needs a secret in the future, declare `env:` on the step that uses it, never on the job.
- **`pull_request_target`** must not be used on PRs from forks (it exposes repo secrets to fork-controlled code). None of the current workflows use it.
- **Vercel env-var scoping:** when secrets are added (per the section above), every secret must be marked **runtime-only** in the Vercel project settings, not build-time. Build-time exposure is exactly what a compromised `postinstall` script exfiltrates.
- **`.npmrc` / `.yarnrc` auth tokens:** never committed. [`frontend/.gitignore`](./frontend/.gitignore) protects `.env*` and `.vercel`.

### 8. Dependency review on every new addition

Before adding a new direct dependency:

- Weekly download count on npm — very low numbers on a "popular-sounding" name is a typosquat red flag.
- GitHub repo exists, is active, has reasonable star count and contributor history.
- Maintainer is the expected one (check publish history: `npm view <pkg> time`).
- No recently transferred ownership unless it's a known, announced transfer.
- Check Socket.dev / Snyk advisories.

## Response playbook: "a dependency we use was just disclosed as compromised"

1. **Identify exposure.** `yarn why <pkg>` — direct or transitive? Which version is in our lockfile?
2. **Check the window.** When was the bad version published vs. when we last ran `yarn install` / deployed? If our lockfile predates the bad version, we are not shipping it in production — but any developer running `yarn install` fresh could pull it locally.
3. **Pin to a safe version.** Edit `frontend/package.json` to a known-good version (or add a Yarn `resolutions` entry for transitive deps, following the exact-pinning rule in [§1](#1-exact-version-pinning-in-packagejson)). Commit lockfile.
4. **Rotate the Vercel deploy token** (the only build-environment credential today). When the backend lands, expand this step to enumerate every runtime secret per [§7](#7-secrets-hygiene-in-the-build-environment).
5. **Redeploy** from a known-good commit on `main` so production no longer serves any code influenced by the bad version.
6. **Post-mortem.** Record the incident: what package, which version, how we detected it, time-to-mitigate, what (if anything) leaked.

**Drill cadence.** This playbook must be drilled at least once after this document lands and re-drilled when the backend (and its associated secrets) is added. Last drilled: **TBD** — fill in as `YYYY-MM-DD` after the first walk-through.

## Current gaps / TODO

- [x] Pin all direct dependencies to exact versions; lock Node 22 via [`frontend/.nvmrc`](./frontend/.nvmrc) + `engines`.
- [x] Add a `packageManager` field pinning `yarn@1.22.22` and activate it via Corepack in CI.
- [x] Add `pnpm-lock.yaml` / `package-lock.json` / `bun.lockb` to [`frontend/.gitignore`](./frontend/.gitignore).
- [x] Bump `next 16.0.10 → 16.2.6` to clear `GHSA-h25m-26qc-wcjf` (1112646) and `GHSA-q4gf-8mx6-v5v3` (1116375), both Server-Components DoS highs.
- [x] Add [`frontend/scripts/audit.mjs`](./frontend/scripts/audit.mjs) + [`frontend/.supply-chain/audit-allowlist.json`](./frontend/.supply-chain/audit-allowlist.json) and the `audit:prod` script. Allowlist currently empty.
- [x] Add [`frontend/scripts/audit-install-hooks.mjs`](./frontend/scripts/audit-install-hooks.mjs) + [`frontend/.supply-chain/install-hooks.allowlist`](./frontend/.supply-chain/install-hooks.allowlist) + the `install-hooks` job. Allowlist seeded with `sharp` and `unrs-resolver`.
- [x] Add [`frontend/scripts/check-pinned.mjs`](./frontend/scripts/check-pinned.mjs) + the `deps:check-pinned` script.
- [x] Add `lockfile-lint` to CI to enforce HTTPS-only registry hosts and integrity hashes in `yarn.lock`.
- [x] Add Gitleaks workflow with full-history scan and a SHA-256-verified gitleaks binary.
- [x] Add `all-checks-passed` aggregator job to keep branch-protection wiring simple when re-enabled.
- [x] Add [`frontend/vercel.json`](./frontend/vercel.json) `installCommand` pin so the deployed build matches the locked tree.
- [x] Dependabot version-update PRs disabled (`open-pull-requests-limit: 0`); security-update PRs disabled at the repo level. Alerts remain on at the repo level.
- [x] Standard security headers in [`frontend/next.config.ts`](./frontend/next.config.ts) (HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options); `poweredByHeader: false`.
- [ ] **Drill the response playbook** above. Walk through a hypothetical compromise; time it. Record the date in this document.
- [ ] **Re-enable branch protection on `main`** once `All checks passed` + `Gitleaks / scan` have run green for a week. Required checks: those two as separate contexts. Without this, the [CODEOWNERS](./.github/CODEOWNERS) entries from PR 1 are decorative.
- [ ] **Audit Vercel project settings.** Confirm `Install Command` is unset in the dashboard so [`frontend/vercel.json`](./frontend/vercel.json) wins. Confirm `Settings → Code security` has `Dependabot alerts` ON.
- [ ] **Revisit this document when the backend lands.** [§7 Secrets hygiene](#7-secrets-hygiene-in-the-build-environment) needs a concrete enumeration; the threat model needs to include the new runtime surface; the response playbook needs to enumerate every credential to rotate.
- [ ] **CSP rollout (R1–R7).** Deferred until the post-launch product surface lands. Doing R1 inventory now (against a Coming Soon page) would be wasted work.

## References

- [GitHub advisory database](https://github.com/advisories)
- [Socket.dev](https://socket.dev/) — supply chain scanner with postinstall script detection
- [Shai-Hulud Strikes Again (v2) — Socket, Nov 2025](https://socket.dev/blog/shai-hulud-strikes-again-v2) — representative of modern npm worm class (500+ packages, 700+ versions affected)
- [lockfile-lint](https://github.com/lirantal/lockfile-lint) — validates `resolved` URLs, HTTPS, and integrity hashes in `yarn.lock`
- [Dependency confusion — Alex Birsan's original writeup](https://medium.com/@alex.birsan/dependency-confusion-4a5d60fec610)
- [agents-fun PR #48](https://github.com/valory-xyz/agents-fun/pull/48) — the org's reference supply-chain hardening PR; this document mirrors its structure.
