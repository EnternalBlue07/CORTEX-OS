# 🎨 CORTEX OS — Design System & Visual Specification

CORTEX OS bridges the gap between **high-stakes cyberpunk telemetry** and **minimalist enterprise boardroom elegance**. This document outlines the color tokens, typography scales, glassmorphism filters, and interaction patterns governing the interface.

---

## 1. Design Philosophies

- **Cyber-Executive Aesthetic:** Data interfaces should evoke the authority and precision of an advanced orbital operations console or high-frequency trading pit.
- **Data-Dense Yet Legible:** Maximize information density without clutter by employing high-contrast monospace micro-labels, subtle grid dividers, and semi-translucent glass panels.
- **Atmospheric Reactivity:** Colors are not decorative; they convey immediate operational reality. When an anomaly breaches safety tolerances, the environment visibly shifts to alert the operator.

---

## 2. Color Token Matrix

### 2.1. Cyber Obsidian Theme (Primary Engine)

| Token Name | Hex Code | Purpose & Usage |
| :--- | :---: | :--- |
| `void-bg` | `#060810` | Deep cosmic background; foundation for scanlines & neural fog |
| `obsidian-surface` | `#0B0F19` | Primary container surface; semi-translucent glass layer |
| `card-border` | `rgba(0, 229, 255, 0.15)` | Sleek high-tech border definition with subtle glow |
| `cyan-pulse` | `#00E5FF` | Primary action color, nominal telemetry, neural synapses |
| `violet-neural` | `#8B5CF6` | AI agent thoughts, machine learning vectors, secondary charts |
| `emerald-optimal` | `#10B981` | Positive KPI deltas, optimal health metrics, pass checks |
| `amber-warning` | `#F59E0B` | Elevated risk, data quality warnings, moderate anomalies |
| `crimson-alert` | `#EF4444` | Critical data outliers, systemic threats, urgent escalation |
| `text-primary` | `#F8FAFC` | Bright high-legibility foreground typography |
| `text-muted` | `#64748B` | Sub-labels, telemetry timestamps, structural metadata |

<br/>

### 2.2. Minimalist Slate Theme (Clean Office Mode)

For daylight boardroom presentations or executives desiring a distraction-free white paper aesthetic:

| Token Name | Hex Code | Purpose & Usage |
| :--- | :---: | :--- |
| `slate-bg` | `#F8FAFC` | Slate 50 ultra-clean light grey foundation |
| `slate-surface` | `#FFFFFF` | Crisp pure white floating cards |
| `slate-border` | `#E2E8F0` | Clean hairline slate borders |
| `indigo-accent` | `#4F46E5` | Deep corporate indigo for primary buttons & trend lines |
| `text-dark` | `#0F172A` | Slate 900 high-contrast typography |

---

## 3. Typography Scale

CORTEX OS combines **Inter** for human-readable narrative and **JetBrains Mono** for quantitative telemetry:

```
Display Large:      32px / Line Height: 1.2   / Inter Bold (700)
Section Header:     20px / Line Height: 1.3   / Inter SemiBold (600)
Body Text:          14px / Line Height: 1.5   / Inter Regular (400)
KPI Metric Callout: 28px / Line Height: 1.1   / JetBrains Mono Bold (700)
Telemetry Label:    11px / Tracking: +0.08em  / JetBrains Mono Medium (500)
Micro-Timestamp:     9px / Tracking: +0.05em  / JetBrains Mono Regular (400)
```

---

## 4. Glassmorphism & Shader Recipe

To achieve the signature holographic floating card effect without impacting 60fps rendering performance:

```css
/* Core Glass Panel Specification */
.cortex-glass-panel {
  background: rgba(11, 15, 25, 0.75);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(0, 229, 255, 0.12);
  border-radius: 10px;
  box-shadow: 
    0 4px 24px -1px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.cortex-glass-panel:hover {
  border-color: rgba(0, 229, 255, 0.35);
  box-shadow: 
    0 8px 32px -2px rgba(0, 229, 255, 0.15),
    inset 0 1px 0 0 rgba(0, 229, 255, 0.2);
}
```

---

## 5. Micro-Animations & Sound FX Spec

1. **Neural Pulse:** Synaptic nodes in the background mesh breathe with an 8-second sinusoidal cycle (`cubic-bezier(0.4, 0, 0.6, 1)`).
2. **KPI Jitter:** Telemetry numbers execute a subtle ±0.05% visual oscillation to signify active polling.
3. **Card Entrance:** Ingested cards cascade into view with a 15ms stagger and a gentle 8px slide-up transform.
4. **Haptic Audio (Optional):** Crisp 44.1kHz micro-clicks on navigation, and a deep resonance chord on dataset initialization.
