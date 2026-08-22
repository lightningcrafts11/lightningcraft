import type { SpacingConfig } from './style';

/**
 * A single node in the visual builder component tree.
 * Recursive: children live inside named slots.
 * Intentionally free of React or framework-specific imports.
 */
export interface BuilderNode {
  /** Unique identifier generated at node-creation time (never during render). */
  id: string;
  /** LWC tag name matching a ComponentDefinition.type */
  type: string;
  /** Attribute key-value pairs for this component instance. */
  attributes: Record<string, unknown>;
  /**
   * Child nodes organised by slot name.
   * Use 'default' for the unnamed default slot.
   * Always an object (empty for leaf components).
   */
  slots: Record<string, BuilderNode[]>;
  /**
   * SLDS spacing (margin/padding). LightningCraft-specific; exported as
   * utility classes, not Salesforce component attributes.
   */
  spacing?: SpacingConfig;
}
