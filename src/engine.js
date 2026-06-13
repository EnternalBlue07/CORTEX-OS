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

/* ---------------- ingestion ---------------- */
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
          // ignore fully-empty rows produced by stray delimiters
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
    // header:1 gives raw arrays so we can reliably derive headers even with gaps
    const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
    if (!matrix.length) throw new Error('Sheet is empty.');
    const header = matrix[0].map((h, i) => (h === null || h === '' ? 'Column ' + (i + 1) : String(h)));
    // de-duplicate header names
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

/* ---------------- helpers ---------------- */
const isBlank = (v) => v === null || v === undefined || v === '' || (typeof v === 'string' && v.trim() === '');
const toNum = (v) => {
  if (typeof v === 'number') return v;
  if (isBlank(v)) return NaN;
  const s = String(v).trim();
  // reject strings that aren't fundamentally numeric (avoid '1px', '2024-01', '(neg)' accounting etc.)
  // also support accounting negatives like (1,234.56)
  if (/^\([$€£]?[\d,]+\.?\d*\)$/.test(s)) {
    const n = Number(s.replace(/[()$€£,\s]/g, ''));
    return Number.isFinite(n) ? -n : NaN;
  }
  if (!/^[-+]?[$€£]?\s*\d[\d,]*\.?\d*\s*%?$/.test(s)) return NaN;
  const n = Number(s.replace(/[$€£,%\s]/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

// robust date parsing across common enterprise formats
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
export function parseDate(v) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') {
    // Excel serial date (days since 1899-12-30)
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
    return mk(yr, +m[1] - 1, +m[2]); // assume US M/D/Y
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

/* ---------------- schema detection + classification ---------------- */
/* Type inference uses a sample; numeric stats (sum/mean/min/max/outliers)
   are computed over the FULL dataset for credibility. */
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
      // Only count as numeric if it's NOT an Excel serial date (avoids double-classification)
      // Excel serials are raw numbers in range 59-80000 — already caught by parseDate
      const asNum = toNum(v);
      const isExcelSerial = typeof v === 'number' && v > 59 && v < 80000 && isDate;
      if (!isExcelSerial && Number.isFinite(asNum)) numCount++;
    }
    const filled = sampleSize - blanks;
    const numericRatio = filled ? numCount / filled : 0;
    const dateRatio = filled ? dateCount / filled : 0;
    const uniqRatio = filled ? uniq.size / filled : 0;

    let type = 'categorical';
    // Date takes priority — if > 70% of values parse as dates, call it a date column
    if (dateRatio > 0.7) type = 'date';
    // Numeric: but watch out for ID-like columns (order numbers, zip codes, phone numbers)
    else if (numericRatio > 0.85) type = (/(^id$|_id$|\bid\b|code|zip|postal|phone|order.?num|invoice|serial)/i.test(f) && uniqRatio > 0.9) ? 'id' : 'numeric';
    // High-cardinality text = ID
    else if (uniqRatio > 0.97 && filled > 8) type = 'id';

    const col = { name: f, type, unique: uniq.size, uniqueSampled: sampled };

    if (type === 'numeric') {
      // full-dataset numeric stats
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
      // missing % from sample (cheap; flagged as sampled when relevant)
      let fullBlanks = 0;
      for (const r of rows) if (isBlank(r[f])) fullBlanks++;
      col.missing = Math.round((fullBlanks / (n || 1)) * 100);
    }
    return col;
  });
  return { rowCount: n, colCount: fields.length, sampled, sampleSize, columns };
}

/* ---------------- data quality ---------------- */
export function quality(prof) {
  const issues = [];
  for (const c of prof.columns) {
    if (c.missing > 0) issues.push({ sev: c.missing > 25 ? 'WARNING' : 'INFO', col: c.name, msg: c.missing + '% missing values in "' + c.name + '"' });
    if (c.stats && c.stats.outliers > 0) issues.push({ sev: c.stats.outliers > prof.rowCount * 0.05 ? 'WARNING' : 'INFO', col: c.name, msg: c.stats.outliers + ' statistical outlier(s) in "' + c.name + '" (IQR method)' });
  }
  // Weighted quality score: WARNING columns penalize more than INFO ones
  // Each column contributes its missing% to the total penalty, with WARNING columns weighted 2x
  const warnings = prof.columns.filter((c) => c.missing > 25);
  const totalPenalty = prof.columns.reduce((a, c) => {
    const weight = c.missing > 25 ? 2 : 1; // WARNING columns hurt twice as much
    return a + (c.missing * weight);
  }, 0);
  const maxPenalty = prof.columns.reduce((a, c) => a + (c.missing > 25 ? 200 : 100), 0);
  const filledScore = maxPenalty > 0 ? 100 - (totalPenalty / prof.columns.length) : 100;
  return { issues, score: Math.max(0, Math.min(100, Math.round(filledScore))), warnings: warnings.length };
}

/* ---------------- forecast (linear trend, normalized confidence) ---------------- */
export function forecast(series, horizon = 5) {
  const ys = series.filter((v) => Number.isFinite(v));
  const nLin = ys.length;
  if (nLin < 4) return null; // need enough points to be credible
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
  // confidence: blend fit quality (R^2) with sample-size adequacy, then clamp
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

/* ---------------- anomaly detection (z-score) ---------------- */
export function anomalies(series, labels) {
  const vals = series.map((v, i) => ({ v, i })).filter((d) => Number.isFinite(d.v));
  if (vals.length < 8) return [];
  const mean = vals.reduce((a, d) => a + d.v, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((a, d) => a + (d.v - mean) ** 2, 0) / vals.length);
  if (std === 0) return [];
  return vals
    .map((d) => ({ ...d, z: (d.v - mean) / std }))
    .filter((d) => Math.abs(d.z) > 2.5)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .slice(0, 12)
    .map((d) => ({ index: d.i, label: labels ? labels[d.i] : d.i, value: d.v, z: +d.z.toFixed(2), dir: d.z > 0 ? 'spike' : 'drop' }));
}

/* ---------------- auto dashboard generation ---------------- */
// Columns that look like TOTALS (absolute amounts, not rates)
const TOTAL_PRIORITY = /^(revenue|sales|amount|gmv|arr|mrr|bookings?|orders?|transactions?|gross|net|value|spend|income|budget)/i;
// Columns that are rates, %, ratios — prefer AVG not SUM, and never use as primary chart metric
const RATE_COL = /rate|ratio|pct|percent|margin|discount|score|index|%/i;
// Broader fallback metric names (only used if no TOTAL_PRIORITY match)
const METRIC_FALLBACK = /profit|cost|price|total|forecast|value|income|spend|budget/i;

export function autoDashboard(rows, prof) {
  const numericCols = prof.columns.filter((c) => c.type === 'numeric' && c.stats);
  // Non-rate columns first (by absolute sum desc), rate columns pushed to end
  const sortedNums = [
    ...numericCols.filter((c) => !RATE_COL.test(c.name)).sort((a, b) => Math.abs(b.stats.sum) - Math.abs(a.stats.sum)),
    ...numericCols.filter((c) => RATE_COL.test(c.name)),
  ];
  const dateCol = prof.columns.find((c) => c.type === 'date');
  const catCols = prof.columns.filter((c) => c.type === 'categorical' && c.unique <= 30 && c.unique > 1);

  // KPIs: classify as TOTAL when sum is meaningfully larger than mean (implies an accumulation metric)
  // vs AVG for rate/percentage columns
  const kpis = sortedNums.slice(0, 6).map((c) => {
    // If it's a rate/pct column, always show average; otherwise show sum if it makes sense
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
  // Primary metric for the forecast chart:
  // 1st preference: a non-rate column whose name looks like a business total (revenue, sales, gmv...)
  // 2nd preference: any non-rate column with the largest absolute sum
  // 3rd preference: fallback metric name match
  // Last resort: first numeric column
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
        if (!d) continue; // isolate invalid date rows
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

/* ---------------- executive insight generation ---------------- */
export function executiveInsights(prof, qa, dash) {
  const out = [];
  const fmt = (n) => {
    const a = Math.abs(n);
    if (a >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (a >= 1000) return (n / 1000).toFixed(1) + 'K';
    return (+n).toFixed(1);
  };

  if (prof.sampled) out.push({ cat: 'SAMPLING MODE', text: 'Large dataset — type inference ran on the first ' + prof.sampleSize.toLocaleString() + ' rows; numeric aggregates computed over all ' + prof.rowCount.toLocaleString() + ' retained rows.', conf: 90 });
  if (dash.chart && dash.chart.forecast) {
    const fc = dash.chart.forecast;
    const dir = fc.trend === 'up' ? 'upward' : fc.trend === 'down' ? 'downward' : 'flat';
    out.push({ cat: 'FORECAST', text: '"' + dash.chart.metric + '" shows a ' + dir + ' trajectory over ' + fc.n + ' observations (R²=' + fc.r2 + '). Model projects ~' + fmt(fc.future[fc.future.length - 1].yhat) + ' in 5 periods with ' + fc.confidence + '% confidence.', conf: fc.confidence });
  } else if (dash.chart) {
    out.push({ cat: 'FORECAST', text: 'Insufficient ordered observations in "' + dash.chart.metric + '" for a credible forecast (need ≥4 data points).', conf: 50 });
  }
  if (dash.chart && dash.chart.anomalies.length) {
    const a = dash.chart.anomalies[0];
    const others = dash.chart.anomalies.length - 1;
    out.push({ cat: 'ANOMALY', text: 'Detected ' + dash.chart.anomalies.length + ' statistical anomal' + (dash.chart.anomalies.length === 1 ? 'y' : 'ies') + ' in "' + dash.chart.metric + '". Largest: a ' + a.dir + ' at "' + a.label + '" (z=' + a.z + ', value=' + fmt(a.value) + ')' + (others ? ', plus ' + others + ' more.' : '.'), conf: Math.min(98, 70 + Math.round(Math.abs(a.z) * 6)) });
  }
  if (dash.breakdown && dash.breakdown.data.length) {
    const top = dash.breakdown.data[0];
    const total = dash.breakdown.data.reduce((s, d) => s + d.v, 0) || 1;
    const pct = Math.round((top.v / total) * 100);
    out.push({ cat: 'CONCENTRATION', text: '"' + top.k + '" leads "' + dash.breakdown.by + '" with ' + fmt(top.v) + ' (' + pct + '% of total). ' + (pct > 40 ? 'High concentration — consider diversification risk.' : 'Distribution is reasonably balanced.'), conf: 88 });
  }
  // DATA QUALITY always shown — tells the user what the engine found regardless of issues
  {
    const warns = qa.issues.filter((i) => i.sev === 'WARNING').length;
    const infos = qa.issues.filter((i) => i.sev === 'INFO').length;
    const qText = qa.score >= 95
      ? 'Dataset integrity at ' + qa.score + '%. ' + (qa.issues.length ? infos + ' minor info-level flag(s) noted, no blockers.' : 'Clean dataset — all columns fully populated.')
      : 'Dataset integrity at ' + qa.score + '%. ' + warns + ' WARNING(s) and ' + infos + ' INFO flag(s) detected. ' + (warns ? 'Review missing values before board-level reporting.' : 'Data is usable but could be improved.');
    out.push({ cat: 'DATA QUALITY', text: qText, conf: 82 });
  }
  out.push({ cat: 'OVERVIEW', text: 'Analyzed ' + prof.rowCount.toLocaleString() + ' rows × ' + prof.colCount + ' columns. ' + dash.numericCols + ' numeric metric' + (dash.numericCols !== 1 ? 's' : '') + ', ' + dash.catCols + ' categorical dimension' + (dash.catCols !== 1 ? 's' : '') + (dash.dateCol ? ', 1 time dimension.' : '.'), conf: 99 });
  return out;
}

export function recommendations(prof, qa, dash) {
  const recs = [];
  if (dash.chart && dash.chart.forecast && dash.chart.forecast.trend === 'down') recs.push('Investigate the declining "' + dash.chart.metric + '" trajectory; model confidence ' + dash.chart.forecast.confidence + '%.');
  if (dash.chart && dash.chart.forecast && dash.chart.forecast.trend === 'up') recs.push('Capitalize on positive "' + dash.chart.metric + '" momentum; allocate resources toward the leading driver.');
  if (dash.chart && dash.chart.anomalies.length) recs.push('Triage ' + dash.chart.anomalies.length + ' flagged anomaly point(s) in "' + dash.chart.metric + '" before board reporting.');
  if (dash.breakdown) recs.push('Reduce concentration risk in "' + dash.breakdown.by + '"; top segment dominates the metric.');
  const dirty = qa.issues.filter((i) => i.sev === 'WARNING');
  if (dirty.length) recs.push('Cleanse ' + dirty.length + ' high-impact data quality issue(s) to raise integrity above 95%.');
  if (!recs.length) recs.push('Dataset is clean and stable — promote to automated monitoring and scheduled board reporting.');
  return recs;
}

/* ---------------- pipeline orchestration (real stages) ---------------- */
export const PIPELINE = [
  { id: 'ingest', agent: 'Ingestion Agent', label: 'Parsing & loading dataset', color: '#00D4FF' },
  { id: 'clean', agent: 'Cleaning Agent', label: 'Profiling schema & quality', color: '#00FF9D' },
  { id: 'analyze', agent: 'Insight Agent', label: 'Computing statistics & KPIs', color: '#00D4FF' },
  { id: 'forecast', agent: 'Forecast Agent', label: 'Trend & anomaly modeling', color: '#7B2FFF' },
  { id: 'visualize', agent: 'Visualization Agent', label: 'Generating adaptive dashboard', color: '#FF6B35' },
  { id: 'report', agent: 'Reporting Agent', label: 'Synthesizing executive brief', color: '#00FF9D' },
  { id: 'strategy', agent: 'Strategy Agent', label: 'Deriving recommendations', color: '#FF2D55' },
];

/* yields to the event loop so heavy steps never freeze the UI */
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
  const insights = executiveInsights(prof, qa, dash); onStage(5, { insights });
  await yieldUI();
  const recs = recommendations(prof, qa, dash); onStage(6, { recs });
  return { prof, qa, dash, insights, recs };
}
