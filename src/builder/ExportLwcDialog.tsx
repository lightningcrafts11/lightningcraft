'use client';

import { useEffect, useId, useRef } from 'react';
import type { GenerationError, LwcExportSettings } from '@/types/lwcExport';
import { DEFAULT_LWC_EXPORT_SETTINGS } from '@/types/lwcExport';
import { isValidLwcComponentName, lwcComponentNameError } from '@/generator/validateLwcName';
import { formatLwcExportError } from '@/generator/formatLwcExportError';
import { cn } from '@/utils/cn';

const TARGET_OPTIONS = DEFAULT_LWC_EXPORT_SETTINGS.targets;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const FIELD =
  'w-full h-8 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400';

interface ExportLwcDialogProps {
  open: boolean;
  settings: LwcExportSettings;
  generating: boolean;
  errors: GenerationError[];
  warnings: GenerationError[];
  onSettingsChange: (next: LwcExportSettings) => void;
  onCancel: () => void;
  onGenerate: () => void;
}

export default function ExportLwcDialog({
  open,
  settings,
  generating,
  errors,
  warnings,
  onSettingsChange,
  onCancel,
  onGenerate,
}: ExportLwcDialogProps) {
  const titleId = useId();
  const descId = useId();
  const nameId = useId();
  const nameErrorId = useId();
  const labelId = useId();
  const descriptionId = useId();
  const apiId = useId();
  const exposedId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const nameValid = isValidLwcComponentName(settings.componentName);

  useEffect(() => {
    if (!open) return;
    nameRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (!generating) onCancel();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, generating, onCancel]);

  if (!open) return null;

  const toggleTarget = (target: string) => {
    const selected = settings.targets.includes(target)
      ? settings.targets.filter((item) => item !== target)
      : [...settings.targets, target];
    onSettingsChange({ ...settings, targets: selected });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="presentation">
      <div
        className="absolute inset-0 bg-zinc-900/40"
        onClick={() => {
          if (!generating) onCancel();
        }}
        aria-hidden
      />
      <div
        ref={dialogRef}
        id="export-lwc-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative flex w-full max-w-lg max-h-[min(40rem,calc(100dvh-1.5rem))] flex-col rounded-lg border border-zinc-200 bg-white shadow-xl"
      >
        <div className="shrink-0 border-b border-zinc-200 px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-zinc-900">
            Export Lightning Web Component
          </h2>
          <p id={descId} className="mt-1 text-xs text-zinc-500">
            Generate a complete LWC bundle containing HTML, JavaScript, and metadata XML.
          </p>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (!nameValid || generating) return;
            onGenerate();
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor={nameId} className="text-[11px] font-medium text-zinc-600">
                  Component Name
                </label>
                <input
                  ref={nameRef}
                  id={nameId}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={settings.componentName}
                  aria-invalid={!nameValid}
                  aria-describedby={nameValid ? undefined : nameErrorId}
                  onChange={(event) =>
                    onSettingsChange({ ...settings, componentName: event.target.value })
                  }
                  className={cn(FIELD, !nameValid && 'border-red-300 focus-visible:ring-red-400')}
                />
                {!nameValid && (
                  <p id={nameErrorId} className="text-xs text-red-600">
                    {lwcComponentNameError(settings.componentName)}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={labelId} className="text-[11px] font-medium text-zinc-600">
                  Master Label
                </label>
                <input
                  id={labelId}
                  type="text"
                  value={settings.masterLabel ?? ''}
                  onChange={(event) =>
                    onSettingsChange({ ...settings, masterLabel: event.target.value })
                  }
                  className={FIELD}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={descriptionId} className="text-[11px] font-medium text-zinc-600">
                  Description
                </label>
                <textarea
                  id={descriptionId}
                  rows={2}
                  value={settings.description ?? ''}
                  onChange={(event) =>
                    onSettingsChange({ ...settings, description: event.target.value })
                  }
                  className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={apiId} className="text-[11px] font-medium text-zinc-600">
                  API Version
                </label>
                <input
                  id={apiId}
                  type="text"
                  inputMode="decimal"
                  value={settings.apiVersion}
                  onChange={(event) =>
                    onSettingsChange({ ...settings, apiVersion: event.target.value })
                  }
                  className={FIELD}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id={exposedId}
                  type="checkbox"
                  checked={settings.isExposed}
                  onChange={(event) =>
                    onSettingsChange({ ...settings, isExposed: event.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
                <label htmlFor={exposedId} className="text-sm text-zinc-700">
                  Is Exposed
                </label>
              </div>

              <fieldset className="flex flex-col gap-1.5">
                <legend className="text-[11px] font-medium text-zinc-600">Targets</legend>
                {TARGET_OPTIONS.map((target) => (
                  <label key={target} className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={settings.targets.includes(target)}
                      onChange={() => toggleTarget(target)}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                    {target}
                  </label>
                ))}
              </fieldset>
            </div>
          </div>

          {(errors.length > 0 || warnings.length > 0) && (
            <div className="shrink-0 space-y-2 border-t border-zinc-100 px-4 py-2">
              {errors.length > 0 && (
                <ul className="space-y-1" role="alert">
                  {errors.map((error, index) => (
                    <li key={`${error.nodeId}-${index}`} className="text-xs text-red-600">
                      {formatLwcExportError(error)}
                    </li>
                  ))}
                </ul>
              )}
              {warnings.length > 0 && (
                <ul className="space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={`${warning.nodeId}-warn-${index}`} className="text-xs text-amber-700">
                      {warning.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-200 px-4 py-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={generating}
              className="h-8 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!nameValid || generating}
              className="h-8 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating…' : 'Generate & Download'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
