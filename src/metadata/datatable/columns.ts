import type { SelectOption } from '@/types/component';
import { asObjectList } from '@/utils/objectList';

/** Salesforce lightning-datatable standard column types. Custom types are out of scope. */
export const DATATABLE_COLUMN_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'Date Local', value: 'date-local' },
  { label: 'Currency', value: 'currency' },
  { label: 'Percent', value: 'percent' },
  { label: 'Phone', value: 'phone' },
  { label: 'Email', value: 'email' },
  { label: 'URL', value: 'url' },
  { label: 'Action', value: 'action' },
  { label: 'Button', value: 'button' },
  { label: 'Button Icon', value: 'button-icon' },
  { label: 'Location', value: 'location' },
];

export const DATATABLE_ALIGNMENT_OPTIONS: SelectOption[] = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

export const DATATABLE_URL_TARGET_OPTIONS: SelectOption[] = [
  { label: '_self', value: '_self' },
  { label: '_blank', value: '_blank' },
  { label: '_parent', value: '_parent' },
  { label: '_top', value: '_top' },
];

export const DATATABLE_MENU_ALIGNMENT_OPTIONS: SelectOption[] = [
  { label: 'Right', value: 'right' },
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Auto', value: 'auto' },
  { label: 'Bottom Left', value: 'bottom-left' },
  { label: 'Bottom Center', value: 'bottom-center' },
  { label: 'Bottom Right', value: 'bottom-right' },
];

export const DATATABLE_DATE_PART_OPTIONS: SelectOption[] = [
  { label: 'Numeric', value: 'numeric' },
  { label: '2-digit', value: '2-digit' },
];

export const DATATABLE_MONTH_OPTIONS: SelectOption[] = [
  { label: 'Numeric', value: 'numeric' },
  { label: '2-digit', value: '2-digit' },
  { label: 'Long', value: 'long' },
  { label: 'Short', value: 'short' },
  { label: 'Narrow', value: 'narrow' },
];

/**
 * Column types that must not expose `editable`.
 * Salesforce documents that inline editing is not supported for date and location
 * fields. Action/button types are not data cells; boolean remains excluded as
 * a LightningCraft restriction.
 */
export const DATATABLE_NON_EDITABLE_TYPES = [
  'action',
  'boolean',
  'button',
  'button-icon',
  'date',
  'date-local',
  'location',
];

/** Salesforce: wrap/clip header actions are not supported for these types. */
export const DATATABLE_NON_WRAP_TYPES = [
  'action',
  'boolean',
  'button',
  'button-icon',
  'date-local',
];

export const DATATABLE_NON_SORTABLE_TYPES = ['action', 'button', 'button-icon'];

/**
 * Salesforce: the action type aligns to the center and cannot be overridden
 * by cellAttributes.alignment.
 */
export const DATATABLE_NON_ALIGNMENT_TYPES = ['action'];

/**
 * Types that are not data fields. Header read-only lock icons do not apply.
 */
export const DATATABLE_NON_READ_ONLY_ICON_TYPES = ['action', 'button', 'button-icon'];

export interface DatatableColumnAction {
  lcKey?: string;
  label: string;
  name: string;
  disabled?: boolean;
  iconName?: string;
  checked?: boolean;
}

export interface DatatableColumn {
  lcKey?: string;
  label: string;
  fieldName: string;
  type: string;
  sortable?: boolean;
  editable?: boolean;
  wrapText?: boolean;
  hideDefaultActions?: boolean;
  hideLabel?: boolean;
  displayReadOnlyIcon?: boolean;
  iconName?: string;
  imgSrc?: string;
  initialWidth?: number;
  fixedWidth?: number;
  actions?: DatatableColumnAction[];
  cellAttributes?: {
    alignment?: string;
  };
  typeAttributes?: Record<string, unknown>;
}

/** Default row-level actions matching official Salesforce examples. */
export function defaultDatatableRowActions(): DatatableColumnAction[] {
  return [
    { label: 'Show details', name: 'show_details' },
    { label: 'Delete', name: 'delete' },
  ];
}

export function createDatatableColumn(
  overrides: Partial<DatatableColumn> = {}
): DatatableColumn {
  const column: DatatableColumn = {
    lcKey: crypto.randomUUID(),
    label: 'New Column',
    fieldName: 'Field',
    type: 'text',
    ...overrides,
  };
  return completeActionColumn(column);
}

export function defaultDatatableColumns(): DatatableColumn[] {
  return [
    createDatatableColumn({ label: 'Name', fieldName: 'Name', type: 'text' }),
    createDatatableColumn({ label: 'Email', fieldName: 'Email', type: 'email' }),
    createDatatableColumn({ label: 'Amount', fieldName: 'Amount', type: 'currency' }),
  ];
}

export function normalizeDatatableColumns(value: unknown): DatatableColumn[] {
  return asObjectList(value).map((item, index) => normalizeDatatableColumn(item, index));
}

export function normalizeDatatableColumn(
  item: Record<string, unknown>,
  index: number
): DatatableColumn {
  const type = typeof item.type === 'string' && item.type !== '' ? item.type : 'text';
  const label =
    typeof item.label === 'string' && item.label !== '' ? item.label : `Column ${index + 1}`;
  const fieldName =
    typeof item.fieldName === 'string' && item.fieldName !== ''
      ? item.fieldName
      : `Field${index + 1}`;

  const column: DatatableColumn = {
    label,
    fieldName,
    type,
  };

  if (typeof item.lcKey === 'string' && item.lcKey !== '') column.lcKey = item.lcKey;
  if (item.sortable === true) column.sortable = true;
  if (item.editable === true && !DATATABLE_NON_EDITABLE_TYPES.includes(type)) {
    column.editable = true;
  }
  if (item.wrapText === true) column.wrapText = true;
  if (item.hideDefaultActions === true) column.hideDefaultActions = true;
  if (item.hideLabel === true) column.hideLabel = true;
  if (
    item.displayReadOnlyIcon === true &&
    !DATATABLE_NON_READ_ONLY_ICON_TYPES.includes(type)
  ) {
    column.displayReadOnlyIcon = true;
  }
  if (typeof item.iconName === 'string' && item.iconName !== '') {
    column.iconName = item.iconName;
  }
  if (typeof item.imgSrc === 'string' && item.imgSrc !== '') {
    column.imgSrc = item.imgSrc;
  }
  if (typeof item.initialWidth === 'number' && Number.isFinite(item.initialWidth)) {
    column.initialWidth = item.initialWidth;
  }
  if (typeof item.fixedWidth === 'number' && Number.isFinite(item.fixedWidth)) {
    column.fixedWidth = item.fixedWidth;
  }

  const headerActions = normalizeDatatableActions(item.actions);
  if (headerActions.length > 0) column.actions = headerActions;

  const cellAttributes = asRecord(item.cellAttributes);
  if (
    cellAttributes &&
    typeof cellAttributes.alignment === 'string' &&
    !DATATABLE_NON_ALIGNMENT_TYPES.includes(type)
  ) {
    column.cellAttributes = { alignment: cellAttributes.alignment };
  }

  const typeAttributes = asRecord(item.typeAttributes);
  if (typeAttributes && Object.keys(typeAttributes).length > 0) {
    column.typeAttributes = { ...typeAttributes };
  }

  return completeActionColumn(column);
}

/**
 * Salesforce column objects for future JS generation.
 * Strips LightningCraft-only `lcKey` and completes required action rowActions.
 * Does not emit HTML and is not a JavaScript file generator.
 *
 * Salesforce also allows some typeAttributes / cellAttributes values as
 * `{ fieldName: "ApiName" }` to bind to a row field. LightningCraft stores
 * primitives only; that object form is deferred and is not represented with
 * a custom string syntax.
 */
export function toSalesforceColumns(value: unknown): Record<string, unknown>[] {
  return normalizeDatatableColumns(value).map(toSalesforceColumn);
}

export function normalizeDatatableActions(value: unknown): DatatableColumnAction[] {
  return asObjectList(value).map((item, index) => normalizeDatatableAction(item, index));
}

function completeActionColumn(column: DatatableColumn): DatatableColumn {
  if (column.type !== 'action') return column;

  const typeAttributes: Record<string, unknown> = { ...(column.typeAttributes ?? {}) };
  const rowActions = normalizeDatatableActions(typeAttributes.rowActions);
  typeAttributes.rowActions =
    rowActions.length > 0 ? rowActions : defaultDatatableRowActions();
  return { ...column, typeAttributes };
}

function normalizeDatatableAction(
  item: Record<string, unknown>,
  index: number
): DatatableColumnAction {
  const action: DatatableColumnAction = {
    label:
      typeof item.label === 'string' && item.label !== ''
        ? item.label
        : `Action ${index + 1}`,
    name:
      typeof item.name === 'string' && item.name !== ''
        ? item.name
        : `action_${index + 1}`,
  };
  if (typeof item.lcKey === 'string' && item.lcKey !== '') action.lcKey = item.lcKey;
  if (item.disabled === true) action.disabled = true;
  if (typeof item.iconName === 'string' && item.iconName !== '') {
    action.iconName = item.iconName;
  }
  if (item.checked === true) action.checked = true;
  return action;
}

function toSalesforceColumn(column: DatatableColumn): Record<string, unknown> {
  const next: Record<string, unknown> = { ...column };
  delete next.lcKey;
  if (column.actions) {
    next.actions = column.actions.map(stripLcKey);
  }
  if (column.typeAttributes) {
    next.typeAttributes = typeAttributesForSalesforce(column.typeAttributes);
  }
  return next;
}

function typeAttributesForSalesforce(
  typeAttributes: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...typeAttributes };
  if ('rowActions' in next) {
    next.rowActions = normalizeDatatableActions(next.rowActions).map(stripLcKey);
  }
  return next;
}

function stripLcKey<T extends { lcKey?: string }>(item: T): Omit<T, 'lcKey'> {
  const next = { ...item };
  delete next.lcKey;
  return next;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}
