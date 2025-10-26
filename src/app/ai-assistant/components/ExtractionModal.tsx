"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Download, X } from 'lucide-react';
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
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !tableData) return null;

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

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-[9999] flex flex-col bg-background">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b bg-background shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">{title}</h2>
              <Badge variant="secondary" className="text-sm">
                {tableData.rows.length} {tableData.rows.length === 1 ? 'record' : 'records'}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {tableData.columns.length} columns
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-9 px-4 text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Table Content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-background">
          <table className="w-full border-collapse" style={{ minWidth: '100%' }}>
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm shadow-md">
              <tr>
                {tableData.columns.map((column, index) => (
                  <th
                    key={`${column.key}_${index}`}
                    className="px-6 py-3 text-left text-sm font-semibold text-foreground border-r border-border last:border-r-0 whitespace-nowrap bg-muted/80"
                    style={{ minWidth: '200px' }}
                  >
                    <div className="flex items-center gap-2">
                      <span title={column.label}>{column.label}</span>
                      {column.type && column.type !== 'text' && (
                        <span className="text-xs px-2 py-0.5 bg-background rounded text-muted-foreground border">
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
                  className={`border-b border-border hover:bg-muted/50 transition-colors ${
                    rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                >
                  {tableData.columns.map((column, colIndex) => {
                    const dataKey = column.originalKey || column.key;
                    const value = row[dataKey];
                    const cellValue = value === null || value === undefined ? '-' : String(value);
                    const isLongText = cellValue.length > 50;
                    
                    return (
                      <td
                        key={`${column.key}_${colIndex}`}
                        className="px-6 py-3 text-sm border-r border-border last:border-r-0"
                        style={{ minWidth: '200px', maxWidth: '400px' }}
                      >
                        <div 
                          className={isLongText ? "whitespace-normal break-words" : "whitespace-nowrap overflow-hidden text-ellipsis"}
                          title={String(cellValue)}
                        >
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
    </>
  );

  // Use portal to render at the root level
  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}
