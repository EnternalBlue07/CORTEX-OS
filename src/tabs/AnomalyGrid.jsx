import React from 'react';
import ThreatGrid from '../components/ThreatGrid';
import { C } from '../constants';

export default function AnomalyGrid({
  dynamicAnomalies,
  resolvedAnomalies,
  resolveAnomaly,
  alerts,
  setAlerts,
}) {
  return (
    <div className="cx-2col">
      {/* Anomalies List */}
      <div className="cx-col">
        <section className="panel">
          <div className="panel-h">
            <div className="panel-title">
              <span className="cx-dot" style={{ background: C.red, boxShadow: '0 0 8px ' + C.red }} />
              CORTEX ANOMALY DETECTIONS & OUTLIERS
            </div>
            <div className="live-chip" style={{ color: C.red }}>
              {dynamicAnomalies.filter((a) => !resolvedAnomalies.includes(a.label)).length} UNRESOLVED
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {dynamicAnomalies.map((an) => {
              const isResolved = resolvedAnomalies.includes(an.label);
              return (
                <div
                  key={an.label}
                  className={'panel' + (isResolved ? ' anomaly-neutralized' : '')}
                  style={{
                    padding: 14,
                    borderColor: isResolved ? C.border : an.z > 3.2 ? C.red + '77' : C.amber + '77',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: 8.5,
                        color: isResolved ? C.muted : an.z > 3.2 ? C.red : C.amber,
                        border: '1px solid',
                        borderColor: isResolved ? C.border : 'currentColor',
                        borderRadius: 5,
                        padding: '1px 5px',
                      }}
                    >
                      Z = {an.z.toFixed(2)}
                    </span>
                    {isResolved ? (
                      <span className="anomaly-stamp">NEUTRALIZED</span>
                    ) : (
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono',
                          fontSize: 9,
                          color: an.dir === 'spike' ? C.emerald : C.red,
                        }}
                      >
                        {an.dir === 'spike' ? '▲ OUTLIER SPIKE' : '▼ OUTLIER DROP'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 700, margin: '6px 0 3px' }}>
                    {an.label}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: C.indigo, marginBottom: 8 }}>
                    Value: {an.val.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.muted, marginBottom: 12, lineHeight: 1.4 }}>
                    {an.dir === 'spike'
                      ? 'Detected values exceeding 99% confidence variance interval.'
                      : 'Detected values falling beneath statistical confidence variance threshold.'}
                  </div>
                  {!isResolved && (
                    <button className="sim-btn" style={{ width: '100%', padding: '6px' }} onClick={() => resolveAnomaly(an)}>
                      MITIGATE OUTLIER
                    </button>
                  )}
                </div>
              );
            })}

            {dynamicAnomalies.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 10px', color: C.muted, fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                NO ANOMALIES DETECTED IN THE ACTIVE DATASET
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Threat Sidebar */}
      <div className="cx-col">
        <ThreatGrid alerts={alerts} setAlerts={setAlerts} />
      </div>
    </div>
  );
}
