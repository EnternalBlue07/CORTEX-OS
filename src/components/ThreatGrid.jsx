import React from 'react';

export default function ThreatGrid({ alerts, setAlerts }) {
  return (
    <section className="panel">
      <div className="panel-h">
        <div className="panel-title">CORTEX THREAT GRID</div>
        <div className="live-chip" style={{ color: '#EF4444' }}>
          {alerts.length} ACTIVE
        </div>
      </div>
      {alerts.map((al) => (
        <div
          className="alert"
          key={al.id}
          style={{
            borderColor: al.color + '66',
            '--ag': al.color + '33',
            background: 'rgba(2,4,8,0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: 2, color: al.color }}>
              {al.sev}
            </span>
            <span
              onClick={() => setAlerts((as) => as.filter((x) => x.id !== al.id))}
              style={{ cursor: 'pointer', color: '#64748B', fontSize: 14, lineHeight: 1 }}
            >
              ×
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{al.title}</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#64748B', marginBottom: 6 }}>
            {al.src}
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.88, borderLeft: '2px solid ' + al.color, paddingLeft: 8 }}>
            AI ▸ {al.rec}
          </div>
        </div>
      ))}
      {alerts.length === 0 && (
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#10B981' }}>
          ALL THREATS NEUTRALIZED
        </div>
      )}
    </section>
  );
}
