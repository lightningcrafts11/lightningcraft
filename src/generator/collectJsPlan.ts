import type { BuilderNode } from '@/types/builder';
import type {
  ComponentPropertyDefinition,
  JsClassBehavior,
  JsClassExtends,
  JsInitializer,
  JsRole,
} from '@/types/component';
import { DEFAULT_LWC_CLASS_EXTENDS } from '@/types/component';
import type {
  BindingAssignment,
  JsField,
  JsHandler,
  JsImport,
  LwcBundlePlan,
} from '@/types/lwcExport';
import type { GenerationError } from '@/types/lwcExport';
import { getComponentDefinition } from '@/metadata';
import { isPropertyVisible, resolveAttributesForVisibility } from '@/utils/propertyVisibility';
import { isValidJsBindingName, toCamelIdentifier } from './jsIdentifiers';
import { isNestedClassOwner, nestedClassOwnerExportError } from './nestedClassOwner';
import { stripInternalFields } from './stripInternalFields';

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
  let jsClass: JsClassBehavior | undefined;
  const classOwnerIds: string[] = [];
  const extraImports: JsImport[] = [];

  const visit = (node: BuilderNode, isCanvasRoot: boolean): void => {
    const def = getComponentDefinition(node.type);
    if (!def) {
      errors.push({
        nodeId: node.id,
        componentType: node.type,
        message: `No ComponentDefinition is registered for type "${node.type}".`,
      });
      return;
    }

    if (isNestedClassOwner(def, isCanvasRoot)) {
      errors.push(nestedClassOwnerExportError(node));
      return;
    }

    if (def.jsClass) {
      classOwnerIds.push(node.id);
      jsClass = mergeJsClass(jsClass, def.jsClass, node, errors);
      for (const extra of def.jsClass.imports ?? []) {
        mergeImport(extraImports, extra, node, errors);
      }
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

    if (def.composition.slots) {
      for (const slotDef of def.composition.slots) {
        for (const child of node.slots?.[slotDef.name] ?? []) {
          visit(child, false);
        }
      }
      return;
    }

    for (const children of Object.values(node.slots ?? {})) {
      for (const child of children) visit(child, false);
    }
  };

  for (const node of tree) visit(node, true);

  validateClassOwner(tree, classOwnerIds, errors);
  const classExtends = resolveClassExtends(jsClass, errors);
  const imports = buildImports(fields, classExtends, extraImports, errors);
  validateFieldHandlerCollisions(fields, handlers, errors);

  return {
    fields: fields.map((field) => ({
      name: field.name,
      role: field.role,
      initializer: field.initializer,
      ...(field.value !== undefined ? { value: field.value } : {}),
    })),
    handlers,
    imports,
    assignments,
    errors,
    warnings,
    classExtends,
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
  if (property.warnWhenUnstructuredOptions !== true) return;
  if (hasStructuredOptions(value)) return;
  warnings.push({
    nodeId: node.id,
    componentType,
    message:
      `"${componentType}" options are not structured in the builder. ` +
      'Generated JavaScript uses an empty array. Add option objects in the LWC JavaScript file.',
  });
}

function mergeJsClass(
  current: JsClassBehavior | undefined,
  next: JsClassBehavior,
  node: BuilderNode,
  errors: GenerationError[]
): JsClassBehavior {
  if (!current) return next;
  if (!sameClassExtends(current.extends, next.extends)) {
    errors.push({
      nodeId: node.id,
      componentType: node.type,
      message:
        `Generated class cannot extend both "${current.extends.name}" and "${next.extends.name}".`,
    });
    return current;
  }
  return next;
}

function sameClassExtends(a: JsClassExtends, b: JsClassExtends): boolean {
  return a.name === b.name && a.module === b.module && a.importKind === b.importKind;
}

function validateClassOwner(
  tree: BuilderNode[],
  classOwnerIds: string[],
  errors: GenerationError[]
): void {
  if (classOwnerIds.length === 0) return;
  const root = tree[0];
  const ownerIsUniqueRoot =
    tree.length === 1 && classOwnerIds.length === 1 && root !== undefined && classOwnerIds[0] === root.id;
  if (ownerIsUniqueRoot) return;
  errors.push({
    nodeId: classOwnerIds[0] ?? root?.id ?? '',
    componentType: root?.type ?? '',
    message:
      'A component that defines the generated LWC class must be the only root node on the canvas.',
  });
}

function resolveClassExtends(
  jsClass: JsClassBehavior | undefined,
  errors: GenerationError[]
): JsClassExtends {
  const classExtends = jsClass?.extends ?? DEFAULT_LWC_CLASS_EXTENDS;
  if (!isValidJsBindingName(classExtends.name)) {
    errors.push({
      nodeId: '',
      componentType: '',
      message: `Generated class name "${classExtends.name}" is not a valid JavaScript identifier.`,
    });
  }
  return classExtends;
}

function validateFieldHandlerCollisions(
  fields: FieldRecord[],
  handlers: JsHandler[],
  errors: GenerationError[]
): void {
  const fieldNames = new Set(fields.map((field) => field.name));
  for (const handler of handlers) {
    if (!fieldNames.has(handler.name)) continue;
    errors.push({
      nodeId: '',
      componentType: '',
      message:
        `JavaScript identifier "${handler.name}" is used as both a field and an event handler.`,
    });
  }
}

function mergeImport(
  imports: JsImport[],
  next: JsImport,
  node: BuilderNode | undefined,
  errors: GenerationError[]
): void {
  const existing = imports.find((item) => item.module === next.module);
  if (!existing) {
    imports.push({
      module: next.module,
      named: [...next.named],
      ...(next.defaultImport ? { defaultImport: next.defaultImport } : {}),
    });
    return;
  }
  if (next.defaultImport) {
    if (existing.defaultImport && existing.defaultImport !== next.defaultImport) {
      errors.push({
        nodeId: node?.id ?? '',
        componentType: node?.type ?? '',
        message:
          `Module "${next.module}" cannot provide both default imports "${existing.defaultImport}" and "${next.defaultImport}".`,
      });
    } else {
      existing.defaultImport = next.defaultImport;
    }
  }
  for (const name of next.named) {
    if (!existing.named.includes(name)) existing.named.push(name);
  }
}

function classExtendsImport(classExtends: JsClassExtends): JsImport {
  if (classExtends.importKind === 'default') {
    return { module: classExtends.module, named: [], defaultImport: classExtends.name };
  }
  return { module: classExtends.module, named: [classExtends.name] };
}

function prioritizeLwcModule(imports: JsImport[]): JsImport[] {
  const lwc = imports.filter((item) => item.module === 'lwc');
  const rest = imports.filter((item) => item.module !== 'lwc');
  return [...lwc, ...rest];
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

function buildImports(
  fields: FieldRecord[],
  classExtends: JsClassExtends,
  extraImports: JsImport[],
  errors: GenerationError[]
): JsImport[] {
  const imports: JsImport[] = [];
  mergeImport(imports, classExtendsImport(classExtends), undefined, errors);
  if (fields.some((field) => field.role === 'api')) {
    mergeImport(imports, { module: 'lwc', named: ['api'] }, undefined, errors);
  }
  for (const extra of extraImports) {
    mergeImport(imports, extra, undefined, errors);
  }
  return prioritizeLwcModule(imports);
}
