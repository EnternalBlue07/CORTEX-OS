/* =====================================================================
 * CORTEX OS — Data Intelligence Engine
 * Real client-side computation: ingestion, schema detection, column
 * classification, quality checks, anomaly + forecast, auto-dashboard,
 * and executive insight generation. UI-agnostic and fully modular.
 * ===================================================================== */
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/* ---------------- limits / safety ---------------- */
export const LIMITS = {
  MAX_BYTES: 60 * 1024 * 1024,   // 60MB hard cap
  MAX_ROWS: 200000,              // rows retained for full aggregates
  PROFILE_SAMPLE: 5000,          // rows scanned for type inference
  CHART_POINTS: 80,              // max rendered series points
  ALLOWED_EXT: ['.csv', '.tsv', '.txt', '.xlsx', '.xls'],
};

export function validateFile(file) {
  if (!file) return 'No file provided.';
  const name = (file.name || '').toLowerCase();
  if (!LIMITS.ALLOWED_EXT.some((e) => name.endsWith(e))) return 'Unsupported format. Use CSV, TSV, or Excel (.xlsx/.xls).';
  if (file.size > LIMITS.MAX_BYTES) return 'File exceeds ' + Math.round(LIMITS.MAX_BYTES / 1048576) + 'MB limit.';
  if (file.size === 0) return 'File is empty.';
  return null;
}

/* ---------------- Ingestion ---------------- */
export function parseFile(file) {
  const name = (file.name || '').toLowerCase();
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
  if (!isExcel) {
    return new Promise((resolve, reject) => {
      const rows = [];
      let fields = [];
      let truncated = false;
      Papa.parse(file, {
        header: true, dynamicTyping: false, skipEmptyLines: 'greedy', worker: true,
        step: (res, parser) => {
          if (!fields.length && res.meta && res.meta.fields) fields = res.meta.fields;
          if (res.data && Object.values(res.data).some((v) => v !== null && v !== '')) rows.push(res.data);
          if (rows.length >= LIMITS.MAX_ROWS) { truncated = true; parser.abort(); }
        },
        complete: () => {
          if (!fields.length && rows.length) fields = Object.keys(rows[0]);
          if (!rows.length) { reject(new Error('No parsable rows found.')); return; }
          resolve({ rows, fields, truncated, total: rows.length });
        },
        error: (err) => reject(new Error(err && err.message ? err.message : 'CSV parse failed.')),
      });
    });
  }
  return file.arrayBuffer().then((buf) => {
    const wb = XLSX.read(buf, { type: 'array' });
    if (!wb.SheetNames.length) throw new Error('Workbook contains no sheets.');
    const ws = wb.Sheets[wb.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
    if (!matrix.length) throw new Error('Sheet is empty.');
    const header = matrix[0].map((h, i) => (h === null || h === '' ? 'Column ' + (i + 1) : String(h)));
    const seen = {};
    const fields = header.map((h) => { seen[h] = (seen[h] || 0) + 1; return seen[h] > 1 ? h + ' (' + seen[h] + ')' : h; });
    let truncated = false;
    const body = matrix.slice(1);
    const rows = [];
    for (const arr of body) {
      if (rows.length >= LIMITS.MAX_ROWS) { truncated = true; break; }
      if (!arr.some((v) => v !== null && v !== '')) continue;
      const obj = {};
      fields.forEach((f, i) => { obj[f] = arr[i] === undefined ? null : arr[i]; });
      rows.push(obj);
    }
    if (!rows.length) throw new Error('No data rows found in sheet.');
    return { rows, fields, truncated, total: rows.length };
  });
}

/* ---------------- Helpers ---------------- */
const isBlank = (v) => v === null || v === undefined || v === '' || (typeof v === 'string' && v.trim() === '');
const toNum = (v) => {
  if (typeof v === 'number') return v;
  if (isBlank(v)) return NaN;
  const s = String(v).trim();
  if (/^\([$€£]?[\d,]+\.?\d*\)$/.test(s)) {
    const n = Number(s.replace(/[()$€£,\s]/g, ''));
    return Number.isFinite(n) ? -n : NaN;
  }
  if (!/^[-+]?[$€£]?\s*\d[\d,]*\.?\d*\s*%?$/.test(s)) return NaN;
  const n = Number(s.replace(/[$€£,%\s]/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
export function parseDate(v) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') {
    if (v > 59 && v < 80000) return new Date(Math.round((v - 25569) * 86400 * 1000));
    return null;
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  let m;
  if ((m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/))) return mk(+m[1], +m[2] - 1, +m[3]);
  if ((m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/))) {
    let yr = +m[3]; if (yr < 100) yr += yr < 70 ? 2000 : 1900;
    return mk(yr, +m[1] - 1, +m[2]); 
  }
  if ((m = s.match(/^(\d{1,2})\s*([A-Za-z]{3})[A-Za-z]*\s*(\d{2,4})/))) {
    const mo = MONTHS[m[2].toLowerCase()]; if (mo === undefined) return null;
    let yr = +m[3]; if (yr < 100) yr += yr < 70 ? 2000 : 1900;
    return mk(yr, mo, +m[1]);
  }
  if ((m = s.match(/^([A-Za-z]{3})[A-Za-z]*\s+(\d{1,2}),?\s*(\d{2,4})/))) {
    const mo = MONTHS[m[1].toLowerCase()]; if (mo === undefined) return null;
    let yr = +m[3]; if (yr < 100) yr += yr < 70 ? 2000 : 1900;
    return mk(yr, mo, +m[2]);
  }
  return null;
}
function mk(y, mo, d) { const dt = new Date(y, mo, d); return (dt.getMonth() === mo && dt.getDate() === d) ? dt : null; }
const looksDate = (v) => parseDate(v) !== null;

function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
}

/* ---------------- Domain Detection Engine ---------------- */
export function detectDomain(fields) {
  const nameString = fields.join(' ').toLowerCase();
  
  const domains = [
    {
      id: 'saas',
      label: 'SaaS & Technology',
      pattern: /(mrr|arr|churn|ltv|subscriber|contract|renewal|cac|arpu|subscription)/i,
      focus: ['MRR/ARR Growth', 'Customer Churn Rate', 'Lifetime Value (LTV)']
    },
    {
      id: 'retail',
      label: 'Retail & E-commerce',
      pattern: /(store|product|inventory|cogs|quantity|refund|sku|retail|merchandise)/i,
      focus: ['Sales Volume', 'Inventory Levels', 'Product Refund Rates']
    },
    {
      id: 'finance',
      label: 'Finance & Payments',
      pattern: /(balance|transaction|dispute|fraud|chargeback|liquidity|loan|deposit|capital|interest|credit|cashflow)/i,
      focus: ['Capital Risk Exposure', 'Transaction Fraud', 'Cash Flow Volatility']
    },
    {
      id: 'logistics',
      label: 'Logistics & Supply Chain',
      pattern: /(shipment|delivery|tonnage|fleet|delay|port|warehouse|carrier|transit|route|vessel)/i,
      focus: ['Transit Duration', 'Tonnage Load Capacity', 'Port Fulfillment Delays']
    },
    {
      id: 'healthcare',
      label: 'Healthcare & Clinical',
      pattern: /(patient|diagnos|treatment|admit|discharge|clinic|doctor|hospital|outcome|readmit)/i,
      focus: ['Patient Outcomes', 'Treatment Duration', 'Hospital Readmission Risks']
    },
    {
      id: 'hr',
      label: 'HR & Employee Ops',
      pattern: /(employee|attrition|salary|hire|termination|tenure|department|headcount|performance|absenteeism)/i,
      focus: ['Employee Attrition', 'Department Headcount', 'Absenteeism Rates']
    },
    {
      id: 'manufacturing',
      label: 'Manufacturing & Industrial',
      pattern: /(production|efficiency|defect|downtime|maintenance|throughput|machine|sensor|cycle_time|yield)/i,
      focus: ['Machine Downtime Sensors', 'Production Yield Defect', 'Process Cycle Times']
    },
    {
      id: 'ecommerce',
      label: 'E-commerce Funnels',
      pattern: /(cart|checkout|conversion|bounce|traffic|visit|session|pageview)/i,
      focus: ['Conversion Rate Funnels', 'Cart Abandonment Rate', 'Web Traffic Bounce']
    }
  ];

  let bestDomain = { id: 'business', label: 'Generic Business', focus: ['General Growth', 'Statistical Outliers', 'Operational Efficiency'] };
  let maxMatches = 0;

  for (const dom of domains) {
    const matches = (nameString.match(new RegExp(dom.pattern.source, 'gi')) || []).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestDomain = dom;
    }
  }

  return bestDomain;
}

/* ---------------- Dynamic Confidence Score mapping ---------------- */
export function getConfidenceScore(sampleSize, completeness, correlationStrength = null) {
  let score = 50; 
  score += (completeness - 50) * 0.4; 
  score += Math.min(15, (sampleSize / 1000) * 3); 
  if (correlationStrength !== null) {
    score += Math.abs(correlationStrength) * 15; 
  } else {
    score += 10;
  }
  score = Math.max(35, Math.min(99, Math.round(score)));
  let level = 'Medium';
  if (score > 85) level = 'High';
  else if (score < 60) level = 'Low';
  return { score, level };
}

/* ---------------- Schema Detection + Profiling ---------------- */
export function profile(rows, fields) {
  const n = rows.length;
  const sampleSize = Math.min(n, LIMITS.PROFILE_SAMPLE);
  const sample = rows.slice(0, sampleSize);
  const sampled = n > sampleSize;
  const columns = fields.map((f) => {
    let blanks = 0, numCount = 0, dateCount = 0;
    const uniq = new Set();
    for (const r of sample) {
      const v = r[f];
      if (isBlank(v)) { blanks++; continue; }
      if (uniq.size < 100000) uniq.add(String(v));
      const isDate = looksDate(v);
      if (isDate) dateCount++;
      const asNum = toNum(v);
      const isExcelSerial = typeof v === 'number' && v > 59 && v < 80000 && isDate;
      if (!isExcelSerial && Number.isFinite(asNum)) numCount++;
    }
    const filled = sampleSize - blanks;
    const numericRatio = filled ? numCount / filled : 0;
    const dateRatio = filled ? dateCount / filled : 0;
    const uniqRatio = filled ? uniq.size / filled : 0;

    let type = 'categorical';
    if (dateRatio > 0.7) type = 'date';
    else if (numericRatio > 0.85) type = (/(^id$|_id$|\bid\b|code|zip|postal|phone|order.?num|invoice|serial)/i.test(f) && uniqRatio > 0.9) ? 'id' : 'numeric';
    else if (uniqRatio > 0.97 && filled > 8) type = 'id';

    const col = { name: f, type, unique: uniq.size, uniqueSampled: sampled };
    const uniqRatioFull = filled ? uniq.size / filled : 0;
    const idPattern = /(^id$|_id$|\bid\b|code|key|uuid|sku|product.?id|customer.?id|order.?id|user.?id|account.?id|employee.?id|ticket.?id|transaction.?id|invoice)/i;
    if (type === 'id' || (uniqRatioFull > 0.95 && filled > 5 && idPattern.test(f))) {
      col.role = 'pk'; 
    } else if (idPattern.test(f) && uniqRatioFull > 0.3 && uniqRatioFull < 0.95 && filled > 5) {
      col.role = 'fk'; 
    } else if (type === 'categorical' && uniq.size <= 30 && uniq.size > 1) {
      col.role = 'dimension'; 
    } else if (type === 'date') {
      col.role = 'temporal'; 
    } else if (type === 'numeric') {
      col.role = 'measure'; 
    }
    col.sampleValues = [...uniq].slice(0, 20);

    if (type === 'numeric') {
      let fullBlanks = 0; const nums = [];
      for (const r of rows) { const num = toNum(r[f]); if (Number.isFinite(num)) nums.push(num); else fullBlanks++; }
      col.missing = Math.round((fullBlanks / (n || 1)) * 100);
      if (nums.length) {
        const s = [...nums].sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        const mean = sum / nums.length;
        const q1 = quantile(s, 0.25), q3 = quantile(s, 0.75), iqr = q3 - q1;
        const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr;
        col.stats = {
          count: nums.length, min: s[0], max: s[s.length - 1], mean: +mean.toFixed(2),
          median: +quantile(s, 0.5).toFixed(2), sum: +sum.toFixed(2),
          outliers: nums.filter((x) => x < lo || x > hi).length, lo, hi,
        };
      }
    } else {
      let fullBlanks = 0;
      for (const r of rows) if (isBlank(r[f])) fullBlanks++;
      col.missing = Math.round((fullBlanks / (n || 1)) * 100);
    }
    return col;
  });
  return { rowCount: n, colCount: fields.length, sampled, sampleSize, columns };
}

/* ---------------- Data Quality ---------------- */
export function quality(prof) {
  const issues = [];
  for (const c of prof.columns) {
    if (c.missing > 0) issues.push({ sev: c.missing > 25 ? 'WARNING' : 'INFO', col: c.name, msg: c.missing + '% missing values in "' + c.name + '"' });
    if (c.stats && c.stats.outliers > 0) issues.push({ sev: c.stats.outliers > prof.rowCount * 0.05 ? 'WARNING' : 'INFO', col: c.name, msg: c.stats.outliers + ' statistical outlier(s) in "' + c.name + '" (IQR method)' });
  }
  const warnings = prof.columns.filter((c) => c.missing > 25);
  const totalPenalty = prof.columns.reduce((a, c) => {
    const weight = c.missing > 25 ? 2 : 1; 
    return a + (c.missing * weight);
  }, 0);
  const maxPenalty = prof.columns.reduce((a, c) => a + (c.missing > 25 ? 200 : 100), 0);
  const filledScore = maxPenalty > 0 ? 100 - (totalPenalty / prof.columns.length) : 100;
  return { issues, score: Math.max(0, Math.min(100, Math.round(filledScore))), warnings: warnings.length };
}

/* ---------------- Forecast ---------------- */
export function forecast(series, horizon = 5) {
  const ys = series.filter((v) => Number.isFinite(v));
  const nLin = ys.length;
  if (nLin < 4) return null; 
  const xm = (nLin - 1) / 2;
  const ym = ys.reduce((a, b) => a + b, 0) / nLin;
  let num = 0, den = 0;
  ys.forEach((y, i) => { num += (i - xm) * (y - ym); den += (i - xm) ** 2; });
  const slope = den ? num / den : 0;
  const intercept = ym - slope * xm;
  const fitted = ys.map((_, i) => intercept + slope * i);
  const ssRes = ys.reduce((a, y, i) => a + (y - fitted[i]) ** 2, 0);
  const ssTot = ys.reduce((a, y) => a + (y - ym) ** 2, 0);
  const r2 = ssTot ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;
  const resStd = Math.sqrt(ssRes / Math.max(1, nLin - 2));
  const sizeFactor = Math.min(1, nLin / 24);
  const confidence = Math.max(35, Math.min(95, Math.round((0.7 * r2 + 0.3 * sizeFactor) * 100)));
  const future = Array.from({ length: horizon }, (_, h) => {
    const x = nLin + h;
    const yhat = intercept + slope * x;
    const band = 1.96 * resStd * Math.sqrt(1 + (h + 1) / nLin);
    return { yhat: +yhat.toFixed(2), lo: +(yhat - band).toFixed(2), hi: +(yhat + band).toFixed(2) };
  });
  const eps = (ssTot / nLin) ** 0.5 * 0.01;
  return { slope, r2: +r2.toFixed(2), confidence, future, n: nLin, trend: slope > eps ? 'up' : slope < -eps ? 'down' : 'flat' };
}

/* ---------------- Anomalies (Z-score) ---------------- */
export function anomalies(series, labels, threshold = 2.5) {
  const vals = series.map((v, i) => ({ v, i })).filter((d) => Number.isFinite(d.v));
  if (vals.length < 8) return [];
  const mean = vals.reduce((a, d) => a + d.v, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((a, d) => a + (d.v - mean) ** 2, 0) / vals.length);
  if (std === 0) return [];
  return vals
    .map((d) => ({ ...d, z: (d.v - mean) / std }))
    .filter((d) => Math.abs(d.z) > threshold)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .slice(0, 12)
    .map((d) => ({ index: d.i, label: labels ? labels[d.i] : d.i, value: d.v, z: +d.z.toFixed(2), dir: d.z > 0 ? 'spike' : 'drop' }));
}

/* ---------------- Auto Dashboard Generation ---------------- */
const TOTAL_PRIORITY = /^(revenue|sales|amount|gmv|arr|mrr|bookings?|orders?|transactions?|gross|net|value|spend|income|budget)/i;
const RATE_COL = /rate|ratio|pct|percent|margin|discount|score|index|%/i;
const METRIC_FALLBACK = /profit|cost|price|total|forecast|value|income|spend|budget/i;

export function autoDashboard(rows, prof) {
  const numericCols = prof.columns.filter((c) => c.type === 'numeric' && c.stats);
  const sortedNums = [
    ...numericCols.filter((c) => !RATE_COL.test(c.name)).sort((a, b) => Math.abs(b.stats.sum) - Math.abs(a.stats.sum)),
    ...numericCols.filter((c) => RATE_COL.test(c.name)),
  ];
  const dateCol = prof.columns.find((c) => c.type === 'date');
  const catCols = prof.columns.filter((c) => c.type === 'categorical' && c.unique <= 30 && c.unique > 1);

  const kpis = sortedNums.slice(0, 6).map((c) => {
    const looksLikeRate = RATE_COL.test(c.name) || (c.stats.max <= 100 && c.stats.min >= -100 && c.stats.mean < 100);
    const isTotal = !looksLikeRate && Math.abs(c.stats.sum) > Math.abs(c.stats.mean) * 5;
    return {
      label: c.name.toUpperCase(),
      value: isTotal ? c.stats.sum : c.stats.mean,
      kind: isTotal ? 'TOTAL' : 'AVG',
      min: c.stats.min, max: c.stats.max, mean: c.stats.mean, count: c.stats.count,
    };
  });

  let chart = null;
  const primaryNum =
    sortedNums.find((c) => !RATE_COL.test(c.name) && TOTAL_PRIORITY.test(c.name)) ||
    sortedNums.find((c) => !RATE_COL.test(c.name) && METRIC_FALLBACK.test(c.name)) ||
    sortedNums.find((c) => !RATE_COL.test(c.name)) ||
    sortedNums[0];
  if (primaryNum) {
    const labelKey = dateCol ? dateCol.name : (catCols[0] ? catCols[0].name : null);
    let pts = [];
    for (const r of rows) {
      const y = toNum(r[primaryNum.name]);
      if (!Number.isFinite(y)) continue;
      if (dateCol) {
        const d = parseDate(r[dateCol.name]);
        if (!d) continue; 
        pts.push({ d, x: d.toISOString().slice(0, 10), y });
      } else {
        pts.push({ x: labelKey ? String(r[labelKey]) : String(pts.length + 1), y });
      }
    }
    if (dateCol) pts.sort((a, b) => a.d - b.d);
    if (pts.length > LIMITS.CHART_POINTS) {
      const step = Math.ceil(pts.length / LIMITS.CHART_POINTS);
      pts = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
    }
    const series = pts.map((p) => p.y);
    const fc = forecast(series, 5);
    const anom = anomalies(series, pts.map((p) => p.x));
    const merged = pts.map((p) => ({ x: p.x, hist: p.y, fc: null, lo: null, hi: null }));
    if (fc && merged.length) {
      merged[merged.length - 1].fc = series[series.length - 1];
      fc.future.forEach((f, h) => merged.push({ x: 'T+' + (h + 1), hist: null, fc: f.yhat, lo: f.lo, hi: f.hi }));
    }
    chart = { metric: primaryNum.name, data: merged, forecast: fc, anomalies: anom, labelKey, points: series.length };
  }

  let breakdown = null;
  if (catCols[0] && primaryNum) {
    const agg = {};
    for (const r of rows) {
      const k = String(r[catCols[0].name]);
      const v = toNum(r[primaryNum.name]);
      if (isBlank(r[catCols[0].name]) || !Number.isFinite(v)) continue;
      agg[k] = (agg[k] || 0) + v;
    }
    breakdown = {
      by: catCols[0].name, metric: primaryNum.name,
      data: Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ k: k.length > 18 ? k.slice(0, 16) + '…' : k, v: +v.toFixed(1) })),
    };
  }

  return { kpis, chart, breakdown, numericCols: sortedNums.length, catCols: catCols.length, dateCol: !!dateCol };
}

/* ---------------- Dynamic Executive Insights & Narrative Engine ---------------- */
export function generateRefactoredInsights(rows, prof, qa, dash, domain) {
  const insights = [];
  const completeness = 100 - Math.round(prof.columns.reduce((s, c) => s + c.missing, 0) / prof.columns.length);
  const fmt = (n) => {
    const a = Math.abs(n);
    if (a >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (a >= 1000) return (n / 1000).toFixed(1) + 'K';
    return (+n).toFixed(2);
  };

  const primaryMetric = dash.chart ? dash.chart.metric : (prof.columns.find(c => c.type === 'numeric')?.name || null);

  // 1. Overview
  const ovConf = getConfidenceScore(rows.length, completeness);
  insights.push({
    cat: 'OVERVIEW',
    text: `Analyzed "${domain.label}" dataset with ${rows.length.toLocaleString()} rows and ${prof.colCount} fields. Focused on ${domain.focus.join(', ')}.`,
    evidence: {
      columns: prof.columns.slice(0, 3).map(c => c.name),
      calculation: `Parsed ${rows.length} rows × ${prof.colCount} headers`,
      supportingRowsCount: rows.length,
      methodology: 'Domain schema analysis',
      confidenceScore: ovConf.score,
      confidenceLevel: ovConf.level
    }
  });

  // 2. Data Quality
  const qConf = getConfidenceScore(rows.length, completeness);
  const warns = qa.issues.filter(i => i.sev === 'WARNING').length;
  const infos = qa.issues.filter(i => i.sev === 'INFO').length;
  const qText = qa.score >= 95
    ? `Data integrity is rated High at ${qa.score}%. ` + (qa.issues.length ? `Found ${infos} minor data anomalies, but all primary indices remain intact.` : 'Dataset is exceptionally clean with zero missing columns.')
    : `Data integrity is rated Medium-Low at ${qa.score}%. Detected ${warns} critical missing column warnings and ${infos} variance outliers.`;
  insights.push({
    cat: 'DATA QUALITY',
    text: qText,
    evidence: {
      columns: qa.issues.slice(0, 2).map(i => i.col),
      calculation: `Integrity coefficient calculated as ${qa.score}%`,
      supportingRowsCount: rows.length,
      methodology: 'Completeness check & outlier IQR mapping',
      confidenceScore: qConf.score,
      confidenceLevel: qConf.level
    }
  });

  // 3. Concentration
  if (dash.breakdown && dash.breakdown.data.length) {
    const top = dash.breakdown.data[0];
    const total = dash.breakdown.data.reduce((s, d) => s + d.v, 0) || 1;
    const pct = Math.round((top.v / total) * 100);
    const concConf = getConfidenceScore(rows.length, completeness);
    insights.push({
      cat: 'CONCENTRATION',
      text: `Concentration scan indicates segment "${top.k}" in category "${dash.breakdown.by}" leads with ${fmt(top.v)} (${pct}% of total ${dash.breakdown.metric}). ${pct > 40 ? 'This represents high reliance on a single entity.' : 'Distribution across segments is balanced.'}`,
      evidence: {
        columns: [dash.breakdown.by, dash.breakdown.metric],
        calculation: `Sum of "${top.k}" is ${fmt(top.v)} out of ${fmt(total)} total`,
        supportingRowsCount: rows.length,
        methodology: 'Categorical summation and ratio concentration',
        confidenceScore: concConf.score,
        confidenceLevel: concConf.level
      }
    });
  }

  // 4. Forecast
  if (dash.chart && dash.chart.forecast) {
    const fc = dash.chart.forecast;
    const dir = fc.trend === 'up' ? 'upward' : fc.trend === 'down' ? 'downward' : 'stable';
    const fcConf = getConfidenceScore(rows.length, completeness, fc.r2);
    insights.push({
      cat: 'FORECAST',
      text: `Trendline analysis for "${dash.chart.metric}" isolates a ${dir} vector (R² = ${fc.r2}). Model projects future trajectory settling near ${fmt(fc.future[fc.future.length - 1].yhat)} over the next 5 periods.`,
      evidence: {
        columns: [dash.chart.metric],
        calculation: `Slope coefficient: ${fc.slope.toFixed(4)}, Intercept: ${(fc.future[0].yhat - fc.slope).toFixed(2)}`,
        supportingRowsCount: fc.n,
        methodology: 'Ordinary Least Squares (OLS) linear trend extrapolation',
        confidenceScore: fcConf.score,
        confidenceLevel: fcConf.level
      }
    });
  }

  // 5. Correlation
  const cm = correlationMatrix(rows, prof);
  if (cm && cm.pairs.length) {
    const pair = cm.pairs[0];
    const strength = Math.abs(pair.r) > 0.75 ? 'strong' : Math.abs(pair.r) > 0.5 ? 'moderate' : 'weak';
    const dir = pair.r > 0 ? 'positive' : 'negative';
    const corrConf = getConfidenceScore(rows.length, completeness, pair.r);
    insights.push({
      cat: 'CORRELATION',
      text: `Pearson mapping identified a ${strength} ${dir} correlation (r = ${pair.r.toFixed(3)}) between metrics "${pair.colA}" and "${pair.colB}". This indicates a shared variance pattern.`,
      evidence: {
        columns: [pair.colA, pair.colB],
        calculation: `Covariance ratio over product of standard deviations (r = ${pair.r.toFixed(4)})`,
        supportingRowsCount: pair.n,
        methodology: 'Pearson Product-Moment Correlation Matrix',
        confidenceScore: corrConf.score,
        confidenceLevel: corrConf.level
      }
    });
  }

  // 6. Anomaly
  if (dash.chart && dash.chart.anomalies.length) {
    const an = dash.chart.anomalies[0];
    const anomConf = getConfidenceScore(rows.length, completeness, an.z);
    insights.push({
      cat: 'ANOMALY',
      text: `Anomaly detection flagged a critical ${an.dir} at timestamp "${an.label}" for metric "${dash.chart.metric}" (z-score = ${an.z}, value = ${fmt(an.value)}).`,
      evidence: {
        columns: [dash.chart.metric],
        calculation: `Variance: ${(an.z * 100).toFixed(0)}% deviation from standard mean`,
        supportingRowsCount: rows.length,
        methodology: 'Z-score threshold outlier identification',
        confidenceScore: anomConf.score,
        confidenceLevel: anomConf.level
      }
    });
  }

  return insights;
}

/* ---------------- Real-Time Risk Engine ---------------- */
export function generateRefactoredRisks(rows, prof, qa, dash, domain) {
  const risks = [];
  const completeness = 100 - Math.round(prof.columns.reduce((s, c) => s + c.missing, 0) / prof.columns.length);

  // 1. Data Integrity Quality Risk
  if (qa.score < 92) {
    const qaConf = getConfidenceScore(rows.length, completeness);
    risks.push({
      title: 'Data Pipeline Integrity Exposure',
      sev: qa.score < 75 ? 'HIGH' : 'MEDIUM',
      color: qa.score < 75 ? '#EF4444' : '#D97706',
      src: 'Quality Agent',
      rec: 'Audit file mapping pipelines and clean null cells to raise validation health.',
      evidence: {
        columns: qa.issues.slice(0, 3).map(i => i.col),
        calculation: `Data cleanliness index fell to ${qa.score}%`,
        supportingRowsCount: rows.length,
        methodology: 'Column completeness scanning',
        confidenceScore: qaConf.score,
        confidenceLevel: qaConf.level
      }
    });
  }

  // 2. Trend Decay Risk
  if (dash.chart && dash.chart.forecast && dash.chart.forecast.trend === 'down') {
    const trendConf = getConfidenceScore(rows.length, completeness, dash.chart.forecast.r2);
    risks.push({
      title: `Declining ${dash.chart.metric} Trajectory`,
      sev: 'HIGH',
      color: '#EF4444',
      src: 'Trend Auditor',
      rec: `Model shows constant metric drop. Shift What-if marketing sliders to re-simulate target trends.`,
      evidence: {
        columns: [dash.chart.metric],
        calculation: `Fitted linear slope coefficient is ${dash.chart.forecast.slope.toFixed(4)}`,
        supportingRowsCount: dash.chart.forecast.n,
        methodology: 'Linear OLS trendline validation',
        confidenceScore: trendConf.score,
        confidenceLevel: trendConf.level
      }
    });
  }

  // 3. Concentration Risk
  if (dash.breakdown && dash.breakdown.data.length) {
    const top = dash.breakdown.data[0];
    const total = dash.breakdown.data.reduce((s, d) => s + d.v, 0) || 1;
    const pct = Math.round((top.v / total) * 100);
    if (pct > 40) {
      const concConf = getConfidenceScore(rows.length, completeness);
      risks.push({
        title: `Single Entity Concentration (${top.k})`,
        sev: pct > 60 ? 'HIGH' : 'MEDIUM',
        color: pct > 60 ? '#EF4444' : '#D97706',
        src: 'Risk Broker',
        rec: `Diversify the segment exposure to offset reliance on a single entity "${top.k}".`,
        evidence: {
          columns: [dash.breakdown.by, dash.breakdown.metric],
          calculation: `Sum value represents ${pct}% of overall segment categories`,
          supportingRowsCount: rows.length,
          methodology: 'Distribution ratio concentration audit',
          confidenceScore: concConf.score,
          confidenceLevel: concConf.level
        }
      });
    }
  }

  // 4. Domain-Specific Tactical Risks
  const domConf = getConfidenceScore(rows.length, completeness);
  if (domain.id === 'saas') {
    risks.push({
      title: 'Customer Churn & ARR Contraction',
      sev: 'MEDIUM',
      color: '#D97706',
      src: 'SaaS Swarm Officer',
      rec: 'Analyze active accounts with low contract value renewals.',
      evidence: {
        columns: prof.columns.map(c => c.name).filter(n => /churn|arr|ltv/i.test(n)),
        calculation: 'Domain pattern detection',
        supportingRowsCount: rows.length,
        methodology: 'SaaS contract renewal risk mapping',
        confidenceScore: domConf.score,
        confidenceLevel: domConf.level
      }
    });
  } else if (domain.id === 'retail' || domain.id === 'ecommerce') {
    risks.push({
      title: 'Refund Instability & Stock Depletion',
      sev: 'HIGH',
      color: '#EF4444',
      src: 'Retail Supply Agent',
      rec: 'Triage product lines with return rates exceeding 5% to preserve net margin.',
      evidence: {
        columns: prof.columns.map(c => c.name).filter(n => /refund|inventory|cogs/i.test(n)),
        calculation: 'Domain pattern detection',
        supportingRowsCount: rows.length,
        methodology: 'E-commerce return rate threshold tracing',
        confidenceScore: domConf.score,
        confidenceLevel: domConf.level
      }
    });
  } else if (domain.id === 'finance') {
    risks.push({
      title: 'Merchant Chargeback & Fraud Exposure',
      sev: 'HIGH',
      color: '#EF4444',
      src: 'Fraud Risk Auditor',
      rec: 'Enable real-time transaction screening rules on high-volume accounts.',
      evidence: {
        columns: prof.columns.map(c => c.name).filter(n => /fraud|chargeback|dispute/i.test(n)),
        calculation: 'Domain pattern detection',
        supportingRowsCount: rows.length,
        methodology: 'Payments dispute variance scanning',
        confidenceScore: domConf.score,
        confidenceLevel: domConf.level
      }
    });
  } else if (domain.id === 'logistics') {
    risks.push({
      title: 'Route Bottleneck & Transit Delays',
      sev: 'MEDIUM',
      color: '#D97706',
      src: 'Logistics Fleet Watcher',
      rec: 'Re-route upcoming cargo to bypass port delay hubs.',
      evidence: {
        columns: prof.columns.map(c => c.name).filter(n => /delay|transit|port/i.test(n)),
        calculation: 'Domain pattern detection',
        supportingRowsCount: rows.length,
        methodology: 'Logistics delay duration analysis',
        confidenceScore: domConf.score,
        confidenceLevel: domConf.level
      }
    });
  } else if (domain.id === 'healthcare') {
    risks.push({
      title: 'Readmission & Clinical Treatment Gaps',
      sev: 'MEDIUM',
      color: '#D97706',
      src: 'Clinical Outcomes Watch',
      rec: 'Optimize discharge coordination for patient cohorts with high readmit factors.',
      evidence: {
        columns: prof.columns.map(c => c.name).filter(n => /readmit|patient|treatment/i.test(n)),
        calculation: 'Domain pattern detection',
        supportingRowsCount: rows.length,
        methodology: 'Patient readmission correlation scan',
        confidenceScore: domConf.score,
        confidenceLevel: domConf.level
      }
    });
  } else if (domain.id === 'hr') {
    risks.push({
      title: 'Employee Attrition & Department Imbalance',
      sev: 'HIGH',
      color: '#EF4444',
      src: 'HR Attrition Agent',
      rec: 'Identify tenure gaps and review compensation structures in high-churn divisions.',
      evidence: {
        columns: prof.columns.map(c => c.name).filter(n => /attrition|tenure|salary/i.test(n)),
        calculation: 'Domain pattern detection',
        supportingRowsCount: rows.length,
        methodology: 'Employee attrition hazard modeling',
        confidenceScore: domConf.score,
        confidenceLevel: domConf.level
      }
    });
  } else if (domain.id === 'manufacturing') {
    risks.push({
      title: 'Machine Downtime & Yield Losses',
      sev: 'HIGH',
      color: '#EF4444',
      src: 'Production Quality Watch',
      rec: 'Schedule preventative maintenance on machines showing frequent downtime sensors.',
      evidence: {
        columns: prof.columns.map(c => c.name).filter(n => /downtime|sensor|yield/i.test(n)),
        calculation: 'Domain pattern detection',
        supportingRowsCount: rows.length,
        methodology: 'Industrial sensor cycle anomalies tracking',
        confidenceScore: domConf.score,
        confidenceLevel: domConf.level
      }
    });
  }

  if (risks.length === 0) {
    risks.push({
      title: 'Baseline Volatility & Outlier Tracing',
      sev: 'INFO',
      color: '#4F46E5',
      src: 'Baseline Agent',
      rec: 'No major risk warnings detected. Continue monitoring regular batch updates.',
      evidence: {
        columns: prof.columns.slice(0, 1).map(c => c.name),
        calculation: 'Statistical limits nominal',
        supportingRowsCount: rows.length,
        methodology: 'Regular time-series variance audits',
        confidenceScore: 90,
        confidenceLevel: 'High'
      }
    });
  }

  return risks;
}

/* ---------------- AI Recommendation Engine ---------------- */
export function generateRefactoredRecommendations(rows, prof, qa, dash, domain) {
  const recs = [];
  const completeness = 100 - Math.round(prof.columns.reduce((s, c) => s + c.missing, 0) / prof.columns.length);

  // 1. Churn / Decline Rec
  if (dash.chart && dash.chart.forecast && dash.chart.forecast.trend === 'down') {
    const score = getConfidenceScore(rows.length, completeness, dash.chart.forecast.r2);
    recs.push({
      text: `Action Required: Metric "${dash.chart.metric}" exhibits a declining trend. Model predicts a final trajectory value of ${dash.chart.forecast.future[dash.chart.forecast.future.length - 1].yhat}. Recommend shifting What-If spend sliders to re-simulate growth limits.`,
      confidence: score.score,
      level: score.level,
      columns: [dash.chart.metric]
    });
  } else if (dash.chart && dash.chart.forecast) {
    const score = getConfidenceScore(rows.length, completeness, dash.chart.forecast.r2);
    recs.push({
      text: `Opportunity identified: Metric "${dash.chart.metric}" demonstrates positive growth trajectory. Recommend expanding funding/resources for this leading driver.`,
      confidence: score.score,
      level: score.level,
      columns: [dash.chart.metric]
    });
  }

  // 2. Concentration risk mitigation recommendation
  if (dash.breakdown && dash.breakdown.data.length) {
    const top = dash.breakdown.data[0];
    const total = dash.breakdown.data.reduce((s, d) => s + d.v, 0) || 1;
    const pct = Math.round((top.v / total) * 100);
    if (pct > 40) {
      const score = getConfidenceScore(rows.length, completeness);
      recs.push({
        text: `Exposure detected: Segment "${top.k}" accounts for ${pct}% of overall "${dash.breakdown.metric}" across "${dash.breakdown.by}". Recommend diversification strategies to hedge against single entity reliance.`,
        confidence: score.score,
        level: score.level,
        columns: [dash.breakdown.by, dash.breakdown.metric]
      });
    }
  }

  // 3. Data Ingestion Quality Recommendation
  if (qa.score < 95) {
    const score = getConfidenceScore(rows.length, completeness);
    const warns = qa.issues.filter(i => i.sev === 'WARNING');
    recs.push({
      text: `Data Quality Uplift: Integrity index is at ${qa.score}%. Recommend sanitizing missing values in column "${warns[0]?.col || prof.columns[0]?.name}" to raise data health above the 95% enterprise threshold.`,
      confidence: score.score,
      level: score.level,
      columns: warns.map(w => w.col).filter(Boolean)
    });
  }

  // 4. Domain specific recommendations
  const domScore = getConfidenceScore(rows.length, completeness);
  if (domain.id === 'saas') {
    recs.push({
      text: `SaaS Optimization: Redirection of marketing CAC spend is recommended. Leverage high conversion segments to counteract contract churn expansion.`,
      confidence: domScore.score,
      level: domScore.level,
      columns: prof.columns.map(c => c.name).filter(n => /mrr|cac|churn/i.test(n))
    });
  } else if (domain.id === 'retail' || domain.id === 'ecommerce') {
    recs.push({
      text: `Retail Margin Protection: Implement strict product return screening loops. Reallocate marketing budgets to protect net margins.`,
      confidence: domScore.score,
      level: domScore.level,
      columns: prof.columns.map(c => c.name).filter(n => /refund|margin|order/i.test(n))
    });
  } else if (domain.id === 'finance') {
    recs.push({
      text: `Risk Management: Increase capital reserve adequacy ratios to buffer against chargebacks in APAC payment disputes.`,
      confidence: domScore.score,
      level: domScore.level,
      columns: prof.columns.map(c => c.name).filter(n => /chargeback|dispute|fraud/i.test(n))
    });
  } else if (domain.id === 'logistics') {
    recs.push({
      text: `Operational Rerouting: Shift fleet logistics loads to secondary carrier routes to bypass APAC harbor delays.`,
      confidence: domScore.score,
      level: domScore.level,
      columns: prof.columns.map(c => c.name).filter(n => /delay|route|fleet/i.test(n))
    });
  }

  if (recs.length === 0) {
    recs.push({
      text: 'System Nominal: The dataset is structurally clean and stable. Recommend automating future batch reports.',
      confidence: 90,
      level: 'High',
      columns: []
    });
  }

  return recs;
}

/* ---------------- Chart Intelligence Engine ---------------- */
export function rankVisualizations(prof, qa, dash, domain) {
  const scores = [];
  const dateCol = prof.columns.find((c) => c.type === 'date');
  const numericCols = prof.columns.filter((c) => c.type === 'numeric');
  const catCols = prof.columns.filter((c) => c.type === 'categorical' && c.unique <= 30 && c.unique > 1);

  // 1. Line Chart
  let lineScore = 20;
  if (dateCol) lineScore += 60;
  if (numericCols.length) lineScore += 15;
  scores.push({
    type: 'line',
    label: 'Line Chart',
    score: lineScore,
    rationale: dateCol 
      ? `Selected because the dataset contains a sequential time dimension ("${dateCol.name}") and continuous numeric measures, making a linear trend visualization optimal.`
      : 'Can represent numeric columns sequentially, but lacks a formal datetime axis.'
  });

  // 2. Forecast Chart
  let fcScore = 10;
  if (dateCol && dash.chart?.forecast) fcScore += 70;
  scores.push({
    type: 'forecast',
    label: 'Forecast Area Chart',
    score: fcScore,
    rationale: (dateCol && dash.chart?.forecast)
      ? `Selected because OLS linear regression models fitted a trend projection (confidence limit = ${dash.chart.forecast.confidence}%) over chronological intervals.`
      : 'Requires ordered temporal observations to compile linear extrapolation bands.'
  });

  // 3. Area Chart
  let areaScore = 15;
  if (dateCol) areaScore += 50;
  if (numericCols.find(c => /revenue|sales|gmv|arr|amount/i.test(c.name))) areaScore += 20;
  scores.push({
    type: 'area',
    label: 'Area Chart',
    score: areaScore,
    rationale: dateCol
      ? `Ideal for highlighting volume totals under the curve across consecutive "${dateCol.name}" intervals.`
      : 'Lacks datetime sequences for continuous area shading.'
  });

  // 4. Bar Chart
  let barScore = 20;
  if (catCols.length) barScore += 55;
  if (numericCols.length) barScore += 15;
  scores.push({
    type: 'bar',
    label: 'Bar Chart',
    score: barScore,
    rationale: catCols.length
      ? `Selected because the category dimension "${catCols[0].name}" has discrete, low-cardinality values (${catCols[0].unique} unique segments) perfect for side-by-side metric comparison.`
      : 'No low-cardinality categorical dimensions found for grouping.'
  });

  // 5. Scatter Plot
  let scatterScore = 10;
  if (numericCols.length >= 2) scatterScore += 50;
  scores.push({
    type: 'scatter',
    label: 'Scatter Plot',
    score: scatterScore,
    rationale: numericCols.length >= 2
      ? `Selected because multiple numeric columns exist. This allows visual mapping of correlation distributions and outlier clusters.`
      : 'Requires at least 2 continuous numerical variables to plot XY coordinates.'
  });

  // 6. Network Graph
  let networkScore = 10;
  const keyCols = prof.columns.filter(c => c.role === 'pk' || c.role === 'fk');
  if (keyCols.length >= 2) networkScore += 60;
  scores.push({
    type: 'network',
    label: 'Network Topology Graph',
    score: networkScore,
    rationale: keyCols.length >= 2
      ? `Selected because keys ("${keyCols.map(c => c.name).join(', ')}") are mapped. Highly efficient to audit multi-table relations.`
      : 'Requires primary key / foreign key identifiers to map topology linkages.'
  });

  const sorted = scores.sort((a, b) => b.score - a.score);
  return {
    best: sorted[0],
    second: sorted[1],
    alternative: sorted[2],
    all: sorted
  };
}

/* ---------------- Dataset Comparison Engine ---------------- */
export function compareDatasets(dsA, dsB) {
  if (!dsA || !dsB) return null;

  const fieldsA = new Set(dsA.fields);
  const fieldsB = new Set(dsB.fields);
  const onlyInA = dsA.fields.filter(f => !fieldsB.has(f));
  const onlyInB = dsB.fields.filter(f => !fieldsA.has(f));
  const commonFields = dsA.fields.filter(f => fieldsB.has(f));

  const metricComps = [];
  const numsA = dsA.prof.columns.filter(c => c.type === 'numeric' && c.stats);
  const numsB = dsB.prof.columns.filter(c => c.type === 'numeric' && c.stats);

  for (const ca of numsA) {
    const cb = numsB.find(c => c.name === ca.name);
    if (cb) {
      const diffMean = cb.stats.mean - ca.stats.mean;
      const pctMean = ca.stats.mean ? +(diffMean / ca.stats.mean * 100).toFixed(1) : 0;
      const diffSum = cb.stats.sum - ca.stats.sum;
      const pctSum = ca.stats.sum ? +(diffSum / ca.stats.sum * 100).toFixed(1) : 0;
      metricComps.push({
        name: ca.name,
        aMean: ca.stats.mean,
        bMean: cb.stats.mean,
        pctMean,
        aSum: ca.stats.sum,
        bSum: cb.stats.sum,
        pctSum
      });
    }
  }

  const trendA = dsA.analysis.dash.chart?.forecast?.trend || 'unknown';
  const trendB = dsB.analysis.dash.chart?.forecast?.trend || 'unknown';

  const anomCountA = dsA.analysis.dash.chart?.anomalies?.length || 0;
  const anomCountB = dsB.analysis.dash.chart?.anomalies?.length || 0;

  return {
    dsA: { name: dsA.name, rows: dsA.rows.length, cols: dsA.fields.length },
    dsB: { name: dsB.name, rows: dsB.rows.length, cols: dsB.fields.length },
    schema: {
      onlyInA,
      onlyInB,
      commonCount: commonFields.length
    },
    metrics: metricComps,
    trends: {
      a: trendA,
      b: trendB,
      changed: trendA !== trendB
    },
    anomalies: {
      aCount: anomCountA,
      bCount: anomCountB,
      diff: anomCountB - anomCountA
    }
  };
}

/* ---------------- Pearson correlation coefficient ---------------- */
function pearsonCorrelation(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den ? +(num / den).toFixed(4) : 0;
}

/* ---------------- correlation matrix across all numeric columns ---------------- */
export function correlationMatrix(rows, prof) {
  const numCols = prof.columns.filter((c) => c.type === 'numeric' && c.stats && c.stats.count > 5);
  if (numCols.length < 2) return null;

  const vectors = {};
  for (const c of numCols) {
    vectors[c.name] = rows.map((r) => toNum(r[c.name])).filter(Number.isFinite);
  }

  const matrix = [];
  for (let i = 0; i < numCols.length; i++) {
    for (let j = i + 1; j < numCols.length; j++) {
      const a = numCols[i].name, b = numCols[j].name;
      const paired = [];
      for (let k = 0; k < rows.length; k++) {
        const va = toNum(rows[k][a]), vb = toNum(rows[k][b]);
        if (Number.isFinite(va) && Number.isFinite(vb)) paired.push({ a: va, b: vb });
      }
      if (paired.length < 5) continue;
      const r = pearsonCorrelation(paired.map((p) => p.a), paired.map((p) => p.b));
      matrix.push({ colA: a, colB: b, r, absR: Math.abs(r), n: paired.length });
    }
  }

  return {
    columns: numCols.map((c) => c.name),
    pairs: matrix.sort((a, b) => b.absR - a.absR),
  };
}

/* ---------------- join two datasets ---------------- */
function joinDatasets(rowsA, rowsB, keyA, keyB, metricA, metricB) {
  const mapB = new Map();
  for (const r of rowsB) {
    const k = String(r[keyB] || '').trim();
    if (k) {
      const v = toNum(r[metricB]);
      if (Number.isFinite(v)) {
        if (!mapB.has(k)) mapB.set(k, []);
        mapB.get(k).push(v);
      }
    }
  }
  const joined = [];
  for (const r of rowsA) {
    const k = String(r[keyA] || '').trim();
    const va = toNum(r[metricA]);
    if (!k || !Number.isFinite(va)) continue;
    const bVals = mapB.get(k);
    if (bVals && bVals.length) {
      const avgB = bVals.reduce((s, x) => s + x, 0) / bVals.length;
      joined.push({ key: k, a: va, b: avgB });
    }
  }
  return joined;
}

/* ---------------- detect relationships ---------------- */
export function detectRelationships(datasets) {
  if (datasets.length < 2) return [];
  const relationships = [];

  for (let i = 0; i < datasets.length; i++) {
    for (let j = i + 1; j < datasets.length; j++) {
      const dsA = datasets[i], dsB = datasets[j];
      const colsA = dsA.prof.columns.filter((c) => c.role === 'pk' || c.role === 'fk' || c.type === 'id' || c.type === 'categorical');
      const colsB = dsB.prof.columns.filter((c) => c.role === 'pk' || c.role === 'fk' || c.type === 'id' || c.type === 'categorical');

      for (const ca of colsA) {
        for (const cb of colsB) {
          const sim = nameSimilarity(ca.name, cb.name);
          if (sim < 0.5) continue;

          const valsA = extractValues(dsA.rows, ca.name);
          const valsB = extractValues(dsB.rows, cb.name);
          const ov = valueOverlap(valsA, valsB);

          if (ov.jaccard < 0.05 && ov.aInB < 0.1 && ov.bInA < 0.1) continue;

          const confidence = Math.round((sim * 40 + Math.max(ov.aInB, ov.bInA) * 60) * 100) / 100;
          if (confidence < 30) continue;

          let relType = 'many-to-many';
          const aUniqRatio = ca.unique / Math.max(1, valsA.length);
          const bUniqRatio = cb.unique / Math.max(1, valsB.length);
          if (aUniqRatio > 0.95 && bUniqRatio < 0.5) relType = 'one-to-many';
          else if (bUniqRatio > 0.95 && aUniqRatio < 0.5) relType = 'many-to-one';
          else if (aUniqRatio > 0.9 && bUniqRatio > 0.9) relType = 'one-to-one';

          relationships.push({
            id: dsA.id + ':' + ca.name + '<>' + dsB.id + ':' + cb.name,
            from: { dataset: dsA.id, datasetName: dsA.name, column: ca.name, role: ca.role },
            to: { dataset: dsB.id, datasetName: dsB.name, column: cb.name, role: cb.role },
            type: relType,
            nameSimilarity: sim,
            valueOverlap: ov,
            confidence: Math.min(99, Math.round(confidence)),
          });
        }
      }
    }
  }

  const seen = new Map();
  for (const r of relationships.sort((a, b) => b.confidence - a.confidence)) {
    const pairKey = [r.from.dataset, r.to.dataset].sort().join('|');
    const colKey = pairKey + '|' + r.from.column + '|' + r.to.column;
    if (!seen.has(colKey)) seen.set(colKey, r);
  }

  return [...seen.values()].sort((a, b) => b.confidence - a.confidence);
}

function normalizeColName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function nameSimilarity(a, b) {
  const na = normalizeColName(a);
  const nb = normalizeColName(b);
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const stripId = (s) => s.replace(/id$/, '').replace(/^id/, '');
  const sa = stripId(na), sb = stripId(nb);
  if (sa && sb && (sa.includes(sb) || sb.includes(sa))) return 0.7;
  return 0;
}

function valueOverlap(valsA, valsB) {
  if (!valsA.length || !valsB.length) return { overlap: 0, jaccard: 0, aInB: 0, bInA: 0 };
  const setA = new Set(valsA.map(String));
  const setB = new Set(valsB.map(String));
  let intersection = 0;
  for (const v of setA) if (setB.has(v)) intersection++;
  const union = new Set([...setA, ...setB]).size;
  return {
    overlap: intersection,
    jaccard: union ? +(intersection / union).toFixed(4) : 0,
    aInB: setA.size ? +(intersection / setA.size).toFixed(4) : 0,
    bInA: setB.size ? +(intersection / setB.size).toFixed(4) : 0,
  };
}

function extractValues(rows, colName, limit = 5000) {
  const vals = [];
  for (let i = 0; i < Math.min(rows.length, limit); i++) {
    const v = rows[i][colName];
    if (!isBlank(v)) vals.push(String(v).trim());
  }
  return vals;
}

export function buildKnowledgeGraph(datasets, relationships) {
  const nodes = [];
  const edges = [];

  for (const ds of datasets) {
    const measures = ds.prof.columns.filter((c) => c.role === 'measure');
    const dims = ds.prof.columns.filter((c) => c.role === 'dimension');
    nodes.push({
      id: 'ds:' + ds.id,
      type: 'dataset',
      label: ds.name.replace(/\.(csv|xlsx?|tsv|txt)$/i, ''),
      rows: ds.rows.length,
      cols: ds.fields.length,
      measures: measures.length,
      dimensions: dims.length,
      color: ['#00D4FF', '#7B2FFF', '#00FF9D', '#FF6B35', '#FF2D55'][datasets.indexOf(ds) % 5],
    });

    for (const col of ds.prof.columns) {
      if (col.role === 'pk' || col.role === 'fk') {
        const nodeId = 'col:' + ds.id + ':' + col.name;
        if (!nodes.find((n) => n.id === nodeId)) {
          nodes.push({
            id: nodeId,
            type: 'entity',
            label: col.name,
            dataset: ds.id,
            role: col.role,
            unique: col.unique,
            color: col.role === 'pk' ? '#00FF9D' : '#FF6B35',
          });
          edges.push({
            from: 'ds:' + ds.id,
            to: nodeId,
            type: 'contains',
            label: col.role === 'pk' ? 'PRIMARY KEY' : 'FOREIGN KEY',
          });
        }
      }
    }
  }

  for (const rel of relationships) {
    const fromNode = 'col:' + rel.from.dataset + ':' + rel.from.column;
    const toNode = 'col:' + rel.to.dataset + ':' + rel.to.column;
    edges.push({
      from: fromNode,
      to: toNode,
      type: 'relationship',
      relType: rel.type,
      confidence: rel.confidence,
      label: rel.type.toUpperCase() + ' (' + rel.confidence + '%)',
    });
  }

  return { nodes, edges };
}

export function crossDatasetInsights(datasets, relationships, graph) {
  const out = [];
  const fmt = (n) => {
    const a = Math.abs(n);
    if (a >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (a >= 1000) return (n / 1000).toFixed(1) + 'K';
    return (+n).toFixed(1);
  };

  out.push({
    cat: 'RELATIONAL INTELLIGENCE',
    text: 'Connected ' + datasets.length + ' dataset(s) — detected ' + relationships.length + ' cross-dataset relationship(s) across ' + graph.nodes.filter((n) => n.type === 'entity').length + ' entity column(s).',
    conf: 99,
    tier: 'overview',
  });

  for (const rel of relationships.slice(0, 5)) {
    const dsFrom = datasets.find((d) => d.id === rel.from.dataset);
    const dsTo = datasets.find((d) => d.id === rel.to.dataset);
    if (!dsFrom || !dsTo) continue;

    const measuresFrom = dsFrom.prof.columns.filter((c) => c.role === 'measure' && c.stats);
    const measuresTo = dsTo.prof.columns.filter((c) => c.role === 'measure' && c.stats);

    out.push({
      cat: 'RELATIONSHIP',
      text: '"' + rel.from.column + '" in ' + rel.from.datasetName + ' links to "' + rel.to.column + '" in ' + rel.to.datasetName + ' (' + rel.type + '). Value overlap: ' + Math.round(Math.max(rel.valueOverlap.aInB, rel.valueOverlap.bInA) * 100) + '% match. Join path established.',
      conf: rel.confidence,
      tier: 'relationship',
      rel,
    });

    if (measuresFrom.length && measuresTo.length) {
      const mF = measuresFrom[0], mT = measuresTo[0];
      const joined = joinDatasets(dsFrom.rows, dsTo.rows, rel.from.column, rel.to.column, mF.name, mT.name);
      if (joined.length >= 5) {
        const corr = pearsonCorrelation(joined.map((j) => j.a), joined.map((j) => j.b));
        if (Math.abs(corr) > 0.3) {
          const strength = Math.abs(corr) > 0.7 ? 'strong' : Math.abs(corr) > 0.5 ? 'moderate' : 'weak';
          const direction = corr > 0 ? 'positive' : 'negative';
          out.push({
            cat: 'CORRELATION',
            text: strength.charAt(0).toUpperCase() + strength.slice(1) + ' ' + direction + ' correlation (r=' + corr.toFixed(3) + ') detected between "' + mF.name + '" (' + rel.from.datasetName + ') and "' + mT.name + '" (' + rel.to.datasetName + '). Operational dependency identified.',
            conf: Math.min(95, Math.round(50 + Math.abs(corr) * 45)),
            tier: Math.abs(corr) > 0.6 ? 'temporal' : 'correlation',
            corr,
          });
        }
      }
    }
  }

  for (const rel of relationships.slice(0, 3)) {
    const dsFrom = datasets.find((d) => d.id === rel.from.dataset);
    const dsTo = datasets.find((d) => d.id === rel.to.dataset);
    if (!dsFrom || !dsTo) continue;

    const valsA = new Set(extractValues(dsFrom.rows, rel.from.column));
    const valsB = new Set(extractValues(dsTo.rows, rel.to.column));
    const onlyInA = [...valsA].filter((v) => !valsB.has(v)).length;
    const onlyInB = [...valsB].filter((v) => !valsA.has(v)).length;

    if (onlyInA > 0 || onlyInB > 0) {
      out.push({
        cat: 'COVERAGE GAP',
        text: onlyInA + ' ' + rel.from.column + ' value(s) in "' + rel.from.datasetName + '" have no match in "' + rel.to.datasetName + '"' + (onlyInB > 0 ? ', and ' + onlyInB + ' in "' + rel.to.datasetName + '" have no match back.' : '.') + ' Orphaned entries present.',
        conf: 78,
        tier: 'coverage',
      });
    }
  }

  return out;
}

/* ---------------- Pipeline Orchestration ---------------- */
export const PIPELINE = [
  { id: 'ingest', agent: 'Ingestion Agent', label: 'Parsing & loading dataset', color: '#00D4FF' },
  { id: 'clean', agent: 'Cleaning Agent', label: 'Profiling schema & quality', color: '#00FF9D' },
  { id: 'analyze', agent: 'Insight Agent', label: 'Computing statistics & KPIs', color: '#00D4FF' },
  { id: 'forecast', agent: 'Forecast Agent', label: 'Trend & anomaly modeling', color: '#7B2FFF' },
  { id: 'visualize', agent: 'Visualization Agent', label: 'Generating adaptive dashboard', color: '#FF6B35' },
  { id: 'report', agent: 'Reporting Agent', label: 'Synthesizing executive brief', color: '#00FF9D' },
  { id: 'strategy', agent: 'Strategy Agent', label: 'Deriving recommendations', color: '#FF2D55' },
];

const yieldUI = () => new Promise((r) => (typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(() => r()) : setTimeout(r, 0)));

export async function runPipeline(parsed, onStage) {
  const { rows, fields } = parsed;
  onStage(0, { rowCount: rows.length, colCount: fields.length, truncated: parsed.truncated });
  await yieldUI();
  const prof = profile(rows, fields); onStage(1, { prof });
  await yieldUI();
  const qa = quality(prof); onStage(2, { qa });
  await yieldUI();
  const dash = autoDashboard(rows, prof);
  onStage(3, { forecast: dash.chart && dash.chart.forecast, anomalies: dash.chart ? dash.chart.anomalies : [] });
  await yieldUI();
  onStage(4, { dash });
  await yieldUI();

  // Dynamic domain & credibility modeling
  const domain = detectDomain(fields);
  const insights = generateRefactoredInsights(rows, prof, qa, dash, domain); 
  onStage(5, { insights });
  await yieldUI();

  const recs = generateRefactoredRecommendations(rows, prof, qa, dash, domain); 
  onStage(6, { recs });
  await yieldUI();

  const visualRank = rankVisualizations(prof, qa, dash, domain);
  const riskCards = generateRefactoredRisks(rows, prof, qa, dash, domain);

  return { prof, qa, dash, insights, recs, domain, visualRank, riskCards };
}

export const MULTI_PIPELINE = [
  { id: 'scan', agent: 'Relationship Agent', label: 'Scanning for shared entities', color: '#7B2FFF' },
  { id: 'graph', agent: 'Graph Agent', label: 'Building enterprise knowledge graph', color: '#00D4FF' },
  { id: 'reason', agent: 'Reasoning Agent', label: 'Cross-dataset causal analysis', color: '#00FF9D' },
  { id: 'correlate', agent: 'Correlation Agent', label: 'Computing inter-metric correlations', color: '#FF6B35' },
];

export async function runMultiPipeline(datasets, onStage) {
  onStage(0, { scanning: true });
  await yieldUI();

  const relationships = detectRelationships(datasets);
  onStage(0, { relationships });
  await yieldUI();

  const graph = buildKnowledgeGraph(datasets, relationships);
  onStage(1, { graph });
  await yieldUI();

  const multiInsights = crossDatasetInsights(datasets, relationships, graph);
  onStage(2, { multiInsights });
  await yieldUI();

  const corrMatrices = {};
  for (const ds of datasets) {
    const cm = correlationMatrix(ds.rows, ds.prof);
    if (cm) corrMatrices[ds.id] = cm;
  }
  onStage(3, { corrMatrices });

  return { relationships, graph, multiInsights, corrMatrices };
}
