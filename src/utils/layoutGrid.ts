import type { LayoutViewport } from '@/types/style';
import type { BuilderNode } from '@/types/builder';
import type { ComponentDefinition } from '@/types/component';
import type { CSSProperties } from 'react';

export type { LayoutViewport };

function readColumn(attributes: Record<string, unknown>, name: string): number | undefined {
  const value = attributes[name];
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value !== ''
        ? Number(value)
        : NaN;
  if (!Number.isFinite(numeric)) return undefined;
  return Math.min(12, Math.max(1, Math.round(numeric)));
}

function firstDefined(...values: Array<number | undefined>): number | undefined {
  for (const value of values) {
    if (value !== undefined) return value;
  }
  return undefined;
}

/**
 * Salesforce lightning-layout-item mobile-first size cascade.
 *
 * - small (mobile): `size`
 * - medium (tablet): medium-device-size → small-device-size → size
 * - large (desktop): large-device-size → medium → small → size
 *
 * `small-device-size` applies to devices larger than mobile, so it is not
 * used at the Small/mobile viewport.
 */
export function getEffectiveColumnSpan(
  attributes: Record<string, unknown>,
  viewport: LayoutViewport
): number | undefined {
  const size = readColumn(attributes, 'size');
  const small = readColumn(attributes, 'small-device-size');
  const medium = readColumn(attributes, 'medium-device-size');
  const large = readColumn(attributes, 'large-device-size');

  switch (viewport) {
    case 'large':
      return firstDefined(large, medium, small, size);
    case 'medium':
      return firstDefined(medium, small, size);
    case 'small':
    default:
      return size;
  }
}

const LAYOUT_ITEM_PADDING: Record<string, CSSProperties> = {
  'around-small': { padding: '0.75rem' },
  'around-medium': { padding: '1rem' },
  'around-large': { padding: '1.5rem' },
  'horizontal-small': { paddingLeft: '0.75rem', paddingRight: '0.75rem' },
  'horizontal-medium': { paddingLeft: '1rem', paddingRight: '1rem' },
  'horizontal-large': { paddingLeft: '1.5rem', paddingRight: '1.5rem' },
};

function flexibilityFlags(value: unknown): {
  grow: boolean | undefined;
  shrink: boolean | undefined;
  noFlex: boolean;
} {
  if (typeof value !== 'string' || value === '') {
    return { grow: undefined, shrink: undefined, noFlex: false };
  }
  const parts = value.split(',').map((part) => part.trim());
  return {
    grow: parts.includes('grow') ? true : parts.includes('no-grow') ? false : parts.includes('auto') ? true : undefined,
    shrink: parts.includes('shrink')
      ? true
      : parts.includes('no-shrink')
        ? false
        : parts.includes('auto')
          ? true
          : undefined,
    noFlex: parts.includes('no-flex'),
  };
}

/**
 * Visual style for a layout item: 12-column span, flexibility, Salesforce
 * padding attribute, and alignment-bump. Used by canvas and preview.
 */
export function getLayoutItemStyle(
  node: BuilderNode,
  def: ComponentDefinition | undefined,
  viewport: LayoutViewport
): CSSProperties {
  const style: CSSProperties = {
    minWidth: 0,
    boxSizing: 'border-box',
  };

  const attributes = node.attributes ?? {};
  const span =
    def?.properties.some((p) => p.responsive)
      ? getEffectiveColumnSpan(attributes, viewport)
      : undefined;

  const flex = flexibilityFlags(attributes.flexibility);

  if (span !== undefined) {
    const width = `${(span / 12) * 100}%`;
    style.flexBasis = width;
    style.maxWidth = width;
    style.width = width;
  }

  if (flex.noFlex) {
    style.flexGrow = 0;
    style.flexShrink = 0;
  } else {
    if (flex.grow !== undefined) style.flexGrow = flex.grow ? 1 : 0;
    else if (span !== undefined) style.flexGrow = 0;
    if (flex.shrink !== undefined) style.flexShrink = flex.shrink ? 1 : 0;
    else if (span !== undefined) style.flexShrink = 0;
  }

  const paddingKey = attributes.padding;
  if (typeof paddingKey === 'string' && LAYOUT_ITEM_PADDING[paddingKey]) {
    Object.assign(style, LAYOUT_ITEM_PADDING[paddingKey]);
  }

  const bump = attributes['alignment-bump'];
  if (bump === 'left') style.marginLeft = 'auto';
  if (bump === 'right') style.marginRight = 'auto';
  if (bump === 'top') style.marginTop = 'auto';
  if (bump === 'bottom') style.marginBottom = 'auto';

  return style;
}

const PULL_TO_BOUNDARY: Record<string, CSSProperties> = {
  small: { marginLeft: '-0.75rem', marginRight: '-0.75rem' },
  medium: { marginLeft: '-1rem', marginRight: '-1rem' },
  large: { marginLeft: '-1.5rem', marginRight: '-1.5rem' },
};

export function getLayoutPullStyle(attributes: Record<string, unknown>): CSSProperties | undefined {
  const value = attributes['pull-to-boundary'];
  if (typeof value !== 'string' || value === '') return undefined;
  return PULL_TO_BOUNDARY[value];
}
