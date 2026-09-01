import type { BuilderNode } from '@/types/builder';
import type { ComponentDefinition } from '@/types/component';
import type { GenerationError } from '@/types/lwcExport';

/**
 * A class-owning node that is not a canvas root is an authoring stand-in
 * for a separate LWC. It must not contribute jsClass or unwrapped markup
 * to the parent bundle.
 */
export function isNestedClassOwner(
  def: ComponentDefinition,
  isCanvasRoot: boolean
): boolean {
  return Boolean(def.jsClass) && !isCanvasRoot;
}

export function nestedClassOwnerExportError(node: BuilderNode): GenerationError {
  return {
    nodeId: node.id,
    componentType: node.type,
    message:
      `"${node.type}" is a class-owning component. Nested instances are authoring-only ` +
      'stand-ins for a separate LWC and cannot be included in this bundle. ' +
      'Multi-LWC export is not supported yet.',
  };
}
