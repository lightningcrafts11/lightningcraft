import type { BuilderNode } from '@/types/builder';
import type { ComponentPropertyDefinition, JsInitializer, JsRole } from '@/types/component';
import type {
  BindingAssignment,
  JsField,
  JsHandler,
  JsImport,
  LwcBundlePlan,
} from '@/types/lwcExport';
import type { GenerationError } from '@/types/lwcExport';
import { isPropertyVisible, resolveAttributesForVisibility } from '@/utils/propertyVisibility';
import { isValidJsBindingName, toCamelIdentifier } from './jsIdentifiers';
import { stripInternalFields } from './stripInternalFields';
import { walkBuilderTree } from './walkBuilderTree';

interface FieldRecord extends JsField {
  fingerprint: string;
}

export function collectJsPlan(tree: BuilderNode[]): LwcBundlePlan {
  const errors: GenerationError[] = [];
  const warnings: GenerationError[] = [];
  const assignments: BindingAssignment[] = [];
  const fields: FieldRecord[] = [];
  const handlerNames = new Set<string>();
  const handlers: JsHandler[] = [];

  for (const { node, def } of walkBuilderTree(tree)) {
    if (!def) {
      errors.push({
        nodeId: node.id,
        componentType: node.type,
        message: `No ComponentDefinition is registered for type "${node.type}".`,
      });
      continue;
    }

    const resolved = resolveAttributesForVisibility(def, node.attributes ?? {});

    for (const property of def.properties) {
      if (!isPropertyVisible(property, resolved)) continue;
      const role = resolveJsRole(property);
      if (!role) continue;

      const value = resolvePropertyValue(node, property);

      if (role === 'handler') {
        collectHandler(node, def.type, property, value, handlerNames, handlers, assignments, errors);
        continue;
      }

      collectBinding(
        node,
        def.type,
        property,
        role,
        value,
        fields,
        assignments,
        errors,
        warnings
      );
    }
  }

  return {
    fields: fields.map((field) => ({
      name: field.name,
      role: field.role,
      initializer: field.initializer,
      ...(field.value !== undefined ? { value: field.value } : {}),
    })),
    handlers,
    imports: buildImports(fields),
    assignments,
    errors,
    warnings,
  };
}

function resolveJsRole(property: ComponentPropertyDefinition): JsRole | undefined {
  if (property.jsRole) return property.jsRole;
  if (property.outputKind === 'event') return 'handler';
  if (property.outputKind === 'binding') return 'internal-field';
  return undefined;
}

function resolvePropertyValue(
  node: BuilderNode,
  property: ComponentPropertyDefinition
): unknown {
  const current = node.attributes?.[property.name];
  if (current !== undefined) return current;
  if (property.required) return property.defaultValue;
  return undefined;
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function collectHandler(
  node: BuilderNode,
  componentType: string,
  property: ComponentPropertyDefinition,
  value: unknown,
  handlerNames: Set<string>,
  handlers: JsHandler[],
  assignments: BindingAssignment[],
  errors: GenerationError[]
): void {
  if (typeof value !== 'string') return;
  const name = value.trim();
  if (name === '') return;

  if (!isValidJsBindingName(name)) {
    errors.push({
      nodeId: node.id,
      componentType,
      message: `Event handler "${name}" on "${property.name}" is not a valid JavaScript identifier.`,
    });
    return;
  }

  if (handlerNames.has(name)) {
    assignments.push({ nodeId: node.id, propertyName: property.name, identifier: name });
    return;
  }
  handlerNames.add(name);
  handlers.push({ name });
  assignments.push({ nodeId: node.id, propertyName: property.name, identifier: name });
}

function collectBinding(
  node: BuilderNode,
  componentType: string,
  property: ComponentPropertyDefinition,
  role: JsRole,
  value: unknown,
  fields: FieldRecord[],
  assignments: BindingAssignment[],
  errors: GenerationError[],
  warnings: GenerationError[]
): void {
  if (isMissing(value) && !property.required) return;

  const initializer = property.jsInitializer ?? inferInitializer(property, value);
  const explicit = isExplicitIdentifier(value);

  let identifier: string | undefined;
  if (explicit) {
    const name = String(value).trim();
    if (!isValidJsBindingName(name)) {
      errors.push({
        nodeId: node.id,
        componentType,
        message: `Binding "${name}" on "${property.name}" is not a valid JavaScript identifier.`,
      });
      return;
    }
    identifier = name;
  } else {
    identifier = autoIdentifier(property);
    if (!identifier || !isValidJsBindingName(identifier)) {
      errors.push({
        nodeId: node.id,
        componentType,
        message: `Could not determine a valid JavaScript identifier for "${property.name}".`,
      });
      return;
    }
  }

  const fingerprint = fieldFingerprint(property, initializer, value);

  const existing = fields.find((field) => field.name === identifier);
  if (existing) {
    if (existing.fingerprint === fingerprint) {
      assignments.push({ nodeId: node.id, propertyName: property.name, identifier });
      maybeWarnUnstructuredOptions(node, componentType, property, value, warnings);
      return;
    }
    if (explicit) {
      errors.push({
        nodeId: node.id,
        componentType,
        message:
          `JavaScript identifier "${identifier}" is used for different values. ` +
          'Rename one of the bindings in the property inspector.',
      });
      assignments.push({ nodeId: node.id, propertyName: property.name, identifier });
      return;
    }
    identifier = uniquify(identifier, new Set(fields.map((field) => field.name)));
  }

  const field: FieldRecord = {
    name: identifier,
    role,
    initializer,
    fingerprint,
  };
  if (initializer === 'literal') {
    field.value = literalValue(property, value);
  }
  fields.push(field);
  assignments.push({ nodeId: node.id, propertyName: property.name, identifier });
  maybeWarnUnstructuredOptions(node, componentType, property, value, warnings);
}

function inferInitializer(
  property: ComponentPropertyDefinition,
  value: unknown
): JsInitializer {
  if (property.jsInitializer) return property.jsInitializer;
  if (Array.isArray(value) || (value && typeof value === 'object')) return 'literal';
  return 'none';
}

function isExplicitIdentifier(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

function autoIdentifier(property: ComponentPropertyDefinition): string | undefined {
  if (property.jsBinding && isValidJsBindingName(property.jsBinding)) return property.jsBinding;
  const fallback = toCamelIdentifier(property.attributeName ?? property.name);
  return fallback || undefined;
}

function uniquify(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let index = 2;
  let next = `${base}${index}`;
  while (used.has(next)) {
    index += 1;
    next = `${base}${index}`;
  }
  return next;
}

function fieldFingerprint(
  property: ComponentPropertyDefinition,
  initializer: JsInitializer,
  value: unknown
): string {
  if (initializer === 'empty-array') return '[]';
  if (initializer === 'empty-object') return '{}';
  if (initializer === 'none') return 'none';
  return JSON.stringify(literalValue(property, value));
}

function literalValue(property: ComponentPropertyDefinition, value: unknown): unknown {
  const serialized = property.serializeJsValue ? property.serializeJsValue(value) : value;
  return stripInternalFields(serialized);
}

function maybeWarnUnstructuredOptions(
  node: BuilderNode,
  componentType: string,
  property: ComponentPropertyDefinition,
  value: unknown,
  warnings: GenerationError[]
): void {
  if (property.name !== 'options') return;
  if (hasStructuredOptions(value)) return;
  warnings.push({
    nodeId: node.id,
    componentType,
    message:
      `"${componentType}" options are not structured in the builder. ` +
      'Generated JavaScript uses an empty array. Add option objects in the LWC JavaScript file.',
  });
}

function hasStructuredOptions(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      typeof (item as { label?: unknown }).label === 'string' &&
      typeof (item as { value?: unknown }).value === 'string'
  );
}

function buildImports(fields: FieldRecord[]): JsImport[] {
  const named = ['LightningElement'];
  if (fields.some((field) => field.role === 'api')) named.push('api');
  return [{ module: 'lwc', named }];
}
