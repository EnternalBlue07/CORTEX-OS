import React from 'react';
import { COMMANDS } from '../constants';

export default function CommandPalette({
  palOpen,
  setPalOpen,
  palQ,
  setPalQ,
  palIdx,
  setPalIdx,
  runCommand,
}) {
  if (!palOpen) return null;

  const filtered = COMMANDS.filter((c) =>
    (c[0] + ' ' + c[1]).toLowerCase().includes(palQ.toLowerCase())
  );

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPalIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPalIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[palIdx]) {
      runCommand(filtered[palIdx]);
    }
  };

  return (
    <div className="pal-overlay" onClick={() => setPalOpen(false)}>
      <div className="pal" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="pal-input"
          value={palQ}
          onChange={(e) => {
            setPalQ(e.target.value);
            setPalIdx(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a command or action to execute..."
        />
        <div className="pal-list">
          <div className="pal-cat">SYSTEM CONSOLE COMMANDS</div>
          {filtered.map((c, i) => (
            <div
              key={c[1]}
              className={'pal-item' + (i === palIdx ? ' sel' : '')}
              onMouseEnter={() => setPalIdx(i)}
              onClick={() => runCommand(c)}
            >
              <div>
                <span style={{ color: '#6366F1', fontWeight: 600, marginRight: 8 }}>{c[0]}</span>
                <span style={{ opacity: 0.95 }}>{c[1]}</span>
              </div>
              <span className="pal-sc">{c[2]}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
              No commands found matching "{palQ}"
            </div>
          )}
        </div>
        <div className="pal-foot">
          ↑↓ to navigate · Enter to select · Esc to close
        </div>
      </div>
    </div>
  );
}
