# 🎨 CORTEX OS — Cybernetic Design System Specification

## 1. Visual Philosophy: The Cybernetic Intelligence Core

The **CORTEX OS Design System** merges the visual aesthetics of aerospace telemetry, sci-fi command centers, and modern Swiss minimalist typography.

### Design Imperatives
- **Deep Obsidian Hierarchy**: Ultra-low-luminance background surfaces (`#05070D`, `#0A0E17`) to eliminate eye fatigue and maximize neon contrast.
- **High-Voltage Signal Accents**: Crisp, luminous neon hues reserved exclusively for operational state, anomaly telemetry, and primary actions.
- **Information Density with Cognitive Calm**: Hairline borders, precise monospace data counters, and subtle atmospheric fog create depth without visual noise.

---

## 2. Color Palette & Token Architecture

### Surface & Canvas Tokens (Void Obsidian)
| Token Name | Hex Code | Semantic Role |
| :--- | :---: | :--- |
| `--bg-void` | `#05070D` | Base application canvas & root backdrop |
| `--surface-base` | `#0A0E17` | Primary card containers & HUD panels |
| `--surface-elevated` | `#111827` | Modals, command palette, hover states |
| `--surface-subtle` | `#1E293B` | Inactive input wells, secondary tabs |
| `--border-hairline` | `rgba(0, 212, 255, 0.15)` | Ultra-fine HUD dividing lines |
| `--border-glow` | `rgba(0, 212, 255, 0.40)` | Active element focus glow |

### Atmospheric & Sentience State Accents
| Token Name | Hex Code | Role & Psychological Intent |
| :--- | :---: | :--- |
| `--accent-cyan` | `#00D4FF` | Primary operational state (`NOMINAL`), data pipelines, brand emblem |
| `--accent-violet` | `#7B2FFF` | Neural engine, agent communication, predictive horizons |
| `--accent-mint` | `#00FF9D` | Positive variance, data quality compliance, healthy forecasts |
| `--accent-amber` | `#FFB800` | Cautionary telemetry, warning state (`ELEVATED`), missing data alerts |
| `--accent-crimson` | `#FF0055` | Threat escalation (`CRITICAL`), severe Z-score anomalies, destructive actions |

---

## 3. Typography Architecture

### Font Families
- **Display & Headings**: *Orbitron* / *Inter Display* — Geometric, futuristic, ultra-clear at large scale.
- **Interface & Body**: *Inter* / *system-ui* — High x-height, optimized for micro-legibility.
- **Telemetry & Numbers**: *JetBrains Mono* / *Fira Code* — Monospace tabular figures ensuring decimal alignment in real-time updates.

---

## 4. Atmospheric Canvas & Motion Language

### Neural Particle Grid
- Pure hardware-accelerated CSS/SVG implementation.
- Nodes pulse with randomized sine-wave keyframes.
- Synaptic connection lines glow proportionally to system analysis activity.

### State Transitions
- **Nominal to Critical**: 400ms cubic-bezier transition shifting border glows and background radial gradients from Cyan to Crimson.
- **Command Palette Ingress**: 180ms ease-out scale $(0.98 \to 1.0)$ with 20px blur backdrop filter.
- **Presentation Deck Sliding**: Smooth horizontal translate with linear fade for frictionless boardroom projection.
