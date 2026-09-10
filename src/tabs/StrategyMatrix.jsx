import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { C } from '../constants';

const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: 'rgba(8,16,32,0.97)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 10,
        padding: '10px 13px',
        fontFamily: 'JetBrains Mono',
        fontSize: 11,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{ color: C.muted, letterSpacing: 1, marginBottom: 6, fontSize: 10 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, lineHeight: 1.8 }}>
          <span style={{ color: C.muted }}>{p.name}: </span>
          {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
};

export default function StrategyMatrix({
  simDiscount,
  setSimDiscount,
  simMarketing,
  setSimMarketing,
  simLogistics,
  setSimLogistics,
  simulationResults,
}) {
  const { baselines, simulated, deltas } = simulationResults;

  // Format data for comparison chart
  const chartData = [
    { name: 'Revenue', Base: baselines.rev, Simulated: simulated.rev },
    { name: 'Margin Rate', Base: baselines.margin, Simulated: simulated.margin },
    { name: 'Churn Rate', Base: baselines.churn, Simulated: simulated.churn },
    { name: 'Risk Score', Base: baselines.risk, Simulated: simulated.risk },
  ];

  return (
    <div className="cx-2col-left">
      {/* Simulation Inputs Left Sidebar */}
      <div className="cx-col">
        <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="panel-h" style={{ marginBottom: 0 }}>
            <div className="panel-title">
              <span className="cx-dot" />
              SCENARIO WHAT-IF SIMULATOR
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: 10.5 }}>
              <span>PRICING DISCOUNT</span>
              <span style={{ color: C.indigo, fontWeight: 700 }}>{simDiscount}%</span>
            </div>
            <input
              type="range"
              className="sim-slider"
              min="-10"
              max="10"
              value={simDiscount}
              onChange={(e) => setSimDiscount(parseInt(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted }}>
              <span>-10% (Tighter margins)</span>
              <span>+10% (High discount)</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: 10.5 }}>
              <span>MARKETING BUDGET</span>
              <span style={{ color: C.violet, fontWeight: 700 }}>+{simMarketing}%</span>
            </div>
            <input
              type="range"
              className="sim-slider"
              min="-20"
              max="50"
              value={simMarketing}
              onChange={(e) => setSimMarketing(parseInt(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted }}>
              <span>-20% Cut</span>
              <span>+50% Aggressive Spend</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: 10.5 }}>
              <span>LOGISTICS OVERHEAD</span>
              <span style={{ color: C.cyan, fontWeight: 700 }}>{simLogistics}%</span>
            </div>
            <input
              type="range"
              className="sim-slider"
              min="-30"
              max="30"
              value={simLogistics}
              onChange={(e) => setSimLogistics(parseInt(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted }}>
              <span>-30% Supply Optimization</span>
              <span>+30% Lag Overhead</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: C.muted, lineHeight: 1.45 }}>
              Modelling counter-factual parameters executes multi-variable linear adjustments over active revenue clusters.
            </div>
          </div>
        </section>
      </div>

      {/* Simulation Results Main Panel */}
      <div className="cx-col">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <div className="panel kpi">
            <div className="kpi-label">SIM REVENUE</div>
            <div className="kpi-val" style={{ color: C.indigo }}>
              ${simulated.rev.toFixed(1)}M
            </div>
            <div className="kpi-delta" style={{ color: deltas.rev >= 0 ? C.emerald : C.red }}>
              {deltas.rev >= 0 ? '+' : ''}
              {deltas.rev.toFixed(1)}%
            </div>
          </div>

          <div className="panel kpi">
            <div className="kpi-label">SIM MARGIN RATE</div>
            <div className="kpi-val" style={{ color: C.violet }}>
              {simulated.margin.toFixed(1)}%
            </div>
            <div className="kpi-delta" style={{ color: deltas.margin >= 0 ? C.emerald : C.red }}>
              {deltas.margin >= 0 ? '+' : ''}
              {deltas.margin.toFixed(1)}%
            </div>
          </div>

          <div className="panel kpi">
            <div className="kpi-label">SIM CHURN RATE</div>
            <div className="kpi-val" style={{ color: C.cyan }}>
              {simulated.churn.toFixed(2)}%
            </div>
            <div className="kpi-delta" style={{ color: deltas.churn <= 0 ? C.emerald : C.red }}>
              {deltas.churn >= 0 ? '+' : ''}
              {deltas.churn.toFixed(2)}%
            </div>
          </div>

          <div className="panel kpi">
            <div className="kpi-label">SIM RISK SCORE</div>
            <div className="kpi-val" style={{ color: C.red }}>
              {simulated.risk.toFixed(1)}/100
            </div>
            <div className="kpi-delta" style={{ color: deltas.risk <= 0 ? C.emerald : C.red }}>
              {deltas.risk >= 0 ? '+' : ''}
              {deltas.risk.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Comparison chart */}
        <section className="panel" style={{ minHeight: 300 }}>
          <div className="panel-h">
            <div className="panel-title">SCENARIO DEVIATION COMPARISON</div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 9.5, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 9.5, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
              <Bar dataKey="Base" fill={C.indigo} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Simulated" fill={C.violet} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}
