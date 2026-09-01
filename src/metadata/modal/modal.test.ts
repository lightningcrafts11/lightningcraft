import { describe, expect, it } from 'vitest';
import {
  canDrop,
  canDropAtRoot,
  canDropOnNode,
  createBuilderNode,
  getComponentDefinition,
  getComponentsByCategory,
} from '@/metadata';
import { generateLwcBundle, generateLwcHtml, generateLwcZip } from '@/generator';
import { slotAcceptsChildren, slotFallbackPrimary } from '@/renderer/slotPreview';
import type { BuilderNode } from '@/types/builder';

function def(type: string) {
  const found = getComponentDefinition(type);
  expect(found).toBeDefined();
  return found!;
}

function modalTree() {
  const modal = createBuilderNode('LightningModal');
  const text = createBuilderNode('lightning-formatted-text');
  text.attributes.value = 'Confirm this change';
  const input = createBuilderNode('lightning-input');
  input.attributes.label = 'Account Name';
  const save = createBuilderNode('lightning-button');
  save.attributes.label = 'Save';
  modal.slots.default = [text, input];
  modal.slots.footer = [save];
  return { tree: [modal], modal, text, input, save };
}

describe('LightningModal registration', () => {
  it('registers LightningModal as a Layout component without a lightning-modal tag', () => {
    const modal = def('LightningModal');
    expect(modal.salesforceName).toBe('LightningModal');
    expect(modal.displayName).toBe('Lightning Modal');
    expect(modal.category).toBe('Layout');
    expect(modal.output.tagName).toBe('');
    expect(modal.output.unwrap).toBe(true);
    expect(modal.jsClass?.extends).toEqual({
      name: 'LightningModal',
      module: 'lightning/modal',
      importKind: 'default',
    });
    expect(modal.composition.nestedAuthoring).toBe(true);
    expect(modal.composition.rootOnly).not.toBe(true);
    expect(getComponentsByCategory('Layout').map((item) => item.type)).toContain('LightningModal');
  });

  it('maps Salesforce helper tags onto header, body, and footer slots', () => {
    const slots = def('LightningModal').composition.slots ?? [];
    expect(slots.map((slot) => slot.name)).toEqual(['header', 'default', 'footer']);
    expect(slots[0]?.wrapperTag).toBe('lightning-modal-header');
    expect(slots[0]?.wrapperAttributes).toEqual(['label']);
    expect(slots[0]?.wrapperTextProperty).toBe('tagline');
    expect(slots[0]?.allowedTypes).toEqual([]);
    expect(slotAcceptsChildren(slots[0]!)).toBe(false);
    expect(slots[1]?.wrapperTag).toBe('lightning-modal-body');
    expect(slots[1]?.emitWrapperWhenEmpty).toBe(true);
    expect(slots[2]?.wrapperTag).toBe('lightning-modal-footer');
  });

  it('exposes header label and tagline, not .open() options as HTML attributes', () => {
    const names = def('LightningModal').properties.map((property) => property.name);
    expect(names).toEqual(['label', 'tagline']);
    expect(names).not.toContain('size');
    expect(names).not.toContain('description');
    expect(names).not.toContain('disableClose');
    expect(names).not.toContain('disable-close');
    expect(def('LightningModal').defaultAttributes.label).toBe('Modal');
  });
});

describe('LightningModal composition', () => {
  it('allows LightningModal at the canvas root and in general-content slots', () => {
    expect(canDropAtRoot('LightningModal')).toBe(true);
    expect(canDrop('LightningModal', 'lightning-card', 'default')).toBe(true);
    expect(canDrop('LightningModal', 'lightning-layout-item', 'default')).toBe(true);
    expect(canDrop('LightningModal', 'lightning-record-edit-form', 'default')).toBe(true);
    expect(canDrop('LightningModal', 'lightning-layout', 'default')).toBe(false);
    expect(canDrop('LightningModal', 'LightningModal', 'default')).toBe(false);
    const modal = createBuilderNode('LightningModal');
    expect(canDropOnNode('LightningModal', [modal], modal.id, 'default')).toBe(false);
  });

  it('allows Card → Body → LightningModal and rejects title, actions, and footer', () => {
    const card = createBuilderNode('lightning-card');
    expect(canDrop('LightningModal', 'lightning-card', 'default')).toBe(true);
    expect(canDropOnNode('LightningModal', [card], card.id, 'default')).toBe(true);
    expect(canDrop('LightningModal', 'lightning-card', 'title')).toBe(false);
    expect(canDrop('LightningModal', 'lightning-card', 'actions')).toBe(false);
    expect(canDrop('LightningModal', 'lightning-card', 'footer')).toBe(false);
    expect(canDropOnNode('LightningModal', [card], card.id, 'title')).toBe(false);
    expect(canDropOnNode('LightningModal', [card], card.id, 'actions')).toBe(false);
    expect(canDropOnNode('LightningModal', [card], card.id, 'footer')).toBe(false);
  });

  it('allows Layout → LayoutItem → LightningModal and rejects layout directly', () => {
    expect(canDrop('LightningModal', 'lightning-layout', 'default')).toBe(false);
    expect(canDrop('LightningModal', 'lightning-layout-item', 'default')).toBe(true);
    const layout = createBuilderNode('lightning-layout');
    const item = createBuilderNode('lightning-layout-item');
    layout.slots.default = [item];
    expect(canDropOnNode('LightningModal', [layout], layout.id, 'default')).toBe(false);
    expect(canDropOnNode('LightningModal', [layout], item.id, 'default')).toBe(true);
  });

  it('allows LightningModal in record-edit-form default content, not record-view-form', () => {
    expect(canDrop('LightningModal', 'lightning-record-edit-form', 'default')).toBe(true);
    expect(canDrop('LightningModal', 'lightning-record-view-form', 'default')).toBe(false);
  });

  it('allows formatted-text, lightning-input, and layout in the body', () => {
    expect(canDrop('lightning-formatted-text', 'LightningModal', 'default')).toBe(true);
    expect(canDrop('lightning-input', 'LightningModal', 'default')).toBe(true);
    expect(canDrop('lightning-button', 'LightningModal', 'default')).toBe(true);
    expect(canDrop('lightning-layout', 'LightningModal', 'default')).toBe(true);
    expect(canDrop('lightning-datatable', 'LightningModal', 'default')).toBe(true);
    expect(canDrop('lightning-record-edit-form', 'LightningModal', 'default')).toBe(true);
  });

  it('rejects layout-item, header drops, and non-action footer children', () => {
    expect(canDrop('lightning-layout-item', 'LightningModal', 'default')).toBe(false);
    expect(canDrop('lightning-input', 'LightningModal', 'header')).toBe(false);
    expect(canDrop('lightning-button', 'LightningModal', 'header')).toBe(false);
    expect(canDrop('lightning-formatted-text', 'LightningModal', 'header')).toBe(false);
    expect(canDrop('lightning-button', 'LightningModal', 'footer')).toBe(true);
    expect(canDrop('lightning-button-icon', 'LightningModal', 'footer')).toBe(true);
    expect(canDrop('lightning-input', 'LightningModal', 'footer')).toBe(false);
    expect(canDrop('lightning-layout', 'LightningModal', 'footer')).toBe(false);
  });

  it('allows layout → layout-item → lightning-input inside the modal body', () => {
    const modal = createBuilderNode('LightningModal');
    const layout = createBuilderNode('lightning-layout');
    const item1 = createBuilderNode('lightning-layout-item');
    const item2 = createBuilderNode('lightning-layout-item');
    layout.slots.default = [item1, item2];
    modal.slots.default = [layout];
    const tree = [modal];

    expect(canDropOnNode('lightning-layout', tree, modal.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-layout-item', tree, layout.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-input', tree, item1.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-input', tree, item2.id, 'default')).toBe(true);
    expect(canDropOnNode('lightning-layout-item', tree, modal.id, 'default')).toBe(false);
  });
});

describe('LightningModal does not change existing composition', () => {
  it('keeps card header/body/footer/actions unchanged', () => {
    expect(canDrop('lightning-formatted-text', 'lightning-card', 'title')).toBe(true);
    expect(canDrop('lightning-button', 'lightning-card', 'actions')).toBe(true);
    expect(canDrop('lightning-badge', 'lightning-card', 'default')).toBe(true);
    expect(canDrop('lightning-button', 'lightning-card', 'footer')).toBe(true);
    expect(canDrop('lightning-layout-item', 'lightning-card', 'default')).toBe(false);
    expect(canDrop('LightningModal', 'lightning-card', 'title')).toBe(false);
    expect(canDrop('LightningModal', 'lightning-card', 'footer')).toBe(false);
    expect(canDrop('LightningModal', 'lightning-card', 'default')).toBe(true);
  });

  it('keeps record-form field rules unchanged', () => {
    expect(canDrop('lightning-input-field', 'lightning-record-edit-form', 'default')).toBe(true);
    expect(canDrop('lightning-output-field', 'lightning-record-view-form', 'default')).toBe(true);
    expect(canDropAtRoot('lightning-input-field')).toBe(false);
    expect(canDrop('lightning-input-field', 'LightningModal', 'default')).toBe(false);
    expect(canDrop('lightning-messages', 'lightning-record-edit-form', 'default')).toBe(true);
    expect(canDrop('lightning-messages', 'LightningModal', 'default')).toBe(false);
  });

  it('keeps datatable and layout-item rules unchanged', () => {
    expect(canDropAtRoot('lightning-datatable')).toBe(true);
    expect(canDrop('lightning-layout-item', 'lightning-layout', 'default')).toBe(true);
    expect(canDropAtRoot('lightning-layout-item')).toBe(false);
    expect(canDrop('lightning-input', 'lightning-layout-item', 'default')).toBe(true);
  });
});

describe('LightningModal HTML export', () => {
  it('exports helper tags and never a lightning-modal host', () => {
    const { tree, modal, save } = modalTree();
    modal.attributes.label = 'My Modal Heading';
    modal.attributes.tagline = 'Optional tagline';
    const { html } = generateLwcHtml(tree);

    expect(html).toContain('<lightning-modal-header');
    expect(html).toContain('label="My Modal Heading"');
    expect(html).toContain('Optional tagline');
    expect(html).toContain('<lightning-modal-body>');
    expect(html).toContain('<lightning-formatted-text');
    expect(html).toContain('<lightning-input');
    expect(html).toContain('<lightning-modal-footer>');
    expect(html).toContain('<lightning-button');
    expect(html).not.toContain('<lightning-modal>');
    expect(html).not.toContain('</lightning-modal>');
    expect(html).not.toContain('<LightningModal');
    expect(html.indexOf('<lightning-modal-header')).toBeLessThan(html.indexOf('<lightning-modal-body>'));
    expect(html.indexOf('<lightning-modal-body>')).toBeLessThan(html.indexOf('<lightning-modal-footer>'));
    expect(html).not.toContain(modal.id);
    expect(html).not.toContain(save.id);
    expect(html).not.toContain('lcKey');
  });

  it('always emits lightning-modal-body and omits an empty footer', () => {
    const modal = createBuilderNode('LightningModal');
    const { html } = generateLwcHtml([modal]);
    expect(html).toContain('<lightning-modal-header');
    expect(html).toContain('label="Modal"');
    expect(html).toContain('<lightning-modal-body>');
    expect(html).toContain('</lightning-modal-body>');
    expect(html).not.toContain('<lightning-modal-footer');
  });

  it('exports nested layout columns inside lightning-modal-body', () => {
    const modal = createBuilderNode('LightningModal');
    const layout = createBuilderNode('lightning-layout');
    layout.attributes['multiple-rows'] = true;
    const left = createBuilderNode('lightning-layout-item');
    left.attributes.size = 6;
    const right = createBuilderNode('lightning-layout-item');
    right.attributes.size = 6;
    left.slots.default = [createBuilderNode('lightning-input')];
    right.slots.default = [createBuilderNode('lightning-input')];
    layout.slots.default = [left, right];
    modal.slots.default = [layout];

    const { html } = generateLwcHtml([modal]);
    expect(html).toContain('<lightning-modal-body>');
    expect(html).toContain('<lightning-layout');
    expect(html).toContain('multiple-rows');
    expect(html).toContain('size="6"');
    expect(html).toContain('<lightning-input');
    expect(html.indexOf('<lightning-modal-body>')).toBeLessThan(html.indexOf('<lightning-layout'));
  });
});

describe('LightningModal JS export', () => {
  it('extends LightningModal via generic class metadata, without fake open() or close()', () => {
    const { tree } = modalTree();
    const result = generateLwcBundle(tree);
    expect(result.errors).toEqual([]);
    expect(result.files.js).toContain('import LightningModal from "lightning/modal";');
    expect(result.files.js).toContain(
      'export default class LightningCraftComponent extends LightningModal {}'
    );
    expect(result.files.js).not.toContain('LightningElement');
    expect(result.files.js).not.toContain('MyModal.open');
    expect(result.files.js).not.toContain('.open(');
    expect(result.files.js).not.toContain('this.close');
    expect(result.files.js).not.toContain('openModal');
    expect(result.files.html).toContain('<template>');
    expect(result.files.html).not.toContain('<lightning-modal>');
  });

  it('rejects sibling root components because the generated class replaces LightningElement', () => {
    const modal = createBuilderNode('LightningModal');
    const button = createBuilderNode('lightning-button');
    const result = generateLwcBundle([modal, button]);
    expect(result.errors.some((error) => error.message.includes('only root node'))).toBe(true);
  });

  it('rejects a class-defining component nested inside another root', () => {
    const card = createBuilderNode('lightning-card');
    card.slots.default = [createBuilderNode('LightningModal')];
    const result = generateLwcBundle([card]);
    expect(result.errors.some((error) => error.message.includes('Multi-LWC export is not supported'))).toBe(
      true
    );
    expect(result.files.js).toContain('extends LightningElement');
    expect(result.files.js).not.toContain('extends LightningModal');
  });

  it('does not unwrap a nested LightningModal into the parent bundle', () => {
    const card = createBuilderNode('lightning-card');
    const modal = createBuilderNode('LightningModal');
    modal.attributes.label = 'Confirm';
    const bodyText = createBuilderNode('lightning-formatted-text');
    bodyText.attributes.value = 'Card copy';
    card.slots.default = [bodyText, modal];
    const result = generateLwcBundle([card]);

    expect(result.errors.some((error) => error.message.includes('class-owning'))).toBe(true);
    expect(result.errors.some((error) => error.message.includes('Multi-LWC export is not supported'))).toBe(
      true
    );
    expect(result.files.html).toContain('<lightning-card');
    expect(result.files.html).toContain('<lightning-formatted-text');
    expect(result.files.html).toContain('value="Card copy"');
    expect(result.files.html).not.toContain('<lightning-modal>');
    expect(result.files.html).not.toContain('</lightning-modal>');
    expect(result.files.html).not.toContain('<lightning-modal-header');
    expect(result.files.html).not.toContain('<lightning-modal-body');
    expect(result.files.html).not.toContain('<lightning-modal-footer');
    expect(result.files.html).not.toContain('label="Confirm"');
    expect(result.files.js).toContain('extends LightningElement');
    expect(result.files.js).not.toContain('extends LightningModal');
    expect(result.files.js).not.toContain('lightning/modal');
  });

  it('does not unwrap LightningModal nested in a layout-item into the parent bundle', () => {
    const layout = createBuilderNode('lightning-layout');
    const item = createBuilderNode('lightning-layout-item');
    item.slots.default = [createBuilderNode('LightningModal')];
    layout.slots.default = [item];
    const result = generateLwcBundle([layout]);

    expect(result.errors.some((error) => error.message.includes('Multi-LWC export is not supported'))).toBe(
      true
    );
    expect(result.files.html).toContain('<lightning-layout');
    expect(result.files.html).toContain('<lightning-layout-item');
    expect(result.files.html).not.toContain('<lightning-modal>');
    expect(result.files.html).not.toContain('<lightning-modal-header');
    expect(result.files.js).toContain('extends LightningElement');
    expect(result.files.js).not.toContain('extends LightningModal');
  });

  it('refuses to ZIP a Card → Body → Modal tree because multi-LWC export is not supported', async () => {
    const card = createBuilderNode('lightning-card');
    card.slots.default = [createBuilderNode('LightningModal')];
    const bundle = generateLwcBundle([card]);
    expect(bundle.errors.length).toBeGreaterThan(0);
    const zip = await generateLwcZip(bundle, 'myComponent');
    expect(zip.ok).toBe(false);
  });

  it('rejects two LightningModal roots because only one LWC class can be generated', () => {
    const result = generateLwcBundle([
      createBuilderNode('LightningModal'),
      createBuilderNode('LightningModal'),
    ]);
    expect(result.errors.some((error) => error.message.includes('only root node'))).toBe(true);
  });

  it('rejects an unwrapped component placed in a named Salesforce slot without emitting it', () => {
    const card = createBuilderNode('lightning-card');
    const modal = createBuilderNode('LightningModal');
    card.slots.actions = [modal];
    const result = generateLwcBundle([card]);
    expect(result.errors.some((error) => error.message.includes('class-owning'))).toBe(true);
    expect(result.files.html).not.toContain('<lightning-modal-header');
    expect(result.files.html).not.toContain('<lightning-modal>');
    expect(result.files.js).toContain('extends LightningElement');
    expect(result.files.js).not.toContain('extends LightningModal');
  });

  it('still emits existing handler stubs from nested components, without this.close()', () => {
    const modal = createBuilderNode('LightningModal');
    const form = createBuilderNode('lightning-record-edit-form');
    form.attributes['object-api-name'] = 'Account';
    form.attributes.onsuccess = 'handleOkay';
    modal.slots.default = [form];
    const result = generateLwcBundle([modal]);
    expect(result.errors).toEqual([]);
    expect(result.files.js).toContain('extends LightningModal {');
    expect(result.files.js).toContain('handleOkay(event) {}');
    expect(result.files.js).not.toContain('this.close');
    expect(result.files.html).toContain('<lightning-record-edit-form');
  });

  it('does not change LightningElement export for ordinary components', () => {
    const result = generateLwcBundle([createBuilderNode('lightning-button')]);
    expect(result.errors).toEqual([]);
    expect(result.files.js).toContain('import { LightningElement } from "lwc";');
    expect(result.files.js).toContain('extends LightningElement {}');
    expect(result.files.js).not.toContain('lightning/modal');
  });
});

describe('LightningModal design-time preview', () => {
  it('uses the header label as preview text and does not claim runtime LightningModal', () => {
    const modal = createBuilderNode('LightningModal') as BuilderNode;
    const header = def('LightningModal').composition.slots?.find((slot) => slot.name === 'header');
    expect(header).toBeDefined();
    expect(slotFallbackPrimary(modal, header!)).toBe('Modal');
    modal.attributes.label = 'Delete record';
    expect(slotFallbackPrimary(modal, header!)).toBe('Delete record');
    expect(def('LightningModal').canvas.kind).toBe('container');
  });
});
