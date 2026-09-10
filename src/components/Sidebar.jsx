import React from 'react';
import { NAV } from '../constants';

export default function Sidebar({ active, setActive }) {
  return (
    <aside className="cx-side">
      <div className="cx-logo">
        <div>
          <div className="cx-logo-name">CORTEX OS</div>
          <div className="cx-logo-tag">DATA COMPANION</div>
        </div>
      </div>
      <nav className="cx-nav">
        {NAV.map((n, i) => (
          <div key={n[1]} className={'cx-nav-item' + (i === active ? ' active' : '')} onClick={() => setActive(i)}>
            <span className="cx-nav-icon">{n[0]}</span>
            <span className="cx-nav-label">{n[1]}</span>
          </div>
        ))}
      </nav>
      <div className="cx-sys">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
          SYSTEM NOMINAL
        </div>
      </div>
    </aside>
  );
}
