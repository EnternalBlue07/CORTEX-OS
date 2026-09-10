import React from 'react';
import { C } from '../constants';

export default function LiveOperations({ opsLogs, opsTerminalRef }) {
  // Generate random data points for packet flow simulator
  const nodes = React.useMemo(
    () => [
      { id: 'gw', x: 150, y: 110, label: 'Gateway' },
      { id: 'db1', x: 50, y: 40, label: 'Stripe API' },
      { id: 'db2', x: 250, y: 40, label: 'Snowflake' },
      { id: 'ag1', x: 50, y: 180, label: 'Risk Swarm' },
      { id: 'ag2', x: 250, y: 180, label: 'Forecast Swarm' },
    ],
    []
  );

  const links = React.useMemo(
    () => [
      { from: 'gw', to: 'db1' },
      { from: 'gw', to: 'db2' },
      { from: 'gw', to: 'ag1' },
      { from: 'gw', to: 'ag2' },
      { from: 'db1', to: 'db2' },
    ],
    []
  );

  return (
    <div className="cx-2col">
      {/* Ops Logs Terminal */}
      <div className="cx-col">
        <section className="panel">
          <div className="panel-h">
            <div className="panel-title">
              <span className="cx-dot" />
              LIVE SYSTEM OPERATIONS LOGS
            </div>
            <div className="live-chip">ACTIVE SYNC CONCURRENT</div>
          </div>
          <div className="ops-terminal" ref={opsTerminalRef}>
            {opsLogs.map((log, i) => {
              let cls = 'ops-line';
              if (log.includes('[OK]')) cls += ' ok';
              else if (log.includes('[WARN]')) cls += ' warn';
              else if (log.includes('[ERROR]')) cls += ' err';
              else if (log.startsWith('$')) cls += ' cmd';
              else if (log.startsWith('[QUERY]')) cls += ' sec';
              return (
                <div key={i} className={cls}>
                  {log}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Packet Flow Network Graph */}
      <div className="cx-col">
        <section className="panel" style={{ minHeight: 320 }}>
          <div className="panel-h">
            <div className="panel-title">LIVE PACKET ROUTING GRAPH</div>
            <span className="live-chip">SWARM NETWORK</span>
          </div>

          <svg className="kg-svg" viewBox="0 0 300 220" style={{ height: 260 }}>
            <defs>
              <filter id="opGlow">
                <feGaussianBlur stdDeviation="2" result="g" />
                <feMerge>
                  <feMergeNode in="g" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Links */}
            {links.map((lnk, idx) => {
              const fromNode = nodes.find((n) => n.id === lnk.from);
              const toNode = nodes.find((n) => n.id === lnk.to);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={idx}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="rgba(99,102,241,0.22)"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  style={{ animation: 'dashFlow 5s linear infinite' }}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => (
              <g key={n.id} filter="url(#opGlow)">
                <circle cx={n.x} cy={n.y} r={9} fill="rgba(10,15,30,0.9)" stroke={C.indigo} strokeWidth="1.5" />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={4}
                  fill={n.id === 'gw' ? C.emerald : C.violet}
                  style={{ animation: 'softPulse 2s infinite' }}
                />
                <text
                  x={n.x}
                  y={n.y + 18}
                  fontFamily="JetBrains Mono"
                  fontSize="7.5px"
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
    </div>
  );
}
