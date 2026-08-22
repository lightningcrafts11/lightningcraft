import type { PropertyCondition } from '@/types/component';

export function whenEquals(property: string, value: unknown): PropertyCondition {
  return { property, operator: 'equals', value };
}

export function whenNotEquals(property: string, value: unknown): PropertyCondition {
  return { property, operator: 'notEquals', value };
}

export function whenIn(property: string, value: unknown[]): PropertyCondition {
  return { property, operator: 'in', value };
}

export function whenNotIn(property: string, value: unknown[]): PropertyCondition {
  return { property, operator: 'notIn', value };
}

export const INPUT_TEXT_TYPES = ['text', 'email', 'password', 'search', 'tel', 'url'];
export const INPUT_PLACEHOLDER_TYPES = [
  'date',
  'email',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
];
export const INPUT_MIN_MAX_TYPES = ['number', 'range', 'date', 'time', 'datetime', 'datetime-local'];
export const INPUT_NUMBER_TYPES = ['number', 'range'];
export const INPUT_CHECKED_TYPES = ['checkbox', 'checkbox-button', 'toggle'];
export const INPUT_NO_VALUE_TYPES = ['checkbox', 'checkbox-button', 'toggle', 'file'];
export const INPUT_NO_READONLY_TYPES = ['checkbox', 'checkbox-button', 'toggle', 'file'];
export const INPUT_NO_HELP_TYPES = ['file', 'toggle', 'checkbox-button'];
export const INPUT_DATE_STYLE_TYPES = ['date', 'datetime', 'datetime-local'];
export const INPUT_TIME_STYLE_TYPES = ['time', 'datetime', 'datetime-local'];
export const INPUT_DATETIME_TYPES = ['datetime', 'datetime-local'];
export const INPUT_TYPE_MISMATCH_TYPES = ['email', 'url'];
export const INPUT_AUTOCOMPLETE_TYPES = ['email', 'search', 'tel', 'text', 'url'];
export const INPUT_MULTIPLE_TYPES = ['file', 'email'];
export const INPUT_FILE_TYPES = ['file'];
export const INPUT_SEARCH_TYPES = ['search'];
export const INPUT_CHECKBOX_ONLY_TYPES = ['checkbox'];
export const INPUT_TOGGLE_TYPES = ['toggle'];
export const INPUT_NUMBER_ONLY_TYPES = ['number'];
