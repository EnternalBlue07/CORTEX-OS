import React from 'react';
import { C, AGENTS } from '../constants';

export default function AIAgents({
  agentConsoleLogs,
  runningAgent,
  setRunningAgent,
  simulating,
  runAgentSimulation,
  agentProg,
  agentConf,
}) {
  return (
    <div className="cx-2col">
      {/* Agent Command Console */}
      <div className="cx-col">
        <section className="panel">
          <div className="panel-h">
            <div className="panel-title">
              <span className="cx-dot" style={{ background: C.violet, boxShadow: '0 0 8px ' + C.violet }} />
              AUTONOMOUS AGENT COMMAND CONSOLE
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select
                className="agent-term-select"
                value={runningAgent}
                onChange={(e) => setRunningAgent(e.target.value)}
                disabled={simulating}
              >
                {AGENTS.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button
                className="sim-btn"
                style={{ padding: '6px 12px', opacity: simulating ? 0.6 : 1 }}
                onClick={runAgentSimulation}
                disabled={simulating}
              >
                {simulating ? 'OPTIMIZING…' : 'RUN OPTIMIZATION LOOP'}
              </button>
            </div>
          </div>

          {/* Swarm Physics Visualization */}
          <div className="swarm">
            <div className="swarm-core" />
            <div className="swarm-dot" style={{ '--r': '18px', background: C.indigo, animationDuration: '3s' }} />
            <div className="swarm-dot" style={{ '--r': '26px', background: C.violet, animationDuration: '4.5s', animationDelay: '-1s' }} />
            <div className="swarm-dot" style={{ '--r': '32px', background: C.cyan, animationDuration: '6s', animationDelay: '-2.5s' }} />
            <div className="swarm-dot" style={{ '--r': '40px', background: C.emerald, animationDuration: '8s', animationDelay: '-4s' }} />
          </div>

          <div className="agent-terminal">
            {agentConsoleLogs.map((log, i) => {
              let cls = 'agent-term-line';
              if (log.startsWith('[CMD]')) cls += ' cmd';
              else if (log.startsWith('[SUCCESS]') || log.startsWith('[OK]')) cls += ' ok';
              else if (log.startsWith('[ALERT]')) cls += ' err';
              return (
                <div key={i} className={cls}>
                  {log}
                </div>
              );
            })}
            {simulating && (
              <div className="think">
                <span style={{ color: C.muted, marginRight: 6 }}>Agent Swarm Thinking</span>
                <i />
                <i />
                <i />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Swarm Telemetry Sidebar */}
      <div className="cx-col">
        <section className="panel">
          <div className="panel-h">
            <div className="panel-title">SWARM INTEL TELEMETRY</div>
            <div className="live-chip">6 ACTIVE</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {AGENTS.map((a, i) => (
              <div className="agent-card" key={a.name}>
                <div className="agent-av" style={{ background: a.color + '15', color: a.color, border: '1px solid ' + a.color + '33' }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600 }}>{a.name}</span>
                    <span className="badge" style={{ color: a.color, borderColor: a.color + '44' }}>
                      CONF {agentConf[i] || 95}%
                    </span>
                  </div>
                  <div style={{ fontSize: 9.5, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.task}>
                    {a.task}
                  </div>
                  <div className="feed-bar" style={{ marginTop: 8 }}>
                    <div style={{ width: (agentProg[i] || 50) + '%', background: a.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
