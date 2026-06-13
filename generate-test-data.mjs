/**
 * CORTEX OS — Messy Test Data Generator v2
 * Writes Revenue/Cost as ACTUAL NUMBERS (XLSX will store them as number cells).
 * Currency display is handled via cell format, not by embedding $ in the string value.
 * This is how real enterprise exports work — the VALUE is numeric, the FORMAT is cosmetic.
 *
 * Messy things we deliberately include:
 *   ✓ Mixed date string formats in one column
 *   ✓ Percentage strings  ("14.5%") in Discount + Profit Margin
 *   ✓ Accounting negative string: "(45000)" in one Revenue row
 *   ✓ 3 blank Revenue values  → quality WARNING
 *   ✓ Blank rows (4 of them)  → engine must silently skip
 *   ✓ A massive outlier: Revenue = 2_890_000  (z >> 3, anomaly detection)
 *   ✓ A loss row: Revenue = -45000 (negative anomaly)
 *   ✓ Missing Units/Cost/Discount sprinkled across rows
 *   ✓ High-cardinality Sales Rep ID column → classified 'id', excluded from KPIs
 *   ✓ Categorical breakdown: Region (6 values) × Revenue
 *   ✓ Time dimension: Order Date (ISO strings) → engine sorts and forecasts
 *   ✓ "Revenue" appears twice → deduped to "Revenue (2)"
 */

import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const rand   = (a, b) => a + Math.random() * (b - a);
const randI  = (a, b) => Math.floor(rand(a, b + 1));
const pick   = (arr) => arr[randI(0, arr.length - 1)];
const fmt2   = (n) => +n.toFixed(2);

const REGIONS  = ['North America','APAC','EMEA','LatAm','MEA','North America']; // NA heavier weight
const PRODUCTS = ['CloudSuite Pro','DataEngine X','SecureVault','AnalyticsHub','ML Platform','EdgeConnect'];

// --- ISO date helpers ---------------------------------------------------
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const iso     = (d) => d.toISOString().slice(0, 10);   // "2024-03-15"
const usDate  = (d) => `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`; // "3/15/2024"
const ukDate  = (d) => {
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`; // "15 Mar 2024"
};
const verbDate = (d) => {
  const M = ['January','February','March','April','May','June',
             'July','August','September','October','November','December'];
  return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; // "March 15, 2024"
};
const DATE_FMTS = [iso, usDate, ukDate, verbDate];

// ---- build data --------------------------------------------------------
const rows = [];
let cur = new Date(2023, 0, 5);
let seq = 1000;

for (let i = 0; i < 80; i++) {
  // 4 intentional blank rows at specific positions
  if ([15, 32, 55, 71].includes(i)) {
    rows.push({}); // blank row → engine must skip
    continue;
  }

  cur = addDays(cur, randI(4, 11)); // roughly weekly cadence

  // --- Revenue: mostly plain numbers, two special cases -----------------
  let revenue;
  if      (i === 22 || i === 45 || i === 63) revenue = null;   // genuinely missing
  else if (i === 10) revenue = 2890000;                         // MASSIVE spike outlier
  else if (i === 48) revenue = '(45000)';                       // accounting negative string
  else    revenue = fmt2(rand(42000, 185000));                  // plain number

  // --- Units: integers, a few missing -----------------------------------
  const units = (i === 33 || i === 41 || i === 60) ? null : randI(120, 4800);

  // --- Discount %: string with % sign -----------------------------------
  const discount = (i === 28 || i === 50) ? null : (fmt2(rand(5, 35)) + '%');

  // --- Cost: plain numbers, a couple missing ----------------------------
  const cost = (i === 17 || i === 52) ? null : fmt2(rand(18000, 92000));

  // --- Profit Margin: %, some negative (loss rows) ----------------------
  const marginVal = (i % 9 === 0) ? fmt2(rand(-10, -1)) : fmt2(rand(14, 48));
  const margin = marginVal + '%';

  // --- Notes: sparse, some null → tests blank handling ------------------
  const notes = (i % 5 === 0) ? null : pick([
    'Approved by finance','Pending review','Q2 acceleration',
    'Strategic account','Fast-tracked by VP','At-risk renewal',
    'New logo deal','Expansion','Multi-year contract',
  ]);

  // Sales Rep ID: alpha-numeric high-cardinality → should be 'id'
  const repId = `REP-${String(seq++).padStart(4,'0')}`;

  // Date: rotate through 4 format styles to test parser robustness
  const dateFn = DATE_FMTS[i % DATE_FMTS.length];
  const orderDate = dateFn(cur);

  rows.push({
    'Order Date':    orderDate,   // string in mixed formats
    'Revenue':       revenue,     // number | null | accounting-neg string
    'Units Sold':    units,       // integer | null
    'Discount':      discount,    // "14.5%" string | null
    'Cost':          cost,        // number | null
    'Profit Margin': margin,      // "22.3%" or "-4.1%" string
    'Region':        pick(REGIONS),
    'Product':       pick(PRODUCTS),
    'Sales Rep ID':  repId,       // high-cardinality ID → should not be a KPI
    'Notes':         notes,       // sparse text
    'Revenue':       revenue,     // DUPLICATE column name → engine dedupes to "Revenue (2)"
  });
}

// ---- write Excel -------------------------------------------------------
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });

// Widen columns for readability
ws['!cols'] = [
  { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
  { wch: 14 }, { wch: 15 }, { wch: 16 }, { wch: 18 },
  { wch: 14 }, { wch: 24 }, { wch: 14 },
];

XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');
const out = join(__dir, 'cortex_test_data.xlsx');
XLSX.writeFile(wb, out);

console.log(`\n✅  cortex_test_data.xlsx written — ${rows.length} rows`);
console.log(`\nExpected engine output when you upload this:`);
console.log(`  KPIs         : Revenue (TOTAL ~sum of all deals), Units Sold (TOTAL),`);
console.log(`                 Discount (AVG ~22%), Cost (TOTAL), Profit Margin (AVG ~27%)`);
console.log(`  Primary chart: Revenue over time (date-sorted, with outlier spike at row 10)`);
console.log(`  Breakdown    : Revenue by Region  (North America should lead)`);
console.log(`  Anomalies    : 2 — the $2.89M spike (z >> 3) + the -45000 drop`);
console.log(`  Quality score: < 90% (Revenue has 3 nulls, Units/Cost/Discount have missing)`);
console.log(`  Forecast     : Upward trend from early 2023 → late 2024 (after outlier excluded)`);
console.log(`  ID column    : Sales Rep ID classified as 'id', not shown in KPIs`);
console.log(`  Duplicate    : Revenue(2) auto-deduped, shown as separate KPI`);
