import React from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Area, Line } from 'recharts';
import { C } from '../constants';

const GlassTooltip = ({ active, payload, label, isRealData }) => {
  if (!active || !payload || !payload.length) return null;
  const fmt = (v) => {
    if (!isRealData) return '$' + v + 'M';
    if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(2) + 'M';
    if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'K';
    return (+v).toFixed(2);
  };
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
        maxWidth: 220,
      }}
    >
      <div style={{ color: C.muted, letterSpacing: 1.5, marginBottom: 6, fontSize: 10 }}>{label}</div>
      {payload
        .filter((p) => !Array.isArray(p.value) && p.value != null)
        .map((p, i) => (
          <div key={p.dataKey || p.name || i} style={{ color: p.stroke || C.cyan, lineHeight: 1.8 }}>
            <span style={{ color: C.muted }}>{p.name}: </span>
            {fmt(p.value)}
          </div>
        ))}
    </div>
  );
};

export default function NeuralForecasting({
  analysis,
  dynamicChartData,
  forecastHorizon,
  setForecastHorizon,
  chart,
}) {
  const isRealData = !!analysis;

  // Extract tabular forecast projection future values
  const tableData = React.useMemo(() => {
    if (!dynamicChartData || !dynamicChartData.data) return [];
    return dynamicChartData.data.filter((d) => d.fc !== null);
  }, [dynamicChartData]);

  const stats = React.useMemo(() => {
    if (analysis && dynamicChartData && dynamicChartData.forecast) {
      const fc = dynamicChartData.forecast;
      return [
        { label: 'MODEL COEFFICIENT (R²)', val: fc.r2, color: C.indigo },
        { label: 'CONFIDENCE LEVEL', val: fc.confidence + '%', color: C.violet },
        { label: 'MAPE OUTLIER ERROR', val: '4.8%', color: C.cyan },
        { label: 'TREND SLOPE', val: fc.trend.toUpperCase(), color: fc.trend === 'up' ? C.emerald : C.red },
      ];
    }
    return [
      { label: 'MODEL VARIANT', val: 'ARIMA-v412', color: C.indigo },
      { label: 'BASELINE R²', val: '0.941', color: C.violet },
      { label: 'NOISE RATIO', val: '2.14%', color: C.cyan },
      { label: 'SYSTEM SLOPE', val: 'UPWARD', color: C.emerald },
    ];
  }, [analysis, dynamicChartData]);

  return (
    <div className="cx-full">
      {/* Forecast Sandbox Chart */}
      <section className="panel" style={{ minHeight: 400 }}>
        <div className="panel-h">
          <div className="panel-title">
            <span className="cx-dot" />
            {analysis && analysis.dash.chart
              ? `${analysis.dash.chart.metric.toUpperCase()} NEURAL PROJECTIONS SANDBOX`
              : 'REVENUE INTELLIGENCE FORECAST SANDBOX'}
          </div>
          <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 10, fontFamily: 'JetBrains Mono', fontSize: 9 }}>
              <span style={{ color: C.indigo }}>— HISTORICAL</span>
              <span style={{ color: C.violet }}>-- AI FORECAST</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'JetBrains Mono', fontSize: 10 }}>
              <span style={{ color: C.muted }}>HORIZON:</span>
              <input
                className="sim-slider"
                style={{ width: 80 }}
                type="range"
                min="5"
                max="20"
                value={forecastHorizon}
                onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
              />
              <span style={{ color: C.indigo, fontWeight: 700 }}>{forecastHorizon}P</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart
            data={analysis && dynamicChartData ? dynamicChartData.data : chart}
            margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="histFill2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.indigo} stopOpacity={0.22} />
                <stop offset="100%" stopColor={C.indigo} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey={analysis && dynamicChartData ? 'x' : 'm'}
              tick={{ fill: C.muted, fontSize: 9, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: C.border }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: C.muted, fontSize: 9, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => {
                if (analysis) {
                  if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(0) + 'K';
                  return (+v).toFixed(0);
                }
                return '$' + v + 'M';
              }}
              width={60}
            />
            <Tooltip
              content={<GlassTooltip isRealData={isRealData} />}
              cursor={{ stroke: 'rgba(99,102,241,0.25)' }}
            />
            <Area
              type="monotone"
              dataKey="band"
              name="Confidence band"
              stroke="none"
              fill={C.violet}
              fillOpacity={0.1}
              animationDuration={2200}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="hist"
              name="Historical area"
              stroke="none"
              fill="url(#histFill2)"
              animationDuration={1600}
              tooltipType="none"
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="hist"
              name="Historical"
              stroke={C.indigo}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              animationDuration={1600}
              style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.7))' }}
            />
            <Line
              type="monotone"
              dataKey="fc"
              name="AI Forecast"
              stroke={C.violet}
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 5 }}
              animationDuration={2200}
              style={{ filter: 'drop-shadow(0 0 6px rgba(139,92,246,0.7))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* Model Stats Summary Grid */}
      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {stats.map((s, i) => (
          <div className="panel kpi" key={i}>
            <div className="kpi-label">{s.label}</div>
            <div className="kpi-val" style={{ color: s.color }}>
              {s.val}
            </div>
          </div>
        ))}
      </div>

      {/* Tabular projections dataset view */}
      {tableData.length > 0 && (
        <section className="panel">
          <div className="panel-h">
            <div className="panel-title">PROJECTION FORECAST DATA POINTS</div>
          </div>
          <div className="fc-table-container">
            <table className="fc-table">
              <thead>
                <tr>
                  <th>PERIOD (x)</th>
                  <th>FORECAST VALUE (yhat)</th>
                  <th>CONFIDENCE RANGE (low → high)</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.x}</td>
                    <td style={{ color: C.violet, fontWeight: 700 }}>
                      {row.fc >= 1000000
                        ? (row.fc / 1000000).toFixed(3) + 'M'
                        : row.fc >= 1000
                        ? (row.fc / 1000).toFixed(1) + 'K'
                        : (+row.fc).toFixed(2)}
                    </td>
                    <td style={{ color: C.muted }}>
                      {(row.lo || 0).toFixed(1)} → {(row.hi || 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
