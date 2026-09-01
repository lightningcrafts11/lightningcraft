import { AppWindow } from 'lucide-react';
import type { ComponentDefinition } from '@/types/component';
import {
  ACTION_TYPES,
  ANY_TYPE,
  EXCLUDE_LAYOUT_ITEM,
  LIGHTNING_MODAL_TYPE,
  MODAL_BODY_TAG,
  MODAL_FOOTER_TAG,
  MODAL_HEADER_TAG,
  unwrapOutput,
} from '../shared/composition';

/**
 * Design-time representation of a custom LWC that extends LightningModal.
 * Salesforce has no <lightning-modal> host tag. HTML export unwraps this node
 * and emits lightning-modal-header/body/footer helpers instead.
 */
export const MODAL_COMPONENTS: ComponentDefinition[] = [
  {
    type: LIGHTNING_MODAL_TYPE,
    salesforceName: 'LightningModal',
    displayName: 'Lightning Modal',
    category: 'Layout',
    description:
      'Designs a custom LWC that extends LightningModal from lightning/modal. There is no lightning-modal tag. Header, body, and footer export as lightning-modal-* helpers. Nested placement in a parent is authoring-only; the parent bundle cannot include this class. Opening via MyModal.open() belongs in a parent LWC and is not generated.',
    icon: AppWindow,
    composition: {
      acceptsChildren: true,
      allowAtRoot: true,
      nestedAuthoring: true,
      allowedChildren: [ANY_TYPE],
      defaultSlot: 'default',
      slots: [
        {
          name: 'header',
          label: 'Header',
          allowedTypes: [],
          wrapperTag: MODAL_HEADER_TAG,
          wrapperAttributes: ['label'],
          wrapperTextProperty: 'tagline',
          previewAttribute: 'label',
          previewSecondaryAttribute: 'tagline',
        },
        {
          name: 'default',
          label: 'Body',
          isDefault: true,
          allowedTypes: [ANY_TYPE],
          excludedTypes: [...EXCLUDE_LAYOUT_ITEM, LIGHTNING_MODAL_TYPE],
          wrapperTag: MODAL_BODY_TAG,
          emitWrapperWhenEmpty: true,
        },
        {
          name: 'footer',
          label: 'Footer',
          allowedTypes: [...ACTION_TYPES],
          layout: 'horizontal',
          wrapperTag: MODAL_FOOTER_TAG,
        },
      ],
    },
    defaultAttributes: {
      label: 'Modal',
    },
    properties: [
      {
        name: 'label',
        attributeName: 'label',
        label: 'Header Label',
        type: 'text',
        defaultValue: 'Modal',
        required: true,
        description:
          'Heading text on lightning-modal-header. Required for accessibility when a header is present. Not a lightning-modal host attribute.',
        placeholder: 'Modal title',
      },
      {
        name: 'tagline',
        attributeName: 'tagline',
        label: 'Header Tagline',
        type: 'text',
        htmlAttribute: false,
        description:
          'Optional tagline text inside lightning-modal-header. Salesforce allows this as default-slot text (links as <a> only). Not an HTML attribute.',
        placeholder: 'Optional description',
      },
    ],
    canvas: {
      kind: 'container',
      previewClass: 'max-w-xl mx-auto shadow-xl ring-1 ring-zinc-200',
      slotArrangement: {
        type: 'regions',
        rows: [{ slots: ['header'] }, { slots: ['default'] }, { slots: ['footer'] }],
      },
    },
    output: unwrapOutput(),
    jsClass: {
      extends: {
        name: 'LightningModal',
        module: 'lightning/modal',
        importKind: 'default',
      },
    },
  },
];
