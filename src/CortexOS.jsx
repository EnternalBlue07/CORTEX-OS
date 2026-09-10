import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import {
  parseFile,
  runPipeline,
  PIPELINE,
  validateFile,
  correlationMatrix,
  forecast,
  anomalies,
  runMultiPipeline,
} from './engine.js';
import {
  C,
  SOURCES,
  THOUGHTS,
  INIT_ALERTS,
  GLOBAL_CSS,
  rand,
  mkThought,
  genNexus,
  SYSTEM_PROMPT,
  MOCK_CUSTOMERS,
  MOCK_TRANSACTIONS,
  MOCK_SUPPORT_TICKETS,
  INDUSTRY_LABELS,
  INDUSTRY_KPIS,
} from './constants';


/* Shared Shell Components */
import Background from './components/Background';
import Boot from './components/Boot';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DatasetBar from './components/DatasetBar';
import ChatPanel from './components/ChatPanel';
import CommandPalette from './components/CommandPalette';
import PresentationMode from './components/PresentationMode';

/* Lazy loaded Workspace Tabs for Code-Splitting */
const IntelligenceFeed = React.lazy(() => import('./tabs/IntelligenceFeed'));
const EnterpriseFabric = React.lazy(() => import('./tabs/EnterpriseFabric'));
const DataProfiler = React.lazy(() => import('./tabs/DataProfiler'));
const DataCleaner = React.lazy(() => import('./tabs/DataCleaner'));
const RelationalInsights = React.lazy(() => import('./tabs/RelationalInsights'));
const Settings = React.lazy(() => import('./tabs/Settings'));
const ImmersiveMode = React.lazy(() => import('./components/ImmersiveMode'));

/* ---- helpers ---- */
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

function simulatedReply(q) {
  return (
    'CORTEX ANALYTICS AGENT RESPONSE:\n\n' +
    '• Focus: ' + q + '\n' +
    '• System: Ingestion verified, schemas aligned.\n' +
    '• Outliers: Calculated Z-Score variance checks across metric columns.\n\n' +
    'RECOMMENDATION: Use the "Data Cleaner" tab to handle nulls and drop identical rows.'
  );
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
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: history,
      }),
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
          if (ev.type === 'content_block_delta' && ev.delta && ev.delta.text) {
            onDelta(ev.delta.text);
          }
        } catch (e) {
          /* keep streaming */
        }
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

export default function CortexOS() {
  const [phase, setPhase] = useState('boot');
  const [active, setActive] = useState(0);
  const [now, setNow] = useState(new Date());
  const [thoughts, setThoughts] = useState(() => THOUGHTS.slice(0, 4).map(mkThought));
  const [nexus, setNexus] = useState(() => SOURCES.map(genNexus));
  const [tick, setTick] = useState({ rev: 128.4, tasks: 1847, threat: 18, conf: 91, streams: 312, load: 64, lat: 23 });
  const [alerts, setAlerts] = useState(INIT_ALERTS);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'CORTEX online. Ask me about dataset variables, clean commands, or summary statistics.',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [palOpen, setPalOpen] = useState(false);
  const [palQ, setPalQ] = useState('');
  const [palIdx, setPalIdx] = useState(0);
  const [sysState] = useState('NOMINAL');

  /* real data intelligence state */
  const [datasets, setDatasets] = useState([]); // [{ id, name, rows, fields, analysis, prof, size, sourceType, uploadTime, lastAnalysisTime, archived }]
  const [activeDs, setActiveDs] = useState(0); // index of currently viewed dataset
  const [corrMatrix, setCorrMatrix] = useState(null); // per-dataset correlation matrix
  const dataset = datasets[activeDs] || null;
  const analysis = dataset ? dataset.analysis : null;
  const [stageStatus, setStageStatus] = useState(PIPELINE.map(() => 'idle'));
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [present, setPresent] = useState(false);
  const [slide, setSlide] = useState(0);
  const fileRef = useRef(null);
  const chatRef = useRef(null);
  const datasetRef = useRef(null);
  const chart = useMemo(makeChart, []);

  /* Enterprise UI state additions */
  const [multiRelational, setMultiRelational] = useState({ relationships: [], graph: null, multiInsights: [] });
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [whatIfScenarios, setWhatIfScenarios] = useState({ marketing: 0, churn: 0, logistics: 0 });
  const [nlqQuery, setNlqQuery] = useState('');
  const [nlqOutput, setNlqOutput] = useState(null);
  const [chartView, setChartView] = useState('recommended'); // 'recommended' | 'area' | 'bar' | 'scatter'
  const [industryMode, setIndustryMode] = useState('saas');
  const [commentsFeed, setCommentsFeed] = useState([
    { id: 1, user: 'Sarah (CEO)', text: 'Strategic sandbox parameters look aligned. Let\'s verify budget reallocations.', time: '14:22' },
    { id: 2, user: 'Dave (Lead Analyst)', text: 'Collinearity scan checks out. Risk thresholds set to nominal.', time: '14:35' }
  ]);
  const [workflowState, setWorkflowState] = useState('idle');

  /* Custom interactive states */
  const [forecastHorizon, setForecastHorizon] = useState(5);
  const [anomalySensitivity, setAnomalySensitivity] = useState(2.5);
  const [profileSampleSize, setProfileSampleSize] = useState(5000);

  /* Ultra-Rare Features state */
  const [temporalEra, setTemporalEra] = useState('q2-2026');
  const [warRoomMode, setWarRoomMode] = useState(false);

  /* OMEGA Features State */
  const [multiverseScenario, setMultiverseScenario] = useState('none');
  const [immersiveMode, setImmersiveMode] = useState(false);

  /* Overhaul Additions */
  const [uploadPendingFile, setUploadPendingFile] = useState(null);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareDsIndices, setCompareDsIndices] = useState([null, null]);

  // Load Enterprise Mock Datasets (3 connected files)
  const loadRelationalDemo = async () => {
    setAnalyzing(true);
    setStageStatus(PIPELINE.map(() => 'idle'));
    try {
      const demoSets = [
        { name: 'Customers.csv', rows: MOCK_CUSTOMERS, fields: Object.keys(MOCK_CUSTOMERS[0]) },
        { name: 'Transactions.csv', rows: MOCK_TRANSACTIONS, fields: Object.keys(MOCK_TRANSACTIONS[0]) },
        { name: 'Support_Tickets.csv', rows: MOCK_SUPPORT_TICKETS, fields: Object.keys(MOCK_SUPPORT_TICKETS[0]) },
      ];

      const loadedDatasets = [];
      let i = 0;
      for (const d of demoSets) {
        // simulate progression ticks on first load
        setThoughts((ts) => [
          {
            id: Math.random(),
            text: `Ingestion Agent: Processing relational table "${d.name}"...`,
            type: 'INGEST',
            conf: 95,
            time: new Date().toLocaleTimeString('en-GB')
          },
          ...ts
        ].slice(0, 8));

        const result = await runPipeline(d, (stageIndex) => {
          if (i === 0) {
            setStageStatus((s) => s.map((v, idx) => (idx < stageIndex ? 'done' : idx === stageIndex ? 'active' : 'idle')));
          }
        });

        loadedDatasets.push({
          id: 'ds-' + d.name.toLowerCase().replace(/\./g, '-'),
          name: d.name,
          rows: d.rows,
          fields: d.fields,
          analysis: result,
          prof: result.prof
        });
        i++;
      }

      setStageStatus(PIPELINE.map(() => 'done'));
      setDatasets(loadedDatasets);
      setActiveDs(1); // Set Transactions active first since it has numeric values to chart

      setThoughts((ts) => [
        {
          id: Math.random(),
          text: 'Ingestion Agent: Successfully loaded 3 relational tables. Relational Intelligence Engine active.',
          type: 'INGEST',
          conf: 99,
          time: new Date().toLocaleTimeString('en-GB')
        },
        ...ts
      ].slice(0, 8));
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  // Sync active dataset correlation matrix
  useEffect(() => {
    const ds = datasets[activeDs];
    if (ds) {
      const cm = correlationMatrix(ds.rows, ds.prof);
      setCorrMatrix(cm);
    } else {
      setCorrMatrix(null);
    }
  }, [activeDs, datasets]);

  // Run multi-dataset relational mapping
  useEffect(() => {
    if (datasets.length >= 2) {
      runMultiPipeline(datasets, () => {}).then((res) => {
        setMultiRelational({
          relationships: res.relationships || [],
          graph: res.graph || null,
          multiInsights: res.multiInsights || []
        });
      });
    } else {
      setMultiRelational({ relationships: [], graph: null, multiInsights: [] });
    }
  }, [datasets]);

  // Dynamic forecast recalculation based on horizon slider & What-If multipliers
  const dynamicChartData = useMemo(() => {
    if (!analysis || !analysis.dash.chart) return null;
    const chartInfo = analysis.dash.chart;
    const histPts = chartInfo.data.filter((p) => p.hist !== null);
    const series = histPts.map((p) => p.hist);
    const labels = histPts.map((p) => p.x);
    const fc = forecast(series, forecastHorizon);
    const merged = histPts.map((p) => ({ x: p.x, hist: p.hist, fc: null, lo: null, hi: null }));

    const marketingMultiplier = 1 + (whatIfScenarios.marketing / 100) * 0.15;
    const churnMultiplier = 1 - (whatIfScenarios.churn / 100) * 0.20;
    const logisticsMultiplier = 1 + (whatIfScenarios.logistics / 100) * 0.10;
    const scenarioMult = 
      multiverseScenario === 'recession' ? 0.75 :
      multiverseScenario === 'growth' ? 1.20 :
      multiverseScenario === 'collapse' ? 0.50 :
      multiverseScenario === 'ai' ? 1.35 : 1.0;
    const mult = marketingMultiplier * churnMultiplier * logisticsMultiplier * scenarioMult;

    if (fc && merged.length) {
      merged[merged.length - 1].fc = +(series[series.length - 1] * (series[series.length - 1] ? 1 : mult)).toFixed(2);
      fc.future.forEach((f, h) => {
        const xVal = labels[series.length + h] || 'T+' + (h + 1);
        const yhatSim = +(f.yhat * mult).toFixed(2);
        const bandSim = +((f.hi - f.lo) / 2).toFixed(2);
        merged.push({
          x: xVal,
          hist: null,
          fc: yhatSim,
          lo: +(yhatSim - bandSim).toFixed(2),
          hi: +(yhatSim + bandSim).toFixed(2),
        });
      });
    }
    return {
      ...chartInfo,
      data: merged,
      forecast: fc ? {
        ...fc,
        future: fc.future.map((f) => {
          const yhatSim = +(f.yhat * mult).toFixed(2);
          const bandSim = +((f.hi - f.lo) / 2).toFixed(2);
          return {
            yhat: yhatSim,
            lo: +(yhatSim - bandSim).toFixed(2),
            hi: +(yhatSim + bandSim).toFixed(2)
          };
        })
      } : null,
    };
  }, [analysis, forecastHorizon, whatIfScenarios]);


  // Dynamic anomalies calculation based on anomaly sensitivity slider
  const dynamicAnomalies = useMemo(() => {
    if (!analysis || !analysis.dash.chart) return [];
    const chartInfo = analysis.dash.chart;
    const histPts = chartInfo.data.filter((p) => p.hist !== null);
    const series = histPts.map((p) => p.hist);
    const labels = histPts.map((p) => p.x);
    return anomalies(series, labels, anomalySensitivity);
  }, [analysis, anomalySensitivity]);

  /* === real analysis pipeline === */
  const analyzeFile = async (file, reset = false) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setThoughts((ts) =>
        [
          {
            id: Math.random(),
            text: 'Ingestion Agent: ' + err,
            type: 'REJECTED',
            conf: 99,
            time: new Date().toLocaleTimeString('en-GB'),
          },
          ...ts,
        ].slice(0, 8)
      );
      return;
    }
    setAnalyzing(true);
    setStageStatus(PIPELINE.map(() => 'idle'));
    setActive(0);
    try {
      const parsed = await parseFile(file);
      const dsId = 'ds-' + Date.now();
      const ds = {
        id: dsId,
        name: file.name,
        rows: parsed.rows,
        fields: parsed.fields,
        truncated: parsed.truncated,
        size: file.size,
        sourceType: file.name.split('.').pop().toUpperCase(),
        uploadTime: new Date().toLocaleTimeString('en-GB'),
        lastAnalysisTime: new Date().toLocaleTimeString('en-GB'),
        archived: false,
      };
      datasetRef.current = ds;

      const result = await runPipeline(parsed, (i, payload) => {
        setStageStatus((s) => s.map((v, idx) => (idx < i ? 'done' : idx === i ? 'active' : 'idle')));
        const p = PIPELINE[i];
        let detail = p.label;
        if (payload.prof) {
          detail =
            'Detected ' +
            payload.prof.colCount +
            ' columns across ' +
            payload.prof.rowCount.toLocaleString() +
            ' rows' +
            (payload.prof.sampled ? ' (sampling)' : '');
        } else if (payload.qa) {
          detail = 'Integrity ' + payload.qa.score + '% · ' + payload.qa.issues.length + ' issue(s)';
        }
        setThoughts((ts) =>
          [
            {
              id: Math.random(),
              text: p.agent + ': ' + detail,
              type: p.id.toUpperCase(),
              conf: Math.round(rand(88, 99)),
              time: new Date().toLocaleTimeString('en-GB'),
            },
            ...ts,
          ].slice(0, 8)
        );
      });
      setStageStatus(PIPELINE.map(() => 'done'));

      // compute correlation matrix for this dataset
      const cm = correlationMatrix(parsed.rows, result.prof);
      setCorrMatrix(cm);

      // add to datasets array
      const fullDs = { ...ds, analysis: result, prof: result.prof };
      setDatasets((prev) => {
        const next = reset ? [fullDs] : [...prev, fullDs];
        setActiveDs(next.length - 1);
        return next;
      });

      if (reset) {
        setAlerts([]);
        setMultiRelational({ relationships: [], graph: null, multiInsights: [] });
      }

      // alerts
      if (result.dash.chart && result.dash.chart.anomalies.length) {
        setAlerts((as) =>
          [
            {
              id: Math.random(),
              sev: 'OUTLIER',
              color: '#DC2626',
              title: 'Anomalies Detected',
              src: 'Anomaly Agent',
              rec: 'Clean dataset values to resolve variance anomalies.',
            },
            ...as,
          ].slice(0, 6)
        );
      }
    } catch (e) {
      setThoughts((ts) =>
        [
          {
            id: Math.random(),
            text: 'Ingestion Agent: failed to parse "' + file.name + '" — ' + (e.message || 'unsupported format'),
            type: 'ERROR',
            conf: 99,
            time: new Date().toLocaleTimeString('en-GB'),
          },
          ...ts,
        ].slice(0, 8)
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const replaceFile = async (file, index) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setThoughts((ts) =>
        [
          {
            id: Math.random(),
            text: 'Replace Ingestion: ' + err,
            type: 'REJECTED',
            conf: 99,
            time: new Date().toLocaleTimeString('en-GB'),
          },
          ...ts,
        ].slice(0, 8)
      );
      setReplaceIndex(null);
      return;
    }
    setAnalyzing(true);
    try {
      const parsed = await parseFile(file);
      const dsId = 'ds-' + Date.now();
      const ds = {
        id: dsId,
        name: file.name,
        rows: parsed.rows,
        fields: parsed.fields,
        truncated: parsed.truncated,
        size: file.size,
        sourceType: file.name.split('.').pop().toUpperCase(),
        uploadTime: new Date().toLocaleTimeString('en-GB'),
        lastAnalysisTime: new Date().toLocaleTimeString('en-GB'),
        archived: false,
      };

      const result = await runPipeline(parsed, () => {});
      const fullDs = { ...ds, analysis: result, prof: result.prof };

      setDatasets((prev) => {
        const next = [...prev];
        next[index] = fullDs;
        return next;
      });

      if (index === activeDs) {
        const cm = correlationMatrix(parsed.rows, result.prof);
        setCorrMatrix(cm);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
      setReplaceIndex(null);
    }
  };

  const reanalyzeDataset = async (index) => {
    const ds = datasets[index];
    if (!ds) return;
    setAnalyzing(true);
    try {
      const result = await runPipeline({ rows: ds.rows, fields: ds.fields }, () => {});
      setDatasets((prev) => {
        const next = [...prev];
        next[index] = {
          ...ds,
          analysis: result,
          prof: result.prof,
          lastAnalysisTime: new Date().toLocaleTimeString('en-GB'),
        };
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const removeDataset = (index) => {
    setDatasets((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (activeDs >= next.length) {
        setActiveDs(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const archiveDataset = (index) => {
    setDatasets((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], archived: !next[index].archived };
      }
      return next;
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      if (datasets.length > 0) {
        setUploadPendingFile(f);
      } else {
        analyzeFile(f);
      }
    }
  };

  /* performance mode: pause ambient activity during analysis */
  const busy = analyzing || present;

  /* boot timing */
  useEffect(() => {
    const a = setTimeout(() => setPhase('flash'), 1200);
    const b = setTimeout(() => setPhase('app'), 1400);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  /* live clock */
  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  /* chat autoscroll */
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const appendToLast = (d) =>
    setMessages((ms) => {
      const c = ms.slice();
      const last = c[c.length - 1];
      c[c.length - 1] = { role: last.role, text: last.text + d };
      return c;
    });

  const streamSim = (full, cb) =>
    new Promise((resolve) => {
      let i = 0;
      const iv = setInterval(() => {
        cb(full.slice(i, i + 3));
        i += 3;
        if (i >= full.length) {
          clearInterval(iv);
          resolve();
        }
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

  const runCommand = (c) => {
    setPalOpen(false);
    if (c[0].includes('Cleaner')) {
      setActive(2);
    } else if (c[0].includes('Report')) {
      setActive(0);
    } else if (c[0].includes('Schema')) {
      setActive(1);
    } else if (c[0].includes('Insights')) {
      setActive(3);
    }
  };

  /* presentation slides */
  const slides = useMemo(() => {
    if (!analysis || !dataset) return [];
    const an = analysis,
      ds = dataset;
    const items = [
      {
        tag: 'CORTEX OS · EXECUTIVE SUMMARY',
        title: ds.name,
        sub: `Ingested ${ds.rows.length.toLocaleString()} rows. Quality score is ${an.qa.score}%.`,
      },
      ...an.dash.kpis.slice(0, 3).map((k) => ({
        tag: k.label,
        big: k.value >= 1000 ? Math.round(k.value).toLocaleString() : (+k.value).toFixed(1),
        sub: `Min: ${(+k.min).toFixed(1)} | Max: ${(+k.max).toFixed(1)} | Mean: ${(+k.mean).toFixed(1)}`,
      })),
    ];

    if (multiRelational && multiRelational.relationships.length > 0) {
      items.push({
        tag: 'ENTERPRISE RELATIONSHIP MAP',
        title: `${multiRelational.relationships.length} Multi-Dataset Connections Detected`,
        sub: multiRelational.relationships.slice(0, 3).map(r => `${r.from.datasetName}.${r.from.column} ↔ ${r.to.datasetName}.${r.to.column} (${r.type}, ${r.confidence}% confidence)`).join(' | '),
      });
    }

    if (an.dash.chart && an.dash.chart.forecast) {
      items.push({
        tag: 'PREDICTIVE PROJECTIONS',
        title: `Forecast Trend for ${an.dash.chart.metric}`,
        sub: `Model projects a ${an.dash.chart.forecast.trend} trend with ${an.dash.chart.forecast.confidence}% confidence limit. Recommended operational strategy is aligned.`,
      });
    }

    items.push({ tag: 'RECOMMENDATIONS', title: 'Actionable Steps', list: an.recs });
    return items;
  }, [analysis, dataset, multiRelational]);

  return (
    <div className="cx-root">
      <style>{GLOBAL_CSS}</style>
      <Background />

      {phase === 'boot' ? (
        <Boot flash={phase === 'flash'} />
      ) : (
        <div className={`cx-app ${sysState.toLowerCase()} ${warRoomMode ? 'war-room' : ''}`}>
          {/* Minimal Sidebar */}
          <Sidebar active={active} setActive={setActive} />

          {/* Main Workspace Container */}
          <div className="cx-main">
            <TopBar active={active} setPalOpen={setPalOpen} tick={tick} now={now} sysState={sysState} />

            {/* Persistent Dataset Selector Bar */}
            <DatasetBar datasets={datasets} activeDs={activeDs} setActiveDs={setActiveDs} fileRef={fileRef} />

            {/* Hidden Input Ingestion */}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  if (replaceIndex !== null) {
                    replaceFile(file, replaceIndex);
                  } else {
                    if (datasets.length > 0) {
                      setUploadPendingFile(file);
                    } else {
                      analyzeFile(file);
                    }
                  }
                }
                e.target.value = '';
              }}
            />

            {/* Code-Split Lazy Tab Workspaces */}
            <Suspense
              fallback={
                <div style={{ textAlign: 'center', padding: '60px 10px', fontSize: 13, color: C.muted }}>
                  Aligning workspace component...
                </div>
              }
            >
              {active === 0 && (
                <IntelligenceFeed
                  dataset={dataset}
                  analyzing={analyzing}
                  stageStatus={stageStatus}
                  PIPELINE={PIPELINE}
                  onDrop={onDrop}
                  dragOver={dragOver}
                  setDragOver={setDragOver}
                  fileRef={fileRef}
                  analysis={analysis}
                  setPresent={setPresent}
                  setSlide={setSlide}
                  dynamicChartData={dynamicChartData}
                  forecastHorizon={forecastHorizon}
                  setForecastHorizon={setForecastHorizon}
                  chart={chart}
                  alerts={alerts}
                  setAlerts={setAlerts}
                  whatIfScenarios={whatIfScenarios}
                  setWhatIfScenarios={setWhatIfScenarios}
                  selectedAnomaly={selectedAnomaly}
                  setSelectedAnomaly={setSelectedAnomaly}
                  dynamicAnomalies={dynamicAnomalies}
                  nlqQuery={nlqQuery}
                  setNlqQuery={setNlqQuery}
                  nlqOutput={nlqOutput}
                  setNlqOutput={setNlqOutput}
                  chartView={chartView}
                  setChartView={setChartView}
                  loadRelationalDemo={loadRelationalDemo}
                  thoughts={thoughts}
                  setThoughts={setThoughts}
                  industryMode={industryMode}
                  commentsFeed={commentsFeed}
                  setCommentsFeed={setCommentsFeed}
                  temporalEra={temporalEra}
                  setTemporalEra={setTemporalEra}
                  warRoomMode={warRoomMode}
                  setWarRoomMode={setWarRoomMode}
                  multiverseScenario={multiverseScenario}
                  setMultiverseScenario={setMultiverseScenario}
                  datasets={datasets}
                  activeDs={activeDs}
                  setActiveDs={setActiveDs}
                  removeDataset={removeDataset}
                  reanalyzeDataset={reanalyzeDataset}
                  archiveDataset={archiveDataset}
                  setReplaceIndex={setReplaceIndex}
                  compareMode={compareMode}
                  setCompareMode={setCompareMode}
                  compareDsIndices={compareDsIndices}
                  setCompareDsIndices={setCompareDsIndices}
                />
              )}

              {active === 1 && (
                <EnterpriseFabric
                  warRoomMode={warRoomMode}
                  loadRelationalDemo={loadRelationalDemo}
                />
              )}

              {active === 2 && <DataProfiler dataset={dataset} analysis={analysis} />}

              {active === 3 && (
                <DataCleaner
                  dataset={dataset}
                  analysis={analysis}
                  workflowState={workflowState}
                  setWorkflowState={setWorkflowState}
                />
              )}

              {active === 4 && (
                <RelationalInsights
                  corrMatrix={corrMatrix}
                  datasets={datasets}
                  nexus={nexus}
                  multiRelational={multiRelational}
                  loadRelationalDemo={loadRelationalDemo}
                  industryMode={industryMode}
                  temporalEra={temporalEra}
                  warRoomMode={warRoomMode}
                />
              )}

              {active === 5 && (
                <Settings
                  anomalySensitivity={anomalySensitivity}
                  setAnomalySensitivity={setAnomalySensitivity}
                  profileSampleSize={profileSampleSize}
                  setProfileSampleSize={setProfileSampleSize}
                  industryMode={industryMode}
                  setIndustryMode={setIndustryMode}
                  immersiveMode={immersiveMode}
                  setImmersiveMode={setImmersiveMode}
                />
              )}
            </Suspense>
          </div>

          {/* Floating AI Orb Copilot */}
          <div className="orb-wrap" onClick={() => setChatOpen((o) => !o)}>
            <div className="orb">💬</div>
          </div>

          {/* Slide-in Chat Copilot */}
          <ChatPanel
            chatOpen={chatOpen}
            setChatOpen={setChatOpen}
            messages={messages}
            input={input}
            setInput={setInput}
            typing={typing}
            send={send}
            chatRef={chatRef}
          />

          {/* ⌘K Command Palette Overlay */}
          <CommandPalette
            palOpen={palOpen}
            setPalOpen={setPalOpen}
            palQ={palQ}
            setPalQ={setPalQ}
            palIdx={palIdx}
            setPalIdx={setPalIdx}
            runCommand={runCommand}
          />

           {/* Boardroom Presentation mode */}
          <PresentationMode
            present={present}
            setPresent={setPresent}
            slide={slide}
            setSlide={setSlide}
            slides={slides}
          />

          {/* Immersive 3D Space Overlay */}
          {immersiveMode && (
            <Suspense fallback={
              <div style={{
                position: 'fixed',
                inset: 0,
                background: '#030712',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366f1',
                zIndex: 9999,
                fontFamily: 'monospace',
                fontSize: 12,
                letterSpacing: '0.1em'
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  border: '2px solid #6366f1',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                INITIALIZING COGNITIVE MULTIVERSE SPACE...
              </div>
            }>
              <ImmersiveMode
                onClose={() => setImmersiveMode(false)}
                warRoomMode={warRoomMode}
              />
            </Suspense>
          )}

          {uploadPendingFile && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(3, 7, 18, 0.75)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: 24,
            }}>
              <div className="panel" style={{
                maxWidth: 480,
                width: '100%',
                padding: 28,
                border: '1px solid rgba(99, 102, 241, 0.25)',
                background: '#FFFFFF',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                textAlign: 'center',
                borderRadius: 16,
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                  Memory Ingestion Protocol
                </h3>
                <p style={{ fontSize: 13.5, color: '#4B5563', lineHeight: 1.5, marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
                  A dataset is already active in workspace memory. Choose how CORTEX should process the incoming information.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => {
                      analyzeFile(uploadPendingFile, true);
                      setUploadPendingFile(null);
                    }}
                    style={{
                      background: '#1F2937',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Analyze Independently (Reset Workspace)
                  </button>
                  <button
                    onClick={() => {
                      analyzeFile(uploadPendingFile, false);
                      setUploadPendingFile(null);
                    }}
                    style={{
                      background: '#4F46E5',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Merge with Existing Intelligence Graph
                  </button>
                  <button
                    onClick={() => setUploadPendingFile(null)}
                    style={{
                      background: 'transparent',
                      color: '#6B7280',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel Ingestion
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
