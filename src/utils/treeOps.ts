/**
 * Pure, immutable tree operations for the BuilderNode tree.
 * No React imports. Independently testable.
 */
import type { SpacingConfig } from '@/types/style';
import type { BuilderNode } from '@/types/builder';

function nodeSlots(node: BuilderNode): Record<string, BuilderNode[]> {
  return node.slots ?? {};
}

/**
 * Recursively apply `transform` to the node with `targetId`.
 * Returns a new array; unchanged branches return the same reference.
 */
function updateById(
  nodes: BuilderNode[],
  targetId: string,
  transform: (node: BuilderNode) => BuilderNode
): BuilderNode[] {
  let changed = false;
  const result = nodes.map((node) => {
    if (node.id === targetId) {
      changed = true;
      return transform(node);
    }

    const newSlots: Record<string, BuilderNode[]> = {};
    let slotChanged = false;
    for (const [slotName, children] of Object.entries(nodeSlots(node))) {
      const updated = updateById(children, targetId, transform);
      newSlots[slotName] = updated;
      if (updated !== children) slotChanged = true;
    }

    if (slotChanged) {
      changed = true;
      return { ...node, slots: newSlots };
    }
    return node;
  });

  return changed ? result : nodes;
}

/**
 * Recursively remove the node with `targetId`.
 * Returns the same reference if the ID is not found anywhere.
 */
function removeById(nodes: BuilderNode[], targetId: string): BuilderNode[] {
  const filtered = nodes.filter((n) => n.id !== targetId);
  if (filtered.length < nodes.length) return filtered;

  let changed = false;
  const result = nodes.map((node) => {
    const newSlots: Record<string, BuilderNode[]> = {};
    let slotChanged = false;
    for (const [slotName, children] of Object.entries(nodeSlots(node))) {
      const updated = removeById(children, targetId);
      newSlots[slotName] = updated;
      if (updated !== children) slotChanged = true;
    }
    if (slotChanged) {
      changed = true;
      return { ...node, slots: newSlots };
    }
    return node;
  });

  return changed ? result : nodes;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Parent information for a node found anywhere in the tree. */
export type ParentContext =
  | { kind: 'root'; index: number }
  | { kind: 'slot'; parentNode: BuilderNode; slotName: string; index: number };

/** Find a node by ID anywhere in the tree. Returns undefined if not found. */
export function findNodeInTree(
  roots: BuilderNode[],
  id: string
): BuilderNode | undefined {
  for (const node of roots) {
    if (node.id === id) return node;
    for (const children of Object.values(nodeSlots(node))) {
      const found = findNodeInTree(children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/** Determine where a node lives: at root level or inside which slot. */
export function findParentContext(
  roots: BuilderNode[],
  id: string
): ParentContext | undefined {
  const rootIdx = roots.findIndex((n) => n.id === id);
  if (rootIdx >= 0) return { kind: 'root', index: rootIdx };

  return searchParentInNodes(roots, id);
}

function searchParentInNodes(
  nodes: BuilderNode[],
  id: string
): ParentContext | undefined {
  for (const node of nodes) {
    for (const [slotName, children] of Object.entries(nodeSlots(node))) {
      const idx = children.findIndex((c) => c.id === id);
      if (idx >= 0) {
        return { kind: 'slot', parentNode: node, slotName, index: idx };
      }
      const deeper = searchParentInNodes(children, id);
      if (deeper) return deeper;
    }
  }
  return undefined;
}

/** Remove a node from anywhere in the tree. Immutable. */
export function removeNodeFromTree(
  roots: BuilderNode[],
  id: string
): BuilderNode[] {
  return removeById(roots, id);
}

/** True when any named slot contains at least one child. */
export function nodeHasDescendants(node: BuilderNode): boolean {
  for (const children of Object.values(nodeSlots(node))) {
    if (children.length > 0) return true;
  }
  return false;
}

/**
 * Next selection after deleting `id`.
 * Prefers a remaining sibling in the same container, then the parent,
 * then null (e.g. last root node).
 */
export function getSelectionAfterDelete(
  roots: BuilderNode[],
  id: string
): string | null {
  const ctx = findParentContext(roots, id);
  if (!ctx) return null;

  if (ctx.kind === 'root') {
    const remaining = roots.filter((n) => n.id !== id);
    if (remaining.length === 0) return null;
    const idx = Math.min(ctx.index, remaining.length - 1);
    return remaining[idx]?.id ?? null;
  }

  const siblings = nodeSlots(ctx.parentNode)[ctx.slotName] ?? [];
  const remaining = siblings.filter((n) => n.id !== id);
  if (remaining.length > 0) {
    const idx = Math.min(ctx.index, remaining.length - 1);
    return remaining[idx]?.id ?? ctx.parentNode.id;
  }

  return ctx.parentNode.id;
}

/** Insert a node into a named slot of a parent, at a specific index. */
export function insertNodeInSlot(
  roots: BuilderNode[],
  parentId: string,
  slotName: string,
  index: number,
  node: BuilderNode
): BuilderNode[] {
  return updateById(roots, parentId, (parent) => {
    const current = nodeSlots(parent)[slotName] ?? [];
    const clamped = Math.max(0, Math.min(index, current.length));
    const newSlot = [...current];
    newSlot.splice(clamped, 0, node);
    return { ...parent, slots: { ...nodeSlots(parent), [slotName]: newSlot } };
  });
}

/** Merge new attribute values into an existing node. */
export function updateNodeAttributes(
  roots: BuilderNode[],
  id: string,
  attributes: Record<string, unknown>
): BuilderNode[] {
  return updateById(roots, id, (node) => ({
    ...node,
    attributes: { ...node.attributes, ...attributes },
  }));
}

/**
 * Set or clear a single attribute on a node.
 * `undefined` removes the key. Unchanged values keep the same node reference.
 */
export function setNodeAttribute(
  roots: BuilderNode[],
  id: string,
  name: string,
  value: unknown
): BuilderNode[] {
  return updateById(roots, id, (node) => {
    if (value === undefined) {
      if (!(name in node.attributes)) return node;
      const next = { ...node.attributes };
      delete next[name];
      return { ...node, attributes: next };
    }
    if (Object.is(node.attributes[name], value)) return node;
    return { ...node, attributes: { ...node.attributes, [name]: value } };
  });
}

/**
 * Set or clear SLDS spacing on a node.
 * `undefined` removes the spacing field. Unchanged values keep the same reference.
 */
export function setNodeSpacing(
  roots: BuilderNode[],
  id: string,
  spacing: SpacingConfig | undefined
): BuilderNode[] {
  return updateById(roots, id, (node) => {
    if (spacing === undefined) {
      if (node.spacing === undefined) return node;
      return { ...node, spacing: undefined };
    }
    return { ...node, spacing };
  });
}

/** Reorder children within a slot using an ordered array of IDs. */
export function reorderSlotChildren(
  roots: BuilderNode[],
  parentId: string,
  slotName: string,
  orderedIds: string[]
): BuilderNode[] {
  return updateById(roots, parentId, (parent) => {
    const current = nodeSlots(parent)[slotName] ?? [];
    const nodeMap = new Map(current.map((n) => [n.id, n]));
    const reordered = orderedIds
      .map((id) => nodeMap.get(id))
      .filter((n): n is BuilderNode => n !== undefined);
    return { ...parent, slots: { ...nodeSlots(parent), [slotName]: reordered } };
  });
}

/**
 * Move a node from its current location to a new target.
 * The node retains its original ID and children.
 * Prevents a node from being dropped into one of its own descendants.
 */
export function moveNodeInTree(
  roots: BuilderNode[],
  nodeId: string,
  targetParentId: string | null,
  targetSlotName: string,
  targetIndex: number
): BuilderNode[] {
  const nodeToMove = findNodeInTree(roots, nodeId);
  if (!nodeToMove) return roots;

  // Guard: do not drop a container into its own descendant
  if (targetParentId !== null && findNodeInTree([nodeToMove], targetParentId)) {
    return roots;
  }

  const afterRemove = removeById(roots, nodeId);

  if (targetParentId === null) {
    const clamped = Math.max(0, Math.min(targetIndex, afterRemove.length));
    const result = [...afterRemove];
    result.splice(clamped, 0, nodeToMove);
    return result;
  }

  return insertNodeInSlot(afterRemove, targetParentId, targetSlotName, targetIndex, nodeToMove);
}
