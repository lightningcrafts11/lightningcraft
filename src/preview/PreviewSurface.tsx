'use client';

import { Eye } from 'lucide-react';
import { useBuilderStore } from '@/store/builderStore';
import PreviewNode from '@/renderer/PreviewNode';
import { PreviewViewportContext } from '@/preview/PreviewViewportContext';
import { LAYOUT_VIEWPORT_WIDTHS, type LayoutViewport } from '@/types/style';
import { cn } from '@/utils/cn';

const VIEWPORTS: Array<{ id: LayoutViewport; label: string }> = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

/**
 * Full-workspace preview of the current builder tree.
 * Reads the same Zustand nodes used by the canvas and HTML generator.
 */
export default function PreviewSurface() {
  const nodes = useBuilderStore((s) => s.nodes);
  const previewViewport = useBuilderStore((s) => s.previewViewport);
  const setPreviewViewport = useBuilderStore((s) => s.setPreviewViewport);
  const width = LAYOUT_VIEWPORT_WIDTHS[previewViewport];

  return (
    <PreviewViewportContext.Provider value={previewViewport}>
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-zinc-100">
        <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-2 flex items-center gap-3">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Viewport
          </span>
          <div className="inline-flex rounded-md border border-zinc-200 p-0.5" role="group" aria-label="Preview viewport">
            {VIEWPORTS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPreviewViewport(option.id)}
                aria-pressed={previewViewport === option.id}
                className={cn(
                  'h-7 px-2.5 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  previewViewport === option.id
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-zinc-400">{width}px</span>
        </div>

        <div role="main" aria-label="Preview" className="flex-1 overflow-auto">
          {nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center px-6">
              <div className="text-center select-none">
                <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-5 h-5 text-zinc-300" aria-hidden />
                </div>
                <p className="text-sm font-medium text-zinc-500">Nothing to preview yet.</p>
              </div>
            </div>
          ) : (
            <div className="px-6 py-8">
              <div
                className="mx-auto w-full flex flex-col gap-4"
                style={{ maxWidth: width }}
              >
                {nodes.map((node) => (
                  <PreviewNode key={node.id} node={node} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PreviewViewportContext.Provider>
  );
}
