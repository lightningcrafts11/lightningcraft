'use client';

import { MousePointer2 } from 'lucide-react';
import { useCallback } from 'react';
import { useBuilderStore } from '@/store/builderStore';
import { findNodeInTree } from '@/utils/treeOps';
import { getComponentDefinition } from '@/metadata';
import type { SpacingConfig } from '@/types/style';
import PropertyInspector from './PropertyInspector';

export default function PropertyPanel() {
  const selectedNodeId = useBuilderStore((s) => s.selectedNodeId);
  const node = useBuilderStore((s) =>
    s.selectedNodeId ? findNodeInTree(s.nodes, s.selectedNodeId) : undefined
  );
  const updateNodeAttribute = useBuilderStore((s) => s.updateNodeAttribute);
  const updateNodeSpacing = useBuilderStore((s) => s.updateNodeSpacing);
  const commitHistory = useBuilderStore((s) => s.commitHistory);

  const definition = node ? getComponentDefinition(node.type) : undefined;

  const handleAttributeChange = useCallback(
    (name: string, value: unknown) => {
      if (!node) return;
      updateNodeAttribute(node.id, name, value);
    },
    [node, updateNodeAttribute]
  );

  const handleSpacingChange = useCallback(
    (spacing: SpacingConfig | undefined) => {
      if (!node) return;
      updateNodeSpacing(node.id, spacing);
    },
    [node, updateNodeSpacing]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" data-property-inspector>
      <div className="px-3 pt-3 pb-2.5 border-b border-zinc-200 shrink-0">
        <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          Properties
        </h2>
      </div>

      {selectedNodeId && node && definition ? (
        <PropertyInspector
          node={node}
          definition={definition}
          onAttributeChange={handleAttributeChange}
          onSpacingChange={handleSpacingChange}
          onCommitHistory={commitHistory}
        />
      ) : selectedNodeId && node && !definition ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
          <p className="text-sm font-medium text-zinc-500 mb-1">Unknown component</p>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-[180px]">
            No ComponentDefinition is registered for <span className="font-mono">{node.type}</span>.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-3">
            <MousePointer2 className="w-4.5 h-4.5 text-zinc-400" aria-hidden />
          </div>
          <p className="text-sm font-medium text-zinc-500 mb-1">No component selected</p>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-[180px]">
            Select a component to configure its properties.
          </p>
        </div>
      )}
    </div>
  );
}
