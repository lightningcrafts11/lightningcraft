/** ECMAScript reserved words and literals that must not be used as identifiers. */
const JS_RESERVED_WORDS = new Set([
  'abstract',
  'arguments',
  'await',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'function',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'let',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'volatile',
  'while',
  'with',
  'yield',
]);

const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function isReservedJsWord(value: string): boolean {
  return JS_RESERVED_WORDS.has(value);
}

export function isSafeJsIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value);
}

/** True when `value` may be used as a generated LWC field or handler name. */
export function isValidJsBindingName(value: string): boolean {
  return isSafeJsIdentifier(value) && !isReservedJsWord(value);
}

export function toCamelIdentifier(name: string): string {
  return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}
