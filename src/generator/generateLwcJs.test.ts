import { describe, expect, it } from 'vitest';
import { generateLwcJs } from '@/generator';
import type { LwcBundlePlan } from '@/types/lwcExport';
import { DEFAULT_LWC_CLASS_EXTENDS } from '@/types/lwcExport';

function plan(overrides: Partial<LwcBundlePlan>): LwcBundlePlan {
  return {
    fields: [],
    handlers: [],
    imports: [],
    assignments: [],
    errors: [],
    warnings: [],
    classExtends: DEFAULT_LWC_CLASS_EXTENDS,
    ...overrides,
  };
}

describe('generateLwcJs class inheritance', () => {
  it('emits LightningElement only because the plan says so, not as a generator default', () => {
    const js = generateLwcJs(
      plan({
        imports: [{ module: 'lwc', named: ['LightningElement'] }],
        classExtends: DEFAULT_LWC_CLASS_EXTENDS,
      }),
      'myComponent'
    );
    expect(js).toContain('import { LightningElement } from "lwc";');
    expect(js).toContain('export default class MyComponent extends LightningElement {}');
  });

  it('does not invent a LightningElement import when the plan extends another class', () => {
    const js = generateLwcJs(
      plan({
        imports: [{ module: 'lightning/modal', named: [], defaultImport: 'LightningModal' }],
        classExtends: {
          name: 'LightningModal',
          module: 'lightning/modal',
          importKind: 'default',
        },
      }),
      'myModal'
    );
    expect(js).toContain('import LightningModal from "lightning/modal";');
    expect(js).toContain('export default class MyModal extends LightningModal {}');
    expect(js).not.toContain('LightningElement');
    expect(js).not.toContain('from "lwc"');
  });

  it('merges named lwc imports such as api without hard-coding the base class', () => {
    const js = generateLwcJs(
      plan({
        fields: [{ name: 'content', role: 'api', initializer: 'none' }],
        imports: [
          { module: 'lwc', named: ['api'] },
          { module: 'lightning/modal', named: [], defaultImport: 'LightningModal' },
        ],
        classExtends: {
          name: 'LightningModal',
          module: 'lightning/modal',
          importKind: 'default',
        },
      }),
      'myModal'
    );
    expect(js).toContain('import { api } from "lwc";');
    expect(js).toContain('import LightningModal from "lightning/modal";');
    expect(js).toContain('@api content;');
    expect(js).toContain('extends LightningModal {');
    expect(js).not.toContain('LightningElement');
  });

  it('renders extra plan imports generically for future component JS requirements', () => {
    const js = generateLwcJs(
      plan({
        imports: [
          { module: 'lwc', named: ['LightningElement'] },
          { module: 'lightning/navigation', named: ['NavigationMixin'] },
        ],
      }),
      'myComponent'
    );
    expect(js).toContain('import { LightningElement } from "lwc";');
    expect(js).toContain('import { NavigationMixin } from "lightning/navigation";');
    expect(js).toContain('extends LightningElement {}');
  });

  it('does not inject LightningElement when the plan has no imports', () => {
    const js = generateLwcJs(
      plan({
        imports: [],
        classExtends: {
          name: 'LightningModal',
          module: 'lightning/modal',
          importKind: 'default',
        },
      }),
      'myModal'
    );
    expect(js).not.toContain('LightningElement');
    expect(js).not.toContain('import ');
    expect(js).toContain('export default class MyModal extends LightningModal {}');
  });
});
