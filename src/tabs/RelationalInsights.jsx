import React, { useState, useMemo } from 'react';
import { C } from '../constants';

export default function RelationalInsights({ corrMatrix, datasets, nexus, multiRelational, loadRelationalDemo, industryMode, temporalEra, warRoomMode }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedRel, setSelectedRel] = useState(null);
  const [activeCausalChain, setActiveCausalChain] = useState(null); // 'apac_revenue' | 'fraud_risk' | null
  
  // Investigation Replay Stepper State
  const [replayStep, setReplayStep] = useState(0);

  // 1. Single dataset collinearity scanner calculations
  const collinearPairs = useMemo(() => {
    if (!corrMatrix || !corrMatrix.cols || !corrMatrix.matrix) return [];
    const pairs = [];
    const n = corrMatrix.cols.length;
    for (let r = 0; r < n; r++) {
      for (let c = r + 1; c < n; c++) {
        const val = corrMatrix.matrix[r][c];
        if (Math.abs(val) > 0.95) {
          pairs.push({
            colA: corrMatrix.cols[r],
            colB: corrMatrix.cols[c],
            r: val,
          });
        }
      }
    }
    return pairs;
  }, [corrMatrix]);

  // SVG dimensions for the Knowledge Graph
  const graphWidth = 560;
  const graphHeight = 320;

  // 2. Define coordinates and layout for our Relational Demo Knowledge Graph
  // Reacts to temporalEra for visual properties (e.g. node size, border color)
  const graphData = useMemo(() => {
    if (!datasets || datasets.length < 2) return null;

    // Temporal size parameters
    const sizeMap = {
      'ds-customers': { size: 26, color: C.indigo },
      'ds-transactions': {
        size: temporalEra === 'q2-2024' ? 32 : 26,
        color: temporalEra === 'q2-2024' ? '#EF4444' : C.violet
      },
      'ds-tickets': {
        size: temporalEra === 'q1-2025' ? 32 : 26,
        color: temporalEra === 'q1-2025' ? '#D97706' : C.emerald
      },
      'col-cust-id': { size: 16, color: '#FFFFFF', border: C.indigo },
      'col-tx-amount': { size: 14, color: '#FFFFFF', border: C.violet },
      'col-tkt-delay': {
        size: temporalEra === 'q2-2024' ? 22 : 14,
        color: '#FFFFFF',
        border: temporalEra === 'q2-2024' ? '#EF4444' : C.emerald
      },
      'col-tkt-refund': { size: 14, color: '#FFFFFF', border: C.emerald }
    };

    // Nodes
    const nodes = [
      { id: 'ds-customers', type: 'dataset', label: 'Customers', x: 280, y: 60, size: sizeMap['ds-customers'].size, color: sizeMap['ds-customers'].color, rows: '7 records' },
      { id: 'ds-transactions', type: 'dataset', label: 'Transactions', x: 100, y: 140, size: sizeMap['ds-transactions'].size, color: sizeMap['ds-transactions'].color, rows: '10 records' },
      { id: 'ds-tickets', type: 'dataset', label: 'Support Tickets', x: 460, y: 140, size: sizeMap['ds-tickets'].size, color: sizeMap['ds-tickets'].color, rows: '7 records' },

      // Key Columns nodes
      { id: 'col-cust-id', type: 'key', label: 'customer_id', x: 280, y: 150, size: sizeMap['col-cust-id'].size, color: sizeMap['col-cust-id'].color, border: sizeMap['col-cust-id'].border, desc: 'Primary Key linking all tables.' },
      { id: 'col-tx-amount', type: 'measure', label: 'amount', x: 80, y: 240, size: sizeMap['col-tx-amount'].size, color: sizeMap['col-tx-amount'].color, border: sizeMap['col-tx-amount'].border, desc: 'Transaction volume in USD.' },
      { id: 'col-tkt-delay', type: 'measure', label: 'delay_hours', x: 420, y: 240, size: sizeMap['col-tkt-delay'].size, color: sizeMap['col-tkt-delay'].color, border: sizeMap['col-tkt-delay'].border, desc: 'Support delay duration.' },
      { id: 'col-tkt-refund', type: 'measure', label: 'refunds_issued', x: 500, y: 240, size: sizeMap['col-tkt-refund'].size, color: sizeMap['col-tkt-refund'].color, border: sizeMap['col-tkt-refund'].border, desc: 'Issued refund amounts.' }
    ];

    // Connective Edges
    const edges = [
      { from: 'ds-customers', to: 'col-cust-id', type: 'schema', dash: false },
      { from: 'ds-transactions', to: 'col-cust-id', type: 'relationship', label: 'FK (96% conf)', dash: true },
      { from: 'ds-tickets', to: 'col-cust-id', type: 'relationship', label: 'FK (94% conf)', dash: true },
      { from: 'ds-transactions', to: 'col-tx-amount', type: 'schema', dash: false },
      { from: 'ds-tickets', to: 'col-tkt-delay', type: 'schema', dash: false },
      { from: 'ds-tickets', to: 'col-tkt-refund', type: 'schema', dash: false }
    ];

    return { nodes, edges };
  }, [datasets, temporalEra]);

  // Causal Chain nodes
  const causalChainSteps = {
    apac_revenue: [
      { id: 'c1', label: 'APAC Revenue Drop', x: 60, y: 160 },
      { id: 'c2', label: 'Refund Spikes', x: 170, y: 160 },
      { id: 'c3', label: 'Support Delays', x: 280, y: 160 },
      { id: 'c4', label: 'Logistics Issues', x: 390, y: 160 },
      { id: 'c5', label: 'Warehouse Overload', x: 500, y: 160 }
    ]
  };

  const currentCausalSteps = activeCausalChain ? causalChainSteps[activeCausalChain] : null;

  // AI Investigation Replay Console steps descriptions
  const replaySteps = [
    { title: 'Schema Ingestion Check', desc: 'Ingestion sweep detected a 94% Jaccard value overlap on primary column customer_id across Customers, Support, and Transactions.', node: 'col-cust-id' },
    { title: 'Trace Support Tickets', desc: 'Flagged support_tickets containing a massive Port Delay anomaly (96 hours delay) in APAC region.', node: 'col-tkt-delay' },
    { title: 'Correlate Refunds', desc: 'Causal link isolated $1,500 refunds issued directly matching the logistics delays.', node: 'col-tkt-refund' },
    { title: 'Downstream Revenue Impact', desc: 'Identified transaction volumes fell by 12% in the APAC segment.', node: 'ds-transactions' }
  ];

  return (
    <div className="cx-2col">
      <div className="cx-col">
        {/* If only 1 dataset is uploaded, show the CTA to load the Relational Demo */}
        {(!datasets || datasets.length < 2) && (
          <section className="panel" style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔗</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
              Multi-Dataset Relational Intelligence Engine
            </div>
            <p style={{ fontSize: 13, color: C.muted, maxWidth: 480, margin: '0 auto 16px', lineHeight: 1.5 }}>
              Enterprise intelligence unlocks when multiple files are loaded. CORTEX automatically maps foreign key overlaps, traces anomalous dependencies, and builds an interactive Knowledge Graph across tables.
            </p>
            <button className="sim-btn" onClick={loadRelationalDemo} style={{ background: C.indigo }}>
              ⚡ Load Enterprise Demo Schema (3 Tables)
            </button>
          </section>
        )}

        {/* Enterprise Knowledge Graph Canvas */}
        {datasets && datasets.length >= 2 && graphData && (
          <section className="panel" style={{ padding: 18 }}>
            <div className="panel-h">
              <div>
                <div className="panel-title">ENTERPRISE KNOWLEDGE GRAPH</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  Nodes update with timeline. Click nodes to inspect metadata.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => {
                    setActiveCausalChain(prev => prev === 'apac_revenue' ? null : 'apac_revenue');
                    setSelectedNode(null);
                    setSelectedRel(null);
                  }}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid ' + (activeCausalChain === 'apac_revenue' ? C.indigo : '#E2E8F0'),
                    background: activeCausalChain === 'apac_revenue' ? '#EEF2FF' : '#FFF',
                    color: activeCausalChain === 'apac_revenue' ? C.indigo : C.muted,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {activeCausalChain === 'apac_revenue' ? '✕ Close Chain' : '🔗 Trace APAC Revenue Drop'}
                </button>
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                overflow: 'hidden',
                height: graphHeight,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="100%" height="100%" viewBox={`0 0 ${graphWidth} ${graphHeight}`}>
                <defs>
                  {/* Arrow markers for edges */}
                  <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
                  </marker>
                  <marker id="arrow-causal" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={C.indigo} />
                  </marker>
                  <style>{`
                    @keyframes dashMove {
                      to {
                        stroke-dashoffset: -10;
                      }
                    }
                  `}</style>
                </defs>

                {!activeCausalChain ? (
                  // STANDARD KNOWLEDGE GRAPH LAYOUT
                  <>
                    {/* Render Edges */}
                    {graphData.edges.map((ed, idx) => {
                      const fromNode = graphData.nodes.find(n => n.id === ed.from);
                      const toNode = graphData.nodes.find(n => n.id === ed.to);
                      if (!fromNode || !toNode) return null;
                      return (
                        <g key={idx} onClick={() => ed.type === 'relationship' && setSelectedRel(ed)} style={{ cursor: ed.type === 'relationship' ? 'pointer' : 'default' }}>
                          <line
                            x1={fromNode.x}
                            y1={fromNode.y}
                            x2={toNode.x}
                            y2={toNode.y}
                            stroke={warRoomMode ? '#EF4444' : (ed.type === 'relationship' ? C.indigo : '#CBD5E1')}
                            strokeWidth={warRoomMode ? 2 : (ed.type === 'relationship' ? 1.5 : 1)}
                            strokeDasharray={warRoomMode || ed.dash ? '5 5' : '0'}
                            markerEnd="url(#arrow)"
                            style={{ animation: warRoomMode ? 'dashMove 1s linear infinite' : 'none' }}
                          />
                          {ed.label && (
                            <text
                              x={(fromNode.x + toNode.x) / 2}
                              y={(fromNode.y + toNode.y) / 2 - 6}
                              textAnchor="middle"
                              fontSize="9.5"
                              fontWeight="600"
                              fill={C.indigo}
                              style={{ background: '#F8FAFC', padding: '1px 3px' }}
                            >
                              {ed.label}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Render Nodes */}
                    {graphData.nodes.map((n) => {
                      // Highlight node if selected in replay stepper
                      const isReplayHighlight = replaySteps[replayStep]?.node === n.id;
                      const isSel = selectedNode?.id === n.id || isReplayHighlight;

                      return (
                        <g key={n.id} transform={`translate(${n.x}, ${n.y})`} onClick={() => { setSelectedNode(n); setSelectedRel(null); }} style={{ cursor: 'pointer' }}>
                          <circle
                            r={n.size}
                            fill={n.type === 'dataset' ? n.color : '#FFFFFF'}
                            stroke={isReplayHighlight ? '#EF4444' : (n.type === 'dataset' ? 'none' : n.border)}
                            strokeWidth={n.type === 'dataset' ? (isReplayHighlight ? 3.5 : 0) : 2.5}
                            style={{
                              filter: isSel ? 'drop-shadow(0 0 8px rgba(79,70,229,0.5))' : 'none',
                              transition: 'all 0.2s',
                              animation: isReplayHighlight ? 'pulseGlow 1s infinite alternate' : 'none'
                            }}
                          />
                          <text
                            textAnchor="middle"
                            y={n.type === 'dataset' ? 4 : 26}
                            fill={n.type === 'dataset' ? '#FFFFFF' : '#0F172A'}
                            fontSize={n.type === 'dataset' ? '11' : '10.5'}
                            fontWeight={700}
                          >
                            {n.label}
                          </text>
                          {n.type === 'dataset' && (
                            <text
                              textAnchor="middle"
                              y={13}
                              fill="rgba(255,255,255,0.75)"
                              fontSize="8"
                              fontWeight="500"
                            >
                              {n.rows.split(' ')[0]} rows
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </>
                ) : (
                  // ANIMATED CAUSAL CHAIN TRACE LAYOUT
                  <>
                    {/* Connections */}
                    {currentCausalSteps.map((s, idx) => {
                      if (idx === 0) return null;
                      const prev = currentCausalSteps[idx - 1];
                      return (
                        <g key={idx}>
                          <line
                            x1={prev.x}
                            y1={prev.y}
                            x2={s.x}
                            y2={s.y}
                            stroke={C.indigo}
                            strokeWidth="2"
                            strokeDasharray="6 4"
                            markerEnd="url(#arrow-causal)"
                            style={{ animation: 'dashMove 1s linear infinite' }}
                          />
                        </g>
                      );
                    })}

                    {/* Step Nodes */}
                    {currentCausalSteps.map((s, idx) => (
                      <g key={s.id} transform={`translate(${s.x}, ${s.y})`}>
                        <circle
                          r="18"
                          fill={idx === 0 ? C.red : idx === currentCausalSteps.length - 1 ? C.emerald : '#FFFFFF'}
                          stroke={C.indigo}
                          strokeWidth="2.5"
                        />
                        <text
                          textAnchor="middle"
                          y={idx % 2 === 0 ? -26 : 32}
                          fontSize="10"
                          fontWeight="700"
                          fill="#0F172A"
                        >
                          {s.label}
                        </text>
                        <text
                          textAnchor="middle"
                          y="4.5"
                          fontSize="10"
                          fontWeight="700"
                          fill={idx === 0 || idx === currentCausalSteps.length - 1 ? '#FFFFFF' : C.indigo}
                        >
                          {idx + 1}
                        </text>
                      </g>
                    ))}
                  </>
                )}
              </svg>
            </div>
          </section>
        )}

        {/* Pearson Metric correlation Heatmap */}
        {corrMatrix && corrMatrix.columns && corrMatrix.columns.length > 0 ? (
          <section className="panel" style={{ padding: 18 }}>
            <div className="panel-title" style={{ marginBottom: 12 }}>PEARSON METRIC CORRELATION HEATMAP</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `120px repeat(${corrMatrix.columns.length}, 1fr)`,
                gap: 4,
                overflowX: 'auto',
                paddingBottom: 10,
              }}
            >
              <div />
              {corrMatrix.columns.map((col) => (
                <div key={col} className="corr-label" title={col} style={{ fontSize: 9.5 }}>
                  {col.slice(0, 10)}
                </div>
              ))}
              {corrMatrix.columns.map((rowCol, rIdx) => (
                <React.Fragment key={rowCol}>
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#0F172A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={rowCol}
                  >
                    {rowCol.slice(0, 14)}
                  </div>
                  {corrMatrix.columns.map((col, cIdx) => {
                    const valPair = corrMatrix.pairs.find(p => (p.colA === rowCol && p.colB === col) || (p.colA === col && p.colB === rowCol));
                    const val = rowCol === col ? 1.0 : (valPair ? valPair.r : 0.0);
                    const abs = Math.abs(val);
                    const color = val > 0 ? `rgba(5,150,105,${abs * 0.7})` : `rgba(220,38,38,${abs * 0.7})`;
                    return (
                      <div
                        key={col}
                        className="corr-cell"
                        style={{
                          background: color || '#F1F5F9',
                          color: abs > 0.4 ? '#FFFFFF' : '#0F172A',
                          border: '1px solid #E2E8F0',
                          fontSize: 10
                        }}
                        title={`${rowCol} ↔ ${col}: ${val.toFixed(3)}`}
                      >
                        {val.toFixed(1)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </section>
        ) : (
          <section className="panel" style={{ textAlign: 'center', padding: '40px 10px', color: C.muted }}>
            No numeric column matrices found to correlate.
          </section>
        )}
      </div>

      <div className="cx-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* AI Investigation Replay Engine */}
        {datasets && datasets.length >= 2 && (
          <section className="panel" style={{ padding: 18 }}>
            <div className="panel-title" style={{ marginBottom: 4 }}>🧠 AI INVESTIGATION REPLAY CONSOLE</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
              Playback the exact chronological reasoning paths CORTEX utilized to detect anomalies.
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: C.indigo, letterSpacing: '0.5px' }}>
                  REPLAY STEP {replayStep + 1} OF {replaySteps.length}
                </span>
                <span style={{ fontSize: 10, background: '#EEF2FF', color: C.indigo, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                  {replaySteps[replayStep]?.title}
                </span>
              </div>
              
              <p style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.45, minHeight: 45 }}>
                {replaySteps[replayStep]?.desc}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                <button
                  onClick={() => setReplayStep(p => Math.max(0, p - 1))}
                  disabled={replayStep === 0}
                  className="sim-btn"
                  style={{ fontSize: 10, padding: '3px 8px', background: replayStep === 0 ? '#CBD5E1' : C.indigo }}
                >
                  ◀ Previous
                </button>
                <button
                  onClick={() => setReplayStep(p => Math.min(replaySteps.length - 1, p + 1))}
                  disabled={replayStep === replaySteps.length - 1}
                  className="sim-btn"
                  style={{ fontSize: 10, padding: '3px 8px', background: replayStep === replaySteps.length - 1 ? '#CBD5E1' : C.indigo }}
                >
                  Next ▶
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Knowledge Graph / Causal Detail Panel */}
        {datasets && datasets.length >= 2 && (
          <section className="panel" style={{ padding: 18, minHeight: 180 }}>
            <div className="panel-title" style={{ marginBottom: 10 }}>RELATIONAL TRACE CONSOLE</div>

            {selectedNode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.indigo, textTransform: 'uppercase' }}>
                    {selectedNode.type} Node Info
                  </span>
                  <button onClick={() => setSelectedNode(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.muted, fontSize: 14 }}>✕</button>
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{selectedNode.label}</h4>
                  <p style={{ fontSize: 11.5, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>
                    {selectedNode.type === 'dataset'
                      ? `Ingested relational database table holding ${selectedNode.rows}. Represents unique business structures.`
                      : selectedNode.desc}
                  </p>
                </div>
              </div>
            )}

            {selectedRel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: C.indigo, textTransform: 'uppercase' }}>
                    Relationship Link
                  </span>
                  <button onClick={() => setSelectedRel(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.muted, fontSize: 14 }}>✕</button>
                </div>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                    {selectedRel.from.replace('ds-', '').toUpperCase()} ↔ {selectedRel.to.replace('col-', '').toUpperCase()}
                  </h4>
                  <p style={{ fontSize: 11.5, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>
                    Foreign key relationship mapping detected automatically. The child records contain references pointing to the primary unique index column.
                  </p>
                </div>
              </div>
            )}

            {activeCausalChain === 'apac_revenue' && !selectedNode && !selectedRel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                  Causal Path Analysis
                </span>
                <div style={{ borderLeft: `3px solid ${C.indigo}`, paddingLeft: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <b style={{ fontSize: 11, color: '#0F172A' }}>1. APAC Port Instability</b>
                    <p style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>Logistics delay hours average spikes to 96 hours on transactions.</p>
                  </div>
                  <div>
                    <b style={{ fontSize: 11, color: '#0F172A' }}>2. Support Delays Ticket Spikes</b>
                    <p style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>Escalated dispute rates increase by 24% for APAC region.</p>
                  </div>
                </div>
              </div>
            )}

            {!selectedNode && !selectedRel && !activeCausalChain && (
              <div style={{ textAlign: 'center', padding: '30px 10px', fontSize: 11.5, color: C.muted }}>
                Click nodes or run causal tracing on the Knowledge Graph canvas to investigate dependencies.
              </div>
            )}
          </section>
        )}

        {/* Organizational Memory System */}
        {datasets && datasets.length >= 2 && (
          <section className="panel" style={{ padding: 18 }}>
            <div className="panel-title" style={{ marginBottom: 10 }}>🧠 ORGANIZATIONAL MEMORY SWEEP</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  padding: 10,
                  background: '#EEF2FF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 11.5
                }}
              >
                <div style={{ display: 'flex', justify: 'space-between', marginBottom: 4, fontWeight: 700, color: C.indigo }}>
                  <span>HISTORICAL PATTERN MATCH</span>
                  <span style={{ float: 'right' }}>86% Correlation</span>
                </div>
                <div style={{ color: '#334155', lineHeight: 1.4 }}>
                  {industryMode === 'saas' && "Matches the Q2 2024 logistics bottleneck event, which preceded a severe APAC client churn spike in Q3 2024."}
                  {industryMode === 'retail' && "Matches the Q4 2024 holiday returns congestion event, which led to a 4.1% margin drop in the following quarter."}
                  {industryMode === 'finance' && "Matches the Q1 2025 high-risk merchant dispute surge, which triggered automated liquidity buffers."}
                  {industryMode === 'logistics' && "Matches the Q3 2025 warehouse overload bottleneck, causing route transit delays to increase by 18 hours."}
                </div>
              </div>
              
              <div style={{ fontSize: 10.5, color: C.muted, borderLeft: `2px solid ${C.indigo}`, paddingLeft: 8, lineHeight: 1.4 }}>
                <strong style={{ color: '#0F172A', display: 'block', marginBottom: 2 }}>Pre-emptive Cautionary Warning:</strong>
                {industryMode === 'saas' && "Audit customer support delay hours. High delays are leading indicators of contract cancellations."}
                {industryMode === 'retail' && "Pre-arrange carrier loads for APAC channels to handle increased refund returns."}
                {industryMode === 'finance' && "Enable stricter merchant authentication checks for segments exceeding $10K transactions."}
                {industryMode === 'logistics' && "Reroute incoming shipments to backup container hubs before delays cross 48 hours."}
              </div>
            </div>
          </section>
        )}

        {/* Collinearity and Leakage Scanner */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-title" style={{ marginBottom: 10 }}>🚨 DATA LEAKAGE & COLLINEARITY SCANNER</div>
          
          <div style={{ padding: '8px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 11, color: C.muted, lineHeight: 1.4, marginBottom: 12 }}>
            Multicollinearity indicates **Data Leakage** in ML datasets.
          </div>

          {collinearPairs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {collinearPairs.map((p, idx) => (
                <div key={idx} style={{ padding: 10, background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 8, fontSize: 11.5, color: '#991B1B' }}>
                  <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span>Redundant Collinearity</span>
                    <span>r = {p.r.toFixed(3)}</span>
                  </div>
                  <div>
                    High correlation: <b>{p.colA}</b> and <b>{p.colB}</b>.
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: C.emerald, fontWeight: 500, textAlign: 'center', padding: '6px 0' }}>
              ✓ No critical collinearity or leakage indicators detected.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
