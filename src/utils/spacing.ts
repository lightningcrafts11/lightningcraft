import type { CSSProperties } from 'react';
import type {
  SpacingBox,
  SpacingConfig,
  SpacingDirection,
  SpacingSize,
} from '@/types/style';
import { SPACING_DIRECTIONS } from '@/types/style';

/** SLDS spacing tokens (rem). Source: Salesforce Design System spacing aliases. */
export const SLDS_SPACING_REM: Record<SpacingSize, string> = {
  none: '0',
  'xxx-small': '0.125rem',
  'xx-small': '0.25rem',
  'x-small': '0.5rem',
  small: '0.75rem',
  medium: '1rem',
  large: '1.5rem',
  'x-large': '2rem',
  'xx-large': '3rem',
};

const DIRECTION_SIDES: Record<SpacingDirection, Array<'top' | 'right' | 'bottom' | 'left'>> = {
  around: ['top', 'right', 'bottom', 'left'],
  top: ['top'],
  right: ['right'],
  bottom: ['bottom'],
  left: ['left'],
  horizontal: ['left', 'right'],
  vertical: ['top', 'bottom'],
};

const SIDE_CSS: Record<'top' | 'right' | 'bottom' | 'left', { margin: keyof CSSProperties; padding: keyof CSSProperties }> =
  {
    top: { margin: 'marginTop', padding: 'paddingTop' },
    right: { margin: 'marginRight', padding: 'paddingRight' },
    bottom: { margin: 'marginBottom', padding: 'paddingBottom' },
    left: { margin: 'marginLeft', padding: 'paddingLeft' },
  };

/**
 * SLDS utility class names for a spacing config.
 * Example: margin.left=small → slds-m-left_small
 */
export function spacingToSldsClasses(spacing: SpacingConfig | undefined): string[] {
  if (!spacing) return [];
  const classes: string[] = [];
  appendBoxClasses(classes, 'm', spacing.margin);
  appendBoxClasses(classes, 'p', spacing.padding);
  return unique(classes);
}

function appendBoxClasses(
  classes: string[],
  prefix: 'm' | 'p',
  box: SpacingBox | undefined
): void {
  if (!box) return;
  for (const direction of SPACING_DIRECTIONS) {
    const size = box[direction];
    if (!size) continue;
    classes.push(`slds-${prefix}-${direction}_${size}`);
  }
}

/** Inline styles using the same SLDS tokens as the generated class names. */
export function spacingToCssProperties(spacing: SpacingConfig | undefined): CSSProperties {
  const style: CSSProperties = {};
  if (!spacing) return style;
  applyBox(style, 'margin', spacing.margin);
  applyBox(style, 'padding', spacing.padding);
  return style;
}

function applyBox(
  style: CSSProperties,
  kind: 'margin' | 'padding',
  box: SpacingBox | undefined
): void {
  if (!box) return;
  for (const direction of SPACING_DIRECTIONS) {
    const size = box[direction];
    if (!size) continue;
    const rem = SLDS_SPACING_REM[size];
    for (const side of DIRECTION_SIDES[direction]) {
      const key = SIDE_CSS[side][kind];
      (style as Record<string, string>)[key as string] = rem;
    }
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

/** Set or clear one spacing direction. Empty config is stored as undefined. */
export function setSpacingField(
  spacing: SpacingConfig | undefined,
  kind: 'margin' | 'padding',
  direction: SpacingDirection,
  size: SpacingSize | undefined
): SpacingConfig | undefined {
  const nextBox: SpacingBox = { ...(spacing?.[kind] ?? {}) };
  if (!size) {
    delete nextBox[direction];
  } else {
    nextBox[direction] = size;
  }

  const next: SpacingConfig = { ...spacing };
  if (Object.keys(nextBox).length === 0) {
    delete next[kind];
  } else {
    next[kind] = nextBox;
  }

  if (!next.margin && !next.padding) return undefined;
  return next;
}

export function mergeClassNames(...parts: Array<string | undefined>): string | undefined {
  const tokens = parts
    .flatMap((part) => (part ?? '').split(/\s+/))
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) return undefined;
  return unique(tokens).join(' ');
}
