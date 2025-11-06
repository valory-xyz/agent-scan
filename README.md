# 🧠 AgentScan

AgentScan is an open, modular scanner for tracking agents and related ecosystems (x402 / MCP / A2A / etc.) across multiple chains and off-chain protocols.  
It is designed to be fully open-source, multi-chain, and extensible.

> ⚠️ **Work in Progress:** AgentScan is under active development. Expect frequent updates and breaking changes.

---

## 📘 Architecture Spec
See the full system design here:  
👉 [docs/ArchitectureSpec.pdf](docs/ArchitectureSpec.pdf)

---

## 🧩 Components
- **Frontend:** Next.js (static + SWR + CDN)
- **Backend:** FastAPI (read-only, proxied via frontend)
- **Indexers:** Async workers for on-chain and off-chain data
- **Data Layer:** Postgres, Redis

---
