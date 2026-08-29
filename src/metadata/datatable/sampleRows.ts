import {
  normalizeDatatableColumns,
  type DatatableColumn,
} from '@/metadata/datatable/columns';

const SAMPLE_ROW_COUNT = 3;

/**
 * Design-time placeholder rows derived from column fieldNames.
 * Not Salesforce records and not exported as HTML/JS data.
 */
export function createDatatableSampleRows(
  columnsValue: unknown,
  keyField: string,
  rowCount: number = SAMPLE_ROW_COUNT
): Record<string, unknown>[] {
  const columns = normalizeDatatableColumns(columnsValue);
  const key = keyField.trim() || 'Id';
  const count = Number.isFinite(rowCount) && rowCount > 0 ? Math.min(rowCount, 10) : SAMPLE_ROW_COUNT;

  return Array.from({ length: count }, (_, index) => {
    const row: Record<string, unknown> = { [key]: String(index + 1) };
    for (const column of columns) {
      if (column.type === 'action') continue;
      if (column.fieldName === key) continue;
      row[column.fieldName] = sampleCellValue(column, index);
      applyLocationFields(row, column);
    }
    return row;
  });
}

function sampleCellValue(column: DatatableColumn, index: number): unknown {
  const n = index + 1;
  switch (column.type) {
    case 'number':
      return n * 10;
    case 'boolean':
      return index % 2 === 0;
    case 'currency':
      return n * 1000;
    case 'percent':
      return n * 0.1;
    case 'email':
      return `sample${n}@example.com`;
    case 'phone':
      return `555010${n}`;
    case 'url': {
      const label = column.typeAttributes?.label;
      return typeof label === 'string' && label !== '' ? label : `https://example.com/${n}`;
    }
    case 'date':
      return `2026-01-${String(n).padStart(2, '0')}T12:00:00.000Z`;
    case 'date-local':
      return `2026-01-${String(n).padStart(2, '0')}`;
    case 'button':
      return typeof column.typeAttributes?.label === 'string'
        ? column.typeAttributes.label
        : 'Action';
    case 'button-icon':
      return '';
    case 'location':
      return '';
    default:
      return `Sample ${n}`;
  }
}

function applyLocationFields(row: Record<string, unknown>, column: DatatableColumn): void {
  if (column.type !== 'location' || !column.typeAttributes) return;
  const lat = column.typeAttributes.latitude;
  const lon = column.typeAttributes.longitude;
  if (typeof lat === 'string' && lat !== '') row[lat] = 37.79;
  if (typeof lon === 'string' && lon !== '') row[lon] = -122.4;
}
