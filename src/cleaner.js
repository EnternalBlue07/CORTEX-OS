import { parseDate } from './engine.js';

/**
 * Clean data rows based on user options and profiled columns.
 * @param {Array} rows - raw parsed rows
 * @param {Array} columns - columns profile array from engine
 * @param {Object} options - cleaning toggles { fillNulls, dropDuplicates, formatDates }
 * @returns {Object} { cleanedRows, stats }
 */
export function cleanDataset(rows, columns, options) {
  let cleaned = JSON.parse(JSON.stringify(rows)); // deep clone
  let nullsFilled = 0;
  let duplicatesRemoved = 0;
  let datesStandardised = 0;

  // 1. Drop Duplicates
  if (options.dropDuplicates) {
    const seen = new Set();
    const uniqueRows = [];
    for (const r of cleaned) {
      const hash = JSON.stringify(r);
      if (seen.has(hash)) {
        duplicatesRemoved++;
      } else {
        seen.add(hash);
        uniqueRows.push(r);
      }
    }
    cleaned = uniqueRows;
  }

  // Calculate means for numeric columns for imputation
  const numericMeans = {};
  if (options.fillNulls) {
    columns.forEach((c) => {
      if (c.type === 'numeric') {
        let sum = 0;
        let count = 0;
        cleaned.forEach((row) => {
          const val = Number(row[c.name]);
          if (!isNaN(val) && row[c.name] !== null && row[c.name] !== '') {
            sum += val;
            count++;
          }
        });
        numericMeans[c.name] = count > 0 ? sum / count : 0;
      }
    });
  }

  // 2. Impute nulls & standardise dates
  cleaned.forEach((row) => {
    columns.forEach((c) => {
      const val = row[c.name];

      // Fill missing numeric values with mean
      if (options.fillNulls && c.type === 'numeric') {
        if (val === null || val === undefined || val === '' || isNaN(Number(val))) {
          row[c.name] = numericMeans[c.name];
          nullsFilled++;
        }
      }

      // Standardise date formatting
      if (options.formatDates && c.type === 'date') {
        if (val !== null && val !== undefined && val !== '') {
          const dt = parseDate(val);
          if (dt) {
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const formatted = `${yyyy}-${mm}-${dd}`;
            if (String(val) !== formatted) {
              row[c.name] = formatted;
              datesStandardised++;
            }
          }
        }
      }
    });
  });

  return {
    cleanedRows: cleaned,
    stats: {
      duplicatesRemoved,
      nullsFilled,
      datesStandardised,
    },
  };
}

/**
 * Convert JSON rows back to CSV string.
 * @param {Array} rows - array of row objects
 * @param {Array} fields - column headers
 * @returns {string} CSV content
 */
export function convertToCSV(rows, fields) {
  if (!rows || !rows.length) return '';
  const headers = fields || Object.keys(rows[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));

  // Add data rows
  for (const r of rows) {
    const values = headers.map((header) => {
      const val = r[header];
      const strVal = val === null || val === undefined ? '' : String(val);
      return `"${strVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Trigger CSV file download in browser.
 */
export function downloadCSV(rows, fields, filename = 'cleaned_dataset.csv') {
  const csvContent = convertToCSV(rows, fields);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Apply a mathematical transformation on a column and append it as a new column.
 * @param {Array} rows - dataset rows
 * @param {string} colName - target column name
 * @param {string} type - type of transform ('log10' | 'zscore' | 'minmax' | 'casing')
 * @returns {Array} updated rows
 */
export function applyTransformation(rows, colName, type) {
  const cleaned = JSON.parse(JSON.stringify(rows));
  const newColName = `${colName}_${type}`;

  // Gather values for numeric statistics
  const numVals = [];
  cleaned.forEach((row) => {
    const val = Number(row[colName]);
    if (!isNaN(val) && row[colName] !== null && row[colName] !== '') {
      numVals.push(val);
    }
  });

  let mean = 0, std = 0, min = 0, max = 0;
  if (numVals.length > 0) {
    min = Math.min(...numVals);
    max = Math.max(...numVals);
    const sum = numVals.reduce((a, b) => a + b, 0);
    mean = sum / numVals.length;
    const sqDiffSum = numVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    std = Math.sqrt(sqDiffSum / numVals.length);
  }

  cleaned.forEach((row) => {
    const val = row[colName];
    if (val === null || val === undefined || val === '') {
      row[newColName] = null;
      return;
    }

    if (type === 'log10') {
      const num = Number(val);
      row[newColName] = num > 0 ? Math.log10(num).toFixed(4) : null;
    } else if (type === 'zscore') {
      const num = Number(val);
      row[newColName] = std > 0 ? ((num - mean) / std).toFixed(4) : 0;
    } else if (type === 'minmax') {
      const num = Number(val);
      row[newColName] = (max - min) > 0 ? ((num - min) / (max - min)).toFixed(4) : 0;
    } else if (type === 'casing') {
      row[newColName] = String(val).trim().toLowerCase();
    }
  });

  return cleaned;
}

