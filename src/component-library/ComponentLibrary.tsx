'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getComponentCategories, getComponentsByCategory } from '@/metadata';
import type { ComponentDefinition } from '@/types/component';
import type { LibraryDragData } from '@/store/dragTypes';

// ---------------------------------------------------------------------------
// Draggable library item
// ---------------------------------------------------------------------------

function matchesQuery(def: ComponentDefinition, query: string): boolean {
  if (!query) return true;
  return (
    def.displayName.toLowerCase().includes(query) ||
    def.type.toLowerCase().includes(query) ||
    def.salesforceName.toLowerCase().includes(query)
  );
}

function DraggableItem({
  def,
  instanceId,
}: {
  def: ComponentDefinition;
  instanceId: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${instanceId}-${def.type}`,
    data: {
      source: 'component-library',
      componentType: def.type,
    } satisfies LibraryDragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={`${def.displayName}. Drag onto the canvas`}
      title={`${def.displayName} — drag to canvas`}
      className={cn(
        'flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-zinc-100 cursor-grab active:cursor-grabbing transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation',
        isDragging && 'opacity-40'
      )}
    >
      <div className="w-6 h-6 flex items-center justify-center rounded bg-zinc-100 group-hover:bg-zinc-200 transition-colors shrink-0">
        <def.icon className="w-3.5 h-3.5 text-zinc-500" aria-hidden />
      </div>
      <span className="text-sm text-zinc-700 truncate select-none">
        {def.displayName}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ComponentLibrary
// ---------------------------------------------------------------------------

interface ComponentLibraryProps {
  /** Distinguishes desktop vs mobile instances so dnd-kit ids stay unique. */
  instanceId?: string;
}

export default function ComponentLibrary({ instanceId = 'default' }: ComponentLibraryProps) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const query = search.trim().toLowerCase();
  const allCategories = getComponentCategories();

  const filtered = allCategories
    .map((cat) => ({
      label: cat,
        items: getComponentsByCategory(cat).filter((def) => matchesQuery(def, query)),
    }))
    .filter((cat) => cat.items.length > 0);

  const toggleCategory = (label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2.5 border-b border-zinc-200 shrink-0">
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
          Components
        </h2>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components…"
            aria-label="Search components"
            className="w-full h-8 pl-8 pr-3 text-sm bg-zinc-50 border border-zinc-200 rounded-md placeholder:text-zinc-400 text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="hidden [@media(pointer:coarse)]:block text-[11px] text-zinc-400 mt-2 leading-relaxed">
          Touch and hold, then drag onto the canvas
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain py-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="w-7 h-7 text-zinc-300 mb-2.5" aria-hidden />
            <p className="text-sm font-medium text-zinc-500">No components found</p>
            <p className="text-xs text-zinc-400 mt-1">Try a different search term</p>
          </div>
        ) : (
          filtered.map((category) => {
            const isCollapsed = collapsed.has(category.label);
            return (
              <div key={category.label}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category.label)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-zinc-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                  aria-expanded={!isCollapsed}
                >
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    {category.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 text-zinc-400 transition-transform duration-150',
                      isCollapsed && '-rotate-90'
                    )}
                    aria-hidden
                  />
                </button>

                {!isCollapsed && (
                  <div className="px-2 pb-1">
                    {category.items.map((def) => (
                      <DraggableItem key={def.type} def={def} instanceId={instanceId} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
