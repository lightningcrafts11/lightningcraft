'use client';

import type { BuilderNode } from '@/types/builder';
import type { ComponentDefinition } from '@/types/component';
import type { SpacingConfig } from '@/types/style';
import { visibleProperties } from '@/utils/propertyVisibility';
import PropertyField from './PropertyField';
import SpacingFields from './SpacingFields';

interface PropertyInspectorProps {
  node: BuilderNode;
  definition: ComponentDefinition;
  onAttributeChange: (name: string, value: unknown) => void;
  onSpacingChange: (spacing: SpacingConfig | undefined) => void;
  onCommitHistory?: () => void;
}

/**
 * Generic metadata-driven inspector.
 * Renders visible `definition.properties` in metadata order, then optional
 * style capabilities. Adding a component never requires type-specific branches.
 */
export default function PropertyInspector({
  node,
  definition,
  onAttributeChange,
  onSpacingChange,
  onCommitHistory,
}: PropertyInspectorProps) {
  const properties = visibleProperties(definition, node.attributes);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-3 py-2.5 border-b border-zinc-100 shrink-0">
        <p className="text-sm font-medium text-zinc-800 truncate">{definition.displayName}</p>
        <p className="text-[11px] font-mono text-zinc-400 truncate">{definition.salesforceName}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {properties.map((property) => (
          <PropertyField
            key={`${node.id}:${property.name}`}
            nodeId={node.id}
            attributes={node.attributes}
            property={property}
            onChange={onAttributeChange}
            onCommit={onCommitHistory}
          />
        ))}
        {definition.styleCapabilities && (
          <SpacingFields
            nodeId={node.id}
            capabilities={definition.styleCapabilities}
            spacing={node.spacing}
            onChange={onSpacingChange}
          />
        )}
      </div>
    </div>
  );
}
