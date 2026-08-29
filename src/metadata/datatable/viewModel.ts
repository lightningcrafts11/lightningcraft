import {
  DATATABLE_NON_ALIGNMENT_TYPES,
  normalizeDatatableColumns,
  type DatatableColumn,
} from '@/metadata/datatable/columns';
import { createDatatableSampleRows } from '@/metadata/datatable/sampleRows';

export interface DatatableViewColumn {
  key: string;
  label: string;
  fieldName: string;
  type: string;
  sortable: boolean;
  wrapText: boolean;
  alignment: 'left' | 'center' | 'right';
  width?: number;
  typeAttributes: Record<string, unknown>;
}

export interface DatatableViewRow {
  key: string;
  selected: boolean;
  cells: Record<string, unknown>;
}

export interface DatatableViewModel {
  keyField: string;
  hideCheckboxColumn: boolean;
  showRowNumberColumn: boolean;
  hideTableHeader: boolean;
  hideBorders: boolean;
  isLoading: boolean;
  wrapTextMaxLines?: number;
  sortedBy?: string;
  sortedDirection?: 'asc' | 'desc';
  rowNumberOffset: number;
  columns: DatatableViewColumn[];
  rows: DatatableViewRow[];
}

export function buildDatatableViewModel(
  attributes: Record<string, unknown> | undefined
): DatatableViewModel {
  const attrs = attributes ?? {};
  const columns = normalizeDatatableColumns(attrs.columns);
  const keyField = typeof attrs['key-field'] === 'string' && attrs['key-field'] !== ''
    ? attrs['key-field']
    : 'Id';
  const hideTableHeader = attrs['hide-table-header'] === true;
  const sampleRows = createDatatableSampleRows(columns, keyField);

  const wrapMax = attrs['wrap-text-max-lines'];
  const wrapTextMaxLines =
    typeof wrapMax === 'number' && Number.isFinite(wrapMax) && wrapMax >= 1
      ? wrapMax
      : undefined;

  const offset = attrs['row-number-offset'];
  const rowNumberOffset =
    typeof offset === 'number' && Number.isFinite(offset) ? offset : 0;

  const sortedBy = typeof attrs['sorted-by'] === 'string' ? attrs['sorted-by'] : undefined;
  const sortedDirection = attrs['sorted-direction'] === 'desc' ? 'desc' : attrs['sorted-direction'] === 'asc' ? 'asc' : undefined;

  return {
    keyField,
    hideCheckboxColumn: attrs['hide-checkbox-column'] === true,
    showRowNumberColumn: attrs['show-row-number-column'] === true,
    hideTableHeader,
    hideBorders: hideTableHeader && attrs['hide-borders'] === true,
    isLoading: attrs['is-loading'] === true,
    wrapTextMaxLines,
    sortedBy,
    sortedDirection,
    rowNumberOffset,
    columns: columns.map((column, index) => toViewColumn(column, index)),
    rows: sampleRows.map((row) => ({
      key: String(row[keyField] ?? ''),
      selected: false,
      cells: row,
    })),
  };
}

function toViewColumn(column: DatatableColumn, index: number): DatatableViewColumn {
  const alignment = column.cellAttributes?.alignment;
  return {
    key: column.lcKey ?? `${column.fieldName}-${index}`,
    label: column.label,
    fieldName: column.fieldName,
    type: column.type,
    sortable: column.sortable === true,
    wrapText: column.wrapText === true,
    alignment: alignmentForColumn(column.type, alignment),
    width: column.fixedWidth ?? column.initialWidth,
    typeAttributes: column.typeAttributes ?? {},
  };
}

function alignmentForColumn(
  type: string,
  alignment: string | undefined
): 'left' | 'center' | 'right' {
  if (DATATABLE_NON_ALIGNMENT_TYPES.includes(type)) return 'center';
  if (alignment === 'center' || alignment === 'right' || alignment === 'left') return alignment;
  return defaultAlignment(type);
}

function defaultAlignment(type: string): 'left' | 'center' | 'right' {
  if (type === 'number' || type === 'currency' || type === 'percent') return 'right';
  return 'left';
}

export function formatDatatableCell(
  column: DatatableViewColumn,
  value: unknown
): string {
  if (column.type === 'boolean') return value === true ? '✓' : '';
  if (column.type === 'percent' && typeof value === 'number') {
    return `${(value * 100).toFixed(0)}%`;
  }
  if (column.type === 'currency' && typeof value === 'number') {
    const code =
      typeof column.typeAttributes.currencyCode === 'string'
        ? column.typeAttributes.currencyCode
        : '';
    if (code !== '') {
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(
          value
        );
      } catch {
        return String(value);
      }
    }
    // Design-time only: do not assume org currency or USD when currencyCode is unset.
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  if (column.type === 'url') {
    const label = column.typeAttributes.label;
    if (typeof label === 'string' && label !== '') return label;
  }
  if (column.type === 'button') {
    return typeof column.typeAttributes.label === 'string'
      ? column.typeAttributes.label
      : 'Button';
  }
  if (column.type === 'action') {
    const rowActions = column.typeAttributes.rowActions;
    if (Array.isArray(rowActions) && rowActions[0] && typeof rowActions[0] === 'object') {
      const first = rowActions[0] as { label?: unknown };
      if (typeof first.label === 'string' && first.label !== '') return first.label;
    }
    return 'Show details';
  }
  if (column.type === 'button-icon') {
    return typeof column.typeAttributes.iconName === 'string'
      ? column.typeAttributes.iconName
      : 'utility:add';
  }
  if (value === undefined || value === null) return '';
  return String(value);
}
