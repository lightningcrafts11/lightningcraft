import type { BuilderNode } from '@/types/builder';

/** Maximum document snapshots retained in the undo stack. Easy to raise later. */
export const HISTORY_LIMIT = 50;

/**
 * Consecutive attribute edits with the same coalesce key within this window
 * (reset on each keystroke) become one undoable change.
 */
export const HISTORY_COALESCE_MS = 500;

export interface DocumentHistory {
  past: BuilderNode[][];
  future: BuilderNode[][];
}

export interface HistoryApplyResult {
  past: BuilderNode[][];
  future: BuilderNode[][];
  canUndo: boolean;
  canRedo: boolean;
  historyCoalesceKey: string | null;
  historyCoalesceAt: number;
}

/** Immutable snapshot of the builder document tree. IDs are preserved. */
export function cloneDocument(nodes: BuilderNode[]): BuilderNode[] {
  return structuredClone(nodes);
}

export function isUndoShortcut(event: KeyboardEvent): boolean {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return false;
  return event.key.toLowerCase() === 'z' && !event.shiftKey;
}

export function isRedoShortcut(event: KeyboardEvent): boolean {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return false;
  if (event.key.toLowerCase() === 'y' && !event.shiftKey) return true;
  return event.key.toLowerCase() === 'z' && event.shiftKey;
}

export function historyFlags(past: BuilderNode[][], future: BuilderNode[][]): {
  canUndo: boolean;
  canRedo: boolean;
} {
  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

function trimPast(past: BuilderNode[][], limit: number): BuilderNode[][] {
  if (past.length <= limit) return past;
  return past.slice(past.length - limit);
}

/**
 * Record a document mutation.
 * When `coalesceKey` matches the previous mutation inside the coalesce window,
 * the current present is replaced and no new past entry is pushed.
 */
export function recordDocumentChange(
  history: DocumentHistory,
  currentNodes: BuilderNode[],
  coalesceKey: string | null,
  previousCoalesceKey: string | null,
  previousCoalesceAt: number,
  now: number,
  limit: number = HISTORY_LIMIT,
  coalesceMs: number = HISTORY_COALESCE_MS
): HistoryApplyResult {
  const canCoalesce =
    coalesceKey !== null &&
    previousCoalesceKey === coalesceKey &&
    now - previousCoalesceAt < coalesceMs;

  if (canCoalesce) {
    return {
      past: history.past,
      future: history.future,
      historyCoalesceKey: coalesceKey,
      historyCoalesceAt: now,
      ...historyFlags(history.past, history.future),
    };
  }

  const past = trimPast([...history.past, cloneDocument(currentNodes)], limit);
  const future: BuilderNode[][] = [];

  return {
    past,
    future,
    historyCoalesceKey: coalesceKey,
    historyCoalesceAt: now,
    ...historyFlags(past, future),
  };
}

export function undoDocument(
  history: DocumentHistory,
  currentNodes: BuilderNode[]
): { nodes: BuilderNode[]; history: DocumentHistory } | null {
  if (history.past.length === 0) return null;

  const nodes = history.past[history.past.length - 1];
  if (!nodes) return null;

  const past = history.past.slice(0, -1);
  const future = [cloneDocument(currentNodes), ...history.future];

  return {
    nodes,
    history: { past, future },
  };
}

export function redoDocument(
  history: DocumentHistory,
  currentNodes: BuilderNode[],
  limit: number = HISTORY_LIMIT
): { nodes: BuilderNode[]; history: DocumentHistory } | null {
  const nodes = history.future[0];
  if (!nodes) return null;

  const future = history.future.slice(1);
  const past = trimPast([...history.past, cloneDocument(currentNodes)], limit);

  return {
    nodes,
    history: { past, future },
  };
}
