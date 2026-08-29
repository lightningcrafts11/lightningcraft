import { COMPONENT_DEFINITIONS, COMPONENT_DEFINITION_MAP } from './registry';
import type { ComponentCategory, ComponentDefinition, SlotDefinition } from '@/types/component';
import type { BuilderNode } from '@/types/builder';

export { COMPONENT_DEFINITIONS } from './registry';

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

/** Returns the ComponentDefinition for the given LWC type, or undefined. */
export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return COMPONENT_DEFINITION_MAP.get(type);
}

export function getAllComponentDefinitions(): ComponentDefinition[] {
  return COMPONENT_DEFINITIONS;
}

export function getComponentsByCategory(category: ComponentCategory): ComponentDefinition[] {
  return COMPONENT_DEFINITIONS.filter((def) => def.category === category);
}

/**
 * Unique categories present in the registry, in first-seen order.
 * New category values appear here automatically once a definition uses them.
 */
export function getComponentCategories(): ComponentCategory[] {
  const seen = new Set<ComponentCategory>();
  const categories: ComponentCategory[] = [];
  for (const def of COMPONENT_DEFINITIONS) {
    if (!seen.has(def.category)) {
      seen.add(def.category);
      categories.push(def.category);
    }
  }
  return categories;
}

export function getComponentSlots(type: string): SlotDefinition[] {
  return getComponentDefinition(type)?.composition.slots ?? [];
}

export function getSlotDefinition(
  targetType: string,
  slotName: string
): SlotDefinition | undefined {
  return getComponentSlots(targetType).find((s) => s.name === slotName);
}

export function getDefaultSlotName(type: string): string | undefined {
  const def = getComponentDefinition(type);
  if (!def) return undefined;
  if (def.composition.defaultSlot) return def.composition.defaultSlot;
  return def.composition.slots?.find((s) => s.isDefault)?.name;
}

export function isComposable(type: string): boolean {
  const def = getComponentDefinition(type);
  return Boolean(def?.composition.acceptsChildren && def.composition.slots?.length);
}

// ---------------------------------------------------------------------------
// Drop validation (metadata-driven — no component-specific conditionals)
// ---------------------------------------------------------------------------

function typeAllowedByList(sourceType: string, allowed: string[] | undefined): boolean {
  if (!allowed || allowed.length === 0) return true;
  if (allowed.includes('*')) return true;
  return allowed.includes(sourceType);
}

/**
 * Returns true if `sourceType` may be placed into `slotName` of `targetType`.
 *
 * Checks, in order:
 *   1. Target accepts children and exposes the named slot.
 *   2. Source is not in the slot's excludedTypes.
 *   3. Source is in the slot's allowedTypes (or the slot allows '*').
 *   4. Target is in the source's allowedParents (when specified).
 *
 * Adding a new component never requires changing this function.
 */
export function canDrop(sourceType: string, targetType: string, slotName: string): boolean {
  const targetDef = getComponentDefinition(targetType);
  if (!targetDef?.composition.acceptsChildren) return false;

  const slotDef = getSlotDefinition(targetType, slotName);
  if (!slotDef) return false;

  if (slotDef.excludedTypes?.includes(sourceType)) return false;
  if (!typeAllowedByList(sourceType, slotDef.allowedTypes)) return false;

  const sourceDef = getComponentDefinition(sourceType);
  if (sourceDef?.composition.allowedParents) {
    if (!typeAllowedByList(targetType, sourceDef.composition.allowedParents)) {
      return false;
    }
  }

  return true;
}

/**
 * Returns true if `sourceType` may be placed at the canvas root.
 * Reads composition.allowAtRoot — never a hardcoded type name.
 */
export function canDropAtRoot(sourceType: string): boolean {
  const def = getComponentDefinition(sourceType);
  return def?.composition.allowAtRoot !== false;
}

// ---------------------------------------------------------------------------
// Node creation helper
// ---------------------------------------------------------------------------

/**
 * Creates a new BuilderNode from the component definition for `type`.
 * - Generates a unique id (never during render).
 * - Clones defaultAttributes.
 * - Initialises an empty array for each named slot from metadata.
 */
export function createBuilderNode(type: string): BuilderNode {
  const def = getComponentDefinition(type);
  const slots: Record<string, BuilderNode[]> = {};
  if (def?.composition.slots) {
    for (const slot of def.composition.slots) {
      slots[slot.name] = [];
    }
  }
  return {
    id: crypto.randomUUID(),
    type,
    attributes: def ? structuredClone(def.defaultAttributes) : {},
    slots,
  };
}
