const INTERNAL_KEYS = new Set(['lcKey']);

/**
 * Recursively removes LightningCraft-only keys from a structured value
 * so it can be emitted as Salesforce JavaScript.
 */
export function stripInternalFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripInternalFields(item));
  }
  if (!value || typeof value !== 'object') return value;

  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (INTERNAL_KEYS.has(key)) continue;
    next[key] = stripInternalFields(entry);
  }
  return next;
}

const LEAK_PATTERNS = [
  { id: 'lcKey', pattern: /lcKey/ },
  { id: 'dnd-kit', pattern: /dnd-kit/i },
  { id: 'lucide', pattern: /lucide/i },
];

export interface LeakMatch {
  id: string;
  file: 'html' | 'js' | 'metaXml';
}

/** Returns leak matches in generated bundle files. */
export function findInternalLeaks(files: {
  html: string;
  js: string;
  metaXml: string;
}): LeakMatch[] {
  const matches: LeakMatch[] = [];
  for (const file of ['html', 'js', 'metaXml'] as const) {
    const text = files[file];
    for (const leak of LEAK_PATTERNS) {
      if (leak.pattern.test(text)) {
        matches.push({ id: leak.id, file });
      }
    }
  }
  return matches;
}
