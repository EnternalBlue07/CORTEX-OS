import React from 'react';

export default function ReasoningFeed({ chain, thoughts }) {
  return (
    <section className="panel">
      <div className="panel-h">
        <div className="panel-title">
          <span className="cx-dot" />
          LIVE AI REASONING
        </div>
        <div className="live-chip">● LIVE</div>
      </div>
      <div className="chain">
        {chain.map((c, i) => (
          <React.Fragment key={c + '-' + i}>
            {i > 0 && <span className="chain-link" />}
            <span className="chain-node" style={{ animationDelay: i * 0.12 + 's' }}>
              {c}
            </span>
          </React.Fragment>
        ))}
      </div>
      {thoughts.map((t) => (
        <div className="feed-item" key={t.id}>
          <div className="feed-meta">
            <span className="feed-type">{t.type}</span>
            <span>
              {t.time} · <span className="feed-conf">{t.conf}%</span>
            </span>
          </div>
          <div className="feed-text">{t.text}</div>
          <div className="feed-bar">
            <div style={{ width: t.conf + '%' }} />
          </div>
        </div>
      ))}
    </section>
  );
}
