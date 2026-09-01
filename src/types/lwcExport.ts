import type { JsClassExtends, JsInitializer, JsRole } from './component';
import { DEFAULT_LWC_CLASS_EXTENDS } from './component';

export type { JsInitializer, JsRole, JsClassExtends };
export { DEFAULT_LWC_CLASS_EXTENDS };

export interface GenerationError {
  nodeId: string;
  componentType: string;
  message: string;
}

/** Bundle identity for a generated LWC. Not part of the canvas tree. */
export interface LwcExportSettings {
  componentName: string;
  masterLabel?: string;
  description?: string;
  apiVersion: string;
  isExposed: boolean;
  targets: string[];
}

export const DEFAULT_LWC_EXPORT_SETTINGS: LwcExportSettings = {
  componentName: 'lightningCraftComponent',
  apiVersion: '62.0',
  isExposed: true,
  targets: ['lightning__AppPage', 'lightning__HomePage', 'lightning__RecordPage'],
};

/** A JavaScript class field or @api property to emit. */
export interface JsField {
  name: string;
  role: JsRole;
  initializer: JsInitializer;
  /** Salesforce-shaped value when initializer is `literal`. */
  value?: unknown;
}

/** A generated event handler method. */
export interface JsHandler {
  name: string;
}

/** An ES import in the generated JavaScript file. */
export interface JsImport {
  module: string;
  named: string[];
  defaultImport?: string;
}

/** Maps one builder property to the identifier used in HTML and JS. */
export interface BindingAssignment {
  nodeId: string;
  propertyName: string;
  identifier: string;
}

/**
 * Derived export plan. Built from the builder tree + metadata.
 * Not a second source of truth and not persisted.
 */
export interface LwcBundlePlan {
  fields: JsField[];
  handlers: JsHandler[];
  imports: JsImport[];
  assignments: BindingAssignment[];
  errors: GenerationError[];
  warnings: GenerationError[];
  /** Class the generated LWC extends. Always set by the planner from metadata. */
  classExtends: JsClassExtends;
}

export interface LwcBundleFiles {
  html: string;
  js: string;
  metaXml: string;
}

export interface LwcBundleResult {
  files: LwcBundleFiles;
  errors: GenerationError[];
  warnings: GenerationError[];
}
