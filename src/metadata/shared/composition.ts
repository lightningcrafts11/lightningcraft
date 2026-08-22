import type { ComponentComposition, HtmlOutputBehavior } from '@/types/component';
import type { StyleCapabilities } from '@/types/style';

/** Slot wildcard: any registered type is allowed, subject to excludedTypes. */
export const ANY_TYPE = '*';

/** Action components allowed in card actions (and similar future slots). */
export const ACTION_TYPES = ['lightning-button', 'lightning-button-icon'];

/** Presentational content allowed in a card title region. */
export const TITLE_TYPES = ['lightning-formatted-text', 'lightning-icon', 'lightning-badge'];

/** Must only appear as a direct child of lightning-layout. */
export const LAYOUT_ITEM_TYPE = 'lightning-layout-item';

export const EXCLUDE_LAYOUT_ITEM = [LAYOUT_ITEM_TYPE];

/** Shared composition for components that cannot contain builder children. */
export const LEAF_COMPOSITION: ComponentComposition = {
  acceptsChildren: false,
  allowAtRoot: true,
};

/** SLDS spacing on leaf components (button, input, etc.). */
export const LEAF_SPACING: StyleCapabilities = {
  spacing: { margin: true, padding: true },
};

/** Margin only — do not pad internal Salesforce slots/markup. */
export const CONTAINER_SPACING: StyleCapabilities = {
  spacing: { margin: true, padding: false },
};

export function lwcOutput(tagName: string): HtmlOutputBehavior {
  return { tagName };
}
