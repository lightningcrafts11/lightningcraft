'use client';

import { useEffect, useRef, useState } from 'react';
import { Zap, Undo2, Redo2, Eye, Download, Pencil } from 'lucide-react';
import { generateLwcHtml } from '@/generator';
import { useBuilderStore } from '@/store/builderStore';
import { copyTextToClipboard } from '@/utils/clipboard';
import { isRedoShortcut, isUndoShortcut } from '@/history';
import { useMobilePanels } from '@/builder/MobilePanelsContext';
import { cn } from '@/utils/cn';

type ExportStatus = 'idle' | 'copied' | 'error';

const ICON_BUTTON =
  'h-8 w-8 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900';

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
  const { panel, togglePanel, closePanel } = useMobilePanels();

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

  const handlePreviewToggle = () => {
    if (!isPreview) closePanel();
    setViewMode(isPreview ? 'builder' : 'preview');
  };

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-700 flex items-center px-2 lg:px-4 shrink-0 z-40 min-w-0">
      <h1 className="sr-only">LightningCraft</h1>
      {/* Desktop brand — unchanged at lg+ */}
      <div className="hidden lg:flex items-center gap-2 w-[220px]">
        <div className="flex items-center gap-1.5 text-white">
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" aria-hidden />
          <span className="font-semibold text-sm tracking-tight">LightningCraft</span>
        </div>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 uppercase tracking-wider">
          MVP
        </span>
      </div>

      {/* Mobile brand — hidden on the narrowest phones so toolbar actions fit */}
      <div className="hidden min-[360px]:flex lg:hidden items-center shrink-0 mr-1" aria-hidden>
        <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
      </div>

      {/* Mobile panel controls */}
      {!isPreview && (
        <nav className="flex lg:hidden items-center gap-0.5 shrink-0" aria-label="Builder panels">
          <button
            type="button"
            aria-label="Components"
            aria-expanded={panel === 'components'}
            aria-controls="mobile-components-drawer"
            onClick={() => togglePanel('components')}
            className={cn(
              'h-8 px-1.5 sm:px-2 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900',
              panel === 'components'
                ? 'text-white bg-zinc-700'
                : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700'
            )}
          >
            Components
          </button>
          <button
            type="button"
            aria-label="Properties"
            aria-expanded={panel === 'properties'}
            aria-controls="mobile-properties-drawer"
            onClick={() => togglePanel('properties')}
            className={cn(
              'h-8 px-1.5 sm:px-2 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900',
              panel === 'properties'
                ? 'text-white bg-zinc-700'
                : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700'
            )}
          >
            Properties
          </button>
        </nav>
      )}

      {/* Desktop project name */}
      <div className="hidden lg:flex flex-1 justify-center">
        <span className="text-sm text-zinc-400">Untitled Project</span>
      </div>

      <div className="flex-1 lg:hidden min-w-0" />

      {/* Actions — same controls on all widths; labels compact below lg */}
      <div className="flex items-center gap-0.5 lg:gap-1 lg:w-[220px] justify-end shrink-0">
        <div className="flex items-center">
          <button
            type="button"
            aria-label="Undo"
            title="Undo"
            disabled={!canUndo}
            onClick={undo}
            className={ICON_BUTTON}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Redo"
            title="Redo"
            disabled={!canRedo}
            onClick={redo}
            className={ICON_BUTTON}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-0.5 lg:mx-1" aria-hidden />

        <button
          type="button"
          onClick={handlePreviewToggle}
          aria-label={isPreview ? 'Back to builder' : 'Preview'}
          aria-pressed={isPreview}
          title={isPreview ? 'Back to builder' : 'Preview without editor controls'}
          className={
            isPreview
              ? 'h-8 flex items-center gap-1.5 px-2 lg:px-3 rounded text-sm text-white bg-zinc-700 hover:bg-zinc-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
              : 'h-8 flex items-center gap-1.5 px-2 lg:px-3 rounded text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
          }
        >
          {isPreview ? <Pencil className="w-3.5 h-3.5" aria-hidden /> : <Eye className="w-3.5 h-3.5" aria-hidden />}
          <span className="hidden min-[400px]:inline">{isPreview ? 'Edit' : 'Preview'}</span>
        </button>

        <button
          type="button"
          onClick={handleExport}
          aria-label={
            exportStatus === 'copied'
              ? 'HTML copied'
              : exportStatus === 'error'
                ? 'Copy failed'
                : 'Export HTML'
          }
          aria-live="polite"
          title={
            exportStatus === 'error'
              ? (exportError ?? 'Could not copy HTML to the clipboard.')
              : 'Generate Salesforce HTML and copy to clipboard'
          }
          className="h-8 flex items-center gap-1.5 px-2 lg:px-3 rounded text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {exportStatus === 'copied'
              ? 'Copied!'
              : exportStatus === 'error'
                ? 'Copy failed'
                : 'Export'}
          </span>
        </button>
      </div>
    </header>
  );
}
