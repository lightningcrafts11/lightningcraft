'use client';

import type { ReactNode } from 'react';
import type { BuilderNode } from '@/types/builder';
import type { ComponentDefinition, PreviewKind } from '@/types/component';
import { cn } from '@/utils/cn';
import DatatablePreview from '@/renderer/DatatablePreview';
import {
  designTimeFieldLabel,
  designTimeFieldSample,
  designTimeInputKind,
} from '@/metadata/recordForms/preview';
import { buildRecordFormViewModel } from '@/metadata/recordForms/viewModel';

function str(attrs: Record<string, unknown> | undefined, key: string, fallback = ''): string {
  const v = attrs?.[key];
  return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback;
}

type PreviewFn = (node: BuilderNode, def: ComponentDefinition | undefined) => ReactNode;

const BUTTON_VARIANT_CLASS: Record<string, string> = {
  brand: 'bg-blue-600 text-white border-blue-600',
  'brand-outline': 'bg-white text-blue-600 border-blue-600',
  destructive: 'bg-red-600 text-white border-red-600',
  'destructive-text': 'bg-white text-red-600 border-red-600',
  success: 'bg-green-600 text-white border-green-600',
  inverse: 'bg-zinc-900 text-white border-zinc-900',
  base: 'bg-transparent text-blue-600 border-transparent underline',
  neutral: 'bg-white text-zinc-700 border-zinc-300',
};

const LEAF_PREVIEW_RENDERERS: Record<PreviewKind, PreviewFn> = {
  generic: (node, def) => (
    <div className="flex items-center gap-2 text-xs text-zinc-500 pointer-events-none">
      {def && <def.icon className="w-4 h-4 shrink-0" aria-hidden />}
      <span className="font-mono">{def?.displayName ?? node.type}</span>
    </div>
  ),

  button: (node) => {
    const label = str(node.attributes, 'label', 'Button');
    const variant = str(node.attributes, 'variant', 'neutral');
    const disabled = node.attributes.disabled === true;
    const stretch = node.attributes.stretch === true;
    return (
      <button
        type="button"
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded border pointer-events-none',
          BUTTON_VARIANT_CLASS[variant] ?? BUTTON_VARIANT_CLASS.neutral,
          disabled && 'opacity-50',
          stretch && 'w-full'
        )}
      >
        {label}
      </button>
    );
  },

  'button-icon': (node) => {
    const iconName = str(node.attributes, 'icon-name', 'utility:question');
    return (
      <div className="inline-flex items-center justify-center w-8 h-8 rounded border border-zinc-300 bg-white text-zinc-600 pointer-events-none">
        <span className="text-[10px] font-mono leading-none truncate max-w-[60px]">
          {iconName.split(':')[1] ?? iconName}
        </span>
      </div>
    );
  },

  badge: (node) => (
    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200 pointer-events-none">
      {str(node.attributes, 'label', 'Badge')}
    </span>
  ),

  input: (node) => {
    const disabled = node.attributes.disabled === true;
    const required = node.attributes.required === true;
    const readOnly = node.attributes['read-only'] === true;
    const checked = node.attributes.checked === true;
    const type = str(node.attributes, 'type', 'text');
    const label = str(node.attributes, 'label', 'Input');
    const value = str(node.attributes, 'value');
    const placeholder = str(node.attributes, 'placeholder', 'Enter value');

    if (type === 'checkbox' || type === 'checkbox-button') {
      return (
        <div className={cn('flex items-center gap-2 pointer-events-none', disabled && 'opacity-50')}>
          <span
            className={cn(
              'w-3.5 h-3.5 rounded border shrink-0 inline-block',
              checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-zinc-400'
            )}
          />
          <span className="text-xs font-medium text-zinc-600">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </span>
        </div>
      );
    }

    if (type === 'toggle') {
      return (
        <div className={cn('flex items-center gap-2 pointer-events-none', disabled && 'opacity-50')}>
          <span
            className={cn(
              'relative w-8 h-4.5 rounded-full shrink-0',
              checked ? 'bg-blue-600' : 'bg-zinc-300'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm',
                checked ? 'left-4' : 'left-0.5'
              )}
            />
          </span>
          <span className="text-xs font-medium text-zinc-600">{label}</span>
        </div>
      );
    }

    if (type === 'file') {
      return (
        <div className={cn('flex flex-col gap-1 pointer-events-none w-full', disabled && 'opacity-50')}>
          <span className="text-xs font-medium text-zinc-600">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </span>
          <div className="h-7 rounded border border-zinc-300 bg-white px-2 flex items-center text-xs text-zinc-400">
            Choose file
          </div>
        </div>
      );
    }

    return (
      <div className={cn('flex flex-col gap-1 pointer-events-none w-full', disabled && 'opacity-50')}>
        <span className="text-xs font-medium text-zinc-600">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        <div
          className={cn(
            'h-7 rounded border bg-white px-2 flex items-center text-xs',
            readOnly ? 'border-zinc-200 text-zinc-500' : 'border-zinc-300',
            value ? 'text-zinc-700' : 'text-zinc-400'
          )}
        >
          {value || placeholder}
        </div>
      </div>
    );
  },

  textarea: (node) => {
    const disabled = node.attributes.disabled === true;
    const required = node.attributes.required === true;
    const value = str(node.attributes, 'value');
    const placeholder = str(node.attributes, 'placeholder', 'Enter text');
    return (
      <div className={cn('flex flex-col gap-1 pointer-events-none w-full', disabled && 'opacity-50')}>
        <span className="text-xs font-medium text-zinc-600">
          {str(node.attributes, 'label', 'Textarea')}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        <div className="h-14 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-700 whitespace-pre-wrap overflow-hidden">
          {value || <span className="text-zinc-400">{placeholder}</span>}
        </div>
      </div>
    );
  },

  combobox: (node) => (
    <div className="flex flex-col gap-1 pointer-events-none w-full">
      <span className="text-xs font-medium text-zinc-600">
        {str(node.attributes, 'label', 'Combobox')}
      </span>
      <div className="h-7 rounded border border-zinc-300 bg-white px-2 flex items-center justify-between text-xs text-zinc-400">
        <span>{str(node.attributes, 'placeholder', 'Select an option')}</span>
        <span>▾</span>
      </div>
    </div>
  ),

  'checkbox-group': (node) => (
    <div className="flex flex-col gap-1.5 pointer-events-none">
      <span className="text-xs font-medium text-zinc-600">
        {str(node.attributes, 'label', 'Checkbox Group')}
      </span>
      {['Option 1', 'Option 2'].map((opt) => (
        <label key={opt} className="flex items-center gap-1.5 text-xs text-zinc-600">
          <span className="w-3 h-3 rounded border border-zinc-400 shrink-0 inline-block bg-white" />
          {opt}
        </label>
      ))}
    </div>
  ),

  'radio-group': (node) => (
    <div className="flex flex-col gap-1.5 pointer-events-none">
      <span className="text-xs font-medium text-zinc-600">
        {str(node.attributes, 'label', 'Radio Group')}
      </span>
      {['Option 1', 'Option 2'].map((opt) => (
        <label key={opt} className="flex items-center gap-1.5 text-xs text-zinc-600">
          <span className="w-3 h-3 rounded-full border border-zinc-400 shrink-0 inline-block bg-white" />
          {opt}
        </label>
      ))}
    </div>
  ),

  'formatted-text': (node) => (
    <p className="text-sm text-zinc-700 pointer-events-none">
      {str(node.attributes, 'value', 'Sample text')}
    </p>
  ),

  'formatted-number': (node) => {
    const value = node.attributes.value;
    const displayVal =
      typeof value === 'number' ? value.toLocaleString() : String(value ?? '1,234.56');
    return <span className="text-sm font-mono text-zinc-700 pointer-events-none">{displayVal}</span>;
  },

  icon: (node) => {
    const iconName = str(node.attributes, 'icon-name', 'utility:user');
    return (
      <div className="inline-flex items-center gap-1 pointer-events-none">
        <div className="w-6 h-6 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center">
          <span className="text-[9px] font-mono text-zinc-500 truncate">
            {iconName.split(':')[0]?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
        <span className="text-xs text-zinc-500 font-mono">{iconName}</span>
      </div>
    );
  },

  spinner: (node) => (
    <div className="flex items-center gap-2 pointer-events-none">
      <div className="w-5 h-5 rounded-full border-2 border-zinc-200 border-t-blue-500 animate-spin" />
      <span className="text-xs text-zinc-500">
        {str(node.attributes, 'alternative-text', 'Loading')}
      </span>
    </div>
  ),

  datatable: (node) => <DatatablePreview node={node} />,

  'input-field': (node) => {
    const fieldName = str(node.attributes, 'field-name', 'Name');
    const label = designTimeFieldLabel(fieldName);
    const kind = designTimeInputKind(fieldName);
    const required = node.attributes.required === true;
    const disabled = node.attributes.disabled === true;
    const readOnly = node.attributes['read-only'] === true;
    const variant = str(node.attributes, 'variant', 'standard');
    const value = str(node.attributes, 'value');
    const hideLabel = variant === 'label-hidden';
    const controlClass = cn(
      'h-7 rounded border bg-white px-2 flex items-center text-xs min-w-0 flex-1',
      readOnly ? 'border-zinc-200 text-zinc-500' : 'border-zinc-300',
      value ? 'text-zinc-700' : 'text-zinc-400'
    );

    if (kind === 'checkbox') {
      return (
        <div className={cn('flex items-center gap-2 pointer-events-none', disabled && 'opacity-50')}>
          <span className="w-3.5 h-3.5 rounded border border-zinc-400 bg-white shrink-0 inline-block" />
          <span className="text-xs font-medium text-zinc-600">
            {label}
            {required && (
              <span className="text-red-500 ml-0.5" aria-hidden>
                *
              </span>
            )}
          </span>
        </div>
      );
    }

    let control: ReactNode;
    if (kind === 'picklist') {
      control = (
        <div className={cn(controlClass, 'justify-between')}>
          <span>{value || 'Select…'}</span>
          <span>▾</span>
        </div>
      );
    } else if (kind === 'date') {
      control = <div className={controlClass}>{value || 'Sample date'}</div>;
    } else if (kind === 'number') {
      control = <div className={cn(controlClass, 'justify-end font-mono')}>{value || ''}</div>;
    } else {
      control = <div className={controlClass}>{value || ''}</div>;
    }

    return (
      <div
        className={cn(
          'flex gap-1 pointer-events-none w-full',
          variant === 'label-inline' ? 'flex-row items-center' : 'flex-col',
          disabled && 'opacity-50'
        )}
      >
        {!hideLabel && (
          <span className="text-xs font-medium text-zinc-600">
            {label}
            {required && (
              <span className="text-red-500 ml-0.5" aria-hidden>
                *
              </span>
            )}
          </span>
        )}
        {control}
      </div>
    );
  },

  messages: () => (
    <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-800 pointer-events-none">
      Form messages
    </div>
  ),

  'record-form': (node) => {
    const model = buildRecordFormViewModel(node.attributes);
    const density = str(node.attributes, 'density', 'auto');
    const stacked = density !== 'compact';
    return (
      <div className="flex flex-col gap-2 pointer-events-none w-full rounded border border-zinc-200 bg-white p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-zinc-500 truncate">
            {model.objectApiName}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-zinc-400 shrink-0">
            {model.mode}
            {model.modeIsInferred ? ' (inferred)' : ''}
          </span>
        </div>
        {model.fields.length === 0 ? (
          <p className="text-xs text-zinc-400">Specify fields or layout-type</p>
        ) : (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${model.columns}, minmax(0, 1fr))` }}
          >
            {model.fields.map((field) => (
              <div key={field.fieldApiName} className={cn('flex gap-1 min-w-0', stacked ? 'flex-col' : 'flex-row items-center')}>
                <span className="text-xs font-medium text-zinc-500 truncate">
                  {field.label}
                  {model.showInlineEdit ? <span className="ml-1 text-zinc-300">✎</span> : null}
                </span>
                {model.mode === 'readonly' || model.mode === 'view' ? (
                  <span className="text-sm text-zinc-800 truncate">{field.sample}</span>
                ) : (
                  <div className="h-7 rounded border border-zinc-300 bg-white px-2 flex items-center text-xs text-zinc-400 min-w-0">
                    {field.kind === 'picklist' ? 'Select…' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {model.showSaveCancel ? (
          <div className="flex justify-end gap-2 pt-1">
            <span className="px-3 py-1 text-xs rounded border border-zinc-300 text-zinc-600">Cancel</span>
            <span className="px-3 py-1 text-xs rounded border border-blue-600 bg-blue-600 text-white">
              Save
            </span>
          </div>
        ) : null}
        {model.usesLayoutPlaceholders ? (
          <p className="text-[10px] text-zinc-400">Layout fields (preview only)</p>
        ) : null}
      </div>
    );
  },

  'output-field': (node) => {
    const fieldName = str(node.attributes, 'field-name', 'Name');
    const label = designTimeFieldLabel(fieldName);
    const sample = designTimeFieldSample(fieldName);
    const hideLabel = str(node.attributes, 'variant', 'standard') === 'label-hidden';
    return (
      <div className="flex flex-col gap-0.5 pointer-events-none w-full">
        {!hideLabel && <span className="text-xs font-medium text-zinc-500">{label}</span>}
        <span className="text-sm text-zinc-800">{sample}</span>
      </div>
    );
  },
};

/** Renders a lightweight visual preview from canvas.previewKind metadata. */
export function LeafPreview({
  node,
  def,
}: {
  node: BuilderNode;
  def: ComponentDefinition | undefined;
}) {
  const kind: PreviewKind = def?.canvas.kind === 'leaf' ? def.canvas.previewKind : 'generic';
  const renderer = LEAF_PREVIEW_RENDERERS[kind] ?? LEAF_PREVIEW_RENDERERS.generic;
  const safeNode =
    node.attributes === undefined ? { ...node, attributes: {} } : node;
  return <>{renderer(safeNode, def)}</>;
}
