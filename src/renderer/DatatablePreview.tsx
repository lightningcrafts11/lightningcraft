'use client';

import type { BuilderNode } from '@/types/builder';
import { cn } from '@/utils/cn';
import {
  buildDatatableViewModel,
  formatDatatableCell,
  type DatatableViewColumn,
} from '@/metadata/datatable/viewModel';

export default function DatatablePreview({ node }: { node: BuilderNode }) {
  const view = buildDatatableViewModel(node.attributes);
  const hasColumns = view.columns.length > 0;
  const wrapLines = view.wrapTextMaxLines;

  return (
    <div
      className={cn(
        'relative overflow-x-auto pointer-events-none min-w-0',
        view.hideBorders ? '' : 'border border-zinc-200 rounded'
      )}
    >
      {view.isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-200 border-t-blue-500 animate-spin" />
          <span className="sr-only">Loading</span>
        </div>
      )}
      <table className="w-full text-xs border-collapse">
        {!view.hideTableHeader && (
          <thead className="bg-zinc-50">
            <tr>
              {!view.hideCheckboxColumn && (
                <th className="w-8 px-2 py-2 text-left font-semibold text-zinc-500 border-b border-zinc-200">
                  <span className="inline-block w-3.5 h-3.5 rounded-sm border border-zinc-400 bg-white" />
                </th>
              )}
              {view.showRowNumberColumn && (
                <th className="w-10 px-2 py-2 text-left font-semibold text-zinc-500 border-b border-zinc-200">
                  #
                </th>
              )}
              {hasColumns ? (
                view.columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-2 py-2 font-semibold text-zinc-600 border-b border-zinc-200 whitespace-nowrap',
                      alignClass(column.alignment)
                    )}
                    style={column.width ? { width: column.width, minWidth: column.width } : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {column.label}
                      {column.sortable && view.sortedBy === column.fieldName && (
                        <span aria-hidden className="text-[10px] text-blue-600">
                          {view.sortedDirection === 'desc' ? '▼' : '▲'}
                        </span>
                      )}
                      {column.sortable && view.sortedBy !== column.fieldName && (
                        <span aria-hidden className="text-[10px] text-zinc-300">
                          ↕
                        </span>
                      )}
                    </span>
                  </th>
                ))
              ) : (
                <th className="px-2 py-2 font-medium text-zinc-400 border-b border-zinc-200">
                  Add columns in Properties
                </th>
              )}
            </tr>
          </thead>
        )}
        <tbody>
          {view.rows.map((row, rowIndex) => (
            <tr key={row.key || rowIndex} className="bg-white">
              {!view.hideCheckboxColumn && (
                <td className="px-2 py-1.5 border-b border-zinc-100">
                  <span
                    className={cn(
                      'inline-block w-3.5 h-3.5 rounded-sm border',
                      row.selected ? 'bg-blue-600 border-blue-600' : 'border-zinc-400 bg-white'
                    )}
                  />
                </td>
              )}
              {view.showRowNumberColumn && (
                <td className="px-2 py-1.5 border-b border-zinc-100 text-zinc-400 tabular-nums">
                  {view.rowNumberOffset + rowIndex + 1}
                </td>
              )}
              {hasColumns ? (
                view.columns.map((column) => (
                  <td
                    key={`${row.key}-${column.key}`}
                    className={cn(
                      'px-2 py-1.5 border-b border-zinc-100 text-zinc-700',
                      alignClass(column.alignment),
                      cellWrapClass(column, wrapLines)
                    )}
                    style={cellWrapStyle(column, wrapLines)}
                  >
                    {renderCell(column, row.cells[column.fieldName])}
                  </td>
                ))
              ) : (
                <td className="px-2 py-1.5 border-b border-zinc-100 text-zinc-400">
                  {String(row.cells[view.keyField] ?? '')}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(column: DatatableViewColumn, value: unknown) {
  const formatted = formatDatatableCell(column, value);

  if (column.type === 'url' || column.type === 'email' || column.type === 'phone') {
    return <span className="text-blue-600 underline">{formatted || '—'}</span>;
  }
  if (column.type === 'button') {
    return (
      <span className="inline-flex px-2 py-0.5 rounded border border-zinc-300 bg-white text-zinc-700">
        {formatted}
      </span>
    );
  }
  if (column.type === 'action' || column.type === 'button-icon') {
    return <span className="text-zinc-400">{formatted}</span>;
  }
  if (column.type === 'boolean') {
    return formatted ? <span className="text-emerald-600 font-semibold">{formatted}</span> : <span className="text-zinc-300">—</span>;
  }
  return formatted || '—';
}

function alignClass(alignment: DatatableViewColumn['alignment']): string {
  if (alignment === 'center') return 'text-center';
  if (alignment === 'right') return 'text-right';
  return 'text-left';
}

function cellWrapClass(column: DatatableViewColumn, wrapLines: number | undefined): string {
  if (!column.wrapText) return 'whitespace-nowrap overflow-hidden text-ellipsis';
  return wrapLines ? 'overflow-hidden' : 'whitespace-normal';
}

function cellWrapStyle(
  column: DatatableViewColumn,
  wrapLines: number | undefined
): { WebkitLineClamp?: number; display?: string; WebkitBoxOrient?: 'vertical' } | undefined {
  if (!column.wrapText || !wrapLines) return undefined;
  return {
    display: '-webkit-box',
    WebkitLineClamp: wrapLines,
    WebkitBoxOrient: 'vertical',
  };
}
