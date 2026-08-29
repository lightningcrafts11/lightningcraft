import type { ComponentPropertyDefinition, SelectOption } from '@/types/component';

/** Current attribute value, falling back to the property default. */
export function resolvePropertyValue(
  attributes: Record<string, unknown>,
  property: ComponentPropertyDefinition
): unknown {
  const current = attributes[property.name];
  if (current !== undefined) return current;
  return property.defaultValue;
}

export function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a === 'object' && typeof b === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

export function isAtDefault(
  attributes: Record<string, unknown>,
  property: ComponentPropertyDefinition
): boolean {
  if (property.defaultValue === undefined) return true;
  return valuesEqual(resolvePropertyValue(attributes, property), property.defaultValue);
}

export function asText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return '';
}

export function asBoolean(value: unknown): boolean {
  return value === true;
}

export function asNumberInputValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value !== '' && Number.isFinite(Number(value))) {
    return value;
  }
  return '';
}

/**
 * Parse a number field. Empty input clears the attribute.
 * Honors min/max from metadata when present. Does not coerce invalid text.
 */
export function parseNumberInput(
  raw: string,
  property: ComponentPropertyDefinition
): number | undefined | typeof INVALID_NUMBER {
  if (raw === '') return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return INVALID_NUMBER;

  let next = parsed;
  if (typeof property.min === 'number') next = Math.max(property.min, next);
  if (typeof property.max === 'number') next = Math.min(property.max, next);
  return next;
}

export const INVALID_NUMBER = Symbol('invalid-number');

export function asSelectValue(
  value: unknown,
  options: SelectOption[] | undefined,
  defaultValue: unknown
): string {
  const list = options ?? [];
  const current = value === undefined || value === null ? '' : String(value);
  if (list.some((option) => option.value === current)) return current;

  const fallback = defaultValue === undefined || defaultValue === null ? '' : String(defaultValue);
  if (list.some((option) => option.value === fallback)) return fallback;

  return list[0]?.value ?? '';
}
