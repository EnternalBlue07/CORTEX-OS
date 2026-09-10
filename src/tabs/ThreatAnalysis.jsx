import React from 'react';
import { C } from '../constants';

export default function ThreatAnalysis({ firewallLogs, firewallTerminalRef }) {
  // Generate random data points for threat node diagram
  const nodes = React.useMemo(
    () => [
      { id: 'ext-router', x: 50, y: 110, label: 'Geo-Gateway', isThreat: false },
      { id: 'dmz-shield', x: 150, y: 110, label: 'IPS Core', isThreat: false },
      { id: 'db-shield', x: 250, y: 50, label: 'SQLi Guard', isThreat: false },
      { id: 'user-auth', x: 250, y: 170, label: 'OAuth Guard', isThreat: false },
    ],
    []
  );

  return (
    <div className="cx-2col">
      {/* Active Security Systems */}
      <div className="cx-col">
        <section className="panel" style={{ minHeight: 320 }}>
          <div className="panel-h">
            <div className="panel-title">
              <span className="cx-dot" style={{ background: C.red }} />
              ACTIVE INTELLIGENT SEGMENTATION SECURE MAP
            </div>
            <div className="live-chip" style={{ color: C.red }}>
              CORE SHIELD: ENFORCED
            </div>
          </div>

          <svg className="kg-svg" viewBox="0 0 300 220" style={{ height: 260 }}>
            {/* Draw active lines */}
            <line x1={50} y1={110} x2={150} y2={110} className="sec-link active" />
            <line x1={150} y1={110} x2={250} y2={50} className="sec-link active" />
            <line x1={150} y1={110} x2={250} y2={170} className="sec-link active" />

            {/* Nodes */}
            {nodes.map((n) => (
              <g key={n.id}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={12}
                  className={'sec-node' + (n.isThreat ? ' threat' : '')}
                />
                <circle cx={n.x} cy={n.y} r={4} fill={C.red} style={{ animation: 'softPulse 1.4s infinite' }} />
                <text
                  x={n.x}
                  y={n.y + 22}
                  fontFamily="JetBrains Mono"
                  fontSize="7px"
                  fill="#CBD5E1"
                  textAnchor="middle"
                >
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        </section>
      </div>

      {/* Firewall Logs Terminal */}
      <div className="cx-col">
        <section className="panel">
          <div className="panel-h">
            <div className="panel-title">FIREWALL INTRUSION SWEEP LOGS</div>
            <span className="live-chip">SEC PROTOCOLS</span>
          </div>
          <div className="ops-terminal" ref={firewallTerminalRef} style={{ height: 260 }}>
            {firewallLogs.map((log, i) => (
              <div key={i} className="ops-line sec">
                {log}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
