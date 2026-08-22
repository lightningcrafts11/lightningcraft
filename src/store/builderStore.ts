'use client';

import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import type { BuilderNode } from '@/types/builder';
import type { LayoutViewport, SpacingConfig } from '@/types/style';
import {
  removeNodeFromTree,
  updateNodeAttributes,
  setNodeAttribute,
  setNodeSpacing,
  insertNodeInSlot,
  reorderSlotChildren,
  moveNodeInTree,
  findNodeInTree,
  getSelectionAfterDelete,
} from '@/utils/treeOps';
import {
  recordDocumentChange,
  undoDocument,
  redoDocument,
  historyFlags,
} from '@/history';

interface BuilderState {
  nodes: BuilderNode[];
  selectedNodeId: string | null;
  /** Editor chrome vs clean Salesforce preview. Does not change the tree. */
  viewMode: 'builder' | 'preview';
  /**
   * Preview 12-column breakpoint. Independent of the browser window width.
   * Canvas always uses the large (desktop) cascade.
   */
  previewViewport: LayoutViewport;

  /** Document snapshots before the current tree. Not UI/selection/preview. */
  past: BuilderNode[][];
  /** Document snapshots after Undo. Cleared on a new mutation. */
  future: BuilderNode[][];
  canUndo: boolean;
  canRedo: boolean;
  historyCoalesceKey: string | null;
  historyCoalesceAt: number;

  /** Append to the root list, or insert at a specific index. */
  addNodeToRoot: (node: BuilderNode, index?: number) => void;
  /** Insert into a named slot of the given parent node. */
  addNodeToSlot: (parentId: string, slotName: string, node: BuilderNode, index?: number) => void;
  /** Alias for deleteNode. */
  removeNode: (id: string) => void;
  /**
   * Delete a node and its descendants. Updates selection to a sibling or parent.
   * Remaining node IDs are preserved.
   */
  deleteNode: (id: string) => void;
  /** Merge attribute values into any node in the tree. */
  updateNode: (id: string, attributes: Record<string, unknown>) => void;
  /** Set or clear one attribute. `undefined` removes the key. */
  updateNodeAttribute: (id: string, name: string, value: unknown) => void;
  /** Set or clear SLDS spacing on a node. */
  updateNodeSpacing: (id: string, spacing: SpacingConfig | undefined) => void;
  /** Set or clear the selected node. */
  selectNode: (id: string | null) => void;
  clearSelection: () => void;
  setViewMode: (mode: 'builder' | 'preview') => void;
  setPreviewViewport: (viewport: LayoutViewport) => void;
  /** Reorder root-level nodes by specifying from/to indices. */
  reorderRootByIndex: (fromIndex: number, toIndex: number) => void;
  /** Replace root-level ordering with an ordered list of IDs. */
  reorderRootNodes: (orderedIds: string[]) => void;
  /** Replace a slot's ordering with an ordered list of IDs. */
  reorderSlotNodes: (parentId: string, slotName: string, orderedIds: string[]) => void;
  /** Move a node to a new location (preserves ID and children). */
  moveNode: (
    nodeId: string,
    targetParentId: string | null,
    targetSlotName: string,
    targetIndex: number
  ) => void;
  undo: () => void;
  redo: () => void;
  /** End a coalesced property-edit group (e.g. text field blur). */
  commitHistory: () => void;
}

function applyDocumentChange(
  state: BuilderState,
  nextNodes: BuilderNode[],
  coalesceKey: string | null = null
): Pick<
  BuilderState,
  | 'nodes'
  | 'past'
  | 'future'
  | 'canUndo'
  | 'canRedo'
  | 'historyCoalesceKey'
  | 'historyCoalesceAt'
> {
  const recorded = recordDocumentChange(
    { past: state.past, future: state.future },
    state.nodes,
    coalesceKey,
    state.historyCoalesceKey,
    state.historyCoalesceAt,
    Date.now()
  );

  return {
    nodes: nextNodes,
    ...recorded,
  };
}

function selectionAfterTreeChange(
  nodes: BuilderNode[],
  selectedNodeId: string | null
): string | null {
  if (selectedNodeId === null) return null;
  return findNodeInTree(nodes, selectedNodeId) ? selectedNodeId : null;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  nodes: [],
  selectedNodeId: null,
  viewMode: 'builder',
  previewViewport: 'large',
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
  historyCoalesceKey: null,
  historyCoalesceAt: 0,

  addNodeToRoot: (node, index) =>
    set((state) => {
      let nodes: BuilderNode[];
      if (index === undefined) {
        nodes = [...state.nodes, node];
      } else {
        const clamped = Math.max(0, Math.min(index, state.nodes.length));
        nodes = [...state.nodes];
        nodes.splice(clamped, 0, node);
      }
      return applyDocumentChange(state, nodes);
    }),

  addNodeToSlot: (parentId, slotName, node, index) =>
    set((state) => {
      const nodes = insertNodeInSlot(
        state.nodes,
        parentId,
        slotName,
        index ?? (findNodeInTree(state.nodes, parentId)?.slots?.[slotName]?.length ?? 0),
        node
      );
      if (nodes === state.nodes) return state;
      return applyDocumentChange(state, nodes);
    }),

  removeNode: (id) => get().deleteNode(id),

  deleteNode: (id) =>
    set((state) => {
      const nextSelection = getSelectionAfterDelete(state.nodes, id);
      const nodes = removeNodeFromTree(state.nodes, id);
      if (nodes === state.nodes) return state;

      const selectedStillExists =
        state.selectedNodeId !== null &&
        findNodeInTree(nodes, state.selectedNodeId) !== undefined;

      return {
        ...applyDocumentChange(state, nodes),
        selectedNodeId: selectedStillExists ? state.selectedNodeId : nextSelection,
      };
    }),

  updateNode: (id, attributes) =>
    set((state) => {
      const nodes = updateNodeAttributes(state.nodes, id, attributes);
      if (nodes === state.nodes) return state;
      return applyDocumentChange(state, nodes);
    }),

  updateNodeAttribute: (id, name, value) =>
    set((state) => {
      const nodes = setNodeAttribute(state.nodes, id, name, value);
      if (nodes === state.nodes) return state;
      return applyDocumentChange(state, nodes, `attribute:${id}:${name}`);
    }),

  updateNodeSpacing: (id, spacing) =>
    set((state) => {
      const nodes = setNodeSpacing(state.nodes, id, spacing);
      if (nodes === state.nodes) return state;
      return applyDocumentChange(state, nodes);
    }),

  selectNode: (id) => set({ selectedNodeId: id }),
  clearSelection: () => set({ selectedNodeId: null }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPreviewViewport: (viewport) => set({ previewViewport: viewport }),

  reorderRootByIndex: (fromIndex, toIndex) =>
    set((state) => {
      if (fromIndex === toIndex) return state;
      return applyDocumentChange(state, arrayMove(state.nodes, fromIndex, toIndex));
    }),

  reorderRootNodes: (orderedIds) =>
    set((state) => {
      if (
        orderedIds.length === state.nodes.length &&
        orderedIds.every((id, index) => state.nodes[index]?.id === id)
      ) {
        return state;
      }
      const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));
      const reordered = orderedIds
        .map((id) => nodeMap.get(id))
        .filter((n): n is BuilderNode => n !== undefined);
      return applyDocumentChange(state, reordered);
    }),

  reorderSlotNodes: (parentId, slotName, orderedIds) =>
    set((state) => {
      const nodes = reorderSlotChildren(state.nodes, parentId, slotName, orderedIds);
      if (nodes === state.nodes) return state;
      return applyDocumentChange(state, nodes);
    }),

  moveNode: (nodeId, targetParentId, targetSlotName, targetIndex) =>
    set((state) => {
      const nodes = moveNodeInTree(
        state.nodes,
        nodeId,
        targetParentId,
        targetSlotName,
        targetIndex
      );
      if (nodes === state.nodes) return state;
      return applyDocumentChange(state, nodes);
    }),

  undo: () =>
    set((state) => {
      const result = undoDocument({ past: state.past, future: state.future }, state.nodes);
      if (!result) return state;
      return {
        nodes: result.nodes,
        past: result.history.past,
        future: result.history.future,
        ...historyFlags(result.history.past, result.history.future),
        selectedNodeId: selectionAfterTreeChange(result.nodes, state.selectedNodeId),
        historyCoalesceKey: null,
        historyCoalesceAt: 0,
      };
    }),

  redo: () =>
    set((state) => {
      const result = redoDocument({ past: state.past, future: state.future }, state.nodes);
      if (!result) return state;
      return {
        nodes: result.nodes,
        past: result.history.past,
        future: result.history.future,
        ...historyFlags(result.history.past, result.history.future),
        selectedNodeId: selectionAfterTreeChange(result.nodes, state.selectedNodeId),
        historyCoalesceKey: null,
        historyCoalesceAt: 0,
      };
    }),

  commitHistory: () =>
    set((state) => {
      if (state.historyCoalesceKey === null) return state;
      return { historyCoalesceKey: null };
    }),
}));
