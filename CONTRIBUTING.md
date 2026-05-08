# Contributing

Thanks for contributing to AgentScan. This guide covers local setup, the dep-update workflow, and the supply-chain gates to run before pushing. Full policy lives in [SUPPLY-CHAIN-SECURITY.md](SUPPLY-CHAIN-SECURITY.md).

## Local setup

Requirements (pinned via [`frontend/.nvmrc`](frontend/.nvmrc) + `engines` in [`frontend/package.json`](frontend/package.json)):

- **Node 22.x** — `nvm use` from the `frontend/` directory will pick the right version (or `nvm install 22` first).
- **Yarn classic 1.22.x** — Corepack-activated automatically from the `packageManager` field; CI asserts the version explicitly.

First-time install:

```bash
cd frontend
yarn install --frozen-lockfile
```

The `engineStrict: true` pin will fail the install if Node is on a different major.

## Package manager rule

This repo uses **yarn classic 1.22.x exclusively**. Do not use `npm install` or `pnpm install` — either will create a competing lockfile and silently diverge dependency resolution. `package-lock.json`, `pnpm-lock.yaml`, and `bun.lockb` are gitignored as a guard.

## Pull requests

1. Fork the repo.
2. Create a branch.
3. Make your changes.
4. Run the local gates (next section). All must pass before pushing.
5. Open a PR.

## Updating a dependency

All direct dependencies are pinned to **exact versions** (no `^`, no `~`, no `>=`). To update:

1. Edit `frontend/package.json`: change the version to the exact target.
2. `yarn install` — this regenerates `yarn.lock`.
3. Review the `yarn.lock` diff for unexpected packages or unfamiliar names.
4. If new install hooks landed: `yarn audit:install-hooks:update` to refresh [`frontend/.supply-chain/install-hooks.allowlist`](frontend/.supply-chain/install-hooks.allowlist).
5. Run the local gates (below). All must pass.
6. Commit `package.json`, `yarn.lock`, and any updated allowlists in the **same PR**.

Never run `yarn upgrade` without re-pinning the result. Never bump a version less than 7 days old unless it's a disclosed security advisory — and note the advisory ID in the PR description so the override is auditable.

See [SUPPLY-CHAIN-SECURITY.md §1](SUPPLY-CHAIN-SECURITY.md#1-exact-version-pinning-in-packagejson) for the full rationale.

## Local gates (run before pushing)

From `frontend/`:

```bash
yarn deps:check-pinned       # fails on any caret/tilde/range
yarn lint                    # eslint (warnings allowed; errors fail CI)
yarn build                   # production build canary
yarn audit:prod              # blocks on un-allowlisted high/critical advisories
yarn audit:install-hooks     # fails on install-hook drift
```

For the full-history secret scan, install gitleaks locally (`brew install gitleaks` on macOS) then:

```bash
gitleaks detect --no-banner --redact --log-opts="--all"
```

The same gates run in CI on every PR via [.github/workflows/ci.yml](.github/workflows/ci.yml) and [.github/workflows/gitleaks.yml](.github/workflows/gitleaks.yml). Failing them locally first is faster and cheaper than waiting on CI.

## Issues

Report bugs and request features via GitHub Issues.

For security vulnerabilities, follow [SECURITY.md](SECURITY.md) — please don't open public issues.
