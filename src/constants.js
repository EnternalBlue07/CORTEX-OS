/* ============================================================
 * CORTEX OS — Slate-Light Minimalist Theme & Constants
 * Single source of truth for palette, typography, static data.
 * ============================================================ */

/* ---- Colour Palette ---- */
export const C = {
  bg:      '#F8FAFC', // Slate 50 (Very clean light grey-white)
  surface: '#FFFFFF', // Pure White
  panel:   '#FFFFFF', // Pure White
  indigo:  '#4F46E5', // Indigo 600
  violet:  '#7C3AED', // Violet 600
  cyan:    '#0891B2', // Cyan 600
  emerald: '#059669', // Emerald 600
  amber:   '#D97706', // Amber 600
  red:     '#DC2626', // Red 600
  text:    '#0F172A', // Slate 900 (Dark slate text)
  muted:   '#64748B', // Slate 500 (Muted slate text)
  border:  '#E2E8F0', // Slate 200 (Clean light grey border)
  glow:    'rgba(79,70,229,0.06)',
};

/* ---- Navigation ---- */
export const NAV = [
  ['📊', 'Executive Dashboard'],
  ['🌐', 'Enterprise Fabric'],
  ['🔍', 'Data Profiler'],
  ['🧼', 'Data Cleaner & Exporter'],
  ['🔗', 'Relational Insights'],
  ['⚙', 'Settings & Limits'],
];

/* ---- Static data ---- */
export const SOURCES = ['Snowflake Database', 'Salesforce CRM', 'SAP ERP', 'PostgreSQL Instance', 'Stripe Payments', 'Amazon S3 Bucket', 'Google BigQuery', 'Databricks Table'];

export const THOUGHTS = [
  ['Parsed file dimensions and validated headers successfully.', 'PARSE'],
  ['Inferred variable data types across column vectors.', 'SCHEMA'],
  ['Evaluated dataset quality score and checked null fields.', 'QA'],
  ['Calculated Z-Score anomalies and statistical limits.', 'ANOMALY'],
  ['Trained linear forecasting model on primary business totals.', 'FORECAST'],
];

export const AGENTS = []; // Unused in minimalist mode

export const INIT_ALERTS = [
  { id: 1, sev: 'ALERT', color: '#DC2626', title: 'Data Outliers Detected', src: 'Anomaly Agent', rec: 'We found statistical outliers in the dataset. Use the Data Cleaner to smooth anomalies.' },
  { id: 2, sev: 'QA FLAG', color: '#D97706', title: 'Missing Columns Values Found', src: 'Quality Agent', rec: 'Several rows contain missing columns. Use Data Cleaner to fill empty fields.' },
];

export const COMMANDS = [
  ['🧼 Cleaner', 'Open Data Cleaner tab', 'G C'],
  ['📊 Report',  'View dashboard & recommendations', 'G D'],
  ['🔍 Schema',  'View field statistics & data types', 'G S'],
  ['🔗 Insights', 'View relational metrics correlation', 'G I'],
];

export const INSIGHTS = []; // Unused in minimalist mode
export const CHAINS = []; // Unused in minimalist mode
export const CRITICAL_EVENTS = []; // Unused in minimalist mode

export const KPIS = [
  { label: 'REVENUE INTELLIGENCE', target: 128.4, fmt: (v) => '$' + v.toFixed(1) + 'M', delta: '+12.4%', color: C.indigo,  jit: 0.1  },
  { label: 'CHURN PROBABILITY',    target: 3.2,   fmt: (v) => v.toFixed(1) + '%',        delta: '-0.8%',  color: C.amber,   jit: 0.05 },
  { label: 'FORECAST ACCURACY',    target: 94.7,  fmt: (v) => v.toFixed(1) + '%',        delta: '+2.1%',  color: C.emerald, jit: 0.08 },
  { label: 'OPERATIONAL RISK',     target: 18,    fmt: (v) => Math.round(v) + '/100',    delta: '-4pts',  color: C.red,     jit: 0.2  },
];

export const BOOT_LINES = [
  'Loading data ingestion layers...',
  'Compiling spreadsheet profiling engines...',
  'Ready.',
];

/* ---- helpers ---- */
export const rand = (a, b) => a + Math.random() * (b - a);

export const mkThought = (t) => ({
  id: Math.random(),
  text: t[0],
  type: t[1],
  conf: Math.round(rand(88, 98)),
  time: new Date().toLocaleTimeString('en-GB'),
});

export const genNexus = (name) => ({
  name,
  lat: Math.round(rand(8, 25)),
  tp: rand(1.2, 4.8).toFixed(1),
  health: 'OPTIMAL',
});

/* ---- Clean Light CSS ---- */
export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; background: #F8FAFC; }
body { font-family: 'Inter', sans-serif; color: #0F172A; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
::selection { background: rgba(79,70,229,0.15); }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

/* ---- layout shell ---- */
.cx-root { min-height: 100vh; position: relative; background: #F8FAFC; }
.cx-app  { position: relative; z-index: 1; animation: appIn 0.4s ease both; }
@keyframes appIn { from { opacity: 0; } to { opacity: 1; } }

/* ---- sidebar ---- */
.cx-side { position: fixed; left: 0; top: 0; bottom: 0; width: 240px; z-index: 30; background: #FFFFFF; border-right: 1px solid #E2E8F0; display: flex; flex-direction: column; }
.cx-logo { display: flex; align-items: center; gap: 10px; padding: 24px 20px; border-bottom: 1px solid #F1F5F9; }
.cx-logo-name { font-family: 'Inter'; font-weight: 700; font-size: 16px; color: #0F172A; letter-spacing: -0.5px; }
.cx-logo-tag  { font-size: 10px; color: #64748B; margin-top: 2px; }
.cx-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
.cx-nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px; cursor: pointer; color: #64748B; font-size: 13.5px; font-weight: 500; transition: all 0.2s; margin-bottom: 4px; }
.cx-nav-item:hover { color: #0F172A; background: #F1F5F9; }
.cx-nav-item.active { color: #4F46E5; background: #EEF2FF; }
.cx-nav-icon  { font-size: 15px; }
.cx-sys { padding: 16px 20px; border-top: 1px solid #F1F5F9; font-size: 11px; color: #64748B; }

/* ---- topbar / main ---- */
.cx-main { margin-left: 240px; padding: 24px 32px 100px; }
.cx-top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid #E2E8F0; margin-bottom: 24px; }
.cx-module { font-size: 22px; font-weight: 700; color: #0F172A; letter-spacing: -0.5px; }
.cx-omni { display: flex; align-items: center; gap: 8px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 6px 12px; color: #64748B; font-size: 12.5px; cursor: pointer; transition: all 0.2s; }
.cx-omni:hover { border-color: #CBD5E1; color: #0F172A; }
.cx-kbd { font-family: 'JetBrains Mono'; font-size: 10px; background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 4px; padding: 1px 5px; color: #4F46E5; }
.cx-avatar { width: 32px; height: 32px; border-radius: 50%; background: #EEF2FF; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 12px; color: #4F46E5; }

/* ---- dataset bar ---- */
.ds-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
.ds-tab { font-family: 'Inter'; font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 6px; border: 1px solid #E2E8F0; background: #FFFFFF; cursor: pointer; color: #64748B; transition: all 0.2s; }
.ds-tab:hover  { border-color: #CBD5E1; color: #0F172A; }
.ds-tab.active { border-color: #4F46E5; color: #4F46E5; background: #EEF2FF; }
.ds-tab .ds-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }
.ds-add { font-size: 12px; font-weight: 500; color: #4F46E5; border: 1px dashed #CBD5E1; padding: 5px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.ds-add:hover { border-color: #4F46E5; background: #EEF2FF; }

/* ---- panel base ---- */
.panel { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.panel-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.panel-title { font-size: 15.5px; font-weight: 600; color: #0F172A; display: flex; align-items: center; gap: 8px; }

/* ---- workspace grids ---- */
.cx-2col  { display: grid; grid-template-columns: 1fr 420px; gap: 24px; align-items: start; }
.cx-2col-left  { display: grid; grid-template-columns: 420px 1fr; gap: 24px; align-items: start; }
.cx-full  { display: flex; flex-direction: column; gap: 20px; }
.cx-col   { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
@media (max-width: 1200px) {
  .cx-2col { grid-template-columns: 1fr; }
  .cx-2col-left { grid-template-columns: 1fr; }
}

/* ---- KPI strip ---- */
.kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
@media (max-width: 900px) { .kpi-strip { grid-template-columns: repeat(2, 1fr); } }
.kpi { padding: 16px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; }
.kpi-label { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
.kpi-val   { font-size: 24px; font-weight: 700; color: #0F172A; margin: 8px 0 4px; }
.kpi-delta { font-size: 12px; font-weight: 500; color: #059669; }

/* ---- alerts ---- */
.alert { border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; background: #FEF2F2; border: 1px solid #FEE2E2; color: #991B1B; }
.alert-title { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
.alert-rec { font-size: 12px; opacity: 0.9; }

/* ---- dropzone ---- */
.dropzone { cursor: pointer; border: 2px dashed #CBD5E1; text-align: center; padding: 40px 20px; border-radius: 12px; background: #FFFFFF; transition: all 0.2s; }
.dropzone:hover, .dropzone.over { border-color: #4F46E5; background: #EEF2FF; }
.dz-ico { font-size: 32px; color: #4F46E5; margin-bottom: 8px; }

/* ---- cleaner checkbox/controls ---- */
.clean-opt { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; cursor: pointer; }
.clean-opt input { margin-top: 3px; width: 15px; height: 15px; accent-color: #4F46E5; }
.clean-opt-label { font-size: 13.5px; font-weight: 500; color: #0F172A; }
.clean-opt-desc  { font-size: 12px; color: #64748B; margin-top: 2px; }

.sim-btn { display: inline-flex; align-items: center; justify-content: center; font-family: 'Inter'; font-size: 13.5px; font-weight: 600; padding: 10px 18px; border-radius: 8px; border: none; background: #4F46E5; color: #FFFFFF; cursor: pointer; transition: all 0.2s; }
.sim-btn:hover { background: #4338CA; }
.sim-btn:disabled { background: #94A3B8; cursor: not-allowed; }

/* ---- tables ---- */
.fc-table-container { overflow-x: auto; border: 1px solid #E2E8F0; border-radius: 8px; background: #FFFFFF; }
.fc-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
.fc-table th { background: #F8FAFC; color: #64748B; font-weight: 600; padding: 12px 16px; border-bottom: 1px solid #E2E8F0; }
.fc-table td { padding: 12px 16px; border-bottom: 1px solid #E2E8F0; color: #334155; }
.fc-table tr:hover td { background: #F8FAFC; }

/* ---- profile list ---- */
.prof-badge { font-family: 'JetBrains Mono'; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 500; }
.badge-numeric { background: #EEF2FF; color: #4F46E5; }
.badge-date    { background: #ECFDF5; color: #059669; }
.badge-cat     { background: #FFF7ED; color: #C2410C; }
.badge-id      { background: #F1F5F9; color: #475569; }

/* ---- correlation matrix ---- */
.corr-cell { border-radius: 4px; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-size: 11px; min-height: 32px; transition: all 0.2s; cursor: default; }
.corr-cell:hover { transform: scale(1.1); z-index: 2; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.corr-label { font-size: 11px; font-weight: 600; color: #64748B; text-align: center; padding: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ---- command palette ---- */
.pal-overlay { position: fixed; inset: 0; z-index: 60; background: rgba(15,23,42,0.3); backdrop-filter: blur(4px); display: flex; justify-content: center; padding-top: 14vh; }
.pal { width: 600px; max-width: 92vw; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
.pal-input { padding: 14px 20px; font-size: 14px; background: transparent; border: none; border-bottom: 1px solid #E2E8F0; color: #0F172A; outline: none; width: 100%; }
.pal-list  { overflow-y: auto; max-height: 40vh; padding: 8px; }
.pal-cat   { font-size: 11px; font-weight: 600; color: #94A3B8; padding: 8px 12px 4px; text-transform: uppercase; }
.pal-item  { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.1s; }
.pal-item.sel { background: #EEF2FF; color: #4F46E5; }
.pal-sc { font-family: 'JetBrains Mono'; font-size: 10px; color: #64748B; background: #F1F5F9; padding: 1px 5px; border-radius: 4px; }
.pal-foot { font-size: 11px; color: #94A3B8; padding: 10px 16px; border-top: 1px solid #E2E8F0; }

/* ---- float orb ---- */
.orb-wrap { position: fixed; right: 24px; bottom: 24px; z-index: 40; cursor: pointer; }
.orb { width: 48px; height: 48px; border-radius: 50%; background: #4F46E5; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #FFFFFF; box-shadow: 0 4px 14px rgba(79,70,229,0.4); transition: transform 0.2s; }
.orb-wrap:hover .orb { transform: scale(1.08); }

/* ---- chat ---- */
.chat { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; max-width: 90vw; z-index: 50; background: #FFFFFF; border-left: 1px solid #E2E8F0; display: flex; flex-direction: column; transform: translateX(102%); transition: transform 0.3s ease; box-shadow: -10px 0 30px rgba(0,0,0,0.05); }
.chat.open { transform: none; }
.chat-h { padding: 16px 20px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between; }
.chat-body { flex: 1; overflow-y: auto; padding: 16px; background: #F8FAFC; }
.msg { margin-bottom: 12px; max-width: 85%; }
.msg.user { margin-left: auto; }
.msg-bubble { border-radius: 8px; padding: 10px 14px; font-size: 13px; line-height: 1.5; }
.msg.user .msg-bubble { background: #4F46E5; color: #FFFFFF; }
.msg.ai   .msg-bubble { background: #FFFFFF; color: #0F172A; border: 1px solid #E2E8F0; }
.chat-input { display: flex; gap: 8px; padding: 16px; border-top: 1px solid #E2E8F0; background: #FFFFFF; }
.chat-input input { flex: 1; border: 1px solid #D1D5DB; border-radius: 6px; padding: 8px 12px; font-size: 13px; outline: none; }
.chat-input input:focus { border-color: #4F46E5; }

/* ---- Presentation Boardroom ---- */
.present { position: fixed; inset: 0; z-index: 90; background: #FFFFFF; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; }
.present-slide { max-width: 800px; width: 100%; text-align: center; }
.present-tag   { font-family: 'JetBrains Mono'; font-size: 12px; color: #4F46E5; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
.present-title { font-size: 36px; font-weight: 700; color: #0F172A; margin: 16px 0; }
.present-big   { font-size: 64px; font-weight: 800; color: #4F46E5; }
.present-sub   { font-size: 16px; color: #64748B; line-height: 1.6; }
.present-close { position: fixed; top: 20px; right: 24px; font-size: 24px; color: #64748B; cursor: pointer; }
.present-nav   { position: fixed; bottom: 40px; display: flex; gap: 12px; align-items: center; }
.present-arrow { width: 40px; height: 40px; border-radius: 50%; border: 1px solid #E2E8F0; background: #FFFFFF; color: #0F172A; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.present-arrow:hover { background: #F1F5F9; }
.present-dots  { display: flex; gap: 6px; }
.present-dots i { width: 6px; height: 6px; border-radius: 50%; background: #CBD5E1; }
.present-dots i.on { background: #4F46E5; width: 16px; border-radius: 3px; }


/* ---- Reasoning Feed ---- */
.chain { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 6px; }
.chain-node { font-family: 'Inter', sans-serif; font-size: 10.5px; font-weight: 600; padding: 4px 8px; background: #EEF2FF; color: #4F46E5; border: 1px solid #E2E8F0; border-radius: 4px; white-space: nowrap; }
.chain-link { width: 12px; height: 1px; background: #E2E8F0; flex-shrink: 0; }
.feed-item { border-top: 1px solid #F1F5F9; padding-top: 10px; margin-top: 10px; }
.feed-meta { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748B; margin-bottom: 4px; }
.feed-type { font-weight: 700; color: #4F46E5; }
.feed-conf { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
.feed-text { font-size: 12px; color: #0F172A; line-height: 1.4; }
.feed-bar { width: 100%; height: 3px; background: #F1F5F9; border-radius: 1.5px; margin-top: 6px; overflow: hidden; }
.feed-bar > div { height: 100%; background: #4F46E5; border-radius: 1.5px; }

/* ---- War Room emergency mode override ---- */
.cx-app.war-room {
  background: #090202 !important;
  color: #FEE2E2 !important;
  --wr-accent: #EF4444;
  --wr-glow: rgba(239, 68, 68, 0.15);
  --wr-border: #7F1D1D;
}
.cx-app.war-room .cx-main {
  background: #090202 !important;
}
.cx-app.war-room .cx-side {
  background: #090202 !important;
  border-right: 1px solid #7F1D1D !important;
}
.cx-app.war-room .cx-logo-name {
  color: #EF4444 !important;
}
.cx-app.war-room .cx-logo-tag,
.cx-app.war-room .cx-nav-item,
.cx-app.war-room .cx-sys {
  color: #FCA5A5 !important;
}
.cx-app.war-room .cx-nav-item:hover {
  background: #450A0A !important;
  color: #FFF !important;
}
.cx-app.war-room .cx-nav-item.active {
  background: #7F1D1D !important;
  color: #EF4444 !important;
}
.cx-app.war-room .cx-top {
  border-bottom: 1px solid #7F1D1D !important;
}
.cx-app.war-room .cx-module,
.cx-app.war-room .cx-kbd,
.cx-app.war-room .cx-avatar {
  color: #EF4444 !important;
}
.cx-app.war-room .cx-avatar {
  background: #450A0A !important;
  border: 1px solid #7F1D1D !important;
}
.cx-app.war-room .panel {
  background: #0F0505 !important;
  border: 1px solid #7F1D1D !important;
  box-shadow: 0 4px 25px rgba(239, 68, 68, 0.08) !important;
}
.cx-app.war-room .panel-title,
.cx-app.war-room .kpi-val {
  color: #FFF !important;
}
.cx-app.war-room .kpi {
  background: #0F0505 !important;
  border: 1px solid #7F1D1D !important;
}
.cx-app.war-room .ds-tab {
  background: #0F0505 !important;
  border: 1px solid #7F1D1D !important;
  color: #FCA5A5 !important;
}
.cx-app.war-room .ds-tab.active {
  background: #450A0A !important;
  border-color: #EF4444 !important;
  color: #EF4444 !important;
}
.cx-app.war-room .fc-table-container,
.cx-app.war-room .fc-table th,
.cx-app.war-room .fc-table td {
  border-color: #7F1D1D !important;
}
.cx-app.war-room .fc-table th {
  background: #1F0707 !important;
  color: #FCA5A5 !important;
}
.cx-app.war-room .fc-table td {
  color: #FECACA !important;
}
.cx-app.war-room .fc-table tr:hover td {
  background: #2D0808 !important;
}
.cx-app.war-room .sim-btn {
  background: #EF4444 !important;
}
.cx-app.war-room .sim-btn:hover {
  background: #DC2626 !important;
}
.cx-app.war-room input[type="text"],
.cx-app.war-room select {
  background: #1F0707 !important;
  border-color: #7F1D1D !important;
  color: #FFF !important;
}

/* ---- OMEGA Connectivity Fabric & Terminal ---- */
.fabric-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin-top: 16px; }
.fabric-card { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 8px; position: relative; overflow: hidden; transition: all 0.2s; }
.fabric-card:hover { border-color: #CBD5E1; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
.status-glow { width: 8px; height: 8px; border-radius: 50%; display: inline-block; position: relative; }
.status-glow::after { content: ''; position: absolute; width: 100%; height: 100%; border-radius: 50%; background: inherit; animation: pulseGlow 1s infinite alternate; }
@keyframes pulseGlow { from { transform: scale(1); opacity: 0.8; } to { transform: scale(1.8); opacity: 0; } }
.river-container { width: 100%; height: 80px; background: #0F172A; border-radius: 8px; margin: 12px 0; overflow: hidden; position: relative; }
.terminal-box { background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 14px; font-family: 'JetBrains Mono', monospace; color: #F1F5F9; display: flex; flex-direction: column; gap: 8px; height: 350px; }
.terminal-prompt { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #1E293B; padding-bottom: 8px; }
.terminal-input { flex: 1; background: transparent; border: none; outline: none; color: #38BDF8; font-family: inherit; font-size: 13px; }
.terminal-output { flex: 1; overflow-y: auto; font-size: 11.5px; line-height: 1.5; color: #E2E8F0; }
.terminal-plan { margin-top: 10px; background: #1E293B; border-radius: 6px; padding: 10px; font-size: 10.5px; border: 1px solid #334155; }
.flow-grid { display: flex; align-items: center; gap: 20px; overflow-x: auto; padding: 20px 10px; }
.flow-node { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; min-width: 140px; display: flex; flex-direction: column; gap: 4px; text-align: center; cursor: pointer; transition: all 0.2s; }
.flow-node.active { border-color: #4F46E5; box-shadow: 0 0 10px rgba(79, 70, 229, 0.15); }
.flow-edge-path { stroke-dasharray: 5 5; animation: dashMove 1s linear infinite; }
.immersive-overlay { position: fixed; inset: 0; z-index: 1000; background: #030712; display: flex; }
.immersive-controls { position: absolute; top: 20px; right: 20px; background: rgba(15, 23, 42, 0.95); border: 1px solid #334155; border-radius: 8px; padding: 16px; width: 260px; color: #F1F5F9; display: flex; flex-direction: column; gap: 12px; z-index: 1001; backdrop-filter: blur(8px); }
.hologram-btn { border: 1px solid #38BDF8; background: rgba(56, 189, 248, 0.1); color: #38BDF8; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 11px; text-align: center; }
.hologram-btn:hover { background: rgba(56, 189, 248, 0.2); }

/* ---- War Room styles for new classes ---- */
.cx-app.war-room .fabric-card { background: #0F0505 !important; border-color: #7F1D1D !important; color: #FECACA !important; }
.cx-app.war-room .fabric-card:hover { border-color: #EF4444 !important; }
.cx-app.war-room .terminal-box { border-color: #7F1D1D !important; background: #0F0505 !important; }
.cx-app.war-room .terminal-plan { background: #220707 !important; border-color: #7F1D1D !important; }
.cx-app.war-room .flow-node { background: #0F0505 !important; border-color: #7F1D1D !important; color: #FECACA !important; }
.cx-app.war-room .flow-node.active { border-color: #EF4444 !important; box-shadow: 0 0 10px rgba(239, 68, 68, 0.15) !important; }
`;

export const SYSTEM_PROMPT = 'You are CORTEX, the enterprise data profiling co-pilot. Respond like an elite data analyst. Use structured bullets, confidence scores, and strategic recommendations.';

/* ---- Enterprise Relational Demo Data ---- */
export const MOCK_CUSTOMERS = [
  { customer_id: 'C-001', customer_name: 'Acme Corp', segment: 'Enterprise', region: 'APAC', risk_score: '12' },
  { customer_id: 'C-002', customer_name: 'Global Industries', segment: 'Enterprise', region: 'EMEA', risk_score: '45' },
  { customer_id: 'C-003', customer_name: 'Apex Ltd', segment: 'Mid-Market', region: 'APAC', risk_score: '78' },
  { customer_id: 'C-004', customer_name: 'Starlight Co', segment: 'SMB', region: 'AMER', risk_score: '15' },
  { customer_id: 'C-005', customer_name: 'Nexus Partners', segment: 'Mid-Market', region: 'AMER', risk_score: '32' },
  { customer_id: 'C-006', customer_name: 'Horizon Tech', segment: 'Enterprise', region: 'APAC', risk_score: '54' },
  { customer_id: 'C-007', customer_name: 'Vortex LLC', segment: 'SMB', region: 'EMEA', risk_score: '22' }
];

export const MOCK_TRANSACTIONS = [
  { transaction_id: 'T-101', customer_id: 'C-001', product_id: 'P-90', amount: '12500', date: '2026-01-15' },
  { transaction_id: 'T-102', customer_id: 'C-002', product_id: 'P-82', amount: '8400', date: '2026-01-20' },
  { transaction_id: 'T-103', customer_id: 'C-003', product_id: 'P-90', amount: '4300', date: '2026-02-02' },
  { transaction_id: 'T-104', customer_id: 'C-001', product_id: 'P-44', amount: '19200', date: '2026-02-18' },
  { transaction_id: 'T-105', customer_id: 'C-005', product_id: 'P-82', amount: '6000', date: '2026-03-01' },
  { transaction_id: 'T-106', customer_id: 'C-001', product_id: 'P-90', amount: '11000', date: '2026-03-12' },
  { transaction_id: 'T-107', customer_id: 'C-002', product_id: 'P-44', amount: '15000', date: '2026-03-25' },
  { transaction_id: 'T-108', customer_id: 'C-006', product_id: 'P-82', amount: '22500', date: '2026-04-02' },
  { transaction_id: 'T-109', customer_id: 'C-007', product_id: 'P-90', amount: '3100', date: '2026-04-10' },
  { transaction_id: 'T-110', customer_id: 'C-003', product_id: 'P-44', amount: '8900', date: '2026-04-15' }
];

export const MOCK_SUPPORT_TICKETS = [
  { ticket_id: 'S-501', customer_id: 'C-001', issue_type: 'Logistics Delay', delay_hours: '48', refunds_issued: '250' },
  { ticket_id: 'S-502', customer_id: 'C-003', issue_type: 'Billing Dispute', delay_hours: '12', refunds_issued: '0' },
  { ticket_id: 'S-503', customer_id: 'C-001', issue_type: 'Warehouse Overload', delay_hours: '72', refunds_issued: '500' },
  { ticket_id: 'S-504', customer_id: 'C-005', issue_type: 'Technical Glitch', delay_hours: '4', refunds_issued: '0' },
  { ticket_id: 'S-505', customer_id: 'C-002', issue_type: 'Refund Request', delay_hours: '36', refunds_issued: '120' },
  { ticket_id: 'S-506', customer_id: 'C-006', issue_type: 'Logistics Delay', delay_hours: '96', refunds_issued: '1500' },
  { ticket_id: 'S-507', customer_id: 'C-007', issue_type: 'Billing Dispute', delay_hours: '8', refunds_issued: '0' }
];

/* ---- Industry Configuration Override Maps ---- */
export const INDUSTRY_LABELS = {
  saas: ['MONTHLY RECURRING REVENUE (MRR)', 'CUSTOMER CHURN RATE', 'LIFETIME VALUE (LTV)', 'ANNUAL RUN RATE (ARR)', 'ANNUAL CONTRACT VALUE (ACV)', 'NET PROMOTER SCORE'],
  retail: ['GROSS MERCHANDISE VALUE (GMV)', 'STORE CONVERSION RATE', 'AVERAGE ORDER VALUE (AOV)', 'CUSTOMER REFUND RATE', 'WALK-IN STORE TRAFFIC', 'GROSS MERCHANDISE MARGIN'],
  finance: ['TOTAL TRANSACTION VOLUME', 'DETECTED FRAUD RATE', 'NET OVERALL MARGIN', 'LIQUIDITY RISK SCALE', 'CAPITAL ADEQUACY LIMIT', 'LOAN DEFAULT RATIO'],
  logistics: ['TOTAL DELIVERED TONNAGE', 'FLEET LOGISTICS LOAD', 'PORT DELAYS (HOURS)', 'FLEET FUEL EFFICIENCY', 'ROUTE TRANSIT TIME', 'SAFETY COMPLIANCE INDEX']
};

export const INDUSTRY_KPIS = {
  saas: [
    { label: 'MONTHLY RECURRING REVENUE (MRR)', target: 1284000, delta: '+12.4%', color: '#4F46E5', mean: 1280000, min: 1100000, max: 1450000, kind: 'TOTAL' },
    { label: 'CUSTOMER CHURN RATE', target: 3.2, delta: '-0.8%', color: '#D97706', mean: 3.1, min: 2.8, max: 3.5, kind: 'AVG' },
    { label: 'CUSTOMER LIFETIME VALUE (LTV)', target: 24500, delta: '+5.4%', color: '#059669', mean: 24100, min: 22000, max: 26000, kind: 'AVG' },
    { label: 'ANNUAL RUN RATE (ARR)', target: 15400000, delta: '+15.2%', color: '#DC2626', mean: 15100000, min: 13000000, max: 17000000, kind: 'TOTAL' }
  ],
  retail: [
    { label: 'GROSS MERCHANDISE VALUE (GMV)', target: 2480000, delta: '+8.7%', color: '#4F46E5', mean: 2420000, min: 2100000, max: 2750000, kind: 'TOTAL' },
    { label: 'STORE CONVERSION RATE', target: 2.85, delta: '+0.15%', color: '#D97706', mean: 2.75, min: 2.40, max: 3.10, kind: 'AVG' },
    { label: 'AVERAGE ORDER VALUE (AOV)', target: 112.5, delta: '+$4.20', color: '#059669', mean: 110.0, min: 95.0, max: 125.0, kind: 'AVG' },
    { label: 'CUSTOMER REFUND RATE', target: 4.1, delta: '-0.5%', color: '#DC2626', mean: 4.3, min: 3.8, max: 4.9, kind: 'AVG' }
  ],
  finance: [
    { label: 'TOTAL TRANSACTION VOLUME', target: 45800000, delta: '+18.1%', color: '#4F46E5', mean: 44200000, min: 41000000, max: 48000000, kind: 'TOTAL' },
    { label: 'DETECTED FRAUD RATE', target: 0.124, delta: '-0.015%', color: '#D97706', mean: 0.135, min: 0.110, max: 0.160, kind: 'AVG' },
    { label: 'NET OVERALL MARGIN', target: 82.4, delta: '+2.1%', color: '#059669', mean: 81.8, min: 79.5, max: 84.0, kind: 'AVG' },
    { label: 'LIQUIDITY RISK SCALE', target: 18.0, delta: '-3pts', color: '#DC2626', mean: 19.5, min: 15.0, max: 22.0, kind: 'AVG' }
  ],
  logistics: [
    { label: 'TOTAL DELIVERED TONNAGE', target: 148200, delta: '+4.5%', color: '#4F46E5', mean: 144000, min: 130000, max: 155000, kind: 'TOTAL' },
    { label: 'FLEET LOGISTICS LOAD', target: 88.4, delta: '+2.3%', color: '#D97706', mean: 87.2, min: 84.5, max: 91.0, kind: 'AVG' },
    { label: 'PORT DELAYS (HOURS)', target: 36.0, delta: '-6 hrs', color: '#059669', mean: 39.5, min: 28.0, max: 48.0, kind: 'AVG' },
    { label: 'FLEET FUEL EFFICIENCY', target: 94.2, delta: '+1.1%', color: '#DC2626', mean: 93.5, min: 92.0, max: 95.5, kind: 'AVG' }
  ]
};

/* ---- Temporal KPI configurations by Era ---- */
export const TEMPORAL_KPIS = {
  'q2-2024': {
    saas: [
      { label: 'MONTHLY RECURRING REVENUE (MRR)', target: 910000, delta: '-4.2%', color: '#DC2626', mean: 950000, min: 890000, max: 1020000, kind: 'TOTAL' },
      { label: 'CUSTOMER CHURN RATE', target: 12.4, delta: '+8.8%', color: '#DC2626', mean: 11.2, min: 8.5, max: 13.0, kind: 'AVG' },
      { label: 'CUSTOMER LIFETIME VALUE (LTV)', target: 18200, delta: '-15.4%', color: '#DC2626', mean: 19500, min: 17000, max: 21000, kind: 'AVG' },
      { label: 'ANNUAL RUN RATE (ARR)', target: 10920000, delta: '-8.5%', color: '#DC2626', mean: 11400000, min: 10000000, max: 12200000, kind: 'TOTAL' }
    ],
    retail: [
      { label: 'GROSS MERCHANDISE VALUE (GMV)', target: 1840000, delta: '-5.2%', color: '#DC2626', mean: 1950000, min: 1750000, max: 2100000, kind: 'TOTAL' },
      { label: 'STORE CONVERSION RATE', target: 1.95, delta: '-0.45%', color: '#DC2626', mean: 2.10, min: 1.80, max: 2.30, kind: 'AVG' },
      { label: 'AVERAGE ORDER VALUE (AOV)', target: 88.5, delta: '-$6.20', color: '#DC2626', mean: 92.0, min: 82.0, max: 98.0, kind: 'AVG' },
      { label: 'CUSTOMER REFUND RATE', target: 9.4, delta: '+4.1%', color: '#DC2626', mean: 8.8, min: 7.2, max: 10.5, kind: 'AVG' }
    ],
    finance: [
      { label: 'TOTAL TRANSACTION VOLUME', target: 31200000, delta: '-6.5%', color: '#DC2626', mean: 33500000, min: 29000000, max: 35000000, kind: 'TOTAL' },
      { label: 'DETECTED FRAUD RATE', target: 0.385, delta: '+0.12%', color: '#DC2626', mean: 0.310, min: 0.220, max: 0.450, kind: 'AVG' },
      { label: 'NET OVERALL MARGIN', target: 74.2, delta: '-4.1%', color: '#DC2626', mean: 76.5, min: 72.0, max: 79.0, kind: 'AVG' },
      { label: 'LIQUIDITY RISK SCALE', target: 48.0, delta: '+12pts', color: '#DC2626', mean: 42.0, min: 35.0, max: 52.0, kind: 'AVG' }
    ],
    logistics: [
      { label: 'TOTAL DELIVERED TONNAGE', target: 112000, delta: '-8.4%', color: '#DC2626', mean: 118000, min: 105000, max: 125000, kind: 'TOTAL' },
      { label: 'FLEET LOGISTICS LOAD', target: 74.5, delta: '-5.2%', color: '#DC2626', mean: 76.8, min: 71.0, max: 80.0, kind: 'AVG' },
      { label: 'PORT DELAYS (HOURS)', target: 96.0, delta: '+48 hrs', color: '#DC2626', mean: 82.0, min: 60.0, max: 105.0, kind: 'AVG' },
      { label: 'FLEET FUEL EFFICIENCY', target: 88.2, delta: '-2.4%', color: '#DC2626', mean: 89.5, min: 87.0, max: 91.0, kind: 'AVG' }
    ]
  },
  'q4-2024': {
    saas: [
      { label: 'MONTHLY RECURRING REVENUE (MRR)', target: 1050000, delta: '+4.5%', color: '#4F46E5', mean: 1020000, min: 950000, max: 1100000, kind: 'TOTAL' },
      { label: 'CUSTOMER CHURN RATE', target: 5.6, delta: '-2.1%', color: '#059669', mean: 6.2, min: 5.0, max: 7.2, kind: 'AVG' },
      { label: 'CUSTOMER LIFETIME VALUE (LTV)', target: 21000, delta: '+$1.2K', color: '#059669', mean: 20200, min: 19000, max: 22000, kind: 'AVG' },
      { label: 'ANNUAL RUN RATE (ARR)', target: 12600000, delta: '+5.4%', color: '#4F46E5', mean: 12240000, min: 11400000, max: 13200000, kind: 'TOTAL' }
    ],
    retail: [
      { label: 'GROSS MERCHANDISE VALUE (GMV)', target: 2880000, delta: '+12.4%', color: '#059669', mean: 2750000, min: 2500000, max: 3100000, kind: 'TOTAL' },
      { label: 'STORE CONVERSION RATE', target: 3.12, delta: '+0.45%', color: '#059669', mean: 2.90, min: 2.60, max: 3.35, kind: 'AVG' },
      { label: 'AVERAGE ORDER VALUE (AOV)', target: 124.8, delta: '+$8.40', color: '#059669', mean: 118.0, min: 105.0, max: 130.0, kind: 'AVG' },
      { label: 'CUSTOMER REFUND RATE', target: 7.2, delta: '+1.5%', color: '#D97706', mean: 6.5, min: 5.0, max: 8.0, kind: 'AVG' }
    ],
    finance: [
      { label: 'TOTAL TRANSACTION VOLUME', target: 41200000, delta: '+10.2%', color: '#059669', mean: 39500000, min: 36000000, max: 43000000, kind: 'TOTAL' },
      { label: 'DETECTED FRAUD RATE', target: 0.185, delta: '-0.04%', color: '#059669', mean: 0.210, min: 0.160, max: 0.250, kind: 'AVG' },
      { label: 'NET OVERALL MARGIN', target: 80.5, delta: '+1.8%', color: '#059669', mean: 79.2, min: 77.0, max: 82.0, kind: 'AVG' },
      { label: 'LIQUIDITY RISK SCALE', target: 24.0, delta: '-8pts', color: '#059669', mean: 26.5, min: 22.0, max: 31.0, kind: 'AVG' }
    ],
    logistics: [
      { label: 'TOTAL DELIVERED TONNAGE', target: 154000, delta: '+14.5%', color: '#059669', mean: 142000, min: 130000, max: 165000, kind: 'TOTAL' },
      { label: 'FLEET LOGISTICS LOAD', target: 94.2, delta: '+6.1%', color: '#D97706', mean: 91.0, min: 87.0, max: 96.0, kind: 'AVG' },
      { label: 'PORT DELAYS (HOURS)', target: 72.0, delta: '+24 hrs', color: '#D97706', mean: 62.0, min: 48.0, max: 80.0, kind: 'AVG' },
      { label: 'FLEET FUEL EFFICIENCY', target: 91.4, delta: '+0.8%', color: '#059669', mean: 90.8, min: 89.0, max: 92.5, kind: 'AVG' }
    ]
  },
  'q1-2025': {
    saas: [
      { label: 'MONTHLY RECURRING REVENUE (MRR)', target: 1120000, delta: '+3.1%', color: '#4F46E5', mean: 1100000, min: 1050000, max: 1180000, kind: 'TOTAL' },
      { label: 'CUSTOMER CHURN RATE', target: 4.8, delta: '-0.4%', color: '#059669', mean: 5.0, min: 4.2, max: 5.6, kind: 'AVG' },
      { label: 'CUSTOMER LIFETIME VALUE (LTV)', target: 22400, delta: '+$800', color: '#059669', mean: 22000, min: 21000, max: 23500, kind: 'AVG' },
      { label: 'ANNUAL RUN RATE (ARR)', target: 13440000, delta: '+4.0%', color: '#4F46E5', mean: 13200000, min: 12600000, max: 14160000, kind: 'TOTAL' }
    ],
    retail: [
      { label: 'GROSS MERCHANDISE VALUE (GMV)', target: 2150000, delta: '-8.5%', color: '#D97706', mean: 2280000, min: 2000000, max: 2450000, kind: 'TOTAL' },
      { label: 'STORE CONVERSION RATE', target: 2.24, delta: '-0.32%', color: '#D97706', mean: 2.40, min: 2.10, max: 2.65, kind: 'AVG' },
      { label: 'AVERAGE ORDER VALUE (AOV)', target: 104.5, delta: '-$4.20', color: '#D97706', mean: 108.0, min: 98.0, max: 114.0, kind: 'AVG' },
      { label: 'CUSTOMER REFUND RATE', target: 5.8, delta: '-0.4%', color: '#059669', mean: 6.0, min: 5.2, max: 6.8, kind: 'AVG' }
    ],
    finance: [
      { label: 'TOTAL TRANSACTION VOLUME', target: 36800000, delta: '-12.0%', color: '#DC2626', mean: 39500000, min: 35000000, max: 42000000, kind: 'TOTAL' },
      { label: 'DETECTED FRAUD RATE', target: 0.482, delta: '+0.24%', color: '#DC2626', mean: 0.390, min: 0.280, max: 0.540, kind: 'AVG' },
      { label: 'NET OVERALL MARGIN', target: 71.8, delta: '-6.4%', color: '#DC2626', mean: 75.0, min: 70.0, max: 78.5, kind: 'AVG' },
      { label: 'LIQUIDITY RISK SCALE', target: 36.0, delta: '+8pts', color: '#DC2626', mean: 31.0, min: 25.0, max: 40.0, kind: 'AVG' }
    ],
    logistics: [
      { label: 'TOTAL DELIVERED TONNAGE', target: 132000, delta: '+2.1%', color: '#4F46E5', mean: 130000, min: 124000, max: 138000, kind: 'TOTAL' },
      { label: 'FLEET LOGISTICS LOAD', target: 82.4, delta: '+1.5%', color: '#4F46E5', mean: 81.0, min: 78.0, max: 84.5, kind: 'AVG' },
      { label: 'PORT DELAYS (HOURS)', target: 32.0, delta: '-8 hrs', color: '#059669', mean: 35.5, min: 28.0, max: 42.0, kind: 'AVG' },
      { label: 'FLEET FUEL EFFICIENCY', target: 93.5, delta: '+0.5%', color: '#059669', mean: 93.0, min: 91.5, max: 94.5, kind: 'AVG' }
    ]
  },
  'q2-2026': {
    saas: [
      { label: 'MONTHLY RECURRING REVENUE (MRR)', target: 1284000, delta: '+12.4%', color: '#4F46E5', mean: 1280000, min: 1100000, max: 1450000, kind: 'TOTAL' },
      { label: 'CUSTOMER CHURN RATE', target: 3.2, delta: '-0.8%', color: '#D97706', mean: 3.1, min: 2.8, max: 3.5, kind: 'AVG' },
      { label: 'CUSTOMER LIFETIME VALUE (LTV)', target: 24500, delta: '+5.4%', color: '#059669', mean: 24100, min: 22000, max: 26000, kind: 'AVG' },
      { label: 'ANNUAL RUN RATE (ARR)', target: 15400000, delta: '+15.2%', color: '#DC2626', mean: 15100000, min: 13000000, max: 17000000, kind: 'TOTAL' }
    ],
    retail: [
      { label: 'GROSS MERCHANDISE VALUE (GMV)', target: 2480000, delta: '+8.7%', color: '#4F46E5', mean: 2420000, min: 2100000, max: 2750000, kind: 'TOTAL' },
      { label: 'STORE CONVERSION RATE', target: 2.85, delta: '+0.15%', color: '#D97706', mean: 2.75, min: 2.40, max: 3.10, kind: 'AVG' },
      { label: 'AVERAGE ORDER VALUE (AOV)', target: 112.5, delta: '+$4.20', color: '#059669', mean: 110.0, min: 95.0, max: 125.0, kind: 'AVG' },
      { label: 'CUSTOMER REFUND RATE', target: 4.1, delta: '-0.5%', color: '#DC2626', mean: 4.3, min: 3.8, max: 4.9, kind: 'AVG' }
    ],
    finance: [
      { label: 'TOTAL TRANSACTION VOLUME', target: 45800000, delta: '+18.1%', color: '#4F46E5', mean: 44200000, min: 41000000, max: 48000000, kind: 'TOTAL' },
      { label: 'DETECTED FRAUD RATE', target: 0.124, delta: '-0.015%', color: '#D97706', mean: 0.135, min: 0.110, max: 0.160, kind: 'AVG' },
      { label: 'NET OVERALL MARGIN', target: 82.4, delta: '+2.1%', color: '#059669', mean: 81.8, min: 79.5, max: 84.0, kind: 'AVG' },
      { label: 'LIQUIDITY RISK SCALE', target: 18.0, delta: '-3pts', color: '#DC2626', mean: 19.5, min: 15.0, max: 22.0, kind: 'AVG' }
    ],
    logistics: [
      { label: 'TOTAL DELIVERED TONNAGE', target: 148200, delta: '+4.5%', color: '#4F46E5', mean: 144000, min: 130000, max: 155000, kind: 'TOTAL' },
      { label: 'FLEET LOGISTICS LOAD', target: 88.4, delta: '+2.3%', color: '#D97706', mean: 87.2, min: 84.5, max: 91.0, kind: 'AVG' },
      { label: 'PORT DELAYS (HOURS)', target: 36.0, delta: '-6 hrs', color: '#059669', mean: 39.5, min: 28.0, max: 48.0, kind: 'AVG' },
      { label: 'FLEET FUEL EFFICIENCY', target: 94.2, delta: '+1.1%', color: '#DC2626', mean: 93.5, min: 92.0, max: 95.5, kind: 'AVG' }
    ]
  }
};

/* ---- Organizational Weather Maps by Era ---- */
export const TEMPORAL_WEATHER = {
  'q2-2024': [
    { div: 'Logistics', status: '⛈️ Storm Front', desc: 'APAC delays spike' },
    { div: 'Finance', status: '⛅ Partly Cloudy', desc: 'Slight margin dip' },
    { div: 'Customers', status: '⛈️ Churn Cell', desc: 'APAC churn +12%' },
    { div: 'Ingestion', status: '☀️ Sunny', desc: 'Files nominal' }
  ],
  'q4-2024': [
    { div: 'Logistics', status: '🌀 Cyclone', desc: 'Holiday warehouse load' },
    { div: 'Finance', status: '⛅ Overcast', desc: 'Refunds rise 4%' },
    { div: 'Customers', status: '☀️ Sunny', desc: 'Contracts solid' },
    { div: 'Ingestion', status: '☀️ Sunny', desc: 'Clean pipelines' }
  ],
  'q1-2025': [
    { div: 'Logistics', status: '☀️ Sunny', desc: 'Transit optimal' },
    { div: 'Finance', status: '⛈️ Severe Storm', desc: 'Fraud rate +24%' },
    { div: 'Customers', status: '⛅ Mild', desc: 'Nominal tickets' },
    { div: 'Ingestion', status: '⛅ Cloudy', desc: 'Null cells found' }
  ],
  'q2-2026': [
    { div: 'Logistics', status: '☀️ Sunny', desc: 'Transit optimal' },
    { div: 'Finance', status: '☀️ Sunny', desc: 'High margins verified' },
    { div: 'Customers', status: '☀️ Sunny', desc: 'Trust at 96% index' },
    { div: 'Ingestion', status: '☀️ Sunny', desc: '100% schemas matched' }
  ]
};

/* ---- AI Swarm Debate Script (War Room) ---- */
export const DEBATE_SCRIPT = [
  { agent: 'Forecast Swarm', txt: 'Linear model forecasts a -12.4% trend trajectory for the APAC region. I advocate increasing the retention marketing budget by 15% immediately to lock in Arr limits.', color: '#4F46E5' },
  { agent: 'Risk Auditor', txt: 'Objection! Increasing budgets blindly is dangerous. Standard deviation outlier sweeps show financial exposure has already crossed the $240K critical limit. Stricter capital adequacy buffers are needed.', color: '#DC2626' },
  { agent: 'Strategy Architect', txt: 'I propose a balanced reallocation model: Redirect 12% of retention budget to AMER customer acquisition. This keeps our overall Z-score margins stable while reclaiming +4.5% projected Arr.', color: '#059669' },
  { agent: 'Forecast Swarm', txt: 'Recalculating... Simulation of the 12% AMER redirect shows a positive +4.5% growth rate, offsetting the APAC decline. Recalculating Arr trajectory yields high fit.', color: '#4F46E5' },
  { agent: 'Risk Auditor', txt: 'Audit checks out. The AMER redirection path avoids transaction dispute spikes and maintains compliance safety limits. High confidence confirmed.', color: '#DC2626' },
  { agent: 'Strategy Architect', txt: 'Consensus reached. Locking strategic recommendation: Redirect 12% retention budget to SMB/AMER acquisition.', color: '#059669' }
];

/* ---- OMEGA Connector Specifications ---- */
export const MOCK_CONNECTORS = [
  { id: 'postgres', label: 'PostgreSQL', type: 'SQL System', health: 98, latency: 12, tp: 420, active: true },
  { id: 'mysql', label: 'MySQL DB', type: 'SQL System', health: 96, latency: 15, tp: 310, active: false },
  { id: 'mariadb', label: 'MariaDB', type: 'SQL System', health: 95, latency: 16, tp: 180, active: false },
  { id: 'sqlserver', label: 'SQL Server', type: 'SQL System', health: 97, latency: 22, tp: 290, active: false },
  { id: 'oracle', label: 'Oracle Database', type: 'SQL System', health: 94, latency: 28, tp: 550, active: false },
  { id: 'sqlite', label: 'SQLite Local', type: 'SQL System', health: 100, latency: 1, tp: 950, active: true },
  
  { id: 'snowflake', label: 'Snowflake WH', type: 'Enterprise Warehouse', health: 99, latency: 45, tp: 1200, active: true },
  { id: 'bigquery', label: 'Google BigQuery', type: 'Enterprise Warehouse', health: 99, latency: 52, tp: 2400, active: true },
  { id: 'redshift', label: 'Amazon Redshift', type: 'Enterprise Warehouse', health: 95, latency: 60, tp: 1500, active: false },
  { id: 'databricks', label: 'Databricks Delta', type: 'Enterprise Warehouse', health: 98, latency: 38, tp: 1850, active: false },
  { id: 'clickhouse', label: 'ClickHouse Columnar', type: 'Enterprise Warehouse', health: 99, latency: 8, tp: 3200, active: true },
  
  { id: 'mongodb', label: 'MongoDB Cluster', type: 'NoSQL System', health: 94, latency: 14, tp: 880, active: false },
  { id: 'firebase', label: 'Firestore DB', type: 'NoSQL System', health: 98, latency: 9, tp: 650, active: true },
  { id: 'dynamodb', label: 'AWS DynamoDB', type: 'NoSQL System', health: 99, latency: 5, tp: 1400, active: false },
  { id: 'cassandra', label: 'Apache Cassandra', type: 'NoSQL System', health: 92, latency: 25, tp: 1100, active: false },

  { id: 'kafka', label: 'Apache Kafka', type: 'Streaming System', health: 99, latency: 3, tp: 8500, active: true },
  { id: 'rabbitmq', label: 'RabbitMQ Broker', type: 'Streaming System', health: 97, latency: 4, tp: 2400, active: false },
  { id: 'websockets', label: 'WebSockets Node', type: 'Streaming System', health: 98, latency: 2, tp: 1200, active: true },
  { id: 'mqtt', label: 'MQTT Telemetry', type: 'Streaming System', health: 95, latency: 7, tp: 800, active: false },

  { id: 'azureblob', label: 'Azure Blobs', type: 'Cloud Platform', health: 97, latency: 34, tp: 450, active: false },
  { id: 'azuresql', label: 'Azure SQL', type: 'Cloud Platform', health: 98, latency: 18, tp: 350, active: false },
  { id: 'azuresynapse', label: 'Azure Synapse', type: 'Cloud Platform', health: 96, latency: 55, tp: 800, active: false },
  { id: 'awss3', label: 'Amazon S3 Bucket', type: 'Cloud Platform', health: 99, latency: 30, tp: 1200, active: true },
  { id: 'awsathena', label: 'AWS Athena', type: 'Cloud Platform', health: 95, latency: 65, tp: 500, active: false },
  { id: 'gcs', label: 'Google Cloud Storage', type: 'Cloud Platform', health: 99, latency: 28, tp: 950, active: false },

  { id: 'salesforce', label: 'Salesforce CRM', type: 'SaaS Integration', health: 96, latency: 110, tp: 80, active: true },
  { id: 'hubspot', label: 'HubSpot Marketing', type: 'SaaS Integration', health: 97, latency: 95, tp: 50, active: false },
  { id: 'zendesk', label: 'Zendesk Support', type: 'SaaS Integration', health: 95, latency: 105, tp: 40, active: false },
  { id: 'stripe', label: 'Stripe Payments', type: 'SaaS Integration', health: 99, latency: 42, tp: 150, active: true },
  { id: 'shopify', label: 'Shopify Store', type: 'SaaS Integration', health: 98, latency: 80, tp: 90, active: false },
  { id: 'sap', label: 'SAP ERP Connect', type: 'SaaS Integration', health: 93, latency: 140, tp: 120, active: false },
  { id: 'netsuite', label: 'Oracle NetSuite', type: 'SaaS Integration', health: 94, latency: 130, tp: 70, active: false }
];

export const MOCK_DB_TABLES = {
  customers: [
    { customer_id: 'C-001', name: 'Acme Corp', ltv: '$125,000', region: 'APAC', churn_risk: '12%' },
    { customer_id: 'C-002', name: 'Global Industries', ltv: '$84,000', region: 'EMEA', churn_risk: '45%' },
    { customer_id: 'C-003', name: 'Apex Ltd', ltv: '$43,000', region: 'APAC', churn_risk: '78%' },
    { customer_id: 'C-004', name: 'Starlight Co', ltv: '$19,200', region: 'AMER', churn_risk: '15%' },
    { customer_id: 'C-005', name: 'Nexus Partners', ltv: '$60,000', region: 'AMER', churn_risk: '32%' }
  ],
  transactions: [
    { tx_id: 'T-101', customer_id: 'C-001', product_id: 'P-90', amount: '$12,500', date: '2026-01-15' },
    { tx_id: 'T-102', customer_id: 'C-002', product_id: 'P-82', amount: '$8,400', date: '2026-01-20' },
    { tx_id: 'T-103', customer_id: 'C-003', product_id: 'P-90', amount: '$4,300', date: '2026-02-02' },
    { tx_id: 'T-104', customer_id: 'C-001', product_id: 'P-44', amount: '$19,200', date: '2026-02-18' },
    { tx_id: 'T-105', customer_id: 'C-005', product_id: 'P-82', amount: '$6,000', date: '2026-03-01' }
  ],
  support: [
    { ticket_id: 'S-501', customer_id: 'C-001', issue_type: 'Logistics Delay', delay_hours: '48 hrs' },
    { ticket_id: 'S-502', customer_id: 'C-003', issue_type: 'Billing Dispute', delay_hours: '12 hrs' },
    { ticket_id: 'S-503', customer_id: 'C-001', issue_type: 'Warehouse Overload', delay_hours: '72 hrs' },
    { ticket_id: 'S-504', customer_id: 'C-005', issue_type: 'Technical Glitch', delay_hours: '4 hrs' }
  ]
};


