import React from 'react';

export default function PresentationMode({
  present,
  setPresent,
  slide,
  setSlide,
  slides,
}) {
  if (!present || !slides.length) return null;

  const current = slides[slide];

  const goNext = () => setSlide((x) => Math.min(x + 1, slides.length - 1));
  const goPrev = () => setSlide((x) => Math.max(0, x - 1));

  return (
    <div className="present">
      <span className="present-close" onClick={() => setPresent(false)}>
        ×
      </span>
      <div className="present-slide">
        <span className="present-tag">{current.tag}</span>
        {current.title && <div className="present-title">{current.title}</div>}
        {current.big && <div className="present-big">{current.big}</div>}
        {current.sub && <div className="present-sub">{current.sub}</div>}
        {current.list && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', maxWidth: 600, margin: '24px auto 0' }}>
              {current.list.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: 14.5,
                    fontWeight: 500,
                    color: '#334155',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    padding: '12px 20px',
                    width: '100%',
                    textAlign: 'left',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <span style={{ color: '#4F46E5', fontWeight: 700, marginRight: 8 }}>{idx + 1}.</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="present-nav">
        <button className="present-arrow" onClick={goPrev} disabled={slide === 0}>
          ←
        </button>
        <div className="present-dots">
          {slides.map((_, idx) => (
            <i key={idx} className={idx === slide ? 'on' : ''} onClick={() => setSlide(idx)} />
          ))}
        </div>
        <button className="present-arrow" onClick={goNext} disabled={slide === slides.length - 1}>
          →
        </button>
      </div>
    </div>
  );
}
