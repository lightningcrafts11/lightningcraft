'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useDndContext } from '@dnd-kit/core';
import { useBuilderStore } from '@/store/builderStore';
import { findNodeInTree, nodeHasDescendants } from '@/utils/treeOps';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const DeleteRequestContext = createContext<(nodeId: string) => void>(() => {});

export function useRequestDelete(): (nodeId: string) => void {
  return useContext(DeleteRequestContext);
}

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest('[contenteditable="true"]')) return true;
  if (target.closest('[role="textbox"]')) return true;
  if (target.closest('[role="combobox"]')) return true;
  if (target.closest('[role="spinbutton"]')) return true;
  if (target.closest('[role="slider"]')) return true;
  if (target.closest('[role="switch"]')) return true;
  if (target.closest('[data-property-inspector]')) return true;

  return false;
}

interface BuilderDeleteControllerProps {
  children: ReactNode;
}

/**
 * Owns keyboard deletion, confirmation for non-leaf nodes, and the
 * requestDelete callback used by the selected-node trash action.
 */
export default function BuilderDeleteController({ children }: BuilderDeleteControllerProps) {
  const { active } = useDndContext();
  const isDragging = Boolean(active);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const requestDelete = useCallback((nodeId: string) => {
    const { nodes, deleteNode } = useBuilderStore.getState();
    const node = findNodeInTree(nodes, nodeId);
    if (!node) return;

    if (nodeHasDescendants(node)) {
      setPendingDeleteId(nodeId);
      return;
    }

    deleteNode(nodeId);
  }, []);

  const cancelPending = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const confirmPending = useCallback(() => {
    if (!pendingDeleteId) return;
    useBuilderStore.getState().deleteNode(pendingDeleteId);
    setPendingDeleteId(null);
  }, [pendingDeleteId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isDragging) return;
      if (pendingDeleteId) return;
      if (isTextEditingTarget(event.target)) return;

      const selectedNodeId = useBuilderStore.getState().selectedNodeId;
      if (!selectedNodeId) return;

      event.preventDefault();
      requestDelete(selectedNodeId);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDragging, pendingDeleteId, requestDelete]);

  return (
    <DeleteRequestContext.Provider value={requestDelete}>
      {children}
      <DeleteConfirmDialog
        open={pendingDeleteId !== null}
        onCancel={cancelPending}
        onConfirm={confirmPending}
      />
    </DeleteRequestContext.Provider>
  );
}
