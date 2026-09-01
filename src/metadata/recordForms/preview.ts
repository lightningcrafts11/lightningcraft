/**
 * Design-time placeholders for lightning-input-field / lightning-output-field.
 * Inferred only from the configured field-name. Not Salesforce schema and never exported.
 */

export type DesignTimeInputKind =
  | 'text'
  | 'number'
  | 'date'
  | 'checkbox'
  | 'picklist';

const SAMPLE_VALUES: Record<string, string> = {
  Name: 'Acme Corporation',
  FirstName: 'Ada',
  LastName: 'Lovelace',
  Phone: '+1 (555) 123-4567',
  Email: 'example@example.com',
  Title: 'Sample title',
  Industry: 'Technology',
  Birthdate: 'Jan 15, 2024',
  CloseDate: 'Jan 15, 2024',
  CreatedDate: 'Jan 15, 2024',
};

const NUMBER_FIELD_NAMES = new Set([
  'Amount',
  'AnnualRevenue',
  'NumberOfEmployees',
  'Quantity',
  'Probability',
]);

const PICKLIST_FIELD_NAMES = new Set([
  'Industry',
  'LeadSource',
  'Status',
  'StageName',
  'Type',
  'Rating',
  'Priority',
  'Source',
]);

/** Label shown on the canvas. Uses the field API name, not org schema. */
export function designTimeFieldLabel(fieldName: string): string {
  const trimmed = fieldName.trim();
  if (!trimmed) return 'Field';
  return trimmed.replace(/__c$/i, '').replace(/_/g, ' ').trim() || trimmed;
}

/** Static sample value for read-only preview. Not live Salesforce data. */
export function designTimeFieldSample(fieldName: string): string {
  const trimmed = fieldName.trim();
  if (!trimmed) return 'Sample value';
  if (SAMPLE_VALUES[trimmed]) return SAMPLE_VALUES[trimmed];
  if (designTimeInputKind(trimmed) === 'date') return 'Jan 15, 2024';
  return 'Sample value';
}

/**
 * Design-time control kind inferred only from the configured field-name.
 * This is not Salesforce field metadata and is never exported.
 */
export function designTimeInputKind(fieldName: string): DesignTimeInputKind {
  const name = fieldName.trim().replace(/__c$/i, '');
  if (!name) {
    return 'text';
  }
  if (/^(Is|Has|DoNot)/.test(name) || name === 'Active') {
    return 'checkbox';
  }
  if (name === 'Birthdate' || /Date$/.test(name) || /Datetime$/.test(name)) {
    return 'date';
  }
  if (NUMBER_FIELD_NAMES.has(name) || /Number$|Amount$|Revenue$/.test(name)) {
    return 'number';
  }
  if (PICKLIST_FIELD_NAMES.has(name)) {
    return 'picklist';
  }
  return 'text';
}
