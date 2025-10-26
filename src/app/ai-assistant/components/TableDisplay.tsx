"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { TableData, tableDataToCSV, downloadCSV } from '@/lib/extraction-utils';

interface TableDisplayProps {
  data: TableData;
  title?: string;
  className?: string;
}

export function TableDisplay({ data, title = "Extracted Data", className = "" }: TableDisplayProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Validate data structure
  if (!data || !data.columns || !data.rows || !Array.isArray(data.columns) || !Array.isArray(data.rows)) {
    return (
      <div className={`border rounded-lg p-4 ${className}`}>
        <div className="text-center text-muted-foreground">
          <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Invalid data format</p>
        </div>
      </div>
    );
  }
  
  const { columns, rows } = data;
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const displayRows = rows.slice(startIndex, endIndex);
  
  // Reset to first page when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data]);
  
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      
      // Validate data before export
      if (!data || !data.columns || !data.rows || data.columns.length === 0 || data.rows.length === 0) {
        throw new Error('No data to export');
      }
      
      // For large datasets, show a progress message
      if (data.rows.length > 1000) {
        console.log(`Exporting ${data.rows.length} records... This may take a moment.`);
      }
      
      const csvContent = tableDataToCSV(data);
      
      if (csvContent.startsWith('Error:')) {
        throw new Error(csvContent);
      }
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `extraction_data_${timestamp}.csv`;
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      // You could show a toast notification here
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const formatCellValue = (value: any, type?: string): string => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value);
      case 'boolean':
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        const lowerValue = String(value).toLowerCase();
        return lowerValue === 'true' || lowerValue === 'yes' ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };
  
  return (
    <Card className={`w-full overflow-hidden max-w-full flex flex-col h-full ${className}`}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {rows.length} {rows.length === 1 ? 'record' : 'records'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="h-8 px-3 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>
        
        {/* Large Dataset Warning */}
        {rows.length > 1000 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <strong>Large Dataset:</strong> This table contains {rows.length.toLocaleString()} records. 
            Use pagination to navigate through the data efficiently. Export to CSV for full data access.
          </div>
        )}
        
        {/* Pagination Controls */}
        {rows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select value={rowsPerPage.toString()} onValueChange={(value) => {
                setRowsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, rows.length)} of {rows.length} entries
              </span>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="table-content overflow-auto h-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((column, index) => {
                  // Ensure unique keys for React
                  const uniqueKey = `${column.key}_${index}`;
                  return (
                    <th
                      key={uniqueKey}
                      className="px-3 py-2 text-left text-sm font-medium text-muted-foreground border-r last:border-r-0 min-w-32"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate">{column.label}</span>
                        {column.type && column.type !== 'text' && (
                          <Badge variant="outline" className="text-xs px-1 py-0 flex-shrink-0">
                            {column.type}
                          </Badge>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, rowIndex) => {
                const actualRowIndex = startIndex + rowIndex;
                return (
                  <tr
                    key={actualRowIndex}
                    className={`border-b hover:bg-muted/30 transition-colors ${
                      actualRowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    }`}
                  >
                    {columns.map((column, colIndex) => {
                      const dataKey = column.originalKey || column.key;
                      const uniqueKey = `${column.key}_${colIndex}`;
                      return (
                        <td
                          key={uniqueKey}
                          className="px-3 py-2 text-sm border-r last:border-r-0 min-w-32"
                        >
                          <div className="max-w-xs">
                            <span className="break-words">
                              {formatCellValue(row[dataKey], column.type)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for smaller spaces
export function CompactTableDisplay({ data, className = "" }: { data: TableData; className?: string }) {
  // Validate data structure
  if (!data || !data.columns || !data.rows || !Array.isArray(data.columns) || !Array.isArray(data.rows)) {
    return (
      <div className={`border rounded-lg p-3 ${className}`}>
        <div className="text-center text-muted-foreground text-sm">
          <FileSpreadsheet className="w-6 h-6 mx-auto mb-1 opacity-50" />
          <p>Invalid data format</p>
        </div>
      </div>
    );
  }
  
  const { columns, rows } = data;
  const maxRowsToShow = Math.min(5, rows.length); // Don't show more than available
  const displayRows = rows.slice(0, maxRowsToShow);
  
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    const stringValue = String(value);
    return stringValue.length > 50 ? stringValue.substring(0, 50) + '...' : stringValue;
  };
  
  return (
    <div className={`border rounded-lg overflow-hidden w-full max-w-full flex flex-col ${className}`}>
      <div className="bg-muted/50 px-3 py-2 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Extracted Data</span>
          <Badge variant="secondary" className="text-xs">
            {rows.length} records
          </Badge>
        </div>
      </div>
      
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              {columns.map((column, index) => {
                const uniqueKey = `${column.key}_${index}`;
                return (
                  <th key={uniqueKey} className="px-2 py-2 text-left font-medium text-muted-foreground min-w-24">
                    <span className="truncate block">{column.label}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-b-0">
                {columns.map((column, colIndex) => {
                  const dataKey = column.originalKey || column.key;
                  const uniqueKey = `${column.key}_${colIndex}`;
                  return (
                    <td key={uniqueKey} className="px-2 py-2 min-w-24">
                      <span className="break-words block text-xs">
                        {formatCellValue(row[dataKey])}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {rows.length > maxRowsToShow && (
        <div className="px-3 py-2 bg-muted/20 text-center text-xs text-muted-foreground flex-shrink-0">
          Showing {maxRowsToShow} of {rows.length} records
        </div>
      )}
    </div>
  );
}
