# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

AgentScan is an open-source, multi-chain scanner for tracking agents and related ecosystems (x402 / MCP / A2A). The project is **early/WIP**: only the [frontend/](frontend/) "Coming Soon" landing page is implemented. The backend (FastAPI), indexers, and data layer (Postgres, Redis) described in [README.md](README.md) and [docs/ArchitectureSpec.pdf](docs/ArchitectureSpec.pdf) do not yet exist in the tree — do not assume they do when reasoning about a task.

## Frontend (`frontend/`)

Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4 (via `@tailwindcss/postcss`). Single static page in [frontend/app/page.tsx](frontend/app/page.tsx) rendered through [frontend/app/layout.tsx](frontend/app/layout.tsx); presentational components in [frontend/app/components/](frontend/app/components/) with CSS Modules alongside Tailwind utilities; static assets (logos, graphs) in [frontend/app/assets/](frontend/app/assets/). Path alias `@/*` maps to the `frontend/` root (see [tsconfig.json](frontend/tsconfig.json)).

### Commands (run from `frontend/`)

```bash
yarn dev      # next dev — local dev server on :3000
yarn build    # next build — production build
yarn start    # next start — serve the production build
yarn lint     # eslint (flat config in eslint.config.mjs)
```

### Toolchain pinning

This repo uses **yarn classic 1.22.x exclusively** — `packageManager: yarn@1.22.22` is set in [frontend/package.json](frontend/package.json) and CI activates it via Corepack. Node is pinned to **22.x** via [frontend/.nvmrc](frontend/.nvmrc) + `engines` + `engineStrict: true`; running `yarn install` on a different Node major fails fast. Do not use `npm install` or `pnpm install`; `package-lock.json`, `pnpm-lock.yaml`, and `bun.lockb` are gitignored as a guard.

## Architecture references

- [README.md](README.md) — components overview (frontend / backend / indexers / data layer).
- [docs/ArchitectureSpec.pdf](docs/ArchitectureSpec.pdf) — full system design. Read this before designing anything backend-side, since the code does not yet reflect the spec.
- [.plans/](.plans/) — in-progress design notes (e.g. `supply-chain-update.md`). Gitignored as personal scratch.

## Other

- Security disclosure process: [SECURITY.md](SECURITY.md) (report to `info@valory.xyz`).
- Contribution flow: [CONTRIBUTING.md](CONTRIBUTING.md) — fork, branch, PR.
