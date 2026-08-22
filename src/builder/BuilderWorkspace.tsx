'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { useCallback, useState } from 'react';
import ComponentLibrary from '@/component-library/ComponentLibrary';
import Canvas from '@/canvas/Canvas';
import PropertyPanel from '@/property-panel/PropertyPanel';
import BuilderDeleteController from '@/builder/BuilderDeleteController';
import PreviewSurface from '@/preview/PreviewSurface';
import BuilderErrorBoundary from '@/builder/BuilderErrorBoundary';
import { createBuilderNode, getComponentDefinition, canDrop, canDropAtRoot } from '@/metadata';
import { useBuilderStore } from '@/store/builderStore';
import { findNodeInTree, findParentContext } from '@/utils/treeOps';
import type { BuilderDragData } from '@/store/dragTypes';

// ---------------------------------------------------------------------------
// Drag overlay sub-components
// ---------------------------------------------------------------------------

function LibraryItemOverlay({ componentType }: { componentType: string }) {
  const def = getComponentDefinition(componentType);
  return (
    <div className="inline-flex items-center gap-2 bg-white border-2 border-blue-500 rounded-md px-3 py-1.5 shadow-xl select-none cursor-grabbing">
      {def && <def.icon className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden />}
      <span className="text-sm font-medium text-zinc-700">{def?.displayName ?? componentType}</span>
    </div>
  );
}

function CanvasNodeOverlay({ componentType }: { componentType: string }) {
  const def = getComponentDefinition(componentType);
  return (
    <div className="inline-flex items-center gap-2 bg-white border-2 border-blue-500 rounded-lg px-3 py-2 shadow-xl select-none cursor-grabbing max-w-xs">
      {def && <def.icon className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden />}
      <span className="text-sm font-medium text-zinc-700 truncate">
        {def?.displayName ?? componentType}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BuilderWorkspace
// ---------------------------------------------------------------------------

export default function BuilderWorkspace() {
  const [activeDragData, setActiveDragData] = useState<BuilderDragData | null>(null);
  const viewMode = useBuilderStore((s) => s.viewMode);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /**
   * Custom collision detection:
   * - Library drags: prefer specific slot droppables over generic sortable items.
   * - Canvas drags: use closestCenter for smooth sortable reordering.
   */
  const collisionDetection = useCallback<CollisionDetection>(
    (args) => {
      const dragData = args.active.data.current as BuilderDragData | undefined;

      if (dragData?.source === 'component-library') {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
          // Prefer named slot droppables (most specific target)
          const slotCollisions = pointerCollisions.filter(({ id }) =>
            String(id).startsWith('slot:')
          );
          if (slotCollisions.length > 0) return slotCollisions;

          // Prefer sortable node IDs over the canvas-root background
          const nodeCollisions = pointerCollisions.filter(
            ({ id }) => id !== 'canvas-root'
          );
          if (nodeCollisions.length > 0) return nodeCollisions;

          return pointerCollisions;
        }
        return closestCenter(args);
      }

      // Canvas reordering: closestCenter provides stable sortable behaviour
      return closestCenter(args);
    },
    []
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragData(event.active.data.current as BuilderDragData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragData(null);
    if (!over) return;

    const overId = String(over.id);
    const activeData = active.data.current as BuilderDragData | undefined;
    if (!activeData) return;

    // Always read fresh state to avoid stale-closure issues
    const store = useBuilderStore.getState();
    const { nodes, addNodeToRoot, addNodeToSlot, selectNode, reorderRootNodes, reorderSlotNodes, moveNode } = store;

    // ------------------------------------------------------------------
    // Library → canvas
    // ------------------------------------------------------------------
    if (activeData.source === 'component-library') {
      const { componentType } = activeData;

      if (overId === 'canvas-root') {
        if (canDropAtRoot(componentType)) {
          const node = createBuilderNode(componentType);
          addNodeToRoot(node);
          selectNode(node.id);
        }
        return;
      }

      if (overId.startsWith('slot:')) {
        const [, parentId, slotName] = overId.split(':');
        const parent = findNodeInTree(nodes, parentId);
        if (parent && canDrop(componentType, parent.type, slotName)) {
          const node = createBuilderNode(componentType);
          addNodeToSlot(parentId, slotName, node);
          selectNode(node.id);
        }
        return;
      }

      // Over an existing node — insert at its position in the same container
      const ctx = findParentContext(nodes, overId);
      if (!ctx) {
        if (canDropAtRoot(componentType)) {
          const node = createBuilderNode(componentType);
          addNodeToRoot(node);
          selectNode(node.id);
        }
        return;
      }

      if (ctx.kind === 'root') {
        if (canDropAtRoot(componentType)) {
          const node = createBuilderNode(componentType);
          addNodeToRoot(node, ctx.index);
          selectNode(node.id);
        }
        return;
      }

      // ctx.kind === 'slot'
      const { parentNode, slotName, index } = ctx;
      if (canDrop(componentType, parentNode.type, slotName)) {
        const node = createBuilderNode(componentType);
        addNodeToSlot(parentNode.id, slotName, node, index);
        selectNode(node.id);
      }
      return;
    }

    // ------------------------------------------------------------------
    // Canvas → canvas (reorder or move)
    // ------------------------------------------------------------------
    if (activeData.source === 'canvas') {
      const { nodeId, componentType } = activeData;
      if (overId === nodeId) return;

      if (overId.startsWith('slot:')) {
        const [, targetParentId, targetSlotName] = overId.split(':');
        const targetParent = findNodeInTree(nodes, targetParentId);
        if (targetParent && canDrop(componentType, targetParent.type, targetSlotName)) {
          const slotLen = targetParent.slots?.[targetSlotName]?.length ?? 0;
          moveNode(nodeId, targetParentId, targetSlotName, slotLen);
        }
        return;
      }

      if (overId === 'canvas-root') {
        if (canDropAtRoot(componentType)) {
          moveNode(nodeId, null, 'default', nodes.length);
        }
        return;
      }

      // Over another node — determine if same container (reorder) or different (move)
      const activeCtx = findParentContext(nodes, nodeId);
      const overCtx = findParentContext(nodes, overId);
      if (!activeCtx || !overCtx) return;

      const sameRoot = activeCtx.kind === 'root' && overCtx.kind === 'root';
      const sameSlot =
        activeCtx.kind === 'slot' &&
        overCtx.kind === 'slot' &&
        activeCtx.parentNode.id === overCtx.parentNode.id &&
        activeCtx.slotName === overCtx.slotName;

      if (sameRoot) {
        const newOrder = arrayMove(nodes, activeCtx.index, overCtx.index).map((n) => n.id);
        reorderRootNodes(newOrder);
        return;
      }

      if (sameSlot) {
        const slotChildren = activeCtx.parentNode.slots?.[activeCtx.slotName] ?? [];
        const newOrder = arrayMove(slotChildren, activeCtx.index, overCtx.index).map((n) => n.id);
        reorderSlotNodes(activeCtx.parentNode.id, activeCtx.slotName, newOrder);
        return;
      }

      // Different containers — move if valid
      if (overCtx.kind === 'root' && canDropAtRoot(componentType)) {
        moveNode(nodeId, null, 'default', overCtx.index);
      } else if (
        overCtx.kind === 'slot' &&
        canDrop(componentType, overCtx.parentNode.type, overCtx.slotName)
      ) {
        moveNode(nodeId, overCtx.parentNode.id, overCtx.slotName, overCtx.index);
      }
    }
  };

  if (viewMode === 'preview') {
    return (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <BuilderErrorBoundary>
          <PreviewSurface />
        </BuilderErrorBoundary>
      </div>
    );
  }

  return (
    // id="lightningcraft-builder" fixes SSR/client aria-describedby hydration mismatch.
    // dnd-kit uses this as the base for DndDescribedBy-* IDs, making them deterministic.
    <DndContext
      id="lightningcraft-builder"
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <BuilderDeleteController>
        <div className="flex flex-1 overflow-hidden min-h-0">
          <aside
            className="hidden lg:flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-white"
            aria-label="Component library"
          >
            <ComponentLibrary />
          </aside>

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <BuilderErrorBoundary>
              <Canvas isDraggingFromLibrary={activeDragData?.source === 'component-library'} />
            </BuilderErrorBoundary>
          </div>

          <aside
            className="hidden lg:flex w-[300px] shrink-0 flex-col overflow-hidden border-l border-zinc-200 bg-white"
            aria-label="Property inspector"
          >
            <PropertyPanel />
          </aside>
        </div>
      </BuilderDeleteController>
      <DragOverlay dropAnimation={null}>
        {activeDragData?.source === 'component-library' && (
          <LibraryItemOverlay componentType={activeDragData.componentType} />
        )}
        {activeDragData?.source === 'canvas' && (
          <CanvasNodeOverlay componentType={activeDragData.componentType} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
