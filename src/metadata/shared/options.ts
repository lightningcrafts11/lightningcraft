import type { SelectOption } from '@/types/component';

/** Shared SLDS size scale used by icons, button-icons, and spinners. */
export const ICON_SIZE_OPTIONS: SelectOption[] = [
  { label: 'XX-Small', value: 'xx-small' },
  { label: 'X-Small', value: 'x-small' },
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];

/** Form label layout variants used by input, textarea, combobox, and groups. */
export const LABEL_VARIANT_OPTIONS: SelectOption[] = [
  { label: 'Standard', value: 'standard' },
  { label: 'Label Hidden', value: 'label-hidden' },
  { label: 'Label Inline', value: 'label-inline' },
  { label: 'Label Stacked', value: 'label-stacked' },
];

export const BUTTON_VARIANT_OPTIONS: SelectOption[] = [
  { label: 'Base', value: 'base' },
  { label: 'Neutral', value: 'neutral' },
  { label: 'Brand', value: 'brand' },
  { label: 'Brand Outline', value: 'brand-outline' },
  { label: 'Destructive', value: 'destructive' },
  { label: 'Destructive Text', value: 'destructive-text' },
  { label: 'Inverse', value: 'inverse' },
  { label: 'Success', value: 'success' },
];

export const BUTTON_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Button', value: 'button' },
  { label: 'Submit', value: 'submit' },
  { label: 'Reset', value: 'reset' },
];

export const BUTTON_ICON_VARIANT_OPTIONS: SelectOption[] = [
  { label: 'Bare', value: 'bare' },
  { label: 'Bare Inverse', value: 'bare-inverse' },
  { label: 'Border', value: 'border' },
  { label: 'Border Filled', value: 'border-filled' },
  { label: 'Border Inverse', value: 'border-inverse' },
  { label: 'Brand', value: 'brand' },
  { label: 'Container', value: 'container' },
];

export const ICON_POSITION_OPTIONS: SelectOption[] = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
];

export const BADGE_ICON_POSITION_OPTIONS: SelectOption[] = [
  { label: 'Start', value: 'start' },
  { label: 'End', value: 'end' },
];

/**
 * lightning-input type values from the Salesforce specification.
 * `text` is the documented default and is included even though the spec list
 * enumerates the non-default types.
 */
export const INPUT_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Text', value: 'text' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Checkbox Button', value: 'checkbox-button' },
  { label: 'Color', value: 'color' },
  { label: 'Date', value: 'date' },
  { label: 'Date-Time', value: 'datetime' },
  { label: 'Date-Time Local', value: 'datetime-local' },
  { label: 'Time', value: 'time' },
  { label: 'Email', value: 'email' },
  { label: 'File', value: 'file' },
  { label: 'Number', value: 'number' },
  { label: 'Password', value: 'password' },
  { label: 'Range', value: 'range' },
  { label: 'Search', value: 'search' },
  { label: 'Tel', value: 'tel' },
  { label: 'Toggle', value: 'toggle' },
  { label: 'URL', value: 'url' },
];

export const DATE_STYLE_OPTIONS: SelectOption[] = [
  { label: 'Short', value: 'short' },
  { label: 'Medium', value: 'medium' },
  { label: 'Long', value: 'long' },
];

export const TIME_STYLE_OPTIONS: SelectOption[] = [
  { label: 'Short', value: 'short' },
  { label: 'Medium', value: 'medium' },
  { label: 'Long', value: 'long' },
];

export const NUMBER_FORMATTER_OPTIONS: SelectOption[] = [
  { label: 'Decimal', value: 'decimal' },
  { label: 'Percent', value: 'percent' },
  { label: 'Percent Fixed', value: 'percent-fixed' },
  { label: 'Currency', value: 'currency' },
];

export const FORMATTED_NUMBER_STYLE_OPTIONS: SelectOption[] = [
  { label: 'Decimal', value: 'decimal' },
  { label: 'Currency', value: 'currency' },
  { label: 'Percent', value: 'percent' },
  { label: 'Percent Fixed', value: 'percent-fixed' },
];

export const CURRENCY_DISPLAY_OPTIONS: SelectOption[] = [
  { label: 'Symbol', value: 'symbol' },
  { label: 'Code', value: 'code' },
  { label: 'Name', value: 'name' },
];

export const RADIO_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Radio', value: 'radio' },
  { label: 'Button', value: 'button' },
];

export const COMBOBOX_VARIANT_OPTIONS: SelectOption[] = [
  { label: 'Standard', value: 'standard' },
  { label: 'Label Hidden', value: 'label-hidden' },
  { label: 'Label Inline', value: 'label-inline' },
  { label: 'Label Stacked', value: 'label-stacked' },
  { label: 'Button', value: 'button' },
];

export const CARD_VARIANT_OPTIONS: SelectOption[] = [
  { label: 'Base', value: 'base' },
  { label: 'Narrow', value: 'narrow' },
];

/** Official lightning-layout horizontal-align values, plus start (flex default). */
export const LAYOUT_HORIZONTAL_ALIGN_OPTIONS: SelectOption[] = [
  { label: 'None', value: '' },
  { label: 'Start', value: 'start' },
  { label: 'Center', value: 'center' },
  { label: 'Space', value: 'space' },
  { label: 'Spread', value: 'spread' },
  { label: 'End', value: 'end' },
];

export const LAYOUT_VERTICAL_ALIGN_OPTIONS: SelectOption[] = [
  { label: 'None', value: '' },
  { label: 'Start', value: 'start' },
  { label: 'Center', value: 'center' },
  { label: 'End', value: 'end' },
  { label: 'Stretch', value: 'stretch' },
];

export const PULL_TO_BOUNDARY_OPTIONS: SelectOption[] = [
  { label: 'None', value: '' },
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];

export const LAYOUT_ITEM_FLEXIBILITY_OPTIONS: SelectOption[] = [
  { label: 'None', value: '' },
  { label: 'Auto', value: 'auto' },
  { label: 'Shrink', value: 'shrink' },
  { label: 'No Shrink', value: 'no-shrink' },
  { label: 'Grow', value: 'grow' },
  { label: 'No Grow', value: 'no-grow' },
  { label: 'No Flex', value: 'no-flex' },
];

/** Official lightning-layout-item padding values. */
export const LAYOUT_ITEM_PADDING_OPTIONS: SelectOption[] = [
  { label: 'None', value: '' },
  { label: 'Around Small', value: 'around-small' },
  { label: 'Around Medium', value: 'around-medium' },
  { label: 'Around Large', value: 'around-large' },
  { label: 'Horizontal Small', value: 'horizontal-small' },
  { label: 'Horizontal Medium', value: 'horizontal-medium' },
  { label: 'Horizontal Large', value: 'horizontal-large' },
];

export const ALIGNMENT_BUMP_OPTIONS: SelectOption[] = [
  { label: 'None', value: '' },
  { label: 'Left', value: 'left' },
  { label: 'Top', value: 'top' },
  { label: 'Right', value: 'right' },
  { label: 'Bottom', value: 'bottom' },
];

export const ICON_VARIANT_OPTIONS: SelectOption[] = [
  { label: 'None', value: '' },
  { label: 'Inverse', value: 'inverse' },
  { label: 'Error', value: 'error' },
  { label: 'Warning', value: 'warning' },
  { label: 'Success', value: 'success' },
];

export const SPINNER_VARIANT_OPTIONS: SelectOption[] = [
  { label: 'Base', value: 'base' },
  { label: 'Brand', value: 'brand' },
  { label: 'Inverse', value: 'inverse' },
];

/** lightning-record-*-form density. Official default is auto. */
export const RECORD_FORM_DENSITY_OPTIONS: SelectOption[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Comfy', value: 'comfy' },
  { label: 'Compact', value: 'compact' },
];

/** lightning-output-field variant. Official values: standard, label-hidden. */
export const OUTPUT_FIELD_VARIANT_OPTIONS: SelectOption[] = [
  { label: 'Standard', value: 'standard' },
  { label: 'Label Hidden', value: 'label-hidden' },
];
