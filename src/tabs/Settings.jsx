import React, { useState } from 'react';
import { C } from '../constants';

export default function Settings({
  anomalySensitivity,
  setAnomalySensitivity,
  profileSampleSize,
  setProfileSampleSize,
  industryMode,
  setIndustryMode,
  immersiveMode,
  setImmersiveMode
}) {
  const [dataMasking, setDataMasking] = useState('Mask emails');
  const [complianceCheck, setComplianceCheck] = useState(true);

  return (
    <div className="cx-full">
      <section className="panel" style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        <div className="panel-h" style={{ marginBottom: 16 }}>
          <div className="panel-title">SYSTEM THRESHOLDS & INGESTION PARAMETERS</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 12 }}>
          
          {/* OMEGA Immersive 3D Toggle */}
          <div style={{ padding: 12, border: '1px solid #C7D2FE', background: '#EEF2FF', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.indigo }}>ENGAGE IMMERSIVE 3D SPACE</div>
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>
                Enables canvas-based spatial topology starfield representation.
              </div>
            </div>
            <button
              onClick={() => setImmersiveMode(!immersiveMode)}
              className="sim-btn"
              style={{ background: immersiveMode ? '#EF4444' : C.indigo, fontSize: 11, padding: '6px 12px' }}
            >
              {immersiveMode ? 'STAND DOWN 3D' : 'ENTER 3D SPACE'}
            </button>
          </div>

          {/* Industry Mode Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>Industry-Specific Analytics Mode</label>
            <select
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                width: '100%',
                outline: 'none',
                cursor: 'pointer',
                color: '#0F172A'
              }}
              value={industryMode}
              onChange={(e) => setIndustryMode(e.target.value)}
            >
              <option value="saas">SaaS & Technology (MRR, Churn, LTV, ARR)</option>
              <option value="retail">Retail & E-commerce (GMV, AOV, Conversion, Refunds)</option>
              <option value="finance">Finance & Payments (Transaction Vol, Fraud Rate, Margin)</option>
              <option value="logistics">Logistics & Fleet (Tonnage, Fleet Load, Port Delays)</option>
            </select>
            <div style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.4 }}>
              Configuring the industry mode overrides the default KPI indicators, storytelling briefs, and chart metric names automatically across all dashboard workspaces.
            </div>
          </div>

          {/* Governance & sensitive data masking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>Enterprise Data Masking Level</label>
            <select
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                width: '100%',
                outline: 'none',
                cursor: 'pointer',
                color: '#0F172A'
              }}
              value={dataMasking}
              onChange={(e) => setDataMasking(e.target.value)}
            >
              <option value="Disabled">Disabled (Full Raw Ingestion)</option>
              <option value="Mask emails">Mask PII & Email domains (SHA-256)</option>
              <option value="Mask amounts">Mask amounts above $50K threshold</option>
              <option value="Redact all IDs">Redact all primary keys and UUIDs</option>
            </select>
          </div>

          <label className="clean-opt" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={complianceCheck} onChange={(e) => setComplianceCheck(e.target.checked)} style={{ cursor: 'pointer', accentColor: C.indigo }} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>Enable SOC2 / GDPR Compliance Auditing</div>
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>
                Ensures all pipeline transformations write metadata checksum hashes to the local vault ledger.
              </div>
            </div>
          </label>

          {/* Anomaly Z-Score Sensitivity Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600 }}>
              <span>Anomaly Z-Score Sensitivity Threshold</span>
              <span style={{ color: C.indigo, fontWeight: 700 }}>{anomalySensitivity} Z</span>
            </div>
            <input
              type="range"
              className="sim-slider"
              min="1.5"
              max="4.5"
              step="0.1"
              value={anomalySensitivity}
              onChange={(e) => setAnomalySensitivity(parseFloat(e.target.value))}
              style={{ accentColor: C.indigo }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted }}>
              <span>1.5 Z (Higher Sensitivity)</span>
              <span>4.5 Z (Lower Sensitivity)</span>
            </div>
          </div>

          {/* Profile Sample Size Slider */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600 }}>
              <span>Row Limit Profile Sample Size</span>
              <span style={{ color: C.violet, fontWeight: 700 }}>
                {profileSampleSize.toLocaleString()} Rows
              </span>
            </div>
            <input
              type="range"
              className="sim-slider"
              min="1000"
              max="50000"
              step="1000"
              value={profileSampleSize}
              onChange={(e) => setProfileSampleSize(parseInt(e.target.value))}
              style={{ accentColor: C.violet }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted }}>
              <span>1,000 Rows</span>
              <span>50,000 Rows</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
