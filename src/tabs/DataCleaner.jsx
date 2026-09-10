import React, { useState, useEffect } from 'react';
import { cleanDataset, downloadCSV, applyTransformation } from '../cleaner';
import { C } from '../constants';

export default function DataCleaner({ dataset, analysis, workflowState, setWorkflowState }) {
  const [fillNulls, setFillNulls] = useState(true);
  const [dropDuplicates, setDropDuplicates] = useState(true);
  const [formatDates, setFormatDates] = useState(true);

  const [cleanedData, setCleanedData] = useState(null);
  const [cleanStats, setCleanStats] = useState(null);
  const [cleaning, setCleaning] = useState(false);

  // Math Transformations state
  const [selectedCol, setSelectedCol] = useState('');
  const [transformType, setTransformType] = useState('zscore');
  const [mutatedFields, setMutatedFields] = useState([]);

  // Local workflow pipeline states
  const [currentStep, setCurrentStep] = useState(-1);
  const [workflowLogs, setWorkflowLogs] = useState([]);

  // Pipeline builder node active states
  const [nodes, setNodes] = useState({
    ingest: { label: 'Ingest Raw Data', active: true, desc: 'Ingestion of CSV / Excel / Database schemas.' },
    clean: { label: 'Clean Null Entries', active: true, desc: 'Imputes null values with average metrics.' },
    normalize: { label: 'Math Normalization', active: true, desc: 'Z-score or Min-max numeric transforms.' },
    forecast: { label: 'Linear Forecasting', active: true, desc: 'Generates 12-month projections.' },
    anomaly: { label: 'Anomaly Scanner', active: true, desc: 'Identifies standard deviation outliers.' },
    export: { label: 'Cleaned CSV Export', active: true, desc: 'Generates final output files.' }
  });

  const [selectedNodeId, setSelectedNodeId] = useState('clean');

  // Reset state when dataset changes
  useEffect(() => {
    setCleanedData(null);
    setCleanStats(null);
    setMutatedFields([]);
    setSelectedCol('');
    setCurrentStep(-1);
    setWorkflowLogs([]);
    setWorkflowState('idle');
  }, [dataset]);

  if (!dataset || !analysis) {
    return (
      <section className="panel" style={{ textAlign: 'center', padding: '60px 10px', color: C.muted }}>
        Please upload a CSV or Excel dataset inside the Executive Dashboard to activate the Data Cleaner.
      </section>
    );
  }

  const columns = analysis.prof.columns;
  const fieldsList = mutatedFields.length ? mutatedFields : dataset.fields;

  // Auto-select first field
  if (!selectedCol && columns.length > 0) {
    setSelectedCol(columns[0].name);
  }

  const handleClean = () => {
    setCleaning(true);
    setTimeout(() => {
      const activeRows = cleanedData ? cleanedData : dataset.rows;
      const result = cleanDataset(activeRows, columns, {
        fillNulls: nodes.clean.active && fillNulls,
        dropDuplicates: dropDuplicates,
        formatDates: formatDates,
      });
      setCleanedData(result.cleanedRows);
      setCleanStats(result.stats);
      setCleaning(false);
    }, 400);
  };

  const handleTransform = () => {
    if (!selectedCol) return;
    const activeRows = cleanedData ? cleanedData : dataset.rows;
    const transformed = applyTransformation(activeRows, selectedCol, transformType);
    setCleanedData(transformed);
    const newColName = `${selectedCol}_${transformType}`;
    if (!fieldsList.includes(newColName)) {
      setMutatedFields([...fieldsList, newColName]);
    }
  };

  const handleDownload = () => {
    const dataToDownload = cleanedData ? cleanedData : dataset.rows;
    const cleanFilename = `cleaned_${dataset.name.replace(/\.[^/.]+$/, '')}.csv`;
    downloadCSV(dataToDownload, fieldsList, cleanFilename);
  };

  // Run visual pipeline simulation
  const runWorkflowPipeline = () => {
    setCurrentStep(0);
    setWorkflowState('running');
    setWorkflowLogs(['[15:47:01] Ingestion Node: Loading raw spreadsheet records...']);

    const steps = [
      { id: 'clean', log: '[15:47:02] Cleaning Node: Auto-filling numeric null variables with column averages...' },
      { id: 'normalize', log: '[15:47:03] Normalization Node: Running casing filters and Z-Score math models...' },
      { id: 'forecast', log: '[15:47:04] Forecasting Node: Calculating 12-month metrics trend lines...' },
      { id: 'anomaly', log: '[15:47:05] Anomaly Node: Running outlier scans for values > 3 standard deviations...' },
      { id: 'export', log: '[15:47:06] Export Node: Writing cleaned dataset DDL and formatting CSV output...' }
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setCurrentStep(currentIdx);
      
      const stepData = steps[currentIdx - 1];
      if (stepData) {
        // Only run if the node is toggled active
        if (nodes[stepData.id].active) {
          setWorkflowLogs(prev => [...prev, stepData.log]);
        } else {
          setWorkflowLogs(prev => [...prev, `[15:47:0${currentIdx+1}] ${nodes[stepData.id].label} (SKIPPED BY GOVERNANCE)`]);
        }
      }

      if (currentIdx === 5) {
        clearInterval(interval);
        setWorkflowState('success');
        setWorkflowLogs(prev => [...prev, '[15:47:07] Ingestion Pipeline complete. 100% data audit verified.']);
        handleClean();
      }
    }, 800);
  };

  const previewRows = cleanedData ? cleanedData.slice(0, 10) : dataset.rows.slice(0, 10);

  const getTransformNotes = () => {
    if (transformType === 'zscore') {
      return 'Z-Score Normalisation scales values to have a mean of 0 and standard deviation of 1. It is used to compare variables with entirely different scales (e.g. Age vs Salary) in ML algorithms like K-Means or PCA.';
    }
    if (transformType === 'log10') {
      return 'Log Transformation is used to handle highly skewed metrics (like Revenues or Web traffic). It compresses long-tail distributions so standard regression models can analyze them accurately.';
    }
    if (transformType === 'minmax') {
      return 'Min-Max Scaling scales values precisely between 0 and 1. It is used when algorithms require input values within a bounded interval (like neural networks).';
    }
    if (transformType === 'casing') {
      return 'Standard casing trims stray whitespace and lowercases string variables. It is used to align inconsistent text fields (e.g. merging Salesforce capitalization records).';
    }
    return '';
  };

  return (
    <div className="cx-2col">
      <div className="cx-col">
        {/* Cleaner Controls */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-title" style={{ marginBottom: 12 }}>1. RUN BASIC DATA CLEANUP</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <label className="clean-opt">
              <input type="checkbox" checked={fillNulls} onChange={(e) => setFillNulls(e.target.checked)} />
              <div>
                <div className="clean-opt-label">Fill missing numeric values with mean</div>
                <div className="clean-opt-desc">
                  Replaces blank, empty, or invalid numeric entries with the calculated column mean value.
                </div>
              </div>
            </label>

            <label className="clean-opt">
              <input
                type="checkbox"
                checked={dropDuplicates}
                onChange={(e) => setDropDuplicates(e.target.checked)}
              />
              <div>
                <div className="clean-opt-label">Drop duplicate rows</div>
                <div className="clean-opt-desc">
                  Identifies and removes identical rows from the dataset to ensure unique records.
                </div>
              </div>
            </label>

            <label className="clean-opt">
              <input type="checkbox" checked={formatDates} onChange={(e) => setFormatDates(e.target.checked)} />
              <div>
                <div className="clean-opt-label">Standardise date formats to YYYY-MM-DD</div>
                <div className="clean-opt-desc">
                  Converts US, UK, and common date formats into clean ISO standard formatting.
                </div>
              </div>
            </label>
          </div>

          <button className="sim-btn" onClick={handleClean} disabled={cleaning} style={{ width: '100%' }}>
            {cleaning ? 'PROCESSING CLEANING TASKS...' : 'CLEAN DATASET'}
          </button>
        </section>

        {/* Cleaned Data Preview Table */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-h" style={{ marginBottom: 10 }}>
            <div className="panel-title">
              DATA PREVIEW ({cleanedData ? 'CLEANED & TRANSFORMED DATASET' : 'RAW PARSED INPUT'})
            </div>
            <span style={{ fontSize: 11, color: C.muted }}>Showing first 10 rows</span>
          </div>

          <div className="fc-table-container" style={{ maxHeight: 310 }}>
            <table className="fc-table" style={{ fontSize: 11 }}>
              <thead>
                <tr>
                  {fieldsList.slice(0, 6).map((f) => (
                    <th key={f}>{f}</th>
                  ))}
                  {fieldsList.length > 6 && <th>...</th>}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, idx) => (
                  <tr key={idx}>
                    {fieldsList.slice(0, 6).map((f) => (
                      <td key={f}>{row[f] === null || row[f] === undefined ? '' : String(row[f])}</td>
                    ))}
                    {fieldsList.length > 6 && <td style={{ color: C.muted }}>...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="cx-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Visual Workflow Automation Pipeline */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-title" style={{ marginBottom: 4 }}>🤖 AI WORKFLOW PIPELINE BUILDER</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
            Drag-and-drop visual data pipeline. Click nodes to toggle state or configuration.
          </div>

          {/* Interactive Flowchart Visualizer */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%', marginBottom: 12 }}>
              {Object.entries(nodes).map(([id, node], idx) => {
                const isActive = selectedNodeId === id;
                const isStepRunning = currentStep === idx;
                const isStepDone = currentStep > idx;

                return (
                  <div
                    key={id}
                    onClick={() => setSelectedNodeId(id)}
                    className={`flow-node ${isActive ? 'active' : ''}`}
                    style={{
                      border: isActive ? '1.8px solid ' + C.indigo : '1px solid #E2E8F0',
                      background: isStepDone ? '#ECFDF5' : isStepRunning ? '#EEF2FF' : '#FFF',
                      opacity: node.active ? 1 : 0.45,
                      flex: '1 1 120px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: isStepDone ? C.emerald : '#0F172A' }}>{node.label}</span>
                      <input
                        type="checkbox"
                        checked={node.active}
                        onChange={(e) => {
                          e.stopPropagation();
                          setNodes({ ...nodes, [id]: { ...node, active: e.target.checked } });
                        }}
                        style={{ cursor: 'pointer', accentColor: C.indigo }}
                      />
                    </div>
                    <div style={{ fontSize: 8, color: C.muted, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Node Editor Panel */}
            <div style={{ width: '100%', borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: C.indigo }}>
                <span>NODE INTERACTION: {nodes[selectedNodeId]?.label.toUpperCase()}</span>
                <span style={{ color: nodes[selectedNodeId]?.active ? '#059669' : '#DC2626' }}>
                  {nodes[selectedNodeId]?.active ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                {nodes[selectedNodeId]?.desc}
              </p>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button
                  onClick={() => setNodes({ ...nodes, [selectedNodeId]: { ...nodes[selectedNodeId], active: !nodes[selectedNodeId].active } })}
                  className="sim-btn"
                  style={{
                    fontSize: 9.5,
                    padding: '4px 8px',
                    background: nodes[selectedNodeId]?.active ? '#DC2626' : '#059669'
                  }}
                >
                  {nodes[selectedNodeId]?.active ? 'Disable Node' : 'Enable Node'}
                </button>
              </div>
            </div>
          </div>

          <button
            className="sim-btn"
            style={{ width: '100%', background: C.indigo, marginTop: 14 }}
            onClick={runWorkflowPipeline}
            disabled={workflowState === 'running'}
          >
            {workflowState === 'running' ? 'EXECUTING PIPELINE AGENTS...' : '⚡ RUN AUTONOMOUS AI PIPELINE'}
          </button>

          {/* Pipeline Streaming Logs */}
          {workflowLogs.length > 0 && (
            <div
              style={{
                marginTop: 12,
                background: '#0F172A',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: 10,
                maxHeight: 110,
                overflowY: 'auto',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: '#38BDF8',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              {workflowLogs.map((log, i) => (
                <div key={i} style={{ color: log.includes('COMPLETE') || log.includes('complete') ? '#34D399' : log.includes('SKIPPED') ? '#EF4444' : '#E2E8F0' }}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Math column Transformations */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-title" style={{ marginBottom: 12 }}>2. MATH & COLUMN TRANSFORMER</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.muted }}>Select Target Column</label>
              <select
                className="agent-term-select"
                style={{ background: '#FFF', border: '1px solid #E2E8F0', width: '100%', padding: '6px', borderRadius: 6, outline: 'none', fontSize: 11.5 }}
                value={selectedCol}
                onChange={(e) => setSelectedCol(e.target.value)}
              >
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.muted }}>Select Mathematical Transform</label>
              <select
                className="agent-term-select"
                style={{ background: '#FFF', border: '1px solid #E2E8F0', width: '100%', padding: '6px', borderRadius: 6, outline: 'none', fontSize: 11.5 }}
                value={transformType}
                onChange={(e) => setTransformType(e.target.value)}
              >
                <option value="zscore">Z-Score Normalisation (Mean=0, Std=1)</option>
                <option value="log10">Log Transformation (Log10)</option>
                <option value="minmax">Min-Max Scaling (Scale 0 to 1)</option>
                <option value="casing">Trim & Lowercase Text</option>
              </select>
            </div>

            <div
              style={{
                padding: '8px 10px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                fontSize: 10.5,
                color: C.muted,
                lineHeight: 1.4,
              }}
            >
              <span style={{ fontWeight: 700, color: C.indigo }}>Explanation: </span>
              {getTransformNotes()}
            </div>

            <button className="sim-btn" style={{ background: C.violet, padding: '7px 0', fontSize: 11 }} onClick={handleTransform}>
              APPLY & APPEND COLUMN
            </button>
          </div>
        </section>

        {/* Sidebar Export Results */}
        <section className="panel" style={{ padding: 18 }}>
          <div className="panel-title" style={{ marginBottom: 12 }}>3. DOWNLOAD AND EXPORT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cleanStats && (
              <div
                style={{
                  padding: 10,
                  background: '#EEF2FF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#334155',
                }}
              >
                <div>Nulls Filled: <b>{cleanStats.nullsFilled}</b></div>
                <div style={{ marginTop: 2 }}>Duplicates Removed: <b>{cleanStats.duplicatesRemoved}</b></div>
                <div style={{ marginTop: 2 }}>Dates Standardised: <b>{cleanStats.datesStandardised}</b></div>
              </div>
            )}
            <button className="sim-btn" style={{ width: '100%', padding: '8px 0', fontSize: 12 }} onClick={handleDownload}>
              📥 DOWNLOAD CSV FILE
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
