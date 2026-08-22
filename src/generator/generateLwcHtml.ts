/**
 * Metadata-driven Salesforce LWC HTML generator.
 * Walks the builder tree; never reads the DOM.
 */
import type { BuilderNode } from '@/types/builder';
import type {
  ComponentDefinition,
  ComponentPropertyDefinition,
  SlotDefinition,
} from '@/types/component';
import { getComponentDefinition } from '@/metadata';
import type { GenerateLwcHtmlResult, GenerationError } from './types';
import { isPropertyVisible, resolveAttributesForVisibility } from '@/utils/propertyVisibility';
import { mergeClassNames, spacingToSldsClasses } from '@/utils/spacing';

const INDENT = '    ';

export type { GenerateLwcHtmlResult, GenerationError } from './types';

/**
 * Convert a builder tree into Salesforce LWC HTML.
 * Unknown nodes are skipped and reported; generation continues.
 */
export function generateLwcHtml(tree: BuilderNode[]): GenerateLwcHtmlResult {
  const errors: GenerationError[] = [];
  const blocks: string[] = [];

  for (const node of tree) {
    const html = emitNode(node, 0, undefined, errors);
    if (html) blocks.push(html);
  }

  return {
    html: blocks.join('\n\n'),
    errors,
  };
}

function emitNode(
  node: BuilderNode,
  depth: number,
  slotName: string | undefined,
  errors: GenerationError[]
): string {
  const def = getComponentDefinition(node.type);
  if (!def) {
    errors.push({
      nodeId: node.id,
      componentType: node.type,
      message: `No ComponentDefinition is registered for type "${node.type}".`,
    });
    return '';
  }

  const pad = INDENT.repeat(depth);
  const attrPad = INDENT.repeat(depth + 1);
  const tag = def.output.tagName;
  const attributes = collectAttributes(node, def, errors);

  if (slotName) {
    attributes.unshift(`slot="${escapeAttr(slotName)}"`);
  }

  const childBlocks = emitChildren(node, def, depth + 1, errors);
  const open = formatOpenTag(pad, attrPad, tag, attributes);

  if (childBlocks.length === 0) {
    return `${open}\n${pad}</${tag}>`;
  }

  return `${open}\n\n${childBlocks.join('\n\n')}\n\n${pad}</${tag}>`;
}

function formatOpenTag(
  pad: string,
  attrPad: string,
  tag: string,
  attributes: string[]
): string {
  if (attributes.length === 0) {
    return `${pad}<${tag}>`;
  }
  return `${pad}<${tag}\n${attributes.map((attr) => `${attrPad}${attr}`).join('\n')}>`;
}

function emitChildren(
  node: BuilderNode,
  def: ComponentDefinition,
  childDepth: number,
  errors: GenerationError[]
): string[] {
  const slotDefs = def.composition.slots ?? [];
  const blocks: string[] = [];

  for (const slotDef of slotDefs) {
    const children = node.slots?.[slotDef.name] ?? [];
    const assignedSlot = salesforceSlotName(slotDef);
    for (const child of children) {
      const html = emitNode(child, childDepth, assignedSlot, errors);
      if (html) blocks.push(html);
    }
  }

  return blocks;
}

/** Named Salesforce slot, or undefined for the unnamed default slot. */
function salesforceSlotName(slotDef: SlotDefinition): string | undefined {
  if (slotDef.isDefault) return undefined;
  return slotDef.salesforceSlot;
}

function collectAttributes(
  node: BuilderNode,
  def: ComponentDefinition,
  errors: GenerationError[]
): string[] {
  const attributes: string[] = [];
  const resolved = resolveAttributesForVisibility(def, node.attributes ?? {});
  let classFromProperty: string | undefined;

  for (const property of def.properties) {
    if (property.htmlAttribute === false) continue;
    if (!isPropertyVisible(property, resolved)) continue;

    const value = resolveOutputValue(node, property);
    const serialized = serializeAttribute(property, value);

    if (serialized !== null) {
      const name = property.attributeName ?? property.name;
      if (name === 'class' && typeof value === 'string') {
        classFromProperty = value;
        continue;
      }
      attributes.push(serialized);
      continue;
    }

    if (property.required && isMissingValue(value)) {
      errors.push({
        nodeId: node.id,
        componentType: node.type,
        message: `Required property "${property.name}" has no value.`,
      });
    }
  }

  const classValue = mergeClassNames(classFromProperty, spacingToSldsClasses(node.spacing).join(' '));
  if (classValue) {
    attributes.push(`class="${escapeAttr(classValue)}"`);
  }

  return attributes;
}

function resolveOutputValue(
  node: BuilderNode,
  property: ComponentPropertyDefinition
): unknown {
  const current = node.attributes?.[property.name];
  if (current !== undefined) return current;
  if (property.required) return property.defaultValue;
  return undefined;
}

function isMissingValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * Returns a Salesforce HTML attribute fragment, or null to omit.
 * Boolean true → presence (`disabled`). Boolean false → omitted.
 */
function serializeAttribute(
  property: ComponentPropertyDefinition,
  value: unknown
): string | null {
  if (value === undefined || value === null) return null;

  const name = property.attributeName ?? property.name;

  if (property.type === 'boolean') {
    return value === true ? name : null;
  }

  if (property.type === 'number') {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `${name}="${String(value)}"`;
    }
    return null;
  }

  if (typeof value === 'string') {
    if (value === '') return null;
    return `${name}="${escapeAttr(value)}"`;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${name}="${String(value)}"`;
  }

  return null;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
