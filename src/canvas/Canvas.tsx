'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LayoutGrid } from 'lucide-react';
import { useBuilderStore } from '@/store/builderStore';
import { cn } from '@/utils/cn';
import CanvasNode from './CanvasNode';

interface CanvasProps {
  isDraggingFromLibrary: boolean;
}

export default function Canvas({ isDraggingFromLibrary }: CanvasProps) {
  const nodes = useBuilderStore((s) => s.nodes);
  const clearSelection = useBuilderStore((s) => s.clearSelection);

  // 'canvas-root' is the stable droppable ID for the root canvas background.
  // Slot drop zones within composable nodes use 'slot:<nodeId>:<slotName>'.
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-root' });

  const rootNodeIds = nodes.map((n) => n.id);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div
        ref={setNodeRef}
        role="region"
        aria-label="Builder canvas"
        className={cn(
          'flex-1 overflow-auto overscroll-contain transition-colors duration-150 min-w-0',
          isDraggingFromLibrary && isOver ? 'bg-blue-50' : ''
        )}
        style={{
          backgroundColor: isDraggingFromLibrary && isOver ? '#eff6ff' : '#f8fafc',
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        onClick={clearSelection}
      >
        {nodes.length === 0 ? (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-150',
              isDraggingFromLibrary && isOver && 'opacity-40'
            )}
            aria-hidden
          >
            <div className="text-center select-none">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl bg-white border-2 border-dashed flex items-center justify-center mx-auto mb-4 shadow-sm transition-colors duration-150',
                  isDraggingFromLibrary ? 'border-blue-400' : 'border-zinc-300'
                )}
              >
                <LayoutGrid
                  className={cn(
                    'w-7 h-7 transition-colors duration-150',
                    isDraggingFromLibrary ? 'text-blue-400' : 'text-zinc-300'
                  )}
                />
              </div>
              <h3 className="text-sm font-medium text-zinc-500 mb-1.5">
                Drop Lightning components here
              </h3>
              <p className="hidden lg:block text-xs text-zinc-400 max-w-[200px] mx-auto leading-relaxed">
                Drag components from the left panel to start building your layout
              </p>
              <p className="lg:hidden text-xs text-zinc-400 max-w-[220px] mx-auto leading-relaxed">
                Open Components, then touch and hold an item to drag it onto the canvas
              </p>
            </div>
          </div>
        ) : (
          <SortableContext items={rootNodeIds} strategy={verticalListSortingStrategy}>
            <div className="p-3 sm:p-6 flex flex-col gap-3 min-h-full min-w-0">
              {nodes.map((node) => (
                <CanvasNode key={node.id} node={node} />
              ))}
              {isDraggingFromLibrary && (
                <div
                  className={cn(
                    'h-10 rounded-lg border-2 border-dashed transition-colors duration-150',
                    isOver ? 'border-blue-400 bg-blue-50' : 'border-zinc-200'
                  )}
                  aria-hidden
                />
              )}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
