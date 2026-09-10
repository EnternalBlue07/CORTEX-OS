import React from 'react';
import { NAV } from '../constants';

export default function TopBar({ active, setPalOpen, tick, now, sysState }) {
  return (
    <header className="cx-top">
      <div>
        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Cortex Audit Hub
        </div>
        <div className="cx-module">{NAV[active][1]}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="cx-omni" onClick={() => setPalOpen(true)}>
          <span className="cx-kbd">⌘K</span>
          <span>Search actions...</span>
        </div>
        <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'JetBrains Mono' }}>
          {now.toLocaleTimeString('en-GB')}
        </div>
        <div className="cx-avatar">EX</div>
      </div>
    </header>
  );
}
