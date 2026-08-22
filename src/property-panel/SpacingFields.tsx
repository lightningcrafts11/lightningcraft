'use client';

import type { SpacingConfig, SpacingDirection, SpacingSize, StyleCapabilities } from '@/types/style';
import { SPACING_DIRECTIONS, SPACING_SIZES } from '@/types/style';
import { setSpacingField } from '@/utils/spacing';

const DIRECTION_LABELS: Record<SpacingDirection, string> = {
  around: 'Around',
  top: 'Top',
  right: 'Right',
  bottom: 'Bottom',
  left: 'Left',
  horizontal: 'Horizontal',
  vertical: 'Vertical',
};

const SIZE_LABELS: Record<SpacingSize, string> = {
  none: 'None',
  'xxx-small': 'XXX-Small',
  'xx-small': 'XX-Small',
  'x-small': 'X-Small',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  'x-large': 'X-Large',
  'xx-large': 'XX-Large',
};

interface SpacingFieldsProps {
  nodeId: string;
  capabilities: StyleCapabilities;
  spacing: SpacingConfig | undefined;
  onChange: (spacing: SpacingConfig | undefined) => void;
}

/**
 * Generic SLDS spacing editors. Shown only when the component definition
 * opts in via styleCapabilities.spacing.
 */
export default function SpacingFields({
  nodeId,
  capabilities,
  spacing,
  onChange,
}: SpacingFieldsProps) {
  const spacingCap = capabilities.spacing;
  if (!spacingCap?.margin && !spacingCap?.padding) return null;

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100">
      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Spacing</p>
      {spacingCap.margin && (
        <SpacingBoxFields
          nodeId={nodeId}
          kind="margin"
          label="Margin"
          box={spacing?.margin}
          onChange={(direction, size) => onChange(setSpacingField(spacing, 'margin', direction, size))}
        />
      )}
      {spacingCap.padding && (
        <SpacingBoxFields
          nodeId={nodeId}
          kind="padding"
          label="Padding"
          box={spacing?.padding}
          onChange={(direction, size) => onChange(setSpacingField(spacing, 'padding', direction, size))}
        />
      )}
    </div>
  );
}

function SpacingBoxFields({
  nodeId,
  kind,
  label,
  box,
  onChange,
}: {
  nodeId: string;
  kind: 'margin' | 'padding';
  label: string;
  box: SpacingConfig['margin'];
  onChange: (direction: SpacingDirection, size: SpacingSize | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-medium text-zinc-600">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {SPACING_DIRECTIONS.map((direction) => {
          const inputId = `${nodeId}-${kind}-${direction}`;
          const value = box?.[direction] ?? '';
          return (
            <label key={direction} className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] text-zinc-400 truncate">{DIRECTION_LABELS[direction]}</span>
              <select
                id={inputId}
                value={value}
                onChange={(event) => {
                  const next = event.target.value;
                  onChange(direction, next === '' ? undefined : (next as SpacingSize));
                }}
                className="h-8 w-full rounded-md border border-zinc-200 bg-white px-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              >
                <option value="">—</option>
                {SPACING_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {SIZE_LABELS[size]}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
    </div>
  );
}
