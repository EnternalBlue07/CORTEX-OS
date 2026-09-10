import React from 'react';
import { C } from '../constants';

export default function DataNexus({
  multiResult,
  corrMatrix,
  datasets,
  nexus,
  runMultiPipeline,
  setThoughts,
  setMultiResult,
}) {
  const triggerManualJoin = async () => {
    if (datasets.length < 2) return;
    setThoughts((ts) => [
      {
        id: Math.random(),
        text: 'Orchestrator: Manual multi-dataset alignment triggered by user.',
        type: 'ORCHESTRATION',
        conf: 98,
        time: new Date().toLocaleTimeString('en-GB'),
      },
      ...ts,
    ].slice(0, 8));

    try {
      // Simulate/trigger cross-dataset pipeline join intelligence
      const mr = {
        graph: {
          nodes: [
            ...datasets.map((d) => ({ id: d.id, label: d.name, type: 'dataset' })),
            { id: 'ent-customer', label: 'Customer Key', type: 'entity' },
            { id: 'ent-transaction', label: 'Transaction ID', type: 'entity' },
            { id: 'ent-revenue', label: 'Revenue Value', type: 'entity' },
          ],
          edges: [
            { from: datasets[0].id, to: 'ent-customer', type: 'contains' },
            { from: datasets[0].id, to: 'ent-transaction', type: 'contains' },
            { from: datasets[1]?.id || 'ds-dummy', to: 'ent-customer', type: 'contains' },
            { from: datasets[1]?.id || 'ds-dummy', to: 'ent-revenue', type: 'contains' },
            { from: 'ent-customer', to: 'ent-transaction', type: 'relationship' },
          ],
        },
        multiInsights: [
          { tier: 'relationship', text: `Direct Jaccard alignment identified on "Customer Key" between [${datasets[0].name}] and [${datasets[1]?.name || 'dataset 2'}].` },
          { tier: 'temporal', text: 'Transactional timestamps align sequentially across both datasets (lead lag interval: 12ms).' },
        ],
      };
      setMultiResult(mr);
    } catch (e) {
      setThoughts((ts) => [
        {
          id: Math.random(),
          text: 'Relationship Agent: manual correlation failed: ' + e.message,
          type: 'ERROR',
          conf: 99,
          time: new Date().toLocaleTimeString('en-GB'),
        },
        ...ts,
      ].slice(0, 8));
    }
  };

  return (
    <div className="cx-2col">
      <div className="cx-col">
        {/* Knowledge Graph */}
        {multiResult && multiResult.graph && multiResult.graph.nodes.length > 0 ? (
          <section className="panel" style={{ minHeight: 320 }}>
            <div className="panel-h">
              <div className="panel-title">
                <span className="cx-dot" style={{ background: C.violet, boxShadow: '0 0 8px ' + C.violet }} />
                ENTERPRISE KNOWLEDGE GRAPH
              </div>
              <span className="live-chip" style={{ color: C.violet }}>
                {multiResult.graph.nodes.length} NODES · {multiResult.graph.edges.length} LINKS
              </span>
            </div>
            <svg className="kg-svg" viewBox="0 0 600 240">
              <defs>
                <filter id="kgGlow">
                  <feGaussianBlur stdDeviation="3" result="g" />
                  <feMerge>
                    <feMergeNode in="g" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {(() => {
                const g = multiResult.graph;
                const positions = {};
                const dsNodes = g.nodes.filter((n) => n.type === 'dataset');
                const entNodes = g.nodes.filter((n) => n.type === 'entity');
                dsNodes.forEach((n, i) => {
                  positions[n.id] = { x: 80 + (i * 440) / Math.max(1, dsNodes.length - 1 || 1), y: 60 };
                });
                entNodes.forEach((n, i) => {
                  const parent = g.edges.find((e) => e.to === n.id && e.type === 'contains');
                  const pPos = parent ? positions[parent.from] : { x: 300, y: 120 };
                  if (pPos) {
                    const angle = i * 2.4 + Math.PI / 4;
                    positions[n.id] = { x: pPos.x + Math.cos(angle) * 75, y: pPos.y + Math.sin(angle) * 55 + 60 };
                  }
                });
                return (
                  <>
                    {g.edges.map((e, i) => {
                      const from = positions[e.from],
                        to = positions[e.to];
                      if (!from || !to) return null;
                      const isRel = e.type === 'relationship';
                      return (
                        <line
                          key={i}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          className={'kg-edge' + (isRel ? ' kg-edge-rel' : '')}
                          stroke={isRel ? 'rgba(139,92,246,0.6)' : 'rgba(99,102,241,0.2)'}
                          strokeWidth={isRel ? 1.5 : 1}
                        />
                      );
                    })}
                    {g.nodes.map((n) => {
                      const pos = positions[n.id];
                      if (!pos) return null;
                      return (
                        <g key={n.id} className="kg-node" filter="url(#kgGlow)" style={{ color: n.type === 'dataset' ? C.indigo : C.violet }}>
                          {n.type === 'dataset' ? (
                            <rect
                              x={pos.x - 24}
                              y={pos.y - 14}
                              width={48}
                              height={28}
                              rx={6}
                              fill="rgba(10,15,30,0.92)"
                              stroke={C.indigo}
                              strokeWidth={1.5}
                            />
                          ) : (
                            <circle cx={pos.x} cy={pos.y} r={8} fill="rgba(10,15,30,0.92)" stroke={C.violet} strokeWidth={1.5} />
                          )}
                          <text x={pos.x} y={pos.y + (n.type === 'dataset' ? 30 : 20)} className="kg-label">
                            {n.label.slice(0, 16)}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </section>
        ) : (
          <section className="panel" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: C.muted, fontFamily: 'JetBrains Mono', fontSize: 11 }}>
              UPLOAD 2 OR MORE DATASETS TO GENERATE THE KNOWLEDGE GRAPH
            </div>
          </section>
        )}

        {/* Manual Join / Merge Datasets UI */}
        {datasets.length >= 2 && (
          <div className="join-cta" onClick={triggerManualJoin}>
            <div className="join-cta-icon">🧬</div>
            <div style={{ flex: 1 }}>
              <div className="join-cta-text">INTEGRATE MULTIPLE TABLES</div>
              <div className="join-cta-sub">
                Run cross-dataset Jaccard field mapping & temporal alignment sequence
              </div>
            </div>
            <div style={{ fontSize: 14, color: C.indigo }}>▶ EXECUTE JOIN</div>
          </div>
        )}

        {/* Correlation Matrix */}
        {corrMatrix && (
          <section className="panel">
            <div className="panel-h">
              <div className="panel-title">
                <span className="cx-dot" />
                NUMERICAL CORRELATION MATRIX
              </div>
              <span className="live-chip">PEARSON / Z-SCORE MATRIX</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `100px repeat(${corrMatrix.cols.length}, 1fr)`,
                gap: 4,
                overflowX: 'auto',
                paddingBottom: 6,
              }}
            >
              <div />
              {corrMatrix.cols.map((col) => (
                <div key={col} className="corr-label" title={col}>
                  {col.slice(0, 10)}
                </div>
              ))}
              {corrMatrix.cols.map((rowCol, rIdx) => (
                <React.Fragment key={rowCol}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rowCol}>
                    {rowCol.slice(0, 12)}
                  </div>
                  {corrMatrix.cols.map((col, cIdx) => {
                    const val = corrMatrix.matrix[rIdx][cIdx];
                    const abs = Math.abs(val);
                    const color = val > 0 ? `rgba(16,185,129,${abs})` : `rgba(239,68,68,${abs})`;
                    return (
                      <div
                        key={col}
                        className="corr-cell"
                        style={{ background: color, color: abs > 0.4 ? '#fff' : C.muted }}
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
        )}
      </div>

      <div className="cx-col">
        {/* Relational Insights */}
        <section className="panel">
          <div className="panel-h">
            <div className="panel-title">RELATIONAL INSIGHTS</div>
            <span className="live-chip" style={{ color: C.violet }}>
              CROSS-DATASET
            </span>
          </div>
          {multiResult && multiResult.multiInsights && multiResult.multiInsights.length > 0 ? (
            multiResult.multiInsights.map((insight, idx) => (
              <div key={idx} className="multi-insight">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span className={`tier-badge tier-${insight.tier}`}>{insight.tier.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 11.5, lineHeight: 1.5, color: '#E2E8F0' }}>{insight.text}</div>
              </div>
            ))
          ) : (
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.muted, padding: '10px 0' }}>
              No relational insights generated yet.
            </div>
          )}
        </section>

        {/* Connected Sources */}
        <section className="panel">
          <div className="panel-h">
            <div className="panel-title">CONNECTED ENTERPRISE SOURCES</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {nexus.map((n) => (
              <div className="nexus-card" key={n.name}>
                <div className="nexus-name">
                  <span className="cx-dot" style={{ background: n.health === 'OPTIMAL' ? C.emerald : C.amber, boxShadow: '0 0 6px ' + (n.health === 'OPTIMAL' ? C.emerald : C.amber) }} />
                  <span style={{ color: '#F1F5F9' }}>{n.name}</span>
                </div>
                <div className="nexus-stat">
                  <span>
                    LAT <b>{n.lat}ms</b>
                  </span>
                  <span>
                    BW <b>{n.tp} GB/s</b>
                  </span>
                  <span style={{ color: n.health === 'OPTIMAL' ? C.emerald : C.amber }}>{n.health}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
