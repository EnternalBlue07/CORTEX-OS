import React from 'react';

export default function DatasetBar({ datasets, activeDs, setActiveDs, fileRef }) {
  if (datasets.length === 0) return null;

  return (
    <div className="ds-bar">
      {datasets.map((ds, i) => (
        <div
          key={ds.id}
          className={'ds-tab' + (i === activeDs ? ' active' : '')}
          onClick={(e) => {
            e.stopPropagation();
            setActiveDs(i);
          }}
        >
          <span
            className="ds-dot"
            style={{ background: ['#4F46E5', '#7C3AED', '#0891B2', '#059669', '#DC2626'][i % 5] }}
          />
          {ds.name.replace(/\.(csv|xlsx?|tsv|txt)$/i, '').slice(0, 24)}
        </div>
      ))}
      <div
        className="ds-add"
        onClick={(e) => {
          e.stopPropagation();
          fileRef.current && fileRef.current.click();
        }}
      >
        + Upload New Dataset
      </div>
    </div>
  );
}
