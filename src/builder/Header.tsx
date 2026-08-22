'use client';

import { useEffect, useRef, useState } from 'react';
import { Zap, Undo2, Redo2, Eye, Download, Pencil } from 'lucide-react';
import { generateLwcHtml } from '@/generator';
import { useBuilderStore } from '@/store/builderStore';
import { copyTextToClipboard } from '@/utils/clipboard';
import { isRedoShortcut, isUndoShortcut } from '@/history';

type ExportStatus = 'idle' | 'copied' | 'error';

export default function Header() {
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportError, setExportError] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewMode = useBuilderStore((s) => s.viewMode);
  const setViewMode = useBuilderStore((s) => s.setViewMode);
  const canUndo = useBuilderStore((s) => s.canUndo);
  const canRedo = useBuilderStore((s) => s.canRedo);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const isPreview = viewMode === 'preview';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      if (isUndoShortcut(event)) {
        event.preventDefault();
        useBuilderStore.getState().undo();
        return;
      }

      if (isRedoShortcut(event)) {
        event.preventDefault();
        useBuilderStore.getState().redo();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const scheduleReset = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setExportStatus('idle');
      setExportError(null);
    }, 2000);
  };

  const handleExport = async () => {
    try {
      const { html } = generateLwcHtml(useBuilderStore.getState().nodes);
      await copyTextToClipboard(html);
      setExportError(null);
      setExportStatus('copied');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not copy HTML to the clipboard.';
      setExportError(message);
      setExportStatus('error');
    }
    scheduleReset();
  };

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-700 flex items-center px-4 shrink-0 z-10">
      {/* Left: Brand */}
      <div className="flex items-center gap-2 w-[220px]">
        <div className="flex items-center gap-1.5 text-white">
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" aria-hidden />
          <span className="font-semibold text-sm tracking-tight">LightningCraft</span>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-wider">
          MVP
        </span>
      </div>

      {/* Center: Project name */}
      <div className="flex-1 flex justify-center">
        <span className="text-sm text-zinc-400">Untitled Project</span>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1 w-[220px] justify-end">
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Undo"
            title="Undo"
            disabled={!canUndo}
            onClick={undo}
            className="h-8 w-8 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Redo"
            title="Redo"
            disabled={!canRedo}
            onClick={redo}
            className="h-8 w-8 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-1" aria-hidden />

        <button
          type="button"
          onClick={() => setViewMode(isPreview ? 'builder' : 'preview')}
          aria-label={isPreview ? 'Back to builder' : 'Preview'}
          aria-pressed={isPreview}
          title={isPreview ? 'Back to builder' : 'Preview without editor controls'}
          className={
            isPreview
              ? 'h-8 flex items-center gap-1.5 px-3 rounded text-sm text-white bg-zinc-700 hover:bg-zinc-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
              : 'h-8 flex items-center gap-1.5 px-3 rounded text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
          }
        >
          {isPreview ? <Pencil className="w-3.5 h-3.5" aria-hidden /> : <Eye className="w-3.5 h-3.5" aria-hidden />}
          {isPreview ? 'Edit' : 'Preview'}
        </button>

        <button
          type="button"
          onClick={handleExport}
          aria-live="polite"
          title={
            exportStatus === 'error'
              ? (exportError ?? 'Could not copy HTML to the clipboard.')
              : 'Generate Salesforce HTML and copy to clipboard'
          }
          className="h-8 flex items-center gap-1.5 px-3 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          {exportStatus === 'copied'
            ? 'Copied!'
            : exportStatus === 'error'
              ? 'Copy failed'
              : 'Export'}
        </button>
      </div>
    </header>
  );
}
