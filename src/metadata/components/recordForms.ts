import { BookOpen, ClipboardList, ClipboardPen, MessageSquare, Text, TextCursorInput } from 'lucide-react';
import type { ComponentDefinition, ComponentPropertyDefinition } from '@/types/component';
import {
  ANY_TYPE,
  CONTAINER_SPACING,
  EXCLUDE_LAYOUT_ITEM,
  EXCLUDE_NESTED_RECORD_FORMS,
  INPUT_FIELD_TYPE,
  LAYOUT_ITEM_TYPE,
  LAYOUT_TYPE,
  LEAF_COMPOSITION,
  LEAF_SPACING,
  MESSAGES_TYPE,
  OUTPUT_FIELD_TYPE,
  RECORD_EDIT_FORM_TYPE,
  RECORD_FORM_TYPE,
  RECORD_VIEW_FORM_TYPE,
  lwcOutput,
} from '../shared/composition';
import {
  RECORD_FORM_FIELD_ITEM_PROPERTIES,
  toSalesforceFieldApiNames,
} from '../recordForms/fields';
import {
  LABEL_VARIANT_OPTIONS,
  OUTPUT_FIELD_VARIANT_OPTIONS,
  RECORD_FORM_DENSITY_OPTIONS,
  RECORD_FORM_LAYOUT_TYPE_OPTIONS,
  RECORD_FORM_MODE_OPTIONS,
} from '../shared/options';

/** Binding initializer for record-id={recordId} → recordId = "". */
function emptyStringLiteral(): unknown {
  return '';
}

function objectApiNameProperty(): ComponentPropertyDefinition {
  return {
    name: 'object-api-name',
    attributeName: 'object-api-name',
    label: 'Object API Name',
    type: 'text',
    description:
      'API name of the Salesforce object, for example Account or Contact. Exported as a literal, not a JavaScript binding.',
    placeholder: 'Account',
  };
}

function recordIdBindingProperty(): ComponentPropertyDefinition {
  return {
    name: 'record-id',
    attributeName: 'record-id',
    label: 'Record Id',
    type: 'text',
    htmlAttribute: false,
    outputKind: 'binding',
    jsBinding: 'recordId',
    jsRole: 'internal-field',
    jsInitializer: 'literal',
    serializeJsValue: emptyStringLiteral,
    description:
      'JavaScript identifier for the record Id. Emitted as record-id={recordId} when set. Leave blank to omit. Not @api.',
    placeholder: 'recordId',
  };
}

function densityProperty(): ComponentPropertyDefinition {
  return {
    name: 'density',
    attributeName: 'density',
    label: 'Density',
    type: 'select',
    defaultValue: 'auto',
    description:
      'Field and label arrangement. Official values: compact, comfy, and auto (default).',
    options: RECORD_FORM_DENSITY_OPTIONS,
  };
}

function classProperty(): ComponentPropertyDefinition {
  return {
    name: 'class',
    attributeName: 'class',
    label: 'Class',
    type: 'text',
    description: 'CSS class on the host element. Combined with SLDS spacing classes on export.',
    placeholder: 'slds-m-top_small',
  };
}

function optionalFieldsBinding(): ComponentPropertyDefinition {
  return {
    name: 'optional-fields',
    attributeName: 'optional-fields',
    label: 'Optional Fields',
    type: 'text',
    htmlAttribute: false,
    outputKind: 'binding',
    jsBinding: 'optionalFields',
    jsRole: 'internal-field',
    jsInitializer: 'empty-array',
    description:
      'JavaScript string array of optional field API names. Emitted as optional-fields={optionalFields} when an identifier is set.',
    placeholder: 'optionalFields',
  };
}

function formEvent(
  name: string,
  placeholder: string,
  description: string
): ComponentPropertyDefinition {
  return {
    name,
    attributeName: name,
    label: name,
    type: 'text',
    outputKind: 'event',
    jsRole: 'handler',
    description,
    placeholder,
  };
}

export const RECORD_FORM_COMPONENTS: ComponentDefinition[] = [
  {
    type: RECORD_FORM_TYPE,
    salesforceName: RECORD_FORM_TYPE,
    displayName: 'Record Form',
    category: 'Forms',
    description:
      'Self-contained create, view, or edit form. Specify fields or layout-type. Salesforce renders input/output fields internally; do not nest lightning-input-field or lightning-output-field. Design-time only; not connected to an org.',
    icon: ClipboardList,
    styleCapabilities: CONTAINER_SPACING,
    composition: LEAF_COMPOSITION,
    defaultAttributes: {
      density: 'auto',
      'layout-type': 'Full',
    },
    properties: [
      objectApiNameProperty(),
      recordIdBindingProperty(),
      {
        name: 'mode',
        attributeName: 'mode',
        label: 'Mode',
        type: 'select',
        description:
          'Interaction style: view, edit, or readonly. Omit to let Salesforce infer edit when record-id is absent and view when record-id is set.',
        options: RECORD_FORM_MODE_OPTIONS,
      },
      {
        name: 'layout-type',
        attributeName: 'layout-type',
        label: 'Layout Type',
        type: 'select',
        defaultValue: 'Full',
        description:
          'Load fields from the object Compact or Full layout. When creating a record (no record-id), Compact is not supported and Salesforce shows the full layout. Prefer fields or layout-type, not both.',
        options: RECORD_FORM_LAYOUT_TYPE_OPTIONS,
      },
      {
        name: 'fields',
        attributeName: 'fields',
        label: 'Fields',
        type: 'object-list',
        htmlAttribute: false,
        outputKind: 'binding',
        jsBinding: 'fields',
        jsRole: 'internal-field',
        jsInitializer: 'literal',
        serializeJsValue: toSalesforceFieldApiNames,
        description:
          'JavaScript string array of field API names, emitted as fields={fields}. Fields appear in this order. Use instead of (or without) layout-type. Not child components.',
        itemSchema: {
          defaultItem: { fieldApiName: 'Name' },
          titleProperty: 'fieldApiName',
          addLabel: 'Add field',
          emptyLabel: 'No fields listed. Salesforce uses layout-type when set, or this array.',
          properties: RECORD_FORM_FIELD_ITEM_PROPERTIES,
        },
      },
      {
        name: 'columns',
        attributeName: 'columns',
        label: 'Columns',
        type: 'number',
        min: 1,
        description: 'Number of columns for the form. Omit to use the Salesforce default.',
        placeholder: 'e.g. 2',
      },
      densityProperty(),
      {
        name: 'record-type-id',
        attributeName: 'record-type-id',
        label: 'Record Type Id',
        type: 'text',
        description:
          'Record type ID when the object has multiple record types and no default. Literal string.',
        placeholder: '012xxxxxxxxxxxx',
      },
      formEvent(
        'onload',
        'handleLoad',
        'Handler when the form loads record data. Emitted only when a JavaScript identifier is set.'
      ),
      formEvent(
        'onsubmit',
        'handleSubmit',
        'Handler when the form is submitted. Emitted only when a JavaScript identifier is set.'
      ),
      formEvent(
        'onsuccess',
        'handleSuccess',
        'Handler when the record saves successfully. Emitted only when a JavaScript identifier is set.'
      ),
      formEvent(
        'onerror',
        'handleError',
        'Handler when the form returns a server-side error. Emitted only when a JavaScript identifier is set.'
      ),
      formEvent(
        'oncancel',
        'handleCancel',
        'Handler when the user clicks Cancel. Emitted only when a JavaScript identifier is set. Unique to lightning-record-form among record form components.'
      ),
    ],
    canvas: { kind: 'leaf', previewKind: 'record-form' },
    output: lwcOutput(RECORD_FORM_TYPE),
  },

  {
    type: RECORD_EDIT_FORM_TYPE,
    salesforceName: RECORD_EDIT_FORM_TYPE,
    displayName: 'Record Edit Form',
    category: 'Forms',
    description:
      'Creates or edits a Salesforce record. Place lightning-messages, lightning-input-field, lightning-layout, and lightning-button as children. Design-time only; not connected to an org.',
    icon: ClipboardPen,
    styleCapabilities: CONTAINER_SPACING,
    composition: {
      acceptsChildren: true,
      allowAtRoot: true,
      allowedChildren: [ANY_TYPE],
      defaultSlot: 'default',
      slots: [
        {
          name: 'default',
          label: 'Fields',
          isDefault: true,
          allowedTypes: [ANY_TYPE],
          excludedTypes: [...EXCLUDE_LAYOUT_ITEM, ...EXCLUDE_NESTED_RECORD_FORMS],
        },
      ],
    },
    defaultAttributes: {
      density: 'auto',
    },
    properties: [
      objectApiNameProperty(),
      recordIdBindingProperty(),
      densityProperty(),
      {
        name: 'record-type-id',
        attributeName: 'record-type-id',
        label: 'Record Type Id',
        type: 'text',
        description:
          'Record type ID when the object has multiple record types and no default. Literal string.',
        placeholder: '012xxxxxxxxxxxx',
      },
      {
        name: 'form-class',
        attributeName: 'form-class',
        label: 'Form Class',
        type: 'text',
        description: 'CSS class for the inner form element.',
        placeholder: 'slds-p-around_small',
      },
      classProperty(),
      optionalFieldsBinding(),
      formEvent(
        'onsubmit',
        'handleSubmit',
        'Handler when the form is submitted. Emitted only when a JavaScript identifier is set.'
      ),
      formEvent(
        'onsuccess',
        'handleSuccess',
        'Handler when the record saves successfully. Emitted only when a JavaScript identifier is set.'
      ),
      formEvent(
        'onerror',
        'handleError',
        'Handler when the form returns a server-side error. Emitted only when a JavaScript identifier is set.'
      ),
      formEvent(
        'onload',
        'handleLoad',
        'Handler when the form loads record data. Emitted only when a JavaScript identifier is set.'
      ),
    ],
    canvas: {
      kind: 'container',
      slotArrangement: { type: 'stacked' },
    },
    output: lwcOutput(RECORD_EDIT_FORM_TYPE),
  },

  {
    type: INPUT_FIELD_TYPE,
    salesforceName: INPUT_FIELD_TYPE,
    displayName: 'Input Field',
    category: 'Forms',
    description:
      'Editable field inside lightning-record-edit-form. The org schema determines the input type from field-name. Must be a descendant of lightning-record-edit-form (direct child or via lightning-layout-item).',
    icon: TextCursorInput,
    styleCapabilities: LEAF_SPACING,
    composition: {
      acceptsChildren: false,
      allowAtRoot: false,
      allowedParents: [RECORD_EDIT_FORM_TYPE],
      allowedParentsWithAncestor: {
        parents: [LAYOUT_ITEM_TYPE],
        ancestors: [RECORD_EDIT_FORM_TYPE],
      },
    },
    defaultAttributes: {
      'field-name': 'Name',
      required: false,
      disabled: false,
      'read-only': false,
      variant: 'standard',
    },
    properties: [
      {
        name: 'field-name',
        attributeName: 'field-name',
        label: 'Field Name',
        type: 'text',
        defaultValue: 'Name',
        required: true,
        description: 'API name of the field, for example Name or Phone.',
        placeholder: 'Name',
      },
      {
        name: 'value',
        attributeName: 'value',
        label: 'Value',
        type: 'text',
        description: 'Overrides the existing field value when the form displays.',
        placeholder: 'Initial value',
      },
      {
        name: 'required',
        attributeName: 'required',
        label: 'Required',
        type: 'boolean',
        defaultValue: false,
        description: 'If present, the field must be filled out before the form is submitted.',
      },
      {
        name: 'disabled',
        attributeName: 'disabled',
        label: 'Disabled',
        type: 'boolean',
        defaultValue: false,
        description:
          'If present, the field is grayed out and users cannot interact with it.',
      },
      {
        name: 'read-only',
        attributeName: 'read-only',
        label: 'Read Only',
        type: 'boolean',
        defaultValue: false,
        description:
          'If present, the field cannot be edited. Official attribute name is read-only (not a separate readonly property). Not supported for rich text, picklist, multi-select picklist, and lookup.',
      },
      {
        name: 'variant',
        attributeName: 'variant',
        label: 'Variant',
        type: 'select',
        defaultValue: 'standard',
        description:
          'Label position. Official values: standard, label-hidden, label-inline, and label-stacked. Overrides parent form density when set.',
        options: LABEL_VARIANT_OPTIONS,
      },
      {
        name: 'aria-invalid',
        attributeName: 'aria-invalid',
        label: 'ARIA Invalid',
        type: 'boolean',
        defaultValue: false,
        description:
          'Controls whether assistive technologies read empty required textboxes as invalid. Defaults to false.',
      },
      {
        name: 'autocomplete',
        attributeName: 'autocomplete',
        label: 'Autocomplete',
        type: 'text',
        description:
          "Controls auto-filling. Supported field types: text, email, textarea, and single select picklist.",
        placeholder: 'e.g. email',
      },
      classProperty(),
      formEvent(
        'onchange',
        'handleChange',
        'Handler when the field value changes. Documented for lookup fields. Emitted only when a JavaScript identifier is set.'
      ),
    ],
    canvas: { kind: 'leaf', previewKind: 'input-field', previewLabelProperty: 'field-name' },
    output: lwcOutput(INPUT_FIELD_TYPE),
  },

  {
    type: RECORD_VIEW_FORM_TYPE,
    salesforceName: RECORD_VIEW_FORM_TYPE,
    displayName: 'Record View Form',
    category: 'Forms',
    description:
      'Read-only record layout. Direct children are lightning-output-field, or lightning-layout wrapping output fields. Design-time only; not connected to an org.',
    icon: BookOpen,
    styleCapabilities: CONTAINER_SPACING,
    composition: {
      acceptsChildren: true,
      allowAtRoot: true,
      allowedChildren: [OUTPUT_FIELD_TYPE, LAYOUT_TYPE],
      defaultSlot: 'default',
      slots: [
        {
          name: 'default',
          label: 'Fields',
          isDefault: true,
          allowedTypes: [OUTPUT_FIELD_TYPE, LAYOUT_TYPE],
        },
      ],
    },
    defaultAttributes: {
      density: 'auto',
    },
    properties: [
      objectApiNameProperty(),
      recordIdBindingProperty(),
      densityProperty(),
      classProperty(),
      optionalFieldsBinding(),
      formEvent(
        'onload',
        'handleLoad',
        'Handler when the form loads record data. Emitted only when a JavaScript identifier is set.'
      ),
    ],
    canvas: {
      kind: 'container',
      slotArrangement: { type: 'stacked' },
    },
    output: lwcOutput(RECORD_VIEW_FORM_TYPE),
  },

  {
    type: OUTPUT_FIELD_TYPE,
    salesforceName: OUTPUT_FIELD_TYPE,
    displayName: 'Output Field',
    category: 'Forms',
    description:
      'Read-only field display. Must be a descendant of lightning-record-view-form, or of lightning-record-edit-form for read-only fields on an edit form. May sit in lightning-layout-item when that layout is inside one of those forms.',
    icon: Text,
    styleCapabilities: LEAF_SPACING,
    composition: {
      acceptsChildren: false,
      allowAtRoot: false,
      allowedParents: [RECORD_VIEW_FORM_TYPE, RECORD_EDIT_FORM_TYPE],
      allowedParentsWithAncestor: {
        parents: [LAYOUT_ITEM_TYPE],
        ancestors: [RECORD_VIEW_FORM_TYPE, RECORD_EDIT_FORM_TYPE],
      },
    },
    defaultAttributes: {
      'field-name': 'Name',
      variant: 'standard',
    },
    properties: [
      {
        name: 'field-name',
        attributeName: 'field-name',
        label: 'Field Name',
        type: 'text',
        defaultValue: 'Name',
        required: true,
        description: 'API name of the field, for example Name or Phone.',
        placeholder: 'Name',
      },
      {
        name: 'variant',
        attributeName: 'variant',
        label: 'Variant',
        type: 'select',
        defaultValue: 'standard',
        description:
          'Appearance of the output. Official values: standard and label-hidden. Defaults to standard. Overrides parent form density when set.',
        options: OUTPUT_FIELD_VARIANT_OPTIONS,
      },
      {
        name: 'field-class',
        attributeName: 'field-class',
        label: 'Field Class',
        type: 'text',
        description: 'CSS class for the outer field element, in addition to the component base classes.',
        placeholder: 'slds-form-element_1-col',
      },
      classProperty(),
    ],
    canvas: { kind: 'leaf', previewKind: 'output-field', previewLabelProperty: 'field-name' },
    output: lwcOutput(OUTPUT_FIELD_TYPE),
  },

  {
    type: MESSAGES_TYPE,
    salesforceName: MESSAGES_TYPE,
    displayName: 'Messages',
    category: 'Forms',
    description:
      'Displays Lightning Data Service and field-level errors on lightning-record-edit-form. Documented as a direct child of the form. No public attributes are listed in Salesforce examples; export is an empty tag.',
    icon: MessageSquare,
    styleCapabilities: LEAF_SPACING,
    composition: {
      acceptsChildren: false,
      allowAtRoot: false,
      allowedParents: [RECORD_EDIT_FORM_TYPE],
    },
    defaultAttributes: {},
    properties: [],
    canvas: { kind: 'leaf', previewKind: 'messages' },
    output: lwcOutput(MESSAGES_TYPE),
  },
];
