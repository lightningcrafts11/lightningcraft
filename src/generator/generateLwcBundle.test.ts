import { describe, expect, it } from 'vitest';
import { createBuilderNode } from '@/metadata';
import {
  collectJsPlan,
  generateLwcBundle,
  generateLwcHtml,
  generateLwcMetaXml,
} from '@/generator';
import { DEFAULT_LWC_EXPORT_SETTINGS } from '@/types/lwcExport';
import { stripInternalFields } from '@/generator/stripInternalFields';
import { isValidLwcComponentName, toLwcClassName } from '@/generator/validateLwcName';
import { defaultDatatableRowActions } from '@/metadata/datatable/columns';
import type { BuilderNode } from '@/types/builder';

function bundle(tree: BuilderNode[], settings = DEFAULT_LWC_EXPORT_SETTINGS) {
  return generateLwcBundle(tree, settings);
}

describe('LWC component name validation', () => {
  it('accepts official camelCase names and rejects invalid names', () => {
    expect(isValidLwcComponentName('lightningCraftComponent')).toBe(true);
    expect(isValidLwcComponentName('myComponent')).toBe(true);
    expect(isValidLwcComponentName('another_component')).toBe(true);
    expect(isValidLwcComponentName('MyComponent')).toBe(false);
    expect(isValidLwcComponentName('my-component')).toBe(false);
    expect(isValidLwcComponentName('my__component')).toBe(false);
    expect(isValidLwcComponentName('my_')).toBe(false);
    expect(toLwcClassName('lightningCraftComponent')).toBe('LightningCraftComponent');
    expect(toLwcClassName('another_component')).toBe('AnotherComponent');
  });
});

describe('generateLwcBundle', () => {
  it('returns a generation error for an empty canvas', () => {
    const result = bundle([]);
    expect(result.errors.some((error) => error.message.includes('empty'))).toBe(true);
    expect(result.files.html).toBe('');
    expect(result.files.js).toBe('');
    expect(result.files.metaXml).toBe('');
  });

  it('generates a valid three-file bundle for a simple button', () => {
    const result = bundle([createBuilderNode('lightning-button')]);
    expect(result.errors).toEqual([]);
    expect(result.files.html).toContain('<template>');
    expect(result.files.html).toContain('<lightning-button');
    expect(result.files.html).toContain('</template>');
    expect(result.files.js).toContain('import { LightningElement } from "lwc";');
    expect(result.files.js).toContain(
      'export default class LightningCraftComponent extends LightningElement {}'
    );
    expect(result.files.metaXml).toContain('apiVersion');
    expect(result.files.metaXml).toContain('62.0');
  });

  it('preserves Salesforce slots for a card with nested children', () => {
    const card = createBuilderNode('lightning-card');
    const button = createBuilderNode('lightning-button');
    card.slots.default = [button];
    const result = bundle([card]);
    expect(result.errors).toEqual([]);
    expect(result.files.html).toContain('<lightning-card');
    expect(result.files.html).toContain('<lightning-button');
    expect(result.files.html).toContain('</lightning-card>');
    expect(result.files.html).not.toContain('lcKey');
    expect(result.files.js).not.toContain(card.id);
    expect(result.files.js).not.toContain(button.id);
  });

  it('exports datatable columns and rowActions without sample rows or lcKey', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes.columns = [
      { lcKey: 'col-secret', label: 'Name', fieldName: 'Name', type: 'text' },
      {
        lcKey: 'act-secret',
        label: 'Actions',
        fieldName: 'unused',
        type: 'action',
        typeAttributes: {
          rowActions: [
            { lcKey: 'ra-secret', label: 'Show details', name: 'show_details' },
            { label: 'Delete', name: 'delete' },
          ],
        },
      },
    ];
    const result = bundle([node]);
    expect(result.errors).toEqual([]);
    expect(result.files.html).toContain('<template>');
    expect(result.files.html).toContain('data={data}');
    expect(result.files.html).toContain('columns={columns}');
    expect(result.files.js).toContain('data = [];');
    expect(result.files.js).toContain('columns = [');
    expect(result.files.js).toContain('label: "Name"');
    expect(result.files.js).toContain('fieldName: "Name"');
    expect(result.files.js).toContain('type: "action"');
    expect(result.files.js).toContain('rowActions');
    expect(result.files.js).toContain('show_details');
    expect(result.files.js).not.toContain('lcKey');
    expect(result.files.js).not.toContain('col-secret');
    expect(result.files.js).not.toContain('Sample 1');
    expect(result.files.js).not.toContain('sample1@example.com');
    expect(result.files.html).not.toContain('lcKey');
    expect(JSON.stringify(defaultDatatableRowActions())).toContain('Show details');
  });

  it('uniquifies columns identifiers for two datatables with different columns', () => {
    const first = createBuilderNode('lightning-datatable');
    const second = createBuilderNode('lightning-datatable');
    second.attributes.columns = [
      { label: 'Account', fieldName: 'AccountName', type: 'text' },
    ];
    const result = bundle([first, second]);
    expect(result.errors).toEqual([]);
    expect(result.files.html).toContain('columns={columns}');
    expect(result.files.html).toContain('columns={columns2}');
    expect(result.files.js).toContain('columns = [');
    expect(result.files.js).toContain('columns2 = [');
    expect(result.files.js).toContain('AccountName');
    const html = generateLwcHtml([first, second]).html;
    expect(html).toContain('columns={columns}');
    expect(html).toContain('columns={columns2}');
  });

  it('errors when the user reuses one identifier for different values', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes['selected-rows'] = 'shared';
    node.attributes.errors = 'shared';
    const result = bundle([node]);
    expect(result.errors.some((error) => error.message.includes('shared'))).toBe(true);
  });

  it('reuses the same identifier when the serialized value matches', () => {
    const first = createBuilderNode('lightning-datatable');
    const second = createBuilderNode('lightning-datatable');
    const result = bundle([first, second]);
    expect(result.errors).toEqual([]);
    expect(result.files.html.match(/data=\{data\}/g)?.length).toBe(2);
    expect(result.files.js.match(/data = \[\];/g)?.length).toBe(1);
  });

  it('rejects an invalid component name before generating files', () => {
    const result = bundle([createBuilderNode('lightning-button')], {
      ...DEFAULT_LWC_EXPORT_SETTINGS,
      componentName: 'My-Component',
    });
    expect(result.errors.some((error) => error.message.includes('Invalid LWC component name'))).toBe(
      true
    );
    expect(result.files.html).toBe('');
    expect(result.files.js).toBe('');
  });

  it('rejects reserved JavaScript identifiers for event handlers', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes.onsort = 'class';
    const result = bundle([node]);
    expect(result.errors.some((error) => error.message.includes('class'))).toBe(true);
    expect(result.files.html).not.toContain('onsort={class}');
    expect(result.files.js).not.toContain('class(event)');
  });

  it('emits matching HTML bindings and JS methods for event handlers', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes.onsort = 'handleSort';
    node.attributes.onrowaction = 'handleRowAction';
    const result = bundle([node]);
    expect(result.errors).toEqual([]);
    expect(result.files.html).toContain('onsort={handleSort}');
    expect(result.files.html).toContain('onrowaction={handleRowAction}');
    expect(result.files.js).toContain('handleSort(event) {}');
    expect(result.files.js).toContain('handleRowAction(event) {}');
  });

  it('emits combobox options as a JS binding with a warning when options are unstructured', () => {
    const node = createBuilderNode('lightning-combobox');
    const result = bundle([node]);
    expect(result.files.html).toContain('options={options}');
    expect(result.files.js).toContain('options = [];');
    expect(result.warnings.some((warning) => warning.message.includes('options'))).toBe(true);
    expect(result.files.js).not.toContain('label: "Option');
  });

  it('strips LightningCraft-only keys from structured values', () => {
    const stripped = stripInternalFields({
      lcKey: 'secret',
      label: 'Name',
      nested: { lcKey: 'also', fieldName: 'Name' },
    });
    expect(stripped).toEqual({ label: 'Name', nested: { fieldName: 'Name' } });
  });

  it('fails leak validation if generated files contain lcKey', () => {
    const result = bundle([createBuilderNode('lightning-datatable')]);
    expect(result.files.js).not.toMatch(/lcKey/);
    expect(result.files.html).not.toMatch(/lcKey/);
    expect(result.files.metaXml).not.toMatch(/lcKey/);
    expect(result.files.js).not.toMatch(/dnd-kit/i);
    expect(result.files.js).not.toMatch(/lucide/i);
  });

  it('generates valid js-meta.xml from export settings', () => {
    const xml = generateLwcMetaXml(DEFAULT_LWC_EXPORT_SETTINGS);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns="http://soap.sforce.com/2006/04/metadata"');
    expect(xml).toContain('<apiVersion>62.0</apiVersion>');
    expect(xml).toContain('<isExposed>true</isExposed>');
    expect(xml).toContain('<target>lightning__AppPage</target>');
    expect(xml).toContain('<target>lightning__HomePage</target>');
    expect(xml).toContain('<target>lightning__RecordPage</target>');
    const escaped = generateLwcMetaXml({
      ...DEFAULT_LWC_EXPORT_SETTINGS,
      description: 'A & B <C>',
    });
    expect(escaped).toContain('A &amp; B &lt;C&gt;');
  });

  it('skips unknown component types without emitting invalid Salesforce markup', () => {
    // Unknown nodes have no ComponentDefinition. generateLwcBundle must:
    // 1. return a GenerationError that names the unknown type
    // 2. omit any Salesforce tag for that type
    // 3. omit LightningCraft internals from that node (id, lcKey, etc.)
    // 4. not throw
    // 5. still generate a valid bundle for remaining known components
    const unknown: BuilderNode = {
      id: 'node-unknown-export-id',
      type: 'lightning-not-registered',
      attributes: {
        lcKey: 'lc-internal-key',
        displayName: 'InternalOnly',
      },
      slots: {},
    };
    const result = bundle([unknown, createBuilderNode('lightning-badge')]);

    const unknownError = result.errors.find(
      (error) => error.componentType === 'lightning-not-registered'
    );
    expect(unknownError).toBeDefined();
    expect(unknownError?.nodeId).toBe('node-unknown-export-id');
    expect(unknownError?.message).toContain('lightning-not-registered');
    expect(unknownError?.message).toContain('No ComponentDefinition');

    expect(result.files.html).not.toContain('<lightning-not-registered');
    expect(result.files.html).not.toContain('lightning-not-registered');
    expect(result.files.js).not.toContain('lightning-not-registered');
    expect(result.files.html).toContain('lightning-badge');
    expect(result.files.html).toContain('<template>');
    expect(result.files.js).toContain('LightningElement');

    expect(result.files.html).not.toContain('node-unknown-export-id');
    expect(result.files.js).not.toContain('node-unknown-export-id');
    expect(result.files.html).not.toContain('lc-internal-key');
    expect(result.files.js).not.toContain('lc-internal-key');
    expect(result.files.html).not.toContain('lcKey');
    expect(result.files.js).not.toContain('lcKey');
    expect(result.files.html).not.toContain('InternalOnly');
    expect(result.files.js).not.toContain('InternalOnly');
  });

  it('still writes a JavaScript file when the canvas has no JS bindings', () => {
    const result = bundle([createBuilderNode('lightning-icon')]);
    expect(result.errors).toEqual([]);
    expect(result.files.js).toContain('import { LightningElement } from "lwc";');
    expect(result.files.js).toContain('extends LightningElement {}');
    expect(result.files.html).toContain('<template>');
    expect(result.files.metaXml).toContain('LightningComponentBundle');
  });
});

describe('collectJsPlan', () => {
  it('records a single handler when two events share a name', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes.onsort = 'handleShared';
    node.attributes.onresize = 'handleShared';
    const plan = collectJsPlan([node]);
    expect(plan.handlers).toEqual([{ name: 'handleShared' }]);
    expect(plan.assignments.filter((item) => item.identifier === 'handleShared')).toHaveLength(2);
  });
});
