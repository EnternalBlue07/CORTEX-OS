import React, { useState, useEffect } from 'react';
import Spark from './Spark';
import { rand } from '../constants';

export default function KpiCard({ k, i }) {
  const [v, setV] = useState(0);

  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const step = (ts) => {
      const p = Math.min((ts - t0) / 1700, 1);
      setV(k.target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const iv = setInterval(() => setV((x) => Math.max(0, x + rand(-k.jit, k.jit))), 4200);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(iv);
    };
  }, [k]);

  return (
    <div className="panel kpi" style={{ animationDelay: i * 0.08 + 's' }}>
      <div className="kpi-label">{k.label}</div>
      <div className="kpi-val" style={{ color: k.color, textShadow: '0 0 22px ' + k.color + '55' }}>
        {k.fmt(v)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="kpi-delta">{k.delta}</span>
        <Spark color={k.color} />
      </div>
    </div>
  );
}
