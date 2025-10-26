"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Download, X } from 'lucide-react';
import { TableDisplay } from './TableDisplay';
import { type TableData, tableDataToCSV, downloadCSV } from '@/lib/extraction-utils';

interface ExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableData: TableData | null;
  title?: string;
}

export function ExtractionModal({ 
  isOpen, 
  onClose, 
  tableData, 
  title = "Extracted Data" 
}: ExtractionModalProps) {
  if (!tableData) return null;

  const handleExportCSV = () => {
    try {
      const csvContent = tableDataToCSV(tableData);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `extraction_data_${timestamp}.csv`;
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[99vw] max-h-[98vh] w-full h-full flex flex-col p-2">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <Badge variant="secondary" className="text-sm">
                {tableData.rows.length} {tableData.rows.length === 1 ? 'record' : 'records'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 px-3 text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-background border-b">
                <tr>
                  {tableData.columns.map((column, index) => (
                    <th
                      key={`${column.key}_${index}`}
                      className="px-4 py-3 text-left font-medium text-muted-foreground border-r last:border-r-0 whitespace-nowrap"
                      style={{ minWidth: '150px', maxWidth: '300px' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate" title={column.label}>{column.label}</span>
                        {column.type && column.type !== 'text' && (
                          <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                            {column.type}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`border-b hover:bg-muted/30 transition-colors ${
                      rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    }`}
                  >
                    {tableData.columns.map((column, colIndex) => {
                      const dataKey = column.originalKey || column.key;
                      const value = row[dataKey];
                      const cellValue = value === null || value === undefined ? '-' : String(value);
                      return (
                        <td
                          key={`${column.key}_${colIndex}`}
                          className="px-4 py-3 text-sm border-r last:border-r-0 whitespace-nowrap"
                          style={{ minWidth: '150px', maxWidth: '300px' }}
                        >
                          <div className="truncate" title={String(cellValue)}>
                            {cellValue}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
