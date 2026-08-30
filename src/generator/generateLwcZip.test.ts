import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { createBuilderNode } from '@/metadata';
import { generateLwcBundle, generateLwcZip, lwcZipEntryPaths } from '@/generator';
import { DEFAULT_LWC_EXPORT_SETTINGS } from '@/types/lwcExport';
import type { BuilderNode } from '@/types/builder';

async function unzipFiles(blob: Blob): Promise<Map<string, string>> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const files = new Map<string, string>();
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    files.set(name, await entry.async('string'));
  }
  return files;
}

describe('generateLwcZip', () => {
  it('packages a successful bundle as a three-file LWC folder ZIP', async () => {
    const settings = {
      ...DEFAULT_LWC_EXPORT_SETTINGS,
      componentName: 'myComponent',
    };
    const bundle = generateLwcBundle([createBuilderNode('lightning-button')], settings);
    expect(bundle.errors).toEqual([]);

    const zip = await generateLwcZip(bundle, settings.componentName);
    expect(zip.ok).toBe(true);
    if (!zip.ok) return;

    const expected = lwcZipEntryPaths('myComponent');
    expect(zip.zipFileName).toBe('myComponent.zip');
    expect(zip.paths).toEqual([expected.html, expected.js, expected.metaXml]);

    const files = await unzipFiles(zip.blob);
    expect([...files.keys()].sort()).toEqual(
      [expected.html, expected.js, expected.metaXml].sort()
    );
    expect(files.get(expected.html)).toBe(bundle.files.html);
    expect(files.get(expected.js)).toBe(bundle.files.js);
    expect(files.get(expected.metaXml)).toBe(bundle.files.metaXml);
  });

  it('uses the component name for the folder, files, and ZIP filename', async () => {
    const settings = {
      ...DEFAULT_LWC_EXPORT_SETTINGS,
      componentName: 'another_component',
    };
    const bundle = generateLwcBundle([createBuilderNode('lightning-badge')], settings);
    const zip = await generateLwcZip(bundle, settings.componentName);
    expect(zip.ok).toBe(true);
    if (!zip.ok) return;

    expect(zip.zipFileName).toBe('another_component.zip');
    expect(zip.paths).toEqual([
      'another_component/another_component.html',
      'another_component/another_component.js',
      'another_component/another_component.js-meta.xml',
    ]);

    const files = await unzipFiles(zip.blob);
    expect(files.has('another_component/another_component.html')).toBe(true);
    expect(files.has('another_component/another_component.js')).toBe(true);
    expect(files.has('another_component/another_component.js-meta.xml')).toBe(true);
    expect(files.size).toBe(3);
  });

  it('does not create a ZIP when the bundle has errors', async () => {
    const empty = generateLwcBundle([]);
    expect(empty.errors.length).toBeGreaterThan(0);

    const zip = await generateLwcZip(empty, 'lightningCraftComponent');
    expect(zip.ok).toBe(false);
    if (zip.ok) return;
    expect(zip.errors).toEqual(empty.errors);
    expect('blob' in zip).toBe(false);
  });

  it('does not create a ZIP when the canvas contains an unknown component type', async () => {
    const unknown: BuilderNode = {
      id: 'node-unknown-zip',
      type: 'lightning-not-registered',
      attributes: {},
      slots: {},
    };
    const bundle = generateLwcBundle([unknown, createBuilderNode('lightning-badge')]);
    expect(bundle.errors.some((error) => error.componentType === 'lightning-not-registered')).toBe(
      true
    );

    const zip = await generateLwcZip(bundle, DEFAULT_LWC_EXPORT_SETTINGS.componentName);
    expect(zip.ok).toBe(false);
  });

  it('does not leak LightningCraft internals into ZIP file contents', async () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes.columns = [
      { lcKey: 'col-secret', label: 'Name', fieldName: 'Name', type: 'text' },
    ];
    const bundle = generateLwcBundle([node]);
    expect(bundle.errors).toEqual([]);

    const zip = await generateLwcZip(bundle, DEFAULT_LWC_EXPORT_SETTINGS.componentName);
    expect(zip.ok).toBe(true);
    if (!zip.ok) return;

    const files = await unzipFiles(zip.blob);
    const combined = [...files.values()].join('\n');
    expect(combined).not.toContain('lcKey');
    expect(combined).not.toContain('col-secret');
    expect(combined).not.toContain(node.id);
    expect(combined).not.toContain('dnd-kit');
    expect(combined).not.toContain('lucide');
    expect(combined).not.toContain('sampleRows');
  });
});
