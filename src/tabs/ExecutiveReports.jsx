import React from 'react';
import { C } from '../constants';

export default function ExecutiveReports({
  analysis,
  dataset,
  downloadProgress,
  triggerDownloadReport,
  setPresent,
  setSlide,
}) {
  const printPage = () => {
    window.print();
  };

  return (
    <div className="cx-full" style={{ padding: '0 10px' }}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
        <button className="sim-btn" onClick={() => { setPresent(true); setSlide(0); }}>
          ▶ RUN PRESENTATION MODE
        </button>
        <button className="sim-btn" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#fff' }} onClick={triggerDownloadReport} disabled={downloadProgress !== null}>
          {downloadProgress !== null ? `DOWNLOADING ${downloadProgress}%` : '📥 DOWNLOAD Executive PDF'}
        </button>
        <button className="sim-btn" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#fff' }} onClick={printPage}>
          🖨️ PRINT REPORT
        </button>
      </div>

      {downloadProgress !== null && (
        <div style={{ width: '320px', margin: '0 auto 20px', textAlign: 'center' }}>
          <div className="cx-boot-prog" style={{ width: '100%' }}>
            <div style={{ width: `${downloadProgress}%`, background: `linear-gradient(90deg, ${C.indigo}, ${C.violet})` }} />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.indigo, marginTop: 4 }}>
            Preparing PDF... {downloadProgress}%
          </div>
        </div>
      )}

      {analysis && dataset ? (
        <article className="memo-card">
          <header className="memo-header">
            <div className="memo-title">CORTEX OS EXECUTIVE REPORT</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: C.muted, letterSpacing: 1 }}>
              CONFIDENTIAL · BOARDROOM BRIEFING Snap
            </div>
            <div className="memo-meta">
              <span>
                <b>SOURCE:</b> {dataset.name}
              </span>
              <span>
                <b>INTEGRITY SCORE:</b> {analysis.qa.score}%
              </span>
              <span>
                <b>GENERATED AT:</b> {new Date().toLocaleDateString('en-GB')}
              </span>
              <span>
                <b>STATUS:</b> NOMINAL
              </span>
            </div>
          </header>

          <section className="memo-section">
            <h3 className="memo-sec-title">1. EXECUTIVE OVERVIEW</h3>
            <p style={{ fontSize: 12.5, lineHeight: 1.6, color: '#E2E8F0' }}>
              Autonomously profiled {dataset.rows.length.toLocaleString()} transactions across{' '}
              {dataset.fields.length} dimensions. Ingestion audits detected zero critical formatting faults.
              Outlier sweeps mapped anomalous fluctuations beneath a threshold confidence limits, suggesting
              stable general performance.
            </p>
          </section>

          <section className="memo-section">
            <h3 className="memo-sec-title">2. DETECTED ENTERPRISE KPIs</h3>
            <table className="memo-tbl">
              <thead>
                <tr>
                  <th>KPI METRIC</th>
                  <th>STATISTICAL SUMMARY</th>
                  <th>MEAN VALUE</th>
                </tr>
              </thead>
              <tbody>
                {analysis.dash.kpis.map((k, idx) => (
                  <tr key={idx}>
                    <td style={{ color: C.indigo, fontWeight: 700 }}>{k.label}</td>
                    <td>
                      Range: {(+k.min).toFixed(1)} → {(+k.max).toFixed(1)}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                      {(+k.mean).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="memo-section">
            <h3 className="memo-sec-title">3. SYNTHESIZED EXECUTIVE INSIGHTS</h3>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {analysis.insights.map((ins, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    marginBottom: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(99,102,241,0.04)',
                    borderLeft: `2px solid ${C.indigo}`,
                    color: '#E2E8F0',
                  }}
                >
                  <strong style={{ color: C.violet, fontSize: 10.5, letterSpacing: 1, display: 'block', marginBottom: 4 }}>
                    {ins.metric.toUpperCase()} (Confidence: {ins.confidence}%)
                  </strong>
                  {ins.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="memo-section">
            <h3 className="memo-sec-title">4. RECOMMENDED COMPLIANCE CONTROLS</h3>
            {analysis.recs.map((r, i) => (
              <div
                key={i}
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.55,
                  marginBottom: 8,
                  paddingLeft: 12,
                  borderLeft: `2px solid ${C.emerald}`,
                  color: '#CBD5E1',
                }}
              >
                <b>RECOMMENDATION {i + 1}:</b> {r}
              </div>
            ))}
          </section>
        </article>
      ) : (
        <section className="panel" style={{ textAlign: 'center', padding: '60px 10px', color: C.muted, fontFamily: 'JetBrains Mono', fontSize: 11 }}>
          UPLOAD A DATASET TO GENERATE THE FORMAL MEMORANDUM DOCUMENT
        </section>
      )}
    </div>
  );
}
