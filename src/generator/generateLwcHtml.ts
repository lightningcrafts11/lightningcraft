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
import { collectJsPlan } from './collectJsPlan';
import { isValidJsBindingName } from './jsIdentifiers';
import { isNestedClassOwner, nestedClassOwnerExportError } from './nestedClassOwner';
import type { LwcBundlePlan } from '@/types/lwcExport';

const INDENT = '    ';

export type { GenerateLwcHtmlResult, GenerationError } from './types';

/**
 * Convert a builder tree into Salesforce LWC HTML.
 * Unknown nodes are skipped and reported; generation continues.
 */
export function generateLwcHtml(
  tree: BuilderNode[],
  plan?: LwcBundlePlan
): GenerateLwcHtmlResult {
  const errors: GenerationError[] = [];
  const blocks: string[] = [];
  const resolvedPlan = plan ?? collectJsPlan(tree);
  errors.push(...resolvedPlan.errors);

  for (const node of tree) {
    const html = emitNode(node, 0, undefined, errors, resolvedPlan, true);
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
  errors: GenerationError[],
  plan: LwcBundlePlan,
  isCanvasRoot: boolean
): string {
  const def = getComponentDefinition(node.type);
  if (!def) {
    return '';
  }

  if (isNestedClassOwner(def, isCanvasRoot)) {
    errors.push(nestedClassOwnerExportError(node));
    return '';
  }

  if (def.output.unwrap) {
    if (slotName) {
      errors.push({
        nodeId: node.id,
        componentType: node.type,
        message:
          'An unwrapped component cannot be placed in a named Salesforce slot. ' +
          'It must be the canvas root so helper tags emit as template children.',
      });
    }
    return emitChildren(node, def, depth, errors, plan).join('\n\n');
  }

  if (!def.output.tagName) {
    errors.push({
      nodeId: node.id,
      componentType: node.type,
      message: 'ComponentDefinition is missing output.tagName.',
    });
    return '';
  }

  const pad = INDENT.repeat(depth);
  const attrPad = INDENT.repeat(depth + 1);
  const tag = def.output.tagName;
  const attributes = collectAttributes(node, def, errors, plan);

  if (slotName) {
    attributes.unshift(`slot="${escapeAttr(slotName)}"`);
  }

  const childBlocks = emitChildren(node, def, depth + 1, errors, plan);
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
  errors: GenerationError[],
  plan: LwcBundlePlan
): string[] {
  const slotDefs = def.composition.slots ?? [];
  const blocks: string[] = [];

  for (const slotDef of slotDefs) {
    const children = node.slots?.[slotDef.name] ?? [];
    const assignedSlot = slotDef.wrapperTag ? undefined : salesforceSlotName(slotDef);
    const nestedDepth = slotDef.wrapperTag ? childDepth + 1 : childDepth;
    const childBlocks: string[] = [];
    for (const child of children) {
      const html = emitNode(child, nestedDepth, assignedSlot, errors, plan, false);
      if (html) childBlocks.push(html);
    }

    if (slotDef.wrapperTag) {
      const wrapped = emitWrappedSlot(node, def, slotDef, childBlocks, childDepth, errors, plan);
      if (wrapped) blocks.push(wrapped);
      continue;
    }

    blocks.push(...childBlocks);
  }

  return blocks;
}

function emitWrappedSlot(
  parent: BuilderNode,
  def: ComponentDefinition,
  slotDef: SlotDefinition,
  childBlocks: string[],
  depth: number,
  errors: GenerationError[],
  plan: LwcBundlePlan
): string {
  const tag = slotDef.wrapperTag;
  if (!tag) return '';

  const text = wrapperText(parent, slotDef);
  const attributes = collectWrapperAttributes(parent, def, slotDef, errors, plan);
  const shouldEmit =
    slotDef.emitWrapperWhenEmpty === true ||
    childBlocks.length > 0 ||
    text !== undefined ||
    attributes.length > 0;

  if (!shouldEmit) return '';

  const pad = INDENT.repeat(depth);
  const attrPad = INDENT.repeat(depth + 1);
  const open = formatOpenTag(pad, attrPad, tag, attributes);
  const inner: string[] = [];
  if (text !== undefined) {
    inner.push(`${INDENT.repeat(depth + 1)}${escapeText(text)}`);
  }
  inner.push(...childBlocks);

  if (inner.length === 0) {
    return `${open}\n${pad}</${tag}>`;
  }

  return `${open}\n\n${inner.join('\n\n')}\n\n${pad}</${tag}>`;
}

function wrapperText(parent: BuilderNode, slotDef: SlotDefinition): string | undefined {
  if (!slotDef.wrapperTextProperty) return undefined;
  const value = parent.attributes?.[slotDef.wrapperTextProperty];
  if (typeof value !== 'string' || value === '') return undefined;
  return value;
}

function collectWrapperAttributes(
  parent: BuilderNode,
  def: ComponentDefinition,
  slotDef: SlotDefinition,
  errors: GenerationError[],
  plan: LwcBundlePlan
): string[] {
  const attributes: string[] = [];
  const resolved = resolveAttributesForVisibility(def, parent.attributes ?? {});
  for (const propertyName of slotDef.wrapperAttributes ?? []) {
    const property = def.properties.find((item) => item.name === propertyName);
    if (!property) continue;
    if (!isPropertyVisible(property, resolved)) continue;
    const value = resolveOutputValue(parent, property);
    const assigned = assignedIdentifier(plan, parent.id, property.name);
    const serialized = serializeAttribute(property, value, assigned);
    if (serialized !== null) {
      attributes.push(serialized);
      continue;
    }
    if (property.required && isMissingValue(value)) {
      errors.push({
        nodeId: parent.id,
        componentType: parent.type,
        message: `Required property "${property.name}" has no value.`,
      });
    }
  }
  return attributes;
}

/** Named Salesforce slot, or undefined for the unnamed default slot. */
function salesforceSlotName(slotDef: SlotDefinition): string | undefined {
  if (slotDef.isDefault) return undefined;
  return slotDef.salesforceSlot;
}

function collectAttributes(
  node: BuilderNode,
  def: ComponentDefinition,
  errors: GenerationError[],
  plan: LwcBundlePlan
): string[] {
  const attributes: string[] = [];
  const resolved = resolveAttributesForVisibility(def, node.attributes ?? {});
  let classFromProperty: string | undefined;

  for (const property of def.properties) {
    if (property.outputKind !== 'binding' && property.outputKind !== 'event') {
      if (property.htmlAttribute === false) continue;
    }
    if (!isPropertyVisible(property, resolved)) continue;

    const value = resolveOutputValue(node, property);
    const assigned = assignedIdentifier(plan, node.id, property.name);
    const serialized = serializeAttribute(property, value, assigned);

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
  value: unknown,
  assigned: string | undefined
): string | null {
  const name = property.attributeName ?? property.name;
  const outputKind = property.outputKind ?? 'attribute';

  if (outputKind === 'binding' || outputKind === 'event') {
    if (assigned && isValidJsBindingName(assigned)) {
      return `${name}={${assigned}}`;
    }
    return null;
  }

  if (value === undefined || value === null) return null;

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

function assignedIdentifier(
  plan: LwcBundlePlan,
  nodeId: string,
  propertyName: string
): string | undefined {
  return plan.assignments.find(
    (assignment) => assignment.nodeId === nodeId && assignment.propertyName === propertyName
  )?.identifier;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}
