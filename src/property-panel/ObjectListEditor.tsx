'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ComponentPropertyDefinition, ObjectListItemSchema } from '@/types/component';
import { isPropertyVisible } from '@/utils/propertyVisibility';
import {
  asObjectList,
  getObjectField,
  moveListItem,
  seedRequiredVisibleDefaults,
  setObjectField,
} from '@/utils/objectList';
import { cn } from '@/utils/cn';
import PropertyEditor from './PropertyEditor';

interface ObjectListEditorProps {
  property: ComponentPropertyDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  onCommit?: () => void;
}

export default function ObjectListEditor({
  property,
  value,
  onChange,
  onCommit,
}: ObjectListEditorProps) {
  const schema = property.itemSchema;
  const items = asObjectList(value);
  const [openIndex, setOpenIndex] = useState<number | null>(items.length > 0 ? 0 : null);

  if (!schema) {
    return (
      <p className="text-[11px] text-zinc-400">This list property has no item schema.</p>
    );
  }

  const commitChange = (next: Record<string, unknown>[]) => {
    onCommit?.();
    onChange(next);
  };

  const addItem = () => {
    let item = structuredClone(schema.defaultItem);
    if (typeof item.lcKey !== 'string' || item.lcKey === '') {
      item.lcKey = crypto.randomUUID();
    }
    item = seedRequiredVisibleDefaults(item, schema.properties);
    const next = [...items, item];
    setOpenIndex(next.length - 1);
    commitChange(next);
  };

  const removeItem = (index: number) => {
    const minItems = schema.minItems ?? 0;
    if (items.length <= minItems) return;
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    setOpenIndex((current) => {
      if (next.length === 0) return null;
      if (current === null) return 0;
      if (current >= next.length) return next.length - 1;
      return current;
    });
    commitChange(next);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    commitChange(moveListItem(items, index, nextIndex));
    setOpenIndex(nextIndex);
  };

  const updateItem = (index: number, field: ComponentPropertyDefinition, fieldValue: unknown) => {
    const current = items[index];
    if (!current) return;
    const next = [...items];
    next[index] = seedRequiredVisibleDefaults(
      setObjectField(current, field, fieldValue),
      schema.properties
    );
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          {schema.emptyLabel ?? 'No items yet.'}
        </p>
      ) : (
        items.map((item, index) => {
          const title = titleForItem(item, schema, index);
          const open = openIndex === index;
          const panelId = `${property.name}-item-${index}`;
          return (
            <div key={itemKey(item, index)} className="rounded-md border border-zinc-200 bg-white">
              <div className="flex items-center gap-0.5 px-1 py-1">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex-1 min-w-0 h-7 px-1.5 text-left text-xs font-medium text-zinc-700 truncate rounded hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {title}
                </button>
                <button
                  type="button"
                  aria-label={`Move ${title} up`}
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${title} down`}
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                  className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${title}`}
                  disabled={items.length <= (schema.minItems ?? 0)}
                  onClick={() => removeItem(index)}
                  className="h-7 w-7 flex items-center justify-center rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-zinc-400 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden />
                </button>
              </div>
              {open && (
                <div id={panelId} className="px-2 pb-2 flex flex-col gap-2 border-t border-zinc-100 pt-2">
                  {schema.properties
                    .filter((field) => isPropertyVisible(field, item))
                    .map((field) => {
                      const inputId = `${property.name}-${index}-${field.nestedObject ?? 'root'}-${field.name}-${field.label}`;
                      return (
                        <div key={inputId} className="flex flex-col gap-1">
                          <label htmlFor={inputId} title={field.description} className="text-[11px] font-medium text-zinc-600">
                            {field.label}
                          </label>
                          <PropertyEditor
                            property={field}
                            value={getObjectField(item, field)}
                            inputId={inputId}
                            onChange={(nextValue) => updateItem(index, field, nextValue)}
                            onCommit={onCommit}
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })
      )}
      <button
        type="button"
        onClick={addItem}
        className={cn(
          'h-8 px-2 rounded-md border border-dashed border-zinc-300 text-xs font-medium text-zinc-600',
          'inline-flex items-center justify-center gap-1 hover:bg-zinc-50 hover:border-zinc-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
        )}
      >
        <Plus className="w-3.5 h-3.5" aria-hidden />
        {schema.addLabel ?? 'Add item'}
      </button>
    </div>
  );
}

function titleForItem(
  item: Record<string, unknown>,
  schema: ObjectListItemSchema,
  index: number
): string {
  if (schema.titleProperty) {
    const title = item[schema.titleProperty];
    if (typeof title === 'string' && title.trim() !== '') return title;
  }
  return `Item ${index + 1}`;
}

function itemKey(item: Record<string, unknown>, index: number): string {
  if (typeof item.lcKey === 'string' && item.lcKey !== '') return item.lcKey;
  return `item-${index}`;
}
