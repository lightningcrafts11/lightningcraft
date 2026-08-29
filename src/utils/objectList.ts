import type { ComponentPropertyDefinition } from '@/types/component';
import { isPropertyVisible } from '@/utils/propertyVisibility';

export function getObjectField(
  item: Record<string, unknown>,
  property: ComponentPropertyDefinition
): unknown {
  if (!property.nestedObject) return item[property.name];
  const nested = item[property.nestedObject];
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) return undefined;
  return (nested as Record<string, unknown>)[property.name];
}

export function setObjectField(
  item: Record<string, unknown>,
  property: ComponentPropertyDefinition,
  value: unknown
): Record<string, unknown> {
  if (!property.nestedObject) {
    const next = { ...item };
    if (value === undefined) delete next[property.name];
    else next[property.name] = value;
    return next;
  }

  const currentNested = item[property.nestedObject];
  const nested: Record<string, unknown> =
    currentNested && typeof currentNested === 'object' && !Array.isArray(currentNested)
      ? { ...(currentNested as Record<string, unknown>) }
      : {};

  if (value === undefined || value === '') delete nested[property.name];
  else nested[property.name] = value;

  const next = { ...item };
  if (Object.keys(nested).length === 0) delete next[property.nestedObject];
  else next[property.nestedObject] = nested;
  return next;
}

export function asObjectList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === 'object' && !Array.isArray(item)
  );
}

export function moveListItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [removed] = next.splice(fromIndex, 1);
  if (removed === undefined) return items;
  next.splice(toIndex, 0, removed);
  return next;
}

/**
 * When a required nested field becomes visible and has no value, apply its
 * metadata default. Generic: not specific to any Salesforce component.
 */
export function seedRequiredVisibleDefaults(
  item: Record<string, unknown>,
  properties: ComponentPropertyDefinition[]
): Record<string, unknown> {
  let next = item;
  for (const field of properties) {
    if (!field.required || field.defaultValue === undefined) continue;
    if (!isPropertyVisible(field, next)) continue;
    if (!isEmptyFieldValue(getObjectField(next, field))) continue;
    next = setObjectField(next, field, cloneDefaultValue(field.defaultValue));
  }
  return next;
}

function isEmptyFieldValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  return Array.isArray(value) && value.length === 0;
}

function cloneDefaultValue(value: unknown): unknown {
  if (typeof value === 'object' && value !== null) return structuredClone(value);
  return value;
}
