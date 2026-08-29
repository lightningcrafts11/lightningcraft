import type { LucideIcon } from 'lucide-react';
import type { StyleCapabilities } from './style';

/** Supported property editor types. Extend this union to add new editor kinds. */
export type PropertyEditorType = 'text' | 'number' | 'boolean' | 'select' | 'object-list';

/**
 * How a property is written to generated LWC HTML.
 * `attribute` is a Salesforce HTML attribute. `binding` and `event` are
 * JavaScript expressions (`name={expr}`) required by @api properties and handlers.
 */
export type PropertyOutputKind = 'attribute' | 'binding' | 'event';

/**
 * Schema for one item in an `object-list` property (e.g. datatable columns).
 * Nested `visibleWhen` is evaluated against the item, not the parent node.
 */
export interface ObjectListItemSchema {
  /** Object created when the user adds an item. */
  defaultItem: Record<string, unknown>;
  /** Item property used as the collapsed-row title. */
  titleProperty?: string;
  addLabel?: string;
  emptyLabel?: string;
  /** When set, the editor will not allow the list to shrink below this length. */
  minItems?: number;
  properties: ComponentPropertyDefinition[];
}

/**
 * Component library categories.
 * Add a value here when a new Salesforce family needs its own group.
 * The library derives visible categories from registered definitions.
 */
export const COMPONENT_CATEGORIES = ['Basic', 'Forms', 'Layout', 'Display'] as const;
export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

/** A single option for a select-type property editor. */
export interface SelectOption {
  label: string;
  value: string;
}

/** SLDS size breakpoints used by responsive layout attributes. */
export type ResponsiveBreakpoint = 'default' | 'small' | 'medium' | 'large';

/**
 * Describes responsive behavior for a Salesforce size/device attribute.
 * LightningCraft-specific; the Salesforce attribute name remains on the property.
 */
export interface ResponsiveBehavior {
  breakpoint: ResponsiveBreakpoint;
}

/**
 * Describes a named slot on a composable component.
 * Drives drop validation, canvas slot zones, and future HTML slot output.
 */
export interface SlotDefinition {
  /** Internal slot key used in the BuilderNode tree (e.g. 'default', 'actions'). */
  name: string;
  /** User-facing label displayed in the canvas slot zone (e.g. 'Body', 'Actions'). */
  label: string;
  /**
   * Salesforce slot name written to HTML.
   * Omit for the unnamed default slot. Named slots use this value as slot="…".
   */
  salesforceSlot?: string;
  /** True for the component's default (unnamed) slot. */
  isDefault?: boolean;
  /**
   * Allowed LWC type names for this slot.
   * Use ['*'] to allow any component type (subject to excludedTypes and the
   * source component's allowedParents).
   */
  allowedTypes: string[];
  /**
   * Type names explicitly excluded even when allowedTypes contains '*'.
   * Use to keep lightning-layout-item out of general content slots.
   */
  excludedTypes?: string[];
  /** Visual layout direction for children in the canvas. Defaults to 'vertical'. */
  layout?: 'horizontal' | 'vertical';
}

/**
 * Salesforce-aware composition rules for a component.
 * The drag/drop engine reads only this metadata — never component type names.
 */
export interface ComponentComposition {
  /** Whether this component can contain child BuilderNodes. */
  acceptsChildren: boolean;
  /**
   * Whether this component may be placed on the canvas root.
   * Defaults to true when omitted. Set false for children that require a parent
   * (e.g. lightning-layout-item).
   */
  allowAtRoot?: boolean;
  /**
   * Parent component types this component may be placed into.
   * Omit or use ['*'] to allow any parent whose slot accepts this type.
   */
  allowedParents?: string[];
  /**
   * Component-level child summary. Slot allowedTypes remain authoritative
   * for drop validation; this field documents the relationship for future systems.
   */
  allowedChildren?: string[];
  /** Named slots this component exposes. Empty / omitted for leaf components. */
  slots?: SlotDefinition[];
  /** Slot name used when a caller does not specify one. Typically 'default'. */
  defaultSlot?: string;
}

/**
 * Lightweight canvas preview kind. The renderer maps these generically;
 * adding a component that reuses an existing kind does not require canvas changes.
 */
export type PreviewKind =
  | 'generic'
  | 'button'
  | 'button-icon'
  | 'badge'
  | 'input'
  | 'textarea'
  | 'combobox'
  | 'checkbox-group'
  | 'radio-group'
  | 'formatted-text'
  | 'formatted-number'
  | 'icon'
  | 'spinner'
  | 'datatable';

/** One visual row of slot drop zones on the canvas. */
export interface SlotArrangementRow {
  /** Slot names to render in this row, left to right. */
  slots: string[];
  /** Width hint per slot. 'flex' grows; 'auto' shrinks to content. */
  widths?: Array<'flex' | 'auto'>;
}

/**
 * How a container's slots are arranged on the canvas.
 * New container components should describe their regions here rather than
 * adding type-specific branches to the canvas.
 */
export type SlotArrangement =
  | { type: 'stacked' }
  | {
      type: 'regions';
      rows: SlotArrangementRow[];
    };

/** Canvas rendering behavior derived from metadata. */
export type CanvasBehavior =
  | {
      kind: 'leaf';
      previewKind: PreviewKind;
      /** Attribute shown as the primary visible text in the canvas preview. */
      previewLabelProperty?: string;
    }
  | {
      kind: 'container';
      slotArrangement?: SlotArrangement;
    };

/**
 * HTML/output metadata consumed by the LWC HTML generator.
 */
export interface HtmlOutputBehavior {
  /** Salesforce LWC tag written to HTML, e.g. 'lightning-button'. */
  tagName: string;
}

/** Describes a single configurable property on a component. */
export interface ComponentPropertyDefinition {
  /** LightningCraft property key. Usually the Salesforce attribute name. */
  name: string;
  /**
   * Salesforce HTML attribute name.
   * Defaults to `name` when omitted (e.g. 'icon-name').
   */
  attributeName?: string;
  /** Human-readable label shown in the Property Inspector. */
  label: string;
  type: PropertyEditorType;
  defaultValue?: unknown;
  required?: boolean;
  description?: string;
  /** Populated when type === 'select'. */
  options?: SelectOption[];
  placeholder?: string;
  /** Inclusive numeric minimum. Used when type === 'number'. */
  min?: number;
  /** Inclusive numeric maximum. Used when type === 'number'. */
  max?: number;
  /** Numeric increment. Used when type === 'number'. */
  step?: number;
  /** Present when this attribute participates in SLDS responsive sizing. */
  responsive?: ResponsiveBehavior;
  /**
   * False when this is a JavaScript `@api` property rather than an HTML attribute
   * (for example `options` on lightning-combobox). Defaults to true.
   */
  htmlAttribute?: boolean;
  /**
   * HTML output form. Defaults to `attribute`.
   * Use `binding` for @api values such as `data={data}`.
   * Use `event` for handlers such as `onsort={handleSort}`.
   */
  outputKind?: PropertyOutputKind;
  /**
   * JavaScript identifier used for `binding` output when the stored value is not
   * itself a handler/binding name (for example columns stored as an array).
   */
  jsBinding?: string;
  /**
   * For `object-list` properties: describes each list item and its editors.
   */
  itemSchema?: ObjectListItemSchema;
  /**
   * When set on an object-list item field, the value is stored on a nested
   * object (e.g. Salesforce `typeAttributes` or `cellAttributes`).
   */
  nestedObject?: string;
  /**
   * When set, the inspector and HTML generator only use this property if the
   * condition matches the node's current attributes.
   */
  visibleWhen?: PropertyCondition | PropertyCondition[];
}

/** Operators for metadata-driven property visibility. */
export type PropertyConditionOperator = 'equals' | 'notEquals' | 'in' | 'notIn';

/**
 * Show or emit a property only when another attribute matches.
 * Evaluated against the builder node's attributes; no inspector hard-coding.
 */
export interface PropertyCondition {
  property: string;
  operator: PropertyConditionOperator;
  value: unknown;
}

/**
 * Self-contained description of one Salesforce LWC component.
 * Core LightningCraft systems (library, drag/drop, canvas, future inspector
 * and HTML generator) consume this contract generically.
 *
 * Adding a component should mean: create a definition, register it.
 */
export interface ComponentDefinition {
  /** LightningCraft type id. Matches the LWC tag for standard components. */
  type: string;
  /** Salesforce LWC component name, e.g. 'lightning-button'. */
  salesforceName: string;
  /** Human-readable label shown in the Component Library and canvas. */
  displayName: string;
  category: ComponentCategory;
  description?: string;
  /** Lucide icon used in the Component Library. */
  icon: LucideIcon;
  composition: ComponentComposition;
  /**
   * LightningCraft-specific style features (SLDS spacing, etc.).
   * Not Salesforce HTML attributes; the generator maps them to classes.
   */
  styleCapabilities?: StyleCapabilities;
  /** Applied when a new BuilderNode is created from this definition. */
  defaultAttributes: Record<string, unknown>;
  properties: ComponentPropertyDefinition[];
  canvas: CanvasBehavior;
  output: HtmlOutputBehavior;
}
