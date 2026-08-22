import type {
  ComponentDefinition,
  ComponentPropertyDefinition,
  PropertyCondition,
} from '@/types/component';

function matchesCondition(
  condition: PropertyCondition,
  attributes: Record<string, unknown>
): boolean {
  const actual = attributes[condition.property];
  const expected = condition.value;

  switch (condition.operator) {
    case 'equals':
      return Object.is(actual, expected) || (actual === undefined && expected === '');
    case 'notEquals':
      return !Object.is(actual, expected);
    case 'in':
      return Array.isArray(expected) && expected.some((item) => Object.is(actual, item));
    case 'notIn':
      return Array.isArray(expected) && !expected.some((item) => Object.is(actual, item));
    default:
      return true;
  }
}

/** Merge definition defaults so conditions see Salesforce default values (e.g. type=text). */
export function resolveAttributesForVisibility(
  definition: ComponentDefinition,
  attributes: Record<string, unknown>
): Record<string, unknown> {
  return { ...definition.defaultAttributes, ...(attributes ?? {}) };
}

/** True when the property should appear in the inspector and Salesforce HTML. */
export function isPropertyVisible(
  property: ComponentPropertyDefinition,
  attributes: Record<string, unknown>
): boolean {
  if (!property.visibleWhen) return true;
  const conditions = Array.isArray(property.visibleWhen)
    ? property.visibleWhen
    : [property.visibleWhen];
  return conditions.every((condition) => matchesCondition(condition, attributes));
}

/** Properties currently supported for this component configuration. */
export function visibleProperties(
  definition: ComponentDefinition,
  attributes: Record<string, unknown>
): ComponentPropertyDefinition[] {
  const resolved = resolveAttributesForVisibility(definition, attributes);
  return definition.properties.filter((property) => isPropertyVisible(property, resolved));
}
