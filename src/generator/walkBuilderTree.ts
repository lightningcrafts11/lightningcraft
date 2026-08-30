import type { BuilderNode } from '@/types/builder';
import type { ComponentDefinition } from '@/types/component';
import { getComponentDefinition } from '@/metadata';

export interface WalkedNode {
  node: BuilderNode;
  def: ComponentDefinition | undefined;
}

/**
 * Walks the builder tree in the same document order as HTML generation:
 * root list order, then each slot in metadata slot order, then children.
 */
export function walkBuilderTree(tree: BuilderNode[]): WalkedNode[] {
  const walked: WalkedNode[] = [];

  const visit = (node: BuilderNode) => {
    const def = getComponentDefinition(node.type);
    walked.push({ node, def });
    if (def?.composition.slots) {
      for (const slotDef of def.composition.slots) {
        const children = node.slots?.[slotDef.name] ?? [];
        for (const child of children) visit(child);
      }
      return;
    }
    for (const children of Object.values(node.slots ?? {})) {
      for (const child of children) visit(child);
    }
  };

  for (const node of tree) visit(node);
  return walked;
}
