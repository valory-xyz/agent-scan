# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

AgentScan is an open-source, multi-chain scanner for tracking agents and related ecosystems (x402 / MCP / A2A). The project is **early/WIP**: only the [frontend/](frontend/) "Coming Soon" landing page is implemented. The backend (FastAPI), indexers, and data layer (Postgres, Redis) described in [README.md](README.md) and [docs/ArchitectureSpec.pdf](docs/ArchitectureSpec.pdf) do not yet exist in the tree — do not assume they do when reasoning about a task.

## Frontend (`frontend/`)

Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4 (via `@tailwindcss/postcss`). Single static page in [frontend/app/page.tsx](frontend/app/page.tsx) rendered through [frontend/app/layout.tsx](frontend/app/layout.tsx); presentational components in [frontend/app/components/](frontend/app/components/) with CSS Modules alongside Tailwind utilities; static assets (logos, graphs) in [frontend/app/assets/](frontend/app/assets/). Path alias `@/*` maps to the `frontend/` root (see [tsconfig.json](frontend/tsconfig.json)).

### Commands (run from `frontend/`)

```bash
npm run dev      # next dev — local dev server on :3000
npm run build    # next build — production build
npm run start    # next start — serve the production build
npm run lint     # eslint (flat config in eslint.config.mjs)
```

There is **no test runner configured**. Don't invent test commands; if tests are needed, set up the toolchain explicitly first.

### Package manager note

[frontend/package.json](frontend/package.json) ships with a committed `pnpm-lock.yaml`, but a `yarn.lock` is also present (currently untracked). Stick with **pnpm** for installs to keep the lockfile authoritative; if a contributor switches managers, only one lockfile should remain committed.

## Architecture references

- [README.md](README.md) — components overview (frontend / backend / indexers / data layer).
- [docs/ArchitectureSpec.pdf](docs/ArchitectureSpec.pdf) — full system design. Read this before designing anything backend-side, since the code does not yet reflect the spec.
- [.plans/](.plans/) — in-progress design notes (e.g. `supply-chain-update.md`). Treat as scratch, not authoritative.

## Other

- Security disclosure process: [SECURITY.md](SECURITY.md) (report to `info@valory.xyz`).
- Contribution flow: [CONTRIBUTING.md](CONTRIBUTING.md) — fork, branch, PR.
