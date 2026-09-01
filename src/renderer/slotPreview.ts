import type { BuilderNode } from '@/types/builder';
import type { SlotDefinition } from '@/types/component';

function attributeText(
  node: BuilderNode,
  name: string | undefined
): string | undefined {
  if (!name) return undefined;
  const value = node.attributes?.[name];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** Parent attribute shown when a slot has no child nodes. */
export function slotFallbackPrimary(
  node: BuilderNode,
  slotDef: SlotDefinition
): string | undefined {
  return attributeText(node, slotDef.previewAttribute ?? slotDef.name);
}

/** Optional second line of design-time slot text. */
export function slotFallbackSecondary(
  node: BuilderNode,
  slotDef: SlotDefinition
): string | undefined {
  return attributeText(node, slotDef.previewSecondaryAttribute);
}

export function slotHasPreviewFallback(
  node: BuilderNode,
  slotDef: SlotDefinition
): boolean {
  return Boolean(slotFallbackPrimary(node, slotDef) || slotFallbackSecondary(node, slotDef));
}

/** Empty allowedTypes means the slot is property-driven and accepts no children. */
export function slotAcceptsChildren(slotDef: SlotDefinition): boolean {
  return slotDef.allowedTypes.length > 0;
}
