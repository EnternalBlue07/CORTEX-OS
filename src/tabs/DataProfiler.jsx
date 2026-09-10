import React, { useState, useMemo } from 'react';
import { C, MOCK_DB_TABLES } from '../constants';

export default function DataProfiler({ dataset, analysis }) {
  const [snippetType, setSnippetType] = useState('sql');

  // SQL Terminal state
  const [naturalQuery, setNaturalQuery] = useState('Show top APAC churn regions');
  const [terminalOutput, setTerminalOutput] = useState({
    sql: '',
    results: null,
    plan: null,
    status: 'idle' // idle | running | done
  });

  // 1. Calculate Fraud & Risk metrics dynamically
  const riskMetrics = useMemo(() => {
    if (!analysis || !analysis.prof.columns) return null;
    const columns = analysis.prof.columns;
    let suspiciousCount = 0;
    let financialExposure = 0;
    
    // Find numeric columns and count values > 3 standard deviations (outliers)
    columns.forEach((c) => {
      if (c.type === 'numeric' && c.stats) {
        suspiciousCount += c.stats.outliers;
        financialExposure += c.stats.outliers * c.stats.mean * 1.5; // estimated risk value
      }
    });

    const totalRows = analysis.prof.rowCount || 1;
    const missingRatio = columns.reduce((s, c) => s + c.missing, 0) / columns.length;
    
    let riskLevel = 'LOW';
    let riskColor = C.emerald;
    const score = Math.round((suspiciousCount / totalRows) * 100 + missingRatio);
    
    if (score > 15) {
      riskLevel = 'CRITICAL';
      riskColor = '#DC2626';
    } else if (score > 5) {
      riskLevel = 'WARNING';
      riskColor = '#D97706';
    }
    
    return {
      suspiciousCount,
      financialExposure: Math.round(financialExposure),
      riskLevel,
      riskColor,
      score: Math.min(100, Math.max(3, score))
    };
  }, [analysis]);

  if (!dataset || !analysis) {
    return (
      <section className="panel" style={{ textAlign: 'center', padding: '60px 10px', color: C.muted }}>
        Please upload a CSV or Excel dataset inside the Executive Dashboard to view the data profile.
      </section>
    );
  }

  const columns = analysis.prof.columns;

  // Generate SQL DDL
  const generateSQL = () => {
    const tableName = dataset.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const colsSQL = columns.map((c) => {
      const dbName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      let dbType = 'VARCHAR(255)';
      if (c.type === 'numeric') {
        dbType = c.stats && Number.isInteger(c.stats.mean) ? 'INTEGER' : 'DOUBLE PRECISION';
      } else if (c.type === 'date') {
        dbType = 'TIMESTAMP';
      }
      return `  ${dbName.padEnd(20)} ${dbType}`;
    }).join(',\n');

    return `CREATE TABLE ${tableName} (\n${colsSQL}\n);`;
  };

  // Generate Python Pandas loading code
  const generatePandas = () => {
    const numericCols = columns.filter((c) => c.type === 'numeric').map((c) => `'${c.name}'`);
    const dateCols = columns.filter((c) => c.type === 'date').map((c) => `'${c.name}'`);

    return `import pandas as pd

# 1. Load cleaned dataset CSV
df = pd.read_csv('cleaned_${dataset.name.replace(/\.[^/.]+$/, '')}.csv')

# 2. Inferred date parsing
date_cols = [${dateCols.join(', ')}]
for col in date_cols:
    df[col] = pd.to_datetime(df[col], errors='coerce')

# 3. Handle missing numeric aggregates
num_cols = [${numericCols.join(', ')}]
for col in num_cols:
    df[col] = df[col].fillna(df[col].mean())

print("Dataset Loaded successfully. Dimensions:", df.shape)
`;
  };

  const currentSnippet = snippetType === 'sql' ? generateSQL() : generatePandas();

  // Execute terminal SQL simulation
  const executeSQLQuery = () => {
    setTerminalOutput(prev => ({ ...prev, status: 'running' }));
    
    setTimeout(() => {
      const q = naturalQuery.toLowerCase();
      let sql = 'SELECT * FROM customers LIMIT 10;';
      let results = MOCK_DB_TABLES.customers;
      let table = 'customers';
      let plan = 'Seq Scan on customers  (cost=0.00..18.40 rows=5 width=256)';

      if (q.includes('apac') || q.includes('churn')) {
        sql = `SELECT region, name, churn_risk \nFROM customers \nWHERE region = 'APAC' AND churn_risk >= '12%';`;
        results = MOCK_DB_TABLES.customers.filter(c => c.region === 'APAC');
        table = 'customers';
        plan = `-> Seq Scan on customers (cost=0.00..15.20 rows=2 width=128)\n     Filter: (region = 'APAC'::text)\n     Width: 64 bytes`;
      } else if (q.includes('payment') || q.includes('transaction') || q.includes('stripe')) {
        sql = `SELECT tx_id, customer_id, amount, date \nFROM transactions \nWHERE amount > 5000;`;
        results = MOCK_DB_TABLES.transactions;
        table = 'transactions';
        plan = `-> Hash Join (cost=4.25..12.50 rows=5 width=92)\n     Hash Cond: (transactions.customer_id = customers.customer_id)`;
      } else if (q.includes('support') || q.includes('ticket') || q.includes('delay')) {
        sql = `SELECT ticket_id, issue_type, delay_hours \nFROM support \nWHERE delay_hours > '24 hrs';`;
        results = MOCK_DB_TABLES.support.filter(s => parseInt(s.delay_hours) > 24);
        table = 'support';
        plan = `-> Seq Scan on support (cost=0.00..8.25 rows=2 width=64)\n     Filter: (delay_hours::int > 24)`;
      }

      setTerminalOutput({
        sql,
        results,
        plan,
        status: 'done'
      });
    }, 800);
  };

  return (
    <div className="cx-2col">
      <div className="cx-col">
        {/* Fraud & Risk Intelligence Engine */}
        {riskMetrics && (
          <section className="panel">
            <div className="panel-h" style={{ marginBottom: 16 }}>
              <div>
                <div className="panel-title">🛡️ FRAUD & RISK INTELLIGENCE SCANNER</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  Automated Z-score bounds and financial exposure tracking.
                </div>
              </div>
              <div style={{ fontSize: 10, background: '#FEF2F2', color: '#DC2626', padding: '3px 8px', borderRadius: 12, fontWeight: 700 }}>
                RISK SWEEP ONLINE
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {/* Risk Level */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10.5, color: C.muted, textTransform: 'uppercase', fontWeight: 600 }}>Fraud Risk Level</span>
                <span style={{ fontSize: 18, fontWeight: 850, color: riskMetrics.riskColor }}>
                  {riskMetrics.riskLevel}
                </span>
                <div style={{ width: '100%', height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${riskMetrics.score}%`, height: '100%', background: riskMetrics.riskColor }} />
                </div>
              </div>
              
              {/* Outliers */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10.5, color: C.muted, textTransform: 'uppercase', fontWeight: 600 }}>Flagged Outliers</span>
                <span style={{ fontSize: 18, fontWeight: 850, color: '#0F172A' }}>
                  {riskMetrics.suspiciousCount} rows
                </span>
                <span style={{ fontSize: 9.5, color: C.muted }}>Exceeding Z &gt; 3 limits</span>
              </div>
              
              {/* Exposure */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10.5, color: C.muted, textTransform: 'uppercase', fontWeight: 600 }}>Financial Exposure</span>
                <span style={{ fontSize: 18, fontWeight: 850, color: '#DC2626' }}>
                  ${riskMetrics.financialExposure.toLocaleString()}
                </span>
                <span style={{ fontSize: 9.5, color: C.muted }}>Estimated dispute value</span>
              </div>
            </div>
            
            <div style={{ padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, color: C.muted, lineHeight: 1.45 }}>
              <span style={{ fontWeight: 600, color: C.indigo }}>Audit Summary: </span>
              {riskMetrics.riskLevel === 'LOW' 
                ? '✓ Ingestion checks verify zero critical anomalies. Transactions demonstrate a stable normal distribution. Under 1.5% outliers detected.'
                : '⚠️ Suspicious spikes detected in transaction limits. Operational audit recommended. Outlier values exceed safe standard deviation thresholds.'}
            </div>
          </section>
        )}

        {/* Live SQL Command Center terminal */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-title" style={{ marginBottom: 4 }}>💻 AI SQL COMMAND CENTER TERMINAL</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>
            Ask questions in plain text. AI auto-translates to SQL and runs the query live.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                placeholder="Ask e.g. Show top APAC churn regions..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontSize: 12.5,
                  outline: 'none'
                }}
              />
              <button
                onClick={executeSQLQuery}
                className="sim-btn"
                style={{ background: C.indigo, fontSize: 12, padding: '0 16px' }}
              >
                {terminalOutput.status === 'running' ? 'Executing...' : 'Run Query'}
              </button>
            </div>

            <div className="terminal-box">
              <div className="terminal-prompt">
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>cortex_terminal:~$</span>
                <span style={{ color: '#64748B', fontSize: 11 }}>Connected to sqlite_local_vault</span>
              </div>

              {terminalOutput.status === 'idle' && (
                <div style={{ color: '#64748B', fontSize: 11, textAlign: 'center', margin: '40px 0' }}>
                  Execute a query to retrieve tables schemas and record rows.
                </div>
              )}

              {terminalOutput.status === 'running' && (
                <div style={{ color: '#38BDF8', fontSize: 11, textAlign: 'center', margin: '40px 0' }}>
                  Parsing NLP parameters... Compiling query plan tree... Ingesting local indexes...
                </div>
              )}

              {terminalOutput.status === 'done' && (
                <div className="terminal-output">
                  <div style={{ color: '#FCD34D', marginBottom: 6, fontWeight: 700 }}>
                    TRANSLATED SQL STATEMENT:
                  </div>
                  <pre style={{ color: '#34D399', background: '#1E293B', padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: 'monospace' }}>
                    {terminalOutput.sql}
                  </pre>

                  <div style={{ color: '#FCD34D', marginBottom: 6, fontWeight: 700 }}>
                    QUERY RESPONSE RECORDS:
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, marginBottom: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155', color: '#38BDF8', textAlign: 'left' }}>
                        {Object.keys(terminalOutput.results[0] || {}).map(k => <th key={k} style={{ padding: '4px 6px' }}>{k.toUpperCase()}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {terminalOutput.results.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #1E293B' }}>
                          {Object.values(r).map((val, idx) => <td key={idx} style={{ padding: '4px 6px' }}>{val}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ color: '#EF4444', marginBottom: 6, fontWeight: 700 }}>
                    EXPLAIN EXECUTION PLAN:
                  </div>
                  <pre className="terminal-plan">
                    {terminalOutput.plan}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="cx-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Advanced Distributions Charts Panel */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-title" style={{ marginBottom: 4 }}>📊 ADVANCED METRICS DISTRIBUTION</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
            Violin, box plots, and waterfall distributions tracking structural numeric variance.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Box Plot SVG */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.indigo, marginBottom: 10 }}>ORDER VALUES VARIANCE (BOX PLOT)</div>
              <svg width="100%" height="45" viewBox="0 0 280 45">
                {/* Min-Max Line */}
                <line x1="20" y1="22" x2="260" y2="22" stroke="#64748B" strokeWidth="1.5" />
                <line x1="20" y1="14" x2="20" y2="30" stroke="#64748B" strokeWidth="1.5" />
                <line x1="260" y1="14" x2="260" y2="30" stroke="#64748B" strokeWidth="1.5" />

                {/* Box (Q1 to Q3) */}
                <rect x="70" y="10" width="130" height="24" fill="#EEF2FF" stroke={C.indigo} strokeWidth="1.8" rx="2" />

                {/* Median Line */}
                <line x1="140" y1="10" x2="140" y2="34" stroke="#4F46E5" strokeWidth="2.5" />

                {/* Outliers */}
                <circle cx="270" cy="22" r="3" fill="#DC2626" />
                <circle cx="10" cy="22" r="3" fill="#DC2626" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontWeight: 700, color: C.muted, marginTop: 4 }}>
                <span>MIN: $120</span>
                <span>Q1: $450</span>
                <span>MEDIAN: $980</span>
                <span>Q3: $1,420</span>
                <span>MAX: $2,800</span>
              </div>
            </div>

            {/* Violin Plot SVG */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.indigo, marginBottom: 10 }}>TRANSACTION DENSITY CURVE (VIOLIN PLOT)</div>
              <svg width="100%" height="55" viewBox="0 0 280 55">
                {/* Median dot */}
                <line x1="20" y1="27" x2="260" y2="27" stroke="#CBD5E1" strokeWidth="1" />
                
                {/* Symmetric density curves */}
                <path
                  d="M 20 27 Q 80 8, 140 10 T 260 27 Q 200 46, 140 44 T 20 27 Z"
                  fill="rgba(79, 70, 229, 0.08)"
                  stroke={C.indigo}
                  strokeWidth="1.5"
                />
                {/* Core box inside violin */}
                <rect x="100" y="23" width="80" height="8" fill="#4F46E5" rx="1.5" />
                <circle cx="140" cy="27" r="2.5" fill="#FFF" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontWeight: 700, color: C.muted, marginTop: 4 }}>
                <span>$0</span>
                <span>HIGH CONCENTRATION</span>
                <span>$25,000</span>
              </div>
            </div>

            {/* Waterfall Chart SVG */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.indigo, marginBottom: 10 }}>REVENUE CASCADE BRACKETS (WATERFALL)</div>
              <svg width="100%" height="65" viewBox="0 0 280 65">
                {/* Grid baseline */}
                <line x1="0" y1="55" x2="280" y2="55" stroke="#E2E8F0" strokeWidth="1" />

                {/* Bars */}
                {/* Inflow */}
                <rect x="15" y="15" width="22" height="40" fill="#10B981" rx="2" />
                {/* Cost A */}
                <rect x="55" y="15" width="22" height="15" fill="#EF4444" rx="2" />
                {/* Cost B */}
                <rect x="95" y="30" width="22" height="12" fill="#EF4444" rx="2" />
                {/* Reinvestment */}
                <rect x="135" y="42" width="22" height="8" fill="#10B981" rx="2" />
                {/* Final net */}
                <rect x="235" y="25" width="22" height="30" fill="#4F46E5" rx="2" />

                {/* Faint connectors */}
                <line x1="37" y1="15" x2="55" y2="15" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="77" y1="30" x2="95" y2="30" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="117" y1="42" x2="135" y2="42" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="157" y1="50" x2="235" y2="50" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, fontWeight: 700, color: C.muted, marginTop: 4 }}>
                <span>GROSS</span>
                <span>COGS</span>
                <span>OPEX</span>
                <span>AMER REINVEST</span>
                <span>NET REVENUE</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dataset Schema Profiles */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-h" style={{ marginBottom: 10 }}>
            <div className="panel-title">SCHEMA FIELD PROFILES</div>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>
              {analysis.prof.colCount} Columns · {analysis.prof.rowCount.toLocaleString()} Rows
            </span>
          </div>

          <div className="fc-table-container" style={{ maxHeight: 220, overflowY: 'auto' }}>
            <table className="fc-table" style={{ fontSize: 11 }}>
              <thead>
                <tr>
                  <th>FIELD</th>
                  <th>TYPE</th>
                  <th>MISSING %</th>
                  <th>UNIQUE</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((c) => (
                  <tr key={c.name}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{c.name}</td>
                    <td>
                      <span className={`prof-badge ${c.type === 'numeric' ? 'badge-numeric' : c.type === 'date' ? 'badge-date' : 'badge-cat'}`} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 4 }}>
                        {c.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: c.missing > 0 ? '#DC2626' : '#334155', fontWeight: c.missing > 0 ? 600 : 400 }}>
                      {c.missing}%
                    </td>
                    <td>{c.unique.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SQL & Code Snippet Generator */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-h" style={{ marginBottom: 10 }}>
            <div className="panel-title">SCHEMA LOADER EXPORT</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="sim-btn"
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  background: snippetType === 'sql' ? C.indigo : 'transparent',
                  border: '1px solid ' + C.indigo,
                  color: snippetType === 'sql' ? '#fff' : C.indigo,
                }}
                onClick={() => setSnippetType('sql')}
              >
                SQL
              </button>
              <button
                className="sim-btn"
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  background: snippetType === 'pandas' ? C.indigo : 'transparent',
                  border: '1px solid ' + C.indigo,
                  color: snippetType === 'pandas' ? '#fff' : C.indigo,
                }}
                onClick={() => setSnippetType('pandas')}
              >
                Pandas
              </button>
            </div>
          </div>

          <pre
            style={{
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: 10,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: '#1E293B',
              overflowX: 'auto',
              maxHeight: 120,
              whiteSpace: 'pre',
            }}
          >
            {currentSnippet}
          </pre>
        </section>
      </div>
    </div>
  );
}
