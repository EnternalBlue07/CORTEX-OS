import React, { useState, useEffect, useRef } from 'react';
import { C, MOCK_CONNECTORS } from '../constants';

export default function EnterpriseFabric({ warRoomMode, loadRelationalDemo }) {
  const [filter, setFilter] = useState('All');
  const [connectors, setConnectors] = useState(MOCK_CONNECTORS);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDb, setWizardDb] = useState('PostgreSQL');
  const [wizardLogs, setWizardLogs] = useState([]);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardFields, setWizardFields] = useState({ host: 'db.omega.enterprise', db: 'production_analytics', user: 'cortex_admin', port: '5432' });

  // Stream stats
  const [tps, setTps] = useState(420);
  const [latency, setLatency] = useState(3.2);
  const [streamLog, setStreamLog] = useState([]);
  const logIndexRef = useRef(0);

  // SVG Chart points for TPS
  const [tpsHistory, setTpsHistory] = useState([410, 420, 390, 430, 440, 415, 435, 420, 410, 430, 450, 420, 440, 435, 460]);

  // Topology state
  const [selectedTopologyNode, setSelectedTopologyNode] = useState('Snowflake');

  // Trigger streaming logs in the background
  useEffect(() => {
    const streamSources = ['Stripe', 'Postgres', 'Kafka', 'Salesforce', 'BigQuery', 'Shopify'];
    const streamEvents = [
      'Received payment charge ch_3M8a for $142.50',
      'Ingested telemetry metrics packet_9028',
      'Updated customer_id record index',
      'Flushed sync queue database buffer',
      'Discovered new session record C-005',
      'Synchronized lead status change in Salesforce'
    ];

    const streamInterval = setInterval(() => {
      // Jitter TPS
      setTps(prev => Math.round(prev + (Math.random() * 40 - 20)));
      setTpsHistory(history => [...history.slice(1), Math.round(history[history.length - 1] + (Math.random() * 30 - 15))]);
      setLatency(prev => +(prev + (Math.random() * 0.4 - 0.2)).toFixed(2));

      // Append new event
      const src = streamSources[Math.floor(Math.random() * streamSources.length)];
      const ev = streamEvents[Math.floor(Math.random() * streamEvents.length)];
      const timestamp = new Date().toLocaleTimeString('en-GB');
      
      setStreamLog(prev => [
        { id: logIndexRef.current++, timestamp, src, ev },
        ...prev
      ].slice(0, 8));
    }, 2000);

    return () => clearInterval(streamInterval);
  }, []);

  // Run database connection wizard step-by-step
  const runWizard = () => {
    setWizardStep(1);
    setWizardLogs(['[1] INITIALIZING SECURE SSL BRIDGE NODE...', 'Establishing handshake with remote server...']);
    
    const steps = [
      {
        txt: '[2] TESTING HOST REACHABILITY AND CREDENTIALS...',
        log: 'Host resolved successfully. Port active. Handshake approved.'
      },
      {
        txt: '[3] EXECUTING AUTO SCHEMA DISCOVERY SWEEPS...',
        log: 'Scanned database indexes. Found 18 active relational tables.'
      },
      {
        txt: '[4] PARSING RELATIONSHIPS AND CONFIDENCE SCORING...',
        log: 'Detected matching customer_id keys across Orders, Items, and Support tables (98% confidence).'
      },
      {
        txt: '[5] ESTABLISHING OMEGA INTELLIGENCE LINK...',
        log: 'Ingestion pipeline established. Aligning schema coordinates...'
      },
      {
        txt: '⚡ AZURE INTELLIGENCE LINK SUCCESSFULLY ESTABLISHED!',
        log: 'Data is now syncing live. Load Relational Demo schema to view nodes.'
      }
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        setWizardLogs(prev => [...prev, s.txt, s.log]);
        setWizardStep(idx + 2);
        if (idx === steps.length - 1) {
          // Add newly connected connector
          setConnectors(prev => prev.map(c => 
            (c.id === 'postgres' && wizardDb === 'PostgreSQL') || (c.id === 'azuresql' && wizardDb === 'Azure SQL')
              ? { ...c, active: true } 
              : c
          ));
          loadRelationalDemo(); // Auto-load tables
        }
      }, (idx + 1) * 1200);
    });
  };

  const categories = ['All', 'SQL System', 'Enterprise Warehouse', 'NoSQL System', 'Streaming System', 'Cloud Platform', 'SaaS Integration'];
  const filteredConnectors = filter === 'All' 
    ? connectors 
    : connectors.filter(c => c.type === filter);

  // Coordinates for Topology Graph Nodes
  const topologyNodes = {
    'Salesforce': { desc: 'SaaS Customer Resource. Ingests opportunities & leads.', tp: '80 req/sec', health: '96%' },
    'Snowflake': { desc: 'Primary Enterprise Data Warehouse. Storing transactional tables.', tp: '1,200 req/sec', health: '99%' },
    'Forecast Engine': { desc: 'Omega Simulation Sandbox. Simulating scenarios.', tp: '450 req/sec', health: '98%' },
    'Risk Intelligence': { desc: 'Anomaly and Z-score outlier detection models.', tp: '290 req/sec', health: '97%' },
    'Boardroom Reports': { desc: 'Executive summaries, comments feed, and weather systems.', tp: '12 req/sec', health: '100%' }
  };

  return (
    <div className="cx-2col">
      <div className="cx-col">
        {/* Connection fabric card grid */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-h" style={{ marginBottom: 12 }}>
            <div>
              <div className="panel-title">UNIVERSAL INGESTION FABRIC</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                Connect to databases, message streams, cloud buckets, and CRM platforms. Click a source to link.
              </div>
            </div>
            <button
              onClick={() => {
                setWizardOpen(true);
                setWizardStep(0);
                setWizardLogs([]);
              }}
              className="sim-btn"
              style={{ fontSize: 11, padding: '5px 10px', background: C.indigo }}
            >
              ⚡ Add Data Source
            </button>
          </div>

          {/* Categories Filter */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: filter === cat ? '1px solid ' + (warRoomMode ? '#EF4444' : C.indigo) : '1px solid #E2E8F0',
                  background: filter === cat ? (warRoomMode ? '#450A0A' : '#EEF2FF') : '#FFF',
                  color: filter === cat ? (warRoomMode ? '#EF4444' : C.indigo) : C.muted,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {cat.replace(' System', '').replace(' Integration', '')}
              </button>
            ))}
          </div>

          <div className="fabric-grid" style={{ maxHeight: 540, overflowY: 'auto', paddingRight: 4 }}>
            {filteredConnectors.map(c => (
              <div
                key={c.id}
                onClick={() => {
                  setWizardDb(c.label);
                  setWizardFields({ host: `db.${c.id}.enterprise`, db: `cortex_${c.id}`, user: 'cortex_admin', port: c.id === 'postgres' ? '5432' : '1433' });
                  setWizardOpen(true);
                  setWizardStep(0);
                  setWizardLogs([]);
                }}
                className="fabric-card"
                style={{ cursor: 'pointer', border: c.active ? '1px solid ' + (warRoomMode ? '#7F1D1D' : '#C7D2FE') : '1px solid #E2E8F0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: warRoomMode ? '#FFF' : '#0F172A' }}>{c.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="status-glow" style={{ background: c.active ? '#10B981' : '#64748B' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: c.active ? '#059669' : '#64748B' }}>
                      {c.active ? 'CONNECTED' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 4px', fontSize: 10, color: C.muted, marginTop: 4 }}>
                  <div>Latency: <b style={{ color: warRoomMode ? '#FCA5A5' : '#0F172A' }}>{c.latency}ms</b></div>
                  <div>Health Score: <b style={{ color: warRoomMode ? '#FCA5A5' : '#0F172A' }}>{c.health}%</b></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    Throughput: <b style={{ color: warRoomMode ? '#FCA5A5' : '#0F172A' }}>{c.active ? c.tp + ' req/s' : '0 req/s'}</b>
                  </div>
                </div>

                <div style={{ fontSize: 8.5, color: C.muted, borderTop: '1px solid #F1F5F9', paddingTop: 6, textTransform: 'uppercase', fontWeight: 600 }}>
                  {c.type}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="cx-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Live Database Ingestion Connection Flow Wizard */}
        {wizardOpen && (
          <section className="panel" style={{ border: warRoomMode ? '1px solid #7F1D1D' : '1px solid #E2E8F0', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="panel-title" style={{ fontSize: 12.5 }}>🔗 ESTABLISH INTELLIGENCE LINK: {wizardDb}</div>
              <button onClick={() => setWizardOpen(false)} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer' }}>✕</button>
            </div>

            {wizardStep === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>HOST ADDRESS</label>
                    <input type="text" value={wizardFields.host} onChange={(e) => setWizardFields({ ...wizardFields, host: e.target.value })} style={{ width: '100%', fontSize: 11, padding: 6, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>DATABASE NAME</label>
                    <input type="text" value={wizardFields.db} onChange={(e) => setWizardFields({ ...wizardFields, db: e.target.value })} style={{ width: '100%', fontSize: 11, padding: 6, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>USERNAME</label>
                    <input type="text" value={wizardFields.user} onChange={(e) => setWizardFields({ ...wizardFields, user: e.target.value })} style={{ width: '100%', fontSize: 11, padding: 6, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4 }}>PORT</label>
                    <input type="text" value={wizardFields.port} onChange={(e) => setWizardFields({ ...wizardFields, port: e.target.value })} style={{ width: '100%', fontSize: 11, padding: 6, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                  </div>
                </div>
                <button
                  onClick={runWizard}
                  className="sim-btn"
                  style={{ width: '100%', background: C.indigo, marginTop: 4, padding: '7px 0', fontSize: 11 }}
                >
                  🚀 Test Connection & Ingest Schema
                </button>
              </div>
            ) : (
              <div style={{ background: '#0F172A', color: '#38BDF8', fontFamily: 'monospace', fontSize: 10.5, borderRadius: 8, padding: 12, minHeight: 140, maxHeight: 180, overflowY: 'auto' }}>
                {wizardLogs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: 4, color: log.startsWith('⚡') ? '#34D399' : log.startsWith('[') ? '#38BDF8' : '#94A3B8' }}>
                    {log}
                  </div>
                ))}
                {wizardStep < 6 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', marginTop: 8 }}>
                    <span className="status-glow" style={{ background: '#38BDF8', width: 6, height: 6 }} />
                    Analyzing database...
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Live Streaming Data telemetry Panel */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-title" style={{ marginBottom: 10 }}>📡 LIVE TELEMETRY Event STREAMS</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: C.muted }}>TRANSACTIONS / EVENTS PER SECOND</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.indigo, marginTop: 4 }}>{tps} <span style={{ fontSize: 10, color: C.muted }}>TPS</span></div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: C.muted }}>STREAM DELIVERY LATENCY</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#059669', marginTop: 4 }}>{latency} <span style={{ fontSize: 10, color: C.muted }}>MS</span></div>
            </div>
          </div>

          {/* Simple SVG Ingest line graph charting telemetry */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', height: 75, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <svg width="100%" height="45" viewBox="0 0 260 50">
              <path
                d={`M ${tpsHistory.map((val, idx) => `${idx * 18.5}, ${50 - ((val - 300) / 300) * 45}`).join(' L ')}`}
                fill="none"
                stroke={warRoomMode ? '#EF4444' : C.indigo}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontWeight: 700, color: C.muted, marginTop: 4 }}>
              <span>60 SEC AGO</span>
              <span>LIVE BUFFER</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, borderBottom: '1px solid #E2E8F0', paddingBottom: 4 }}>REAL-TIME DATA FLOWING TELEMETRY</div>
            <div style={{ maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {streamLog.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: 8, fontSize: 10, fontFamily: 'monospace', color: '#0F172A', borderBottom: '1px dashed #F1F5F9', paddingBottom: 3 }}>
                  <span style={{ color: C.muted }}>{log.timestamp}</span>
                  <span style={{ color: C.indigo, fontWeight: 600 }}>{log.src}</span>
                  <span style={{ flex: 1, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.ev}</span>
                </div>
              ))}
              {streamLog.length === 0 && (
                <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', padding: '10px 0' }}>Ingesting message broker streams...</div>
              )}
            </div>
          </div>
        </section>

        {/* Data Topology map */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-title" style={{ marginBottom: 4 }}>🌐 LIVE DATA TOPOLOGY MAP</div>
          <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 12 }}>
            Connected systems layout. Click nodes to inspect pipeline metadata.
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="100%" height="80" viewBox="0 0 420 80">
              {/* Lines linking systems */}
              <line x1="40" y1="40" x2="120" y2="40" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5 5" className="flow-edge-path" />
              <line x1="120" y1="40" x2="200" y2="40" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5 5" className="flow-edge-path" />
              <line x1="200" y1="40" x2="280" y2="40" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5 5" className="flow-edge-path" />
              <line x1="280" y1="40" x2="360" y2="40" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="5 5" className="flow-edge-path" />

              {/* Node Circles */}
              {[
                { name: 'Salesforce', x: 40 },
                { name: 'Snowflake', x: 120 },
                { name: 'Forecast Engine', x: 200 },
                { name: 'Risk Intelligence', x: 280 },
                { name: 'Boardroom Reports', x: 360 }
              ].map((n) => (
                <g key={n.name} onClick={() => setSelectedTopologyNode(n.name)} style={{ cursor: 'pointer' }}>
                  <circle
                    cx={n.x}
                    cy="40"
                    r="14"
                    fill={selectedTopologyNode === n.name ? C.indigo : '#FFFFFF'}
                    stroke={C.indigo}
                    strokeWidth="2.5"
                    style={{ transition: 'all 0.2s' }}
                  />
                  <text
                    x={n.x}
                    y="43.5"
                    textAnchor="middle"
                    fill={selectedTopologyNode === n.name ? '#FFFFFF' : C.indigo}
                    fontSize="9.5"
                    fontWeight="800"
                  >
                    {n.name[0]}
                  </text>
                  <text
                    x={n.x}
                    y="68"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontSize="8.5"
                    fontWeight="700"
                  >
                    {n.name}
                  </text>
                </g>
              ))}
            </svg>

            {/* Selected Node Details Box */}
            <div style={{ marginTop: 12, width: '100%', borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: C.indigo }}>
                <span>{selectedTopologyNode.toUpperCase()} PIPELINE NODE</span>
                <span style={{ color: '#059669', fontSize: 9.5 }}>HEALTH: {topologyNodes[selectedTopologyNode]?.health}</span>
              </div>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>
                {topologyNodes[selectedTopologyNode]?.desc}
              </p>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                Current Ingestion Rate: <strong style={{ color: '#0F172A' }}>{topologyNodes[selectedTopologyNode]?.tp}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
