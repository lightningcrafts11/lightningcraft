import type { CSSProperties } from 'react';
import type { BuilderNode } from '@/types/builder';
import type { ComponentDefinition, SlotDefinition } from '@/types/component';
import type { LayoutViewport } from '@/types/style';
import { getLayoutPullStyle } from '@/utils/layoutGrid';
import { cn } from '@/utils/cn';

/** Canvas always models the Salesforce large/desktop cascade. */
export const CANVAS_LAYOUT_VIEWPORT: LayoutViewport = 'large';

const HORIZONTAL_ALIGN_CLASS: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  space: 'justify-around',
  spread: 'justify-between',
  end: 'justify-end',
};

const VERTICAL_ALIGN_CLASS: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

function readProperty(
  node: BuilderNode,
  def: ComponentDefinition | undefined,
  attributeName: string
): unknown {
  const property = def?.properties.find(
    (item) => item.attributeName === attributeName || item.name === attributeName
  );
  if (!property) return undefined;
  const current = node.attributes[property.name];
  return current !== undefined ? current : property.defaultValue;
}

export function getSlotFlexClass(
  parentNode: BuilderNode,
  parentDef: ComponentDefinition | undefined,
  slotDef: SlotDefinition
): string {
  const isHorizontal = slotDef.layout === 'horizontal';
  const multipleRows = readProperty(parentNode, parentDef, 'multiple-rows');
  const wrap = isHorizontal && Boolean(multipleRows);

  const hAlign = readProperty(parentNode, parentDef, 'horizontal-align');
  const vAlign = readProperty(parentNode, parentDef, 'vertical-align');

  return cn(
    isHorizontal
      ? cn('flex flex-row box-border min-w-0 w-full', wrap ? 'flex-wrap' : 'flex-nowrap overflow-x-auto')
      : 'flex flex-col gap-3 min-w-0',
    isHorizontal && typeof hAlign === 'string' && HORIZONTAL_ALIGN_CLASS[hAlign],
    isHorizontal && typeof vAlign === 'string' && VERTICAL_ALIGN_CLASS[vAlign]
  );
}

export function getSlotContainerStyle(
  parentNode: BuilderNode,
  parentDef: ComponentDefinition | undefined,
  slotDef: SlotDefinition
): CSSProperties | undefined {
  if (slotDef.layout !== 'horizontal') return undefined;
  const attrs = { ...parentDef?.defaultAttributes, ...parentNode.attributes };
  return getLayoutPullStyle(attrs);
}

export function getSlotContainerClass(
  parentNode: BuilderNode,
  parentDef: ComponentDefinition | undefined,
  slotDef: SlotDefinition,
  isOver: boolean,
  isValidDrop: boolean
): string {
  const isHorizontal = slotDef.layout === 'horizontal';

  return cn(
    getSlotFlexClass(parentNode, parentDef, slotDef),
    'rounded border border-dashed min-h-[36px] transition-colors duration-100 p-1.5',
    isHorizontal ? '' : 'gap-1.5',
    isOver && isValidDrop
      ? 'border-blue-400 bg-blue-50'
      : isValidDrop
        ? 'border-blue-200 bg-blue-50/30'
        : 'border-zinc-200 bg-zinc-50/50'
  );
}

export function getPreviewSlotClass(
  parentNode: BuilderNode,
  parentDef: ComponentDefinition | undefined,
  slotDef: SlotDefinition
): string {
  const isHorizontal = slotDef.layout === 'horizontal';
  const vAlign = readProperty(parentNode, parentDef, 'vertical-align');
  const showCrossAxis =
    isHorizontal &&
    (vAlign === 'start' || vAlign === 'center' || vAlign === 'end');

  return cn(getSlotFlexClass(parentNode, parentDef, slotDef), showCrossAxis && 'min-h-16');
}
