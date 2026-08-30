export type {
  ComponentDefinition,
  ComponentPropertyDefinition,
  ComponentCategory,
  PropertyEditorType,
  PropertyOutputKind,
  ObjectListItemSchema,
  SelectOption,
  SlotDefinition,
  ComponentComposition,
  CanvasBehavior,
  HtmlOutputBehavior,
  PreviewKind,
  SlotArrangement,
  SlotArrangementRow,
  ResponsiveBehavior,
  ResponsiveBreakpoint,
  PropertyCondition,
  PropertyConditionOperator,
  JsRole,
  JsInitializer,
} from './component';

export { COMPONENT_CATEGORIES } from './component';

export type { BuilderNode } from './builder';

export type {
  LwcExportSettings,
  JsField,
  JsHandler,
  JsImport,
  BindingAssignment,
  LwcBundlePlan,
  LwcBundleFiles,
  LwcBundleResult,
  GenerationError,
} from './lwcExport';

export { DEFAULT_LWC_EXPORT_SETTINGS } from './lwcExport';

export type {
  SpacingConfig,
  SpacingBox,
  SpacingDirection,
  SpacingSize,
  SpacingCapability,
  StyleCapabilities,
  LayoutViewport,
} from './style';

export { SPACING_DIRECTIONS, SPACING_SIZES, LAYOUT_VIEWPORT_WIDTHS } from './style';
