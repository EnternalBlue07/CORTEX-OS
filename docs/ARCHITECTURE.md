# 🏛️ CORTEX OS — Technical Architecture Specification

## 1. System Philosophy & Design Principles

**CORTEX OS** is architected as an **in-browser, zero-server autonomous intelligence environment**. The system challenges the convention that advanced data science and enterprise reporting require bloated cloud pipelines, heavy server runtimes, and external database infrastructure.

### Foundational Tenets
1. **Zero-Egress In-Memory Sandbox**: All row parsing, schema induction, statistical computations, and narrative synthesis execute directly in the browser's JavaScript V8/SpiderMonkey runtime. Not a single byte of uploaded data leaves the client sandbox.
2. **Deterministic Agent Swarm**: Complex data workflows are broken into discrete, single-responsibility agents that stream state, progress percentage, and rationale telemetry to the UI in real time.
3. **Statistical Integrity over Black-Box Hallucination**: Rather than sending raw tabular dumps to language models, CORTEX computes rigorous mathematical aggregations (mean, median, standard deviation, variance, two-tailed Z-scores, and least-squares regression) locally.
4. **Adaptive UI Morphing**: The visual presentation adapts dynamically to data cardinality, temporal density, and anomaly severity without requiring hardcoded dashboard layouts.

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BROWSER SANDBOX (RAM)                              │
│                                                                             │
│   ┌────────────────────────┐                   ┌────────────────────────┐   │
│   │   Raw File Ingestion   │                   │   ⌘K Command Palette   │   │
│   │   (CSV, TSV, XLSX)     │                   │   & Telemetry Feed     │   │
│   └───────────┬────────────┘                   └───────────▲────────────┘   │
│               │                                            │                │
│               ▼                                            │                │
│   ┌────────────────────────────────────────────────────────┴────────────┐   │
│   │                  AUTONOMOUS MULTI-AGENT SWARM                       │   │
│   │                                                                     │   │
│   │  1. Ingestion Agent    ──► 2. Cleaning Agent   ──► 3. Insight Agent │   │
│   │     (PapaParse/SheetJS)    (Schema & Quality)      (KPI Metrics)    │   │
│   │                                                         │           │   │
│   │  6. Reporting Agent    ◄── 5. Vis Agent        ◄── 4. Forecast Agent│   │
│   │     (Executive Digest)     (Adaptive Layouts)      (Regression/Z)   │   │
│   │          │                                                          │   │
│   │          ▼                                                          │   │
│   │  7. Strategy Agent     ──► Dynamic Risk Assessment & Prioritization │   │
│   └────────────────────────────────────────┬────────────────────────────┘   │
│                                            │                                │
│               ┌────────────────────────────┴────────────┐                   │
│               ▼                                         ▼                   │
│   ┌────────────────────────┐               ┌────────────────────────────┐   │
│   │   Cinematic HUD Core   │               │   Executive Presentation   │   │
│   │   (Atmospheric State,  │               │   (Boardroom Slide Deck,   │   │
│   │    Neural Mesh Canvas) │               │    Keyboard Navigation)    │   │
│   └────────────────────────┘               └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 7-Agent Pipeline

The core intelligence workflow in `src/engine.js` is partitioned into seven autonomous stages:

### Stage 1: Ingestion Agent
- **Streaming CSV/TSV Engine**: Implemented via PapaParse chunk streaming, preventing thread lockup when parsing large files.
- **Binary Workbook Ingestion**: Leverages SheetJS (`xlsx`) to extract sheet hierarchies, convert dates, and normalize heterogenous cell formats into tabular JSON.
- **Memory Guard**: Implements dynamic row limits with explicit UI telemetry notifying users when high-volume sampling mode is activated.

### Stage 2: Cleaning & Profiling Agent
- **Type Inference Engine**: Automatically identifies column types by evaluating entropy, distinct value counts, numeric density, and ISO date regex patterns.
- **Data Quality Index (DQI)**: Computes a composite health score based on completeness ratio, null distribution, variance stability, and anomaly density.
- **Column Role Induction**: Categorizes fields into Dimensions, Metrics, Date Horizons, or High-Cardinality Identifiers.

### Stage 3: Insight & Aggregation Agent
- **Full-Dataset Vector Computations**: Computes statistical primitives (Sums, Means, Medians, Min/Max, Standard Deviations, Quantiles) over raw typed arrays.
- **Key Performance Indicator (KPI) Selection**: Automatically identifies primary drivers (e.g. Revenue, Cost, Volume, Active Users) and pairs them with velocity indicators.

### Stage 4: Forecasting & Anomaly Agent
- **Least-Squares Linear Extrapolation**:
  $$y = \alpha + \beta x$$
  Computes slope $\beta$ and intercept $\alpha$ across normalized time indices.
- **Goodness-of-Fit Normalization ($R^2$)**:
  $$R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$$
  Calculates confidence interval bounds clamped between $0.40$ and $0.98$ depending on residual variance.
- **Two-Tailed Z-Score Anomaly Detection**:
  $$Z = \frac{x - \mu}{\sigma}$$
  Flags data points exceeding $|Z| > 2.58$ ($p < 0.01$) as critical deviations.

### Stage 5: Visualization Agent
- **Adaptive Layout Synthesis**: Selects optimal chart primitives based on data shape:
  - Temporal + Metric -> Dual-axis Area & Line Trend with Confidence Envelope.
  - Low-Cardinality Dimension -> Ranked Horizontal Bar Distribution.
  - Outlier Density -> Scatter Dispersion Matrix.

### Stage 6: Reporting Agent
- **Executive Summary Generation**: Translates numeric variance and trend directionality into concise, high-level corporate narrative bullet points.

### Stage 7: Strategy Agent
- **Actionable Strategic Synthesis**: Correlates anomalies and growth rates to produce three prioritized strategic imperatives (e.g., Supply Chain Optimization, APAC Expansion, R&D Acceleration).

---

## 4. Sentience Engine & Threat State Machine

CORTEX OS introduces a cybernetic atmospheric sentience system that adjusts the entire UI canvas based on analytical findings:

```
  ┌────────────────────────────────────────────────────────┐
  │                 ANALYTICAL METRICS EVAL                │
  └───────────────────────────┬────────────────────────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
     Anomaly Rate < 2%   Anomaly Rate 2-5%   Anomaly Rate > 5%
     DQI > 90%           DQI 75-90%          DQI < 75%
             │                │                │
             ▼                ▼                ▼
       ┌───────────┐    ┌───────────┐    ┌───────────┐
       │  NOMINAL  │    │ ELEVATED  │    │ CRITICAL  │
       │ (Cyan HUD)│    │(Amber HUD)│    │(Rose Alert│
       └───────────┘    └───────────┘    └───────────┘
```

- **NOMINAL State**: `#00D4FF` accents, smooth particle drift, relaxed telemetry heartbeat.
- **ELEVATED State**: `#FFB800` accents, increased synaptic pulse rate, prioritized warning banners.
- **CRITICAL State**: `#FF0055` accents, high-frequency glitch accents, emergency anomaly diagnostics HUD.

---

## 5. Client-Side Security & Zero-Trust Model

- **No Server Ingestion**: No file buffers are transmitted over WebSockets or HTTP POST.
- **No In-Memory Persist Risks**: Session datasets are isolated in JavaScript closures. Reloading the browser immediately wipes the ephemeral heap.
- **Safe Sandbox Execution**: No `eval()` or unsafe dynamic code execution paths are permitted.
