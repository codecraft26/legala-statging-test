// Utility functions for handling extraction model responses

export interface ExtractionData {
  [key: string]: any;
}

export interface TableColumn {
  key: string;
  originalKey?: string; // The original key from the data
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean';
}

export interface TableData {
  columns: TableColumn[];
  rows: ExtractionData[];
}

/**
 * Detects if a response is from an extraction model based on content structure
 * Extraction responses typically contain structured data that can be displayed in a table
 */
export function isExtractionResponse(content: string): boolean {
  try {
    // Clean the content first (remove citation codes)
    const cleanContent = content.replace(/\[\[C:[^\]]+\]\]/g, '');
    
    // Try to parse as JSON first
    try {
      const data = JSON.parse(cleanContent);
      return isStructuredData(data);
    } catch {
      // If not JSON, check if it looks like structured data
      return isStructuredTextData(cleanContent);
    }
  } catch {
    return false;
  }
}

/**
 * Checks if parsed data is structured and suitable for table display
 */
function isStructuredData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  // Check if it's an array of objects (most common extraction format)
  if (Array.isArray(data)) {
    return data.length > 0 && 
           data.every(item => typeof item === 'object' && item !== null) &&
           data.some(item => Object.keys(item).length > 0);
  }
  
  // Check if it's a single object with multiple properties
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    return keys.length > 1 && 
           keys.some(key => data[key] !== null && data[key] !== undefined);
  }
  
  return false;
}

/**
 * Checks if text content looks like structured data (key-value pairs, etc.)
 */
function isStructuredTextData(content: string): boolean {
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return false;
  
  // Check for common patterns:
  // 1. Key-value pairs with colons
  const keyValuePattern = /^[^:]+:\s*.+$/;
  const keyValueLines = lines.filter(line => keyValuePattern.test(line.trim()));
  
  // 2. Table-like structure with separators
  const separatorPattern = /^[^|]+\|[^|]+/;
  const separatorLines = lines.filter(line => separatorPattern.test(line.trim()));
  
  // 3. JSON-like structure in text
  const jsonLikePattern = /^\s*[\{\[].*[\}\]]\s*$/;
  const jsonLikeLines = lines.filter(line => jsonLikePattern.test(line.trim()));
  
  return keyValueLines.length >= 2 || 
         separatorLines.length >= 2 || 
         jsonLikeLines.length >= 1;
}

/**
 * Converts extraction response content to table data format
 */
export function parseExtractionData(content: string): TableData | null {
  try {
    if (!content || typeof content !== 'string') {
      return null;
    }
    
    const cleanContent = content.replace(/\[\[C:[^\]]+\]\]/g, '');
    
    // Try to parse as JSON first
    try {
      const data = JSON.parse(cleanContent);
      const result = convertToTableData(data);
      return result;
    } catch {
      // Try to parse as structured text
      return parseStructuredText(cleanContent);
    }
  } catch (error) {
    console.warn('Error parsing extraction data:', error);
    return null;
  }
}

/**
 * Converts parsed data to table format
 */
function convertToTableData(data: any): TableData | null {
  try {
    if (!data) return null;
    
    let rows: ExtractionData[] = [];
    let columns: TableColumn[] = [];
    
    if (Array.isArray(data)) {
      // Array of objects
      if (data.length === 0) return null;
      
      // Filter out invalid items
      const validItems = data.filter(item => typeof item === 'object' && item !== null);
      if (validItems.length === 0) return null;
      
      rows = validItems;
      const allKeys = new Set<string>();
      validItems.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });
      
      if (allKeys.size === 0) return null;
      
      columns = Array.from(allKeys).map((key, index) => ({
        key: generateUniqueKey(key, index, Array.from(allKeys)),
        originalKey: key,
        label: formatColumnLabel(key),
        type: inferColumnType(validItems, key)
      }));
    } else if (typeof data === 'object') {
      // Single object - convert to single row
      const keys = Object.keys(data);
      if (keys.length === 0) return null;
      
      rows = [data];
      columns = keys.map((key, index) => ({
        key: generateUniqueKey(key, index, keys),
        originalKey: key,
        label: formatColumnLabel(key),
        type: inferColumnType([data], key)
      }));
    } else {
      return null;
    }
    
    // Validate the result
    if (columns.length === 0 || rows.length === 0) {
      return null;
    }
    
    return { columns, rows };
  } catch (error) {
    console.warn('Error converting to table data:', error);
    return null;
  }
}

/**
 * Parses structured text data into table format
 */
function parseStructuredText(content: string): TableData | null {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Try markdown Description/Value format first (## Header followed by - **Description:** and - **Value:**)
  const markdownDescValuePattern = /^##\s+(.+)$/;
  const descPattern = /^-\s+\*\*Description:\*\*\s*(.+)$/i;
  const valuePatternWithBacktick = /^-\s+\*\*Value:\*\*\s*`([^`]+)`\s*$/i;
  const valuePatternWithoutBacktick = /^-\s+\*\*Value:\*\*\s*(.+)$/i;
  
  let currentSection: string | null = null;
  let currentDesc: string | null = null;
  const rows: ExtractionData[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for section header (## Header)
    const sectionMatch = line.match(markdownDescValuePattern);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      currentDesc = null;
      continue;
    }
    
    // Check for Description line
    const descMatch = line.match(descPattern);
    if (descMatch) {
      currentDesc = descMatch[1].trim();
      continue;
    }
    
    // Check for Value line (try backticked first, then non-backticked)
    let valueMatch = line.match(valuePatternWithBacktick);
    if (!valueMatch) {
      valueMatch = line.match(valuePatternWithoutBacktick);
    }
    
    if (valueMatch && currentSection && currentDesc) {
      const value = valueMatch[1].trim();
      
      if (value) {
        // Create a row for this section
        rows.push({
          'Section': currentSection,
          'Description': currentDesc,
          'Value': value
        });
      }
      
      currentSection = null;
      currentDesc = null;
    }
  }
  
  if (rows.length > 0) {
    const columns: TableColumn[] = [
      { key: 'section', originalKey: 'Section', label: 'Section', type: 'text' },
      { key: 'description', originalKey: 'Description', label: 'Description', type: 'text' },
      { key: 'value', originalKey: 'Value', label: 'Value', type: 'text' }
    ];
    
    return { columns, rows };
  }
  
  // Try key-value pairs
  const keyValuePattern = /^([^:]+):\s*(.+)$/;
  const keyValueLines = lines.filter(line => keyValuePattern.test(line.trim()));
  
  if (keyValueLines.length >= 2) {
    const row: ExtractionData = {};
    const columns: TableColumn[] = [];
    
    const allKeys: string[] = [];
    keyValueLines.forEach((line, index) => {
      const match = line.trim().match(keyValuePattern);
      if (match) {
        const key = match[1].trim();
        allKeys.push(key);
      }
    });
    
    keyValueLines.forEach((line, index) => {
      const match = line.trim().match(keyValuePattern);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        row[key] = value;
        columns.push({
          key: generateUniqueKey(key, index, allKeys),
          originalKey: key,
          label: formatColumnLabel(key),
          type: 'text'
        });
      }
    });
    
    return { columns, rows: [row] };
  }
  
  // Try table format with separators
  const separatorPattern = /^[^|]+\|[^|]+/;
  const separatorLines = lines.filter(line => separatorPattern.test(line.trim()));
  
  if (separatorLines.length >= 2) {
    const rows: ExtractionData[] = [];
    const columns: TableColumn[] = [];
    
    separatorLines.forEach((line, index) => {
      const cells = line.split('|').map(cell => cell.trim());
      
      if (index === 0) {
        // First line is headers
        const allKeys: string[] = [];
        cells.forEach((cell) => {
          if (cell) {
            const originalKey = cell.toLowerCase().replace(/\s+/g, '_');
            allKeys.push(originalKey);
          }
        });
        
        cells.forEach((cell, cellIndex) => {
          if (cell) {
            const originalKey = cell.toLowerCase().replace(/\s+/g, '_');
            columns.push({
              key: generateUniqueKey(originalKey, cellIndex, allKeys),
              originalKey: originalKey,
              label: cell,
              type: 'text'
            });
          }
        });
      } else {
        // Data rows
        const row: ExtractionData = {};
        cells.forEach((cell, cellIndex) => {
          if (columns[cellIndex]) {
            const originalKey = columns[cellIndex].originalKey || columns[cellIndex].key;
            row[originalKey] = cell;
          }
        });
        if (Object.keys(row).length > 0) {
          rows.push(row);
        }
      }
    });
    
    return { columns, rows };
  }
  
  return null;
}

/**
 * Generates a unique key for table columns to prevent React key conflicts
 */
function generateUniqueKey(key: string, index: number, allKeys: string[]): string {
  // If the key is unique, use it as is
  if (allKeys.indexOf(key) === index) {
    return key;
  }
  
  // If there are duplicates, append index to make it unique
  return `${key}_${index}`;
}

/**
 * Formats column labels for display
 */
function formatColumnLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Infers the data type of a column based on sample data
 */
function inferColumnType(data: ExtractionData[], key: string): 'text' | 'number' | 'date' | 'boolean' {
  const values = data
    .map(item => item[key])
    .filter(value => value !== null && value !== undefined);
  
  if (values.length === 0) return 'text';
  
  // Check for numbers
  if (values.every(value => typeof value === 'number' || !isNaN(Number(value)))) {
    return 'number';
  }
  
  // Check for dates
  if (values.every(value => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  })) {
    return 'date';
  }
  
  // Check for booleans
  if (values.every(value => 
    typeof value === 'boolean' || 
    value === 'true' || value === 'false' ||
    value === 'yes' || value === 'no'
  )) {
    return 'boolean';
  }
  
  return 'text';
}

/**
 * Converts table data to CSV format
 */
export function tableDataToCSV(tableData: TableData): string {
  try {
    if (!tableData || !tableData.columns || !tableData.rows) {
      throw new Error('Invalid table data');
    }
    
    const { columns, rows } = tableData;
    
    if (!Array.isArray(columns) || !Array.isArray(rows)) {
      throw new Error('Columns and rows must be arrays');
    }
    
    // For very large datasets, process in chunks to avoid memory issues
    const CHUNK_SIZE = 1000;
    const chunks: string[] = [];
    
    // Create header row
    const headerRow = columns.map(col => {
      if (!col || !col.label) return '""';
      return `"${String(col.label).replace(/"/g, '""')}"`;
    }).join(',');
    
    chunks.push(headerRow);
    
    // Process rows in chunks
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const chunkRows = chunk.map(row => 
        columns.map(col => {
          if (!col || !col.key) return '""';
          const dataKey = col.originalKey || col.key;
          const value = row[dataKey];
          if (value === null || value === undefined) return '""';
          
          // Escape quotes and wrap in quotes
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        }).join(',')
      );
      chunks.push(...chunkRows);
    }
    
    return chunks.join('\n');
  } catch (error) {
    console.error('Error converting table data to CSV:', error);
    return 'Error: Could not convert data to CSV format';
  }
}

/**
 * Downloads CSV data as a file
 */
export function downloadCSV(csvContent: string, filename: string = 'extraction_data.csv'): void {
  try {
    if (!csvContent || typeof csvContent !== 'string') {
      throw new Error('Invalid CSV content');
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      throw new Error('Download not supported');
    }
  } catch (error) {
    console.error('Error downloading CSV:', error);
    // Fallback: try to open in new window
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (fallbackError) {
      console.error('Fallback download also failed:', fallbackError);
    }
  }
}
