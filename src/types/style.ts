/** SLDS spacing directions. `none` means no utility class for that axis. */
export type SpacingDirection =
  | 'around'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'horizontal'
  | 'vertical';

/** SLDS spacing sizes. Verified against Lightning Design System tokens. */
export type SpacingSize =
  | 'none'
  | 'xxx-small'
  | 'xx-small'
  | 'x-small'
  | 'small'
  | 'medium'
  | 'large'
  | 'x-large'
  | 'xx-large';

export type SpacingBox = Partial<Record<SpacingDirection, SpacingSize>>;

/**
 * LightningCraft spacing configuration (not a Salesforce HTML attribute).
 * The generator maps this to SLDS utility classes on the component.
 */
export interface SpacingConfig {
  margin?: SpacingBox;
  padding?: SpacingBox;
}

export interface SpacingCapability {
  margin?: boolean;
  padding?: boolean;
}

/**
 * Opt-in style features. LightningCraft-specific; distinguished from
 * Salesforce-native properties on ComponentPropertyDefinition.
 */
export interface StyleCapabilities {
  spacing?: SpacingCapability;
}

export const SPACING_DIRECTIONS: SpacingDirection[] = [
  'around',
  'top',
  'right',
  'bottom',
  'left',
  'horizontal',
  'vertical',
];

export const SPACING_SIZES: SpacingSize[] = [
  'none',
  'xxx-small',
  'xx-small',
  'x-small',
  'small',
  'medium',
  'large',
  'x-large',
  'xx-large',
];

/** Salesforce mobile-first layout breakpoints used by Preview. */
export type LayoutViewport = 'small' | 'medium' | 'large';

/**
 * Representative widths (px) for the three Preview viewport modes.
 * Based on SLDS: default/mobile, medium (tablet ~768), large (desktop ~1024).
 */
export const LAYOUT_VIEWPORT_WIDTHS: Record<LayoutViewport, number> = {
  small: 320,
  medium: 768,
  large: 1024,
};
