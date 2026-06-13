<div align="center">

# CORTEX OS

### The Operating System for Enterprise Intelligence

_A cinematic, autonomous enterprise intelligence interface — drop in a dataset, and CORTEX profiles it, forecasts it, detects anomalies, builds an adaptive dashboard, and narrates an executive briefing. All client-side, in real time._

[![CI](https://github.com/EnternalBlue07/CORTEX-OS/actions/workflows/ci.yml/badge.svg)](https://github.com/EnternalBlue07/CORTEX-OS/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-18-00D4FF)
![Vite](https://img.shields.io/badge/Vite-5-7B2FFF)
![License](https://img.shields.io/badge/license-MIT-00FF9D)

</div>

---

## Overview

CORTEX OS reimagines the analytics dashboard as a **living intelligence environment** — a cinematic operating system for enterprise data. It is not a chart grid. It is a reactive, spatial workspace with an autonomous AI core that profiles data, surfaces insight without prompting, escalates threats, and orchestrates a swarm of analysis agents.

The signature moment: **upload a CSV or Excel file and CORTEX autonomously generates intelligence** — KPIs, forecasts, anomalies, an executive summary, and strategic recommendations — with zero configuration.

> _Screenshots / GIFs:_ add `docs/hero.png`, `docs/boot.gif`, `docs/presentation.gif` and reference them here once captured.

---

## Key features

- **Cinematic boot sequence** — neural-core startup, streaming system checks, flash transition.
- **Living neural background** — nodes, synapses, signal pulses, fog, scanlines (pure CSS/SVG, no canvas).
- **Autonomous sentience layer** — self-escalating NOMINAL / ELEVATED / CRITICAL states with atmospheric lighting shifts, proactive insight interrupts, live reasoning chains, and an agent swarm visualization.
- **Real data intelligence** — CSV/Excel ingestion, schema detection, column classification, quality scoring.
- **Adaptive auto-dashboard** — inferred KPIs, contextual forecast chart with confidence bands, categorical breakdown, z-score anomalies.
- **Executive Presentation Mode** — one-click cinematic, keyboard-driven boardroom slide deck generated from the analysis.
- **AI copilot** — streaming chat backed by the Anthropic Messages API (with an offline simulated fallback).
- **Command palette** — ⌘K fullscreen, categorized, keyboard-navigable.
- **Performance mode** — ambient animation/timers automatically suspend during analysis and presentation.

---

## AI / analytics pipeline

Uploading a file triggers a real multi-agent pipeline (`src/engine.js`), each stage streaming live status to the UI:

| Stage | Agent | Work |
|-------|-------|------|
| 1 | Ingestion Agent | Parse CSV (PapaParse, streamed) / Excel (SheetJS) |
| 2 | Cleaning Agent | Schema detection, column classification, quality scoring |
| 3 | Insight Agent | Full-dataset statistics & KPI inference |
| 4 | Forecast Agent | Linear-trend forecast (R²-normalized confidence) + z-score anomalies |
| 5 | Visualization Agent | Adaptive dashboard + contextual chart selection |
| 6 | Reporting Agent | Executive insight synthesis |
| 7 | Strategy Agent | Strategic recommendations |

**Credibility by design:** numeric aggregates are computed over the full dataset; only type inference is sampled, and large files are explicitly flagged as **sampling mode**. Forecast confidence is clamped and blends fit quality with sample adequacy. Dates are validated across multiple formats; invalid rows are isolated.

---

## Architecture

```
src/
  CortexOS.jsx   # single-file cinematic UI (frozen visual system)
  engine.js      # modular, UI-agnostic data intelligence engine
  main.jsx       # React entry point
.github/workflows/ci.yml   # GitHub Actions: npm ci + build
.gitlab-ci.yml             # GitLab CI: npm ci + build
```

The visual system in `CortexOS.jsx` is intentionally a single file; all computation lives in the modular `engine.js` so analytics can evolve (or move server-side) without touching the interface.

---

## Tech stack

- **React 18** + **Vite 5**
- **Recharts** — forecast & breakdown charts
- **PapaParse** — streamed CSV/TSV parsing
- **SheetJS (xlsx)** — Excel ingestion
- **Anthropic Messages API** — streaming copilot (optional)
- Pure CSS animation — no animation libraries

---

## Setup

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
```

Optional live AI chat — copy `.env.example` to `.env` and set:

```
VITE_ANTHROPIC_API_KEY=your_key_here
```

Without a key, the copilot uses realistic simulated streaming responses.

> Security note: a `VITE_*` key is bundled into client JS and exposed to the browser. Use it only for local demos; for production, proxy Anthropic calls through a backend.

---

## Roadmap

- [x] Cinematic UI + sentience layer
- [x] Real client-side data intelligence engine
- [x] Auto-dashboard + Executive Presentation Mode
- [x] Build CI (npm ci + build)
- [ ] Runtime smoke test + MVP freeze
- [ ] Landing page + cinematic demo assets
- [ ] Backend intelligence engine (FastAPI + Polars)
- [ ] Deployment, onboarding, waitlist
- [ ] Public launch (Product Hunt / LinkedIn / X)

---

## Product philosophy

Dashboards show you data. CORTEX OS is built to make you _feel_ like you are operating an intelligence core — where the system thinks out loud, reacts to what it finds, and turns raw files into executive narrative on its own. The goal is not another SaaS chart tool; it is a believable, cinematic enterprise intelligence experience.

---

## License

MIT — see [LICENSE](./LICENSE).
