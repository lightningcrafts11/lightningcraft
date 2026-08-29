'use client';

import { RotateCcw } from 'lucide-react';
import type { ComponentPropertyDefinition } from '@/types/component';
import { isAtDefault, resolvePropertyValue } from '@/utils/propertyValue';
import { cn } from '@/utils/cn';
import PropertyEditor from './PropertyEditor';

interface PropertyFieldProps {
  nodeId: string;
  attributes: Record<string, unknown>;
  property: ComponentPropertyDefinition;
  onChange: (name: string, value: unknown) => void;
  onCommit?: () => void;
}

export default function PropertyField({
  nodeId,
  attributes,
  property,
  onChange,
  onCommit,
}: PropertyFieldProps) {
  const value = resolvePropertyValue(attributes, property);
  const inputId = `${nodeId}-${property.name}`;
  const canReset = property.defaultValue !== undefined;
  const showReset = canReset && !isAtDefault(attributes, property);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 min-w-0">
        <label
          htmlFor={inputId}
          title={property.description}
          className="text-[11px] font-medium text-zinc-600 truncate"
        >
          {property.label}
          {property.required && (
            <span className="text-red-500 ml-0.5" aria-hidden>
              *
            </span>
          )}
        </label>
        {canReset && (
          <button
            type="button"
            aria-label={`Reset ${property.label} to default`}
            title="Reset to default"
            disabled={!showReset}
            onClick={() =>
              onChange(
                property.name,
                typeof property.defaultValue === 'object' && property.defaultValue !== null
                  ? structuredClone(property.defaultValue)
                  : property.defaultValue
              )
            }
            className={cn(
              'ml-auto h-5 w-5 flex items-center justify-center rounded shrink-0 transition-colors',
              showReset
                ? 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer'
                : 'text-zinc-200 cursor-default'
            )}
          >
            <RotateCcw className="w-3 h-3" aria-hidden />
          </button>
        )}
      </div>
      <PropertyEditor
        property={property}
        value={value}
        inputId={inputId}
        onChange={(next) => onChange(property.name, next)}
        onCommit={onCommit}
      />
    </div>
  );
}
