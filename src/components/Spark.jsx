import React, { useMemo } from 'react';
import { rand } from '../constants';

export default React.memo(function Spark({ color }) {
  const pts = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => i * 7 + ',' + (16 - rand(2, 14)).toFixed(1)).join(' '),
    []
  );

  return (
    <svg width="58" height="18" style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        style={{
          filter: 'drop-shadow(0 0 4px ' + color + ')',
          strokeDasharray: 120,
          strokeDashoffset: 120,
          animation: 'sparkDraw 1.8s ease forwards',
        }}
      />
    </svg>
  );
});
