import React from 'react';

const MsgBody = ({ text, streaming }) => (
  <div>
    {text.split('\n').map((l, i) => {
      let cls = 'msg-line';
      if (l.startsWith('•') || /^\d+\./.test(l)) cls += ' b';
      else if (l.startsWith('SOURCES')) cls += ' src';
      else if (l.length > 3 && l === l.toUpperCase() && /[A-Z]{4,}/.test(l)) cls += ' h';
      return <div key={i} className={cls}>{l || ' '}</div>;
    })}
    {streaming && <span className="caret" />}
  </div>
);

export default function ChatPanel({
  chatOpen,
  setChatOpen,
  messages,
  input,
  setInput,
  typing,
  send,
  chatRef,
}) {
  return (
    <div className={'chat' + (chatOpen ? ' open' : '')}>
      <div className="chat-h">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div className="cx-core-ring" style={{ width: 14, height: 14, borderWidth: 1.5, borderColor: '#6366F1' }} />
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 13, letterSpacing: 1.5 }}>CORTEX CO-PILOT</span>
        </div>
        <span onClick={() => setChatOpen(false)} style={{ cursor: 'pointer', color: '#64748B', fontSize: 20 }}>
          ×
        </span>
      </div>
      <div className="chat-body" ref={chatRef}>
        {messages.map((m, i) => (
          <div key={i} className={'msg ' + m.role}>
            <div className="msg-bubble">
              <MsgBody text={m.text} streaming={typing && i === messages.length - 1 && m.role === 'ai'} />
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask CORTEX about anomalies, strategy, margin..."
          disabled={typing}
        />
        <button className="chat-send" onClick={send} disabled={typing}>
          RUN
        </button>
      </div>
    </div>
  );
}
