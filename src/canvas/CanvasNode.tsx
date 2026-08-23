'use client';

import { useDroppable, useDndContext } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { BuilderNode } from '@/types/builder';
import type { ComponentDefinition, SlotDefinition } from '@/types/component';
import { getComponentDefinition, canDrop } from '@/metadata';
import { useBuilderStore } from '@/store/builderStore';
import { useRequestDelete } from '@/builder/BuilderDeleteController';
import type { BuilderDragData, CanvasDragData } from '@/store/dragTypes';
import { LeafPreview } from '@/renderer/leafPreviews';
import ContainerSlots from '@/renderer/ContainerSlots';
import { cn } from '@/utils/cn';
import { getLayoutItemStyle } from '@/utils/layoutGrid';
import { spacingToCssProperties } from '@/utils/spacing';
import {
  CANVAS_LAYOUT_VIEWPORT,
  getSlotContainerClass,
  getSlotContainerStyle,
} from './slotLayout';

const CATEGORY_BADGE: Record<string, string> = {
  Basic: 'bg-sky-50 border-sky-200 text-sky-700',
  Forms: 'bg-violet-50 border-violet-200 text-violet-700',
  Layout: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  Display: 'bg-amber-50 border-amber-200 text-amber-700',
};

function useActiveDrag() {
  const { active } = useDndContext();
  return active?.data?.current as BuilderDragData | undefined;
}

// ---------------------------------------------------------------------------
// SlotDropZone — generic named-slot drop target + children
// ---------------------------------------------------------------------------

interface SlotDropZoneProps {
  parentNode: BuilderNode;
  slotDef: SlotDefinition;
}

function SlotDropZone({ parentNode, slotDef }: SlotDropZoneProps) {
  const droppableId = `slot:${parentNode.id}:${slotDef.name}`;
  const children = parentNode.slots?.[slotDef.name] ?? [];
  const childIds = children.map((c) => c.id);
  const parentDef = getComponentDefinition(parentNode.type);

  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const activeDrag = useActiveDrag();

  const activeDragType =
    activeDrag?.source === 'component-library' || activeDrag?.source === 'canvas'
      ? activeDrag.componentType
      : null;

  const isValidDrop =
    activeDragType !== null && canDrop(activeDragType, parentNode.type, slotDef.name);

  const strategy =
    slotDef.layout === 'horizontal' ? horizontalListSortingStrategy : verticalListSortingStrategy;

  const isEmpty = children.length === 0;

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider select-none">
        {slotDef.label}
      </span>

      <SortableContext items={childIds} strategy={strategy}>
        <div
          ref={setNodeRef}
          className={getSlotContainerClass(parentNode, parentDef, slotDef, isOver, isValidDrop)}
          style={getSlotContainerStyle(parentNode, parentDef, slotDef)}
        >
          {children.map((child) => (
            <CanvasNode
              key={child.id}
              node={child}
              inHorizontalLayout={slotDef.layout === 'horizontal'}
            />
          ))}
          {isEmpty && (
            <span
              className={cn(
                'text-[11px] pointer-events-none self-center',
                isValidDrop ? 'text-blue-400' : 'text-zinc-400'
              )}
            >
              {isValidDrop ? `Drop ${slotDef.label} here` : 'Empty'}
            </span>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ContainerPreview — slot layout comes from canvas.slotArrangement metadata
// ---------------------------------------------------------------------------

function ContainerPreview({ node, def }: { node: BuilderNode; def: ComponentDefinition }) {
  return (
    <ContainerSlots
      node={node}
      def={def}
      mode="builder"
      renderSlot={(slotDef) => <SlotDropZone parentNode={node} slotDef={slotDef} />}
    />
  );
}

// ---------------------------------------------------------------------------
// CanvasNode
// ---------------------------------------------------------------------------

interface CanvasNodeProps {
  node: BuilderNode;
  /** True when this node is a child of a horizontal slot (e.g. lightning-layout). */
  inHorizontalLayout?: boolean;
}

function CanvasNode({ node, inHorizontalLayout = false }: CanvasNodeProps) {
  const isSelected = useBuilderStore((s) => s.selectedNodeId === node.id);
  const selectNode = useBuilderStore((s) => s.selectNode);
  const requestDelete = useRequestDelete();
  const def = getComponentDefinition(node.type);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: {
      source: 'canvas',
      nodeId: node.id,
      componentType: node.type,
    } satisfies CanvasDragData,
  });

  const layoutStyle = inHorizontalLayout
    ? getLayoutItemStyle(node, def, CANVAS_LAYOUT_VIEWPORT)
    : {};
  const style = {
    boxSizing: 'border-box' as const,
    ...layoutStyle,
    ...spacingToCssProperties(node.spacing),
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isContainer = def?.canvas.kind === 'container';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'bg-white rounded-lg border-2 select-none transition-all box-border',
        isSelected
          ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]'
          : 'border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow',
        isDragging && 'opacity-0'
      )}
      onClick={(e) => {
        e.stopPropagation();
        selectNode(node.id);
      }}
      aria-selected={isSelected}
    >
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-2',
          isContainer
            ? cn(isSelected ? 'bg-blue-50/60 border-blue-200' : 'bg-zinc-50 border-zinc-100')
            : cn(
                'rounded-t-[6px] border-b',
                isSelected ? 'bg-blue-50/60 border-blue-200' : 'bg-zinc-50 border-zinc-100'
              )
        )}
      >
        <div
          {...listeners}
          aria-label="Drag to reorder"
          title="Drag to reorder"
          className="flex items-center gap-2 min-w-0 flex-1 px-1 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-3.5 h-3.5 text-zinc-300 shrink-0" aria-hidden />
          {def && (
            <def.icon
              className={cn('w-4 h-4 shrink-0', isSelected ? 'text-blue-500' : 'text-zinc-400')}
              aria-hidden
            />
          )}
          <span className="text-xs font-medium text-zinc-700 flex-1 truncate">
            {def?.displayName ?? node.type}
          </span>
          {def && (
            <span
              className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0',
                CATEGORY_BADGE[def.category] ?? 'bg-zinc-50 border-zinc-200 text-zinc-500'
              )}
            >
              {def.category}
            </span>
          )}
        </div>
        {isSelected && (
          <button
            type="button"
            aria-label="Delete component"
            title="Delete"
            className="h-6 w-6 flex items-center justify-center rounded text-zinc-300 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              requestDelete(node.id);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
          </button>
        )}
      </div>

      {isContainer && def ? (
        <ContainerPreview node={node} def={def} />
      ) : (
        <div className="px-3 py-3">
          <LeafPreview node={node} def={def} />
        </div>
      )}
    </div>
  );
}

export default CanvasNode;
