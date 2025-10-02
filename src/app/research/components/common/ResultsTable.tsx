"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  width?: string | number;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface ResultsTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => React.Key;
  tableClassName?: string;
  headerRowClassName?: string;
}

export default function ResultsTable<T>({ columns, rows, rowKey, tableClassName, headerRowClassName }: ResultsTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <Table className={tableClassName || "table-auto w-full"}>
        <TableHeader>
          <TableRow className={headerRowClassName || "bg-muted/50"}>
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={`px-3 py-3 text-xs font-semibold text-foreground text-left ${col.className || ""}`}
                style={col.width ? { minWidth: typeof col.width === "number" ? `${col.width}px` : col.width } : undefined}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={rowKey(row, idx)} className="hover:bg-muted/50 border-b border-border">
              {columns.map((col) => (
                <TableCell
                  key={String(col.key)}
                  className="px-3 py-3 text-xs text-foreground align-top"
                  style={col.width ? { minWidth: typeof col.width === "number" ? `${col.width}px` : col.width } : undefined}
                >
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


