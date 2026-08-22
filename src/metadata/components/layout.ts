import { CreditCard, LayoutGrid, Rows3 } from 'lucide-react';
import type { ComponentDefinition } from '@/types/component';
import {
  ACTION_TYPES,
  ANY_TYPE,
  CONTAINER_SPACING,
  EXCLUDE_LAYOUT_ITEM,
  LAYOUT_ITEM_TYPE,
  TITLE_TYPES,
  lwcOutput,
} from '../shared/composition';
import {
  ALIGNMENT_BUMP_OPTIONS,
  CARD_VARIANT_OPTIONS,
  LAYOUT_HORIZONTAL_ALIGN_OPTIONS,
  LAYOUT_ITEM_FLEXIBILITY_OPTIONS,
  LAYOUT_ITEM_PADDING_OPTIONS,
  LAYOUT_VERTICAL_ALIGN_OPTIONS,
  PULL_TO_BOUNDARY_OPTIONS,
} from '../shared/options';

export const LAYOUT_COMPONENTS: ComponentDefinition[] = [
  {
    type: 'lightning-card',
    salesforceName: 'lightning-card',
    displayName: 'Card',
    category: 'Layout',
    description:
      'A stylized container around related information. Supports a title, body, actions, and an optional footer.',
    icon: CreditCard,
    styleCapabilities: CONTAINER_SPACING,
    composition: {
      acceptsChildren: true,
      allowAtRoot: true,
      allowedChildren: [ANY_TYPE],
      defaultSlot: 'default',
      slots: [
        {
          name: 'title',
          label: 'Title',
          salesforceSlot: 'title',
          allowedTypes: [...TITLE_TYPES],
        },
        {
          name: 'actions',
          label: 'Actions',
          salesforceSlot: 'actions',
          allowedTypes: [...ACTION_TYPES],
          layout: 'horizontal',
        },
        {
          name: 'default',
          label: 'Body',
          isDefault: true,
          allowedTypes: [ANY_TYPE],
          excludedTypes: [...EXCLUDE_LAYOUT_ITEM],
        },
        {
          name: 'footer',
          label: 'Footer',
          salesforceSlot: 'footer',
          allowedTypes: [ANY_TYPE],
          excludedTypes: [...EXCLUDE_LAYOUT_ITEM],
          layout: 'horizontal',
        },
      ],
    },
    defaultAttributes: {
      title: 'Card',
      variant: 'base',
    },
    properties: [
      {
        name: 'title',
        attributeName: 'title',
        label: 'Title',
        type: 'text',
        defaultValue: 'Card',
        description:
          'Card title text. Use the title attribute for a string, or the title slot for extra markup. The title renders in an h2 element.',
        placeholder: 'Card title',
      },
      {
        name: 'icon-name',
        attributeName: 'icon-name',
        label: 'Icon Name',
        type: 'text',
        description:
          "Lightning Design System icon displayed in the header before the title, in the format 'standard:opportunity'.",
        placeholder: 'e.g. standard:account',
      },
      {
        name: 'variant',
        attributeName: 'variant',
        label: 'Variant',
        type: 'select',
        defaultValue: 'base',
        description: 'Accepted variants: base or narrow. Defaults to base.',
        options: CARD_VARIANT_OPTIONS,
      },
    ],
    canvas: {
      kind: 'container',
      slotArrangement: {
        type: 'regions',
        rows: [
          { slots: ['title', 'actions'], widths: ['flex', 'auto'] },
          { slots: ['default'] },
          { slots: ['footer'] },
        ],
      },
    },
    output: lwcOutput('lightning-card'),
  },

  {
    type: 'lightning-layout',
    salesforceName: 'lightning-layout',
    displayName: 'Layout',
    category: 'Layout',
    description:
      'A responsive flexbox grid. Direct children must be lightning-layout-item components.',
    icon: LayoutGrid,
    styleCapabilities: CONTAINER_SPACING,
    composition: {
      acceptsChildren: true,
      allowAtRoot: true,
      allowedChildren: [LAYOUT_ITEM_TYPE],
      defaultSlot: 'default',
      slots: [
        {
          name: 'default',
          label: 'Layout Items',
          isDefault: true,
          allowedTypes: [LAYOUT_ITEM_TYPE],
          layout: 'horizontal',
        },
      ],
    },
    defaultAttributes: {
      'multiple-rows': false,
    },
    properties: [
      {
        name: 'horizontal-align',
        attributeName: 'horizontal-align',
        label: 'Horizontal Align',
        type: 'select',
        description:
          'How to spread layout items horizontally. Official values: start, center, space, spread, and end.',
        options: LAYOUT_HORIZONTAL_ALIGN_OPTIONS,
      },
      {
        name: 'vertical-align',
        attributeName: 'vertical-align',
        label: 'Vertical Align',
        type: 'select',
        description:
          'How to align layout items vertically. Official values: start, center, end, and stretch.',
        options: LAYOUT_VERTICAL_ALIGN_OPTIONS,
      },
      {
        name: 'multiple-rows',
        attributeName: 'multiple-rows',
        label: 'Multiple Rows',
        type: 'boolean',
        defaultValue: false,
        description:
          'If present, layout items wrap to the following line when they exceed the layout width.',
      },
      {
        name: 'pull-to-boundary',
        attributeName: 'pull-to-boundary',
        label: 'Pull to Boundary',
        type: 'select',
        description:
          'Pulls items to the layout boundaries to match layout-item padding. Possible values: small, medium, or large.',
        options: PULL_TO_BOUNDARY_OPTIONS,
      },
    ],
    canvas: {
      kind: 'container',
      slotArrangement: { type: 'stacked' },
    },
    output: lwcOutput('lightning-layout'),
  },

  {
    type: 'lightning-layout-item',
    salesforceName: 'lightning-layout-item',
    displayName: 'Layout Item',
    category: 'Layout',
    description:
      'A column inside lightning-layout. Layout items must be adjacent children of lightning-layout.',
    icon: Rows3,
    styleCapabilities: CONTAINER_SPACING,
    composition: {
      acceptsChildren: true,
      allowAtRoot: false,
      allowedParents: ['lightning-layout'],
      allowedChildren: [ANY_TYPE],
      defaultSlot: 'default',
      slots: [
        {
          name: 'default',
          label: 'Content',
          isDefault: true,
          allowedTypes: [ANY_TYPE],
          excludedTypes: [...EXCLUDE_LAYOUT_ITEM],
        },
      ],
    },
    defaultAttributes: {},
    properties: [
      {
        name: 'flexibility',
        attributeName: 'flexibility',
        label: 'Flexibility',
        type: 'select',
        description:
          'How the item absorbs extra space. Allowed values: auto, shrink, no-shrink, grow, no-grow, no-flex. Comma-separated values such as auto, no-shrink are also valid in Salesforce.',
        options: LAYOUT_ITEM_FLEXIBILITY_OPTIONS,
      },
      {
        name: 'padding',
        attributeName: 'padding',
        label: 'Padding',
        type: 'select',
        description:
          'Padding on the item. Official values: horizontal-small, horizontal-medium, horizontal-large, around-small, around-medium, around-large.',
        options: LAYOUT_ITEM_PADDING_OPTIONS,
      },
      {
        name: 'alignment-bump',
        attributeName: 'alignment-bump',
        label: 'Alignment Bump',
        type: 'select',
        description: 'Direction to bump alignment of adjacent items. Allowed values: left, top, right, bottom.',
        options: ALIGNMENT_BUMP_OPTIONS,
      },
      {
        name: 'size',
        attributeName: 'size',
        label: 'Size (1–12)',
        type: 'number',
        description:
          'Relative space the item occupies in a 12-column grid, for all device types. Required if any device-size attribute is set. Integer from 1 through 12.',
        placeholder: 'e.g. 6',
        min: 1,
        max: 12,
        step: 1,
        responsive: { breakpoint: 'default' },
      },
      {
        name: 'small-device-size',
        attributeName: 'small-device-size',
        label: 'Small Device Size',
        type: 'number',
        description:
          'Relative space on device-types larger than mobile. Integer from 1 through 12. Requires size.',
        placeholder: 'e.g. 12',
        min: 1,
        max: 12,
        step: 1,
        responsive: { breakpoint: 'small' },
      },
      {
        name: 'medium-device-size',
        attributeName: 'medium-device-size',
        label: 'Medium Device Size',
        type: 'number',
        description:
          'Relative space on tablets and larger. Integer from 1 through 12. Requires size.',
        placeholder: 'e.g. 6',
        min: 1,
        max: 12,
        step: 1,
        responsive: { breakpoint: 'medium' },
      },
      {
        name: 'large-device-size',
        attributeName: 'large-device-size',
        label: 'Large Device Size',
        type: 'number',
        description:
          'Relative space on desktops and larger. Integer from 1 through 12. Requires size.',
        placeholder: 'e.g. 4',
        min: 1,
        max: 12,
        step: 1,
        responsive: { breakpoint: 'large' },
      },
    ],
    canvas: {
      kind: 'container',
      slotArrangement: { type: 'stacked' },
    },
    output: lwcOutput('lightning-layout-item'),
  },
];
