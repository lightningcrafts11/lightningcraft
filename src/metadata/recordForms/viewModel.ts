import {
  designTimeFieldLabel,
  designTimeFieldSample,
  designTimeInputKind,
  type DesignTimeInputKind,
} from '@/metadata/recordForms/preview';
import { toSalesforceFieldApiNames } from '@/metadata/recordForms/fields';

export type RecordFormMode = 'edit' | 'view' | 'readonly';
export type RecordFormLayoutType = 'Full' | 'Compact';

export interface RecordFormViewField {
  fieldApiName: string;
  label: string;
  sample: string;
  kind: DesignTimeInputKind;
}

export interface RecordFormViewModel {
  objectApiName: string;
  mode: RecordFormMode;
  modeIsInferred: boolean;
  columns: number;
  layoutType: RecordFormLayoutType | undefined;
  usesLayoutPlaceholders: boolean;
  fields: RecordFormViewField[];
  showSaveCancel: boolean;
  showInlineEdit: boolean;
}

/** Design-time stand-ins when layout-type is set and no fields array is configured. Never exported. */
const LAYOUT_PLACEHOLDER_FIELDS = ['Name', 'Phone', 'Industry'];

export function buildRecordFormViewModel(
  attributes: Record<string, unknown> | undefined
): RecordFormViewModel {
  const attrs = attributes ?? {};
  const objectApiName =
    typeof attrs['object-api-name'] === 'string' && attrs['object-api-name'].trim() !== ''
      ? attrs['object-api-name'].trim()
      : 'Object';

  const configuredNames = toSalesforceFieldApiNames(attrs.fields);
  const layoutType = parseLayoutType(attrs['layout-type']);
  const usesLayoutPlaceholders = configuredNames.length === 0 && layoutType !== undefined;
  const fieldNames = usesLayoutPlaceholders ? LAYOUT_PLACEHOLDER_FIELDS : configuredNames;

  const { mode, modeIsInferred } = resolveMode(attrs);
  const columns = parseColumnCount(attrs.columns);

  return {
    objectApiName,
    mode,
    modeIsInferred,
    columns,
    layoutType,
    usesLayoutPlaceholders,
    fields: fieldNames.map((fieldApiName) => ({
      fieldApiName,
      label: designTimeFieldLabel(fieldApiName),
      sample: designTimeFieldSample(fieldApiName),
      kind: designTimeInputKind(fieldApiName),
    })),
    showSaveCancel: mode === 'edit',
    showInlineEdit: mode === 'view',
  };
}

function parseLayoutType(value: unknown): RecordFormLayoutType | undefined {
  if (value === 'Full' || value === 'Compact') return value;
  return undefined;
}

function parseColumnCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return Math.floor(value);
  }
  return 1;
}

function resolveMode(attrs: Record<string, unknown>): {
  mode: RecordFormMode;
  modeIsInferred: boolean;
} {
  const configured = attrs.mode;
  if (configured === 'edit' || configured === 'view' || configured === 'readonly') {
    return { mode: configured, modeIsInferred: false };
  }
  const hasRecordId = typeof attrs['record-id'] === 'string' && attrs['record-id'].trim() !== '';
  return { mode: hasRecordId ? 'view' : 'edit', modeIsInferred: true };
}
