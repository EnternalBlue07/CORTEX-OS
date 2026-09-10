import React, { useState, useEffect } from 'react';
import { BOOT_LINES } from '../constants';

export default function Boot({ flash }) {
  const [t, setT] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setT((x) => x + 100), 50);
    return () => clearInterval(iv);
  }, []);

  const prog = Math.min(Math.max((t - 500) / 1000, 0), 1) * 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: '#0F172A', marginBottom: 4 }}>
          CORTEX OS
        </h1>
        <p style={{ fontSize: 11, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Enterprise Data Utility
        </p>
      </div>

      <div style={{ marginTop: 24, fontFamily: 'JetBrains Mono', fontSize: 11, color: '#94A3B8', width: 240 }}>
        {BOOT_LINES.map((l, i) => t > 500 + i * 200 && (
          <div key={l} style={{ marginBottom: 4 }}>
            <span style={{ color: '#4F46E5' }}>✓</span> {l}
          </div>
        ))}
      </div>

      {t > 500 && (
        <div style={{ width: 200, height: 4, background: '#F1F5F9', marginTop: 24, borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${prog}%`,
              background: '#4F46E5',
              transition: 'width 0.05s linear',
            }}
          />
        </div>
      )}
    </div>
  );
}
