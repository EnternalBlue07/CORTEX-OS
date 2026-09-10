import React from 'react';
import { C } from '../constants';

const GOV_RECORDS = [
  { id: 'REC-901', system: 'Snowflake Ingestion', action: 'Schema Profile Check', user: 'Revenue Swarm', status: 'VERIFIED', time: '14:22:11' },
  { id: 'REC-902', system: 'Stripe API Sync', action: 'Data Integrity Audit', user: 'Risk Agent', status: 'VERIFIED', time: '14:19:04' },
  { id: 'REC-903', system: 'SAP Connectors', action: 'Key-Constraints Sweep', user: 'Report Agent', status: 'WARN', time: '13:40:19' },
  { id: 'REC-904', system: 'Cortex OS', action: 'Scenario Sandbox Simulation', user: 'EXECUTIVE', status: 'LOGGED', time: '12:12:00' },
  { id: 'REC-905', system: 'Salesforce API', action: 'Account Drift Sync', user: 'Revenue Swarm', status: 'VERIFIED', time: '10:04:12' },
];

export default function GovernanceLayer({ govSearch, setGovSearch }) {
  const filtered = GOV_RECORDS.filter(
    (r) =>
      r.id.toLowerCase().includes(govSearch.toLowerCase()) ||
      r.system.toLowerCase().includes(govSearch.toLowerCase()) ||
      r.action.toLowerCase().includes(govSearch.toLowerCase()) ||
      r.user.toLowerCase().includes(govSearch.toLowerCase())
  );

  return (
    <div className="cx-full">
      <section className="panel">
        <div className="panel-h">
          <div className="panel-title">
            <span className="cx-dot" />
            ENTERPRISE GOVERNANCE & SOX AUDIT TRAILS
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="chat-input"
              style={{
                background: 'rgba(3,7,18,0.5)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#fff',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: 'JetBrains Mono',
                width: 220,
              }}
              value={govSearch}
              onChange={(e) => setGovSearch(e.target.value)}
              placeholder="Search audit trail records..."
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>RECORD ID</th>
                <th>SYSTEM MODULE</th>
                <th>AUDIT ACTION</th>
                <th>AUTHORIZED BY</th>
                <th>COMPLIANCE STATUS</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td style={{ color: C.indigo, fontWeight: 700 }}>{row.id}</td>
                  <td>{row.system}</td>
                  <td>{row.action}</td>
                  <td>{row.user}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: 8,
                        letterSpacing: 1,
                        padding: '2px 6px',
                        borderRadius: 5,
                        background:
                          row.status === 'VERIFIED'
                            ? 'rgba(16,185,129,0.08)'
                            : row.status === 'WARN'
                            ? 'rgba(245,158,11,0.08)'
                            : 'rgba(99,102,241,0.08)',
                        color:
                          row.status === 'VERIFIED'
                            ? C.emerald
                            : row.status === 'WARN'
                            ? C.amber
                            : C.indigo,
                        border: '1px solid currentColor',
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ color: C.muted }}>{row.time}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: C.muted, padding: '20px 0' }}>
                    No audit records matching "{govSearch}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
