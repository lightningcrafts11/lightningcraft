'use client';

import type { CSSProperties } from 'react';
import type { BuilderNode } from '@/types/builder';
import type { SlotDefinition } from '@/types/component';
import { getComponentDefinition } from '@/metadata';
import { LeafPreview } from '@/renderer/leafPreviews';
import ContainerSlots from '@/renderer/ContainerSlots';
import {
  getPreviewSlotClass,
  getSlotContainerStyle,
} from '@/canvas/slotLayout';
import { getLayoutItemStyle } from '@/utils/layoutGrid';
import { spacingToCssProperties } from '@/utils/spacing';
import { usePreviewViewport } from '@/preview/PreviewViewportContext';

interface PreviewNodeProps {
  node: BuilderNode;
  inHorizontalLayout?: boolean;
}

/**
 * Recursively renders a builder node without editor chrome.
 * Uses the same builder tree, slot metadata, 12-column layout helpers,
 * and spacing mapping as the canvas and HTML generator.
 */
export default function PreviewNode({ node, inHorizontalLayout = false }: PreviewNodeProps) {
  const def = getComponentDefinition(node.type);
  const viewport = usePreviewViewport();
  const isContainer = def?.canvas.kind === 'container';
  const style: CSSProperties = {
    boxSizing: 'border-box',
    ...(inHorizontalLayout ? getLayoutItemStyle(node, def, viewport) : {}),
    ...spacingToCssProperties(node.spacing),
  };

  if (isContainer && def) {
    return (
      <div style={style} className="min-w-0">
        <ContainerSlots
          node={node}
          def={def}
          mode="preview"
          renderSlot={(slotDef) => <PreviewSlot parentNode={node} slotDef={slotDef} />}
        />
      </div>
    );
  }

  return (
    <div style={style} className="min-w-0">
      <LeafPreview node={node} def={def} />
    </div>
  );
}

function PreviewSlot({
  parentNode,
  slotDef,
}: {
  parentNode: BuilderNode;
  slotDef: SlotDefinition;
}) {
  const children = parentNode.slots?.[slotDef.name] ?? [];
  const parentDef = getComponentDefinition(parentNode.type);
  const isHorizontal = slotDef.layout === 'horizontal';

  if (children.length === 0) {
    const fallback = parentNode.attributes[slotDef.name];
    if (typeof fallback === 'string' && fallback !== '') {
      return <span className="text-[15px] font-semibold text-zinc-900">{fallback}</span>;
    }
    return null;
  }

  return (
    <div
      className={getPreviewSlotClass(parentNode, parentDef, slotDef)}
      style={getSlotContainerStyle(parentNode, parentDef, slotDef)}
    >
      {children.map((child) => (
        <PreviewNode
          key={child.id}
          node={child}
          inHorizontalLayout={isHorizontal}
        />
      ))}
    </div>
  );
}
