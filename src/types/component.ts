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

/** How a binding or event is represented in generated LWC JavaScript. */
export type JsRole = 'internal-field' | 'api' | 'handler';

/** How an internal or @api field is initialized in generated JavaScript. */
export type JsInitializer = 'literal' | 'empty-array' | 'empty-object' | 'none';

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
   * source component's allowedParents / allowedParentsWithAncestor).
   * An empty array allows no children. Omit only when a wrapper is property-driven.
   */
  allowedTypes: string[];
  /**
   * Type names explicitly excluded even when allowedTypes contains '*'.
   * Use to keep lightning-layout-item out of general content slots.
   */
  excludedTypes?: string[];
  /** Visual layout direction for children in the canvas. Defaults to 'vertical'. */
  layout?: 'horizontal' | 'vertical';
  /**
   * Salesforce tag that wraps this slot's children in generated HTML.
   * Used when the parent unwraps (no host tag) and the slot maps to a helper
   * component such as lightning-modal-body.
   */
  wrapperTag?: string;
  /**
   * Parent property names written as attributes on wrapperTag.
   * Not emitted on the parent node when output.unwrap is true.
   */
  wrapperAttributes?: string[];
  /**
   * Parent attribute emitted as text content inside wrapperTag.
   * Used for Salesforce default-slot text such as a modal header tagline.
   */
  wrapperTextProperty?: string;
  /** Emit wrapperTag even when the slot has no children and no wrapper text. */
  emitWrapperWhenEmpty?: boolean;
  /**
   * Parent attribute used as design-time preview text when the slot has no children.
   * Defaults to the slot name.
   */
  previewAttribute?: string;
  /** Optional second parent attribute shown under the primary preview text. */
  previewSecondaryAttribute?: string;
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
   * Parent component types this component may be placed into as a direct child.
   * Omit or use ['*'] to allow any parent whose slot accepts this type.
   */
  allowedParents?: string[];
  /**
   * Additional immediate parents allowed only when one of `ancestors` is already
   * in the target's ancestor chain. Slot allowedTypes still apply.
   *
   * Used for Salesforce wrappers such as lightning-layout-item inside a
   * lightning-record-*-form, without globally allowing the child under that parent.
   */
  allowedParentsWithAncestor?: {
    parents: string[];
    ancestors: string[];
  };
  /**
   * Component-level child summary. Slot allowedTypes remain authoritative
   * for drop validation; this field documents the relationship for future systems.
   */
  allowedChildren?: string[];
  /** Named slots this component exposes. Empty / omitted for leaf components. */
  slots?: SlotDefinition[];
  /** Slot name used when a caller does not specify one. Typically 'default'. */
  defaultSlot?: string;
  /**
   * When true, this component may only be placed at the canvas root.
   * Nested drops are rejected even if a parent slot allows '*'.
   * Do not combine with nestedAuthoring.
   */
  rootOnly?: boolean;
  /**
   * When true, this class-owning component may be nested in general-content
   * slots as an authoring stand-in for a separate LWC.
   *
   * General content means an unnamed default slot (isDefault, no salesforceSlot).
   * Named Salesforce slots (slot="title", slot="actions", slot="footer") reject it.
   *
   * Nested instances remain on the canvas for design. The single-bundle exporter
   * must not unwrap them into the parent HTML or apply their jsClass to the parent.
   * Export fails with a generation error until multi-LWC export exists.
   */
  nestedAuthoring?: boolean;
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
  | 'datatable'
  | 'input-field'
  | 'output-field'
  | 'messages'
  | 'record-form';

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
      /** Optional extra classes on the design-time container surface. */
      previewClass?: string;
    };

/**
 * HTML/output metadata consumed by the LWC HTML generator.
 */
export interface HtmlOutputBehavior {
  /** Salesforce LWC tag written to HTML, e.g. 'lightning-button'. */
  tagName: string;
  /**
   * When true, this node is not written as an HTML element.
   * Slot wrappers and children are emitted in its place.
   * Use when Salesforce has no host tag (for example LightningModal).
   */
  unwrap?: boolean;
}

/**
 * How this component affects the generated LWC JavaScript class.
 * Consumed generically by the JS planner — not a per-component generator branch.
 */
export type JsModuleImportKind = 'default' | 'named';

export interface JsClassExtends {
  /** JavaScript identifier used in `export default class X extends Name`. */
  name: string;
  /** Module specifier, e.g. 'lwc' or 'lightning/modal'. */
  module: string;
  /** Whether `name` is the default export or a named export of `module`. */
  importKind: JsModuleImportKind;
}

/**
 * Default generated class when a canvas has no `jsClass` metadata.
 * LightningElement is the Salesforce default for ordinary LWCs.
 */
export const DEFAULT_LWC_CLASS_EXTENDS: JsClassExtends = {
  name: 'LightningElement',
  module: 'lwc',
  importKind: 'named',
};

export interface JsClassBehavior {
  /** Class the generated LWC extends, including how to import it. */
  extends: JsClassExtends;
  /**
   * Extra imports this component requires in the generated JavaScript.
   * Merged generically with planner-derived imports (`api`, base class).
   */
  imports?: Array<{
    module: string;
    named: string[];
    defaultImport?: string;
  }>;
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
   * How this property appears in generated LWC JavaScript.
   * Defaults from `outputKind`: binding → internal-field, event → handler.
   */
  jsRole?: JsRole;
  /**
   * How to initialize a generated class field. Ignored for handlers.
   * `literal` emits the stored (serialized) value. `empty-array` / `empty-object`
   * are placeholders for runtime data. `none` emits a bare field (typical for @api).
   */
  jsInitializer?: JsInitializer;
  /**
   * When true, warn if the stored value is not an array of {label, value} objects.
   * Used for Salesforce `options` bindings that the builder cannot yet edit structurally.
   */
  warnWhenUnstructuredOptions?: boolean;
  /**
   * Converts a structured inspector value into a Salesforce-shaped JS value.
   * Used for object-list properties such as datatable columns. Must strip
   * LightningCraft-only keys (e.g. lcKey).
   */
  serializeJsValue?: (value: unknown) => unknown;
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
  /**
   * Optional generated-class metadata. When present on any node in the tree,
   * the JS planner uses it for imports and the class `extends` clause.
   */
  jsClass?: JsClassBehavior;
}
