'use client';

import type { ReactNode } from 'react';
import type { BuilderNode } from '@/types/builder';
import type { ComponentDefinition, SlotDefinition } from '@/types/component';
import { cn } from '@/utils/cn';
import { slotHasPreviewFallback } from '@/renderer/slotPreview';

interface ContainerSlotsProps {
  node: BuilderNode;
  def: ComponentDefinition;
  mode: 'builder' | 'preview';
  renderSlot: (slotDef: SlotDefinition) => ReactNode;
}

function isSlotEmptyForPreview(node: BuilderNode, slotDef: SlotDefinition): boolean {
  const children = node.slots?.[slotDef.name] ?? [];
  if (children.length > 0) return false;
  return !slotHasPreviewFallback(node, slotDef);
}

/**
 * Generic container slot layout from ComponentDefinition.canvas.slotArrangement.
 * Builder and Preview share this structure; only slot contents differ.
 */
export default function ContainerSlots({
  node,
  def,
  mode,
  renderSlot,
}: ContainerSlotsProps) {
  const slots = def.composition.slots ?? [];
  const arrangement =
    def.canvas.kind === 'container' ? def.canvas.slotArrangement : undefined;

  if (arrangement?.type === 'regions') {
    return (
      <div
        className={cn(
          mode === 'preview'
            ? 'bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden'
            : 'border-t border-zinc-100 overflow-hidden rounded-b-[6px]',
          def.canvas.kind === 'container' ? def.canvas.previewClass : undefined
        )}
      >
        {arrangement.rows.map((row, rowIndex) => {
          const visibleSlots = row.slots
            .map((slotName) => slots.find((s) => s.name === slotName))
            .filter((slotDef): slotDef is SlotDefinition => Boolean(slotDef))
            .filter((slotDef) => mode === 'builder' || !isSlotEmptyForPreview(node, slotDef));

          if (visibleSlots.length === 0) return null;

          const isHeaderRow = mode === 'preview' && rowIndex === 0;
          const isFooterRow =
            mode === 'preview' &&
            rowIndex === arrangement.rows.length - 1 &&
            arrangement.rows.length > 1;

          return (
            <div
              key={row.slots.join(':')}
              className={cn(
                visibleSlots.length > 1 && 'flex',
                mode === 'builder' && visibleSlots.length > 1 && 'divide-x divide-zinc-100',
                mode === 'builder' && rowIndex > 0 && 'border-t border-zinc-100',
                isHeaderRow && 'items-center gap-3 px-4 py-3 border-b border-zinc-200',
                isFooterRow && 'items-center justify-end gap-2 px-4 py-3 border-t border-zinc-200 bg-zinc-50/80',
                mode === 'preview' && !isHeaderRow && !isFooterRow && 'px-4 py-4'
              )}
            >
              {visibleSlots.map((slotDef) => {
                const originalIndex = row.slots.indexOf(slotDef.name);
                const width = row.widths?.[originalIndex] ?? 'flex';
                return (
                  <div
                    key={slotDef.name}
                    className={cn(
                      'min-w-0',
                      mode === 'builder' && 'p-2',
                      width === 'flex' ? 'flex-1' : 'shrink-0'
                    )}
                  >
                    {renderSlot(slotDef)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        mode === 'builder' ? 'border-t border-zinc-100 p-2 flex flex-col gap-2' : 'flex flex-col min-w-0',
        def.canvas.kind === 'container' ? def.canvas.previewClass : undefined
      )}
    >
      {slots.map((slotDef) => {
        if (mode === 'preview' && isSlotEmptyForPreview(node, slotDef)) return null;
        return (
          <div key={slotDef.name} className="min-w-0">
            {renderSlot(slotDef)}
          </div>
        );
      })}
    </div>
  );
}
