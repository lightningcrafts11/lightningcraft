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

export const LAYOUT_TYPE = 'lightning-layout';

export const EXCLUDE_LAYOUT_ITEM = [LAYOUT_ITEM_TYPE];

export const RECORD_EDIT_FORM_TYPE = 'lightning-record-edit-form';
export const RECORD_VIEW_FORM_TYPE = 'lightning-record-view-form';
export const INPUT_FIELD_TYPE = 'lightning-input-field';
export const OUTPUT_FIELD_TYPE = 'lightning-output-field';
export const MESSAGES_TYPE = 'lightning-messages';

/** Record forms cannot nest in themselves or in each other. */
export const EXCLUDE_NESTED_RECORD_FORMS = [RECORD_EDIT_FORM_TYPE, RECORD_VIEW_FORM_TYPE];

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

/** Parent node is not written as a tag; slot wrappers emit in its place. */
export function unwrapOutput(): HtmlOutputBehavior {
  return { tagName: '', unwrap: true };
}

export const LIGHTNING_MODAL_TYPE = 'LightningModal';
export const MODAL_HEADER_TAG = 'lightning-modal-header';
export const MODAL_BODY_TAG = 'lightning-modal-body';
export const MODAL_FOOTER_TAG = 'lightning-modal-footer';
