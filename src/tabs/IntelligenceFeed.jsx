import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Line,
  Bar,
} from 'recharts';
import { C, KPIS, INDUSTRY_LABELS, INDUSTRY_KPIS, TEMPORAL_KPIS, TEMPORAL_WEATHER, DEBATE_SCRIPT } from '../constants';
import ReasoningFeed from '../components/ReasoningFeed';
import { compareDatasets } from '../engine';

const GlassTooltip = ({ active, payload, label, isRealData, chartMetric }) => {
  if (!active || !payload || !payload.length) return null;
  const fmt = (v) => {
    if (!isRealData) return '$' + v + 'M';
    if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(2) + 'M';
    if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'K';
    return (+v).toFixed(2);
  };
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: '12px 16px',
        fontFamily: 'Inter, sans-serif',
        fontSize: 13.5,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ color: C.muted, fontWeight: 600, marginBottom: 6, fontSize: 12.5 }}>{label}</div>
      {payload
        .filter((p) => !Array.isArray(p.value) && p.value != null)
        .map((p, i) => (
          <div key={p.dataKey || p.name || i} style={{ color: p.stroke || p.fill || C.indigo, lineHeight: 1.8 }}>
            <span style={{ color: C.muted }}>{p.name}: </span>
            <span style={{ fontWeight: 600 }}>{fmt(p.value)}</span>
          </div>
        ))}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9', fontSize: 11.5, color: C.muted, maxWidth: 240, lineHeight: 1.35 }}>
        <b>Why this chart?</b> Selected because the dataset contains time-series {chartMetric ? `"${chartMetric.toLowerCase()}"` : 'volume'} trends.
      </div>
    </div>
  );
};

const kpiDeltas = {
  saas: [
    { text: '+8.4% MoM', good: true },
    { text: '+12.3% YoY', good: true },
    { text: '-2.1% scan', good: true },
    { text: '-18.4% delay', good: true }
  ],
  retail: [
    { text: '+14.2% GMV', good: true },
    { text: '+5.8% conv', good: true },
    { text: '+1.2% rate', good: false },
    { text: '+9.1% load', good: true }
  ],
  finance: [
    { text: '+22.4% vol', good: true },
    { text: '-0.8% margin', good: false },
    { text: '-14.2% fraud', good: true },
    { text: '+3.5% cap', good: true }
  ],
  logistics: [
    { text: '+3.2% flow', good: true },
    { text: '-12.4% delay', good: true },
    { text: '+1.5% cap', good: true },
    { text: 'SOC2 Valid', good: true }
  ]
};

export default function IntelligenceFeed({
  dataset,
  analyzing,
  stageStatus,
  PIPELINE,
  onDrop,
  dragOver,
  setDragOver,
  fileRef,
  analysis,
  setPresent,
  setSlide,
  dynamicChartData,
  forecastHorizon,
  setForecastHorizon,
  chart,
  alerts,
  setAlerts,
  whatIfScenarios,
  setWhatIfScenarios,
  selectedAnomaly,
  setSelectedAnomaly,
  dynamicAnomalies,
  nlqQuery,
  setNlqQuery,
  nlqOutput,
  setNlqOutput,
  chartView,
  setChartView,
  loadRelationalDemo,
  thoughts,
  setThoughts,
  industryMode,
  commentsFeed,
  setCommentsFeed,
  temporalEra,
  setTemporalEra,
  warRoomMode,
  setWarRoomMode,
  multiverseScenario,
  setMultiverseScenario,
  // Overhaul Props
  datasets,
  activeDs,
  setActiveDs,
  removeDataset,
  reanalyzeDataset,
  archiveDataset,
  setReplaceIndex,
  compareMode,
  setCompareMode,
  compareDsIndices,
  setCompareDsIndices,
}) {
  const [nlqInputVal, setNlqInputVal] = useState('');
  const [debateIndex, setDebateIndex] = useState(0);
  const [sidebarTab, setSidebarTab] = useState('strategy');

  // Auto-switch tab to warroom when war room mode is engaged
  useEffect(() => {
    if (warRoomMode) {
      setSidebarTab('warroom');
    } else if (sidebarTab === 'warroom') {
      setSidebarTab('strategy');
    }
  }, [warRoomMode]);

  /* Overhaul States & Handlers */
  const [managerExpanded, setManagerExpanded] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState({});

  const toggleEvidence = (key) => {
    setExpandedEvidence((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCompareCheck = (idx) => {
    setCompareDsIndices((prev) => {
      if (prev.includes(idx)) {
        return prev.map((x) => (x === idx ? null : x));
      }
      if (prev[0] === null) return [idx, prev[1]];
      if (prev[1] === null) return [prev[0], idx];
      return [prev[0], idx];
    });
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatNumber = (val) => {
    if (val === null || val === undefined || Number.isNaN(val)) return 'N/A';
    const a = Math.abs(val);
    if (a >= 1000000) return (val / 1000000).toFixed(2) + 'M';
    if (a >= 1000) return (val / 1000).toFixed(1) + 'K';
    return (+val).toFixed(2);
  };

  const compData = useMemo(() => {
    if (compareDsIndices[0] === null || compareDsIndices[1] === null) return null;
    const dsA = datasets[compareDsIndices[0]];
    const dsB = datasets[compareDsIndices[1]];
    if (!dsA || !dsB) return null;
    return compareDatasets(dsA, dsB);
  }, [datasets, compareDsIndices]);

  // 1. Calculate Data Trust metrics dynamically
  const trustMetrics = useMemo(() => {
    if (!analysis) return null;
    const completeness = 100 - Math.round(analysis.prof.columns.reduce((s, c) => s + c.missing, 0) / analysis.prof.columns.length);
    const duplicationRisk = analysis.qa.score > 90 ? 5 : analysis.qa.score < 60 ? 35 : 15;
    const accuracy = Math.round(analysis.qa.score);
    const consistency = Math.min(100, Math.round(analysis.qa.score + 5));
    const integrity = Math.round(analysis.qa.score);
    const freshness = 95; // default enterprise high standard
    return { completeness, duplicationRisk, accuracy, consistency, integrity, freshness };
  }, [analysis]);

  const trustScore = trustMetrics ? trustMetrics.integrity : 82;

  // 2. Dynamic KPIs responding to industryMode overrides
  const overriddenKpis = useMemo(() => {
    const mode = industryMode || 'saas';
    const labels = INDUSTRY_LABELS[mode] || INDUSTRY_LABELS.saas;
    
    if (temporalEra && temporalEra !== 'q2-2026') {
      const eraKpis = TEMPORAL_KPIS[temporalEra]?.[mode] || INDUSTRY_KPIS[mode] || INDUSTRY_KPIS.saas;
      return eraKpis.map((k, i) => {
        let fmtVal = '';
        const targetVal = k.target;
        if (mode === 'saas' || mode === 'retail' || mode === 'finance') {
          fmtVal = targetVal >= 1000000
            ? '$' + (targetVal / 1000000).toFixed(2) + 'M'
            : targetVal >= 1000
            ? '$' + (targetVal / 1000).toFixed(1) + 'K'
            : '$' + (+targetVal).toFixed(1);
        } else {
          if (i === 0) fmtVal = targetVal.toLocaleString() + ' tons';
          else if (i === 2) fmtVal = targetVal.toFixed(0) + ' hrs';
          else fmtVal = targetVal.toFixed(1) + '%';
        }
        return {
          label: labels[i % labels.length],
          value: fmtVal,
          mean: k.mean,
          kind: k.kind || 'AVG',
          color: k.color || ['#4F46E5', '#D97706', '#059669', '#DC2626'][i % 4]
        };
      });
    }

    const defaultKpis = analysis ? analysis.dash.kpis : KPIS;
    const mockKpis = INDUSTRY_KPIS[mode] || INDUSTRY_KPIS.saas;

    return defaultKpis.map((k, i) => {
      if (!analysis) {
        return mockKpis[i % mockKpis.length] || k;
      }
      
      const label = labels[i % labels.length];
      const targetVal = k.value;
      const meanVal = k.mean;

      // format values according to industry
      let fmtVal = '';
      if (mode === 'saas' || mode === 'retail' || mode === 'finance') {
        fmtVal = targetVal >= 1000000
          ? '$' + (targetVal / 1000000).toFixed(2) + 'M'
          : targetVal >= 1000
          ? '$' + (targetVal / 1000).toFixed(1) + 'K'
          : '$' + (+targetVal).toFixed(1);
      } else {
        // logistics/others
        if (i === 0) fmtVal = targetVal.toLocaleString() + ' tons';
        else if (i === 2) fmtVal = targetVal.toFixed(0) + ' hrs';
        else fmtVal = targetVal.toFixed(1) + '%';
      }

      return {
        label,
        value: fmtVal,
        mean: meanVal,
        kind: k.kind || 'AVG',
        color: ['#4F46E5', '#D97706', '#059669', '#DC2626'][i % 4]
      };
    });
  }, [analysis, industryMode, temporalEra]);

  // 3. Process NLQ Query locally
  const runNLQ = (qStr) => {
    setNlqQuery(qStr);
    const q = qStr.toLowerCase().trim();
    if (!q) {
      setNlqOutput(null);
      return;
    }

    setThoughts((prev) => [
      {
        id: Math.random(),
        text: `Query Agent: Processing search request "${qStr}"...`,
        type: 'QUERY',
        conf: 98,
        time: new Date().toLocaleTimeString('en-GB')
      },
      ...prev
    ].slice(0, 8));

    if (q.includes('predict') || q.includes('forecast') || q.includes('quarter') || q.includes('future')) {
      setForecastHorizon(10);
      setNlqOutput({
        title: 'AI PROJECTION INTERFACE ACTIVE',
        msg: `Extended forecasting horizon to 10 periods on "${analysis?.dash.chart?.metric || 'metric'}". Trendline recalculates simulation projections.`,
        type: 'success'
      });
    } else if (q.includes('decline') || q.includes('drop') || q.includes('down') || q.includes('revenue')) {
      setNlqOutput({
        title: 'VOLATILITY SWEEP INVESTIGATION',
        msg: 'Identified key drop parameters in APAC region. Recommended mitigation scenario: Shift Marketing slider to +25%.',
        type: 'info'
      });
    } else if (q.includes('churn') || q.includes('risk') || q.includes('dispute') || q.includes('fraud')) {
      setWhatIfScenarios((prev) => ({ ...prev, churn: 15 }));
      setNlqOutput({
        title: 'STRATEGIC CHURN SCENARIO ACTIVE',
        msg: 'Adjusted simulated Churn offset to +15% to evaluate risk exposure limits.',
        type: 'warning'
      });
    } else if (q.includes('compare') || q.includes('vs') || q.includes('region') || q.includes('apac')) {
      setNlqOutput({
        title: 'SEGMENT VOLUME ANALYSIS',
        msg: 'APAC region is highly correlated with support tickets delay hours (r = 0.72). AMER and EMEA remain structurally balanced.',
        type: 'info'
      });
    } else {
      setNlqOutput({
        title: 'SCHEMA QUERY RESULT',
        msg: `Found matching variables in "${dataset?.name || 'dataset'}". Values are plotted in the AI Visualization Studio.`,
        type: 'default'
      });
    }
  };

  // 4. Render dynamic Recharts types based on Selection
  const chartMetric = useMemo(() => {
    const mode = industryMode || 'saas';
    const labels = INDUSTRY_LABELS[mode] || INDUSTRY_LABELS.saas;
    return labels[0]; // first KPI label
  }, [industryMode]);

  const displayChartData = analysis && dynamicChartData ? dynamicChartData.data : chart;
  const visualRank = analysis?.visualRank;

  const rankedRationale = useMemo(() => {
    if (!visualRank) {
      return 'Lacks active dataset analysis to rank visualization alternatives.';
    }
    const activeType = chartView === 'recommended' ? (visualRank.best?.type || 'line') : chartView;
    const match = visualRank.all?.find((vr) => vr.type === activeType);
    return match ? match.rationale : 'Automatic visual template selection.';
  }, [visualRank, chartView]);

  const renderVisualSeries = () => {
    if (chartView === 'bar') {
      return (
        <>
          <Bar dataKey="hist" name="Historical" fill={C.indigo} radius={[3, 3, 0, 0]} barSize={24} />
          <Bar dataKey="fc" name="AI Forecast" fill={C.violet} radius={[3, 3, 0, 0]} barSize={24} />
        </>
      );
    }
    if (chartView === 'scatter') {
      return (
        <>
          <Line type="monotone" dataKey="hist" name="Historical" stroke="none" dot={{ r: 5, fill: C.indigo }} />
          <Line type="monotone" dataKey="fc" name="AI Forecast" stroke="none" dot={{ r: 5, fill: C.violet }} />
        </>
      );
    }
    if (chartView === 'area') {
      return (
        <>
          <Area type="monotone" dataKey="hist" name="Historical" fill={C.indigo} fillOpacity={0.15} stroke={C.indigo} strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="fc" name="AI Forecast" fill={C.violet} fillOpacity={0.1} stroke={C.violet} strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </>
      );
    }
    return (
      <>
        <Line type="monotone" dataKey="hist" name="Historical" stroke={C.indigo} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="fc" name="AI Forecast" stroke={C.violet} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 5 }} />
      </>
    );
  };

  // 5. Causal explanations for anomalies
  const getAnomalyTrace = (anom) => {
    if (!anom) return null;
    if (anom.dir === 'drop') {
      return {
        cause: 'Spike in logistics delays and shipping blockages in APAC ports.',
        impact: `Estimated metric leakage of $${(anom.value * 0.14).toFixed(0)} (14% drop in segment retention).`,
        similarity: 'Matches Q4 2025 winter warehouse overload event (92% correlation).',
        action: 'Deploy redundant shipping routes and initiate proactive refund vouchers for affected accounts.'
      };
    }
    return {
      cause: 'Promotional campaign conversion spike during end-of-quarter volume push.',
      impact: `Immediate incremental volume increase of $${(anom.value * 0.25).toFixed(0)} generated.`,
      similarity: 'Corresponds with Q2 2025 marketing campaign cycle (87% correlation).',
      action: 'Allocate load-balancing servers to handle checkout traffic and schedule post-purchase upsell campaigns.'
    };
  };

  const activeTrace = selectedAnomaly ? getAnomalyTrace(selectedAnomaly) : null;

  // 6. Dynamic Narrative text based on Industry mode
  const ceoSummaryText = useMemo(() => {
    if (temporalEra && temporalEra !== 'q2-2026') {
      if (temporalEra === 'q2-2024') {
        if (industryMode === 'saas') return "Q2 2024: APAC churn rates accelerated sharply, marking the beginning of the ARR contraction event. Churn rates peaked at a critical 12.4% average index.";
        if (industryMode === 'retail') return "Q2 2024: APAC GMV decreased by 5.2% due to returning order spikes. Customer refund rates surged to a critical 9.4% peak.";
        if (industryMode === 'finance') return "Q2 2024: Transaction volumes contract by 6.5%. APAC merchant chargeback volumes represent the primary risk exposure, with fraud rate spiking to 0.38%.";
        return "Q2 2024: APAC port delay hours spiked to 96 hours, causing route transit delays to increase by 48 hours.";
      }
      if (temporalEra === 'q4-2024') {
        if (industryMode === 'saas') return "Q4 2024: Customer churn rate stabilized at 5.6%, and LTV rose by $1.2K. Ingested data marks robust AMER contract renewals.";
        if (industryMode === 'retail') return "Q4 2024: Holiday shopping conversion rates spiked to 3.12%, pushing GMV value upward to $2.88M, though customer refund rates peaked at 7.2%.";
        if (industryMode === 'finance') return "Q4 2024: Transaction volume grew to $41.2M. Detected fraud rate fell to 0.18%, and liquidity risk limits stabilized at 24%.";
        return "Q4 2024: Fleet logistics load reached a critical 94.2% capacity during the holiday shipping surge, with port delays settling at 72 hours.";
      }
      if (temporalEra === 'q1-2025') {
        if (industryMode === 'saas') return "Q1 2025: MRR grew by +3.1%, ARR reached $13.4M, and customer churn rate remained flat at 4.8%.";
        if (industryMode === 'retail') return "Q1 2025: GMV declined by 8.5% post-holiday season. Conversion rates dropped to 2.24%.";
        if (industryMode === 'finance') return "Q1 2025: High-risk merchant dispute surge triggered liquidity risk scale anomalies. Detected fraud rate spiked to 0.48%, compressing net margins to 71.8%.";
        return "Q1 2025: Transit times remain stable, though minor schema discrepancies were detected across files.";
      }
    }
    
    if (!analysis) return '';
    const name = dataset.name;
    const count = dataset.rows.length;
    
    if (industryMode === 'saas') {
      return `The active SaaS dataset "${name}" profiles ${count.toLocaleString()} customer contract accounts with an overall Data Health index of ${trustScore}%. Projections suggest stable monthly contract ARR expansion, though APAC customer churn rates represent the primary revenue leak.`;
    }
    if (industryMode === 'retail') {
      return `The active Retail dataset "${name}" profiles ${count.toLocaleString()} order line items with a Gross Merchandise Value (GMV) Health index of ${trustScore}%. Projections suggest average order value (AOV) gains, though APAC shipping returns represent the primary GMV leakage.`;
    }
    if (industryMode === 'finance') {
      return `The active Finance dataset "${name}" profiles ${count.toLocaleString()} ledger entries with an overall Transaction integrity index of ${trustScore}%. Projections suggest stable transaction velocity margins, though APAC region merchant chargeback volumes represent the primary risk exposure.`;
    }
    return `The active Logistics dataset "${name}" profiles ${count.toLocaleString()} cargo shipments with an overall Route performance index of ${trustScore}%. Projections suggest stable tonnage movement load limits, though APAC port delays represent the primary operational bottleneck.`;
  }, [analysis, dataset, industryMode, trustScore, temporalEra]);

  const strategyBriefText = useMemo(() => {
    if (temporalEra && temporalEra !== 'q2-2026') {
      if (temporalEra === 'q2-2024') {
        if (industryMode === 'saas') return "Reduce APAC churn and lock in ARR. Redirection of 12% marketing spend to AMER acquisition is recommended to safeguard growth limits.";
        if (industryMode === 'retail') return "Audit APAC shipping returns channels. Implement customer loyalty campaigns to offset return rates.";
        if (industryMode === 'finance') return "Audit merchant ledger records. High chargeback risk requires tightening liquidity buffers.";
        return "Reroute incoming container vessels to AMER ports to bypass the 96-hour APAC harbor delay bottleneck.";
      }
      if (temporalEra === 'q4-2024') {
        if (industryMode === 'saas') return "Lock in customer renewals. Leverage high AMER lifetime value gains to upsell enterprise channels.";
        if (industryMode === 'retail') return "Manage checkout conversion gains. Pre-arrange shipping carriers to avoid refund backlogs.";
        if (industryMode === 'finance') return "Nominal liquidity limits. Expand transaction screening rules to keep fraud volumes low.";
        return "Deploy backup transport capacity to distribute holiday warehouse volumes and bypass ports.";
      }
      if (temporalEra === 'q1-2025') {
        if (industryMode === 'saas') return "Nominal stability. Reallocate resources to high-performing contract divisions.";
        if (industryMode === 'retail') return "Increase marketing budgets by 15% on high-conversion channels to counter post-holiday drop.";
        if (industryMode === 'finance') return "Activate emergency liquidity reserve buffers to cover merchant dispute risks.";
        return "Re-run schema normalization across logistics ingestion feeds.";
      }
    }
    
    if (industryMode === 'saas') {
      return 'Recommend reducing Churn risk to lock in ARR stability. Simulated What-If offsets indicate that a 15% reduction in Churn yields a +3.0% boost in overall customer LTV parameters. Reallocate marketing budgets toward AMER SaaS channels.';
    }
    if (industryMode === 'retail') {
      return 'Recommend optimizing checkout flows to raise transaction conversion rates. What-If offsets show that a 10% conversion boost offsets refund losses by 1.8x. Shift marketing focus from social ads to high-retention email campaign tracks.';
    }
    if (industryMode === 'finance') {
      return 'Recommend increasing capital adequacy buffers to hedge transaction risk exposure. What-If stress tests indicate a +12% marketing spend offset does not compensate for high chargeback rates. Implement strict automated merchant screening rules.';
    }
    return 'Recommend routing APAC container vessels to AMER ports to bypass shipping bottlenecks. Sandbox simulations show that logistics delay hour reductions of 15% reclaim 22 hours in average transit durations.';
  }, [industryMode, temporalEra]);

  if (compareMode && compData) {
    const dsA = datasets[compareDsIndices[0]];
    const dsB = datasets[compareDsIndices[1]];

    let growthDriver = null;
    let decliningSegment = null;
    if (compData.metrics && compData.metrics.length > 0) {
      const sortedByGrowth = [...compData.metrics].sort((a, b) => b.pctSum - a.pctSum);
      if (sortedByGrowth[0] && sortedByGrowth[0].pctSum > 0) {
        growthDriver = sortedByGrowth[0];
      }
      const sortedByDecline = [...compData.metrics].sort((a, b) => a.pctSum - b.pctSum);
      if (sortedByDecline[0] && sortedByDecline[0].pctSum < 0) {
        decliningSegment = sortedByDecline[0];
      }
    }

    return (
      <div className="cx-full" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>DATASET COMPARISON WORKBENCH</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                  Side-by-Side intelligence comparison between selected business models
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setCompareMode(false);
              setCompareDsIndices([null, null]);
            }}
            className="sim-btn"
            style={{ background: '#1F2937', color: '#FFF', padding: '10px 20px', fontSize: 13, fontWeight: 700 }}
          >
            Close Comparison Mode
          </button>
        </div>

        {/* Side-by-side Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.indigo, textTransform: 'uppercase' }}>Dataset A</span>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '4px 0 10px' }}>{dsA.name}</h4>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted }}>ROW COUNT</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{dsA.rows.length.toLocaleString()}</div>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: 16 }}>
                <div style={{ fontSize: 11, color: C.muted }}>COLUMN COUNT</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{dsA.fields.length}</div>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: 16 }}>
                <div style={{ fontSize: 11, color: C.muted }}>SOURCE TYPE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.indigo }}>{dsA.sourceType || 'CSV'}</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.violet, textTransform: 'uppercase' }}>Dataset B</span>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '4px 0 10px' }}>{dsB.name}</h4>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted }}>ROW COUNT</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{dsB.rows.length.toLocaleString()}</div>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: 16 }}>
                <div style={{ fontSize: 11, color: C.muted }}>COLUMN COUNT</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{dsB.fields.length}</div>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: 16 }}>
                <div style={{ fontSize: 11, color: C.muted }}>SOURCE TYPE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.violet }}>{dsB.sourceType || 'CSV'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Discrepancies summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📑</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Schema Alignment</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '6px 0 2px' }}>
              {compData.schema.commonCount} Shared Fields
            </div>
            <div style={{ fontSize: 11.5, color: C.muted }}>
              {compData.schema.onlyInA.length > 0 && `A unique: ${compData.schema.onlyInA.length}. `}
              {compData.schema.onlyInB.length > 0 && `B unique: ${compData.schema.onlyInB.length}.`}
              {compData.schema.onlyInA.length === 0 && compData.schema.onlyInB.length === 0 && 'Schemas match 100%'}
            </div>
            {compData.schema.onlyInA.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>
                Unique to A: {compData.schema.onlyInA.slice(0, 5).join(', ')}{compData.schema.onlyInA.length > 5 && '...'}
              </div>
            )}
            {compData.schema.onlyInB.length > 0 && (
              <div style={{ marginTop: 4, fontSize: 11, color: C.muted }}>
                Unique to B: {compData.schema.onlyInB.slice(0, 5).join(', ')}{compData.schema.onlyInB.length > 5 && '...'}
              </div>
            )}
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📈</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Trend Projections</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: compData.trends.changed ? C.amber : C.emerald, margin: '6px 0 2px', textTransform: 'uppercase' }}>
              {compData.trends.a} ➔ {compData.trends.b}
            </div>
            <div style={{ fontSize: 11.5, color: C.muted }}>
              {compData.trends.changed ? '🚨 Forecast trajectory has drifted!' : '✓ Baseline trend is consistent.'}
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>⚠️</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>Outlier Density Delta</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: compData.anomalies.diff > 0 ? C.red : C.emerald, margin: '6px 0 2px' }}>
              {compData.anomalies.diff > 0 ? `+${compData.anomalies.diff}` : compData.anomalies.diff} Anomalies
            </div>
            <div style={{ fontSize: 11.5, color: C.muted }}>
              Dataset A: {compData.anomalies.aCount} | Dataset B: {compData.anomalies.bCount}
            </div>
          </div>
        </div>

        {/* AI Executive Briefing box */}
        <div style={{
          background: '#EEF2FF',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.indigo, textTransform: 'uppercase', marginBottom: 12 }}>
            🧠 AI COMPARATIVE EXECUTIVE SYNTHESIS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
            {growthDriver && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span>📈</span>
                <span>
                  <b>Growth Driver Identified:</b> Sum of metric <b>"{growthDriver.name}"</b> increased by <b>{growthDriver.pctSum}%</b> (from {formatNumber(growthDriver.aSum)} to {formatNumber(growthDriver.bSum)}), representing the key expansion source.
                </span>
              </div>
            )}
            {decliningSegment && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span>📉</span>
                <span>
                  <b>Contraction Warnings:</b> Metric <b>"{decliningSegment.name}"</b> declined by <b>{decliningSegment.pctSum}%</b> (from {formatNumber(decliningSegment.aSum)} to {formatNumber(decliningSegment.bSum)}), representing a critical leakage segment.
                </span>
              </div>
            )}
            {compData.trends.changed && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span>🚨</span>
                <span>
                  <b>Trend Drift:</b> The chronological forecast trajectory altered from <b>{compData.trends.a.toUpperCase()}</b> to <b>{compData.trends.b.toUpperCase()}</b>, indicating structural model adjustments.
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <span>💡</span>
              <span>
                <b>Strategic Consensus Recommendation:</b> {compData.schema.onlyInA.length === 0 && compData.schema.onlyInB.length === 0 
                  ? 'Perfect schema alignment allows time-series concatenation. Recommend merging datasets to train high-confidence OLS forecasting layers.'
                  : `Schema variance detected. ${compData.schema.onlyInA.length} column(s) unique to A, and ${compData.schema.onlyInB.length} unique to B. Perform structural data cleansing before relational joins.`
                }
              </span>
            </div>
          </div>
        </div>

        {/* Metrics drift table */}
        <section className="panel" style={{ padding: 22 }}>
          <div className="panel-h" style={{ marginBottom: 18 }}>
            <div className="panel-title">METRIC DRIFT & VARIANCE ANALYSIS</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: C.muted, fontWeight: 700 }}>
                  <th style={{ padding: '10px 8px' }}>Numeric Variable</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Dataset A Mean</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Dataset B Mean</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Mean Delta (%)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Dataset A Sum</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Dataset B Sum</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Sum Delta (%)</th>
                </tr>
              </thead>
              <tbody>
                {compData.metrics.map((m) => (
                  <tr key={m.name} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0F172A' }}>{m.name}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(m.aMean)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(m.bMean)}</td>
                    <td style={{
                      padding: '12px 8px',
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: m.pctMean > 0 ? C.emerald : m.pctMean < 0 ? C.red : '#334155'
                    }}>
                      {m.pctMean > 0 ? `+${m.pctMean}%` : `${m.pctMean}%`}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(m.aSum)}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(m.bSum)}</td>
                    <td style={{
                      padding: '12px 8px',
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: m.pctSum > 0 ? C.emerald : m.pctSum < 0 ? C.red : '#334155'
                    }}>
                      {m.pctSum > 0 ? `+${m.pctSum}%` : `${m.pctSum}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="cx-full" style={{ width: '100%' }}>
      {/* Swarm Agents Status Top Bar */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          padding: '12px 18px',
          background: warRoomMode ? 'rgba(239, 68, 68, 0.04)' : '#FFFFFF',
          border: warRoomMode ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid #E2E8F0',
          borderRadius: 12,
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: warRoomMode ? '#EF4444' : C.muted, marginRight: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: warRoomMode ? '#EF4444' : '#059669',
            display: 'inline-block',
          }} />
          {warRoomMode ? 'ACTIVE SWARM COMMAND DETECTED' : 'ACTIVE COGNITIVE AGENTS (6)'}
        </div>
        {[
          { name: 'Relationship Agent', status: 'Mapping schemas', color: C.indigo },
          { name: 'Forecast Agent', status: 'Simulating trends', color: C.violet },
          { name: 'Risk Auditor', status: 'Scanning exposure', color: '#D97706' },
          { name: 'Fraud Officer', status: 'Tracking anomalies', color: '#EF4444' },
          { name: 'Governance Guardian', status: 'Auditing ledger', color: C.muted },
          { name: 'Stream Watcher', status: 'Broker active', color: '#059669' }
        ].map(ag => (
          <div
            key={ag.name}
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              background: warRoomMode ? '#1F0707' : '#F8FAFC',
              border: warRoomMode ? '1px solid #7F1D1D' : '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: ag.color }} />
            <span style={{ color: warRoomMode ? '#FECACA' : '#334155' }}>{ag.name}:</span>
            <span style={{ color: C.muted, fontSize: 11.5 }}>{ag.status}</span>
          </div>
        ))}
      </div>

      {/* Main Grid Workspace */}
      <div className="cx-2col">
        
        {/* Left Column (Data Workstation) */}
        <div className="cx-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Active Dataset Ingest / Selection Info */}
          {dataset && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>📂</span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>{dataset.name}</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>
                    {dataset.rows.length.toLocaleString()} rows · {dataset.fields.length} columns {analysis && `· Quality Integrity: ${analysis.qa.score}%`}
                  </div>
                </div>
              </div>
              {analysis && (
                <button
                  className="sim-btn"
                  onClick={() => {
                    setPresent(true);
                    setSlide(0);
                  }}
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  ▶ PRESENT SLIDEPACK
                </button>
              )}
            </div>
          )}

          {/* Dataset Lifecycle Manager Collapsible Panel */}
          {datasets.length > 0 && (
            <section className="panel" style={{ padding: 18, border: '1px solid #E2E8F0', borderRadius: 12 }}>
              <div
                onClick={() => setManagerExpanded(!managerExpanded)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📁</span>
                  <div>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>DATASET LIFECYCLE MANAGER</span>
                    <span style={{
                      marginLeft: 12,
                      fontSize: 11.5,
                      fontWeight: 700,
                      background: '#EEF2FF',
                      color: C.indigo,
                      padding: '3px 8px',
                      borderRadius: 6
                    }}>
                      {datasets.length} Active {datasets.length === 1 ? 'Dataset' : 'Datasets'}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: C.muted }}>{managerExpanded ? 'Collapse ▲' : 'Manage Datasets ▼'}</span>
              </div>

              {managerExpanded && (
                <div style={{ marginTop: 16, borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E2E8F0', color: C.muted, fontWeight: 600 }}>
                          <th style={{ padding: '8px 4px', textAlign: 'center' }}>Comp</th>
                          <th style={{ padding: '8px 8px' }}>Dataset Name</th>
                          <th style={{ padding: '8px 8px' }}>Upload Time</th>
                          <th style={{ padding: '8px 8px' }}>Rows × Cols</th>
                          <th style={{ padding: '8px 8px' }}>Size</th>
                          <th style={{ padding: '8px 8px' }}>Source</th>
                          <th style={{ padding: '8px 8px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datasets.map((ds, idx) => (
                          <tr
                            key={ds.id}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              background: idx === activeDs ? 'rgba(99, 102, 241, 0.04)' : ds.archived ? '#F8FAFC' : 'transparent',
                              opacity: ds.archived ? 0.6 : 1,
                            }}
                          >
                            <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={compareDsIndices.includes(idx)}
                                onChange={() => handleCompareCheck(idx)}
                                style={{ cursor: 'pointer', accentColor: C.indigo }}
                              />
                            </td>
                            <td style={{ padding: '10px 8px', fontWeight: 600, color: '#0F172A' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {idx === activeDs && <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.indigo }} />}
                                <span
                                  onClick={() => setActiveDs(idx)}
                                  style={{ cursor: 'pointer', textDecoration: idx === activeDs ? 'underline' : 'none' }}
                                >
                                  {ds.name}
                                </span>
                                {ds.archived && <span style={{ fontSize: 10, background: '#E2E8F0', padding: '1px 4px', borderRadius: 4, color: C.muted }}>ARCHIVED</span>}
                              </div>
                            </td>
                            <td style={{ padding: '10px 8px', color: C.muted }}>{ds.uploadTime || 'N/A'}</td>
                            <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>
                              {ds.rows.length} × {ds.fields.length}
                            </td>
                            <td style={{ padding: '10px 8px' }}>{formatBytes(ds.size)}</td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: ds.sourceType?.includes('MOCK') ? '#ECFDF5' : '#F1F5F9',
                                color: ds.sourceType?.includes('MOCK') ? '#059669' : '#334155'
                              }}>
                                {ds.sourceType}
                              </span>
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                  onClick={() => {
                                    setReplaceIndex(idx);
                                    fileRef.current && fileRef.current.click();
                                  }}
                                  style={{ background: 'none', border: 'none', color: C.indigo, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                                >
                                  Replace
                                </button>
                                <button
                                  onClick={() => reanalyzeDataset(idx)}
                                  style={{ background: 'none', border: 'none', color: C.violet, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                                >
                                  Re-analyze
                                </button>
                                <button
                                  onClick={() => archiveDataset(idx)}
                                  style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                                >
                                  {ds.archived ? 'Unarchive' : 'Archive'}
                                </button>
                                <button
                                  onClick={() => removeDataset(idx)}
                                  style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Compare Trigger Button */}
                  {compareDsIndices[0] !== null && compareDsIndices[1] !== null && (
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setCompareMode(true)}
                        className="sim-btn"
                        style={{ background: C.indigo, padding: '8px 16px', fontSize: 12.5 }}
                      >
                        ⚡ Compare Selected Datasets Side-by-Side
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Intake dropzone when empty */}
          {!dataset && !analyzing && (
            <section
              className={'dropzone' + (dragOver ? ' over' : '')}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current && fileRef.current.click()}
              style={{ padding: '85px 20px' }}
            >
              <div className="dz-empty">
                <div className="dz-ico" style={{ fontSize: 48, marginBottom: 12 }}>⤒</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                  Ingest Enterprise Dataset
                </div>
                <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
                  Drag & drop Excel (.xlsx, .xls) or CSV files here
                </div>
                <div style={{ marginTop: 26 }}>
                  <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 10 }}>Or load sample datasets to explore features:</div>
                  <button
                    className="sim-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadRelationalDemo();
                    }}
                    style={{ background: C.indigo }}
                  >
                    ⚡ Load Connected Demo Datasets
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Profiling status during upload */}
          {analyzing && (
            <section className="panel" style={{ padding: 22 }}>
              <div className="panel-h" style={{ marginBottom: 18 }}>
                <div className="panel-title">PROFILING SCHEMA STRUCTURE</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PIPELINE.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 14,
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      background: stageStatus[i] === 'active' ? '#EEF2FF' : '#FFFFFF',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: stageStatus[i] === 'done' ? C.emerald : '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: stageStatus[i] === 'done' ? C.emerald : stageStatus[i] === 'active' ? C.indigo : C.muted }} />
                      {p.agent}
                    </span>
                    <span style={{ fontSize: 12.5, color: C.muted }}>
                      {stageStatus[i] === 'done' ? '✓ Ingestion Complete' : stageStatus[i] === 'active' ? 'Scanning...' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dynamic Industry KPIs */}
          <div className="kpi-strip">
            {overriddenKpis.map((k, i) => {
              const deltaInfo = kpiDeltas[industryMode || 'saas']?.[i % 4];
              return (
                <div className="kpi" key={k.label + i} style={{ borderTop: `3px solid ${k.color || C.indigo}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 110, padding: 16 }}>
                  <div>
                    <div className="kpi-label" style={{ fontSize: 12, letterSpacing: '0.02em', color: C.muted }}>{k.label}</div>
                    <div className="kpi-val" style={{ fontSize: 26, fontWeight: 800, margin: '6px 0', color: '#0F172A' }}>{k.value}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>
                      Avg: {k.mean >= 1000000 ? (k.mean / 1000000).toFixed(1) + 'M' : k.mean >= 1000 ? (k.mean / 1000).toFixed(0) + 'K' : (+k.mean).toFixed(1)}
                    </span>
                    {deltaInfo && (
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: deltaInfo.good ? '#ECFDF5' : '#FEF2F2',
                        color: deltaInfo.good ? '#059669' : '#DC2626'
                      }}>
                        {deltaInfo.text}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Visualization Studio */}
          <section className="panel" style={{ padding: 22 }}>
            <div className="panel-h" style={{ marginBottom: 18 }}>
              <div>
                <div className="panel-title">VISUALIZATION ANALYTICS ENGINE</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                  Selected <b>{chartView === 'recommended' ? 'Automatic Line/Area' : chartView.toUpperCase()}</b> for {chartMetric}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {visualRank ? (
                  visualRank.all.slice(0, 5).map((vr) => {
                    const active = chartView === vr.type || (chartView === 'recommended' && vr.type === 'line');
                    return (
                      <button
                        key={vr.type}
                        onClick={() => setChartView(vr.type)}
                        style={{
                          fontSize: 12,
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid ' + (active ? C.indigo : '#E2E8F0'),
                          background: active ? '#EEF2FF' : '#FFF',
                          color: active ? C.indigo : C.muted,
                          cursor: 'pointer',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        {vr.label.split(' ')[0]}
                        <span style={{
                          fontSize: 10,
                          background: active ? C.indigo : '#F1F5F9',
                          color: active ? '#FFF' : C.muted,
                          padding: '1px 4px',
                          borderRadius: 4
                        }}>
                          {vr.score}%
                        </span>
                      </button>
                    );
                  })
                ) : (
                  ['recommended', 'area', 'bar', 'scatter'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setChartView(v)}
                      style={{
                        fontSize: 12,
                        padding: '5px 12px',
                        borderRadius: 6,
                        border: '1px solid ' + (chartView === v ? C.indigo : '#E2E8F0'),
                        background: chartView === v ? '#EEF2FF' : '#FFF',
                        color: chartView === v ? C.indigo : C.muted,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontWeight: 700
                      }}
                    >
                      {v}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', padding: 12 }}>
              {chartView === 'network' ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
                    NETWORK RELATIONSHIP MAPPING
                  </div>
                  {dataset && datasets.length >= 2 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {datasets.filter(d => d.id !== dataset.id).map((otherDs, idx) => (
                        <div key={idx} style={{
                          padding: 10,
                          borderRadius: 6,
                          border: '1px solid rgba(99, 102, 241, 0.15)',
                          background: 'rgba(99, 102, 241, 0.02)',
                          fontSize: 12.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <span style={{ fontWeight: 600, color: C.indigo }}>{dataset.name}</span>
                            <span style={{ color: C.muted, margin: '0 8px' }}>↔</span>
                            <span style={{ fontWeight: 600, color: C.violet }}>{otherDs.name}</span>
                            <span style={{ fontSize: 11, background: '#EEF2FF', color: C.indigo, marginLeft: 8, padding: '2px 6px', borderRadius: 4 }}>
                              one-to-many
                            </span>
                          </div>
                          <span style={{ fontWeight: 700, color: C.emerald }}>92% Confidence</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.muted }}>
                      <span>🔗 No active relational links mapped.</span>
                      <span style={{ fontSize: 11.5, marginTop: 4 }}>Load the demo datasets to connect multiple entity nodes.</span>
                    </div>
                  )}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={displayChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.indigo} stopOpacity={0.12} />
                        <stop offset="100%" stopColor={C.indigo} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey={analysis ? 'x' : 'm'}
                      tick={{ fill: C.muted, fontSize: 12, fontFamily: 'Inter' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: C.muted, fontSize: 12, fontFamily: 'Inter' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => {
                        if (analysis) {
                          if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                          if (Math.abs(v) >= 1000) return (v / 1000).toFixed(0) + 'K';
                          return (+v).toFixed(0);
                        }
                        return '$' + v + 'M';
                      }}
                      width={55}
                    />
                    <Tooltip content={<GlassTooltip isRealData={!!analysis} chartMetric={chartMetric} />} />
                    {analysis && analysis.dash.chart && (
                      <Area
                        type="monotone"
                        dataKey="band"
                        name="Confidence interval"
                        stroke="none"
                        fill={C.violet}
                        fillOpacity={0.06}
                      />
                    )}
                    {renderVisualSeries()}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{
              marginTop: 18,
              padding: '12px 16px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 13.5,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start'
            }}>
              <span style={{ color: C.indigo, fontSize: 16 }}>ℹ</span>
              <div style={{ color: C.muted, lineHeight: 1.45, textAlign: 'left' }}>
                <b>Chart selection rationale:</b> {rankedRationale}
              </div>
            </div>
          </section>

          {/* Forecast Multiverse Lab */}
          {analysis && (
            <section className="panel" style={{ padding: 22 }}>
              <div className="panel-h" style={{ marginBottom: 14 }}>
                <div>
                  <div className="panel-title">FORECAST MULTIVERSE LAB & SIMULATION</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    Recalculate future trajectories using real-time parameter multipliers.
                  </div>
                </div>
                <div style={{ fontSize: 12.5, background: '#EEF2FF', color: C.indigo, padding: '4px 10px', borderRadius: 12, fontWeight: 700 }}>
                  {analysis.dash.chart?.forecast?.confidence || 91}% confidence
                </div>
              </div>

              {/* Multiverse Buttons */}
              <div style={{ display: 'flex', gap: 8, margin: '10px 0 18px', flexWrap: 'wrap' }}>
                {[
                  { id: 'none', label: '📊 Base Trajectory' },
                  { id: 'recession', label: '📉 Recession (-25%)' },
                  { id: 'growth', label: '📈 Growth (+20%)' },
                  { id: 'collapse', label: '⚠️ Crash (-50%)' },
                  { id: 'ai', label: '🧠 AI Optimized (+35%)' }
                ].map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setMultiverseScenario(sc.id)}
                    style={{
                      fontSize: 12,
                      padding: '8px 14px',
                      background: multiverseScenario === sc.id ? (sc.id === 'collapse' ? '#DC2626' : (warRoomMode ? '#EF4444' : C.indigo)) : '#F1F5F9',
                      color: multiverseScenario === sc.id ? '#FFF' : '#334155',
                      border: '1px solid #E2E8F0',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 700,
                      transition: 'all 0.2s'
                    }}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>

              {/* Sliders Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Marketing</span>
                    <span style={{ color: C.indigo, fontWeight: 700 }}>{whatIfScenarios.marketing > 0 ? `+${whatIfScenarios.marketing}%` : `${whatIfScenarios.marketing}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={whatIfScenarios.marketing}
                    onChange={(e) => setWhatIfScenarios(prev => ({ ...prev, marketing: Number(e.target.value) }))}
                    style={{ accentColor: C.indigo, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 11.5, color: C.muted }}>Correlates with sales slope</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Churn Rate</span>
                    <span style={{ color: C.amber, fontWeight: 700 }}>{whatIfScenarios.churn > 0 ? `+${whatIfScenarios.churn}%` : `${whatIfScenarios.churn}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={whatIfScenarios.churn}
                    onChange={(e) => setWhatIfScenarios(prev => ({ ...prev, churn: Number(e.target.value) }))}
                    style={{ accentColor: C.amber, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 11.5, color: C.muted }}>Negatively hits metric trend</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>Friction</span>
                    <span style={{ color: C.emerald, fontWeight: 700 }}>{whatIfScenarios.logistics > 0 ? `+${whatIfScenarios.logistics}%` : `${whatIfScenarios.logistics}%`}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={whatIfScenarios.logistics}
                    onChange={(e) => setWhatIfScenarios(prev => ({ ...prev, logistics: Number(e.target.value) }))}
                    style={{ accentColor: C.emerald, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 11.5, color: C.muted }}>Affects pipeline delay limits</span>
                </div>
              </div>

              {/* Horizon Slider */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Adjust Forecast Horizon</span>
                  <span style={{ fontSize: 12.5, color: C.muted }}>Simulating {forecastHorizon} periods forward</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(Number(e.target.value))}
                  style={{ width: 140, accentColor: C.indigo, cursor: 'pointer' }}
                />
              </div>
            </section>
          )}
        </div>

        {/* Right Column (AI Swarm & Control Center - Tabbed Sidebar) */}
        <div className="cx-col" style={{ width: 420, flexShrink: 0 }}>
          <section className="panel" style={{ padding: 16, minHeight: 650, display: 'flex', flexDirection: 'column', borderColor: warRoomMode ? '#DC2626' : '#E2E8F0' }}>
            
            {/* Tab buttons */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 16 }}>
              {[
                { id: 'strategy', label: '🧠 Brief', color: C.indigo },
                { id: 'risk', label: '🛡️ Risk', color: C.amber },
                { id: 'swarm', label: '📡 Swarm', color: C.emerald },
                { id: 'warroom', label: '🚨 War Room', color: C.red }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSidebarTab(tab.id);
                    if (tab.id !== 'warroom' && warRoomMode) {
                      setWarRoomMode(false);
                    } else if (tab.id === 'warroom' && !warRoomMode) {
                      setWarRoomMode(true);
                      setDebateIndex(0);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 6px',
                    fontSize: 13.5,
                    fontWeight: 700,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: sidebarTab === tab.id ? `2.5px solid ${tab.color}` : '2.5px solid transparent',
                    color: sidebarTab === tab.id ? '#0F172A' : C.muted,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content wrapper */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* TAB 1: STRATEGY & NLQ BRIEF */}
              {sidebarTab === 'strategy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* NLQ Input Console */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        value={nlqInputVal}
                        onChange={(e) => setNlqInputVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') runNLQ(nlqInputVal); }}
                        placeholder="Ask anomalies, strategy..."
                        style={{
                          flex: 1,
                          border: '1px solid #E2E8F0',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 13.5,
                          outline: 'none',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      />
                      <button className="sim-btn" onClick={() => runNLQ(nlqInputVal)} style={{ padding: '8px 16px', fontSize: 13 }}>
                        ASK
                      </button>
                    </div>
                    {nlqOutput && (
                      <div style={{ padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 13.5, lineHeight: 1.45 }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{nlqOutput.title}</div>
                        <div style={{ color: C.muted }}>{nlqOutput.msg}</div>
                      </div>
                    )}
                  </div>

                  {/* AI Strategic Consultation */}
                  {/* AI Strategic Insights & Narrative Engine */}
                  {analysis && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 380, overflowY: 'auto', paddingRight: 4, textAlign: 'left' }}>
                      {analysis.insights.map((ins, idx) => {
                        const evidenceKey = `insight-${idx}`;
                        const isEvidenceExpanded = !!expandedEvidence[evidenceKey];
                        const confColor = ins.evidence.confidenceLevel === 'High' ? C.emerald : ins.evidence.confidenceLevel === 'Medium' ? C.indigo : C.amber;

                        return (
                          <div
                            key={idx}
                            style={{
                              padding: 12,
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: 10,
                              fontSize: 13.5,
                              lineHeight: 1.45,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: C.indigo, textTransform: 'uppercase' }}>
                                [{ins.cat}]
                              </span>
                              <span style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: confColor,
                                background: confColor + '10',
                                padding: '2px 6px',
                                borderRadius: 4
                              }}>
                                {ins.evidence.confidenceScore}% {ins.evidence.confidenceLevel}
                              </span>
                            </div>
                            <p style={{ color: '#0F172A', fontWeight: 600, margin: 0 }}>{ins.text}</p>
                            
                            {/* Evidence toggle link */}
                            <span
                              onClick={() => toggleEvidence(evidenceKey)}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: C.indigo,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                alignSelf: 'flex-start',
                                marginTop: 4
                              }}
                            >
                              {isEvidenceExpanded ? 'Hide Evidence Panel ▲' : 'Why this briefing exists? (Evidence Panel) ▼'}
                            </span>

                            {isEvidenceExpanded && (
                              <div style={{
                                borderTop: '1px solid #E2E8F0',
                                paddingTop: 8,
                                marginTop: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                fontSize: 11.5,
                                color: C.muted
                              }}>
                                <div><b>Methodology:</b> {ins.evidence.methodology}</div>
                                <div><b>Calculation:</b> <span style={{ fontFamily: 'monospace' }}>{ins.evidence.calculation}</span></div>
                                <div><b>Source Columns:</b> {ins.evidence.columns.map(c => `"${c}"`).join(', ')}</div>
                                <div><b>Sample Size:</b> {ins.evidence.supportingRowsCount.toLocaleString()} rows</div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* AI Recommendations */}
                      {analysis.recs && analysis.recs.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: 8 }}>
                            DYNAMIC RECOMMENDATIONS
                          </div>
                          {analysis.recs.map((rec, idx) => {
                            const evidenceKey = `rec-${idx}`;
                            const isEvidenceExpanded = !!expandedEvidence[evidenceKey];
                            const confColor = rec.level === 'High' ? C.emerald : rec.level === 'Medium' ? C.indigo : C.amber;

                            return (
                              <div
                                key={idx}
                                style={{
                                  padding: 12,
                                  background: '#FFF',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: 10,
                                  fontSize: 13.5,
                                  lineHeight: 1.45,
                                  marginBottom: 8,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 11.5, fontWeight: 700, color: C.emerald, textTransform: 'uppercase' }}>
                                    [ACTION PLAN]
                                  </span>
                                  <span style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: confColor,
                                    background: confColor + '10',
                                    padding: '2px 6px',
                                    borderRadius: 4
                                  }}>
                                    {rec.confidence}% {rec.level}
                                  </span>
                                </div>
                                <p style={{ color: '#334155', fontWeight: 600, margin: 0 }}>{rec.text}</p>
                                
                                <span
                                  onClick={() => toggleEvidence(evidenceKey)}
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: C.indigo,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    alignSelf: 'flex-start',
                                    marginTop: 4
                                  }}
                                >
                                  {isEvidenceExpanded ? 'Hide Evidence Panel ▲' : 'View Action Evidence (Audit Trail) ▼'}
                                </span>

                                {isEvidenceExpanded && (
                                  <div style={{
                                    borderTop: '1px solid #E2E8F0',
                                    paddingTop: 8,
                                    marginTop: 4,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 4,
                                    fontSize: 11.5,
                                    color: C.muted
                                  }}>
                                    <div><b>Methodology:</b> Target segment concentration & OLS trend projection</div>
                                    <div><b>Impacted Columns:</b> {rec.columns.map(c => `"${c}"`).join(', ') || 'Global'}</div>
                                    <div><b>Confidence Rating:</b> {rec.confidence}% ({rec.level})</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {!analysis && (
                    <div style={{ fontSize: 13.5, color: C.muted, textAlign: 'center', padding: '40px 10px' }}>
                      Load a dataset or load the demo to generate automated strategic briefs.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RISK, TRUST & ANOMALIES */}
              {sidebarTab === 'risk' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Data Trust Score Gauge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                      <svg width={56} height={56} viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="28" cy="28" r="24" fill="transparent" stroke="#E2E8F0" strokeWidth="4" />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="transparent"
                          stroke={trustScore > 85 ? C.emerald : trustScore > 65 ? C.indigo : C.red}
                          strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 * (1 - trustScore / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                        {trustScore}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>DATA TRUST MATRIX</div>
                      <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                        Schema validation, duplicate scans, and completeness.
                      </div>
                    </div>
                  </div>

                  {/* Anomaly Tracing List */}
                  {analysis && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>Anomaly Swaps & Traces</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {dynamicAnomalies.length > 0 ? (
                          dynamicAnomalies.map((an, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedAnomaly(an)}
                              style={{
                                padding: 10,
                                borderRadius: 6,
                                border: `1px solid ${selectedAnomaly?.index === an.index ? C.indigo : '#E2E8F0'}`,
                                background: selectedAnomaly?.index === an.index ? '#EEF2FF' : '#FFF',
                                cursor: 'pointer',
                                fontSize: 13,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <span>
                                <span style={{ fontWeight: 700, color: an.dir === 'spike' ? C.emerald : C.red, fontSize: 11, marginRight: 6 }}>
                                  {an.dir.toUpperCase()}
                                </span>
                                <span style={{ color: '#334155' }}>{an.label}</span>
                              </span>
                              <span style={{ fontFamily: 'monospace', color: C.muted, fontSize: 12 }}>z={an.z}</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: 12.5, color: C.emerald, padding: '4px 0' }}>✓ Zero outliers detected.</div>
                        )}
                      </div>

                      {/* Selected Trace Details Card */}
                      {selectedAnomaly && activeTrace && (
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <b style={{ color: '#0F172A', fontSize: 13 }}>Anomaly Root Cause</b>
                            <button onClick={() => setSelectedAnomaly(null)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>×</button>
                          </div>
                          <div><span style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>Cause:</span> {activeTrace.cause}</div>
                          <div><span style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>Impact:</span> <span style={{ color: C.red, fontWeight: 600 }}>{activeTrace.impact}</span></div>
                          <div><span style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>Historical Match:</span> {activeTrace.similarity}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Organizational Weather Map */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>Organizational Weather System</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {(TEMPORAL_WEATHER[temporalEra] || TEMPORAL_WEATHER['q2-2026']).map((w) => {
                        const isStorm = w.status.includes('Storm') || w.status.includes('Cyclone') || warRoomMode;
                        return (
                          <div key={w.div} style={{ background: '#F8FAFC', border: `1px solid ${isStorm ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: 6, padding: 8, fontSize: 12.5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: '#0F172A' }}>
                              <span>{w.div}</span>
                              <span>{warRoomMode && w.div !== 'Ingestion' ? '⛈️' : w.status.split(' ')[0]}</span>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: warRoomMode && w.div !== 'Ingestion' ? '#EF4444' : C.muted, marginTop: 4 }}>
                              {warRoomMode && w.div !== 'Ingestion' ? 'CRITICAL FRONT' : w.status}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Risk Cards Feed */}
                  {analysis && analysis.riskCards && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>
                        Active Operational Risks
                      </div>
                      {analysis.riskCards.map((risk, idx) => {
                        const evidenceKey = `risk-${idx}`;
                        const isEvidenceExpanded = !!expandedEvidence[evidenceKey];
                        const sevColor = risk.color || (risk.sev === 'HIGH' ? '#EF4444' : risk.sev === 'MEDIUM' ? '#D97706' : '#4F46E5');

                        return (
                          <div
                            key={idx}
                            style={{
                              padding: 12,
                              background: '#FFF',
                              border: `1px solid ${isEvidenceExpanded ? C.indigo : '#E2E8F0'}`,
                              borderRadius: 10,
                              fontSize: 13,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: sevColor,
                                background: sevColor + '10',
                                padding: '2px 6px',
                                borderRadius: 4
                              }}>
                                {risk.sev} RISK
                              </span>
                              <span style={{ fontSize: 11, color: C.muted }}>Source: {risk.src}</span>
                            </div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{risk.title}</div>
                            <div style={{ color: '#4B5563', fontSize: 12.5 }}><b>Mitigation:</b> {risk.rec}</div>
                            
                            <span
                              onClick={() => toggleEvidence(evidenceKey)}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: C.indigo,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                alignSelf: 'flex-start',
                                marginTop: 2
                              }}
                            >
                              {isEvidenceExpanded ? 'Hide Evidence Panel ▲' : 'Why this risk exists? (Evidence Panel) ▼'}
                            </span>

                            {isEvidenceExpanded && (
                              <div style={{
                                borderTop: '1px solid #E2E8F0',
                                paddingTop: 8,
                                marginTop: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                fontSize: 11.5,
                                color: C.muted
                              }}>
                                <div><b>Methodology:</b> {risk.evidence.methodology}</div>
                                <div><b>Calculation:</b> <span style={{ fontFamily: 'monospace' }}>{risk.evidence.calculation}</span></div>
                                <div><b>Source Columns:</b> {risk.evidence.columns.map(c => `"${c}"`).join(', ')}</div>
                                <div><b>Sample size:</b> {risk.evidence.supportingRowsCount.toLocaleString()} rows</div>
                                <div><b>Confidence:</b> {risk.evidence.confidenceScore}% ({risk.evidence.confidenceLevel})</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Data Quality Status alerts list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>Data Quality Status</div>
                    {alerts.map((al) => (
                      <div key={al.id} style={{ borderRadius: 6, padding: 10, background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#991B1B', fontSize: 13, textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: al.color, textTransform: 'uppercase' }}>{al.sev}</span>
                          <span onClick={() => setAlerts((as) => as.filter((x) => x.id !== al.id))} style={{ cursor: 'pointer', color: C.muted, fontSize: 16 }}>×</span>
                        </div>
                        <div style={{ fontWeight: 600 }}>{al.title}</div>
                        <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 2 }}>{al.rec}</div>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <div style={{ fontSize: 13, color: C.emerald }}>✓ No outstanding quality flags.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: COGNITIVE AGENTS & COLLABORATION */}
              {sidebarTab === 'swarm' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Reasoning thoughts feed */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>Autonomous Agents Swarm</div>
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 10, background: '#F8FAFC', maxHeight: 200, overflowY: 'auto' }}>
                      <ReasoningFeed thoughts={thoughts} chain={analysis ? ['SCAN SCHEMA', 'IMPUTE VALUES', 'CALCULATE CO-VARIANCE', 'GENERATE BRIEF'] : ['STANDBY']} />
                    </div>
                  </div>

                  {/* Active AI Agents List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>Swarm Services (6)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
                      {[
                        { name: 'Cleaning Agent', desc: 'Auto-fills numeric nulls & types', status: analysis ? 'done' : 'idle' },
                        { name: 'Forecast Agent', desc: 'Fits linear regression trends', status: analysis ? 'done' : 'idle' },
                        { name: 'Risk Agent', desc: 'Audits outliers and data leaks', status: analysis ? 'done' : 'idle' },
                        { name: 'Correlation Agent', desc: 'Traces cross-variable linkages', status: analysis ? 'done' : 'idle' },
                        { name: 'Visualization Agent', desc: 'Recommends chart styles', status: analysis ? 'done' : 'idle' },
                        { name: 'Reporting Agent', desc: 'Formulates brief narrative text', status: analysis ? 'done' : 'idle' }
                      ].map((ag, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ag.status === 'done' ? C.emerald : C.muted, marginTop: 5, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{ag.name}</div>
                            <div style={{ fontSize: 11.5, color: C.muted }}>{ag.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Collaboration annotations feed */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>Team Annotations</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
                      {commentsFeed.map((c) => (
                        <div key={c.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 8, fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{c.user}</span>
                            <span style={{ color: C.muted, fontSize: 11 }}>{c.time}</span>
                          </div>
                          <div style={{ color: '#334155', lineHeight: 1.35 }}>{c.text}</div>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add annotation..."
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 13,
                        outline: 'none',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          setCommentsFeed([
                            ...commentsFeed,
                            {
                              id: Date.now(),
                              user: 'You (Analyst)',
                              text: e.target.value.trim(),
                              time: new Date().toLocaleTimeString('en-GB').slice(0, 5)
                            }
                          ]);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: AI WAR ROOM TACTICAL SYSTEM */}
              {sidebarTab === 'warroom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* War Room Toggle Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>TACTICAL CONFLICT MODE</div>
                    <button
                      onClick={() => setWarRoomMode(!warRoomMode)}
                      className="sim-btn"
                      style={{ background: '#7F1D1D', color: '#FFF', fontSize: 12, padding: '5px 12px' }}
                    >
                      {warRoomMode ? 'DISENGAGE' : 'ENGAGE'}
                    </button>
                  </div>

                  {warRoomMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Threat Banner */}
                      <div style={{ background: '#450A0A', border: '1px solid #EF4444', borderRadius: 8, padding: 12, color: '#FECACA', fontSize: 13, lineHeight: 1.45 }}>
                        <strong style={{ color: '#EF4444', display: 'block', marginBottom: 2 }}>DOWNSTREAM THREAT ANOMALIES</strong>
                        Operational stress level spiked. Consensus models simulating mitigations.
                      </div>

                      {/* Swarm debate transcripts */}
                      <div style={{ border: '1px solid #7F1D1D', borderRadius: 8, background: '#120202', padding: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #7F1D1D', paddingBottom: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>Swarm Boardroom Simulation</span>
                          <button 
                            onClick={() => {
                              if (debateIndex < DEBATE_SCRIPT.length - 1) {
                                setDebateIndex(prev => prev + 1);
                              } else {
                                setDebateIndex(0);
                              }
                            }}
                            style={{ background: '#7F1D1D', border: 'none', borderRadius: 4, color: '#FFF', fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}
                          >
                            Step ➔
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
                          {DEBATE_SCRIPT.slice(0, debateIndex + 1).map((d, i) => (
                            <div key={i} style={{ fontSize: 12.5, borderLeft: `2px solid ${d.color}`, paddingLeft: 8 }}>
                              <strong style={{ color: d.color }}>{d.agent}: </strong>
                              <span style={{ color: '#FEE2E2' }}>{d.txt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Investigation Replay Progress */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Investigation Replay</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { label: 'INGEST', done: debateIndex >= 0 },
                            { label: 'OUTLIER', done: debateIndex >= 1 },
                            { label: 'CAUSAL', done: debateIndex >= 2 },
                            { label: 'DEBATE', done: debateIndex >= 4 },
                            { label: 'REPORT', done: debateIndex >= 5 }
                          ].map((step, idx) => (
                            <div
                              key={idx}
                              style={{
                                flex: 1,
                                background: step.done ? '#7F1D1D' : '#120202',
                                border: '1px solid #7F1D1D',
                                borderRadius: 4,
                                padding: '5px 0',
                                fontSize: 11,
                                textAlign: 'center',
                                color: step.done ? '#FFF' : '#FCA5A5',
                                fontWeight: 700
                              }}
                            >
                              {step.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '40px 10px' }}>
                      Click ENGAGE above to simulate emergency diagnostic board debate.
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Global Temporal Timeline (Cinema Scrubber at Bottom) */}
      <section className="panel" style={{ padding: '16px 20px', marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="panel-title">🕰️ TEMPORAL INTELLIGENCE HISTORICAL SCANNER</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>
              Scrub temporal dimensions to morph the organization state live.
            </div>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.indigo, background: '#EEF2FF', padding: '4px 10px', borderRadius: 6 }}>
            Temporal Coordinates: <span style={{ textTransform: 'uppercase' }}>{temporalEra.replace('-', ' ')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            value={['q2-2024', 'q4-2024', 'q1-2025', 'q2-2026'].indexOf(temporalEra)}
            onChange={(e) => {
              const eras = ['q2-2024', 'q4-2024', 'q1-2025', 'q2-2026'];
              const era = eras[Number(e.target.value)];
              setTemporalEra(era);
              
              setThoughts((prev) => [
                {
                  id: Math.random(),
                  text: `Temporal Agent: Morphed organization coordinates to ${era.toUpperCase()}.`,
                  type: 'TEMPORAL',
                  conf: 99,
                  time: new Date().toLocaleTimeString('en-GB')
                },
                ...prev
              ].slice(0, 8));
            }}
            style={{ width: '100%', accentColor: C.indigo, cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: C.muted }}>
            <span>Q2 2024 (APAC Churn)</span>
            <span>Q4 2024 (Returns Peak)</span>
            <span>Q1 2025 (Dispute / Fraud)</span>
            <span>Q2 2026 (Nominal Future)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
