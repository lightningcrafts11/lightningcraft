import type { LwcBundlePlan } from '@/types/lwcExport';
import { toLwcClassName } from './validateLwcName';

const INDENT = '    ';

export function generateLwcJs(plan: LwcBundlePlan, componentName: string): string {
  const className = toLwcClassName(componentName);
  const lines: string[] = [];

  lines.push(renderImport(plan));
  lines.push('');

  const body = renderClassBody(plan);
  if (body.length === 0) {
    lines.push(`export default class ${className} extends LightningElement {}`);
  } else {
    lines.push(`export default class ${className} extends LightningElement {`);
    lines.push(...body);
    lines.push('}');
  }

  return `${lines.join('\n')}\n`;
}

function renderImport(plan: LwcBundlePlan): string {
  const named = plan.imports[0]?.named ?? ['LightningElement'];
  const unique = [...new Set(named)];
  return `import { ${unique.join(', ')} } from "lwc";`;
}

function renderClassBody(plan: LwcBundlePlan): string[] {
  const lines: string[] = [];

  for (const field of plan.fields) {
    const prefix = field.role === 'api' ? '@api ' : '';
    if (field.initializer === 'none') {
      lines.push(`${INDENT}${prefix}${field.name};`);
      continue;
    }
    lines.push(`${INDENT}${prefix}${field.name} = ${initializerSource(field)};`);
  }

  if (plan.fields.length > 0 && plan.handlers.length > 0) {
    lines.push('');
  }

  for (const handler of plan.handlers) {
    lines.push(`${INDENT}${handler.name}(event) {}`);
  }

  return lines;
}

function initializerSource(field: { initializer: string; value?: unknown }): string {
  if (field.initializer === 'empty-array') return '[]';
  if (field.initializer === 'empty-object') return '{}';
  if (field.initializer === 'none') return 'undefined';
  return printJsValue(field.value, 1);
}

export function printJsValue(value: unknown, indentLevel: number): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return printArray(value, indentLevel);
  if (value && typeof value === 'object') return printObject(value as Record<string, unknown>, indentLevel);
  return 'undefined';
}

function printArray(value: unknown[], indentLevel: number): string {
  if (value.length === 0) return '[]';
  const innerIndent = INDENT.repeat(indentLevel + 1);
  const closeIndent = INDENT.repeat(indentLevel);
  const items = value.map((item) => `${innerIndent}${printJsValue(item, indentLevel + 1)}`);
  return `[\n${items.join(',\n')}\n${closeIndent}]`;
}

function printObject(value: Record<string, unknown>, indentLevel: number): string {
  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined);
  if (entries.length === 0) return '{}';
  const innerIndent = INDENT.repeat(indentLevel + 1);
  const closeIndent = INDENT.repeat(indentLevel);
  const items = entries.map(([key, entry]) => {
    const printedKey = isBareKey(key) ? key : JSON.stringify(key);
    return `${innerIndent}${printedKey}: ${printJsValue(entry, indentLevel + 1)}`;
  });
  return `{\n${items.join(',\n')}\n${closeIndent}}`;
}

function isBareKey(key: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}
