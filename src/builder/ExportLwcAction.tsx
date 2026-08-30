'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Package } from 'lucide-react';
import ExportLwcDialog from './ExportLwcDialog';
import { generateLwcBundle } from '@/generator';
import { generateLwcZip } from '@/generator/generateLwcZip';
import { useBuilderStore } from '@/store/builderStore';
import { DEFAULT_LWC_EXPORT_SETTINGS, type GenerationError, type LwcExportSettings } from '@/types/lwcExport';
import { downloadBlob } from '@/utils/downloadFile';

function initialSettings(): LwcExportSettings {
  return {
    ...DEFAULT_LWC_EXPORT_SETTINGS,
    targets: [...DEFAULT_LWC_EXPORT_SETTINGS.targets],
  };
}

export default function ExportLwcAction() {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [settings, setSettings] = useState<LwcExportSettings>(initialSettings);
  const [errors, setErrors] = useState<GenerationError[]>([]);
  const [warnings, setWarnings] = useState<GenerationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const closeDialog = useCallback(() => {
    if (generatingRef.current) return;
    setOpen(false);
    setErrors([]);
    setWarnings([]);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  const showSuccess = () => {
    if (successTimer.current) clearTimeout(successTimer.current);
    setSuccessMessage('LWC bundle downloaded successfully.');
    successTimer.current = setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleGenerate = async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGenerating(true);
    setErrors([]);
    setWarnings([]);

    try {
      const bundle = generateLwcBundle(useBuilderStore.getState().nodes, settings);
      setWarnings(bundle.warnings);

      if (bundle.errors.length > 0) {
        console.error('LWC export failed:', bundle.errors);
        setErrors(bundle.errors);
        return;
      }

      const zip = await generateLwcZip(bundle, settings.componentName);
      if (!zip.ok) {
        console.error('LWC ZIP packaging failed:', zip.errors);
        setErrors(zip.errors);
        setWarnings(zip.warnings);
        return;
      }

      downloadBlob(zip.blob, zip.zipFileName);
      showSuccess();
      if (bundle.warnings.length === 0) {
        setOpen(false);
        window.setTimeout(() => triggerRef.current?.focus(), 0);
      }
    } catch (error) {
      console.error(error);
      setErrors([
        {
          nodeId: '',
          componentType: '',
          message: 'Could not package the LWC bundle as a ZIP file.',
        },
      ]);
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setErrors([]);
          setWarnings([]);
          setOpen(true);
        }}
        aria-label="Export LWC"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? 'export-lwc-dialog' : undefined}
        title="Export a complete Lightning Web Component ZIP"
        className="h-8 flex items-center gap-1.5 px-2 lg:px-3 rounded text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
      >
        <Package className="w-3.5 h-3.5" aria-hidden />
        <span className="hidden min-[400px]:inline md:hidden">LWC</span>
        <span className="hidden md:inline">Export LWC</span>
      </button>

      <ExportLwcDialog
        open={open}
        settings={settings}
        generating={generating}
        errors={errors}
        warnings={warnings}
        onSettingsChange={setSettings}
        onCancel={closeDialog}
        onGenerate={() => {
          void handleGenerate();
        }}
      />

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[4.25rem] right-3 z-50 max-w-xs rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 shadow-sm"
        >
          {successMessage}
        </div>
      )}
    </>
  );
}
