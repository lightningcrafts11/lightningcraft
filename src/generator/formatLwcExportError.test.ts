import { describe, expect, it } from 'vitest';
import { formatLwcExportError } from './formatLwcExportError';

describe('formatLwcExportError', () => {
  it('maps generator failures to LWC-developer export messages', () => {
    expect(
      formatLwcExportError({
        nodeId: '',
        componentType: '',
        message: 'The canvas is empty. Add at least one component before generating an LWC bundle.',
      })
    ).toBe('Add at least one component to the canvas before exporting an LWC.');

    expect(
      formatLwcExportError({
        nodeId: '',
        componentType: '',
        message: 'Invalid LWC component name "MyComponent". Names must start with a lowercase letter.',
      })
    ).toBe('Cannot export component: invalid component name.');

    expect(
      formatLwcExportError({
        nodeId: 'n1',
        componentType: 'foo',
        message: 'No ComponentDefinition is registered for type "foo".',
      })
    ).toBe("Cannot export component: unknown component type 'foo'.");

    expect(
      formatLwcExportError({
        nodeId: 'n2',
        componentType: 'lightning-datatable',
        message: 'Event handler "class" on "onsort" is not a valid JavaScript identifier.',
      })
    ).toBe("Cannot export component: JavaScript identifier 'class' is reserved.");
  });
});
