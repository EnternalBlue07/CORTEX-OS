import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ComposedChart, LineChart, BarChart, Bar, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { parseFile, runPipeline, PIPELINE, validateFile } from './engine.js';

/* ================= CORTEX OS — palette ================= */
const C = {
  bg: '#020408',
  deep: 'rgba(8,16,32,0.82)',
  panel: 'rgba(12,18,36,0.74)',
  cyan: '#00D4FF',
  violet: '#7B2FFF',
  green: '#00FF9D',
  amber: '#FF6B35',
  red: '#FF2D55',
  text: '#E8F4FF',
  sub: '#6B8FAF',
  border: 'rgba(0,212,255,0.12)',
  glow: 'rgba(0,212,255,0.18)',
};

const SYSTEM_PROMPT = 'You are CORTEX, the enterprise AGI intelligence core of a trillion-dollar corporation. Respond like an elite AI CFO + strategist + operations analyst hybrid. Use structured bullets, confidence scores, executive tone, and strategic recommendations.';

/* ================= static data ================= */
const NAV = [
  ['\u25C9', 'Intelligence Feed'], ['\u2B22', 'Data Nexus'], ['\u27C1', 'AI Agents'], ['\u223F', 'Neural Forecasting'],
  ['\u25A6', 'Anomaly Grid'], ['\u2263', 'Executive Reports'], ['\u265F', 'Strategy Matrix'], ['\u25CE', 'Live Operations'],
  ['\u26A0', 'Threat Analysis'], ['\u26E8', 'Governance Layer'], ['\u2699', 'Settings'],
];

const SOURCES = ['Snowflake', 'Salesforce', 'SAP', 'PostgreSQL', 'Stripe', 'AWS S3', 'BigQuery', 'Databricks'];

const THOUGHTS = [
  ['Correlating churn acceleration across 14 enterprise accounts…', 'CORRELATION'],
  ['Detected revenue anomaly in APAC logistics cluster.', 'ANOMALY'],
  ['Forecast confidence increased to 91%.', 'FORECAST'],
  ['Cross-referencing Salesforce with Stripe payment lag.', 'SYNTHESIS'],
  ['Board report generation entering synthesis phase.', 'REPORTING'],
  ['Re-weighting Q3 demand signals from 2,400 data streams.', 'FORECAST'],
  ['Isolating margin compression in EU manufacturing vertical.', 'ANOMALY'],
  ['Strategy matrix recalibrated against competitor pricing shift.', 'STRATEGY'],
  ['Encrypting executive intelligence packet for distribution.', 'GOVERNANCE'],
  ['Agent swarm consensus reached on retention playbook.', 'ORCHESTRATION'],
];

const AGENTS = [
  ['Revenue Agent', 'Reconciling Q3 pipeline against Stripe settlements', '#00D4FF'],
  ['Forecast Agent', 'Re-training demand model on 90-day window', '#7B2FFF'],
  ['Anomaly Agent', 'Sweeping APAC logistics cluster for outliers', '#FF6B35'],
  ['Strategy Agent', 'Simulating competitor pricing counter-moves', '#00FF9D'],
  ['Report Agent', 'Synthesizing board-level executive brief', '#00D4FF'],
  ['Risk Agent', 'Stress-testing FX exposure across 12 currencies', '#FF2D55'],
];

const INIT_ALERTS = [
  { id: 1, sev: 'CRITICAL', color: '#FF2D55', title: 'Revenue anomaly — APAC logistics', src: 'Anomaly Agent · Snowflake', rec: 'Freeze auto-renewal discounts; deploy retention agent within 72h.' },
  { id: 2, sev: 'WARNING', color: '#FF6B35', title: 'Stripe settlement lag rising (+340ms)', src: 'Risk Agent · Stripe', rec: 'Route settlements through secondary processor until lag normalizes.' },
  { id: 3, sev: 'INFO', color: '#00D4FF', title: 'Forecast model v412 promoted to production', src: 'Forecast Agent', rec: 'Review confidence-band deltas in Neural Forecasting.' },
];

const COMMANDS = [
  ['🔍 Analyze', 'Run revenue anomaly scan', 'A S'],
  ['🔍 Analyze', 'Correlate churn signals across CRM', 'A C'],
  ['📊 Create', 'Generate board-level report', 'C B'],
  ['📊 Create', 'New forecast scenario', 'C F'],
  ['🤖 Agents', 'Deploy retention agent', 'G R'],
  ['🤖 Agents', 'Pause anomaly sweep', 'G P'],
  ['⚡ Quick Actions', 'Sync all data sources', 'Q S'],
  ['⚡ Quick Actions', 'Snapshot intelligence graph', 'Q G'],
  ['🧠 Intelligence', 'Ask CORTEX (open copilot)', 'I A'],
  ['🧠 Intelligence', 'Explain latest forecast shift', 'I E'],
  ['🚨 Threat Systems', 'Escalate critical alerts', 'T E'],
  ['🚨 Threat Systems', 'Run full threat sweep', 'T S'],
];

const INSIGHTS = [
  ['REVENUE OPPORTUNITY', 'NA enterprise expansion window detected — projected +$6.8M if pipeline shifts within 14 days.', 96],
  ['CHURN INTERVENTION', 'Two APAC accounts show pre-churn signature 41 days early. Retention playbook staged.', 89],
  ['MARGIN SIGNAL', 'EU manufacturing margin compression accelerating — recommend cost-model rerun.', 84],
  ['FORECAST SHIFT', 'Demand curve inflection detected; Q4 projection may rise 3.1%.', 91],
  ['LIQUIDITY WINDOW', 'FX volatility window favorable for treasury rebalance in next 48h.', 87],
];

const CHAINS = [
  ['STRIPE LAG', 'PAYMENT GRAPH', 'CHURN MODEL', 'APAC RISK Δ'],
  ['CRM SIGNALS', 'COHORT DRIFT', 'LTV RECALC', 'FORECAST Δ'],
  ['SAP ORDERS', 'SUPPLY GRAPH', 'MARGIN MODEL', 'EU ALERT'],
  ['NEWS FEEDS', 'COMPETITOR Δ', 'PRICING SIM', 'STRATEGY REC'],
];

const CRITICAL_EVENTS = [
  'Cascade churn risk detected across enterprise tier — engaging containment.',
  'Forecast variance breach: APAC revenue stream destabilizing.',
  'Settlement pipeline integrity degraded — rerouting financial flows.',
];

const KPIS = [
  { label: 'REVENUE INTELLIGENCE', target: 128.4, fmt: (v) => '$' + v.toFixed(1) + 'M', delta: '+12.4%', color: '#00D4FF', jit: 0.4 },
  { label: 'CHURN PROBABILITY', target: 3.2, fmt: (v) => v.toFixed(1) + '%', delta: '-0.8%', color: '#FF6B35', jit: 0.15 },
  { label: 'FORECAST ACCURACY', target: 94.7, fmt: (v) => v.toFixed(1) + '%', delta: '+2.1%', color: '#00FF9D', jit: 0.3 },
  { label: 'OPERATIONAL RISK', target: 18, fmt: (v) => Math.round(v) + '/100', delta: '-4pts', color: '#FF2D55', jit: 1.2 },
  { label: 'AGENT THROUGHPUT', target: 1847, fmt: (v) => Math.round(v).toLocaleString() + '/s', delta: '+218', color: '#7B2FFF', jit: 40 },
  { label: 'LIVE STREAMS', target: 312, fmt: (v) => String(Math.round(v)), delta: '+9', color: '#00D4FF', jit: 4 },
];

const BOOT_LINES = [
  'Initializing neural agents...',
  'Connecting enterprise nodes...',
  'Synchronizing intelligence graph...',
  'Forecast engine online...',
  'Threat analysis operational...',
];

/* ================= helpers ================= */
const rand = (a, b) => a + Math.random() * (b - a);

const NODES = Array.from({ length: 14 }, (_, i) => ({ id: i, x: rand(4, 96), y: rand(6, 94), s: rand(4, 9), d: rand(0, 6) }));
const LINKS = NODES.flatMap((n) => [...NODES].filter((o) => o.id > n.id)
  .sort((a, b) => ((a.x - n.x) ** 2 + (a.y - n.y) ** 2) - ((b.x - n.x) ** 2 + (b.y - n.y) ** 2)).slice(0, 2)
  .map((o, j) => ({ key: n.id + '-' + o.id + '-' + j, x1: n.x, y1: n.y, x2: o.x, y2: o.y, d: rand(0, 8) })));
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({ id: i, x: rand(0, 100), y: rand(0, 100), s: rand(1.5, 3.5), d: rand(0, 14), t: rand(12, 26) }));

const makeChart = () => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  let v = 42;
  return months.map((m, i) => {
    v += 3.2 + Math.random() * 5.5;
    const hist = i <= 7 ? +v.toFixed(1) : null;
    const fc = i >= 7 ? +(v + (i - 7) * 2.6).toFixed(1) : null;
    const band = fc != null ? [+(fc - 3.5 - (i - 7) * 1.8).toFixed(1), +(fc + 3.5 + (i - 7) * 1.8).toFixed(1)] : null;
    return { m, hist, fc, band };
  });
};

const mkThought = (t) => ({ id: Math.random(), text: t[0], type: t[1], conf: Math.round(rand(82, 98)), time: new Date().toLocaleTimeString('en-GB') });
const genNexus = (name) => ({ name, lat: Math.round(rand(8, 42)), tp: rand(0.4, 3.2).toFixed(1), health: Math.random() > 0.06 ? 'OPTIMAL' : 'DEGRADED' });

function simulatedReply(q) {
  return 'ANALYSIS COMPLETE — parsed across 8 connected systems.\n\n• Query focus: ' + q + '\n• Revenue trajectory: +12.4% QoQ, momentum concentrated in NA enterprise — confidence 92%\n• Churn exposure: 14 APAC logistics accounts flagged, ARR at risk $4.2M — confidence 87%\n• Forecast engine: Q3 projection revised upward to $128.4M — confidence 91%\n\nRECOMMENDATIONS\n1. Deploy retention agents against flagged APAC accounts within 72h.\n2. Reallocate 8% of pipeline capacity toward NA enterprise expansion.\n3. Authorize automated board synthesis report for Friday review.\n\nSOURCES: Snowflake · Salesforce · Stripe · SAP';
}

async function streamAnthropic(history, onDelta) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1024, stream: true, system: SYSTEM_PROMPT, messages: history }),
    });
    if (!res.ok || !res.body) return false;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const r = await reader.read();
      if (r.done) break;
      buf += dec.decode(r.value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const ev = JSON.parse(line.slice(6));
          if (ev.type === 'content_block_delta' && ev.delta && ev.delta.text) onDelta(ev.delta.text);
        } catch (e) { /* keep streaming */ }
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

/* ================= styles ================= */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; background: #020408; }
body { font-family: 'Inter', sans-serif; color: #E8F4FF; overflow-x: hidden; }
::selection { background: rgba(0,212,255,0.3); }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 3px; }

.cx-root { min-height: 100vh; position: relative; }

/* ---- living neural background ---- */
.cx-bg { position: fixed; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
.cx-gridlines { position: absolute; inset: 0; opacity: 0.5; background-image: linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px); background-size: 48px 48px; animation: gridDrift 40s linear infinite; }
.cx-fog { position: absolute; width: 60vw; height: 60vw; border-radius: 50%; filter: blur(60px); opacity: 0.35; animation: fogFloat 26s ease-in-out infinite alternate; }
.cx-net { position: absolute; inset: 0; width: 100%; height: 100%; }
.cx-node { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(0,212,255,0.9), rgba(0,212,255,0.1) 70%); box-shadow: 0 0 14px rgba(0,212,255,0.5); animation: nodePulse 5s ease-in-out infinite; }
.cx-particle { position: absolute; border-radius: 50%; background: #00D4FF; opacity: 0.35; animation: drift linear infinite; }
.cx-scan { position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(0,212,255,0.012) 0 1px, transparent 1px 4px); }
.cx-scanline { position: absolute; left: 0; right: 0; height: 120px; background: linear-gradient(180deg, transparent, rgba(0,212,255,0.05), transparent); animation: scanMove 9s linear infinite; }
.cx-streak { position: absolute; width: 40vw; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,212,255,0.35), transparent); animation: streak 11s linear infinite; }
@keyframes gridDrift { to { background-position: 48px 48px; } }
@keyframes fogFloat { from { transform: translate(-6%, -4%); } to { transform: translate(6%, 5%); } }
@keyframes nodePulse { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.5); opacity: 1; } }
@keyframes drift { from { transform: translateY(0); } to { transform: translateY(-110vh); } }
@keyframes scanMove { from { top: -15%; } to { top: 110%; } }
@keyframes streak { 0% { transform: translateX(-50vw); opacity: 0; } 10% { opacity: 1; } 60% { opacity: 0; } 100% { transform: translateX(150vw); opacity: 0; } }
@keyframes dashFlow { to { stroke-dashoffset: -120; } }

/* ---- boot ---- */
.cx-boot { position: fixed; inset: 0; z-index: 100; background: #020408; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cx-boot.flash { animation: bootFlash 0.45s ease-out forwards; }
@keyframes bootFlash { 0% { filter: brightness(1); } 40% { filter: brightness(3); background: rgba(0,212,255,0.25); } 100% { opacity: 0; filter: brightness(1); } }
.cx-boot-pulse { position: absolute; width: 120px; height: 120px; border-radius: 50%; border: 1px solid rgba(0,212,255,0.5); animation: bootPulse 1.4s ease-out infinite; }
@keyframes bootPulse { from { transform: scale(0.3); opacity: 1; } to { transform: scale(2.2); opacity: 0; } }
.cx-hex { width: 84px; height: 96px; clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); background: linear-gradient(160deg, rgba(0,212,255,0.7), rgba(123,47,255,0.7)); animation: hexBeat 1.6s ease-in-out infinite; }
@keyframes hexBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.07); } }
.cx-boot-title { font-family: 'Space Grotesk'; font-size: 44px; font-weight: 700; letter-spacing: 14px; margin-top: 28px; animation: fadeUp 0.8s ease both; text-shadow: 0 0 30px rgba(0,212,255,0.5); }
.cx-boot-lines { margin-top: 22px; font-family: 'JetBrains Mono'; font-size: 12px; color: #6B8FAF; min-height: 110px; width: 340px; }
.cx-boot-line { animation: fadeUp 0.4s ease both; line-height: 1.8; }
.cx-boot-line .ok { color: #00FF9D; }
.cx-boot-prog { width: 320px; height: 3px; background: rgba(0,212,255,0.12); margin-top: 18px; border-radius: 2px; overflow: hidden; }
.cx-boot-prog > div { height: 100%; background: linear-gradient(90deg, #00D4FF, #7B2FFF); box-shadow: 0 0 12px rgba(0,212,255,0.8); transition: width 0.08s linear; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* ---- app shell ---- */
/* IMPORTANT: DO NOT use transform in appIn keyframes — it creates a new containing block for position:fixed children (orb, chat panel), causing them to go off-screen */
.cx-app { position: relative; z-index: 1; animation: appIn 0.9s ease both; }
@keyframes appIn { from { opacity: 0; } to { opacity: 1; } }

/* ---- sidebar ---- */
.cx-side { position: fixed; left: 14px; top: 14px; bottom: 14px; width: 72px; z-index: 30; background: rgba(8,16,32,0.82); border: 1px solid rgba(0,212,255,0.12); border-radius: 18px; backdrop-filter: blur(18px); transition: width 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 8px 40px rgba(0,0,0,0.6); }
.cx-side:hover { width: 260px; box-shadow: 0 8px 60px rgba(0,212,255,0.15), 0 8px 40px rgba(0,0,0,0.6); }
.cx-side:hover .cx-nav-label, .cx-side:hover .cx-sys-detail { opacity: 1; transform: none; }
.cx-side:hover .cx-logo-name, .cx-side:hover .cx-logo-tag { opacity: 1; max-width: 200px; }
.cx-logo { display: flex; align-items: center; gap: 14px; padding: 18px 16px; flex: 0 0 auto; overflow: hidden; }
.cx-core { position: relative; width: 40px; height: 40px; flex: 0 0 40px; filter: drop-shadow(0 0 10px rgba(0,212,255,0.45)); }
.cx-core-ring { position: absolute; inset: 0; border-radius: 50%; border: 1px solid rgba(0,212,255,0.6); border-top-color: transparent; animation: spin 3.2s linear infinite; }
.cx-core-hex { position: absolute; inset: 10px; clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); background: linear-gradient(160deg, #00D4FF, #7B2FFF); animation: hexBeat 1.8s ease-in-out infinite; }
.cx-core-orb { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: #00FF9D; top: 50%; left: 50%; margin: -2.5px; animation: orbit 2.6s linear infinite; box-shadow: 0 0 8px #00FF9D; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes orbit { from { transform: rotate(0) translateX(22px); } to { transform: rotate(360deg) translateX(22px); } }
.cx-logo-name { font-family: 'Space Grotesk'; font-weight: 700; letter-spacing: 3px; font-size: 15px; white-space: nowrap; opacity: 0; max-width: 0; overflow: hidden; transition: opacity 0.35s ease, max-width 0.45s cubic-bezier(0.22,1,0.36,1); }
.cx-logo-tag { font-size: 8.5px; color: #6B8FAF; letter-spacing: 1px; white-space: nowrap; opacity: 0; max-width: 0; overflow: hidden; transition: opacity 0.35s ease, max-width 0.45s cubic-bezier(0.22,1,0.36,1); }
.cx-nav { flex: 1; padding: 6px 12px; overflow: hidden; }
.cx-nav-item { display: flex; align-items: center; gap: 14px; padding: 9px 12px; border-radius: 10px; cursor: pointer; position: relative; color: #6B8FAF; transition: all 0.25s; white-space: nowrap; margin-bottom: 2px; }
.cx-nav-item:hover { color: #E8F4FF; background: rgba(0,212,255,0.06); box-shadow: inset 0 0 18px rgba(0,212,255,0.05); }
.cx-nav-item.active { color: #00D4FF; background: rgba(0,212,255,0.09); }
.cx-nav-item.active::before { content: ''; position: absolute; left: 0; top: 20%; bottom: 20%; width: 2.5px; border-radius: 2px; background: #00D4FF; box-shadow: 0 0 10px #00D4FF; animation: softPulse 2s ease-in-out infinite; }
@keyframes softPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
.cx-nav-icon { width: 22px; text-align: center; font-size: 14px; flex: 0 0 22px; }
.cx-nav-label { font-size: 13px; opacity: 0; transform: translateX(-6px); transition: all 0.35s; }
.cx-sys { padding: 14px 16px; border-top: 1px solid rgba(0,212,255,0.12); font-family: 'JetBrains Mono'; font-size: 10px; flex: 0 0 auto; }
.cx-sys-row { display: flex; align-items: center; gap: 8px; color: #00FF9D; letter-spacing: 1px; white-space: nowrap; }
.cx-dot { width: 7px; height: 7px; border-radius: 50%; background: #00FF9D; box-shadow: 0 0 8px #00FF9D; animation: softPulse 1.6s ease-in-out infinite; flex: 0 0 7px; }
.cx-sys-detail { color: #6B8FAF; margin-top: 6px; opacity: 0; transition: opacity 0.35s; line-height: 1.7; white-space: nowrap; }

/* ---- main / topbar ---- */
.cx-main { margin-left: 104px; padding: 18px 22px 100px; position: relative; z-index: 1; }
.cx-top { position: sticky; top: 14px; z-index: 20; display: flex; align-items: center; gap: 12px; background: rgba(8,16,32,0.82); border: 1px solid rgba(0,212,255,0.12); border-radius: 16px; backdrop-filter: blur(18px); padding: 10px 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.5); }
.cx-crumb { font-family: 'JetBrains Mono'; font-size: 9.5px; color: #6B8FAF; letter-spacing: 1px; line-height: 1.6; flex-shrink: 0; }
.cx-module { font-family: 'Space Grotesk'; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; white-space: nowrap; }
.cx-omni { flex: 1; min-width: 180px; display: flex; align-items: center; gap: 10px; background: rgba(2,4,8,0.6); border: 1px solid rgba(0,212,255,0.18); border-radius: 12px; padding: 9px 14px; color: #6B8FAF; font-size: 13px; cursor: pointer; animation: omniPulse 3.5s ease-in-out infinite; transition: all 0.3s; }
.cx-omni:hover { border-color: rgba(0,212,255,0.45); color: #E8F4FF; box-shadow: 0 0 24px rgba(0,212,255,0.18); }
@keyframes omniPulse { 0%, 100% { box-shadow: inset 0 2px 8px rgba(0,0,0,0.5); } 50% { box-shadow: inset 0 2px 8px rgba(0,0,0,0.5), 0 0 18px rgba(0,212,255,0.14); } }
.cx-kbd { font-family: 'JetBrains Mono'; font-size: 10px; border: 1px solid rgba(0,212,255,0.25); border-radius: 5px; padding: 2px 6px; color: #00D4FF; flex-shrink: 0; }
.cx-ticker { width: 200px; overflow: hidden; flex-shrink: 0; -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }
.cx-ticker-track { display: flex; gap: 22px; white-space: nowrap; width: max-content; animation: ticker 20s linear infinite; font-family: 'JetBrains Mono'; font-size: 10px; }
@keyframes ticker { to { transform: translateX(-50%); } }
.cx-tick-label { color: #6B8FAF; }
.cx-tick-val { color: #00D4FF; font-weight: 600; }
.cx-bell { position: relative; cursor: pointer; font-size: 15px; filter: grayscale(0.6); flex-shrink: 0; }
.cx-bell::after { content: ''; position: absolute; top: -1px; right: -2px; width: 7px; height: 7px; border-radius: 50%; background: #FF2D55; box-shadow: 0 0 8px #FF2D55; animation: softPulse 1.6s infinite; }
.cx-avatar { width: 32px; height: 32px; border-radius: 10px; background: linear-gradient(140deg, #00D4FF, #7B2FFF); display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk'; font-weight: 700; font-size: 12px; color: #020408; box-shadow: 0 0 16px rgba(0,212,255,0.3); flex-shrink: 0; }
.cx-tier { font-family: 'JetBrains Mono'; font-size: 8.5px; letter-spacing: 1px; color: #7B2FFF; border: 1px solid rgba(123,47,255,0.4); padding: 3px 7px; border-radius: 6px; background: rgba(123,47,255,0.08); white-space: nowrap; flex-shrink: 0; }
@media (max-width: 1300px) { .cx-ticker { display: none; } .cx-crumb.cx-dt { display: none; } }
@media (max-width: 1100px) { .cx-tier { display: none; } }

/* ---- workspace ---- */
.cx-grid3 { display: grid; grid-template-columns: 290px minmax(0,1fr) 310px; gap: 16px; margin-top: 16px; align-items: start; }
.cx-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
@media (max-width: 1400px) {
  .cx-grid3 { grid-template-columns: 260px minmax(0,1fr); }
  .cx-col-right { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
}
.panel { background: rgba(12,18,36,0.74); border: 1px solid rgba(0,212,255,0.12); border-radius: 16px; backdrop-filter: blur(18px); padding: 16px; position: relative; overflow: hidden; transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s, border-color 0.35s; box-shadow: 0 10px 36px rgba(0,0,0,0.45); }
.panel:hover { transform: translateY(-2px); border-color: rgba(0,212,255,0.28); box-shadow: 0 16px 50px rgba(0,0,0,0.5), 0 0 32px rgba(0,212,255,0.10); }
.panel::after { content: ''; position: absolute; top: 0; left: -80%; width: 60%; height: 100%; background: linear-gradient(105deg, transparent, rgba(0,212,255,0.045), transparent); transform: skewX(-18deg); transition: left 0.7s ease; pointer-events: none; }
.panel:hover::after { left: 130%; }
.panel-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.panel-title { font-family: 'Space Grotesk'; font-size: 11.5px; font-weight: 600; letter-spacing: 2.5px; display: flex; align-items: center; gap: 8px; }
.live-chip { font-family: 'JetBrains Mono'; font-size: 9px; color: #00FF9D; letter-spacing: 1px; }

/* ---- reasoning feed ---- */
.feed-item { border: 1px solid rgba(0,212,255,0.08); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; background: rgba(2,4,8,0.35); animation: feedIn 0.5s cubic-bezier(0.22,1,0.36,1) both; transition: all 0.25s; }
.feed-item:hover { border-color: rgba(0,212,255,0.3); box-shadow: 0 0 18px rgba(0,212,255,0.08); }
@keyframes feedIn { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: none; } }
.feed-meta { display: flex; justify-content: space-between; font-family: 'JetBrains Mono'; font-size: 9px; color: #6B8FAF; margin-bottom: 5px; }
.feed-type { color: #7B2FFF; letter-spacing: 1px; }
.feed-conf { color: #00FF9D; }
.feed-text { font-size: 12px; line-height: 1.45; }
.feed-bar { height: 2px; background: rgba(0,212,255,0.1); border-radius: 2px; margin-top: 8px; overflow: hidden; }
.feed-bar > div { height: 100%; background: linear-gradient(90deg, #00D4FF, #7B2FFF); animation: barGrow 2.4s ease both; box-shadow: 0 0 8px rgba(0,212,255,0.6); }
@keyframes barGrow { from { width: 0; } }

/* ---- data nexus ---- */
.nexus-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.nexus-card { border: 1px solid rgba(0,212,255,0.08); border-radius: 10px; padding: 9px 10px; background: rgba(2,4,8,0.35); font-family: 'JetBrains Mono'; transition: all 0.25s; }
.nexus-card:hover { border-color: rgba(0,212,255,0.3); transform: translateY(-1px); box-shadow: 0 0 16px rgba(0,212,255,0.07); }
.nexus-name { font-size: 10.5px; display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
.nexus-stat { font-size: 9px; color: #6B8FAF; display: flex; justify-content: space-between; line-height: 1.7; }
.nexus-stat b { color: #00D4FF; font-weight: 500; }

/* ---- KPIs ---- */
.kpi-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
@media (min-width: 1500px) { .kpi-strip { grid-template-columns: repeat(6, 1fr); } }
.kpi { padding: 12px 13px; animation: fadeUp 0.6s ease both; }
.kpi-label { font-family: 'JetBrains Mono'; font-size: 8px; letter-spacing: 1.2px; color: #6B8FAF; line-height: 1.4; word-break: break-word; white-space: normal; }
.kpi-val { font-family: 'Space Grotesk'; font-size: 22px; font-weight: 700; margin: 4px 0 2px; line-height: 1.1; }
.kpi-delta { font-family: 'JetBrains Mono'; font-size: 9px; color: #00FF9D; }
@keyframes sparkDraw { to { stroke-dashoffset: 0; } }

/* ---- agents ---- */
.agent { display: flex; gap: 11px; border: 1px solid rgba(0,212,255,0.08); border-radius: 11px; padding: 10px; margin-bottom: 8px; background: rgba(2,4,8,0.35); transition: all 0.25s; }
.agent:hover { border-color: rgba(0,212,255,0.28); transform: translateX(2px); box-shadow: 0 0 16px rgba(0,212,255,0.07); }
.agent-av { width: 38px; height: 38px; border-radius: 11px; flex: 0 0 38px; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk'; font-weight: 700; font-size: 15px; animation: avBeat 2.4s ease-in-out infinite; }
@keyframes avBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
.badge { font-family: 'JetBrains Mono'; font-size: 8px; letter-spacing: 1px; border: 1px solid; border-radius: 5px; padding: 2px 6px; }
.think { display: inline-flex; gap: 3px; align-items: center; }
.think i { width: 4px; height: 4px; border-radius: 50%; background: #00D4FF; animation: thinkB 1.2s ease-in-out infinite; }
.think i:nth-child(2) { animation-delay: 0.15s; }
.think i:nth-child(3) { animation-delay: 0.3s; }
@keyframes thinkB { 0%, 100% { opacity: 0.25; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }

/* ---- threat grid ---- */
.alert { border-radius: 12px; padding: 11px 12px; margin-bottom: 9px; background: rgba(2,4,8,0.4); border: 1px solid; animation: alertPulse 2.8s ease-in-out infinite; }
@keyframes alertPulse { 0%, 100% { box-shadow: 0 0 0 transparent; } 50% { box-shadow: 0 0 20px var(--ag); } }

/* ---- orb + chat ---- */
.orb-wrap { position: fixed; right: 26px; bottom: 26px; z-index: 40; animation: orbFloat 5s ease-in-out infinite; cursor: pointer; }
@keyframes orbFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
.orb { position: relative; width: 62px; height: 62px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, rgba(0,212,255,0.95), rgba(123,47,255,0.9) 70%); box-shadow: 0 0 30px rgba(0,212,255,0.4), 0 10px 30px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(232,244,255,0.25); transition: transform 0.3s; font-size: 20px; color: #020408; }
.orb-wrap:hover .orb { transform: scale(1.1); }
.orb::before { content: ''; position: absolute; inset: -8px; border-radius: 50%; border: 1px solid rgba(0,212,255,0.35); animation: orbBreathe 2.4s ease-in-out infinite; }
@keyframes orbBreathe { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.18); opacity: 0.2; } }
.chat { position: fixed; top: 0; right: 0; bottom: 0; width: 460px; max-width: 94vw; z-index: 50; background: rgba(8,16,32,0.92); border-left: 1px solid rgba(0,212,255,0.18); backdrop-filter: blur(24px); display: flex; flex-direction: column; transform: translateX(102%); transition: transform 0.5s cubic-bezier(0.22,1,0.36,1); box-shadow: -20px 0 60px rgba(0,0,0,0.6); }
.chat.open { transform: none; }
.chat-h { padding: 16px 18px; border-bottom: 1px solid rgba(0,212,255,0.12); display: flex; align-items: center; gap: 10px; }
.chat-body { flex: 1; overflow-y: auto; padding: 16px; }
.msg { margin-bottom: 14px; max-width: 88%; animation: feedIn 0.4s ease both; }
.msg.user { margin-left: auto; }
.msg-bubble { border-radius: 12px; padding: 10px 13px; font-size: 12.5px; line-height: 1.55; }
.msg.user .msg-bubble { background: rgba(0,212,255,0.10); border: 1px solid rgba(0,212,255,0.25); }
.msg.ai .msg-bubble { background: rgba(2,4,8,0.6); border: 1px solid rgba(123,47,255,0.25); font-family: 'JetBrains Mono'; font-size: 11.5px; }
.msg-line.b { color: #00D4FF; }
.msg-line.h { color: #7B2FFF; letter-spacing: 1.5px; font-weight: 700; margin-top: 6px; }
.msg-line.src { color: #00FF9D; }
.caret { display: inline-block; width: 7px; height: 13px; background: #00D4FF; animation: blink 0.8s steps(1) infinite; vertical-align: text-bottom; margin-left: 2px; }
@keyframes blink { 50% { opacity: 0; } }
.chat-input { display: flex; gap: 9px; padding: 14px; border-top: 1px solid rgba(0,212,255,0.12); }
.chat-input input { flex: 1; background: rgba(2,4,8,0.6); border: 1px solid rgba(0,212,255,0.18); border-radius: 10px; padding: 11px 13px; color: #E8F4FF; font-size: 12.5px; outline: none; font-family: 'Inter'; transition: all 0.25s; }
.chat-input input:focus { border-color: rgba(0,212,255,0.5); box-shadow: 0 0 16px rgba(0,212,255,0.15); }
.chat-send { background: linear-gradient(140deg, #00D4FF, #7B2FFF); border: none; border-radius: 10px; padding: 0 16px; color: #020408; font-weight: 700; cursor: pointer; font-family: 'Space Grotesk'; }

/* ---- command palette ---- */
.pal-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(2,4,8,0.6); backdrop-filter: blur(16px); display: flex; justify-content: center; padding-top: 14vh; animation: fadeUp 0.25s ease both; }
.pal { width: 700px; max-width: 92vw; height: fit-content; max-height: 62vh; display: flex; flex-direction: column; background: rgba(8,16,32,0.92); border: 1px solid rgba(0,212,255,0.25); border-radius: 18px; overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,0.7), 0 0 60px rgba(0,212,255,0.12); }
.pal-input { padding: 16px 20px; font-size: 15px; background: transparent; border: none; border-bottom: 1px solid rgba(0,212,255,0.12); color: #E8F4FF; outline: none; font-family: 'Space Grotesk'; }
.pal-list { overflow-y: auto; padding: 8px; }
.pal-cat { font-family: 'JetBrains Mono'; font-size: 9px; letter-spacing: 2px; color: #6B8FAF; padding: 9px 12px 4px; }
.pal-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; cursor: pointer; font-size: 13px; border: 1px solid transparent; transition: all 0.15s; }
.pal-item.sel { background: rgba(0,212,255,0.09); border-color: rgba(0,212,255,0.3); box-shadow: 0 0 18px rgba(0,212,255,0.08); }
.pal-sc { font-family: 'JetBrains Mono'; font-size: 9.5px; color: #6B8FAF; border: 1px solid rgba(0,212,255,0.15); padding: 2px 7px; border-radius: 5px; }
.pal-foot { font-family: 'JetBrains Mono'; font-size: 9px; color: #6B8FAF; padding: 10px 16px; border-top: 1px solid rgba(0,212,255,0.12); letter-spacing: 1px; }

/* ---- sentience layer ---- */
:root { --mx: 0; --my: 0; }
.cx-bg { transform: translate3d(calc(var(--mx) * 12px), calc(var(--my) * 12px), 0); transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
.cx-grid3 { perspective: 1400px; }
.cx-grid3 > .cx-col:first-child { transform: rotateY(1.4deg); }
.cx-grid3 > .cx-col:last-child { transform: rotateY(-1.4deg); }
.cx-atmos { position: fixed; inset: 0; z-index: 2; pointer-events: none; opacity: 0; transition: opacity 1.2s ease; }
.elevated .cx-atmos { opacity: 1; background: radial-gradient(circle at 50% 115%, rgba(255,107,53,0.12), transparent 60%); }
.critical .cx-atmos { opacity: 1; background: radial-gradient(circle at 50% 115%, rgba(255,45,85,0.18), transparent 62%); animation: alarmBreathe 1.6s ease-in-out infinite; }
@keyframes alarmBreathe { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
.critical .panel { border-color: rgba(255,45,85,0.22); }
.critical .cx-top { border-color: rgba(255,45,85,0.3); box-shadow: 0 8px 40px rgba(255,45,85,0.12); }
.threat-hot { border-color: rgba(255,45,85,0.55) !important; box-shadow: 0 0 44px rgba(255,45,85,0.2) !important; }
.cx-sysbadge { font-family: 'JetBrains Mono'; font-size: 8.5px; letter-spacing: 2px; padding: 2px 8px; border-radius: 6px; border: 1px solid currentColor; transition: all 0.6s; }
.insight { position: fixed; right: 26px; bottom: 110px; width: 320px; z-index: 45; background: rgba(8,16,32,0.96); border: 1px solid rgba(123,47,255,0.4); border-radius: 14px; padding: 13px 15px; backdrop-filter: blur(20px); box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(123,47,255,0.18); animation: insightIn 0.6s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes insightIn { from { opacity: 0; transform: translateX(60px) scale(0.95); } to { opacity: 1; transform: none; } }
.insight.out { animation: insightOut 0.45s ease both; }
@keyframes insightOut { from { opacity: 1; } to { opacity: 0; transform: translateX(60px); } }
.chain { display: flex; align-items: center; overflow-x: auto; overflow-y: hidden; padding: 2px 0 12px; gap: 0; scrollbar-width: none; -ms-overflow-style: none; }
.chain::-webkit-scrollbar { display: none; }
.chain-node { font-family: 'JetBrains Mono'; font-size: 8px; letter-spacing: 0.8px; padding: 4px 7px; border: 1px solid rgba(0,212,255,0.25); border-radius: 7px; color: #00D4FF; background: rgba(2,4,8,0.5); white-space: nowrap; animation: chainPop 0.5s ease both; flex-shrink: 0; }
.chain-link { width: 20px; height: 1px; background: linear-gradient(90deg, #00D4FF, #7B2FFF); position: relative; flex: 0 0 20px; }
.chain-link::after { content: ''; position: absolute; top: -2px; left: 0; width: 5px; height: 5px; border-radius: 50%; background: #00FF9D; box-shadow: 0 0 8px #00FF9D; animation: linkTravel 1.4s linear infinite; }
@keyframes linkTravel { to { transform: translateX(22px); } }
@keyframes chainPop { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: none; } }
.swarm { position: relative; height: 58px; margin-bottom: 10px; }
.swarm-core { position: absolute; left: 50%; top: 50%; width: 10px; height: 10px; margin: -5px; border-radius: 50%; background: #7B2FFF; box-shadow: 0 0 16px #7B2FFF; animation: softPulse 1.8s infinite; }
.swarm-dot { position: absolute; left: 50%; top: 50%; width: 5px; height: 5px; margin: -2.5px; border-radius: 50%; animation-name: swarmOrbit; animation-timing-function: linear; animation-iteration-count: infinite; }
@keyframes swarmOrbit { from { transform: rotate(0) translateX(var(--r)); } to { transform: rotate(360deg) translateX(var(--r)); } }

/* ---- data intake ---- */
.dropzone { cursor: pointer; border-style: dashed; }
.dropzone.over { border-color: rgba(0,212,255,0.6); box-shadow: 0 0 40px rgba(0,212,255,0.2); }
.dz-empty { text-align: center; padding: 22px 10px; color: #E8F4FF; }
.dz-ico { font-size: 34px; color: #00D4FF; filter: drop-shadow(0 0 14px rgba(0,212,255,0.6)); animation: hexBeat 2.2s ease-in-out infinite; }
.pipe { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.pipe-stage { display: flex; align-items: center; gap: 10px; font-family: 'JetBrains Mono'; font-size: 10px; padding: 5px 8px; border-radius: 8px; border: 1px solid rgba(0,212,255,0.06); transition: all 0.3s; }
.pipe-stage.active { border-color: rgba(0,212,255,0.35); background: rgba(0,212,255,0.06); box-shadow: 0 0 16px rgba(0,212,255,0.08); }
.pipe-stage.done { opacity: 0.6; }
.pipe-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 8px; }
.pipe-stage.active .pipe-dot { animation: softPulse 1s infinite; }
.pipe-agent { flex: 1; color: #E8F4FF; }
.pipe-state { color: #6B8FAF; letter-spacing: 1px; }
.pipe-stage.active .pipe-state { color: #00D4FF; }
.pipe-stage.done .pipe-state { color: #00FF9D; }

/* ---- presentation mode ---- */
.present { position: fixed; inset: 0; z-index: 90; background: radial-gradient(circle at 50% 40%, rgba(8,16,32,0.98), #020408 75%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6vw; animation: fadeUp 0.6s ease both; }
.present-slide { max-width: 920px; width: 100%; text-align: center; animation: slideIn 0.7s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes slideIn { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: none; } }
.present-tag { font-family: 'JetBrains Mono'; font-size: 12px; letter-spacing: 6px; color: #00D4FF; }
.present-title { font-family: 'Space Grotesk'; font-size: 46px; font-weight: 700; line-height: 1.1; margin: 18px 0; text-shadow: 0 0 40px rgba(0,212,255,0.3); }
.present-big { font-family: 'Space Grotesk'; font-size: 88px; font-weight: 700; background: linear-gradient(120deg, #00D4FF, #7B2FFF); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.present-sub { font-size: 18px; color: #6B8FAF; line-height: 1.6; max-width: 720px; margin: 0 auto; }
.present-nav { position: fixed; bottom: 36px; display: flex; gap: 14px; align-items: center; }
.present-arrow { width: 46px; height: 46px; border-radius: 50%; border: 1px solid rgba(0,212,255,0.3); background: rgba(8,16,32,0.7); color: #00D4FF; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.25s; }
.present-arrow:hover { background: rgba(0,212,255,0.12); box-shadow: 0 0 20px rgba(0,212,255,0.2); }
.present-dots { display: flex; gap: 7px; }
.present-dots i { width: 8px; height: 8px; border-radius: 50%; background: rgba(107,143,175,0.4); transition: all 0.3s; }
.present-dots i.on { background: #00D4FF; box-shadow: 0 0 10px #00D4FF; width: 22px; border-radius: 4px; }
.present-close { position: fixed; top: 28px; right: 32px; color: #6B8FAF; font-size: 26px; cursor: pointer; }
.present-list { text-align: left; display: inline-block; }
.present-list div { font-size: 17px; line-height: 1.9; padding-left: 22px; border-left: 2px solid #00FF9D; margin-bottom: 10px; }
`;

/* ================= components ================= */
const Background = React.memo(function Background() {
  return (
    <div className='cx-bg'>
      <div className='cx-gridlines' />
      <div className='cx-fog' style={{ top: '-12%', left: '-8%', background: 'radial-gradient(circle, rgba(0,212,255,0.13), transparent 65%)' }} />
      <div className='cx-fog' style={{ bottom: '-15%', right: '-10%', background: 'radial-gradient(circle, rgba(123,47,255,0.13), transparent 65%)', animationDelay: '-12s' }} />
      <svg className='cx-net' viewBox='0 0 100 100' preserveAspectRatio='none'>
        {LINKS.map((l) => (
          <g key={l.key}>
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke='rgba(0,212,255,0.10)' strokeWidth='0.5' vectorEffect='non-scaling-stroke' />
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke='rgba(0,212,255,0.45)' strokeWidth='1' vectorEffect='non-scaling-stroke'
              strokeDasharray='3 60' style={{ animation: 'dashFlow ' + (6 + l.d) + 's linear infinite' }} />
          </g>
        ))}
      </svg>
      {NODES.map((n) => (
        <div key={n.id} className='cx-node' style={{ left: n.x + '%', top: n.y + '%', width: n.s, height: n.s, animationDelay: '-' + n.d + 's' }} />
      ))}
      {PARTICLES.map((p) => (
        <div key={p.id} className='cx-particle' style={{ left: p.x + '%', top: p.y + '%', width: p.s, height: p.s, animationName: 'drift', animationDuration: p.t + 's', animationDelay: '-' + p.d + 's' }} />
      ))}
      <div className='cx-scan' />
      <div className='cx-scanline' />
      <div className='cx-streak' style={{ top: '22%' }} />
      <div className='cx-streak' style={{ top: '64%', animationDelay: '-5s' }} />
    </div>
  );
});

function Boot({ flash }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setT((x) => x + 60), 60);
    return () => clearInterval(iv);
  }, []);
  const prog = Math.min(Math.max((t - 1500) / 2300, 0), 1) * 100;
  return (
    <div className={'cx-boot' + (flash ? ' flash' : '')}>
      {t > 200 && <div className='cx-boot-pulse' />}
      {t > 200 && <div className='cx-boot-pulse' style={{ animationDelay: '0.5s' }} />}
      {t > 700 && (
        <div style={{ filter: 'drop-shadow(0 0 24px rgba(0,212,255,0.6))', animation: 'fadeUp 0.6s ease both' }}>
          <div className='cx-hex' />
        </div>
      )}
      {t > 1100 && <div className='cx-boot-title'>CORTEX OS</div>}
      {t > 1100 && (
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: 3, color: C.sub, marginTop: 6, animation: 'fadeUp 0.6s ease both' }}>
          THE OPERATING SYSTEM FOR ENTERPRISE INTELLIGENCE
        </div>
      )}
      <div className='cx-boot-lines'>
        {BOOT_LINES.map((l, i) => t > 1500 + i * 280 && (
          <div className='cx-boot-line' key={l}><span className='ok'>▸ </span>{l} <span className='ok'>OK</span></div>
        ))}
      </div>
      {t > 1500 && (
        <>
          <div className='cx-boot-prog'><div style={{ width: prog + '%' }} /></div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.cyan, marginTop: 8 }}>{Math.round(prog)}%</div>
        </>
      )}
    </div>
  );
}

function Spark({ color }) {
  const pts = useMemo(() => Array.from({ length: 9 }, (_, i) => (i * 7) + ',' + (16 - rand(2, 14)).toFixed(1)).join(' '), []);
  return (
    <svg width='58' height='18' style={{ overflow: 'visible' }}>
      <polyline points={pts} fill='none' stroke={color} strokeWidth='1.5'
        style={{ filter: 'drop-shadow(0 0 4px ' + color + ')', strokeDasharray: 120, strokeDashoffset: 120, animation: 'sparkDraw 1.8s ease forwards' }} />
    </svg>
  );
}

function KpiCard({ k, i }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const step = (ts) => {
      const p = Math.min((ts - t0) / 1700, 1);
      setV(k.target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const iv = setInterval(() => setV((x) => Math.max(0, x + rand(-k.jit, k.jit))), 4200);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []);
  return (
    <div className='panel kpi' style={{ animationDelay: (i * 0.08) + 's' }}>
      <div className='kpi-label'>{k.label}</div>
      <div className='kpi-val' style={{ color: k.color, textShadow: '0 0 22px ' + k.color + '55' }}>{k.fmt(v)}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className='kpi-delta'>{k.delta}</span>
        <Spark color={k.color} />
      </div>
    </div>
  );
}

const GlassTooltip = ({ active, payload, label, isRealData }) => {
  if (!active || !payload || !payload.length) return null;
  const fmt = (v) => {
    if (!isRealData) return '$' + v + 'M';
    if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(2) + 'M';
    if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'K';
    return (+v).toFixed(2);
  };
  return (
    <div style={{ background: 'rgba(8,16,32,0.97)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 10, padding: '10px 13px', fontFamily: 'JetBrains Mono', fontSize: 11, backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', maxWidth: 220 }}>
      <div style={{ color: C.sub, letterSpacing: 1.5, marginBottom: 6, fontSize: 10 }}>{label}</div>
      {payload.filter((p) => !Array.isArray(p.value) && p.value != null).map((p) => (
        <div key={p.dataKey} style={{ color: p.stroke || C.cyan, lineHeight: 1.8 }}>
          <span style={{ color: C.sub }}>{p.name}: </span>{fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

const MsgBody = ({ text, streaming }) => (
  <div>
    {text.split('\n').map((l, i) => {
      let cls = 'msg-line';
      if (l.startsWith('•') || /^\d+\./.test(l)) cls += ' b';
      else if (l.startsWith('SOURCES')) cls += ' src';
      else if (l.length > 3 && l === l.toUpperCase() && /[A-Z]{4,}/.test(l)) cls += ' h';
      return <div key={i} className={cls}>{l || ' '}</div>;
    })}
    {streaming && <span className='caret' />}
  </div>
);

/* ================= main ================= */
export default function CortexOS() {
  const [phase, setPhase] = useState('boot');
  const [active, setActive] = useState(0);
  const [now, setNow] = useState(new Date());
  const [thoughts, setThoughts] = useState(() => THOUGHTS.slice(0, 4).map(mkThought));
  const [nexus, setNexus] = useState(() => SOURCES.map(genNexus));
  const [tick, setTick] = useState({ rev: 128.4, tasks: 1847, threat: 18, conf: 91, streams: 312, load: 64, lat: 23 });
  const [agentProg, setAgentProg] = useState(() => AGENTS.map(() => rand(20, 80)));
  const [agentConf] = useState(() => AGENTS.map(() => Math.round(rand(85, 97))));
  const [alerts, setAlerts] = useState(INIT_ALERTS);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: 'CORTEX INTELLIGENCE online. 8 enterprise systems connected · 6 agents active.\n\nAsk me about revenue, churn, forecasts, risk, or strategy.' }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [palOpen, setPalOpen] = useState(false);
  const [palQ, setPalQ] = useState('');
  const [palIdx, setPalIdx] = useState(0);
  const [sysState, setSysState] = useState('NOMINAL');
  const [insight, setInsight] = useState(null);
  const [insightOut, setInsightOut] = useState(false);
  const [chain, setChain] = useState(CHAINS[0]);
  /* real data intelligence state */
  const [dataset, setDataset] = useState(null);   // { name, rows, fields }
  const [analysis, setAnalysis] = useState(null);  // full pipeline result
  const [stageStatus, setStageStatus] = useState(PIPELINE.map(() => 'idle'));
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [present, setPresent] = useState(false);
  const [slide, setSlide] = useState(0);
  const fileRef = useRef(null);
  const chatRef = useRef(null);
  const datasetRef = useRef(null);
  const chart = useMemo(makeChart, []);

  /* === real analysis pipeline === */
  const analyzeFile = async (file) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setThoughts((ts) => [{ id: Math.random(), text: 'Ingestion Agent: ' + err, type: 'REJECTED', conf: 99, time: new Date().toLocaleTimeString('en-GB') }, ...ts].slice(0, 8));
      return;
    }
    setAnalyzing(true);
    setAnalysis(null);
    setStageStatus(PIPELINE.map(() => 'idle'));
    setActive(1);
    try {
      const parsed = await parseFile(file);
      const ds = { name: file.name, rows: parsed.rows, fields: parsed.fields, truncated: parsed.truncated };
      datasetRef.current = ds;
      setDataset(ds);
      if (parsed.truncated) setThoughts((ts) => [{ id: Math.random(), text: 'Ingestion Agent: large file — analyzing first ' + parsed.rows.length.toLocaleString() + ' rows (sampling mode).', type: 'SAMPLING', conf: 92, time: new Date().toLocaleTimeString('en-GB') }, ...ts].slice(0, 8));
      const result = await runPipeline(parsed, (i, payload) => {
        setStageStatus((s) => s.map((v, idx) => idx < i ? 'done' : idx === i ? 'active' : 'idle'));
        const p = PIPELINE[i];
        let detail = p.label;
        if (payload.prof) detail = 'Detected ' + payload.prof.colCount + ' columns across ' + payload.prof.rowCount.toLocaleString() + ' rows' + (payload.prof.sampled ? ' (sampling mode)' : '');
        else if (payload.qa) detail = 'Integrity ' + payload.qa.score + '% · ' + payload.qa.issues.length + ' issue(s)';
        else if (p.id === 'forecast') detail = payload.forecast ? 'Trend ' + payload.forecast.trend + ' · conf ' + payload.forecast.confidence + '% · ' + (payload.anomalies ? payload.anomalies.length : 0) + ' anomalies' : 'No forecastable series in this dataset';
        else if (payload.dash) detail = payload.dash.kpis.length + ' KPIs · adaptive dashboard generated';
        else if (payload.insights) detail = payload.insights.length + ' executive insights synthesized';
        else if (payload.recs) detail = payload.recs.length + ' recommendations derived';
        setThoughts((ts) => [{ id: Math.random(), text: p.agent + ': ' + detail, type: p.id.toUpperCase(), conf: Math.round(rand(88, 99)), time: new Date().toLocaleTimeString('en-GB') }, ...ts].slice(0, 8));
      });
      setStageStatus(PIPELINE.map(() => 'done'));
      setAnalysis(result);
      // surface real anomalies into the threat grid
      if (result.dash.chart && result.dash.chart.anomalies.length) {
        setAlerts((as) => [
          ...result.dash.chart.anomalies.slice(0, 2).map((an) => ({
            id: Math.random(), sev: Math.abs(an.z) > 3.2 ? 'CRITICAL' : 'WARNING', color: Math.abs(an.z) > 3.2 ? '#FF2D55' : '#FF6B35',
            title: 'Anomaly in "' + result.dash.chart.metric + '" at ' + an.label, src: 'Anomaly Agent · ' + (datasetRef.current ? datasetRef.current.name : 'dataset'),
            rec: 'Review the ' + an.dir + ' (z=' + an.z + ') before reporting.',
          })), ...as,
        ].slice(0, 6));
      }
    } catch (e) {
      setThoughts((ts) => [{ id: Math.random(), text: 'Ingestion Agent: failed to parse "' + file.name + '" — ' + (e.message || 'unsupported format'), type: 'ERROR', conf: 99, time: new Date().toLocaleTimeString('en-GB') }, ...ts].slice(0, 8));
    } finally {
      setAnalyzing(false);
    }
  };

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) analyzeFile(f); };

  /* performance mode: pause ambient activity during analysis / presentation */
  const busy = analyzing || present;

  /* boot timing */
  useEffect(() => {
    const a = setTimeout(() => setPhase('flash'), 3900);
    const b = setTimeout(() => setPhase('app'), 4350);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  /* live systems (suspended while busy to prioritize functionality over atmosphere) */
  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    if (busy) return () => clearInterval(clock);
    const feed = setInterval(() => setThoughts((ts) => [mkThought(THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)]), ...ts].slice(0, 8)), 3400);
    const nx = setInterval(() => setNexus(SOURCES.map(genNexus)), 2600);
    const tk = setInterval(() => setTick((t) => ({
      rev: t.rev + rand(-0.3, 0.5), tasks: t.tasks + rand(-30, 45), threat: Math.min(99, Math.max(1, t.threat + rand(-2, 2))),
      conf: Math.min(99, Math.max(70, t.conf + rand(-1.5, 1.5))), streams: Math.max(1, t.streams + rand(-4, 6)),
      load: Math.min(98, Math.max(20, t.load + rand(-4, 4))), lat: Math.max(8, t.lat + rand(-3, 3)),
    })), 2000);
    const ag = setInterval(() => setAgentProg((ps) => ps.map((p) => (p + rand(2, 9)) % 100)), 1800);
    return () => { clearInterval(clock); clearInterval(feed); clearInterval(nx); clearInterval(tk); clearInterval(ag); };
  }, [busy]);

  /* autonomous sentience layer (suspended while busy) */
  useEffect(() => {
    if (busy) return undefined;
    const timeouts = [];
    const chainIv = setInterval(() => setChain(CHAINS[Math.floor(Math.random() * CHAINS.length)]), 5200);
    const insightIv = setInterval(() => {
      setInsight(INSIGHTS[Math.floor(Math.random() * INSIGHTS.length)]);
      setInsightOut(false);
      timeouts.push(setTimeout(() => setInsightOut(true), 6800));
      timeouts.push(setTimeout(() => setInsight(null), 7400));
    }, 19000);
    const escalate = setInterval(() => {
      const roll = Math.random();
      if (roll > 0.72) {
        const ev = CRITICAL_EVENTS[Math.floor(Math.random() * CRITICAL_EVENTS.length)];
        setSysState('CRITICAL');
        setActive(8);
        setAlerts((as) => [{ id: Math.random(), sev: 'CRITICAL', color: '#FF2D55', title: ev, src: 'CORTEX Autonomous Detection', rec: 'Containment protocol staged — authorize agent swarm response.' }, ...as].slice(0, 5));
        setThoughts((ts) => [{ id: Math.random(), text: ev, type: 'AUTONOMOUS', conf: Math.round(rand(90, 99)), time: new Date().toLocaleTimeString('en-GB') }, ...ts].slice(0, 8));
        timeouts.push(setTimeout(() => setSysState('NOMINAL'), 9000));
      } else if (roll > 0.45) {
        setSysState('ELEVATED');
        timeouts.push(setTimeout(() => setSysState('NOMINAL'), 6000));
      }
    }, 16000);
    let raf = 0;
    const onMove = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.documentElement.style.setProperty('--mx', ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
        document.documentElement.style.setProperty('--my', ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => { clearInterval(chainIv); clearInterval(insightIv); clearInterval(escalate); timeouts.forEach(clearTimeout); if (raf) cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); };
  }, [busy]);

  /* global keys */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalOpen((o) => !o); setPalQ(''); setPalIdx(0); }
      else if (e.key === 'Escape') { setPalOpen(false); setChatOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* presentation slides (memoized so keyboard nav + render share one source) */
  const slides = useMemo(() => {
    if (!analysis || !dataset) return [];
    const an = analysis, ds = dataset;
    const fc = an.dash.chart && an.dash.chart.forecast;
    return [
      { tag: 'CORTEX OS · EXECUTIVE BRIEFING', title: ds.name, sub: 'Autonomous intelligence synthesized from ' + ds.rows.length.toLocaleString() + ' rows × ' + ds.fields.length + ' columns. Data integrity ' + an.qa.score + '%.' + (ds.truncated ? ' (Sampling mode.)' : '') },
      ...an.dash.kpis.slice(0, 3).map((k) => ({ tag: k.kind + ' · ' + k.label.slice(0, 28), big: k.value >= 1000 ? Math.round(k.value).toLocaleString() : (+k.value).toFixed(1), sub: 'Range ' + (+k.min).toFixed(1) + ' → ' + (+k.max).toFixed(1) + ' · mean ' + (+k.mean).toFixed(1) + ' · n=' + (k.count || 0).toLocaleString() })),
      ...(fc ? [{ tag: 'FORECAST · ' + fc.trend.toUpperCase(), title: an.dash.chart.metric, big: fc.future[fc.future.length - 1].yhat.toLocaleString(), sub: 'Projected over 5 periods · model confidence ' + fc.confidence + '% (R² ' + fc.r2 + ')' }] : []),
      { tag: 'EXECUTIVE INSIGHTS', title: 'What CORTEX Found', list: an.insights.map((i) => i.text) },
      { tag: 'STRATEGIC RECOMMENDATIONS', title: 'Recommended Actions', list: an.recs },
    ];
  }, [analysis, dataset]);

  /* presentation keyboard navigation (keynote-grade) */
  useEffect(() => {
    if (!present) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); setSlide((x) => Math.min(x + 1, Math.max(0, slides.length - 1))); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); setSlide((x) => Math.max(0, x - 1)); }
      else if (e.key === 'Home') setSlide(0);
      else if (e.key === 'End') setSlide(Math.max(0, slides.length - 1));
      else if (e.key === 'Escape') setPresent(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [present, slides.length]);

  /* chat autoscroll */
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const appendToLast = (d) => setMessages((ms) => {
    const c = ms.slice();
    const last = c[c.length - 1];
    c[c.length - 1] = { role: last.role, text: last.text + d };
    return c;
  });

  const streamSim = (full, cb) => new Promise((resolve) => {
    let i = 0;
    const iv = setInterval(() => {
      cb(full.slice(i, i + 3));
      i += 3;
      if (i >= full.length) { clearInterval(iv); resolve(); }
    }, 16);
  });

  const send = async () => {
    const q = input.trim();
    if (!q || typing) return;
    setInput('');
    const hist = [...messages, { role: 'user', text: q }];
    setMessages([...hist, { role: 'ai', text: '' }]);
    setTyping(true);
    const apiHist = hist.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
    const ok = await streamAnthropic(apiHist, appendToLast);
    if (!ok) await streamSim(simulatedReply(q), appendToLast);
    setTyping(false);
  };

  const filtered = COMMANDS.filter((c) => (c[0] + ' ' + c[1]).toLowerCase().includes(palQ.toLowerCase()));

  const runCommand = (c) => {
    setPalOpen(false);
    if (c[1].includes('copilot')) { setChatOpen(true); return; }
    setThoughts((ts) => [{ id: Math.random(), text: 'Executing: ' + c[1] + '…', type: 'COMMAND', conf: Math.round(rand(88, 99)), time: new Date().toLocaleTimeString('en-GB') }, ...ts].slice(0, 8));
  };

  const onPalKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setPalIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setPalIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && filtered[palIdx]) runCommand(filtered[palIdx]);
  };

  const tickItems = [
    ['REV', '$' + tick.rev.toFixed(1) + 'M'], ['AI TASKS', String(Math.round(tick.tasks))], ['THREAT', Math.round(tick.threat) + '/100'],
    ['CONF', Math.round(tick.conf) + '%'], ['STREAMS', String(Math.round(tick.streams))],
  ];

  return (
    <div className='cx-root'>
      <style>{CSS}</style>
      <Background />

      {phase !== 'boot' && (
        <div className={'cx-app ' + sysState.toLowerCase()}>
          <div className='cx-atmos' />
          {/* ===== sidebar ===== */}
          <aside className='cx-side'>
            <div className='cx-logo'>
              <div className='cx-core'>
                <div className='cx-core-ring' />
                <div className='cx-core-ring' style={{ inset: 4, animationDuration: '2.1s', animationDirection: 'reverse', borderColor: 'rgba(123,47,255,0.5)', borderTopColor: 'transparent' }} />
                <div className='cx-core-hex' />
                <div className='cx-core-orb' />
              </div>
              <div>
                <div className='cx-logo-name'>CORTEX OS</div>
                <div className='cx-logo-tag'>ENTERPRISE INTELLIGENCE</div>
              </div>
            </div>
            <nav className='cx-nav'>
              {NAV.map((n, i) => (
                <div key={n[1]} className={'cx-nav-item' + (i === active ? ' active' : '')} onClick={() => setActive(i)} title={n[1]}>
                  <span className='cx-nav-icon'>{n[0]}</span>
                  <span className='cx-nav-label'>{n[1]}</span>
                </div>
              ))}
            </nav>
            <div className='cx-sys'>
              <div className='cx-sys-row'><span className='cx-dot' /><span>CORTEX ACTIVE</span></div>
              <div className='cx-sys-detail'>AI LOAD {Math.round(tick.load)}% · AGENTS 6 · LAT {Math.round(tick.lat)}ms</div>
            </div>
          </aside>

          <div className='cx-main'>
            {/* ===== command bar ===== */}
            <header className='cx-top'>
              <div style={{ flexShrink: 0 }}>
                <div className='cx-crumb' style={{ display: 'flex', alignItems: 'center', gap: 8 }}>CORTEX OS <span className='cx-sysbadge' style={{ color: sysState === 'CRITICAL' ? C.red : sysState === 'ELEVATED' ? C.amber : C.green }}>{sysState}</span></div>
                <div className='cx-module'>{NAV[active][1]}</div>
              </div>
              <div className='cx-omni' onClick={() => setPalOpen(true)}>
                <span className='cx-kbd'>⌘K</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ask CORTEX anything…</span>
              </div>
              <div className='cx-ticker'>
                <div className='cx-ticker-track'>
                  {[0, 1].map((r) => tickItems.map((t) => (
                    <span key={r + '-' + t[0]}><span className='cx-tick-label'>{t[0]} </span><span className='cx-tick-val'>{t[1]}</span></span>
                  )))}
                </div>
              </div>
              <div className='cx-crumb cx-dt' style={{ textAlign: 'right', flexShrink: 0 }}>{now.toLocaleTimeString('en-GB')}<br />{now.toISOString().slice(0, 10)}</div>
              <span className='cx-bell'>🔔</span>
              <span className='cx-tier'>OMEGA TIER</span>
              <div className='cx-avatar'>EX</div>
            </header>

            {/* ===== workspace ===== */}
            <div className='cx-grid3'>
              {/* left — reasoning + nexus */}
              <div className='cx-col'>
                <section className='panel'>
                  <div className='panel-h'>
                    <div className='panel-title'><span className='cx-dot' />LIVE AI REASONING</div>
                    <div className='live-chip'>● LIVE</div>
                  </div>
                  <div className='chain'>
                    {chain.map((c, i) => (
                      <React.Fragment key={c + '-' + i}>
                        {i > 0 && <span className='chain-link' />}
                        <span className='chain-node' style={{ animationDelay: (i * 0.12) + 's' }}>{c}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  {thoughts.map((t) => (
                    <div className='feed-item' key={t.id}>
                      <div className='feed-meta'><span className='feed-type'>{t.type}</span><span>{t.time} · <span className='feed-conf'>{t.conf}%</span></span></div>
                      <div className='feed-text'>{t.text}</div>
                      <div className='feed-bar'><div style={{ width: t.conf + '%' }} /></div>
                    </div>
                  ))}
                </section>
                <section className='panel'>
                  <div className='panel-h'>
                    <div className='panel-title'>DATA NEXUS</div>
                    <div className='live-chip'>8 SYSTEMS</div>
                  </div>
                  <div className='nexus-grid'>
                    {nexus.map((s) => (
                      <div className='nexus-card' key={s.name}>
                        <div className='nexus-name'>
                          <span className='cx-dot' style={{ background: s.health === 'OPTIMAL' ? C.green : C.amber, boxShadow: '0 0 8px ' + (s.health === 'OPTIMAL' ? C.green : C.amber) }} />
                          {s.name}
                        </div>
                        <div className='nexus-stat'><span>LAT</span><b>{s.lat}ms</b></div>
                        <div className='nexus-stat'><span>THR</span><b>{s.tp} GB/s</b></div>
                        <div className='nexus-stat'><span>HEALTH</span><b style={{ color: s.health === 'OPTIMAL' ? C.green : C.amber }}>{s.health}</b></div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* center — intelligence core */}
              <div className='cx-col'>
                {/* ingestion + auto-dashboard surface */}
                <section
                  className={'panel dropzone' + (dragOver ? ' over' : '')}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => !analyzing && fileRef.current && fileRef.current.click()}
                >
                  <input ref={fileRef} type='file' accept='.csv,.tsv,.txt,.xlsx,.xls' style={{ display: 'none' }} onChange={(e) => analyzeFile(e.target.files[0])} />
                  <div className='panel-h'>
                    <div className='panel-title'><span className='cx-dot' />DATA INTAKE — AUTONOMOUS ANALYSIS</div>
                    {analysis && <span className='live-chip' onClick={(e) => { e.stopPropagation(); setPresent(true); setSlide(0); }} style={{ cursor: 'pointer', color: C.violet }}>▶ PRESENTATION MODE</span>}
                  </div>
                  {!dataset && !analyzing && (
                    <div className='dz-empty'>
                      <div className='dz-ico'>⤒</div>
                      <div style={{ fontSize: 13, marginTop: 6 }}>Drop a CSV or Excel file — or click to upload</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: C.sub, marginTop: 4 }}>CORTEX will autonomously profile, forecast, and build your dashboard</div>
                    </div>
                  )}
                  {(analyzing || analysis) && (
                    <div className='pipe'>
                      {PIPELINE.map((p, i) => (
                        <div className={'pipe-stage ' + stageStatus[i]} key={p.id}>
                          <span className='pipe-dot' style={{ background: stageStatus[i] === 'idle' ? 'rgba(107,143,175,0.4)' : p.color, boxShadow: stageStatus[i] === 'idle' ? 'none' : '0 0 8px ' + p.color }} />
                          <span className='pipe-agent'>{p.agent}</span>
                          <span className='pipe-state'>{stageStatus[i] === 'done' ? 'COMPLETE' : stageStatus[i] === 'active' ? 'RUNNING…' : 'QUEUED'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {dataset && (
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: C.sub, marginTop: 10, letterSpacing: 1 }}>
                      {dataset.name} · {dataset.rows.length.toLocaleString()} ROWS × {dataset.fields.length} COLS{analysis && ' · INTEGRITY ' + analysis.qa.score + '%'}
                    </div>
                  )}
                </section>

                <div className='kpi-strip'>
                  {(analysis ? analysis.dash.kpis : KPIS).map((k, i) => (
                    analysis
                      ? <div className='panel kpi' key={k.label + i} style={{ animationDelay: (i * 0.08) + 's' }}>
                          <div className='kpi-label'>{k.label}</div>
                          <div className='kpi-val' style={{ color: C.cyan, textShadow: '0 0 22px ' + C.cyan + '55', fontSize: k.label.length > 14 ? 18 : 22 }}>{k.value >= 1000000 ? (k.value / 1000000).toFixed(2) + 'M' : k.value >= 1000 ? (k.value / 1000).toFixed(1) + 'K' : (+k.value).toFixed(1)}</div>
                          <div className='kpi-delta'>{k.kind} · avg {(+k.mean).toFixed(1)}</div>
                        </div>
                      : <KpiCard k={k} i={i} key={k.label} />
                  ))}
                </div>
                <section className='panel' style={{ minHeight: 360 }}>
                  <div className='panel-h'>
                    <div className='panel-title' style={{ maxWidth: '60%' }}><span className='cx-dot' /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{analysis && analysis.dash.chart ? (analysis.dash.chart.metric.toUpperCase() + ' FORECAST') : 'REVENUE INTELLIGENCE FORECAST'}</span></div>
                    <div style={{ display: 'flex', gap: 10, fontFamily: 'JetBrains Mono', fontSize: 9, flexShrink: 0 }}>
                      <span style={{ color: C.cyan }}>— HIST</span>
                      <span style={{ color: C.violet }}>-- FCST</span>
                    </div>
                  </div>
                  <ResponsiveContainer width='100%' height={280}>
                    <ComposedChart data={analysis && analysis.dash.chart ? analysis.dash.chart.data : chart} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id='histFill' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='0%' stopColor={C.cyan} stopOpacity={0.22} />
                          <stop offset='100%' stopColor={C.cyan} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey={analysis && analysis.dash.chart ? 'x' : 'm'} tick={{ fill: C.sub, fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: C.border }} tickLine={false} interval='preserveStartEnd' />
                      <YAxis tick={{ fill: C.sub, fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={(v) => {
                        if (analysis) {
                          if (Math.abs(v) >= 1000000) return (v/1000000).toFixed(1)+'M';
                          if (Math.abs(v) >= 1000) return (v/1000).toFixed(0)+'K';
                          return (+v).toFixed(0);
                        }
                        return '$' + v + 'M';
                      }} width={56} />
                      <Tooltip content={<GlassTooltip isRealData={!!analysis} />} cursor={{ stroke: 'rgba(0,212,255,0.25)' }} />
                      <Area type='monotone' dataKey='band' name='Confidence band' stroke='none' fill={C.violet} fillOpacity={0.10} animationDuration={2200} connectNulls={false} />
                      <Area type='monotone' dataKey='hist' name='Historical area' stroke='none' fill='url(#histFill)' animationDuration={1600} tooltipType='none' legendType='none' />
                      <Line type='monotone' dataKey='hist' name='Historical' stroke={C.cyan} strokeWidth={2} dot={false} activeDot={{ r: 5 }} animationDuration={1600} style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.7))' }} />
                      <Line type='monotone' dataKey='fc' name='AI Forecast' stroke={C.violet} strokeWidth={2} strokeDasharray='6 4' dot={false} activeDot={{ r: 5 }} animationDuration={2200} style={{ filter: 'drop-shadow(0 0 6px rgba(123,47,255,0.7))' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, color: C.sub, letterSpacing: 1, marginTop: 8, lineHeight: 1.6 }}>
                    {analysis && analysis.dash.chart && analysis.dash.chart.forecast
                      ? <>R² {analysis.dash.chart.forecast.r2} · CONF {analysis.dash.chart.forecast.confidence}% · {analysis.dash.chart.anomalies.length} ANOMAL{analysis.dash.chart.anomalies.length === 1 ? 'Y' : 'IES'} · TREND <span style={{ color: analysis.dash.chart.forecast.trend === 'up' ? C.green : analysis.dash.chart.forecast.trend === 'down' ? C.red : C.sub }}>{analysis.dash.chart.forecast.trend.toUpperCase()} ↑</span></>
                      : <>MODEL v412 · HORIZON AUG→DEC · <span style={{ color: C.green }}>● LIVE</span></>}
                  </div>
                </section>

                {analysis && analysis.dash.breakdown && (
                  <section className='panel'>
                    <div className='panel-h'>
                      <div className='panel-title'>{('"' + analysis.dash.breakdown.metric + '" BY "' + analysis.dash.breakdown.by + '"').toUpperCase()}</div>
                      <span className='live-chip'>AUTO-SELECTED</span>
                    </div>
                    <ResponsiveContainer width='100%' height={200}>
                      <BarChart data={analysis.dash.breakdown.data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                        <XAxis dataKey='k' tick={{ fill: C.sub, fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: C.border }} tickLine={false} interval={0} angle={-12} height={40} />
                        <YAxis tick={{ fill: C.sub, fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(0,212,255,0.06)' }} />
                        <Bar dataKey='v' name={analysis.dash.breakdown.metric} radius={[4, 4, 0, 0]} animationDuration={1400}>
                          {analysis.dash.breakdown.data.map((_, i) => <Cell key={i} fill={i === 0 ? C.cyan : 'rgba(0,212,255,0.4)'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {analysis && (
                  <section className='panel'>
                    <div className='panel-h'>
                      <div className='panel-title'><span className='cx-dot' />EXECUTIVE INTELLIGENCE</div>
                      <span className='live-chip' style={{ color: C.violet }}>AI-GENERATED</span>
                    </div>
                    {analysis.insights.map((ins, i) => (
                      <div className='feed-item' key={i} style={{ marginBottom: 9 }}>
                        <div className='feed-meta'>
                          <span className='feed-type'>{ins.cat}</span>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: C.green }}>{ins.conf}% CONF</span>
                        </div>
                        <div className='feed-text' style={{ fontSize: 12, lineHeight: 1.55, color: '#C8E0F0' }}>{ins.text}</div>
                        <div className='feed-bar'><div style={{ width: ins.conf + '%' }} /></div>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid ' + C.border }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 2, color: C.violet, marginBottom: 10 }}>▸ STRATEGIC RECOMMENDATIONS</div>
                      {analysis.recs.map((r, i) => (
                        <div key={i} style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 8, paddingLeft: 12, borderLeft: '2px solid ' + C.green, color: '#C8E0F0' }}>
                          <span style={{ color: C.green, fontFamily: 'JetBrains Mono', fontSize: 9, marginRight: 6 }}>{String(i + 1).padStart(2, '0')}</span>{r}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* right — agents + threats */}
              <div className='cx-col cx-col-right'>
                <section className='panel'>
                  <div className='panel-h'>
                    <div className='panel-title'><span className='cx-dot' />ACTIVE AI AGENTS</div>
                    <div className='live-chip'>6 ONLINE</div>
                  </div>
                  <div className='swarm'>
                    <span className='swarm-core' />
                    {AGENTS.map((a, i) => (
                      <span key={a[0]} className='swarm-dot' style={{ background: a[2], boxShadow: '0 0 8px ' + a[2], '--r': (14 + i * 4) + 'px', animationDuration: (2.4 + i * 0.7) + 's', animationDelay: '-' + (i * 0.5) + 's' }} />
                    ))}
                  </div>
                  {AGENTS.map((a, i) => (
                    <div className='agent' key={a[0]}>
                      <div className='agent-av' style={{ background: 'linear-gradient(140deg, ' + a[2] + '33, rgba(2,4,8,0.8))', border: '1px solid ' + a[2] + '66', color: a[2], boxShadow: '0 0 14px ' + a[2] + '33' }}>{a[0][0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 600 }}>{a[0]}</span>
                          <span className='badge' style={{ color: a[2], borderColor: a[2] + '55' }}>ACTIVE</span>
                        </div>
                        <div style={{ fontSize: 10.5, color: C.sub, margin: '3px 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a[1]}</div>
                        <div className='feed-bar'>
                          <div style={{ width: agentProg[i] + '%', animation: 'none', background: 'linear-gradient(90deg, ' + a[2] + ', rgba(123,47,255,0.8))', transition: 'width 1.2s ease' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontFamily: 'JetBrains Mono', fontSize: 9, color: C.sub }}>
                          <span>THR {(agentProg[i] / 18).toFixed(1)}k/s · CONF <span style={{ color: C.green }}>{agentConf[i]}%</span></span>
                          <span className='think'><i /><i /><i /></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
                <section className={'panel' + (sysState === 'CRITICAL' ? ' threat-hot' : '')} style={{ order: sysState === 'CRITICAL' ? -1 : 0 }}>
                  <div className='panel-h'>
                    <div className='panel-title'>CORTEX THREAT GRID</div>
                    <div className='live-chip' style={{ color: C.red }}>{alerts.length} ACTIVE</div>
                  </div>
                  {alerts.map((al) => (
                    <div className='alert' key={al.id} style={{ borderColor: al.color + '66', '--ag': al.color + '33' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 2, color: al.color }}>{al.sev}</span>
                        <span onClick={() => setAlerts((as) => as.filter((x) => x.id !== al.id))} style={{ cursor: 'pointer', color: C.sub, fontSize: 14, lineHeight: 1 }}>×</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{al.title}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: C.sub, marginBottom: 6 }}>{al.src}</div>
                      <div style={{ fontSize: 10.5, opacity: 0.88, borderLeft: '2px solid ' + al.color, paddingLeft: 8 }}>AI ▸ {al.rec}</div>
                    </div>
                  ))}
                  {alerts.length === 0 && <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.green }}>ALL THREATS NEUTRALIZED</div>}
                </section>
              </div>
            </div>
          </div>

          {/* ===== floating copilot — rendered OUTSIDE cx-app to avoid transform containing block bug ===== */}

          {/* chat panel + orb rendered outside cx-app below */}

          {/* ===== proactive insight ===== */}
          {insight && (
            <div className={'insight' + (insightOut ? ' out' : '')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className='cx-dot' style={{ background: C.violet, boxShadow: '0 0 8px ' + C.violet }} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 2, color: C.violet }}>CORTEX INSIGHT · {insight[0]}</span>
                <span onClick={() => setInsight(null)} style={{ marginLeft: 'auto', cursor: 'pointer', color: C.sub }}>×</span>
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>{insight[1]}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: C.green }}>CONF {insight[2]}%</span>
                <span onClick={() => { setInsight(null); setChatOpen(true); }} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: C.cyan, cursor: 'pointer', letterSpacing: 1 }}>ENGAGE COPILOT ▸</span>
              </div>
            </div>
          )}

          {/* ===== command palette ===== */}
          {palOpen && (
            <div className='pal-overlay' onClick={() => setPalOpen(false)}>
              <div className='pal' onClick={(e) => e.stopPropagation()}>
                <input className='pal-input' autoFocus placeholder='Type a command or search…' value={palQ}
                  onChange={(e) => { setPalQ(e.target.value); setPalIdx(0); }} onKeyDown={onPalKey} />
                <div className='pal-list'>
                  {(() => {
                    let idx = -1;
                    return [...new Set(filtered.map((c) => c[0]))].map((cat) => (
                      <div key={cat}>
                        <div className='pal-cat'>{cat}</div>
                        {filtered.filter((c) => c[0] === cat).map((c) => {
                          idx += 1;
                          const i = idx;
                          return (
                            <div key={c[1]} className={'pal-item' + (i === palIdx ? ' sel' : '')} onMouseEnter={() => setPalIdx(i)} onClick={() => runCommand(c)}>
                              <span>{c[1]}</span><span className='pal-sc'>{c[2]}</span>
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                  {filtered.length === 0 && <div className='pal-cat'>NO MATCHES — OPEN THE COPILOT TO ASK CORTEX</div>}
                </div>
                <div className='pal-foot'>↑↓ NAVIGATE · ENTER EXECUTE · ESC CLOSE</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== floating copilot + chat — outside cx-app to prevent transform containing block ===== */}
      {phase === 'app' && (
        <>
          {!chatOpen && (
            <div className='orb-wrap' onClick={() => setChatOpen(true)}>
              <div className='orb'>◉</div>
            </div>
          )}
          <div className={'chat' + (chatOpen ? ' open' : '')}>
            <div className='chat-h'>
              <span className='cx-dot' />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>CORTEX INTELLIGENCE</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: C.sub }}>MODEL CORTEX-OMEGA · LAT {Math.round(tick.lat)}ms · NEURAL SYNC ◈</div>
              </div>
              <span onClick={() => setChatOpen(false)} style={{ cursor: 'pointer', color: C.sub, fontSize: 18 }}>×</span>
            </div>
            <div className='chat-body' ref={chatRef}>
              {messages.map((m, i) => (
                <div className={'msg ' + m.role} key={i}>
                  <div className='msg-bubble'>
                    {m.role === 'ai' && m.text === '' && typing
                      ? <span className='think'><i /><i /><i /></span>
                      : <MsgBody text={m.text} streaming={typing && m.role === 'ai' && i === messages.length - 1} />}
                  </div>
                </div>
              ))}
            </div>
            <div className='chat-input'>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder='Query the intelligence core…' />
              <button className='chat-send' onClick={send}>▶</button>
            </div>
          </div>
        </>
      )}

      {phase !== 'app' && <Boot flash={phase === 'flash'} />}

      {present && analysis && slides.length > 0 && (() => {
        const s = slides[Math.min(slide, slides.length - 1)];
        return (
          <div className='present' onClick={(e) => { if (e.target.className === 'present') setSlide((x) => Math.min(x + 1, slides.length - 1)); }}>
            <span className='present-close' onClick={() => setPresent(false)}>×</span>
            <div className='present-slide' key={slide}>
              <div className='present-tag'>{s.tag}</div>
              {s.big && <div className='present-big'>{s.big}</div>}
              {s.title && <div className='present-title'>{s.title}</div>}
              {s.sub && <div className='present-sub'>{s.sub}</div>}
              {s.list && <div className='present-list'>{s.list.map((l, i) => <div key={i}>{l}</div>)}</div>}
            </div>
            <div className='present-nav'>
              <span className='present-arrow' onClick={() => setSlide((x) => Math.max(0, x - 1))}>‹</span>
              <span className='present-dots'>{slides.map((_, i) => <i key={i} className={i === slide ? 'on' : ''} />)}</span>
              <span className='present-arrow' onClick={() => setSlide((x) => Math.min(slides.length - 1, x + 1))}>›</span>
            </div>
            <div style={{ position: 'fixed', bottom: 14, fontFamily: 'JetBrains Mono', fontSize: 9, color: C.sub, letterSpacing: 2 }}>← → / SPACE NAVIGATE · ESC EXIT</div>
          </div>
        );
      })()}
    </div>
  );
}
