'use client';

import { useState } from 'react';
import type { ComponentPropertyDefinition } from '@/types/component';
import {
  asBoolean,
  asNumberInputValue,
  asSelectValue,
  asText,
  INVALID_NUMBER,
  parseNumberInput,
} from '@/utils/propertyValue';
import { cn } from '@/utils/cn';

const CONTROL_CLASS =
  'w-full h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400';

interface PropertyEditorProps {
  property: ComponentPropertyDefinition;
  value: unknown;
  inputId: string;
  onChange: (value: unknown) => void;
  onCommit?: () => void;
}

export default function PropertyEditor({
  property,
  value,
  inputId,
  onChange,
  onCommit,
}: PropertyEditorProps) {
  switch (property.type) {
    case 'boolean':
      return <BooleanEditor property={property} value={value} inputId={inputId} onChange={onChange} />;
    case 'number':
      return (
        <NumberEditor
          property={property}
          value={value}
          inputId={inputId}
          onChange={onChange}
          onCommit={onCommit}
        />
      );
    case 'select':
      return <SelectEditor property={property} value={value} inputId={inputId} onChange={onChange} />;
    case 'text':
    default:
      return (
        <TextEditor
          property={property}
          value={value}
          inputId={inputId}
          onChange={onChange}
          onCommit={onCommit}
        />
      );
  }
}

function TextEditor({ property, value, inputId, onChange, onCommit }: PropertyEditorProps) {
  return (
    <input
      id={inputId}
      type="text"
      value={asText(value)}
      placeholder={property.placeholder}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => onCommit?.()}
      className={CONTROL_CLASS}
    />
  );
}

function NumberEditor({ property, value, inputId, onChange, onCommit }: PropertyEditorProps) {
  const committed = asNumberInputValue(value);
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      id={inputId}
      type="number"
      value={draft ?? committed}
      placeholder={property.placeholder}
      min={property.min}
      max={property.max}
      step={property.step ?? 'any'}
      onFocus={() => setDraft(committed)}
      onBlur={() => {
        setDraft(null);
        onCommit?.();
      }}
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        const parsed = parseNumberInput(raw, property);
        if (parsed === INVALID_NUMBER) return;
        onChange(parsed);
      }}
      className={CONTROL_CLASS}
    />
  );
}

function SelectEditor({ property, value, inputId, onChange }: PropertyEditorProps) {
  const options = property.options ?? [];
  const selected = asSelectValue(value, options, property.defaultValue);

  return (
    <select
      id={inputId}
      value={selected}
      onChange={(event) => onChange(event.target.value)}
      className={cn(CONTROL_CLASS, 'pr-6')}
    >
      {options.map((option) => (
        <option key={option.value === '' ? '__empty' : option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function BooleanEditor({ property, value, inputId, onChange }: PropertyEditorProps) {
  const checked = asBoolean(value);

  return (
    <button
      id={inputId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={property.label}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex items-center gap-2 h-8 px-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors',
      )}
    >
      <span
        className={cn(
          'relative w-8 h-4.5 rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-zinc-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-3.5'
          )}
        />
      </span>
      <span className="text-[11px] font-medium text-zinc-600 w-7">
        {checked ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
