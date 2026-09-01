import { describe, expect, it } from 'vitest';
import {
  canDrop,
  canDropAtRoot,
  canDropOnNode,
  createBuilderNode,
  getComponentDefinition,
  getComponentsByCategory,
} from '@/metadata';
import { generateLwcBundle, generateLwcHtml } from '@/generator';
import { visibleProperties } from '@/utils/propertyVisibility';
import {
  designTimeFieldLabel,
  designTimeFieldSample,
  designTimeInputKind,
} from '@/metadata/recordForms/preview';
import { getLayoutItemStyle } from '@/utils/layoutGrid';
import type { BuilderNode } from '@/types/builder';

function def(type: string) {
  const found = getComponentDefinition(type);
  expect(found).toBeDefined();
  return found!;
}

function namesOf(type: string): string[] {
  return def(type).properties.map((property) => property.name);
}

describe('Salesforce record form registration', () => {
  it('registers record-form components including lightning-messages', () => {
    const types = [
      'lightning-record-edit-form',
      'lightning-input-field',
      'lightning-record-view-form',
      'lightning-output-field',
      'lightning-messages',
    ];
    const forms = getComponentsByCategory('Forms').map((item) => item.type);
    for (const type of types) {
      const component = def(type);
      expect(component.salesforceName).toBe(type);
      expect(component.output.tagName).toBe(type);
      expect(component.category).toBe('Forms');
      expect(forms).toContain(type);
    }
  });

  it('is found by display name and Salesforce tag', () => {
    expect(def('lightning-record-edit-form').displayName).toBe('Record Edit Form');
    expect(def('lightning-input-field').displayName).toBe('Input Field');
    expect(def('lightning-record-view-form').displayName).toBe('Record View Form');
    expect(def('lightning-output-field').displayName).toBe('Output Field');
    expect(def('lightning-messages').displayName).toBe('Messages');
  });

  it('registers lightning-messages as a leaf with no invented attributes', () => {
    const messages = def('lightning-messages');
    expect(messages.composition.acceptsChildren).toBe(false);
    expect(messages.composition.allowAtRoot).toBe(false);
    expect(messages.composition.allowedParents).toEqual(['lightning-record-edit-form']);
    expect(messages.composition.allowedParentsWithAncestor).toBeUndefined();
    expect(messages.defaultAttributes).toEqual({});
    expect(messages.properties).toEqual([]);
    expect(messages.canvas).toEqual({ kind: 'leaf', previewKind: 'messages' });
    expect(messages.styleCapabilities?.spacing?.margin).toBe(true);
  });
});

describe('Salesforce record form composition', () => {
  it('allows input-field inside record-edit-form and rejects it at root, layout, and view-form', () => {
    expect(canDrop('lightning-input-field', 'lightning-record-edit-form', 'default')).toBe(true);
    expect(canDropAtRoot('lightning-input-field')).toBe(false);
    expect(canDrop('lightning-input-field', 'lightning-layout', 'default')).toBe(false);
    expect(canDrop('lightning-input-field', 'lightning-layout-item', 'default')).toBe(false);
    expect(canDrop('lightning-input-field', 'lightning-record-view-form', 'default')).toBe(false);
    expect(canDrop('lightning-input-field', 'lightning-card', 'default')).toBe(false);
  });

  it('allows output-field inside record-view-form and record-edit-form, not at root or in layout', () => {
    expect(canDrop('lightning-output-field', 'lightning-record-view-form', 'default')).toBe(true);
    expect(canDrop('lightning-output-field', 'lightning-record-edit-form', 'default')).toBe(true);
    expect(canDropAtRoot('lightning-output-field')).toBe(false);
    expect(canDrop('lightning-output-field', 'lightning-layout', 'default')).toBe(false);
    expect(canDrop('lightning-output-field', 'lightning-layout-item', 'default')).toBe(false);
  });

  it('rejects nested and crossed record forms', () => {
    expect(canDrop('lightning-record-edit-form', 'lightning-record-edit-form', 'default')).toBe(
      false
    );
    expect(canDrop('lightning-record-view-form', 'lightning-record-view-form', 'default')).toBe(
      false
    );
    expect(canDrop('lightning-record-edit-form', 'lightning-record-view-form', 'default')).toBe(
      false
    );
    expect(canDrop('lightning-record-view-form', 'lightning-record-edit-form', 'default')).toBe(
      false
    );
  });

  it('allows record forms at root and supported siblings in an edit form', () => {
    expect(canDropAtRoot('lightning-record-edit-form')).toBe(true);
    expect(canDropAtRoot('lightning-record-view-form')).toBe(true);
    expect(canDrop('lightning-button', 'lightning-record-edit-form', 'default')).toBe(true);
    expect(canDrop('lightning-input', 'lightning-record-edit-form', 'default')).toBe(true);
    expect(canDrop('lightning-layout', 'lightning-record-edit-form', 'default')).toBe(true);
    expect(canDrop('lightning-layout', 'lightning-record-view-form', 'default')).toBe(true);
    expect(canDrop('lightning-layout-item', 'lightning-record-edit-form', 'default')).toBe(false);
  });

  it('allows lightning-messages only as a direct child of record-edit-form', () => {
    expect(canDrop('lightning-messages', 'lightning-record-edit-form', 'default')).toBe(true);
    expect(canDropAtRoot('lightning-messages')).toBe(false);
    expect(canDrop('lightning-messages', 'lightning-record-view-form', 'default')).toBe(false);
    expect(canDrop('lightning-messages', 'lightning-layout', 'default')).toBe(false);
    expect(canDrop('lightning-messages', 'lightning-layout-item', 'default')).toBe(false);
    expect(canDrop('lightning-messages', 'lightning-card', 'default')).toBe(false);
    expect(canDrop('lightning-messages', 'lightning-input-field', 'default')).toBe(false);
    expect(
      canDrop('lightning-messages', 'lightning-layout-item', 'default', [
        'lightning-layout',
        'lightning-record-edit-form',
      ])
    ).toBe(false);
  });
});

function editFormLayoutTree() {
  const form = createBuilderNode('lightning-record-edit-form');
  const directField = createBuilderNode('lightning-input-field');
  directField.attributes['field-name'] = 'Name';
  const layout = createBuilderNode('lightning-layout');
  const item1 = createBuilderNode('lightning-layout-item');
  const item2 = createBuilderNode('lightning-layout-item');
  const field1 = createBuilderNode('lightning-input-field');
  field1.attributes['field-name'] = 'Phone';
  const field2 = createBuilderNode('lightning-input-field');
  field2.attributes['field-name'] = 'Industry';
  item1.slots.default = [field1];
  item2.slots.default = [field2];
  layout.slots.default = [item1, item2];
  form.slots.default = [directField, layout];
  return { tree: [form], form, layout, item1, item2, directField, field1, field2 };
}

function viewFormLayoutTree() {
  const form = createBuilderNode('lightning-record-view-form');
  const directField = createBuilderNode('lightning-output-field');
  directField.attributes['field-name'] = 'Name';
  const layout = createBuilderNode('lightning-layout');
  const item1 = createBuilderNode('lightning-layout-item');
  const item2 = createBuilderNode('lightning-layout-item');
  const field1 = createBuilderNode('lightning-output-field');
  field1.attributes['field-name'] = 'Phone';
  const field2 = createBuilderNode('lightning-output-field');
  field2.attributes['field-name'] = 'Industry';
  item1.slots.default = [field1];
  item2.slots.default = [field2];
  layout.slots.default = [item1, item2];
  form.slots.default = [directField, layout];
  return { tree: [form], form, layout, item1, item2, directField, field1, field2 };
}

describe('Salesforce form fields through layout containers', () => {
  it('allows input-field in layout-item only when a record-edit-form ancestor exists', () => {
    const { tree, form, layout, item1 } = editFormLayoutTree();
    expect(canDropOnNode('lightning-input-field', tree, form.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-input-field', tree, item1.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-input-field', tree, layout.id, 'default')).toBe(false);

    const orphanLayout = createBuilderNode('lightning-layout');
    const orphanItem = createBuilderNode('lightning-layout-item');
    orphanLayout.slots.default = [orphanItem];
    expect(canDropOnNode('lightning-input-field', [orphanLayout], orphanItem.id, 'default')).toBe(
      false
    );
    expect(
      canDrop('lightning-input-field', 'lightning-layout-item', 'default', [
        'lightning-layout',
      ])
    ).toBe(false);
    expect(
      canDrop('lightning-input-field', 'lightning-layout-item', 'default', [
        'lightning-layout',
        'lightning-record-edit-form',
      ])
    ).toBe(true);
  });

  it('allows output-field in layout-item under view-form and edit-form', () => {
    const view = viewFormLayoutTree();
    expect(canDropOnNode('lightning-output-field', view.tree, view.form.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-output-field', view.tree, view.item1.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-output-field', view.tree, view.layout.id, 'default')).toBe(
      false
    );

    const edit = editFormLayoutTree();
    expect(canDropOnNode('lightning-output-field', edit.tree, edit.item1.id, 'default')).toBe(true);

    const orphanLayout = createBuilderNode('lightning-layout');
    const orphanItem = createBuilderNode('lightning-layout-item');
    orphanLayout.slots.default = [orphanItem];
    expect(canDropOnNode('lightning-output-field', [orphanLayout], orphanItem.id, 'default')).toBe(
      false
    );
  });

  it('allows nested layout-item → layout under a record form and still accepts fields', () => {
    const form = createBuilderNode('lightning-record-edit-form');
    const outerLayout = createBuilderNode('lightning-layout');
    const outerItem = createBuilderNode('lightning-layout-item');
    const innerLayout = createBuilderNode('lightning-layout');
    const innerItem = createBuilderNode('lightning-layout-item');
    outerItem.slots.default = [innerLayout];
    outerLayout.slots.default = [outerItem];
    innerLayout.slots.default = [innerItem];
    form.slots.default = [outerLayout];
    const tree = [form];

    expect(canDropOnNode('lightning-layout', tree, outerItem.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-layout-item', tree, innerLayout.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-input-field', tree, innerItem.id, 'default')).toBe(true);
  });

  it('does not change card header/body/footer composition', () => {
    expect(canDrop('lightning-formatted-text', 'lightning-card', 'title')).toBe(true);
    expect(canDrop('lightning-button', 'lightning-card', 'actions')).toBe(true);
    expect(canDrop('lightning-badge', 'lightning-card', 'default')).toBe(true);
    expect(canDrop('lightning-button', 'lightning-card', 'footer')).toBe(true);
    expect(canDrop('lightning-input-field', 'lightning-card', 'default')).toBe(false);
    expect(canDrop('lightning-output-field', 'lightning-card', 'title')).toBe(false);
    expect(canDrop('lightning-layout-item', 'lightning-card', 'default')).toBe(false);

    const card = createBuilderNode('lightning-card');
    const form = createBuilderNode('lightning-record-edit-form');
    form.slots.default = [card];
    expect(canDropOnNode('lightning-input-field', [form], card.id, 'default')).toBe(false);
  });

  it('exports nested edit-form → layout → layout-item → input-field markup', () => {
    const { tree, form } = editFormLayoutTree();
    form.attributes['object-api-name'] = 'Account';
    const { html } = generateLwcHtml(tree);
    expect(html).toContain('<lightning-record-edit-form');
    expect(html).toContain('<lightning-layout');
    expect(html).toContain('<lightning-layout-item');
    expect(html).toContain('field-name="Name"');
    expect(html).toContain('field-name="Phone"');
    expect(html).toContain('field-name="Industry"');
    expect(html.indexOf('<lightning-record-edit-form')).toBeLessThan(html.indexOf('<lightning-layout'));
    expect(html.indexOf('<lightning-layout')).toBeLessThan(html.indexOf('<lightning-layout-item'));
    expect(html.indexOf('<lightning-layout-item')).toBeLessThan(
      html.indexOf('field-name="Phone"')
    );
  });

  it('exports nested view-form → layout → layout-item → output-field markup', () => {
    const { tree, form } = viewFormLayoutTree();
    form.attributes['object-api-name'] = 'Account';
    const { html } = generateLwcHtml(tree);
    expect(html).toContain('<lightning-record-view-form');
    expect(html).toContain('<lightning-layout');
    expect(html).toContain('<lightning-layout-item');
    expect(html).toContain('<lightning-output-field');
    expect(html).toContain('field-name="Phone"');
    expect(html.indexOf('<lightning-record-view-form')).toBeLessThan(html.indexOf('<lightning-layout'));
    expect(html.indexOf('<lightning-layout-item')).toBeLessThan(
      html.indexOf('field-name="Phone"')
    );
  });
});

describe('Salesforce record form properties', () => {
  it('exposes documented edit-form attributes and events, not invented columns', () => {
    const names = namesOf('lightning-record-edit-form');
    expect(names).toEqual(
      expect.arrayContaining([
        'object-api-name',
        'record-id',
        'density',
        'record-type-id',
        'form-class',
        'class',
        'optional-fields',
        'onsubmit',
        'onsuccess',
        'onerror',
        'onload',
      ])
    );
    expect(names).not.toContain('columns');
    expect(names).not.toContain('field-names');
    expect(names).not.toContain('layout-type');
    expect(def('lightning-record-edit-form').defaultAttributes.density).toBe('auto');
    expect(def('lightning-record-edit-form').defaultAttributes['object-api-name']).toBeUndefined();
    expect(def('lightning-record-edit-form').defaultAttributes['record-id']).toBeUndefined();
  });

  it('exposes input-field attributes without lightning-input-only properties', () => {
    const names = namesOf('lightning-input-field');
    expect(names).toEqual(
      expect.arrayContaining([
        'field-name',
        'value',
        'required',
        'disabled',
        'read-only',
        'variant',
        'class',
        'aria-invalid',
        'autocomplete',
        'onchange',
      ])
    );
    expect(names).not.toContain('type');
    expect(names).not.toContain('options');
    expect(names).not.toContain('min');
    expect(names).not.toContain('max');
    expect(names).not.toContain('step');
    expect(names).not.toContain('readonly');
    expect(names).not.toContain('label');
    expect(visibleProperties(def('lightning-input-field'), {}).map((item) => item.name)).not.toContain(
      'type'
    );
  });

  it('exposes view-form attributes and only the documented load event', () => {
    const names = namesOf('lightning-record-view-form');
    expect(names).toEqual(
      expect.arrayContaining([
        'object-api-name',
        'record-id',
        'density',
        'class',
        'optional-fields',
        'onload',
      ])
    );
    expect(names).not.toContain('onsubmit');
    expect(names).not.toContain('onsuccess');
    expect(names).not.toContain('onerror');
    expect(names).not.toContain('record-type-id');
    expect(names).not.toContain('form-class');
    expect(def('lightning-record-view-form').defaultAttributes.density).toBe('auto');
  });

  it('exposes output-field attributes without editable input properties', () => {
    const names = namesOf('lightning-output-field');
    expect(names).toEqual(expect.arrayContaining(['field-name', 'variant', 'field-class', 'class']));
    expect(names).not.toContain('value');
    expect(names).not.toContain('required');
    expect(names).not.toContain('disabled');
    expect(names).not.toContain('read-only');
    expect(names).not.toContain('type');
    const variant = def('lightning-output-field').properties.find((item) => item.name === 'variant');
    expect(variant?.options?.map((option) => option.value)).toEqual(['standard', 'label-hidden']);
  });
});

describe('Salesforce record form HTML export', () => {
  it('exports configured edit-form markup without preview-only values', () => {
    const form = createBuilderNode('lightning-record-edit-form');
    form.attributes['object-api-name'] = 'Account';
    form.attributes['record-id'] = 'recordId';
    form.attributes.onsuccess = 'handleSuccess';
    const nameField = createBuilderNode('lightning-input-field');
    nameField.attributes['field-name'] = 'Name';
    const phoneField = createBuilderNode('lightning-input-field');
    phoneField.attributes['field-name'] = 'Phone';
    const save = createBuilderNode('lightning-button');
    save.attributes.type = 'submit';
    save.attributes.label = 'Save';
    form.slots.default = [nameField, phoneField, save];

    const { html } = generateLwcHtml([form]);
    expect(html).toContain('<lightning-record-edit-form');
    expect(html).toContain('object-api-name="Account"');
    expect(html).toContain('record-id={recordId}');
    expect(html).toContain('onsuccess={handleSuccess}');
    expect(html).toContain('<lightning-input-field');
    expect(html).toContain('field-name="Name"');
    expect(html).toContain('field-name="Phone"');
    expect(html).toContain('type="submit"');
    expect(html).not.toContain('Acme Corporation');
    expect(html).not.toContain('+1 (555) 123-4567');
    expect(html).not.toContain('object-api-name={Account}');
    expect(html).not.toContain('previewLabel');
  });

  it('omits record-id when it is not configured', () => {
    const form = createBuilderNode('lightning-record-edit-form');
    form.attributes['object-api-name'] = 'Account';
    const { html } = generateLwcHtml([form]);
    expect(html).toContain('object-api-name="Account"');
    expect(html).not.toContain('record-id');
  });

  it('exports view-form and output-field without sample values', () => {
    const form = createBuilderNode('lightning-record-view-form');
    form.attributes['object-api-name'] = 'Account';
    form.attributes['record-id'] = 'recordId';
    const nameField = createBuilderNode('lightning-output-field');
    nameField.attributes['field-name'] = 'Name';
    const phoneField = createBuilderNode('lightning-output-field');
    phoneField.attributes['field-name'] = 'Phone';
    form.slots.default = [nameField, phoneField];

    const { html } = generateLwcHtml([form]);
    expect(html).toContain('<lightning-record-view-form');
    expect(html).toContain('object-api-name="Account"');
    expect(html).toContain('record-id={recordId}');
    expect(html).toContain('<lightning-output-field');
    expect(html).toContain('field-name="Name"');
    expect(html).toContain('field-name="Phone"');
    expect(html).not.toContain('Acme Corporation');
    expect(html).not.toContain('Sample value');
  });
});

describe('Salesforce record form JS export', () => {
  it('generates recordId and handlers without @api, Apex, or LDS imports', () => {
    const form = createBuilderNode('lightning-record-edit-form');
    form.attributes['object-api-name'] = 'Account';
    form.attributes['record-id'] = 'recordId';
    form.attributes.onsuccess = 'handleSuccess';
    form.attributes.onsubmit = 'handleSubmit';
    form.slots.default = [createBuilderNode('lightning-input-field')];

    const result = generateLwcBundle([form]);
    expect(result.errors).toEqual([]);
    expect(result.files.js).toContain('import { LightningElement } from "lwc";');
    expect(result.files.js).toContain('recordId = "";');
    expect(result.files.js).toContain('handleSuccess(event) {}');
    expect(result.files.js).toContain('handleSubmit(event) {}');
    expect(result.files.js).not.toContain('@api');
    expect(result.files.js).not.toContain('@salesforce/schema');
    expect(result.files.js).not.toContain('lightning/uiRecordApi');
    expect(result.files.js).not.toContain('Apex');
    expect(result.files.html).toContain('<template>');
  });
});

describe('Salesforce record form spacing', () => {
  it('maps existing spacing onto exported class names for forms, fields, messages, and layout', () => {
    const form = createBuilderNode('lightning-record-edit-form');
    form.attributes['object-api-name'] = 'Account';
    form.spacing = { margin: { around: 'small' } };
    const messages = createBuilderNode('lightning-messages');
    messages.spacing = { margin: { bottom: 'small' } };
    const layout = createBuilderNode('lightning-layout');
    layout.spacing = { margin: { top: 'x-small' } };
    const item = createBuilderNode('lightning-layout-item');
    item.spacing = { margin: { around: 'xx-small' } };
    const field = createBuilderNode('lightning-input-field');
    field.spacing = { margin: { top: 'medium' } };
    const output = createBuilderNode('lightning-output-field');
    output.spacing = { margin: { bottom: 'large' } };
    item.slots.default = [field];
    layout.slots.default = [item];
    form.slots.default = [messages, layout, output];

    const { html } = generateLwcHtml([form]);
    expect(html).toContain('slds-m-around_small');
    expect(html).toContain('slds-m-bottom_small');
    expect(html).toContain('slds-m-top_x-small');
    expect(html).toContain('slds-m-around_xx-small');
    expect(html).toContain('slds-m-top_medium');
    expect(html).toContain('slds-m-bottom_large');
    expect(def('lightning-record-edit-form').styleCapabilities?.spacing?.margin).toBe(true);
    expect(def('lightning-input-field').styleCapabilities?.spacing?.margin).toBe(true);
    expect(def('lightning-output-field').styleCapabilities?.spacing?.margin).toBe(true);
    expect(def('lightning-messages').styleCapabilities?.spacing?.margin).toBe(true);
    expect(def('lightning-layout').styleCapabilities?.spacing?.margin).toBe(true);
    expect(def('lightning-layout-item').styleCapabilities?.spacing?.margin).toBe(true);
    expect(def('lightning-record-view-form').styleCapabilities?.spacing?.padding).toBe(false);
  });
});

describe('Salesforce record form createBuilderNode', () => {
  it('initializes slots and defaults without exporting sample rows', () => {
    const form = createBuilderNode('lightning-record-edit-form') as BuilderNode;
    expect(form.slots.default).toEqual([]);
    expect(form.attributes.density).toBe('auto');
    const field = createBuilderNode('lightning-input-field');
    expect(field.attributes['field-name']).toBe('Name');
    expect(field.slots).toEqual({});
    const messages = createBuilderNode('lightning-messages');
    expect(messages.attributes).toEqual({});
    expect(messages.slots).toEqual({});
  });
});

describe('Salesforce record form valid structures', () => {
  it('A: allows edit-form → input-field', () => {
    expect(canDrop('lightning-input-field', 'lightning-record-edit-form', 'default')).toBe(true);
  });

  it('B: allows edit-form → layout → two layout-items → input-fields', () => {
    const { tree, item1, item2 } = editFormLayoutTree();
    expect(canDropOnNode('lightning-input-field', tree, item1.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-input-field', tree, item2.id, 'default')).toBe(true);
  });

  it('C: allows edit-form → messages + input-field + existing lightning-button', () => {
    const form = createBuilderNode('lightning-record-edit-form');
    const messages = createBuilderNode('lightning-messages');
    const field = createBuilderNode('lightning-input-field');
    const save = createBuilderNode('lightning-button');
    save.attributes.type = 'submit';
    save.attributes.label = 'Save';
    form.slots.default = [messages, field, save];
    const tree = [form];

    expect(canDropOnNode('lightning-messages', tree, form.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-input-field', tree, form.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-button', tree, form.id, 'default')).toBe(true);
    expect(save.type).toBe('lightning-button');

    form.attributes['object-api-name'] = 'Account';
    const { html } = generateLwcHtml(tree);
    expect(html).toContain('<lightning-messages>');
    expect(html).toContain('</lightning-messages>');
    expect(html).toContain('<lightning-input-field');
    expect(html).toContain('<lightning-button');
    expect(html.indexOf('<lightning-messages>')).toBeLessThan(html.indexOf('<lightning-input-field'));
    expect(html.indexOf('<lightning-input-field')).toBeLessThan(html.indexOf('<lightning-button'));
  });

  it('D: allows two input-fields inside one layout-item', () => {
    const form = createBuilderNode('lightning-record-edit-form');
    const layout = createBuilderNode('lightning-layout');
    const item = createBuilderNode('lightning-layout-item');
    const nameField = createBuilderNode('lightning-input-field');
    nameField.attributes['field-name'] = 'Name';
    const phoneField = createBuilderNode('lightning-input-field');
    phoneField.attributes['field-name'] = 'Phone';
    item.slots.default = [nameField, phoneField];
    layout.slots.default = [item];
    form.slots.default = [layout];
    const tree = [form];

    expect(canDropOnNode('lightning-input-field', tree, item.id, 'default')).toBe(true);
    expect(item.slots.default).toHaveLength(2);

    const { html } = generateLwcHtml(tree);
    const itemOpen = html.indexOf('<lightning-layout-item');
    const nameIndex = html.indexOf('field-name="Name"');
    const phoneIndex = html.indexOf('field-name="Phone"');
    expect(itemOpen).toBeGreaterThan(-1);
    expect(nameIndex).toBeGreaterThan(itemOpen);
    expect(phoneIndex).toBeGreaterThan(nameIndex);
  });

  it('E: allows view-form → output-field', () => {
    expect(canDrop('lightning-output-field', 'lightning-record-view-form', 'default')).toBe(true);
  });

  it('F: allows view-form → layout → two layout-items → output-fields', () => {
    const { tree, item1, item2 } = viewFormLayoutTree();
    expect(canDropOnNode('lightning-output-field', tree, item1.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-output-field', tree, item2.id, 'default')).toBe(true);
  });

  it('G: allows nested layout → layout-item → layout → layout-item → field', () => {
    const form = createBuilderNode('lightning-record-view-form');
    const outerLayout = createBuilderNode('lightning-layout');
    const outerItem = createBuilderNode('lightning-layout-item');
    const innerLayout = createBuilderNode('lightning-layout');
    const innerItem = createBuilderNode('lightning-layout-item');
    outerItem.slots.default = [innerLayout];
    outerLayout.slots.default = [outerItem];
    innerLayout.slots.default = [innerItem];
    form.slots.default = [outerLayout];
    const tree = [form];

    expect(canDropOnNode('lightning-output-field', tree, innerItem.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-input-field', tree, innerItem.id, 'default')).toBe(false);
  });
});

describe('Salesforce record form invalid composition', () => {
  it('rejects fields at root and outside a valid record-form context', () => {
    expect(canDropAtRoot('lightning-input-field')).toBe(false);
    expect(canDropAtRoot('lightning-output-field')).toBe(false);
    expect(canDrop('lightning-input-field', 'lightning-card', 'default')).toBe(false);
    expect(canDrop('lightning-output-field', 'lightning-card', 'default')).toBe(false);
    expect(canDrop('lightning-input-field', 'lightning-record-view-form', 'default')).toBe(false);
    expect(
      canDrop('lightning-input-field', 'lightning-layout-item', 'default', [
        'lightning-layout',
        'lightning-record-view-form',
      ])
    ).toBe(false);
    expect(
      canDrop('lightning-output-field', 'lightning-layout-item', 'default', ['lightning-layout'])
    ).toBe(false);
  });
});

describe('Salesforce record form design-time preview', () => {
  it('uses static placeholders rather than live Salesforce data', () => {
    expect(designTimeFieldLabel('Name')).toBe('Name');
    expect(designTimeFieldLabel('My_Field__c')).toBe('My Field');
    expect(designTimeFieldSample('Name')).toBe('Acme Corporation');
    expect(designTimeFieldSample('Phone')).toBe('+1 (555) 123-4567');
    expect(designTimeFieldSample('Email')).toBe('example@example.com');
    expect(designTimeFieldSample('Birthdate')).toBe('Jan 15, 2024');
    expect(designTimeFieldSample('CloseDate')).toBe('Jan 15, 2024');
    expect(designTimeFieldSample('Custom__c')).toBe('Sample value');
  });

  it('infers input control kinds only from field-name heuristics', () => {
    expect(designTimeInputKind('Name')).toBe('text');
    expect(designTimeInputKind('Email')).toBe('text');
    expect(designTimeInputKind('Phone')).toBe('text');
    expect(designTimeInputKind('Amount')).toBe('number');
    expect(designTimeInputKind('AnnualRevenue')).toBe('number');
    expect(designTimeInputKind('Custom_Number__c')).toBe('number');
    expect(designTimeInputKind('Birthdate')).toBe('date');
    expect(designTimeInputKind('CloseDate')).toBe('date');
    expect(designTimeInputKind('IsActive')).toBe('checkbox');
    expect(designTimeInputKind('HasOptedOutOfEmail')).toBe('checkbox');
    expect(designTimeInputKind('Industry')).toBe('picklist');
    expect(designTimeInputKind('StageName')).toBe('picklist');
    expect(designTimeInputKind('Unknown_Field__c')).toBe('text');
  });
});

describe('Salesforce record form responsive layout', () => {
  it('uses the existing 12-column system so size 6 is half width', () => {
    const item = createBuilderNode('lightning-layout-item');
    item.attributes.size = 6;
    const layoutItemDef = def('lightning-layout-item');
    const style = getLayoutItemStyle(item, layoutItemDef, 'small');
    expect(style.width).toBe('50%');
    expect(style.flexBasis).toBe('50%');
    expect(style.maxWidth).toBe('50%');
  });

  it('exports form → layout → size 6 items with multiple-rows and no form-specific layout classes', () => {
    const form = createBuilderNode('lightning-record-edit-form');
    form.attributes['object-api-name'] = 'Account';
    const layout = createBuilderNode('lightning-layout');
    layout.attributes['multiple-rows'] = true;
    const left = createBuilderNode('lightning-layout-item');
    left.attributes.size = 6;
    const right = createBuilderNode('lightning-layout-item');
    right.attributes.size = 6;
    const nameField = createBuilderNode('lightning-input-field');
    nameField.attributes['field-name'] = 'Name';
    const phoneField = createBuilderNode('lightning-input-field');
    phoneField.attributes['field-name'] = 'Phone';
    left.slots.default = [nameField];
    right.slots.default = [phoneField];
    layout.slots.default = [left, right];
    form.slots.default = [layout];

    const { html } = generateLwcHtml([form]);
    expect(html).toContain('<lightning-layout');
    expect(html).toContain('multiple-rows');
    expect(html).toContain('size="6"');
    expect(html.match(/size="6"/g)?.length).toBe(2);
    expect(html).not.toContain('form-col');
    expect(html).not.toContain('record-form-grid');
  });
});

describe('Salesforce record form HTML export with messages', () => {
  it('exports Salesforce markup for messages, layout, and fields without builder leaks', () => {
    const form = createBuilderNode('lightning-record-edit-form');
    form.attributes['object-api-name'] = 'Account';
    form.attributes['record-id'] = 'recordId';
    const messages = createBuilderNode('lightning-messages');
    const layout = createBuilderNode('lightning-layout');
    layout.attributes['multiple-rows'] = true;
    const item = createBuilderNode('lightning-layout-item');
    item.attributes.size = 6;
    const field = createBuilderNode('lightning-input-field');
    field.attributes['field-name'] = 'Name';
    item.slots.default = [field];
    layout.slots.default = [item];
    form.slots.default = [messages, layout];

    const bundle = generateLwcBundle([form]);
    const { html } = bundle.files;

    expect(html).toContain('<lightning-record-edit-form');
    expect(html).toContain('object-api-name="Account"');
    expect(html).toContain('record-id={recordId}');
    expect(html).toContain('<lightning-messages>');
    expect(html).toContain('</lightning-messages>');
    expect(html).toContain('<lightning-layout');
    expect(html).toContain('multiple-rows');
    expect(html).toContain('size="6"');
    expect(html).toContain('field-name="Name"');
    expect(html).not.toContain('Form messages');
    expect(html).not.toContain('Acme Corporation');
    expect(html).not.toContain('example@example.com');
    expect(html).not.toContain('Sample date');
    expect(html).not.toContain('Select…');
    expect(html).not.toContain('lcKey');
    expect(html).not.toMatch(/dnd-kit/i);
    expect(html).not.toContain(form.id);
    expect(html).not.toContain(messages.id);
    expect(html).not.toContain(field.id);
    expect(html).not.toContain('object-api-name={Account}');
    expect(bundle.files.js).toContain('recordId = "";');
    expect(bundle.files.js).not.toContain('@api');
    expect(bundle.files.js).not.toContain('@salesforce/schema');
    expect(bundle.files.js).not.toContain('lightning/uiRecordApi');
    expect(bundle.files.js).not.toContain('Apex');
  });
});

